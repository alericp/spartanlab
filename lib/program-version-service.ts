// Program Version Service
// Manages program versioning and regeneration integrity
// Ensures training continuity when programs update

import { neon } from '@neondatabase/serverless'
import type { UnifiedEngineContext } from './unified-coaching-engine'
import { createProgramVersionOnSettingsChange, createProgramVersion as createHistoryVersion } from './program-history-versioning'
import type { AdaptiveProgram } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export type ProgramVersionStatus = 'active' | 'archived' | 'superseded' | 'pending'

export type GenerationReason =
  | 'onboarding_initial_generation'
  | 'settings_schedule_change'
  | 'settings_equipment_change'
  | 'settings_goal_change'
  | 'settings_style_change'
  | 'fatigue_deload'
  | 'skill_priority_update'
  | 'benchmark_update'
  | 'adaptive_rebalance'
  | 'manual_regeneration'
  | 'injury_status_change'
  | 'framework_update'

export interface ProgramVersion {
  id: string
  athleteId: string
  versionNumber: number
  status: ProgramVersionStatus
  createdAt: string
  supersededAt: string | null
  generationReason: GenerationReason
  sourceSnapshotId: string | null
  
  // Program summary
  programSummary: ProgramSummary
  
  // Active flag (only one should be true per athlete)
  activeFlag: boolean
}

export interface ProgramSummary {
  primaryGoal: string
  trainingDaysPerWeek: number
  sessionDurationMinutes: number
  styleMode: string
  constraintFocus: string | null
  equipment: string[]
  generatedAt: string
}

export interface ProgramInputSnapshot {
  id: string
  athleteId: string
  
  // Profile snapshot
  athleteProfileSnapshot: {
    primaryGoal: string
    secondaryGoals: string[]
    trainingDaysPerWeek: number
    sessionDurationMinutes: number
    equipment: string[]
    jointCautions: string[]
    trainingAge: number
    bodyWeight: number | null
  }
  
  // Skill state snapshot
  skillStateSnapshot: {
    skills: Array<{
      skill: string
      currentLevel: string
      readinessScore: number
      limitingFactor: string | null
    }>
  }
  
  // Readiness snapshot
  readinessSnapshot: {
    overallReadiness: number
    pullStrengthScore: number
    pushStrengthScore: number
    compressionScore: number
    scapularControlScore: number
    shoulderStabilityScore: number
    mobilityScore: number
  } | null
  
  // Constraint snapshot
  constraintSnapshot: {
    primaryConstraint: string | null
    secondaryConstraint: string | null
    strongQualities: string[]
  }
  
  // Fatigue snapshot
  fatigueSnapshot: {
    fatigueLevel: string
    recoveryScore: number
    requiresDeload: boolean
  }
  
  // Style snapshot
  styleSnapshot: {
    styleMode: string
    priorities: {
      skill: number
      strength: number
      power: number
      endurance: number
      hypertrophy: number
    }
  }
  
  // Framework snapshot
  frameworkSnapshot: {
    frameworkId: string
    frameworkName: string
    confidenceScore: number
    selectionReason: string
  } | null
  
  createdAt: string
}

export interface RegenerationTrigger {
  shouldRegenerate: boolean
  reason: GenerationReason | null
  explanation: string
  changedFields: string[]
  isStructuralChange: boolean  // true = new version, false = session adaptation only
}

// =============================================================================
// CONSTANTS
// =============================================================================

const GENERATION_REASON_LABELS: Record<GenerationReason, string> = {
  onboarding_initial_generation: 'Initial program created during onboarding',
  settings_schedule_change: 'Program updated for your new schedule',
  settings_equipment_change: 'Program adjusted for your equipment changes',
  settings_goal_change: 'Program refocused on your new primary goal',
  settings_style_change: 'Training approach updated to match your preferences',
  fatigue_deload: 'Recovery-focused version created to support progress',
  skill_priority_update: 'Skill focus adjusted based on your progress',
  benchmark_update: 'Program calibrated to your updated strength levels',
  adaptive_rebalance: 'Program rebalanced based on your training response',
  manual_regeneration: 'Program regenerated at your request',
  injury_status_change: 'Program adjusted for your injury status',
  framework_update: 'Training methodology updated based on your progress',
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

function getDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL not set')
  }
  return neon(connectionString)
}

/**
 * Get active program version for an athlete
 */
export async function getActiveProgramVersion(
  athleteId: string
): Promise<ProgramVersion | null> {
  const sql = getDb()
  
  try {
    // Support both athlete_id (new) and user_id (legacy) column names
    const result = await sql`
      SELECT 
        id,
        COALESCE(athlete_id, user_id) as "athleteId",
        version_number as "versionNumber",
        status,
        created_at as "createdAt",
        superseded_at as "supersededAt",
        generation_reason as "generationReason",
        source_snapshot_id as "sourceSnapshotId",
        COALESCE(program_summary, '{}'::jsonb) as "programSummary",
        COALESCE(active_flag, status = 'active') as "activeFlag"
      FROM program_versions
      WHERE COALESCE(athlete_id, user_id) = ${athleteId}
        AND (active_flag = true OR status = 'active')
      LIMIT 1
    `
    
    if (result.length === 0) return null
    return result[0] as ProgramVersion
  } catch {
    // Table might not exist yet
    return null
  }
}

/**
 * Get all program versions for an athlete (for history)
 */
export async function getProgramVersionHistory(
  athleteId: string,
  limit: number = 10
): Promise<ProgramVersion[]> {
  const sql = getDb()
  
  try {
    const result = await sql`
      SELECT 
        id,
        COALESCE(athlete_id, user_id) as "athleteId",
        version_number as "versionNumber",
        status,
        created_at as "createdAt",
        superseded_at as "supersededAt",
        generation_reason as "generationReason",
        source_snapshot_id as "sourceSnapshotId",
        COALESCE(program_summary, '{}'::jsonb) as "programSummary",
        COALESCE(active_flag, status = 'active') as "activeFlag"
      FROM program_versions
      WHERE COALESCE(athlete_id, user_id) = ${athleteId}
      ORDER BY version_number DESC
      LIMIT ${limit}
    `
    
    return result as ProgramVersion[]
  } catch {
    return []
  }
}

/**
 * Get the next version number for an athlete
 */
async function getNextVersionNumber(athleteId: string): Promise<number> {
  const sql = getDb()
  
  try {
    const result = await sql`
      SELECT COALESCE(MAX(version_number), 0) + 1 as "nextVersion"
      FROM program_versions
      WHERE athlete_id = ${athleteId}
    `
    return result[0]?.nextVersion || 1
  } catch {
    return 1
  }
}

/**
 * Create a new program version
 */
export async function createProgramVersion(
  athleteId: string,
  reason: GenerationReason,
  summary: ProgramSummary,
  snapshotId?: string
): Promise<ProgramVersion> {
  const sql = getDb()
  
  const versionNumber = await getNextVersionNumber(athleteId)
  
  // First, archive any existing active versions
  await sql`
    UPDATE program_versions
    SET 
      active_flag = false,
      status = 'superseded',
      superseded_at = NOW()
    WHERE athlete_id = ${athleteId}
      AND active_flag = true
  `
  
  // Create the new version
  const result = await sql`
    INSERT INTO program_versions (
      athlete_id,
      version_number,
      status,
      generation_reason,
      source_snapshot_id,
      program_summary,
      active_flag
    ) VALUES (
      ${athleteId},
      ${versionNumber},
      'active',
      ${reason},
      ${snapshotId || null},
      ${JSON.stringify(summary)},
      true
    )
    RETURNING
      id,
      athlete_id as "athleteId",
      version_number as "versionNumber",
      status,
      created_at as "createdAt",
      superseded_at as "supersededAt",
      generation_reason as "generationReason",
      source_snapshot_id as "sourceSnapshotId",
      program_summary as "programSummary",
      active_flag as "activeFlag"
  `
  
  return result[0] as ProgramVersion
}

/**
 * Create an input snapshot
 */
export async function createInputSnapshot(
  athleteId: string,
  context: UnifiedEngineContext
): Promise<string> {
  const sql = getDb()
  
  const snapshot: Omit<ProgramInputSnapshot, 'id' | 'createdAt'> = {
    athleteId,
    athleteProfileSnapshot: {
      primaryGoal: context.athlete.primaryGoal,
      secondaryGoals: context.athlete.secondaryGoals,
      trainingDaysPerWeek: context.athlete.trainingDaysPerWeek,
      sessionDurationMinutes: context.athlete.sessionDurationMinutes,
      equipment: context.athlete.equipment,
      jointCautions: context.athlete.jointCautions,
      trainingAge: context.athlete.trainingAge,
      bodyWeight: context.athlete.weightKg,
    },
    skillStateSnapshot: {
      skills: context.skills.states.map(s => ({
        skill: s.skill,
        currentLevel: s.currentLevel,
        readinessScore: s.readinessScore || 50,
        limitingFactor: s.limitingFactor,
      })),
    },
    readinessSnapshot: context.skills.readinessBreakdown
      ? {
          overallReadiness: context.skills.readinessBreakdown.overallScore,
          pullStrengthScore: context.skills.readinessBreakdown.pullStrengthScore,
          pushStrengthScore: context.skills.readinessBreakdown.pushStrengthScore,
          compressionScore: context.skills.readinessBreakdown.compressionScore,
          scapularControlScore: context.skills.readinessBreakdown.scapularControlScore,
          shoulderStabilityScore: context.skills.readinessBreakdown.shoulderStabilityScore,
          mobilityScore: context.skills.readinessBreakdown.mobilityScore,
        }
      : null,
    constraintSnapshot: {
      primaryConstraint: context.constraints.primaryConstraint || null,
      secondaryConstraint: context.constraints.secondaryConstraint || null,
      strongQualities: context.constraints.strongQualities || [],
    },
    fatigueSnapshot: {
      fatigueLevel: context.fatigue.fatigueLevel,
      recoveryScore: context.fatigue.recoveryScore,
      requiresDeload: context.fatigue.requiresDeload,
    },
    styleSnapshot: {
      styleMode: context.athlete.trainingStyle,
      priorities: context.athlete.stylePriorities,
    },
  }
  
  const result = await sql`
    INSERT INTO program_input_snapshots (
      athlete_id,
      athlete_profile_snapshot,
      skill_state_snapshot,
      readiness_snapshot,
      constraint_snapshot,
      fatigue_snapshot,
      style_snapshot
    ) VALUES (
      ${athleteId},
      ${JSON.stringify(snapshot.athleteProfileSnapshot)},
      ${JSON.stringify(snapshot.skillStateSnapshot)},
      ${JSON.stringify(snapshot.readinessSnapshot)},
      ${JSON.stringify(snapshot.constraintSnapshot)},
      ${JSON.stringify(snapshot.fatigueSnapshot)},
      ${JSON.stringify(snapshot.styleSnapshot)}
    )
    RETURNING id
  `
  
  return result[0].id
}

/**
 * Get input snapshot by ID
 */
export async function getInputSnapshot(
  snapshotId: string
): Promise<ProgramInputSnapshot | null> {
  const sql = getDb()
  
  try {
    const result = await sql`
      SELECT 
        id,
        athlete_id as "athleteId",
        athlete_profile_snapshot as "athleteProfileSnapshot",
        skill_state_snapshot as "skillStateSnapshot",
        readiness_snapshot as "readinessSnapshot",
        constraint_snapshot as "constraintSnapshot",
        fatigue_snapshot as "fatigueSnapshot",
        style_snapshot as "styleSnapshot",
        created_at as "createdAt"
      FROM program_input_snapshots
      WHERE id = ${snapshotId}
      LIMIT 1
    `
    
    if (result.length === 0) return null
    return result[0] as ProgramInputSnapshot
  } catch {
    return null
  }
}

// =============================================================================
// REGENERATION TRIGGER DETECTION
// =============================================================================

/**
 * Check if settings changes should trigger program regeneration
 */
export function checkRegenerationTriggers(
  oldSnapshot: ProgramInputSnapshot | null,
  newContext: UnifiedEngineContext
): RegenerationTrigger {
  // No previous snapshot = first generation
  if (!oldSnapshot) {
    return {
      shouldRegenerate: true,
      reason: 'onboarding_initial_generation',
      explanation: 'Creating your first training program.',
      changedFields: [],
      isStructuralChange: true,
    }
  }
  
  const changedFields: string[] = []
  let reason: GenerationReason | null = null
  let isStructuralChange = false
  
  const oldProfile = oldSnapshot.athleteProfileSnapshot
  const newProfile = {
    primaryGoal: newContext.athlete.primaryGoal,
    trainingDaysPerWeek: newContext.athlete.trainingDaysPerWeek,
    sessionDurationMinutes: newContext.athlete.sessionDurationMinutes,
    equipment: newContext.athlete.equipment,
    jointCautions: newContext.athlete.jointCautions,
  }
  
  // Check for structural changes that require new version
  
  // Training days changed
  if (oldProfile.trainingDaysPerWeek !== newProfile.trainingDaysPerWeek) {
    changedFields.push('trainingDaysPerWeek')
    reason = 'settings_schedule_change'
    isStructuralChange = true
  }
  
  // Session duration changed significantly (more than 10 minutes)
  if (Math.abs(oldProfile.sessionDurationMinutes - newProfile.sessionDurationMinutes) > 10) {
    changedFields.push('sessionDurationMinutes')
    if (!reason) reason = 'settings_schedule_change'
    isStructuralChange = true
  }
  
  // Primary goal changed
  if (oldProfile.primaryGoal !== newProfile.primaryGoal) {
    changedFields.push('primaryGoal')
    reason = 'settings_goal_change'
    isStructuralChange = true
  }
  
  // Equipment changed significantly
  const oldEquipment = new Set(oldProfile.equipment)
  const newEquipment = new Set(newProfile.equipment)
  const equipmentAdded = [...newEquipment].filter(e => !oldEquipment.has(e))
  const equipmentRemoved = [...oldEquipment].filter(e => !newEquipment.has(e))
  if (equipmentAdded.length > 0 || equipmentRemoved.length > 0) {
    changedFields.push('equipment')
    if (!reason) reason = 'settings_equipment_change'
    // Only structural if major equipment (bars, rings) changed
    const majorEquipment = ['pull_bar', 'dip_bars', 'rings', 'weight_belt']
    const majorChange = [...equipmentAdded, ...equipmentRemoved].some(e => 
      majorEquipment.includes(e)
    )
    if (majorChange) isStructuralChange = true
  }
  
  // Injury status changed
  const oldCautions = new Set(oldProfile.jointCautions)
  const newCautions = new Set(newProfile.jointCautions)
  const cautionsAdded = [...newCautions].filter(c => !oldCautions.has(c))
  const cautionsRemoved = [...oldCautions].filter(c => !newCautions.has(c))
  if (cautionsAdded.length > 0 || cautionsRemoved.length > 0) {
    changedFields.push('jointCautions')
    if (!reason) reason = 'injury_status_change'
    isStructuralChange = true
  }
  
  // Style changed
  const oldStyle = oldSnapshot.styleSnapshot.styleMode
  const newStyle = newContext.athlete.trainingStyle
  if (oldStyle !== newStyle) {
    changedFields.push('trainingStyle')
    if (!reason) reason = 'settings_style_change'
    isStructuralChange = true
  }
  
  // Fatigue-triggered deload
  if (newContext.fatigue.requiresDeload && !oldSnapshot.fatigueSnapshot.requiresDeload) {
    changedFields.push('fatigueState')
    if (!reason) reason = 'fatigue_deload'
    isStructuralChange = true
  }
  
  // Build explanation
  let explanation = ''
  if (reason) {
    explanation = GENERATION_REASON_LABELS[reason]
  }
  
  return {
    shouldRegenerate: isStructuralChange && changedFields.length > 0,
    reason: isStructuralChange ? reason : null,
    explanation,
    changedFields,
    isStructuralChange,
  }
}

/**
 * Check if a change is session-level (doesn't need new version) vs structural
 */
export function isSessionLevelChange(changes: string[]): boolean {
  // These changes can be handled at session level without new version
  const sessionLevelChanges = [
    'singleExerciseSkip',
    'singleSessionOverride',
    'minorTimeAdjustment',
    'singleProgressionChange',
  ]
  
  return changes.every(c => sessionLevelChanges.includes(c))
}

// =============================================================================
// VERSION MANAGEMENT
// =============================================================================

/**
 * Create initial program version on onboarding completion
 */
export async function createInitialProgramVersion(
  athleteId: string,
  context: UnifiedEngineContext
): Promise<ProgramVersion> {
  // Create input snapshot
  const snapshotId = await createInputSnapshot(athleteId, context)
  
  // Create version
  const summary: ProgramSummary = {
    primaryGoal: context.athlete.primaryGoal,
    trainingDaysPerWeek: context.athlete.trainingDaysPerWeek,
    sessionDurationMinutes: context.athlete.sessionDurationMinutes,
    styleMode: context.athlete.trainingStyle,
    constraintFocus: context.constraints.primaryConstraint || null,
    equipment: context.athlete.equipment,
    generatedAt: new Date().toISOString(),
  }
  
  return createProgramVersion(
    athleteId,
    'onboarding_initial_generation',
    summary,
    snapshotId
  )
}

/**
 * Regenerate program with new version if needed
 */
export async function regenerateProgramIfNeeded(
  athleteId: string,
  context: UnifiedEngineContext,
  manualReason?: GenerationReason
): Promise<{
  regenerated: boolean
  version: ProgramVersion | null
  explanation: string
}> {
  // Get current active version
  const currentVersion = await getActiveProgramVersion(athleteId)
  
  // Get the snapshot from current version
  const oldSnapshot = currentVersion?.sourceSnapshotId
    ? await getInputSnapshot(currentVersion.sourceSnapshotId)
    : null
  
  // Check if regeneration is needed
  const trigger = manualReason
    ? { shouldRegenerate: true, reason: manualReason, explanation: GENERATION_REASON_LABELS[manualReason], changedFields: [], isStructuralChange: true }
    : checkRegenerationTriggers(oldSnapshot, context)
  
  if (!trigger.shouldRegenerate || !trigger.reason) {
    return {
      regenerated: false,
      version: currentVersion,
      explanation: 'No structural changes detected. Current program remains active.',
    }
  }
  
  // Create new snapshot
  const snapshotId = await createInputSnapshot(athleteId, context)
  
  // Create new version
  const summary: ProgramSummary = {
    primaryGoal: context.athlete.primaryGoal,
    trainingDaysPerWeek: context.athlete.trainingDaysPerWeek,
    sessionDurationMinutes: context.athlete.sessionDurationMinutes,
    styleMode: context.athlete.trainingStyle,
    constraintFocus: context.constraints.primaryConstraint || null,
    equipment: context.athlete.equipment,
    generatedAt: new Date().toISOString(),
  }
  
  const newVersion = await createProgramVersion(
    athleteId,
    trigger.reason,
    summary,
    snapshotId
  )
  
  // Also create an entry in the program_history table for durable history
  // Build a minimal program-like object for the history versioning system
  const programForHistory: Partial<AdaptiveProgram> = {
    primaryGoal: context.athlete.primaryGoal,
    goalLabel: summary.primaryGoal,
    trainingDaysPerWeek: context.athlete.trainingDaysPerWeek,
    sessionLengthMinutes: context.athlete.sessionDurationMinutes,
    sessionLength: context.athlete.sessionDurationMinutes,
    equipment: context.athlete.equipment,
    styleMode: context.athlete.trainingStyle,
    constraintFocus: context.constraints.primaryConstraint,
    primaryConstraint: context.constraints.primaryConstraint,
    experienceLevel: 'intermediate',
    sessions: [],
  }
  
  try {
    await createHistoryVersion({
      userId: athleteId,
      program: programForHistory as AdaptiveProgram,
      generationReason: trigger.reason,
    })
  } catch (historyError) {
    // Log but don't fail - the primary version table is updated
    console.error('[ProgramVersionService] Failed to create history entry:', historyError)
  }
  
  return {
    regenerated: true,
    version: newVersion,
    explanation: trigger.explanation,
  }
}

// =============================================================================
// COACHING EXPLANATION HELPERS
// =============================================================================

/**
 * Get user-friendly explanation for a generation reason
 */
export function getRegenerationExplanation(reason: GenerationReason): string {
  return GENERATION_REASON_LABELS[reason] || 'Your program was updated.'
}

/**
 * Get short coaching message for version change
 */
export function getVersionChangeMessage(
  oldVersion: ProgramVersion | null,
  newVersion: ProgramVersion
): string {
  if (!oldVersion) {
    return 'Your training program has been created.'
  }
  
  const reason = newVersion.generationReason
  
  switch (reason) {
    case 'settings_schedule_change':
      return `Your program was updated for ${newVersion.programSummary.trainingDaysPerWeek} training days per week.`
    case 'settings_equipment_change':
      return 'Your program was adjusted for your updated equipment.'
    case 'settings_goal_change':
      return `Your program now focuses on ${newVersion.programSummary.primaryGoal.replace(/_/g, ' ')}.`
    case 'settings_style_change':
      return 'Your training approach has been updated.'
    case 'fatigue_deload':
      return 'A recovery-focused program was created to support your progress.'
    case 'injury_status_change':
      return 'Your program was adjusted for your injury status.'
    default:
      return getRegenerationExplanation(reason)
  }
}

/**
 * Compare two versions for display
 */
export function compareVersions(
  oldVersion: ProgramVersion,
  newVersion: ProgramVersion
): {
  changes: Array<{ field: string; old: string; new: string }>
  summary: string
} {
  const changes: Array<{ field: string; old: string; new: string }> = []
  
  const oldSummary = oldVersion.programSummary
  const newSummary = newVersion.programSummary
  
  if (oldSummary.trainingDaysPerWeek !== newSummary.trainingDaysPerWeek) {
    changes.push({
      field: 'Training days',
      old: `${oldSummary.trainingDaysPerWeek} days/week`,
      new: `${newSummary.trainingDaysPerWeek} days/week`,
    })
  }
  
  if (oldSummary.primaryGoal !== newSummary.primaryGoal) {
    changes.push({
      field: 'Primary goal',
      old: oldSummary.primaryGoal.replace(/_/g, ' '),
      new: newSummary.primaryGoal.replace(/_/g, ' '),
    })
  }
  
  if (oldSummary.styleMode !== newSummary.styleMode) {
    changes.push({
      field: 'Training style',
      old: oldSummary.styleMode.replace(/_/g, ' '),
      new: newSummary.styleMode.replace(/_/g, ' '),
    })
  }
  
  if (oldSummary.constraintFocus !== newSummary.constraintFocus) {
    changes.push({
      field: 'Focus area',
      old: oldSummary.constraintFocus?.replace(/_/g, ' ') || 'balanced',
      new: newSummary.constraintFocus?.replace(/_/g, ' ') || 'balanced',
    })
  }
  
  const summary = changes.length > 0
    ? `${changes.length} change${changes.length > 1 ? 's' : ''} from v${oldVersion.versionNumber} to v${newVersion.versionNumber}`
    : 'No visible changes'
  
  return { changes, summary }
}

// =============================================================================
// VERSION INTEGRITY GUARANTEES
// =============================================================================

/**
 * Ensure only one active version exists for an athlete
 * This is a safety function to prevent duplicate active programs
 */
export async function ensureSingleActiveVersion(athleteId: string): Promise<void> {
  const sql = getDb()
  
  try {
    // Get all active versions
    const activeVersions = await sql`
      SELECT id, version_number
      FROM program_versions
      WHERE athlete_id = ${athleteId}
        AND active_flag = true
      ORDER BY version_number DESC
    `
    
    // If more than one active, deactivate all but the highest version
    if (activeVersions.length > 1) {
      const latestId = activeVersions[0].id
      
      await sql`
        UPDATE program_versions
        SET 
          active_flag = false,
          status = 'superseded',
          superseded_at = NOW()
        WHERE athlete_id = ${athleteId}
          AND active_flag = true
          AND id != ${latestId}
      `
      
      console.log(`[ProgramVersion] Cleaned up ${activeVersions.length - 1} duplicate active versions`)
    }
  } catch (error) {
    // Table might not exist or other error - log and continue
    console.error('[ProgramVersion] Error ensuring single active version:', error)
  }
}

/**
 * Get count of active versions (for debugging/validation)
 */
export async function getActiveVersionCount(athleteId: string): Promise<number> {
  const sql = getDb()
  
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM program_versions
      WHERE athlete_id = ${athleteId}
        AND active_flag = true
    `
    return parseInt(result[0]?.count || '0', 10)
  } catch {
    return 0
  }
}

// =============================================================================
// SESSION-LEVEL ADAPTATIONS (NO NEW VERSION)
// =============================================================================

export interface SessionAdaptationRecord {
  id: string
  athleteId: string
  programVersionId: string
  adaptationType: 'pacing' | 'emphasis' | 'intensity' | 'substitution'
  description: string
  appliedAt: string
  expiresAt: string | null
}

/**
 * Record a session-level adaptation (minor change that doesn't need new version)
 * These adaptations modify future session generation without creating a new version
 */
export async function recordSessionAdaptation(
  athleteId: string,
  programVersionId: string,
  adaptationType: SessionAdaptationRecord['adaptationType'],
  description: string,
  durationDays?: number
): Promise<void> {
  const sql = getDb()
  
  try {
    const expiresAt = durationDays 
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null
    
    await sql`
      INSERT INTO session_adaptations (
        athlete_id,
        program_version_id,
        adaptation_type,
        description,
        expires_at
      ) VALUES (
        ${athleteId},
        ${programVersionId},
        ${adaptationType},
        ${description},
        ${expiresAt}
      )
    `
  } catch {
    // Table might not exist - adaptations are optional enhancement
    console.log('[ProgramVersion] Session adaptations table not available')
  }
}

/**
 * Get active session adaptations for current program
 */
export async function getActiveSessionAdaptations(
  athleteId: string
): Promise<SessionAdaptationRecord[]> {
  const sql = getDb()
  
  try {
    const result = await sql`
      SELECT 
        sa.id,
        sa.athlete_id as "athleteId",
        sa.program_version_id as "programVersionId",
        sa.adaptation_type as "adaptationType",
        sa.description,
        sa.applied_at as "appliedAt",
        sa.expires_at as "expiresAt"
      FROM session_adaptations sa
      JOIN program_versions pv ON sa.program_version_id = pv.id
      WHERE sa.athlete_id = ${athleteId}
        AND pv.active_flag = true
        AND (sa.expires_at IS NULL OR sa.expires_at > NOW())
      ORDER BY sa.applied_at DESC
    `
    return result as SessionAdaptationRecord[]
  } catch {
    return []
  }
}

// =============================================================================
// CONTINUITY PRESERVATION
// =============================================================================

/**
 * Systems that should NEVER be reset during program regeneration
 */
export const PRESERVED_DATA_SYSTEMS = [
  'skill_state',           // Skill progression memory
  'skill_readiness',       // Strength/weakness tracking
  'workout_logs',          // Training history
  'fatigue_tracking',      // Recovery state
  'strength_records',      // PR tracking
  'readiness_history',     // Historical snapshots
] as const

/**
 * Validate that regeneration preserves required data
 * This is a safety check before creating new versions
 */
export function validatePreservation(): { valid: boolean; message: string } {
  // This function serves as documentation and a hook for future validation
  // Currently, our regeneration logic already preserves all required data
  // by only creating new program_versions and input_snapshots
  return {
    valid: true,
    message: 'All athlete data (SkillState, readiness, workout logs) will be preserved.',
  }
}

// =============================================================================
// FATIGUE-TRIGGERED VERSION CREATION
// =============================================================================

export interface FatigueVersionTrigger {
  shouldCreateVersion: boolean
  reason: GenerationReason | null
  severity: 'mild' | 'moderate' | 'severe'
  explanation: string
  recommendedDuration: number // days
}

/**
 * Check if fatigue state warrants a new program version
 * Only severe or persistent fatigue triggers structural changes
 */
export function checkFatigueVersionTrigger(
  currentFatigue: {
    fatigueLevel: string
    recoveryScore: number
    requiresDeload: boolean
    consecutiveHighFatigueDays?: number
    movementFamilyFatigue?: Record<string, number>
  },
  previousFatigue: {
    fatigueLevel: string
    recoveryScore: number
    requiresDeload: boolean
  } | null
): FatigueVersionTrigger {
  // No previous data = first check, don't trigger
  if (!previousFatigue) {
    return {
      shouldCreateVersion: false,
      reason: null,
      severity: 'mild',
      explanation: 'Initial fatigue baseline established.',
      recommendedDuration: 0,
    }
  }

  // Deload triggered for first time
  if (currentFatigue.requiresDeload && !previousFatigue.requiresDeload) {
    // Determine severity
    let severity: 'mild' | 'moderate' | 'severe' = 'moderate'
    let recommendedDuration = 5

    if (currentFatigue.recoveryScore < 30) {
      severity = 'severe'
      recommendedDuration = 7
    } else if (currentFatigue.recoveryScore < 50) {
      severity = 'moderate'
      recommendedDuration = 5
    } else {
      severity = 'mild'
      recommendedDuration = 3
    }

    return {
      shouldCreateVersion: severity !== 'mild', // Only moderate/severe trigger new version
      reason: 'fatigue_deload',
      severity,
      explanation: severity === 'severe'
        ? 'Your training load has significantly exceeded recovery capacity. A recovery-focused program will protect your long-term progress.'
        : 'Accumulated training stress detected. A brief recovery phase will optimize your adaptation.',
      recommendedDuration,
    }
  }

  // Persistent high fatigue (consecutive days)
  if (currentFatigue.consecutiveHighFatigueDays && currentFatigue.consecutiveHighFatigueDays >= 5) {
    return {
      shouldCreateVersion: true,
      reason: 'adaptive_rebalance',
      severity: 'moderate',
      explanation: 'Persistent fatigue detected over multiple sessions. Rebalancing training load.',
      recommendedDuration: 5,
    }
  }

  // No version trigger needed
  return {
    shouldCreateVersion: false,
    reason: null,
    severity: 'mild',
    explanation: 'Fatigue levels within normal training range.',
    recommendedDuration: 0,
  }
}

/**
 * Create a fatigue-triggered recovery version
 * Preserves all athlete data while adjusting program structure
 */
export async function createFatigueRecoveryVersion(
  athleteId: string,
  context: UnifiedEngineContext,
  trigger: FatigueVersionTrigger
): Promise<{
  version: ProgramVersion
  coachingMessage: string
}> {
  if (!trigger.shouldCreateVersion || !trigger.reason) {
    throw new Error('Cannot create fatigue version without valid trigger')
  }

  // Create snapshot capturing current fatigue state
  const snapshotId = await createInputSnapshot(athleteId, context)

  // Create version with fatigue-specific summary
  const summary: ProgramSummary = {
    primaryGoal: context.athlete.primaryGoal,
    trainingDaysPerWeek: context.athlete.trainingDaysPerWeek,
    sessionDurationMinutes: context.athlete.sessionDurationMinutes,
    styleMode: context.athlete.trainingStyle,
    constraintFocus: `recovery_${trigger.severity}`,
    equipment: context.athlete.equipment,
    generatedAt: new Date().toISOString(),
  }

  const version = await createProgramVersion(
    athleteId,
    trigger.reason,
    summary,
    snapshotId
  )

  // Generate coaching message
  const coachingMessage = trigger.severity === 'severe'
    ? 'A recovery-focused program has been created. This is strategic - your body needs time to adapt to the training you\'ve done. Your progress, skills, and workout history are fully preserved.'
    : 'Your program has been adjusted for recovery. This brief phase will optimize your long-term progress. All your training data continues uninterrupted.'

  return { version, coachingMessage }
}

// =============================================================================
// PERFORMANCE ENVELOPE INTEGRATION
// =============================================================================

/**
 * Check if Performance Envelope data suggests version update
 * Used when envelope learns athlete responds poorly to current programming
 */
export function checkEnvelopeVersionTrigger(
  envelopeAnalysis: {
    movementFamiliesWithDecliningTrend: string[]
    overallTrendConfidence: number
    suggestsStructuralChange: boolean
    explanation: string
  }
): {
  shouldTrigger: boolean
  reason: GenerationReason | null
  explanation: string
} {
  // Only trigger if we have high confidence and clear declining patterns
  if (
    envelopeAnalysis.suggestsStructuralChange &&
    envelopeAnalysis.overallTrendConfidence > 0.6 &&
    envelopeAnalysis.movementFamiliesWithDecliningTrend.length >= 2
  ) {
    return {
      shouldTrigger: true,
      reason: 'adaptive_rebalance',
      explanation: `Training response data suggests rebalancing. ${envelopeAnalysis.explanation}`,
    }
  }

  return {
    shouldTrigger: false,
    reason: null,
    explanation: 'Envelope data within normal parameters.',
  }
}

// =============================================================================
// VERSION STABILITY SAFEGUARDS
// =============================================================================

const versionCreationTimestamps = new Map<string, number[]>()
const MAX_VERSIONS_PER_WEEK = 3
const VERSION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Check if version creation is allowed (prevents churn)
 * Limits to MAX_VERSIONS_PER_WEEK to maintain stability
 */
export function canCreateNewVersion(athleteId: string): {
  allowed: boolean
  reason: string
  versionsThisWeek: number
} {
  const now = Date.now()
  const timestamps = versionCreationTimestamps.get(athleteId) || []

  // Filter to only timestamps within the last week
  const recentTimestamps = timestamps.filter(t => now - t < VERSION_WINDOW_MS)

  if (recentTimestamps.length >= MAX_VERSIONS_PER_WEEK) {
    return {
      allowed: false,
      reason: `Maximum ${MAX_VERSIONS_PER_WEEK} program updates per week reached. This prevents unnecessary churn and allows time for training adaptation.`,
      versionsThisWeek: recentTimestamps.length,
    }
  }

  return {
    allowed: true,
    reason: 'Version creation allowed.',
    versionsThisWeek: recentTimestamps.length,
  }
}

/**
 * Record version creation timestamp (for rate limiting)
 */
export function recordVersionCreation(athleteId: string): void {
  const timestamps = versionCreationTimestamps.get(athleteId) || []
  timestamps.push(Date.now())

  // Keep only timestamps within the window
  const now = Date.now()
  const filtered = timestamps.filter(t => now - t < VERSION_WINDOW_MS)
  versionCreationTimestamps.set(athleteId, filtered)
}

/**
 * Safe version creation with all safeguards
 */
export async function safeCreateProgramVersion(
  athleteId: string,
  reason: GenerationReason,
  summary: ProgramSummary,
  snapshotId?: string
): Promise<{
  success: boolean
  version: ProgramVersion | null
  message: string
}> {
  // Check rate limit
  const rateCheck = canCreateNewVersion(athleteId)
  if (!rateCheck.allowed) {
    return {
      success: false,
      version: null,
      message: rateCheck.reason,
    }
  }

  // Validate preservation
  const preservation = validatePreservation()
  if (!preservation.valid) {
    return {
      success: false,
      version: null,
      message: preservation.message,
    }
  }

  // Create version
  const version = await createProgramVersion(athleteId, reason, summary, snapshotId)

  // Record for rate limiting
  recordVersionCreation(athleteId)

  return {
    success: true,
    version,
    message: `Program version ${version.versionNumber} created. ${preservation.message}`,
  }
}

/**
 * Get version creation statistics for an athlete
 */
export async function getVersionStatistics(athleteId: string): Promise<{
  totalVersions: number
  activeVersionNumber: number
  versionsThisWeek: number
  canCreateMore: boolean
  lastVersionDate: string | null
  generationReasonBreakdown: Record<GenerationReason, number>
}> {
  const history = await getProgramVersionHistory(athleteId, 50)
  const activeVersion = await getActiveProgramVersion(athleteId)

  // Count by reason
  const reasonBreakdown: Record<GenerationReason, number> = {
    onboarding_initial_generation: 0,
    settings_schedule_change: 0,
    settings_equipment_change: 0,
    settings_goal_change: 0,
    settings_style_change: 0,
    fatigue_deload: 0,
    skill_priority_update: 0,
    benchmark_update: 0,
    adaptive_rebalance: 0,
    manual_regeneration: 0,
    injury_status_change: 0,
    framework_update: 0,
  }

  for (const version of history) {
    if (version.generationReason in reasonBreakdown) {
      reasonBreakdown[version.generationReason]++
    }
  }

  // Count recent versions
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const versionsThisWeek = history.filter(
    v => new Date(v.createdAt) > oneWeekAgo
  ).length

  return {
    totalVersions: history.length,
    activeVersionNumber: activeVersion?.versionNumber || 0,
    versionsThisWeek,
    canCreateMore: versionsThisWeek < MAX_VERSIONS_PER_WEEK,
    lastVersionDate: history[0]?.createdAt || null,
    generationReasonBreakdown: reasonBreakdown,
  }
}
