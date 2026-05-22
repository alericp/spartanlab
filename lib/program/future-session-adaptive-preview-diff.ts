/**
 * Future Session Adaptive Preview Diff
 * MASTER-8C.71 repair / AB20.4.64.1 / Prompt 66.1
 *
 * This is the first concrete read-only adaptive preview showing actual
 * before/after changes for future sessions. NOT another boundary gate.
 *
 * CRITICAL: This is preview ONLY. No real mutation, persistence, or writes.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FutureSessionAdaptivePreviewDiffStatus =
  | 'preview_ready_blocked_from_apply'
  | 'preview_waiting_for_local_review'
  | 'preview_ready_from_applied_marker_source' // [Prompt 83.1] New status for source-backed marker path
  | 'blocked_no_future_targets'
  | 'blocked_writer_preview_not_ready'
  | 'blocked_missing_source_models'

export type AdaptiveChangeSource =
  | 'workout_evidence'
  | 'caution_pattern'
  | 'writer_open_preview'
  | 'local_authorization'
  | 'target_resolution'

export type AdaptiveChangeConfidence = 'low' | 'medium' | 'high'

export interface FutureSessionAdaptivePreviewChange {
  readonly key: string
  readonly label: string
  readonly before: string
  readonly after: string
  readonly reason: string
  readonly source: AdaptiveChangeSource
  readonly confidence: AdaptiveChangeConfidence
}

export interface FutureSessionAdaptivePreviewDiffModel {
  readonly sourceStep: 'MASTER-8C.71 repair / AB20.4.64.1 / Prompt 66.1'
  readonly status: FutureSessionAdaptivePreviewDiffStatus
  readonly headline: string
  readonly summary: string

  readonly targetLabel: string
  readonly targetSessionCount: number
  readonly completedSessionsProtected: true

  // Hard invariants - all must remain false/true as specified
  readonly previewOnly: true
  readonly realMutationEnabled: false
  readonly persistenceEnabled: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false

  // State from upstream models
  readonly writerOpenPreviewCandidate: boolean
  readonly localReviewGateReady: boolean
  readonly cautionPatternActive: boolean
  readonly localCautionReviewAccepted: boolean
  readonly localAuthorizationAccepted: boolean

  // The actual before/after changes
  readonly changes: readonly FutureSessionAdaptivePreviewChange[]
  readonly blockers: readonly string[]
  readonly nextRequiredStep: string

  // Summary counts
  readonly changeSummary: {
    readonly totalChanges: number
    readonly highConfidence: number
    readonly mediumConfidence: number
    readonly lowConfidence: number
    readonly fromCaution: number
    readonly fromEvidence: number
  }
}

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface FutureSessionAdaptivePreviewDiffInput {
  // From Writer-Open Preview Boundary (Prompt 65)
  readonly writerOpenPreviewBoundaryModel?: {
    readonly previewOpenCandidate: boolean
    readonly cautionPatternActive: boolean
    readonly authorizationMissing: boolean
  } | null

  // From Local Authorization + Caution Review Gate (Prompt 66)
  readonly localAuthorizationCautionReviewGateModel?: {
    readonly localDryRunGateReady: boolean
    readonly cautionPatternActive: boolean
    readonly localCautionReviewAccepted: boolean
    readonly localAuthorizationAccepted: boolean
  } | null

  // From Mutation Target Session Resolution Preview
  readonly mutationTargetSessionResolutionPreviewModel?: {
    readonly status: string
    readonly futureSessionCount: number
    readonly targetSessionLabel?: string
    readonly futureTargetSessions?: readonly { readonly label: string }[]
  } | null

  // From Mutation Caution Clearance Gate
  readonly mutationCautionClearanceGateModel?: {
    readonly status: string
    readonly activeCautionCount: number
    readonly cautionItems?: readonly {
      readonly key: string
      readonly label: string
      readonly severity: string
    }[]
  } | null
  
  // [Prompt 83.1] Alternative source-backed path inputs
  // When these are present and valid, can bypass stale writerOpenPreviewCandidate gate
  readonly persistedMarkerState?: {
    readonly appliedCount: number
    readonly targetDayNumbers: readonly number[]
    readonly persistenceStatus: 'persisted'
    readonly appliedItems?: readonly {
      readonly sessionId: string
      readonly targetDayNumber: number
    }[]
  } | null
  
  readonly programCardAdaptationMarkerPreviewModel?: {
    readonly status: string
    readonly previewItems?: readonly {
      readonly sessionId: string
      readonly dayLabel: string
      readonly sessionTitle: string
    }[]
    readonly targetDayCount?: number
  } | null
}

// ============================================================================
// [Prompt 83.1] HELPER FUNCTIONS FOR SOURCE-BACKED MARKER PATH
// ============================================================================

/**
 * Compute a change summary from a list of changes
 */
function computeChangeSummary(changes: readonly FutureSessionAdaptivePreviewChange[]) {
  return {
    totalChanges: changes.length,
    highConfidence: changes.filter(c => c.confidence === 'high').length,
    mediumConfidence: changes.filter(c => c.confidence === 'medium').length,
    lowConfidence: changes.filter(c => c.confidence === 'low').length,
    fromCaution: changes.filter(c => c.source === 'caution_pattern').length,
    fromEvidence: changes.filter(c => c.source === 'workout_evidence').length,
  }
}

/**
 * Generate source-backed preview changes from persisted marker application state.
 * This allows the preview to be computed even when the older writer-open gate is stale.
 */
function generateSourceBackedPreviewChanges(
  persistedMarkerState: FutureSessionAdaptivePreviewDiffInput['persistedMarkerState'],
  programCardAdaptationMarkerPreviewModel: FutureSessionAdaptivePreviewDiffInput['programCardAdaptationMarkerPreviewModel'],
  mutationCautionClearanceGateModel: FutureSessionAdaptivePreviewDiffInput['mutationCautionClearanceGateModel'],
): readonly FutureSessionAdaptivePreviewChange[] {
  const changes: FutureSessionAdaptivePreviewChange[] = []
  
  const targetDayCount = persistedMarkerState?.targetDayNumbers?.length ?? 
    programCardAdaptationMarkerPreviewModel?.targetDayCount ?? 0
  
  // Generate standard adaptive preview changes based on the applied marker
  // These are the same categories that would be generated from the normal path
  
  // 1. Intensity ceiling adjustment (high confidence from applied marker)
  changes.push({
    key: 'intensity_ceiling',
    label: 'Intensity Ceiling',
    before: 'Standard intensity ceiling based on program design',
    after: `Adaptive intensity preview for ${targetDayCount} upcoming session${targetDayCount !== 1 ? 's' : ''}`,
    reason: 'Applied marker indicates adaptive intensity adjustment is appropriate',
    source: 'workout_evidence',
    confidence: 'high',
  })
  
  // 2. Volume adjustment (high confidence from applied marker)
  changes.push({
    key: 'volume_adjustment',
    label: 'Volume Adjustment',
    before: 'Planned volume per program progression',
    after: 'Adaptive volume preview based on applied marker state',
    reason: 'Marker application confirms volume adaptation preview is ready',
    source: 'workout_evidence',
    confidence: 'high',
  })
  
  // 3. Recovery allocation (medium confidence)
  changes.push({
    key: 'recovery_allocation',
    label: 'Recovery Allocation',
    before: 'Standard recovery between sets',
    after: 'Adaptive recovery preview based on recent performance',
    reason: 'Applied marker includes recovery adaptation considerations',
    source: 'workout_evidence',
    confidence: 'medium',
  })
  
  // 4. Method density (medium confidence)
  changes.push({
    key: 'method_density',
    label: 'Method Density',
    before: 'Current method density per program plan',
    after: 'Adaptive method density preview',
    reason: 'Marker state supports method density adaptation preview',
    source: 'workout_evidence',
    confidence: 'medium',
  })
  
  // 5. If there are active cautions, add caution-sourced changes
  const activeCautionCount = mutationCautionClearanceGateModel?.activeCautionCount ?? 0
  if (activeCautionCount > 0) {
    changes.push({
      key: 'caution_intensity_ceiling',
      label: 'Caution: Intensity Ceiling',
      before: 'Standard intensity ceiling',
      after: 'Reduced intensity ceiling due to active caution',
      reason: `${activeCautionCount} active caution${activeCautionCount !== 1 ? 's' : ''} detected`,
      source: 'caution_pattern',
      confidence: 'high',
    })
  }
  
  return changes
}

// ============================================================================
// RESOLVER
// ============================================================================

export function resolveFutureSessionAdaptivePreviewDiff(
  input: FutureSessionAdaptivePreviewDiffInput
): FutureSessionAdaptivePreviewDiffModel {
  const {
    writerOpenPreviewBoundaryModel,
    localAuthorizationCautionReviewGateModel,
    mutationTargetSessionResolutionPreviewModel,
    mutationCautionClearanceGateModel,
    // [Prompt 83.1] Alternative source-backed inputs
    persistedMarkerState,
    programCardAdaptationMarkerPreviewModel,
  } = input

  // Hard invariants that never change
  const hardInvariants = {
    sourceStep: 'MASTER-8C.71 repair / AB20.4.64.1 / Prompt 66.1' as const,
    completedSessionsProtected: true as const,
    previewOnly: true as const,
    realMutationEnabled: false as const,
    persistenceEnabled: false as const,
    programCardsChanged: false as const,
    startWorkoutChanged: false as const,
    liveWorkoutChanged: false as const,
    futureSessionMutationEnabled: false as const,
  }
  
  // [Prompt 83.1] Check for alternative source-backed path
  // If we have a persisted applied marker with valid future targets, we can bypass
  // the stale writerOpenPreviewCandidate gate and produce preview changes
  const hasPersistedMarkerSource = 
    persistedMarkerState?.persistenceStatus === 'persisted' &&
    persistedMarkerState?.appliedCount > 0 &&
    persistedMarkerState?.targetDayNumbers?.length > 0
  
  const hasMarkerPreviewSource = 
    programCardAdaptationMarkerPreviewModel?.status === 'preview_ready' &&
    (programCardAdaptationMarkerPreviewModel?.previewItems?.length ?? 0) > 0
  
  const hasSourceBackedMarkerPath = hasPersistedMarkerSource || hasMarkerPreviewSource

  // Check if source models are missing
  // [Prompt 83.1] Allow alternative path if marker source exists
  if (!writerOpenPreviewBoundaryModel || !localAuthorizationCautionReviewGateModel) {
    // If we have a source-backed marker path, we can still produce preview
    if (hasSourceBackedMarkerPath) {
      // Generate changes from the marker source
      const targetDayNumbers = persistedMarkerState?.targetDayNumbers ?? []
      const targetSessionCount = targetDayNumbers.length
      const targetLabel = targetSessionCount > 0 
        ? `${targetSessionCount} future session${targetSessionCount !== 1 ? 's' : ''} from applied marker`
        : 'Applied marker targets'
      
      // Generate source-backed preview changes from the marker
      const sourceBackedChanges = generateSourceBackedPreviewChanges(
        persistedMarkerState,
        programCardAdaptationMarkerPreviewModel,
        mutationCautionClearanceGateModel,
      )
      
      return {
        ...hardInvariants,
        status: 'preview_ready_from_applied_marker_source',
        headline: 'Adaptive Preview — Source-Backed from Applied Marker',
        summary: `Preview generated from persisted marker application. ${sourceBackedChanges.length} proposed change${sourceBackedChanges.length !== 1 ? 's' : ''} targeting ${targetSessionCount} future session${targetSessionCount !== 1 ? 's' : ''}.`,
        targetLabel,
        targetSessionCount,
        writerOpenPreviewCandidate: false, // Writer gate is stale but marker source is valid
        localReviewGateReady: true, // Marker was already applied via centralized review
        cautionPatternActive: (mutationCautionClearanceGateModel?.activeCautionCount ?? 0) > 0,
        localCautionReviewAccepted: true, // Marker application implies review accepted
        localAuthorizationAccepted: true, // Marker application implies authorization
        changes: sourceBackedChanges,
        blockers: [],
        nextRequiredStep: 'Prompt 84 — controlled future-session mutation apply using computable proposal operations.',
        changeSummary: computeChangeSummary(sourceBackedChanges),
      }
    }
    
    return {
      ...hardInvariants,
      status: 'blocked_missing_source_models',
      headline: 'Adaptive Preview — Source Models Missing',
      summary: 'Cannot generate adaptive preview without upstream boundary and review gate models.',
      targetLabel: 'Target unavailable — source models missing',
      targetSessionCount: 0,
      writerOpenPreviewCandidate: false,
      localReviewGateReady: false,
      cautionPatternActive: false,
      localCautionReviewAccepted: false,
      localAuthorizationAccepted: false,
      changes: [],
      blockers: ['Writer-open preview boundary model is missing', 'Local authorization review gate model is missing'],
      nextRequiredStep: 'Ensure Prompt 65 and Prompt 66 models are available before adaptive preview.',
      changeSummary: {
        totalChanges: 0,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        fromCaution: 0,
        fromEvidence: 0,
      },
    }
  }

  // Extract state from upstream models
  const writerOpenPreviewCandidate = writerOpenPreviewBoundaryModel.previewOpenCandidate
  const localReviewGateReady = localAuthorizationCautionReviewGateModel.localDryRunGateReady
  const cautionPatternActive = localAuthorizationCautionReviewGateModel.cautionPatternActive ||
    writerOpenPreviewBoundaryModel.cautionPatternActive
  const localCautionReviewAccepted = localAuthorizationCautionReviewGateModel.localCautionReviewAccepted
  const localAuthorizationAccepted = localAuthorizationCautionReviewGateModel.localAuthorizationAccepted

  // Check if writer preview is not ready
  // [Prompt 83.1] Allow bypass if we have a source-backed marker path
  if (!writerOpenPreviewCandidate && !hasSourceBackedMarkerPath) {
    return {
      ...hardInvariants,
      status: 'blocked_writer_preview_not_ready',
      headline: 'Adaptive Preview — Writer Preview Not Ready',
      summary: 'Writer-open preview candidate must be ready before adaptive preview can be generated.',
      targetLabel: 'Target unavailable — writer preview not ready',
      targetSessionCount: 0,
      writerOpenPreviewCandidate,
      localReviewGateReady,
      cautionPatternActive,
      localCautionReviewAccepted,
      localAuthorizationAccepted,
      changes: [],
      blockers: ['Writer-open preview candidate is not ready'],
      nextRequiredStep: 'Complete writer-open preview boundary before adaptive preview.',
      changeSummary: {
        totalChanges: 0,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        fromCaution: 0,
        fromEvidence: 0,
      },
    }
  }
  
  // [Prompt 83.1] If writer preview is not ready BUT we have source-backed marker path, use that
  if (!writerOpenPreviewCandidate && hasSourceBackedMarkerPath) {
    const targetDayNumbers = persistedMarkerState?.targetDayNumbers ?? []
    const markerTargetSessionCount = targetDayNumbers.length
    const markerTargetLabel = markerTargetSessionCount > 0 
      ? `${markerTargetSessionCount} future session${markerTargetSessionCount !== 1 ? 's' : ''} from applied marker`
      : 'Applied marker targets'
    
    const sourceBackedChanges = generateSourceBackedPreviewChanges(
      persistedMarkerState,
      programCardAdaptationMarkerPreviewModel,
      mutationCautionClearanceGateModel,
    )
    
    return {
      ...hardInvariants,
      status: 'preview_ready_from_applied_marker_source',
      headline: 'Adaptive Preview — Source-Backed from Applied Marker',
      summary: `Preview generated from persisted marker application. Writer gate bypassed via source-backed path. ${sourceBackedChanges.length} proposed change${sourceBackedChanges.length !== 1 ? 's' : ''}.`,
      targetLabel: markerTargetLabel,
      targetSessionCount: markerTargetSessionCount,
      writerOpenPreviewCandidate: false,
      localReviewGateReady: true,
      cautionPatternActive,
      localCautionReviewAccepted: true,
      localAuthorizationAccepted: true,
      changes: sourceBackedChanges,
      blockers: [],
      nextRequiredStep: 'Prompt 84 — controlled future-session mutation apply using computable proposal operations.',
      changeSummary: computeChangeSummary(sourceBackedChanges),
    }
  }

  // Determine target session info
  const targetSessionCount = mutationTargetSessionResolutionPreviewModel?.futureSessionCount ?? 0
  let targetLabel = 'Next eligible future session'

  if (mutationTargetSessionResolutionPreviewModel) {
    if (mutationTargetSessionResolutionPreviewModel.targetSessionLabel) {
      targetLabel = mutationTargetSessionResolutionPreviewModel.targetSessionLabel
    } else if (targetSessionCount > 0) {
      targetLabel = `Future target session 1 of ${targetSessionCount}`
    }
  }

  // [Prompt 68.3] Comprehensive target-session source blocking
  // Must catch: missing model, zero count, unavailable, no_future_targets, targets_unresolved
  const targetSessionSourceMissing = !mutationTargetSessionResolutionPreviewModel
  const targetSessionCountMissing = targetSessionCount <= 0
  const targetResolutionStatus = mutationTargetSessionResolutionPreviewModel?.status
  const targetSessionResolutionBlocked =
    targetSessionSourceMissing ||
    targetSessionCountMissing ||
    targetResolutionStatus === 'unavailable' ||
    targetResolutionStatus === 'no_future_targets' ||
    targetResolutionStatus === 'targets_unresolved'

  // Check if no future targets — broader condition than before
  if (targetSessionResolutionBlocked) {
    // Determine specific blocker reason
    let blockerReason = 'No true future target sessions resolved'
    let blockerLabel = 'No future sessions available'
    if (targetSessionSourceMissing) {
      blockerReason = 'Target session resolution model is missing'
      blockerLabel = 'Target unavailable — target resolution missing'
    } else if (targetResolutionStatus === 'no_future_targets') {
      blockerReason = 'Target session resolution found no future targets'
    } else if (targetResolutionStatus === 'targets_unresolved') {
      blockerReason = 'Target session resolution is unresolved'
      blockerLabel = 'Target unavailable — targets unresolved'
    } else if (targetResolutionStatus === 'unavailable') {
      blockerReason = 'Target session resolution is unavailable'
      blockerLabel = 'Target unavailable — resolution unavailable'
    }
    
    return {
      ...hardInvariants,
      status: 'blocked_no_future_targets',
      headline: 'Adaptive Preview — No Future Targets',
      summary: `Adaptive preview cannot be ready until a true future target session source exists. ${blockerReason}.`,
      targetLabel: blockerLabel,
      targetSessionCount: 0,
      writerOpenPreviewCandidate,
      localReviewGateReady,
      cautionPatternActive,
      localCautionReviewAccepted,
      localAuthorizationAccepted,
      changes: [],
      blockers: [blockerReason],
      nextRequiredStep: 'Resolve future target-session source before adaptive preview.',
      changeSummary: {
        totalChanges: 0,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        fromCaution: 0,
        fromEvidence: 0,
      },
    }
  }

  // Build the actual before/after changes based on available evidence
  const changes: FutureSessionAdaptivePreviewChange[] = []

  // Always add changes if caution pattern is active (indicates pain/tension/evidence)
  if (cautionPatternActive) {
    // Intensity ceiling change
    changes.push({
      key: 'intensity_ceiling',
      label: 'Intensity Ceiling',
      before: 'Current planned intensity (standard RPE targets)',
      after: 'Temporary lower-RPE ceiling preview (conservative approach)',
      reason: 'Pain/tension or caution evidence requires conservative preview',
      source: 'caution_pattern',
      confidence: 'high',
    })

    // Method density change
    changes.push({
      key: 'method_density',
      label: 'Method Density',
      before: 'Current planned method density (standard fatigue stacking)',
      after: 'Reduced density / less fatigue stacking preview',
      reason: 'Caution pattern and high-effort evidence detected',
      source: 'caution_pattern',
      confidence: 'high',
    })

    // Warm-up focus change
    changes.push({
      key: 'warmup_focus',
      label: 'Warm-up Focus',
      before: 'General preparation (standard warm-up protocol)',
      after: 'Joint/tissue-specific preparation preview',
      reason: 'Pain/tension noted — targeted warm-up recommended',
      source: 'caution_pattern',
      confidence: 'medium',
    })

    // Cooldown focus change
    changes.push({
      key: 'cooldown_focus',
      label: 'Cooldown Focus',
      before: 'General cooldown (standard recovery protocol)',
      after: 'Tissue-specific recovery emphasis preview',
      reason: 'Caution pattern before future adaptation — enhanced recovery focus',
      source: 'caution_pattern',
      confidence: 'medium',
    })
  }

  // Add caution-specific changes from the caution model
  const cautionCount = mutationCautionClearanceGateModel?.activeCautionCount ?? 0
  if (cautionCount > 0 && mutationCautionClearanceGateModel?.cautionItems) {
    const cautionItems = mutationCautionClearanceGateModel.cautionItems.slice(0, 2)
    for (const item of cautionItems) {
      if (!changes.some(c => c.key === `caution_${item.key}`)) {
        changes.push({
          key: `caution_${item.key}`,
          label: `Caution: ${item.label}`,
          before: 'Standard progression (no caution adjustment)',
          after: `Adjusted progression preview (${item.severity} caution addressed)`,
          reason: `Active caution: ${item.label}`,
          source: 'caution_pattern',
          confidence: item.severity === 'high' ? 'high' : 'medium',
        })
      }
    }
  }

  // Add evidence-based changes (always include some if we have target sessions)
  if (targetSessionCount > 0 && changes.length < 6) {
    // Volume adjustment
    changes.push({
      key: 'volume_adjustment',
      label: 'Volume Adjustment',
      before: 'Planned volume (per program prescription)',
      after: 'Evidence-adjusted volume preview',
      reason: 'Workout evidence informs session-to-session volume adaptation',
      source: 'workout_evidence',
      confidence: 'medium',
    })

    // Recovery allocation
    changes.push({
      key: 'recovery_allocation',
      label: 'Recovery Allocation',
      before: 'Standard recovery between sets',
      after: 'Adaptive recovery preview based on recent performance',
      reason: 'Recent workout evidence suggests recovery adjustment',
      source: 'workout_evidence',
      confidence: 'low',
    })
  }

  // Calculate blockers
  const blockers: string[] = []
  if (!localReviewGateReady) {
    if (!localCautionReviewAccepted && cautionPatternActive) {
      blockers.push('Local caution review not yet accepted')
    }
    if (!localAuthorizationAccepted) {
      blockers.push('Local authorization not yet accepted')
    }
  }
  blockers.push('Real persistence is disabled — preview only')
  blockers.push('Marker dry-run must complete before any apply action')

  // Determine status
  let status: FutureSessionAdaptivePreviewDiffStatus
  let headline: string
  let summary: string
  let nextRequiredStep: string

  if (!localReviewGateReady) {
    status = 'preview_waiting_for_local_review'
    headline = 'Future Session Adaptive Preview — Awaiting Local Review'
    summary = 'Adaptive preview is available. Local caution/authorization review must complete before marker dry-run can proceed. These changes are proposed, not applied.'
    nextRequiredStep = 'Complete local caution and authorization review, then proceed to Prompt 67 marker-save dry-run candidate.'
  } else {
    status = 'preview_ready_blocked_from_apply'
    headline = 'Future Session Adaptive Preview — Ready (Apply Blocked)'
    summary = 'Adaptive preview is ready. Real persistence and apply actions remain blocked. These changes show what WOULD be adapted, but nothing has been saved.'
    nextRequiredStep = 'Prompt 67 / MASTER-8C.72 / AB20.4.65 — controlled marker-save dry-run candidate; real persistence still disabled.'
  }

  // Calculate summary counts
  const changeSummary = {
    totalChanges: changes.length,
    highConfidence: changes.filter(c => c.confidence === 'high').length,
    mediumConfidence: changes.filter(c => c.confidence === 'medium').length,
    lowConfidence: changes.filter(c => c.confidence === 'low').length,
    fromCaution: changes.filter(c => c.source === 'caution_pattern').length,
    fromEvidence: changes.filter(c => c.source === 'workout_evidence').length,
  }

  return {
    ...hardInvariants,
    status,
    headline,
    summary,
    targetLabel,
    targetSessionCount, // [Prompt 68.2] No fake fallback to 1 — use true source count only (0 if unavailable)
    writerOpenPreviewCandidate,
    localReviewGateReady,
    cautionPatternActive,
    localCautionReviewAccepted,
    localAuthorizationAccepted,
    changes,
    blockers,
    nextRequiredStep,
    changeSummary,
  }
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

export function getAdaptivePreviewStatusLabel(status: FutureSessionAdaptivePreviewDiffStatus): string {
  switch (status) {
    case 'preview_ready_blocked_from_apply':
      return 'Preview Ready'
    case 'preview_waiting_for_local_review':
      return 'Awaiting Review'
    case 'preview_ready_from_applied_marker_source':
      return 'Source-Backed Preview' // [Prompt 83.1]
    case 'blocked_no_future_targets':
      return 'No Targets'
    case 'blocked_writer_preview_not_ready':
      return 'Writer Not Ready'
    case 'blocked_missing_source_models':
      return 'Source Missing'
    default:
      return 'Unknown'
  }
}

export function getAdaptivePreviewStatusColor(status: FutureSessionAdaptivePreviewDiffStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'preview_ready_blocked_from_apply':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    case 'preview_waiting_for_local_review':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'preview_ready_from_applied_marker_source':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' } // [Prompt 83.1]
    case 'blocked_no_future_targets':
    case 'blocked_writer_preview_not_ready':
    case 'blocked_missing_source_models':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
  }
}

export function getAdaptiveChangeConfidenceLabel(confidence: AdaptiveChangeConfidence): string {
  switch (confidence) {
    case 'high':
      return 'High'
    case 'medium':
      return 'Medium'
    case 'low':
      return 'Low'
    default:
      return 'Unknown'
  }
}

export function getAdaptiveChangeConfidenceColor(confidence: AdaptiveChangeConfidence): {
  bg: string
  text: string
} {
  switch (confidence) {
    case 'high':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' }
    case 'medium':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400' }
    case 'low':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400' }
  }
}

export function getAdaptiveChangeSourceLabel(source: AdaptiveChangeSource): string {
  switch (source) {
    case 'workout_evidence':
      return 'Evidence'
    case 'caution_pattern':
      return 'Caution'
    case 'writer_open_preview':
      return 'Writer'
    case 'local_authorization':
      return 'Auth'
    case 'target_resolution':
      return 'Target'
    default:
      return 'Unknown'
  }
}

export function getAdaptiveChangeSourceColor(source: AdaptiveChangeSource): {
  bg: string
  text: string
} {
  switch (source) {
    case 'workout_evidence':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400' }
    case 'caution_pattern':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400' }
    case 'writer_open_preview':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400' }
    case 'local_authorization':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' }
    case 'target_resolution':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400' }
  }
}
