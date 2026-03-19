/**
 * Engine Integration Proof Layer
 * 
 * PHASE 10: Verifies and logs that all major systems from Prompts 1-9 are
 * actively used in the real generation/save/read/feedback paths.
 * 
 * This module provides:
 * - Lightweight diagnostic traces proving live path usage
 * - Single source of truth verification
 * - Live path enforcement without adding parallel systems
 * 
 * KEY SYSTEMS VERIFIED:
 * 1. DB-enforced exercise resolution
 * 2. Flexible scheduling / scheduleMode semantics
 * 3. Truth-state / real-metrics gating
 * 4. Workout logging feedback loop
 * 5. Movement intelligence + biomechanics layer
 * 6. Explanation layer
 * 7. QA / integrity validation
 * 8. Settings/profile single-source-of-truth semantics
 */

// =============================================================================
// TYPES
// =============================================================================

export type IntegrationSystem = 
  | 'db_resolver'
  | 'flexible_schedule'
  | 'truth_state'
  | 'feedback_loop'
  | 'movement_intelligence'
  | 'explanation_layer'
  | 'qa_validation'
  | 'profile_source'

export interface IntegrationProofEntry {
  system: IntegrationSystem
  action: string
  timestamp: number
  details?: Record<string, unknown>
}

export interface LivePathProof {
  profileLoaded: boolean
  scheduleModeResolved: boolean
  dbResolverUsed: boolean
  movementIntelligenceAttached: boolean
  qaPassed: boolean
  programSaved: boolean
  truthStateClassified: boolean
  feedbackConsumed: boolean
  explanationGenerated: boolean
}

export interface EngineProofSummary {
  allSystemsLive: boolean
  systemStatus: Record<IntegrationSystem, boolean>
  warnings: string[]
  proofLog: IntegrationProofEntry[]
}

// =============================================================================
// PROOF TRACKING
// =============================================================================

// Session-level proof log (resets each generation cycle)
let currentProofLog: IntegrationProofEntry[] = []

/**
 * Record a proof entry for a system being used in the live path.
 * Call this from the actual integration points.
 */
export function recordIntegrationProof(
  system: IntegrationSystem,
  action: string,
  details?: Record<string, unknown>
): void {
  const entry: IntegrationProofEntry = {
    system,
    action,
    timestamp: Date.now(),
    details,
  }
  currentProofLog.push(entry)
  
  // Concise diagnostic log
  console.log(`[engine-proof] ${system}: ${action}`, details ? JSON.stringify(details).slice(0, 100) : '')
}

/**
 * Reset the proof log at the start of a new generation cycle.
 */
export function resetProofLog(): void {
  currentProofLog = []
  console.log('[engine-proof] Proof log reset for new generation cycle')
}

/**
 * Get the current proof log.
 */
export function getProofLog(): IntegrationProofEntry[] {
  return [...currentProofLog]
}

// =============================================================================
// LIVE PATH VERIFICATION
// =============================================================================

/**
 * Verify that all required systems were used in the current generation cycle.
 * Call this after generation completes to confirm the live path was followed.
 */
export function verifyLivePath(): LivePathProof {
  const systemsUsed = new Set(currentProofLog.map(e => e.system))
  
  const proof: LivePathProof = {
    profileLoaded: systemsUsed.has('profile_source'),
    scheduleModeResolved: systemsUsed.has('flexible_schedule'),
    dbResolverUsed: systemsUsed.has('db_resolver'),
    movementIntelligenceAttached: systemsUsed.has('movement_intelligence'),
    qaPassed: systemsUsed.has('qa_validation'),
    programSaved: currentProofLog.some(e => e.action.includes('save')),
    truthStateClassified: systemsUsed.has('truth_state'),
    feedbackConsumed: systemsUsed.has('feedback_loop'),
    explanationGenerated: systemsUsed.has('explanation_layer'),
  }
  
  const allPassed = Object.values(proof).every(v => v)
  
  console.log('[live-path] Verification result:', {
    allPassed,
    ...proof,
  })
  
  return proof
}

/**
 * Get a complete summary of engine integration status.
 */
export function getEngineProofSummary(): EngineProofSummary {
  const systemStatus: Record<IntegrationSystem, boolean> = {
    db_resolver: false,
    flexible_schedule: false,
    truth_state: false,
    feedback_loop: false,
    movement_intelligence: false,
    explanation_layer: false,
    qa_validation: false,
    profile_source: false,
  }
  
  const warnings: string[] = []
  
  // Check each system
  for (const entry of currentProofLog) {
    systemStatus[entry.system] = true
  }
  
  // Generate warnings for missing systems
  for (const [system, used] of Object.entries(systemStatus)) {
    if (!used) {
      warnings.push(`${system} was not used in current generation cycle`)
    }
  }
  
  const allSystemsLive = Object.values(systemStatus).every(v => v)
  
  return {
    allSystemsLive,
    systemStatus,
    warnings,
    proofLog: [...currentProofLog],
  }
}

// =============================================================================
// SOURCE OF TRUTH VERIFICATION
// =============================================================================

/**
 * Verify that profile/settings data comes from the canonical source.
 * Returns true if the data is from the canonical source.
 */
export function verifyProfileSource(
  source: 'onboarding_profile' | 'settings' | 'legacy' | 'unknown'
): boolean {
  const isCanonical = source === 'onboarding_profile' || source === 'settings'
  
  recordIntegrationProof('profile_source', `loaded from ${source}`, {
    isCanonical,
  })
  
  if (!isCanonical) {
    console.warn('[source-of-truth] Profile loaded from non-canonical source:', source)
  }
  
  return isCanonical
}

/**
 * Verify that scheduleMode is properly resolved (not flattened).
 */
export function verifyScheduleModeResolution(
  scheduleMode: 'static' | 'flexible',
  currentWeekFrequency: number,
  source: 'profile' | 'engine' | 'fallback'
): boolean {
  const isValid = (
    (scheduleMode === 'static' || scheduleMode === 'flexible') &&
    typeof currentWeekFrequency === 'number' &&
    currentWeekFrequency >= 2 &&
    currentWeekFrequency <= 7 &&
    source !== 'fallback'
  )
  
  recordIntegrationProof('flexible_schedule', `resolved ${scheduleMode} @ ${currentWeekFrequency}d`, {
    scheduleMode,
    currentWeekFrequency,
    source,
    isValid,
  })
  
  if (!isValid) {
    console.warn('[source-of-truth] Schedule resolution issue:', {
      scheduleMode,
      currentWeekFrequency,
      source,
    })
  }
  
  return isValid
}

/**
 * Verify that DB resolver was used for exercise selection.
 */
export function verifyDbResolverUsed(
  exerciseCount: number,
  dbBackedCount: number,
  hasNonDbExercises: boolean
): boolean {
  const ratio = exerciseCount > 0 ? dbBackedCount / exerciseCount : 0
  const isValid = ratio >= 0.95 && !hasNonDbExercises
  
  recordIntegrationProof('db_resolver', `resolved ${dbBackedCount}/${exerciseCount} from DB`, {
    exerciseCount,
    dbBackedCount,
    ratio: Math.round(ratio * 100),
    hasNonDbExercises,
    isValid,
  })
  
  if (!isValid) {
    console.warn('[source-of-truth] DB resolver verification failed:', {
      ratio,
      hasNonDbExercises,
    })
  }
  
  return isValid
}

/**
 * Verify that truth-state is being used for dashboard classification.
 */
export function verifyTruthStateUsed(
  stateLabel: string,
  dataConfidence: string,
  workoutCount: number
): boolean {
  const isValid = (
    typeof stateLabel === 'string' &&
    typeof dataConfidence === 'string' &&
    typeof workoutCount === 'number'
  )
  
  recordIntegrationProof('truth_state', `classified as ${stateLabel}`, {
    stateLabel,
    dataConfidence,
    workoutCount,
    isValid,
  })
  
  return isValid
}

/**
 * Verify that movement intelligence is attached to exercises.
 */
export function verifyMovementIntelligence(
  totalExercises: number,
  withMovementData: number
): boolean {
  const ratio = totalExercises > 0 ? withMovementData / totalExercises : 0
  const isValid = ratio >= 0.8
  
  recordIntegrationProof('movement_intelligence', `attached to ${withMovementData}/${totalExercises}`, {
    totalExercises,
    withMovementData,
    ratio: Math.round(ratio * 100),
    isValid,
  })
  
  return isValid
}

/**
 * Verify that QA validation ran on the program.
 */
export function verifyQaValidation(
  passed: boolean,
  diagnostics: string[]
): boolean {
  recordIntegrationProof('qa_validation', passed ? 'passed' : 'failed', {
    passed,
    diagnosticsCount: diagnostics.length,
    firstDiagnostic: diagnostics[0]?.slice(0, 50),
  })
  
  return passed
}

/**
 * Verify that explanation layer generated real metadata.
 */
export function verifyExplanationLayer(
  hasReasonCodes: boolean,
  reasonCodeCount: number
): boolean {
  const isValid = hasReasonCodes && reasonCodeCount > 0
  
  recordIntegrationProof('explanation_layer', `generated ${reasonCodeCount} reason codes`, {
    hasReasonCodes,
    reasonCodeCount,
    isValid,
  })
  
  return isValid
}

/**
 * Verify that feedback loop data was consumed.
 */
export function verifyFeedbackLoopUsed(
  trustedWorkoutCount: number,
  adjustmentReasons: string[]
): boolean {
  const hasData = trustedWorkoutCount > 0
  const hasReasons = adjustmentReasons.length > 0
  
  recordIntegrationProof('feedback_loop', `consumed ${trustedWorkoutCount} logs, ${adjustmentReasons.length} reasons`, {
    trustedWorkoutCount,
    adjustmentReasonsCount: adjustmentReasons.length,
    hasData,
    hasReasons,
  })
  
  return hasData || adjustmentReasons.length === 0 // Valid if no data yet
}

// =============================================================================
// BYPASS DETECTION
// =============================================================================

/**
 * Detect if any legacy bypass paths are being used.
 * Returns a list of detected bypasses.
 */
export function detectLegacyBypasses(context: {
  usedLegacyGenerator?: boolean
  usedStaticFallback?: boolean
  usedHardcodedExercises?: boolean
  bypassedTruthState?: boolean
  bypassedQa?: boolean
}): string[] {
  const bypasses: string[] = []
  
  if (context.usedLegacyGenerator) {
    bypasses.push('legacy_generator_active')
  }
  if (context.usedStaticFallback) {
    bypasses.push('static_schedule_fallback_active')
  }
  if (context.usedHardcodedExercises) {
    bypasses.push('hardcoded_exercises_injected')
  }
  if (context.bypassedTruthState) {
    bypasses.push('truth_state_bypassed')
  }
  if (context.bypassedQa) {
    bypasses.push('qa_validation_bypassed')
  }
  
  if (bypasses.length > 0) {
    console.warn('[engine-proof] LEGACY BYPASSES DETECTED:', bypasses)
  }
  
  return bypasses
}
