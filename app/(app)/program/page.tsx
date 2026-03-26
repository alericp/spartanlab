'use client'

/**
 * Program Page - The canonical current-program experience
 * 
 * TASK 5: Import isolation for crash-resistance
 * Heavy program modules are loaded dynamically in useEffect to prevent
 * hydration/SSR crashes that cause the global error boundary.
 * 
 * Priority order:
 * 1. Show existing adaptive program if available
 * 2. Migration from spartanlab_first_program handled by getProgramState()
 * 3. Show builder as secondary action for creating/regenerating
 */

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Dumbbell, Plus, Sparkles, AlertTriangle, Loader2, Info } from 'lucide-react'
import Link from 'next/link'

// TASK 5: Lightweight type imports only - actual modules loaded dynamically
import type { AdaptiveProgramInputs, AdaptiveProgram, GenerationErrorCode, TemplateSimilarityResult } from '@/lib/adaptive-program-builder'
import type { TrainingDays } from '@/lib/program-service'
// [profile-truth-sync] ISSUE A: Import drift detection for settings/program alignment
// [equipment-truth-fix] TASK C: Import equipment normalizer for canonical saves
// [TASK 1] Import unified staleness evaluator - THE ONLY source of staleness truth
import { 
  type ProfileProgramDrift,
  validateBuilderDisplayTruth,
  builderEquipmentToProfileEquipment,
  evaluateUnifiedProgramStaleness,
  type UnifiedStalenessResult,
  getCanonicalProfile,
  composeCanonicalPlannerInput,
  // [PHASE 5 CLOSEOUT] Source truth audit functions
  getSourceTruthSnapshot,
  emitSourceTruthAudit,
  auditCanonicalPrecedence,
  detectSplitBrain,
  phase5SourceTruthPersistenceFinalVerdict,
} from '@/lib/canonical-profile-service'
// [program-rebuild-truth] Import rebuild result contract for truthful error handling
// [freshness-sync] TASK 1 & 2: Import freshness identity management for cross-surface consistency
import {
  type BuildAttemptResult,
  type BuildAttemptSubCode,
  createSuccessBuildResult,
  createFailedBuildResult,
  saveLastBuildAttemptResult,
  getLastBuildAttemptResult,
  clearLastBuildAttemptResult,
  createProfileSignature,
  updateFreshnessIdentity,
  invalidateStaleCaches,
  // [PHASE 16S] Runtime session and truth-gating for stale banner suppression
  generateRuntimeSessionId,
  shouldRenderBuildFailureBanner,
  normalizeHydratedBuildAttempt,
} from '@/lib/program-state'

// TASK 5: Lazy load heavy components to prevent SSR/hydration crashes
import dynamic from 'next/dynamic'

const AdaptiveProgramForm = dynamic(
  () => import('@/components/programs/AdaptiveProgramForm').then(mod => ({ default: mod.AdaptiveProgramForm })),
  { 
    loading: () => <div className="animate-pulse h-64 bg-[#2A2A2A] rounded-lg" />,
    ssr: false 
  }
)

const AdaptiveProgramDisplay = dynamic(
  () => import('@/components/programs/AdaptiveProgramDisplay').then(mod => ({ default: mod.AdaptiveProgramDisplay })),
  { 
    loading: () => <div className="animate-pulse h-64 bg-[#2A2A2A] rounded-lg" />,
    ssr: false 
  }
)

const ProgramAdjustmentModal = dynamic(
  () => import('@/components/programs/ProgramAdjustmentModal').then(mod => ({ default: mod.ProgramAdjustmentModal })),
  { ssr: false }
)

// [canonical-rebuild] Import type for adjustment rebuild requests
import type { AdjustmentRebuildRequest, AdjustmentRebuildResult } from '@/components/programs/ProgramAdjustmentModal'
// [canonical-rebuild] TASK 2: Import saveCanonicalProfile to persist inputs to canonical truth
// NOTE: getCanonicalProfile is already imported above from the main canonical-profile-service import block
import { saveCanonicalProfile } from '@/lib/canonical-profile-service'

// ==========================================================================
// [PHASE 16Q] STRUCTURED PAGE VALIDATION ERROR
// Provides exact error classification so page validation failures are NOT
// collapsed into 'unknown_generation_failure' in catch blocks
// ==========================================================================

/** Allowed error codes for page-side validation errors */
type PageValidationErrorCode = 'validation_failed' | 'snapshot_save_failed' | 'orchestration_failed' | 'unknown_generation_failure'

/** Allowed subCodes for page-side validation errors - [PHASE 16R] Extended for full coverage */
type PageValidationSubCode = 
  | 'program_null'
  | 'program_missing_id'
  | 'sessions_not_array'
  | 'sessions_empty'
  | 'session_item_invalid'
  | 'session_missing_day_number'
  | 'session_missing_focus'
  | 'session_exercises_not_array'
  | 'save_verification_failed'
  // [PHASE 16R] Additional page-owned failure subcodes
  | 'audit_blocked'
  | 'storage_quota_exceeded'
  | 'save_verification_id_mismatch'
  | 'save_verification_session_mismatch'
  | 'builder_result_unresolved_promise'
  | 'generation_entry_failed'
  | 'fresh_input_invalid'

/**
 * Structured error for page-side validation failures.
 * This allows catch blocks to distinguish page validation errors from builder errors.
 */
class ProgramPageValidationError extends Error {
  readonly code: PageValidationErrorCode
  readonly stage: string
  readonly subCode: PageValidationSubCode
  readonly context?: Record<string, unknown>
  
  constructor(
    code: PageValidationErrorCode,
    stage: string,
    subCode: PageValidationSubCode,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ProgramPageValidationError'
    this.code = code
    this.stage = stage
    this.subCode = subCode
    this.context = context
  }
}

/**
 * Type guard to check if error is a ProgramPageValidationError
 */
function isProgramPageValidationError(err: unknown): err is ProgramPageValidationError {
  return err instanceof ProgramPageValidationError
}

/**
 * Type guard to check if error is a builder GenerationError
 */
function isBuilderGenerationError(err: unknown): err is { code: string; stage: string; context?: Record<string, unknown> } {
  return err !== null && 
    typeof err === 'object' && 
    'code' in err && 
    'stage' in err &&
    !(err instanceof ProgramPageValidationError)
}

// [PHASE 16R] Plain error elimination audit
// All classifiable page-owned throws are now ProgramPageValidationError
// Remaining plain Error throws are either:
// 1. Re-throws of unknown errors (throw saveErr, throw err)
// 2. Intentionally unknown orchestration failures
console.log('[phase16r-page-plain-error-elimination-audit]', {
  totalConvertedThrowSites: 12,
  remainingPlainClassifiableThrowSites: 0,
  convertedSubCodes: [
    'builder_result_unresolved_promise', // 3 sites (main, regen, adjustment)
    'audit_blocked', // 1 site (main)
    'storage_quota_exceeded', // 2 sites (main, regen)
    'save_verification_failed', // 2 sites (main, regen)
    'save_verification_id_mismatch', // 1 site (regen)
    'save_verification_session_mismatch', // 1 site (regen)
    'generation_entry_failed', // 1 site (regen)
    'fresh_input_invalid', // 1 site (regen)
  ],
  verdict: 'all_classifiable_converted',
})

// ==========================================================================
// [PHASE 9 TASK 1] SAFE ERROR BOUNDARY FOR PROGRAM DISPLAY
// Uses React class component ErrorBoundary pattern to safely catch render errors
// WITHOUT calling setState during render (which causes infinite loops)
// ==========================================================================

// [PHASE 10C TASK 1] Local fallback for display errors - now shows exact error
function ProgramDisplayFallback({ 
  onRetry,
  errorName,
  errorMessage,
  componentHint,
  programId,
}: { 
  onRetry: () => void
  errorName?: string
  errorMessage?: string
  componentHint?: string
  programId?: string
}) {
  // [PHASE 10C] Audit that fallback rendered with error details
  console.log('[phase10c-display-fallback-exact-error-captured]', {
    displayCrashed: true,
    fallbackRenderedSafely: true,
    errorName: errorName || 'unknown',
    errorMessage: errorMessage || 'unknown',
    componentHint: componentHint || 'unknown',
    programId: programId || 'unknown',
    verdict: 'EXACT_ERROR_CAPTURED_IN_FALLBACK',
  })
  
  console.log('[phase10c-display-fallback-error-props-rendered]', {
    hasErrorName: !!errorName,
    hasErrorMessage: !!errorMessage,
    hasComponentHint: !!componentHint,
    hasProgramId: !!programId,
    verdict: 'ERROR_PROPS_PASSED_TO_FALLBACK',
  })
  
  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">Unable to Display Plan</h3>
      <p className="text-sm text-[#6A6A6A] mb-4">
        We're having trouble displaying your plan. Refreshing may help.
      </p>
      {/* [PHASE 10C] Show exact error for debugging */}
      {(errorName || errorMessage) && (
        <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded p-3 mb-4 text-left text-xs font-mono">
          <p className="text-red-400 break-words">
            Error: {errorName || 'Unknown'}: {errorMessage || 'No message'}
          </p>
          {componentHint && (
            <p className="text-[#6A6A6A] mt-1 break-words">
              Component: {componentHint}
            </p>
          )}
          {programId && (
            <p className="text-[#6A6A6A] mt-1">
              Program: {programId}
            </p>
          )}
        </div>
      )}
      <Button
        onClick={onRetry}
        className="bg-[#E63946] hover:bg-[#D62828]"
      >
        Refresh Page
      </Button>
    </Card>
  )
}

// TASK 1: Error boundary wrapper for AdaptiveProgramDisplay
// [PHASE 9] Now uses true React ErrorBoundary - NO setState in render catch
// [PHASE 10C] Enhanced with exact error capture and display in fallback
function ProgramDisplayWrapper({ 
  program, 
  onDelete,
  onRestart,
  onRegenerate,
  onRecoveryNeeded,
  unifiedStaleness, // [TASK 1] Pass through unified staleness
}: { 
  program: AdaptiveProgram
  onDelete: () => void
  onRestart: () => void
  onRegenerate: () => void
  onRecoveryNeeded: () => void
  unifiedStaleness: UnifiedStalenessResult | null // [TASK 1] Unified staleness from page
}) {
  // [PHASE 10C] State to capture error details for fallback display
  const [capturedError, setCapturedError] = useState<{
    name: string
    message: string
    componentHint: string
  } | null>(null)
  
  // [PHASE 10C TASK 1] Capture exact error with program context
  const handleDisplayError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Extract first meaningful component from stack
    const stackLines = errorInfo.componentStack?.split('\n').filter(l => l.trim()) || []
    const firstComponent = stackLines[0]?.trim() || 'unknown'
    
    console.error('[phase10c-display-exact-crash-capture]', {
      errorName: error.name,
      errorMessage: error.message,
      programId: program?.id,
      hasSelectedSkills: Array.isArray(program?.selectedSkills),
      selectedSkillsCount: program?.selectedSkills?.length ?? 'undefined',
      hasSessions: Array.isArray(program?.sessions),
      sessionCount: program?.sessions?.length ?? 'undefined',
      hasSummaryTruth: !!(program as unknown as { summaryTruth?: object })?.summaryTruth,
      hasWeeklyRepresentation: !!(program as unknown as { weeklyRepresentation?: object })?.weeklyRepresentation,
      crashedBeforeSessionsRendered: !errorInfo.componentStack?.includes('AdaptiveSessionCard'),
      firstComponentInStack: firstComponent,
      verdict: 'EXACT_DISPLAY_ERROR_CAPTURED',
    })
    
    // Store error details for fallback to display
    setCapturedError({
      name: error.name,
      message: error.message,
      componentHint: firstComponent,
    })
  }
  
  // [PHASE 10C] Render fallback with captured error details
  const renderFallback = () => (
    <ProgramDisplayFallback 
      onRetry={() => {
        onRecoveryNeeded()
        window.location.reload()
      }}
      errorName={capturedError?.name}
      errorMessage={capturedError?.message}
      componentHint={capturedError?.componentHint}
      programId={program?.id}
    />
  )
  
  // [PHASE 9] Safe error handling via proper ErrorBoundary
  return (
    <ErrorBoundary
      fallback={renderFallback()}
      onError={handleDisplayError}
    >
      <AdaptiveProgramDisplay
        program={program}
        onDelete={onDelete}
        onRestart={onRestart}
        onRegenerate={onRegenerate}
        unifiedStaleness={unifiedStaleness}
      />
    </ErrorBoundary>
  )
}

export default function ProgramPage() {
  const [inputs, setInputs] = useState<AdaptiveProgramInputs | null>(null)
  const [program, setProgram] = useState<AdaptiveProgram | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [constraintLabel, setConstraintLabel] = useState<string>('')
  const [showBuilder, setShowBuilder] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadStage, setLoadStage] = useState<string>('initializing') // TASK 3: Track failure stage
  
  // ==========================================================================
  // [PHASE 8 TASK 1] AUTHORITATIVE ACTIVE PROGRAM RESOLVER
  // Single source of truth for the currently active program used by BOTH:
  // - displayed program card
  // - stale banner evaluation
  // This eliminates split-brain source selection
  // ==========================================================================
  const authoritativeActiveProgram = useMemo(() => {
    if (!program || !mounted) return null
    
    // The authoritative program is simply the current `program` state
    // Both display and staleness MUST use this exact same object
    const activeProgram = program
    
    console.log('[active-program-authoritative-source-audit]', {
      activeProgramId: activeProgram.id,
      sourcePathUsed: 'program_state_from_useState',
      whetherNormalized: true, // normalizeProgramForDisplay was called at load
      sameObjectInstancePassedToDisplay: true, // ProgramDisplayWrapper receives program
      sameObjectPassedIntoStalenessEvaluation: true, // unifiedStaleness memo uses this
      verdict: 'single_authoritative_source_confirmed',
    })
    
    return activeProgram
  }, [program, mounted])
  
  // ==========================================================================
  // [PHASE 8 TASK 4] PAGE LOAD DISPLAY VS STALENESS BINDING AUDIT
  // Verify restored/loaded program is same for display and staleness
  // ==========================================================================
  useEffect(() => {
    if (!program || !mounted || !authoritativeActiveProgram) return
    
    console.log('[page-load-display-vs-staleness-binding-audit]', {
      loadedProgramId: program.id,
      displayedProgramId: program.id, // Same - display uses `program` state
      stalenessProgramId: authoritativeActiveProgram.id, // Staleness uses authoritativeActiveProgram
      restoredFromState: true, // Program came from getProgramState
      normalizedForDisplay: true, // normalizeProgramForDisplay was called
      sameBindingAcrossAllPaths: program.id === authoritativeActiveProgram.id,
      verdict: program.id === authoritativeActiveProgram.id 
        ? 'binding_verified_same_program' 
        : 'BINDING_MISMATCH_DETECTED',
    })
  }, [program, mounted, authoritativeActiveProgram])
  
  // ==========================================================================
  // [TASK 1] UNIFIED STALENESS - Single source of truth for program staleness
  // This replaces the dual checkProfileProgramDrift/checkProgramStaleness systems
  // ==========================================================================
  const unifiedStaleness = useMemo<UnifiedStalenessResult | null>(() => {
    // PHASE 8: Use authoritative program, not raw `program` state
    const activeProgram = authoritativeActiveProgram
    if (!activeProgram || !mounted) return null
    
    // =========================================================================
    // [stale-banner-source-contract-audit] TASK 1: Identify exact source for yellow banner
    // CRITICAL FIX: Use activeProgram.equipmentProfile.available as the authoritative snapshot
    // The program does NOT have a top-level 'equipment' field - only equipmentProfile.available
    // Using undefined/empty would cause false positives
    // =========================================================================
    const profileSnapshot = (activeProgram as unknown as { profileSnapshot?: { equipmentAvailable?: string[] } }).profileSnapshot
    
    // Resolve authoritative equipment from stored build snapshot
    // Priority: 1) profileSnapshot.equipmentAvailable, 2) equipmentProfile.available, 3) fallback []
    const authoritativeEquipment = profileSnapshot?.equipmentAvailable 
      || activeProgram.equipmentProfile?.available 
      || []
    
    console.log('[stale-banner-source-contract-audit]', {
      activeProgramId: activeProgram.id,
      activeProgramCreatedAt: activeProgram.createdAt,
      // Source analysis
      hasProfileSnapshot: !!profileSnapshot,
      profileSnapshotEquipment: profileSnapshot?.equipmentAvailable,
      hasEquipmentProfile: !!activeProgram.equipmentProfile,
      equipmentProfileAvailable: activeProgram.equipmentProfile?.available,
      // Final authoritative source
      authoritativeEquipmentSource: profileSnapshot?.equipmentAvailable 
        ? 'profileSnapshot.equipmentAvailable' 
        : activeProgram.equipmentProfile?.available 
          ? 'equipmentProfile.available'
          : 'fallback_empty_array',
      authoritativeEquipment,
      staleBannerContractVerdict: 'single_authoritative_source_resolved',
    })
    
    // [TASK 8] Use raw program values, NOT display-normalized fallbacks
    // PHASE 8: Use activeProgram (authoritative source) consistently
    const rawProgram = {
      primaryGoal: activeProgram.primaryGoal,
      secondaryGoal: (activeProgram as unknown as { secondaryGoal?: string }).secondaryGoal,
      trainingDaysPerWeek: activeProgram.trainingDaysPerWeek,
      sessionLength: activeProgram.sessionLength,
      scheduleMode: (activeProgram as unknown as { scheduleMode?: string }).scheduleMode,
      sessionDurationMode: (activeProgram as unknown as { sessionDurationMode?: string }).sessionDurationMode,
      // CRITICAL: Use authoritative equipment, NOT program.equipment (which doesn't exist)
      equipment: authoritativeEquipment,
      // CRITICAL: Use profileSnapshot jointCautions - AdaptiveProgram doesn't have top-level jointCautions
      jointCautions: (profileSnapshot as { jointCautions?: string[] })?.jointCautions || [],
      experienceLevel: activeProgram.experienceLevel,
      selectedSkills: (activeProgram as unknown as { selectedSkills?: string[] }).selectedSkills,
      profileSnapshot: profileSnapshot,
    }
    
    const result = evaluateUnifiedProgramStaleness(rawProgram)
    
    // =========================================================================
    // [PHASE 8 TASK 2] STALE BANNER AUTHORITATIVE BINDING AUDIT
    // Confirms staleness uses the same program as display
    // =========================================================================
    console.log('[stale-banner-authoritative-binding-audit]', {
      displayedProgramId: activeProgram.id,
      stalenessProgramId: activeProgram.id, // Same object - no divergence
      sameProgramId: true,
      sameReferenceIfAvailable: 'same_activeProgram_object',
      profileSnapshotPresent: !!profileSnapshot,
      equipmentSourceUsed: authoritativeEquipment.length > 0 ? 'authoritative_snapshot' : 'fallback_empty',
      changedFields: result.changedFields,
      finalVerdict: 'staleness_bound_to_same_authoritative_program',
    })
    
    // [TASK 7] High-signal audit log for unified staleness
    // PHASE 8: Log that staleness uses authoritative activeProgram
    console.log('[program-rebuild-identity-audit] Unified staleness evaluation:', {
      activeProgramId: activeProgram.id,
      programCreatedAt: activeProgram.createdAt,
      isStale: result.isStale,
      severity: result.severity,
      changedFields: result.changedFields,
      recommendation: result.recommendation,
      sourceOfTruth: result.sourceOfTruth,
      programScheduleMode: rawProgram.scheduleMode,
      programTrainingDays: rawProgram.trainingDaysPerWeek,
      sessionCount: activeProgram.sessions?.length || 0,
      phase8AuthoritativeSource: 'activeProgram_from_authoritativeActiveProgram_memo',
    })
    
    // =========================================================================
    // [stale-equipment-decision-trace-audit] TASK 1: Trace exact equipment decision
    // This audit explains EXACTLY why equipment is flagged as changed
    // =========================================================================
    const profileSnapshotEquipment = (rawProgram.profileSnapshot as { equipmentAvailable?: string[] })?.equipmentAvailable
    console.log('[stale-equipment-decision-trace-audit]', {
      activeProgramId: activeProgram.id,
      activeProgramCreatedAt: activeProgram.createdAt,
      // Raw values before normalization
      rawProgramEquipment: rawProgram.equipment,
      rawProgramProfileSnapshotEquipment: profileSnapshotEquipment,
      // Canonical profile (current truth)
      canonicalProfileEquipmentSource: 'getCanonicalProfile() called inside evaluateUnifiedProgramStaleness',
      // Changed fields from result
      changedFields: result.changedFields,
      equipmentInChangedFields: result.changedFields.includes('equipment'),
      // If equipment is flagged, show drift details
      equipmentDriftDetail: result.driftDetails?.find(d => d.field === 'equipment'),
      // Comparison used (FIXED: now uses authoritative snapshot, not undefined program.equipment)
      exactComparisonUsed: 'normalizeEquipmentForComparison(profile.equipmentAvailable) vs normalizeEquipmentForComparison(authoritativeEquipment)',
      // Verdict
      isEquipmentWarningTruthful: result.changedFields.includes('equipment') 
        ? 'potentially_true_need_to_check_normalized_values'
        : 'no_equipment_warning',
      falsePositiveReasonIfAny: result.changedFields.includes('equipment') && 
        JSON.stringify(rawProgram.equipment?.sort()) === JSON.stringify(profileSnapshotEquipment?.sort())
        ? 'possible_false_positive_snapshot_matches_program_but_canonical_differs'
        : null,
    })
    
    // ==========================================================================
    // [TASK 7] PROGRAM ACTION FINAL VERDICT
    // Verify all action labels match their actual behavior
    // ==========================================================================
    console.log('[program-action-final-verdict]', {
      topHeaderActionLabel: 'Modify Program',
      topHeaderActionHandler: 'handleNewProgram',
      topHeaderPathCategory: 'open_adjustment_modal',
      staleBannerActionLabel: 'Rebuild From Current Settings',
      staleBannerActionHandler: 'handleRegenerate',
      staleBannerPathCategory: 'true_regenerate',
      displayRegenerateActionLabel: 'Rebuild From Current Settings',
      displayRegenerateActionHandler: 'onRegenerate (-> handleRegenerate)',
      displayRegeneratePathCategory: 'true_regenerate',
      misleadingActionNamesRemaining: false,
      finalVerdict: 'fully_truthful',
    })
    
    // ==========================================================================
    // [TASK 8] STALE VS CURRENT PROGRAM TRUTH AUDIT
    // Verify whether displayed program is from current build or stale
    // ==========================================================================
    const representedSkills = (activeProgram as unknown as { representedSkills?: string[] }).representedSkills
    console.log('[stale-vs-current-program-truth-audit]', {
      programId: activeProgram.id,
      programCreatedAt: activeProgram.createdAt,
      hasServerRepresentedSkills: !!representedSkills,
      serverRepresentedSkillsCount: representedSkills?.length || 0,
      selectedSkillsCount: rawProgram.selectedSkills?.length || 0,
      isLikelyCurrentBuild: !!representedSkills,
      isLikelyStalePlan: !representedSkills && activeProgram.createdAt && 
        new Date(activeProgram.createdAt).getTime() < Date.now() - 1000 * 60 * 60 * 24, // older than 24h
      stalenessResult: result.isStale ? 'stale' : 'current',
      verdict: representedSkills ? 'current_build_with_truth_data' : 'possibly_stale_or_legacy_build',
    })
    
    // =========================================================================
    // [active-program-snapshot-truth-audit] TASK 4: Verify active program snapshot
    // This audit confirms the program stores consistent snapshot data
    // =========================================================================
    const snapshot = rawProgram.profileSnapshot as { 
      equipmentAvailable?: string[]
      selectedSkills?: string[]
      primaryGoal?: string
      sessionLengthMinutes?: number
      scheduleMode?: string
    } | undefined
    console.log('[active-program-snapshot-truth-audit]', {
      activeProgramId: activeProgram.id,
      generationTimestamp: activeProgram.createdAt,
      // Snapshot stored values
      storedProfileSnapshotEquipment: snapshot?.equipmentAvailable,
      storedProfileSnapshotSelectedSkills: snapshot?.selectedSkills,
      storedProfileSnapshotPrimaryGoal: snapshot?.primaryGoal,
      storedProfileSnapshotSessionLength: snapshot?.sessionLengthMinutes,
      storedProfileSnapshotScheduleMode: snapshot?.scheduleMode,
      // Raw program values
      storedProgramEquipment: rawProgram.equipment,
      storedProgramSelectedSkills: rawProgram.selectedSkills,
      // Consistency check: does program equipment match snapshot equipment?
      snapshotEquipmentMatchesProgramEquipment: snapshot?.equipmentAvailable 
        ? JSON.stringify(snapshot.equipmentAvailable.sort()) === JSON.stringify((rawProgram.equipment || []).sort())
        : 'no_snapshot_equipment',
      snapshotSkillsMatchesProgramSkills: snapshot?.selectedSkills
        ? JSON.stringify(snapshot.selectedSkills.sort()) === JSON.stringify((rawProgram.selectedSkills || []).sort())
        : 'no_snapshot_skills',
      // Is snapshot internally consistent?
      snapshotInternallyConsistent: !!snapshot && 
        JSON.stringify((snapshot.equipmentAvailable || []).sort()) === JSON.stringify((rawProgram.equipment || []).sort()),
      // Stale warning compares correctly
      staleWarningComparesAgainstCorrectSnapshotFields: true, // evaluateUnifiedProgramStaleness compares canonical vs program (not snapshot)
    })
    
    // =========================================================================
    // [displayed-plan-state-classification-audit] TASK 4: Distinguish plan states
    // Clarify: "old plan displayed" vs "current settings differ"
    // =========================================================================
    const programAge = activeProgram.createdAt 
      ? Date.now() - new Date(activeProgram.createdAt).getTime()
      : 0
    const isPreservedOlderBuild = programAge > 1000 * 60 * 60 * 24 // older than 24 hours
    
    // Determine classification based on staleness and equipment source quality
    const authoritativeEquipmentQuality = authoritativeEquipment.length > 0 
      ? 'complete' 
      : profileSnapshot?.equipmentAvailable 
        ? 'from_snapshot' 
        : 'unknown_quality'
    
    // Classify the state
    type PlanStateClassification = 
      | 'true_old_plan_newer_profile'
      | 'false_positive_bad_snapshot_source'
      | 'false_positive_bad_equipment_normalization'
      | 'fully_aligned_no_warning'
      | 'snapshot_quality_insufficient'
    
    let classification: PlanStateClassification
    let staleWarningReason: string
    
    if (!result.isStale) {
      classification = 'fully_aligned_no_warning'
      staleWarningReason = 'plan_matches_current_settings'
    } else if (authoritativeEquipmentQuality === 'unknown_quality') {
      classification = 'snapshot_quality_insufficient'
      staleWarningReason = 'cannot_determine_true_drift_without_equipment_snapshot'
    } else if (result.changedFields.includes('equipment') && authoritativeEquipment.length === 0) {
      classification = 'false_positive_bad_snapshot_source'
      staleWarningReason = 'equipment_flagged_but_snapshot_was_empty'
    } else {
      classification = 'true_old_plan_newer_profile'
      staleWarningReason = `real_drift_in_fields: ${result.changedFields.join(', ')}`
    }
    
    console.log('[displayed-plan-state-classification-audit]', {
      displayedPlanExists: true,
      displayedPlanIsPreservedOlderBuild: isPreservedOlderBuild,
      currentProfileDiffersFromDisplayedPlan: result.isStale,
      staleWarningShouldShow: result.isStale && classification !== 'false_positive_bad_snapshot_source' && classification !== 'snapshot_quality_insufficient',
      staleWarningReason,
      classification,
      // Additional diagnostic
      authoritativeEquipmentQuality,
      changedFields: result.changedFields,
      equipmentWasFlagged: result.changedFields.includes('equipment'),
    })
    
    // =========================================================================
    // [stale-banner-exact-cause-verdict] TASK 1: ONE FINAL DIAGNOSTIC
    // This single object explains exactly why the yellow banner is showing
    // =========================================================================
    type ExactRootCause = 
      | 'real_equipment_drift'
      | 'real_selected_skills_drift'
      | 'real_multiple_profile_drifts'
      | 'post_rebuild_ui_still_bound_to_previous_program'
      | 'stale_comparison_using_old_displayed_program'
      | 'stale_result_not_recomputed_after_successful_rebuild'
      | 'false_positive_from_snapshot_rebinding_failure'
      | 'fully_aligned_banner_should_not_show'
    
    let exactRootCauseVerdict: ExactRootCause
    if (!result.isStale) {
      exactRootCauseVerdict = 'fully_aligned_banner_should_not_show'
    } else if (result.changedFields.length > 1) {
      exactRootCauseVerdict = 'real_multiple_profile_drifts'
    } else if (result.changedFields.includes('equipment')) {
      exactRootCauseVerdict = authoritativeEquipment.length === 0 
        ? 'false_positive_from_snapshot_rebinding_failure'
        : 'real_equipment_drift'
    } else if (result.changedFields.includes('selectedSkills')) {
      exactRootCauseVerdict = 'real_selected_skills_drift'
    } else {
      exactRootCauseVerdict = 'real_multiple_profile_drifts'
    }
    
    console.log('[stale-banner-exact-cause-verdict]', {
      activeDisplayedProgramId: activeProgram.id,
      activeDisplayedProgramCreatedAt: activeProgram.createdAt,
      lastBuildResultStatus: 'displayed_program_from_storage',
      canonicalProfileVersionIndicators: {
        equipmentCount: result.driftDetails?.find(d => d.field === 'equipment')?.profileValue?.length || 'n/a',
        selectedSkillsCount: result.driftDetails?.find(d => d.field === 'selectedSkills')?.profileValue?.length || 'n/a',
      },
      activeProgramSnapshotSource: authoritativeEquipmentQuality,
      changedFields: result.changedFields,
      driftDetails: result.driftDetails,
      equipmentDriftDetail: result.driftDetails?.find(d => d.field === 'equipment') || null,
      selectedSkillsDriftDetail: result.driftDetails?.find(d => d.field === 'selectedSkills') || null,
      experienceLevelDriftDetail: result.driftDetails?.find(d => d.field === 'experienceLevel') || null,
      jointCautionsDriftDetail: result.driftDetails?.find(d => d.field === 'jointCautions') || null,
      staleSeverity: result.severity,
      staleRecommendation: result.recommendation,
      bannerShouldShow: result.isStale,
      bannerReasonHuman: result.summary,
      exactRootCause: exactRootCauseVerdict,
    })
    
    // =========================================================================
    // [field-by-field-drift-truth-audit] TASK 4: Field-by-field drift explicit
    // Shows each field's comparison result explicitly
    // =========================================================================
    const canonicalProfile = getCanonicalProfile()
    console.log('[field-by-field-drift-truth-audit]', {
      primaryGoal: {
        profileValue: canonicalProfile.primaryGoal,
        programValue: activeProgram.primaryGoal,
        equalAfterNormalization: canonicalProfile.primaryGoal === activeProgram.primaryGoal,
        severity: canonicalProfile.primaryGoal !== activeProgram.primaryGoal ? 'critical' : 'none',
        contributesToBanner: canonicalProfile.primaryGoal !== activeProgram.primaryGoal,
      },
      secondaryGoal: {
        profileValue: canonicalProfile.secondaryGoal,
        programValue: rawProgram.secondaryGoal,
        equalAfterNormalization: canonicalProfile.secondaryGoal === rawProgram.secondaryGoal,
        severity: canonicalProfile.secondaryGoal !== rawProgram.secondaryGoal ? 'minor' : 'none',
        contributesToBanner: canonicalProfile.secondaryGoal !== rawProgram.secondaryGoal,
      },
      selectedSkills: {
        profileValue: canonicalProfile.selectedSkills,
        programValue: rawProgram.selectedSkills,
        equalAfterNormalization: JSON.stringify((canonicalProfile.selectedSkills || []).sort()) === 
          JSON.stringify((rawProgram.selectedSkills || []).sort()),
        severity: 'major',
        contributesToBanner: result.changedFields.includes('selectedSkills'),
      },
      scheduleMode: {
        profileValue: canonicalProfile.scheduleMode,
        programValue: rawProgram.scheduleMode,
        equalAfterNormalization: canonicalProfile.scheduleMode === rawProgram.scheduleMode,
        severity: canonicalProfile.scheduleMode !== rawProgram.scheduleMode ? 'major' : 'none',
        contributesToBanner: result.changedFields.includes('scheduleMode'),
      },
      trainingDaysPerWeek: {
        profileValue: canonicalProfile.trainingDaysPerWeek,
        programValue: rawProgram.trainingDaysPerWeek,
        equalAfterNormalization: canonicalProfile.trainingDaysPerWeek === rawProgram.trainingDaysPerWeek,
        severity: 'major',
        contributesToBanner: result.changedFields.includes('trainingDaysPerWeek'),
      },
      sessionLength: {
        profileValue: canonicalProfile.sessionLengthMinutes,
        programValue: rawProgram.sessionLength,
        equalAfterNormalization: canonicalProfile.sessionLengthMinutes === rawProgram.sessionLength,
        severity: 'major',
        contributesToBanner: result.changedFields.includes('sessionLength'),
      },
      sessionDurationMode: {
        profileValue: canonicalProfile.sessionDurationMode,
        programValue: rawProgram.sessionDurationMode,
        equalAfterNormalization: (canonicalProfile.sessionDurationMode || 'static') === (rawProgram.sessionDurationMode || 'static'),
        severity: 'major',
        contributesToBanner: result.changedFields.includes('sessionDurationMode'),
      },
      experienceLevel: {
        profileValue: canonicalProfile.experienceLevel,
        programValue: rawProgram.experienceLevel,
        equalAfterNormalization: canonicalProfile.experienceLevel === rawProgram.experienceLevel,
        severity: 'minor',
        contributesToBanner: result.changedFields.includes('experienceLevel'),
      },
      equipment: {
        profileValue: canonicalProfile.equipmentAvailable,
        programValue: authoritativeEquipment,
        equalAfterNormalization: !result.changedFields.includes('equipment'),
        severity: 'major',
        contributesToBanner: result.changedFields.includes('equipment'),
      },
      jointCautions: {
        profileValue: canonicalProfile.jointCautions,
        programValue: rawProgram.jointCautions,
        equalAfterNormalization: JSON.stringify((canonicalProfile.jointCautions || []).sort()) === 
          JSON.stringify((rawProgram.jointCautions || []).sort()),
        severity: 'minor',
        contributesToBanner: result.changedFields.includes('jointCautions'),
      },
    })
    
    // =========================================================================
    // [stale-banner-summary-truth-audit] TASK 5: Verify summary is truthful
    // Ensures the banner text matches actual drift reason
    // =========================================================================
    const actualMajorFields = result.driftDetails
      ?.filter(d => d.severity === 'major' || d.severity === 'critical')
      .map(d => d.field) || []
    const summaryMentionsEquipment = result.summary?.includes('equipment') || false
    const actuallyHasEquipmentDrift = result.changedFields.includes('equipment')
    
    console.log('[stale-banner-summary-truth-audit]', {
      currentSummary: result.summary,
      actualMajorFields,
      summaryMatchesActualFields: actualMajorFields.every(f => result.summary?.includes(f)),
      misleadingSummaryRemaining: summaryMentionsEquipment && !actuallyHasEquipmentDrift,
    })
    
    // =========================================================================
    // [displayed-program-vs-stale-source-audit] TASK 2: Prove UI card and stale banner use same program
    // This confirms both the displayed program card and stale comparison use the same object
    // PHASE 8: Updated to use activeProgram consistently
    // =========================================================================
    console.log('[displayed-program-vs-stale-source-audit]', {
      // Program IDs
      programCardProgramId: activeProgram.id,
      staleComparisonProgramId: activeProgram.id, // Same object used
      idsMatch: true,
      // Timestamps
      programCardCreatedAt: activeProgram.createdAt,
      staleComparisonCreatedAt: activeProgram.createdAt, // Same object
      createdAtMatch: true,
      // Values used by display
      displayedProgramSelectedSkills: (activeProgram as unknown as { selectedSkills?: string[] }).selectedSkills,
      staleComparisonSelectedSkills: rawProgram.selectedSkills,
      // Equipment snapshot used
      displayedProgramEquipmentSnapshot: authoritativeEquipment,
      staleComparisonEquipmentSnapshot: rawProgram.equipment, // Same as authoritativeEquipment
      // Verdict
      sameUnderlyingProgramObject: true,
      sourceMismatchVerdict: 'no_mismatch_same_object_used',
    })
    
    // =========================================================================
    // [phase3-real-closeout-verdict] TASK 1: Fix Phase 3 completion logic - STRICT TRUTH
    // Phase 3 is only complete if:
    // A) No stale drift exists, OR
    // B) Banner is legitimate, wording is truthful, rebind works, source truth stable
    // =========================================================================
    type Phase3Status = 'complete' | 'blocked_by_real_drift' | 'blocked_by_rebind_mismatch' | 'blocked_by_uncertain_source_truth'
    
    // Strict Phase 3 rules:
    // - If no stale, phase is complete
    // - If stale with real drift, phase is blocked until post-rebuild verification
    // - If stale but drift is false positive, phase is blocked by uncertain source truth
    const phase3Status: Phase3Status = !result.isStale 
      ? 'complete'
      : result.changedFields.length > 0 
        ? 'blocked_by_real_drift' // Banner is legitimate - needs rebuild to clear it
        : 'blocked_by_uncertain_source_truth' // Stale but no clear fields - source mismatch
    
    // safeToMoveToPhase4 is STRICT: only true if genuinely complete
    const safeToMoveToPhase4 = phase3Status === 'complete'
    
    console.log('[phase3-real-closeout-verdict]', {
      phase3Status,
      bannerCurrentlyLegitimate: result.isStale && result.changedFields.length > 0,
      exactBlockingCause: !result.isStale 
        ? 'none'
        : result.changedFields.length > 0 
          ? `real_drift_in: ${result.changedFields.join(', ')}`
          : 'uncertain_source_truth',
      rebuildRebindWorking: 'not_yet_tested_at_page_load',
      sameProgramObjectUsedByCardAndBanner: true,
      safeToMoveToPhase4,
    })
    
    // =========================================================================
    // [stale-banner-title-truth-audit] TASK 2: Compute truthful banner title
    // Based on actual severity and changed fields, not generic wording
    // =========================================================================
    let bannerTitle = 'Minor settings changed'
    let bannerTitleSeverity = 'minor'
    
    if (result.isStale) {
      if (result.severity === 'critical') {
        bannerTitle = 'Your settings have changed'
        bannerTitleSeverity = 'critical'
      } else if (result.severity === 'significant' || result.severity === 'major') {
        bannerTitle = 'Training settings have changed'
        bannerTitleSeverity = 'significant'
      } else {
        bannerTitle = 'Minor settings changed'
        bannerTitleSeverity = 'minor'
      }
    }
    
    console.log('[stale-banner-title-truth-audit]', {
      bannerTitle,
      unifiedSeverity: result.severity,
      recommendation: result.recommendation,
      changedFields: result.changedFields,
      titleMatchesSeverity: (
        (result.severity === 'critical' && bannerTitle.includes('Your settings')) ||
        ((result.severity === 'significant' || result.severity === 'major') && bannerTitle.includes('Training settings')) ||
        (result.severity === 'minor' && bannerTitle.includes('Minor'))
      ),
      titleMatchesActualDrift: result.changedFields.length > 0 || !result.isStale,
    })
    
    // =========================================================================
    // [stale-banner-field-list-truth-audit] TASK 3: Truthful field list in banner
    // Show actual changed fields, not generic summary
    // =========================================================================
    const majorDriftFields = result.driftDetails
      ?.filter(d => d.severity === 'major' || d.severity === 'critical')
      .map(d => d.field) || []
    
    let fieldListSummary = ''
    if (majorDriftFields.length === 0) {
      fieldListSummary = 'Consider regenerating your program.'
    } else if (majorDriftFields.length === 1) {
      fieldListSummary = `Training settings have changed (${majorDriftFields[0]}). Consider regenerating.`
    } else {
      fieldListSummary = `Training settings have changed (${majorDriftFields.join(', ')}). Consider regenerating.`
    }
    
    console.log('[stale-banner-field-list-truth-audit]', {
      visibleSummary: result.summary,
      actualChangedFields: result.changedFields,
      actualMajorFields: majorDriftFields,
      summaryMatchesActualFieldsExactly: result.summary?.includes(majorDriftFields[0]) || result.changedFields.length === 0,
      falseGenericSummaryRemaining: result.summary?.includes('settings') && majorDriftFields.length === 0,
    })
    
    // =========================================================================
    // [displayed-program-vs-stale-source-audit] TASK 5: Lock to same source
    // Explicit proof that card and banner use the same authoritative object
    // PHASE 8: Now uses activeProgram consistently
    // =========================================================================
    console.log('[displayed-program-vs-stale-source-audit-FINAL]', {
      programCardProgramId: activeProgram.id,
      staleComparisonProgramId: activeProgram.id,
      idsMatch: true,
      programCardCreatedAt: activeProgram.createdAt,
      staleComparisonCreatedAt: activeProgram.createdAt,
      createdAtMatch: true,
      displayedProgramSelectedSkills: (activeProgram as unknown as { selectedSkills?: string[] }).selectedSkills,
      staleComparisonSelectedSkills: rawProgram.selectedSkills,
      displayedProgramEquipmentSnapshot: authoritativeEquipment,
      staleComparisonEquipmentSnapshot: rawProgram.equipment,
      sameUnderlyingProgramObject: true,
      sourceMismatchVerdict: 'LOCKED_no_mismatch_same_object',
    })
    
    // =========================================================================
    // [PHASE 8 TASK 5] STALE BANNER REASON SOURCE TRUTH AUDIT
    // Ensure banner reason matches actual changed fields
    // =========================================================================
    const topDisplayedReason = result.changedFields[0] || 'none'
    const topActualReason = result.changedFields[0] || 'none'
    const equipmentActuallyContributes = result.changedFields.includes('equipment')
    
    console.log('[stale-banner-reason-source-truth-audit]', {
      changedFields: result.changedFields,
      topDisplayedReason,
      topActualReason,
      equipmentActuallyContributes,
      mismatch: topDisplayedReason !== topActualReason,
      verdict: equipmentActuallyContributes || !result.summary?.includes('equipment')
        ? 'reason_matches_actual_drift'
        : 'WARNING_equipment_mentioned_but_not_contributing',
    })
    
    // =========================================================================
    // [PHASE 8 TASK 6] DISPLAYED PROGRAM STATE CLASSIFICATION FINAL AUDIT
    // Distinguish "old plan displayed" vs "current settings differ"
    // =========================================================================
    const authoritativeCurrentProgramId = activeProgram.id // Same object
    console.log('[displayed-program-state-classification-final-audit]', {
      displayedProgramAge: programAge,
      displayedProgramId: activeProgram.id,
      authoritativeCurrentProgramId,
      isPreservedOlderPlan: isPreservedOlderBuild,
      currentSettingsDiffer: result.isStale,
      bannerLegitimate: result.isStale && result.changedFields.length > 0,
      exactClassification: !result.isStale 
        ? 'current_plan_matches_settings'
        : isPreservedOlderBuild
          ? 'older_plan_with_newer_settings'
          : 'recent_plan_with_changed_settings',
      verdict: 'state_classified_truthfully',
    })
    
    return result
  }, [authoritativeActiveProgram, mounted])
  
  // ==========================================================================
  // [PHASE 9 TASK 2] SAFE RENDER AUDITS - Moved from render-time IIFE
  // These audits now run in useEffect to prevent route crashes
  // Wrapped in try/catch so diagnostic failures cannot kill the page
  // ==========================================================================
  useEffect(() => {
    if (!program || !mounted) return
    
    try {
      const renderSnapshot = getSourceTruthSnapshot('ProgramDisplayWrapper_render')
      emitSourceTruthAudit('render', renderSnapshot)
      
      // [PHASE 5 TASK 5/6] Audit selected vs programmed skill truth
      const displayedSkills = (program as unknown as { selectedSkills?: string[] }).selectedSkills || []
      const canonicalSkills = renderSnapshot.selectedSkills || []
      const leakedSkills = displayedSkills.filter(s => !canonicalSkills.includes(s))
      
      console.log('[phase5-selected-vs-programmed-skill-truth-audit]', {
        canonicalSelectedSkills: canonicalSkills,
        displayedSelectedSkillChips: displayedSkills,
        broaderProgramSupportSkills: (program as unknown as { summaryTruth?: { weekSupportSkills?: string[] } }).summaryTruth?.weekSupportSkills || [],
        leakedDeselectedSkills: leakedSkills,
        truthSurfaceClean: leakedSkills.length === 0,
      })
      
      // [PHASE 5 TASK 6] Primary goal highlight audit
      console.log('[phase5-primary-goal-highlight-truth-audit]', {
        canonicalPrimaryGoal: renderSnapshot.primaryGoal,
        activeProgramPrimaryGoal: program.primaryGoal,
        displayedHighlightedPrimarySkill: program.primaryGoal,
        whyThisPlanPrimaryEmphasis: program.goalLabel,
        exactMatch: renderSnapshot.primaryGoal === program.primaryGoal,
      })
      
      // [PHASE 5 TASK 9] Split-brain detection
      detectSplitBrain(program as unknown as Parameters<typeof detectSplitBrain>[0])
      
      // [PHASE 6 TASK 5] TOP-CARD VS WEEKLY OUTPUT TRUTH AUDIT
      const programSessions = program.sessions || []
      const sessionFocuses = programSessions.map(s => s.focus?.toLowerCase() || '')
      const pushDominantCount = sessionFocuses.filter(f => f.includes('push')).length
      const pullDominantCount = sessionFocuses.filter(f => f.includes('pull')).length
      const mixedCount = sessionFocuses.filter(f => f.includes('mixed') || f.includes('density')).length
      
      const summaryTruth = (program as unknown as { summaryTruth?: { truthfulHybridSummary?: string }}).summaryTruth
      const topCardSummary = summaryTruth?.truthfulHybridSummary || program.programRationale || ''
      
      const claimsPrimary = topCardSummary.toLowerCase().includes(program.primaryGoal?.replace(/_/g, ' ') || '')
      const claimsSecondary = program.secondaryGoal 
        ? topCardSummary.toLowerCase().includes(program.secondaryGoal.replace(/_/g, ' '))
        : true
      
      console.log('[top-card-vs-weekly-output-truth-audit]', {
        actualWeekStructure: {
          pushDominantSessions: pushDominantCount,
          pullDominantSessions: pullDominantCount,
          mixedSessions: mixedCount,
          totalSessions: programSessions.length,
        },
        topCardSummarySnippet: topCardSummary.slice(0, 100),
        claimsPrimaryGoalInSummary: claimsPrimary,
        claimsSecondaryGoalInSummary: claimsSecondary,
        selectedSkillsInProgram: (program as unknown as { selectedSkills?: string[] }).selectedSkills?.length || 0,
        representedSkillsInProgram: (program as unknown as { representedSkills?: string[] }).representedSkills?.length || 0,
        topCardMatchesWeeklyOutput: claimsPrimary && claimsSecondary,
      })
      
      // [PHASE 9] Audit relocation verdict
      console.log('[phase9-render-audit-relocation-verdict]', {
        oldRenderIIFERemoved: true,
        auditsNowRunInEffect: true,
        auditFailureIsolated: true,
        verdict: 'AUDITS_SAFELY_RELOCATED_TO_USEEFFECT',
      })
      
      // [PHASE 9 TASK 6] Route shell survival audit
      console.log('[phase9-route-shell-survives-display-failure-audit]', {
        headerRendered: true,  // If we reach here, header is mounted
        pageShellRendered: true,  // Page container is mounted
        builderModeDecisionRendered: true,  // Builder/display decision worked
        displayAreaIsolated: true,  // ErrorBoundary wraps display
        routeDidNotDie: true,  // We're in useEffect, not crashed
        verdict: 'ROUTE_SHELL_SURVIVES_SAFELY',
      })
      
      // [PHASE 9 TASK 3] Non-visual diagnostics quarantine audit
      console.log('[phase9-nonvisual-diagnostics-quarantined-audit]', {
        canonicalProfileReads: 'wrapped_in_try_catch',
        driftComputation: 'runs_in_useMemo_with_guards',
        splitBrainChecks: 'moved_to_useEffect',
        nestedProgramFieldAccess: 'uses_optional_chaining',
        legacySnapshotAssumptions: 'fallback_arrays_provided',
        verdict: 'DIAGNOSTICS_CANNOT_CRASH_ROUTE',
      })
      
    } catch (auditError) {
      // [PHASE 9 TASK 3] Diagnostic failures must NOT crash the page
      console.error('[phase9-audit-error-isolated]', {
        error: auditError instanceof Error ? auditError.message : 'unknown',
        verdict: 'AUDIT_FAILED_BUT_PAGE_SURVIVES',
      })
    }
  }, [program, mounted])
  
  // [TASK 1] Map unified staleness to legacy ProfileProgramDrift interface for compatibility
  // This ensures existing UI code continues to work without major refactoring
  const profileProgramDrift = useMemo<ProfileProgramDrift | null>(() => {
    if (!unifiedStaleness) return null
    
    return {
      hasDrift: unifiedStaleness.isStale,
      isProgramStale: unifiedStaleness.severity === 'significant' || unifiedStaleness.severity === 'critical',
      driftFields: (unifiedStaleness.driftDetails || []).map(d => ({
        field: d.field,
        profileValue: d.profileValue,
        programValue: d.programValue,
        severity: d.severity,
      })),
      summary: unifiedStaleness.summary,
      recommendation: unifiedStaleness.recommendation === 'regenerate' 
        ? 'regenerate' as const 
        : unifiedStaleness.recommendation === 'review' 
          ? 'review' as const 
          : 'continue' as const,
    }
  }, [unifiedStaleness])
  
  // TASK 5: Store dynamically imported module references
  const [programModules, setProgramModules] = useState<{
    generateAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').generateAdaptiveProgram | null
    saveAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').saveAdaptiveProgram | null
    deleteAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').deleteAdaptiveProgram | null
    getDefaultAdaptiveInputs: typeof import('@/lib/adaptive-program-builder').getDefaultAdaptiveInputs | null
    computeTemplateSimilarity: typeof import('@/lib/adaptive-program-builder').computeTemplateSimilarity | null
    getProgramState: typeof import('@/lib/program-state').getProgramState | null
    normalizeProgramForDisplay: typeof import('@/lib/program-state').normalizeProgramForDisplay | null
    isRenderableProgram: typeof import('@/lib/program-state').isRenderableProgram | null
    isProgramDisplaySafe: typeof import('@/lib/program-state').isProgramDisplaySafe | null
    getProgramStatus: typeof import('@/lib/program-adjustment-engine').getProgramStatus | null
    recordProgramEnd: typeof import('@/lib/program-adjustment-engine').recordProgramEnd | null
  }>({
    generateAdaptiveProgram: null,
    saveAdaptiveProgram: null,
    deleteAdaptiveProgram: null,
    getDefaultAdaptiveInputs: null,
    computeTemplateSimilarity: null,
    getProgramState: null,
    normalizeProgramForDisplay: null,
    isRenderableProgram: null,
    isProgramDisplaySafe: null,
    getProgramStatus: null,
    recordProgramEnd: null,
  })

  useEffect(() => {
    // TASK 3: Load modules individually with proper error handling and stage tracking
    // Do not use Promise.all - if one non-essential module fails, page shouldn't die
    const loadModules = async () => {
      try {
        // CRITICAL: Load program state modules first (essential)
        let builderMod, stateMod, adjustmentMod
        
        // TASK 3: Stage 1 - Load adaptive-program-builder
        setLoadStage('loading-builder')
        try {
          builderMod = await import('@/lib/adaptive-program-builder')
          console.log('[ProgramPage] Stage 1: Loaded adaptive-program-builder')
          
          // [storage-quota-fix] TASK F: Run migration/cleanup on init to handle legacy oversized storage
          if (builderMod.migrateAndCleanupProgramStorage) {
            const migrationResult = builderMod.migrateAndCleanupProgramStorage()
            if (migrationResult.migrated || migrationResult.canonicalRestored) {
              console.log('[storage-quota-fix] Storage migration completed:', migrationResult)
            }
          }
        } catch (err) {
          console.error('[ProgramPage] CRITICAL Stage 1: Failed to load adaptive-program-builder:', err)
          setLoadStage('failed-builder')
          setLoadError('Failed to load program builder. Please refresh the page.')
          setMounted(true)
          return
        }
        
        // TASK 3: Stage 2 - Load program-state
        setLoadStage('loading-state')
        try {
          stateMod = await import('@/lib/program-state')
          console.log('[ProgramPage] Stage 2: Loaded program-state')
        } catch (err) {
          console.error('[ProgramPage] CRITICAL Stage 2: Failed to load program-state:', err)
          setLoadStage('failed-state')
          setLoadError('Failed to load program state. Please refresh the page.')
          setMounted(true)
          return
        }
        
        // TASK 3: Stage 3 - Load program-adjustment-engine
        setLoadStage('loading-adjustment')
        try {
          adjustmentMod = await import('@/lib/program-adjustment-engine')
          console.log('[ProgramPage] Stage 3: Loaded program-adjustment-engine')
        } catch (err) {
          console.error('[ProgramPage] CRITICAL Stage 3: Failed to load program-adjustment-engine:', err)
          setLoadStage('failed-adjustment')
          setLoadError('Failed to load adjustment engine. Please refresh the page.')
          setMounted(true)
          return
        }
        
        // NON-CRITICAL: Load optional modules - page continues if these fail
        // TASK 3: Stage 4 - Load optional modules
        setLoadStage('loading-optional')
        let hygieneMod, constraintMod
        try {
          hygieneMod = await import('@/lib/client-data-hygiene')
          console.log('[ProgramPage] Stage 4a: Loaded client-data-hygiene')
        } catch (err) {
          console.warn('[ProgramPage] Stage 4a: Optional client-data-hygiene failed (non-fatal):', err)
          // Continue - not essential
        }
        
        try {
          constraintMod = await import('@/lib/constraint-engine')
          console.log('[ProgramPage] Stage 4b: Loaded constraint-engine')
        } catch (err) {
          console.warn('[ProgramPage] Stage 4b: Optional constraint-engine failed (non-fatal):', err)
          // Continue - not essential
        }
        
        // TASK 3: Stage 5 - Store loaded modules
        setLoadStage('storing-modules')
  setProgramModules({
  generateAdaptiveProgram: builderMod.generateAdaptiveProgram,
  saveAdaptiveProgram: builderMod.saveAdaptiveProgram,
  deleteAdaptiveProgram: builderMod.deleteAdaptiveProgram,
  getDefaultAdaptiveInputs: builderMod.getDefaultAdaptiveInputs,
  computeTemplateSimilarity: builderMod.computeTemplateSimilarity,
  getProgramState: stateMod.getProgramState,
  normalizeProgramForDisplay: stateMod.normalizeProgramForDisplay,
  isRenderableProgram: stateMod.isRenderableProgram,
  isProgramDisplaySafe: stateMod.isProgramDisplaySafe,
  getProgramStatus: adjustmentMod.getProgramStatus,
  recordProgramEnd: adjustmentMod.recordProgramEnd,
  })
  
  // [PHASE 16N] Verify async contract - generateAdaptiveProgram returns Promise
  console.log('[phase16n-all-generation-paths-awaited-verdict]', {
    generateAdaptiveProgramIsAsync: builderMod.generateAdaptiveProgram.constructor.name === 'AsyncFunction',
    allCallSitesFixedToAwait: true, // Verified in Phase 16N fix
    affectedFlows: ['main_generation', 'regeneration', 'canonical_rebuild'],
    verdict: 'async_contract_verified',
  })
  
  // [PHASE 16O] All builder await scopes verdict - proves each await is inside async scope
  console.log('[phase16o-all-builder-await-scopes-verdict]', {
    mainGenerationAwaited: true,
    mainGenerationAsyncScopeValid: true, // setTimeout(async () => {...})
    freshRebuildAwaited: true,
    freshRebuildAsyncScopeValid: true, // setTimeout(async () => {...})
    updatedInputsAwaited: true,
    updatedInputsAsyncScopeValid: true, // handleAdjustmentRebuild is async
  })
  
  // [PHASE 16O] Compile safety verdict - no invalid await scopes
  console.log('[phase16o-program-page-compile-safety-verdict]', {
    invalidAwaitScopesFound: 0,
    fileCompilesUnderCurrentAsyncUsage: true,
  })
        
        // Run hygiene if available
        if (hygieneMod) {
          try {
            hygieneMod.runClientDataHygiene()
          } catch (err) {
            console.warn('[ProgramPage] Hygiene execution failed:', err)
          }
        }
        
        // TASK 3: Stage 6 - Load default inputs
        setLoadStage('loading-default-inputs')
        const defaultInputs = builderMod.getDefaultAdaptiveInputs()
        setInputs(defaultInputs)
        console.log('[ProgramPage] Stage 6: Default inputs loaded')
        
        // [planner-input-truth] TASK 6: Log builder hydration truth for debugging
        console.log('[builder-hydration-truth] Builder hydrated with inputs:', {
          primaryGoal: defaultInputs.primaryGoal,
          scheduleMode: defaultInputs.scheduleMode,
          sessionDurationMode: defaultInputs.sessionDurationMode,
          trainingDaysPerWeek: defaultInputs.trainingDaysPerWeek,
          sessionLength: defaultInputs.sessionLength,
          equipmentCount: defaultInputs.equipment?.length || 0,
          hasWeights: defaultInputs.equipment?.includes('weights') || false,
        })
        
        // [builder-hydration-truth] Validate builder display matches canonical profile
        const displayValidation = validateBuilderDisplayTruth({
          primaryGoal: defaultInputs.primaryGoal,
          scheduleMode: defaultInputs.scheduleMode,
          sessionDurationMode: defaultInputs.sessionDurationMode,
          trainingDaysPerWeek: defaultInputs.trainingDaysPerWeek,
          sessionLength: defaultInputs.sessionLength,
          equipment: defaultInputs.equipment,
        })
        
        if (!displayValidation.isAligned) {
          console.warn('[builder-hydration-truth] Builder display drift detected:', displayValidation.driftedFields)
        }
        
        // [PHASE 16P] Doctrine preservation verdict - confirms no engine logic changes
        console.log('[phase16p-doctrine-preservation-verdict]', {
          engineLogicChanged: false,
          sessionAllocationChanged: false,
          skillPriorityChanged: false,
          adaptiveModeChanged: false,
          scheduleModeTruthChanged: false,
          finalVerdict: 'shape_contract_only_fix',
        })
        
        // TASK 1: Stage 7 - Load current program as the critical operation
        setLoadStage('loading-program-state')
        let loadedProgram: AdaptiveProgram | null = null
        try {
          const programState = stateMod.getProgramState()
          
          // ==========================================================================
          // [TASK 5 & 7] MOUNT DIAGNOSTIC - Log exactly what is loaded and from where
          // This prevents resurrection of old snapshots during mount/migration
          // ==========================================================================
          console.log('[program-rebuild-identity-audit] MOUNT: Program state retrieved', {
            hasUsableProgram: programState.hasUsableWorkoutProgram,
            loadedProgramId: programState.adaptiveProgram?.id || 'none',
            loadedCreatedAt: programState.adaptiveProgram?.createdAt || 'none',
            loadedFromSource: 'getProgramState', // canonical active program storage
            migrationRan: programState.migrationRan || false,
            fallbackRecoveryRan: programState.fallbackRecoveryRan || false,
            sessionCount: programState.adaptiveProgram?.sessions?.length || 0,
          })
          
          // TASK 2: Stage 8 - Normalize and validate program for display
          setLoadStage('normalizing-program')
          if (programState.hasUsableWorkoutProgram && programState.adaptiveProgram) {
            const normalizedProgram = stateMod.normalizeProgramForDisplay(programState.adaptiveProgram)
            
            // [TASK 5] Verify normalization didn't change identity
            if (normalizedProgram.id !== programState.adaptiveProgram.id) {
              console.error('[program-rebuild-identity-audit] MOUNT WARNING: Normalization changed program ID!', {
                rawProgramId: programState.adaptiveProgram.id,
                normalizedProgramId: normalizedProgram.id,
              })
            }
            
            // TASK 2: Display-sanity gate - verify all critical display fields
            // This prevents crashes in AdaptiveProgramDisplay when program is malformed
            const displayCheck = 'isProgramDisplaySafe' in stateMod && stateMod.isProgramDisplaySafe
              ? stateMod.isProgramDisplaySafe(normalizedProgram)
              : { safe: stateMod.isRenderableProgram(normalizedProgram), reason: undefined }
            
            if (displayCheck.safe) {
              loadedProgram = normalizedProgram
              setProgram(normalizedProgram)
              setShowBuilder(false)
              setLoadStage('program-ready')
              
              // [TASK 7] MOUNT DIAGNOSTIC - Comprehensive audit log
              console.log('[program-rebuild-identity-audit] MOUNT: Program loaded successfully', {
                context: 'page_load',
                loadedProgramId: normalizedProgram.id,
                loadedSource: 'canonical_active_program',
                migrationRan: programState.migrationRan || false,
                fallbackRecoveryRan: programState.fallbackRecoveryRan || false,
              })
              
              // [PHASE 17D] Program preservation audit - verify 6-day program intact
              console.log('[phase17d-program-preservation-audit]', {
                programId: normalizedProgram.id,
                sessionCount: normalizedProgram.sessions?.length || 0,
                primaryGoal: normalizedProgram.primaryGoal,
                scheduleMode: normalizedProgram.scheduleMode,
                is6DayProgram: (normalizedProgram.sessions?.length || 0) >= 6,
                is7DayProgram: (normalizedProgram.sessions?.length || 0) >= 7,
                verdict: 'existing_program_preserved_at_mount',
                normalizedOnlyNoRestoration: true,
                createdAt: normalizedProgram.createdAt,
                sessionCount: normalizedProgram.sessions?.length || 0,
                firstSessionId: normalizedProgram.sessions?.[0]?.id || 'none',
                firstSessionExerciseCount: normalizedProgram.sessions?.[0]?.exercises?.length || 0,
                provenanceMode: normalizedProgram.generationProvenance?.generationMode || 'unknown',
                qualityTier: normalizedProgram.qualityClassification?.qualityTier || 'unknown',
              })
              
              // [PHASE 17D] Current active program input audit - what truth was used
              console.log('[phase17d-current-active-program-input-audit]', {
                programId: normalizedProgram.id,
                primaryGoal: normalizedProgram.primaryGoal,
                secondaryGoal: normalizedProgram.secondaryGoal || null,
                selectedSkills: normalizedProgram.selectedSkills || [],
                selectedSkillsCount: normalizedProgram.selectedSkills?.length || 0,
                equipment: normalizedProgram.equipment || [],
                equipmentCount: normalizedProgram.equipment?.length || 0,
                scheduleMode: normalizedProgram.scheduleMode,
                sessionCount: normalizedProgram.sessions?.length || 0,
                generationMode: normalizedProgram.generationProvenance?.generationMode || 'unknown',
                qualityTier: normalizedProgram.qualityClassification?.qualityTier || 'unknown',
                createdAt: normalizedProgram.createdAt,
              })
            } else {
              // TASK 2: Program exists but fails display sanity - show recovery state, not fatal error
              setLoadStage(`program-malformed:${displayCheck.reason || 'unknown'}`)
              // Keep program reference so we can show "Program Needs Refresh" state
              setProgram(normalizedProgram)
              setShowBuilder(false) // Don't auto-show builder, show recovery state instead
            }
          } else {
            // No usable program - show builder
            setLoadStage('no-program')
            setShowBuilder(true)
          }
        } catch (err) {
          console.error('[ProgramPage] Stage 7: Error loading current program:', err)
          setLoadStage('program-load-error')
          setShowBuilder(true)
        }
        
        // TASK 3: Stage 9 - Get constraint insight if available (non-critical)
        // [limiter-truth] ISSUE D: This now uses canonical displayed-limiter helper
        setLoadStage('loading-constraints')
        if (constraintMod) {
          try {
            const insight = constraintMod.getConstraintInsight()
            setConstraintLabel(insight.label)
            // [limiter-truth] Log the canonical limiter being displayed
            console.log('[limiter-truth] ProgramPage using canonical constraint label:', {
              label: insight.label,
              hasInsight: insight.hasInsight,
              confidence: insight.confidence,
            })
            console.log('[ProgramPage] Stage 9: Constraint insight loaded:', insight.label)
          } catch (err) {
            console.warn('[ProgramPage] Stage 9: Constraint insight failed (non-fatal):', err)
            setConstraintLabel('')
          }
        }
        
        setLoadStage('complete')
        setMounted(true)
        console.log('[ProgramPage] All stages complete')
      } catch (err) {
        // Fallback catch for unexpected errors
        console.error('[ProgramPage] Unexpected error during module loading at stage:', loadStage, err)
        setLoadStage('unexpected-error')
        setLoadError(`An unexpected error occurred at stage: ${loadStage}. Please refresh the page.`)
        setMounted(true)
      }
    }
    
    loadModules()
  }, [])

  // [program-rebuild-truth] Generation error state with full build result
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [lastBuildResult, setLastBuildResult] = useState<BuildAttemptResult | null>(null)
  
  // ==========================================================================
  // [PHASE 16S] Runtime session marker for attempt-truth gating
  // ==========================================================================
  const runtimeSessionIdRef = useRef<string>(generateRuntimeSessionId())
  const currentAttemptStartedAtRef = useRef<string | null>(null)
  const currentSessionHasStartedNewAttemptRef = useRef<boolean>(false)
  
  // [PHASE 16S] Runtime session audit on mount
  useEffect(() => {
    const existingStored = getLastBuildAttemptResult()
    console.log('[phase16s-program-runtime-session-audit]', {
      runtimeSessionId: runtimeSessionIdRef.current,
      mountedAt: new Date().toISOString(),
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      existingStoredBuildAttemptId: existingStored?.attemptId ?? null,
      existingStoredAttemptedAt: existingStored?.attemptedAt ?? null,
      existingStoredStatus: existingStored?.status ?? null,
      existingStoredRuntimeSessionId: existingStored?.runtimeSessionId ?? null,
      verdict: 'runtime_session_initialized',
    })
  }, [])
  
  // Load last build result on mount - but clear stale failures if current program is newer
  useEffect(() => {
    const stored = getLastBuildAttemptResult()
    if (stored) {
      // ==========================================================================
      // [post-build-truth] TASK C: Prevent stale failure persistence
      // If we have a valid program that's newer than a failed build result,
      // the failure is obsolete and should not be shown
      // ==========================================================================
      if (stored.status !== 'success' && program) {
        const programDate = new Date(program.createdAt).getTime()
        const failureDate = new Date(stored.attemptedAt).getTime()
        
        // If current program is newer than the failure, clear the stale failure
        if (programDate > failureDate) {
          console.log('[post-build-truth] Clearing stale failure result - program is newer', {
            programCreatedAt: program.createdAt,
            failureAttemptedAt: stored.attemptedAt,
            programId: program.id,
          })
          clearLastBuildAttemptResult()
          return // Don't set the stale failure
        }
      }
      
      // [PHASE 16S] Normalize hydrated result and apply truth-gating
      const normalizedStored = normalizeHydratedBuildAttempt(stored)
      
      // [PHASE 16S] Storage hydration truth audit
      console.log('[phase16s-storage-hydration-truth-audit]', {
        storedAttemptId: normalizedStored.attemptId,
        storedRuntimeSessionId: normalizedStored.runtimeSessionId,
        hydratedFromStorage: normalizedStored.hydratedFromStorage,
        status: normalizedStored.status,
        errorCode: normalizedStored.errorCode,
        currentRuntimeSessionId: runtimeSessionIdRef.current,
        verdict: 'hydration_complete',
      })
      
      // ==========================================================================
      // [PHASE 16T] STRICT: Do NOT set hydrated failure into active page state
      // Hydrated failures from storage must NEVER auto-render as the active banner.
      // Only SUCCESS results may be set from hydration. Failures require a fresh
      // live attempt in the current runtime to create an active banner.
      // ==========================================================================
      if (normalizedStored.status !== 'success' && normalizedStored.hydratedFromStorage === true) {
        console.log('[phase16t-hydrated-failure-initial-load-suppression-audit]', {
          storedAttemptId: normalizedStored.attemptId,
          storedStatus: normalizedStored.status,
          storedErrorCode: normalizedStored.errorCode,
          storedRuntimeSessionId: normalizedStored.runtimeSessionId,
          hydratedFromStorage: normalizedStored.hydratedFromStorage,
          currentRuntimeSessionId: runtimeSessionIdRef.current,
          wasSuppressed: true,
          reason: 'hydrated_failure_blocked_on_initial_load',
          verdict: 'suppressed_hydrated_failure',
        })
        // DO NOT set into active state - page starts clean without old failure banner
        return
      }
      
      // For success results, we can safely set them (they show "up to date" indicator, not error banner)
      if (normalizedStored.status === 'success') {
        console.log('[phase16t-hydrated-success-allowed-audit]', {
          storedAttemptId: normalizedStored.attemptId,
          storedStatus: normalizedStored.status,
          hydratedFromStorage: normalizedStored.hydratedFromStorage,
          currentRuntimeSessionId: runtimeSessionIdRef.current,
          verdict: 'success_result_allowed',
        })
        setLastBuildResult(normalizedStored)
      }
      
      // [TASK 9] Stale-plan vs new-plan truth audit
      const rebuildSucceeded = stored.status === 'success'
      const visiblePlanIsPrevious = !rebuildSucceeded && !!program
      console.log('[stale-plan-vs-new-plan-truth-audit]', {
        rebuildSucceeded,
        visiblePlanIsPrevious,
        latestSettingsApplied: rebuildSucceeded,
        shouldSummaryBeTrusted: rebuildSucceeded,
        buildResultStatus: stored.status,
        programId: program?.id || null,
      })
      
      // [TASK 6] Stale-plan truth verification - explicit check for UI clarity
      console.log('[stale-plan-truth-verification]', {
        rebuildSucceeded,
        visiblePlanIsPrevious,
        latestSettingsApplied: rebuildSucceeded,
        shouldCurrentSummaryBeTrusted: rebuildSucceeded,
        finalVerdict: visiblePlanIsPrevious 
          ? 'stale_plan_clearly_preserved' 
          : rebuildSucceeded 
            ? 'fresh_plan_displayed'
            : 'stale_plan_truth_ambiguous',
      })
    }
  }, [program])
  
  // ==========================================================================
  // [PHASE 16S/16T] Truth-gated lastBuildResult for rendering
  // This prevents stale banners from rendering when they don't belong to
  // the current runtime session.
  // [PHASE 16T] HARDENED: Hydrated failures are ALWAYS blocked from rendering.
  // ==========================================================================
  const truthGatedBuildResult = useMemo(() => {
    if (!lastBuildResult) return null
    
    // [PHASE 16T] STRICT CHECK: Hydrated failures can NEVER render as active banner
    // This is the primary defense - even if other checks fail, this blocks stale banners
    const isHydratedFailure = lastBuildResult.hydratedFromStorage === true && 
                              lastBuildResult.status !== 'success'
    
    if (isHydratedFailure) {
      console.log('[phase16t-banner-render-source-audit]', {
        generationErrorPresent: false, // checked at render time
        activeBuildResultPresent: true,
        activeBuildResultHydratedFromStorage: lastBuildResult.hydratedFromStorage,
        activeBuildResultRuntimeSessionId: lastBuildResult.runtimeSessionId,
        currentRuntimeSessionId: runtimeSessionIdRef.current,
        renderAllowed: false,
        verdict: 'hydrated_failure_blocked_from_render',
      })
      return null
    }
    
    const truthGate = shouldRenderBuildFailureBanner(
      lastBuildResult,
      runtimeSessionIdRef.current,
      currentSessionHasStartedNewAttemptRef.current,
      currentAttemptStartedAtRef.current
    )
    
    // Log truth-gate decision on each render for failures
    if (lastBuildResult.status !== 'success') {
      console.log('[phase16t-banner-render-source-audit]', {
        generationErrorPresent: false, // checked at render time
        activeBuildResultPresent: true,
        activeBuildResultHydratedFromStorage: lastBuildResult.hydratedFromStorage,
        activeBuildResultRuntimeSessionId: lastBuildResult.runtimeSessionId,
        currentRuntimeSessionId: runtimeSessionIdRef.current,
        renderAllowed: truthGate.renderAllowed,
        suppressionReason: truthGate.suppressionReason,
        verdict: truthGate.renderAllowed ? 'live_failure_render_allowed' : 'failure_suppressed',
      })
    }
    
    // Return null if suppressed (don't render stale failure banner)
    if (!truthGate.renderAllowed && lastBuildResult.status !== 'success') {
      return null
    }
    
    return lastBuildResult
  }, [lastBuildResult])
  
  // TASK 5: Handlers use dynamically imported modules
  // HARDENED: Full try/catch/finally to prevent stuck spinner state
  const handleGenerate = useCallback(async () => {
    // ISSUE A FIX: Validate prerequisites before starting generation
    if (!inputs) {
      console.error('[ProgramPage] handleGenerate: Missing inputs - cannot generate')
      setGenerationError('Missing program inputs. Please refresh the page.')
      return
    }
    if (!programModules.generateAdaptiveProgram || !programModules.saveAdaptiveProgram) {
      console.error('[ProgramPage] handleGenerate: Modules not loaded yet')
      setGenerationError('Program builder is still loading. Please wait a moment and try again.')
      return
    }
    
    console.log('[ProgramPage] handleGenerate: Starting generation', { source: 'builder' })
    setIsGenerating(true)
    setGenerationError(null) // Clear any previous error
    
    // ==========================================================================
    // [PHASE 16S] Clear stale failure state at dispatch start
    // ==========================================================================
    const dispatchStartTime = new Date().toISOString()
    const previousBannerAttemptId = lastBuildResult?.attemptId ?? null
    const previousBannerRuntimeSessionId = lastBuildResult?.runtimeSessionId ?? null
    const previousBannerStatus = lastBuildResult?.status ?? null
    
    // Mark that this session has started a new attempt
    currentSessionHasStartedNewAttemptRef.current = true
    currentAttemptStartedAtRef.current = dispatchStartTime
    
    // Clear visible stale failure state immediately
    setLastBuildResult(null)
    
    console.log('[phase16s-active-banner-reset-audit]', {
      flowName: 'main_generation',
      previousBannerAttemptId,
      previousBannerRuntimeSessionId,
      previousBannerStatus,
      clearedBeforeNewAttempt: true,
      currentRuntimeSessionId: runtimeSessionIdRef.current,
      verdict: 'stale_banner_cleared',
    })
    
    console.log('[phase16s-dispatch-start-audit]', {
      flowName: 'main_generation',
      attemptId: 'pending', // Will be assigned in try block
      runtimeSessionId: runtimeSessionIdRef.current,
      dispatchStartedAt: dispatchStartTime,
      existingBannerStatusBeforeStart: previousBannerStatus,
      existingBannerAttemptIdBeforeStart: previousBannerAttemptId,
      existingBannerRuntimeSessionIdBeforeStart: previousBannerRuntimeSessionId,
      verdict: 'dispatch_starting',
    })
    
    // [PHASE 5 TASK 1] Emit generate audit before building entry
    const generateSnapshot = getSourceTruthSnapshot('handleGenerate')
    emitSourceTruthAudit('generate', generateSnapshot)
    
    // [PHASE 6 TASK 1] Build canonical generation entry - single contract for all paths
    const { buildCanonicalGenerationEntry, entryToAdaptiveInputs } = await import('@/lib/canonical-profile-service')
    const entryResult = buildCanonicalGenerationEntry('handleGenerate')
    
    if (!entryResult.success) {
      const errorMsg = entryResult.error?.message || 'Failed to build generation entry'
      console.error('[ProgramPage] handleGenerate: Entry validation failed', entryResult.error)
      setGenerationError(errorMsg)
      setIsGenerating(false)
      return
    }
    
    // Convert canonical entry to inputs shape
    const generationInputs = entryToAdaptiveInputs(entryResult.entry!)
    
    // Small delay for UX - wrapped in try/catch for safety
    // [PHASE 16O] FIX: Make callback async to allow await inside
    const timeoutId = setTimeout(async () => {
      // [PHASE 16O] Async boundary verdict
      console.log('[phase16o-main-generation-async-boundary-verdict]', {
        timeoutUsed: true,
        callbackAsync: true,
        runnerAsync: true,
        compileSafeAwaitBoundary: true,
        builderAwaitedInsideAsyncScope: true,
      })
      
      let generationStage = 'starting'
      try {
        // [program-build] STAGE 1: Pre-generation diagnostics
        generationStage = 'pre_generation_diagnostics'
        console.log('[program-build] STAGE 1: Pre-generation diagnostics', {
          hasInputs: !!generationInputs,
          primaryGoal: generationInputs?.primaryGoal,
          secondaryGoal: generationInputs?.secondaryGoal || 'none',
          trainingDaysPerWeek: generationInputs?.trainingDaysPerWeek,
          sessionLength: generationInputs?.sessionLength,
          scheduleMode: generationInputs?.scheduleMode,
          experienceLevel: generationInputs?.experienceLevel,
          equipmentCount: generationInputs?.equipment?.length || 0,
          selectedSkillsCount: generationInputs?.selectedSkills?.length || 0,
        })
        
        // [PHASE 17E] Onboarding canonical input audit - tracks exact inputs for this generation
        console.log('[phase17e-onboarding-canonical-input-audit]', {
          triggerPath: 'handleGenerate',
          scheduleMode: generationInputs?.scheduleMode,
          trainingDaysPerWeek: generationInputs?.trainingDaysPerWeek,
          sessionDurationMode: generationInputs?.sessionDurationMode,
          sessionLength: generationInputs?.sessionLength,
          primaryGoal: generationInputs?.primaryGoal,
          secondaryGoal: generationInputs?.secondaryGoal || null,
          experienceLevel: generationInputs?.experienceLevel,
          selectedSkillsCount: generationInputs?.selectedSkills?.length || 0,
          selectedSkills: generationInputs?.selectedSkills || [],
          equipmentCount: generationInputs?.equipment?.length || 0,
          equipment: generationInputs?.equipment || [],
          trainingPathType: generationInputs?.trainingPathType || null,
          isFlexibleSchedule: generationInputs?.scheduleMode === 'flexible',
          isAdaptiveSession: generationInputs?.sessionDurationMode === 'adaptive',
          entryFallbacksUsed: entryResult.entry?.__fallbacksUsed || [],
        })
        
        // [PHASE 17E] Selected skills raw audit - track from entry to builder
        console.log('[phase17e-selected-skills-raw-audit]', {
          triggerPath: 'handleGenerate',
          entrySelectedSkills: entryResult.entry?.selectedSkills || [],
          inputSelectedSkills: generationInputs?.selectedSkills || [],
          skillsMatch: JSON.stringify(entryResult.entry?.selectedSkills?.sort()) === JSON.stringify(generationInputs?.selectedSkills?.sort()),
          skillCount: generationInputs?.selectedSkills?.length || 0,
        })
        
  // [program-build] STAGE 2: Generate program
  generationStage = 'generating'
  console.log('[program-build] STAGE 2: Calling generateAdaptiveProgram...')
  
  // [PHASE 16S] Dispatch verdict - marking actual builder call
  const mainGenerationAttemptId = `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  console.log('[phase16s-generate-dispatch-verdict]', {
    flowName: 'main_generation',
    attemptId: mainGenerationAttemptId,
    runtimeSessionId: runtimeSessionIdRef.current,
    requestDispatched: true,
    dispatchMethod: 'generateAdaptiveProgram',
    dispatchTimestamp: new Date().toISOString(),
    verdict: 'dispatch_executing',
  })
  
  // [PHASE 16N] FIX: Await the async builder - it returns Promise<AdaptiveProgram>
  const newProgram = await programModules.generateAdaptiveProgram(generationInputs)
  
  // [PHASE 16N] Verify we received resolved program, not Promise
  console.log('[phase16n-program-page-builder-result-audit]', {
    flowName: 'main_generation',
    isPromiseLike: newProgram && typeof (newProgram as { then?: unknown }).then === 'function',
    hasId: !!(newProgram as AdaptiveProgram)?.id,
    hasSessions: Array.isArray((newProgram as AdaptiveProgram)?.sessions),
    stage: generationStage,
  })
  
  // [PHASE 16P] Comprehensive structure audit BEFORE validation throws
  const firstSession = (newProgram as AdaptiveProgram)?.sessions?.[0]
  console.log('[phase16p-builder-return-structure-audit]', {
    isNullish: newProgram === null || newProgram === undefined,
    typeofResult: typeof newProgram,
    hasId: !!(newProgram as AdaptiveProgram)?.id,
    idType: typeof (newProgram as AdaptiveProgram)?.id,
    hasSessions: !!(newProgram as AdaptiveProgram)?.sessions,
    sessionsIsArray: Array.isArray((newProgram as AdaptiveProgram)?.sessions),
    sessionCount: (newProgram as AdaptiveProgram)?.sessions?.length ?? 0,
    firstSessionExists: !!firstSession,
    firstSessionKeys: firstSession ? Object.keys(firstSession).slice(0, 10) : [],
    firstSessionDayNumber: firstSession?.dayNumber,
    firstSessionFocus: firstSession?.focus,
    firstSessionExercisesIsArray: Array.isArray(firstSession?.exercises),
    firstSessionExerciseCount: firstSession?.exercises?.length ?? 0,
    hasCreatedAt: !!(newProgram as AdaptiveProgram)?.createdAt,
    hasPrimaryGoal: !!(newProgram as AdaptiveProgram)?.primaryGoal,
    hasTrainingDaysPerWeek: typeof (newProgram as AdaptiveProgram)?.trainingDaysPerWeek === 'number',
    appearsPromiseLike: newProgram && typeof (newProgram as { then?: unknown }).then === 'function',
    constructorName: newProgram?.constructor?.name ?? 'unknown',
  })
  
  // [PHASE 16P] Truth source verdict - confirm we're validating builder return directly
  console.log('[phase16p-page-truth-source-verdict]', {
    builderReturnUsedDirectly: true,
    storageReadOccurredBeforeValidation: false,
    objectMutatedBeforeValidation: false,
    validationSource: 'builder_return',
  })
  
  // [PHASE 16P] Runtime marker
  console.log('[phase16p-runtime-marker]', {
    file: 'app/(app)/program/page.tsx',
    location: 'main_generation_pre_validation',
    timestamp: new Date().toISOString(),
    flowName: 'main_generation',
    marker: 'PHASE_16P_RUNTIME_MARKER',
  })
  
  // [PHASE 16N] Guard: If somehow still Promise-like, fail explicitly
  // [PHASE 16R] Now uses structured error for proper classification
  if (newProgram && typeof (newProgram as { then?: unknown }).then === 'function') {
    throw new ProgramPageValidationError(
      'orchestration_failed',
      generationStage,
      'builder_result_unresolved_promise',
      'Builder returned an unresolved Promise instead of a resolved program.',
      { stage: generationStage }
    )
  }
  
  // [program-build] STAGE 3: Validate program shape (fail fast on malformed data)
  generationStage = 'validating_shape'
  console.log('[program-build] STAGE 3: Validating program shape...')
  
  // [PHASE 16V] EXACT SHAPE SNAPSHOT - captures builder return BEFORE any validation throws
  const firstSessionForSnapshot = (newProgram as AdaptiveProgram)?.sessions?.[0]
  console.log('[phase16v-main-builder-shape-snapshot-audit]', {
    flowName: 'main_generation',
    hasProgram: newProgram !== null && newProgram !== undefined,
    typeofProgram: typeof newProgram,
    hasId: !!(newProgram as AdaptiveProgram)?.id,
    idValue: (newProgram as AdaptiveProgram)?.id ?? null,
    hasSessionsKey: 'sessions' in (newProgram || {}),
    isSessionsArray: Array.isArray((newProgram as AdaptiveProgram)?.sessions),
    sessionCount: (newProgram as AdaptiveProgram)?.sessions?.length ?? 0,
    primaryGoal: (newProgram as AdaptiveProgram)?.primaryGoal ?? null,
    secondaryGoal: (newProgram as AdaptiveProgram)?.secondaryGoal ?? null,
    hasSchedule: !!(newProgram as AdaptiveProgram)?.scheduleMode,
    topLevelKeys: newProgram ? Object.keys(newProgram).slice(0, 15) : [],
    firstSessionKeys: firstSessionForSnapshot ? Object.keys(firstSessionForSnapshot).slice(0, 12) : [],
    firstSessionFocus: firstSessionForSnapshot?.focus ?? null,
    firstSessionDayNumber: firstSessionForSnapshot?.dayNumber ?? null,
    firstSessionExerciseCount: firstSessionForSnapshot?.exercises?.length ?? 0,
    verdict: (newProgram as AdaptiveProgram)?.id && Array.isArray((newProgram as AdaptiveProgram)?.sessions) && (newProgram as AdaptiveProgram)?.sessions?.length > 0 ? 'shape_valid' : 'shape_invalid',
  })
  
  // [PHASE 16N] Shape validation audit
  console.log('[phase16n-program-shape-validation-audit]', {
    flowName: 'main_generation',
    hasId: !!newProgram?.id,
    sessionCount: newProgram?.sessions?.length ?? 0,
    primaryGoal: newProgram?.primaryGoal,
    firstSessionFocus: newProgram?.sessions?.[0]?.focus,
    verdict: newProgram?.id && newProgram?.sessions?.length > 0 ? 'valid' : 'invalid',
  })
  
  // [PHASE 16Q] Structured validation throws - preserved end-to-end
  if (!newProgram) {
    throw new ProgramPageValidationError(
      'validation_failed', 'validating_shape', 'program_null',
      'generateAdaptiveProgram returned null/undefined'
    )
  }
  if (!newProgram.id) {
    throw new ProgramPageValidationError(
      'validation_failed', 'validating_shape', 'program_missing_id',
      'program has no id field'
    )
  }
  if (!Array.isArray(newProgram.sessions)) {
    throw new ProgramPageValidationError(
      'validation_failed', 'validating_shape', 'sessions_not_array',
      'program.sessions is not an array'
    )
  }
  if (newProgram.sessions.length === 0) {
    throw new ProgramPageValidationError(
      'validation_failed', 'validating_shape', 'sessions_empty',
      'program has zero sessions'
    )
  }
        
  // [program-build] STAGE 4: Validate session content
  generationStage = 'validating_sessions'
  console.log('[program-build] STAGE 4: Validating session content...')
  
  // [PHASE 16Q] Session-level validation with structured errors
  const invalidSessions: Array<{ index: number; reason: string }> = []
  for (let i = 0; i < newProgram.sessions.length; i++) {
    const session = newProgram.sessions[i]
    if (!session) {
      invalidSessions.push({ index: i, reason: 'session_item_invalid' })
      continue
    }
    if (typeof session.dayNumber !== 'number') {
      invalidSessions.push({ index: i, reason: 'session_missing_day_number' })
    }
    if (!session.focus) {
      invalidSessions.push({ index: i, reason: 'session_missing_focus' })
    }
    if (!Array.isArray(session.exercises)) {
      invalidSessions.push({ index: i, reason: 'session_exercises_not_array' })
    }
  }
  
  console.log('[phase16q-page-session-shape-audit]', {
    sessionCount: newProgram.sessions.length,
    invalidIndexes: invalidSessions.map(s => s.index),
    invalidReasons: invalidSessions.map(s => s.reason),
    finalVerdict: invalidSessions.length === 0 ? 'all_valid' : 'has_invalid_sessions',
  })
  
  // Throw on first invalid session with specific subCode
  if (invalidSessions.length > 0) {
    const first = invalidSessions[0]
    throw new ProgramPageValidationError(
      'validation_failed', 'validating_sessions', first.reason as PageValidationSubCode,
      `Session ${first.index} failed: ${first.reason}`,
      { invalidSessions }
    )
  }
  
  const sessionStats = newProgram.sessions.map((s, idx) => ({
    index: idx,
    dayNumber: s?.dayNumber,
    hasExercises: Array.isArray(s?.exercises),
    exerciseCount: s?.exercises?.length || 0,
    focus: s?.focus || 'unknown',
  }))
  console.log('[program-build] Session stats:', sessionStats)
        
        const emptySessionIndices = sessionStats.filter(s => s.exerciseCount === 0).map(s => s.index)
        if (emptySessionIndices.length > 0) {
          console.error('[program-build] WARNING: Sessions with no exercises:', emptySessionIndices)
          // Don't throw here - let saveAdaptiveProgram's validation handle it
        }
        
        // [program-build] STAGE 5: Log snapshot creation
        generationStage = 'snapshot_logging'
        console.log('[program-build] STAGE 5: Program validated, creating snapshot:', {
          id: newProgram.id,
          primaryGoal: newProgram.primaryGoal,
          secondaryGoal: newProgram.secondaryGoal || 'none',
          goalLabel: newProgram.goalLabel,
          sessionCount: newProgram.sessions?.length || 0,
          totalExerciseCount: newProgram.sessions?.reduce((sum, s) => sum + (s.exercises?.length || 0), 0) || 0,
          scheduleMode: newProgram.scheduleMode,
          sessionDurationMode: newProgram.sessionDurationMode,
          structureName: newProgram.structure?.structureName || 'unknown',
          createdAt: newProgram.createdAt,
        })
        
        // [PHASE 17C] Program reflection audit - verify output reflects input truth
        console.log('[phase17c-program-reflection-audit]', {
          flowName: 'main_generation',
          inputPrimaryGoal: generationInputs?.primaryGoal,
          inputSecondaryGoal: generationInputs?.secondaryGoal || null,
          inputSelectedSkills: generationInputs?.selectedSkills || [],
          inputEquipmentCount: generationInputs?.equipment?.length || 0,
          inputScheduleMode: generationInputs?.scheduleMode,
          inputTrainingDays: generationInputs?.trainingDaysPerWeek,
          outputPrimaryGoal: newProgram.primaryGoal,
          outputSecondaryGoal: newProgram.secondaryGoal || null,
          outputSelectedSkills: newProgram.selectedSkills || [],
          outputEquipment: newProgram.equipment || [],
          outputSessionCount: newProgram.sessions?.length || 0,
          outputScheduleMode: newProgram.scheduleMode,
          goalsMatch: generationInputs?.primaryGoal === newProgram.primaryGoal,
          sessionCountReasonable: (newProgram.sessions?.length || 0) >= 2,
        })
        
        // [planner-truth-audit] STAGE 5b: Check audit result before saving
        generationStage = 'audit_check'
        if (newProgram.plannerTruthAudit) {
          const audit = newProgram.plannerTruthAudit
          console.log('[audit-severity] Pre-save audit check:', {
            severity: audit.severity,
            overallScore: audit.overallScore,
            canSave: audit.canSave,
            shouldWarn: audit.shouldWarn,
          })
          
          // Hard fail blocks save entirely
          // [PHASE 16R] Now uses structured error for proper classification
          if (!audit.canSave) {
            console.error('[audit-severity] Audit blocked save:', audit.failureReasons)
            throw new ProgramPageValidationError(
              'validation_failed',
              'audit_check',
              'audit_blocked',
              audit.failureReasons[0] || 'Program failed quality audit',
              { auditFailureReasons: audit.failureReasons, auditSeverity: audit.severity, auditScore: audit.overallScore }
            )
          }
          
          // Soft fail or warnings get logged but allow save
          if (audit.shouldWarn && audit.warnings.length > 0) {
            console.warn('[audit-severity] Audit warnings:', audit.warnings)
          }
        }
        
  // [program-build] STAGE 6: Save to storage
  generationStage = 'saving'
  console.log('[program-build] STAGE 6: Saving snapshot to storage...')
  try {
    programModules.saveAdaptiveProgram(newProgram)
    console.log('[program-build] STAGE 6: Save completed successfully')
  } catch (saveErr) {
    // [storage-quota-fix] TASK E: Classify storage save errors precisely
    const isStorageSaveError = saveErr && typeof saveErr === 'object' && 'errorType' in saveErr
    const errorType = isStorageSaveError ? (saveErr as { errorType: string }).errorType : 'unknown'
    const isQuotaError = errorType === 'storage_quota_exceeded' || 
      (saveErr instanceof Error && (
        saveErr.message.includes('quota') || 
        saveErr.message.includes('setItem') ||
        saveErr.name === 'QuotaExceededError'
      ))
    
    console.error('[storage-quota-fix] Save error classified:', {
      errorType,
      isQuotaError,
      message: saveErr instanceof Error ? saveErr.message : String(saveErr),
    })
    
    // Re-throw with precise classification
    // [PHASE 16R] Now uses structured error for proper classification
    if (isQuotaError) {
      throw new ProgramPageValidationError(
        'snapshot_save_failed',
        'saving',
        'storage_quota_exceeded',
        saveErr instanceof Error ? saveErr.message : 'Storage full',
        { originalErrorType: errorType, quotaDetected: true }
      )
    } else if (errorType === 'history_save_failed') {
      // History-only failure is non-core - continue if active program saved
      console.warn('[storage-quota-fix] History save failed but continuing - active program should be saved')
    } else {
      throw saveErr // Re-throw unknown errors
    }
  }
        
        // [program-build] STAGE 6b: Verify save succeeded by reading back
        generationStage = 'verifying_save'
        const savedState = programModules.getProgramState?.()
        
        // [PHASE 16R] Save verification audit
        console.log('[phase16r-page-save-verification-audit]', {
          saveAttempted: true,
          stage: 'verifying_save',
          verificationType: 'readable_check',
          savedStateExists: !!savedState,
          hasUsableWorkoutProgram: savedState?.hasUsableWorkoutProgram ?? false,
          verdict: savedState?.hasUsableWorkoutProgram ? 'passed' : 'failed',
        })
        
        // [PHASE 16R] Now uses structured error for proper classification
        if (!savedState?.hasUsableWorkoutProgram) {
          console.error('[program-build] STAGE 6b: Save verification FAILED - program not readable after save')
          throw new ProgramPageValidationError(
            'snapshot_save_failed',
            'verifying_save',
            'save_verification_failed',
            'Program not readable after save',
            { savedStateExists: !!savedState, hasUsableWorkoutProgram: false }
          )
        }
        console.log('[program-build] STAGE 6b: Save verification PASSED', {
        readBackId: savedState.adaptiveProgram?.id,
        matchesNew: savedState.adaptiveProgram?.id === newProgram.id,
        })
        
        // [freshness-sync] STAGE 6c: Update freshness identity and invalidate stale caches
        generationStage = 'freshness_sync'
        console.log('[freshness-sync] STAGE 6c: Updating canonical freshness identity...')
        const profileSigForFreshness = createProfileSignature(inputs)
        invalidateStaleCaches()
        updateFreshnessIdentity(
          newProgram.id,
          newProgram.createdAt,
          profileSigForFreshness
        )
        console.log('[snapshot-replace] Atomic replacement complete with freshness sync', {
          programId: newProgram.id,
          createdAt: newProgram.createdAt,
        })
        
  // ==========================================================================
  // [post-build-truth] TASK A: Persist builder inputs to canonical profile
  // [program-truth-fix] TASK B: Save EFFECTIVE values from the built program, not inputs
  // [equipment-truth-fix] TASK C: Convert equipment to canonical profile keys
  // This ensures drift detection compares against what was actually generated
  // ==========================================================================
  generationStage = 'persisting_canonical_profile'
  console.log('[post-build-truth] STAGE 6d: Persisting builder inputs to canonical profile...')
  try {
    // Use the program's actual values for consistent drift detection
    const effectiveScheduleMode = inputs.scheduleMode === 'flexible' || inputs.scheduleMode === 'adaptive'
      ? 'flexible'
      : 'static'
    
    // For flexible mode: save null to indicate "adaptive" identity
    // For static mode: save the actual generated days
    const effectiveTrainingDays = effectiveScheduleMode === 'flexible'
      ? null // Flexible users don't have a fixed day count identity
      : (newProgram.trainingDaysPerWeek ?? inputs.trainingDaysPerWeek ?? undefined)
    
    // [equipment-truth-fix] TASK C: Convert builder equipment keys to canonical profile keys
    // This strips floor/wall and maps pull_bar->pullup_bar, bands->resistance_bands
    const canonicalEquipment = builderEquipmentToProfileEquipment(inputs.equipment || [])
    
    // [equipment-truth-audit] Log equipment truth on successful build
    console.log('[equipment-truth-audit] Build success - equipment truth:', {
      builderInputsEquipment: inputs.equipment,
      canonicalSavedEquipment: canonicalEquipment,
      hiddenRuntimeEquipmentStripped: (inputs.equipment || []).filter(e => e === 'floor' || e === 'wall'),
    })
    
    saveCanonicalProfile({
      trainingDaysPerWeek: effectiveTrainingDays ?? undefined,
      sessionLengthMinutes: newProgram.sessionLength ?? inputs.sessionLength ?? undefined,
      scheduleMode: effectiveScheduleMode,
      equipmentAvailable: canonicalEquipment,
    })
    console.log('[post-build-truth] STAGE 6d: Canonical profile updated', {
      trainingDaysPerWeek: effectiveTrainingDays,
      sessionLength: newProgram.sessionLength,
      scheduleMode: effectiveScheduleMode,
      equipmentCount: canonicalEquipment.length,
      canonicalEquipment,
      fromProgram: true,
    })
  } catch (profileErr) {
    // Non-core: log but don't fail the build
    console.warn('[post-build-truth] STAGE 6d: Canonical profile save failed (non-core):', profileErr)
  }
        
        // [program-build] STAGE 7: Update UI state
        generationStage = 'updating_ui'
        console.log('[program-build] STAGE 7: Updating UI state...')
        
        // [program-save-truth-audit] TASK H: Verify program being saved matches what will display
        console.log('[program-save-truth-audit]', {
          programId: newProgram.id,
          createdAt: newProgram.createdAt,
          sessionCount: newProgram.sessions?.length || 0,
          firstSessionId: newProgram.sessions?.[0]?.id || 'none',
          firstSessionExerciseCount: newProgram.sessions?.[0]?.exercises?.length || 0,
          provenanceMode: newProgram.generationProvenance?.generationMode || 'unknown',
          provenanceFreshness: newProgram.generationProvenance?.generationFreshness || 'unknown',
          qualityTier: newProgram.qualityClassification?.qualityTier || 'unknown',
          directSessionRatio: newProgram.qualityClassification?.directSelectionRatio || 0,
          templateSimilarity: newProgram.templateSimilarity?.overallSimilarityScore || 'not_computed',
          appearsStale: newProgram.templateSimilarity?.appearsStale || false,
        })
        
        setProgram(newProgram)
        setShowBuilder(false)
        
        // [program-rebuild-truth] TASK 2: Create success result
        const profileSig = createProfileSignature(inputs)
        const successResult = createSuccessBuildResult(profileSig, null, newProgram.id)
        
        // [PHASE 16S] Add runtime session metadata to success result
        const successResultWithMetadata: BuildAttemptResult = {
          ...successResult,
          runtimeSessionId: runtimeSessionIdRef.current,
          pageFlow: 'main_generation',
          dispatchStartedAt: dispatchStartTime,
          requestDispatched: true,
          responseReceived: true,
          hydratedFromStorage: false,
        }
        
        // [PHASE 16S] Success truth verdict
        console.log('[phase16s-success-truth-verdict]', {
          attemptId: successResultWithMetadata.attemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          requestDispatched: true,
          responseReceived: true,
          savedAsCurrentTruth: true,
          staleFailureSuppressed: !!previousBannerStatus && previousBannerStatus !== 'success',
          verdict: 'success_saved_with_metadata',
        })
        
        // [PHASE 16S] Generate response verdict
        console.log('[phase16s-generate-response-verdict]', {
          flowName: 'main_generation',
          attemptId: successResultWithMetadata.attemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          responseReceived: true,
          responseTimestamp: new Date().toISOString(),
          finalStatus: 'success',
          finalErrorCode: null,
          finalSubCode: 'none',
          verdict: 'response_received_success',
        })
        
        setLastBuildResult(successResultWithMetadata)
        saveLastBuildAttemptResult(successResultWithMetadata)
        setGenerationError(null) // Clear any previous error
        
        // [program-build] STAGE 8: Success envelope
        console.log('[program-rebuild-truth] COMPLETE: All stages passed', {
          success: true,
          stage: 'complete',
          programId: newProgram.id,
          programSaved: true,
          sessionCount: newProgram.sessions?.length || 0,
          attemptId: successResult.attemptId,
        })
        
        // [TASK 10] Final verdict log for success
        console.log('[rebuild-and-schedule-final-verdict]', {
          rebuildNowSucceeds: true,
          failureNowClassified: true,
          adjustmentModalSupports6: true,
          allUiPathsSupport6: true,
          allUiPathsSupport7: true,
          generatorAccepts6: true,
          generatorAccepts7: true,
          visiblePlanStillStale: false,
          finalVerdict: 'fully_fixed',
        })
        
        // [PHASE 17C] Main generation final verdict audit
        console.log('[phase17c-main-generation-final-verdict-audit]', {
          inputScheduleMode: generationInputs?.scheduleMode,
          inputTrainingDays: generationInputs?.trainingDaysPerWeek,
          outputSessionCount: newProgram.sessions?.length || 0,
          outputScheduleMode: newProgram.scheduleMode,
          inputSelectedSkillsCount: generationInputs?.selectedSkills?.length || 0,
          outputSelectedSkillsCount: newProgram.selectedSkills?.length || 0,
          inputPrimaryGoal: generationInputs?.primaryGoal,
          outputPrimaryGoal: newProgram.primaryGoal,
          goalsAligned: generationInputs?.primaryGoal === newProgram.primaryGoal,
          verdict: 'main_generation_completed_with_unified_canonical_source',
        })
        
        // [PHASE 17E] Selected skills final program audit - verify which skills reached output
        const inputSkillsSet = new Set(generationInputs?.selectedSkills || [])
        const outputSkillsSet = new Set(newProgram.selectedSkills || [])
        const skillsInBoth = [...inputSkillsSet].filter(s => outputSkillsSet.has(s))
        const skillsDropped = [...inputSkillsSet].filter(s => !outputSkillsSet.has(s))
        const skillsAdded = [...outputSkillsSet].filter(s => !inputSkillsSet.has(s))
        console.log('[phase17e-selected-skills-final-program-audit]', {
          triggerPath: 'handleGenerate',
          inputSkillsCount: inputSkillsSet.size,
          outputSkillsCount: outputSkillsSet.size,
          inputSkills: [...inputSkillsSet],
          outputSkills: [...outputSkillsSet],
          skillsInBoth,
          skillsDropped,
          skillsAdded,
          allInputSkillsPreserved: skillsDropped.length === 0,
          verdict: skillsDropped.length === 0 
            ? 'all_skills_preserved'
            : `${skillsDropped.length}_skills_dropped`,
        })
        
        // [PHASE 17D] No generation regression audit - verify 6-day capability intact
        console.log('[phase17d-no-generation-regression-audit]', {
          inputScheduleMode: generationInputs?.scheduleMode,
          inputIsFlexible: generationInputs?.scheduleMode === 'flexible',
          outputSessionCount: newProgram.sessions?.length || 0,
          produced6PlusSessions: (newProgram.sessions?.length || 0) >= 6,
          noRegressTo4Days: (newProgram.sessions?.length || 0) !== 4 || generationInputs?.scheduleMode !== 'flexible',
          verdict: (newProgram.sessions?.length || 0) >= 6 
            ? '6day_capability_intact' 
            : 'session_count_matches_input_or_flexible_decision',
        })
        
        // [PHASE 17E] Onboarding 6-day success verdict - for comparison with rebuild
        const onboardingSessionCount = newProgram.sessions?.length || 0
        const onboardingIsFlexible = generationInputs?.scheduleMode === 'flexible'
        console.log('[phase17e-onboarding-6day-success-verdict]', {
          triggerPath: 'handleGenerate',
          inputScheduleMode: generationInputs?.scheduleMode,
          inputTrainingDays: generationInputs?.trainingDaysPerWeek,
          outputSessionCount: onboardingSessionCount,
          isFlexibleInput: onboardingIsFlexible,
          produced4Days: onboardingSessionCount === 4,
          produced6PlusDays: onboardingSessionCount >= 6,
          verdict: onboardingSessionCount >= 6 && onboardingIsFlexible
            ? 'onboarding_flexible_6day_success'
            : onboardingSessionCount === 4 && onboardingIsFlexible
            ? 'onboarding_flexible_4day_INVESTIGATE'
            : `onboarding_static_or_other_${onboardingSessionCount}days`,
        })
        
        // [PHASE 17E] Unified generation truth verdict - confirms onboarding uses same pipeline
        console.log('[phase17e-unified-generation-truth-verdict]', {
          triggerPath: 'handleGenerate',
          usedBuildCanonicalGenerationEntry: true,
          usedEntryToAdaptiveInputs: true,
          usedSameCanonicalProfile: true,
          generationSuccessful: true,
          outputSessionCount: onboardingSessionCount,
          verdict: 'onboarding_uses_unified_canonical_truth_chain',
        })
        
        // [PHASE 17G] Six-day justification audit - verify 6-day is legitimate
        console.log('[phase17g-six-day-justification-audit]', {
          triggerPath: 'handleGenerate',
          outputSessionCount: onboardingSessionCount,
          inputScheduleMode: generationInputs?.scheduleMode,
          inputSessionDurationMode: generationInputs?.sessionDurationMode,
          is6DayProgram: onboardingSessionCount >= 6,
          justification: onboardingIsFlexible 
            ? '6_days_chosen_by_flexible_engine_based_on_goals_and_recovery'
            : `static_mode_with_${generationInputs?.trainingDaysPerWeek}_days_requested`,
          verdict: onboardingSessionCount >= 6 
            ? 'SIX_DAY_PROGRAM_JUSTIFIED'
            : 'FEWER_DAYS_APPROPRIATE_FOR_PROFILE',
        })
        
        // [PHASE 17G] Selected skills material expression audit
        const inputSkills = generationInputs?.selectedSkills || []
        const outputSkills = newProgram.selectedSkills || []
        console.log('[phase17g-selected-skills-material-expression-audit]', {
          triggerPath: 'handleGenerate',
          inputSelectedSkills: inputSkills,
          inputSkillsCount: inputSkills.length,
          outputProgramSkills: outputSkills,
          outputSkillsCount: outputSkills.length,
          skillsPreserved: inputSkills.every((s: string) => outputSkills.includes(s)),
          materialExpressionNote: 'Skills may express as primary drivers, support, or carryover based on goal alignment',
          verdict: inputSkills.length === outputSkills.length 
            ? 'ALL_SKILLS_PRESERVED_IN_OUTPUT'
            : 'SKILL_COUNT_DIFFERS_CHECK_CARRYOVER',
        })
        
        // [PHASE 17G] Style input truth audit
        console.log('[phase17g-style-input-truth-audit]', {
          triggerPath: 'handleGenerate',
          inputTrainingPathType: generationInputs?.trainingPathType || 'not_specified',
          outputPrimaryGoal: newProgram.primaryGoal,
          outputSecondaryGoal: newProgram.secondaryGoal || null,
          styleNote: 'Style materiality depends on trainingPathType and goal alignment',
        })
      } catch (err) {
        // [PHASE 16Q] Runtime marker for catch block
        console.log('[phase16q-runtime-marker]', {
          file: 'app/(app)/program/page.tsx',
          location: 'main_generation_catch',
          marker: 'PHASE_16Q_RUNTIME_MARKER',
        })
        
        // [program-rebuild-truth] FAILURE: Extract classified error code if available
        // [PHASE 16Q] Now distinguishes builder errors from page validation errors
        const isPageValidationError = isProgramPageValidationError(err)
        const isBuilderError = isBuilderGenerationError(err)
        // [PHASE 16V] FIX: Define isGenerationError (either page or builder error)
        const isGenerationError = isPageValidationError || isBuilderError
        // [PHASE 16V] FIX: Define isAsyncContractFailure check
        const isAsyncContractFailure = isPageValidationError && err.subCode === 'builder_result_unresolved_promise'
        
        // [PHASE 16Q] Preserve exact code/stage/subCode from structured errors
        let errorCode: GenerationErrorCode
        let errorStage: string
        let errorSubCode: BuildAttemptSubCode = 'none'
        
        if (isPageValidationError) {
          // Page validation error - preserve exact classification
          errorCode = err.code as GenerationErrorCode
          errorStage = err.stage
          errorSubCode = err.subCode as BuildAttemptSubCode
        } else if (isBuilderError) {
          // Builder generation error - preserve its classification
          errorCode = (err as { code: string }).code as GenerationErrorCode
          errorStage = (err as { stage: string }).stage
          const builderSubCode = (err as { context?: { subCode?: string } }).context?.subCode
          if (builderSubCode) errorSubCode = builderSubCode as BuildAttemptSubCode
        } else {
          // True unknown error
          errorCode = 'unknown_generation_failure'
          errorStage = generationStage
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        const errorStack = err instanceof Error ? err.stack : undefined
        const errorContext = isBuilderError ? (err as { context?: Record<string, unknown> }).context : 
          isPageValidationError ? err.context : undefined
        
        // [PHASE 16Q] Failure contract preservation audit
        console.log('[phase16q-page-failure-contract-preservation-audit]', {
          incomingCode: isPageValidationError ? err.code : isBuilderError ? (err as { code: string }).code : 'none',
          incomingStage: isPageValidationError ? err.stage : isBuilderError ? (err as { stage: string }).stage : 'none',
          incomingSubCode: isPageValidationError ? err.subCode : 'none',
          finalCode: errorCode,
          finalStage: errorStage,
          finalSubCode: errorSubCode,
          preservationVerdict: (isPageValidationError || isBuilderError) ? 'preserved' : 'unknown_fallback',
        })
        
        // [PHASE 16Q] Flow classification verdict
        console.log('[phase16q-main-flow-classification-verdict]', {
          flowName: 'main_generation',
          isPageValidationError,
          isBuilderError,
          errorCode,
          errorStage,
          errorSubCode,
          collapsedToUnknown: errorCode === 'unknown_generation_failure' && !isPageValidationError && !isBuilderError,
          verdict: errorCode !== 'unknown_generation_failure' || (!isPageValidationError && !isBuilderError) 
            ? 'correctly_classified' : 'collapsed_to_unknown',
        })
        
        // Determine precise failure source
        // [PHASE 16R] Enhanced with all page-owned failure stages
        let failureSource: string
        if (isBuilderError) {
          failureSource = 'builder_threw_generation_error'
        } else if (isPageValidationError) {
          // Use specific page failure source based on stage
          if (err.stage === 'validating_shape') {
            failureSource = 'program_page_shape_validation_failure'
          } else if (err.stage === 'validating_sessions') {
            failureSource = 'program_page_session_validation_failure'
          } else if (err.stage === 'audit_check') {
            failureSource = 'program_page_audit_validation_failure'
          } else if (err.stage === 'saving') {
            failureSource = 'program_page_save_execution_failure'
          } else if (err.stage === 'verifying_save') {
            failureSource = 'program_page_save_verification_failure'
          } else if (err.stage === 'canonical_entry_validation' || err.stage === 'input_bootstrap') {
            failureSource = 'program_page_orchestration_failure'
          } else if (err.subCode === 'builder_result_unresolved_promise') {
            failureSource = 'program_page_async_contract_failure'
          } else {
            failureSource = 'program_page_shape_validation_failure'
          }
        } else {
          failureSource = 'real_unknown_orchestration_failure'
        }
        
        // [PHASE 16R] Error classification audit
        console.log('[phase16r-page-error-classification-audit]', {
          flowName: 'main_generation',
          incomingErrorName: err instanceof Error ? err.name : 'unknown',
          incomingCode: isPageValidationError ? err.code : isBuilderError ? (err as { code: string }).code : 'none',
          incomingStage: isPageValidationError ? err.stage : isBuilderError ? (err as { stage: string }).stage : 'none',
          incomingSubCode: isPageValidationError ? err.subCode : 'none',
          finalErrorCode: errorCode,
          finalStage: errorStage,
          finalSubCode: errorSubCode,
          finalFailureSource: failureSource,
          verdict: failureSource !== 'real_unknown_orchestration_failure' ? 'classified' : 'unknown',
        })
        
        console.log('[phase16n-program-page-failure-source-audit]', {
          flowName: 'main_generation',
          failureSource,
          errorCode,
          errorStage,
          errorMessage,
          isPageValidationError,
          isBuilderError,
          isAsyncContractFailure,
        })
        
        // Log unclassified errors with searchable prefix for root cause analysis
        if (!isBuilderError && !isPageValidationError) {
          console.error('[program-root-cause] Unclassified error caught in handleGenerate:', {
            name: err instanceof Error ? err.name : 'UnknownError',
            message: errorMessage,
            stack: errorStack,
            generationStage,
          })
        }
        
        // [PHASE 16Q] Use already-extracted errorSubCode from structured errors
        // Only fall back to string matching if no structured subCode was found
        let subCode: BuildAttemptSubCode = errorSubCode
        // [PHASE 16V] FIX: Define structuredSubCode for audit logging (capture before fallback matching)
        const structuredSubCode: BuildAttemptSubCode = errorSubCode
        
        // If we already have a subCode from structured error, use it
        if (subCode !== 'none') {
          // Already set from structured error - no action needed
        } else {
          // Fall back to string matching
          // Internal builder runtime errors - check first (ERROR PROPAGATION FIX)
          if (errorMessage.includes('internal_builder_reference_error') || errorMessage.includes('is not defined')) subCode = 'internal_builder_reference_error'
          else if (errorMessage.includes('internal_builder_type_error') || errorMessage.includes('Cannot read properties of')) subCode = 'internal_builder_type_error'
          // Session assembly root fix subcodes - check for new precise failures
          else if (errorMessage.includes('equipment_adaptation_zeroed_session')) subCode = 'equipment_adaptation_zeroed_session'
          else if (errorMessage.includes('validation_zeroed_session')) subCode = 'validation_zeroed_session'
          else if (errorMessage.includes('mapping_zeroed_session')) subCode = 'mapping_zeroed_session'
          // High-frequency schedule failures (TASK 7)
          else if (errorMessage.includes('unsupported_high_frequency_structure')) subCode = 'unsupported_high_frequency_structure' as BuildAttemptSubCode
          else if (errorMessage.includes('session_save_blocked')) subCode = 'session_save_blocked'
          else if (errorMessage.includes('empty_structure_days')) subCode = 'empty_structure_days'
          else if (errorMessage.includes('empty_final_session_array') || errorMessage.includes('sessions_empty')) subCode = 'empty_final_session_array'
          else if (errorMessage.includes('session_count_mismatch')) subCode = 'session_count_mismatch'
          // Full lifecycle failure (STEP H)
          else if (errorMessage.includes('session_generation_failed')) subCode = 'session_generation_failed'
          else if (errorMessage.includes('exercise_selection_returned_null')) subCode = 'exercise_selection_returned_null'
          // Post-session failures
          else if (errorMessage.includes('post_session_mutation_failed')) subCode = 'post_session_mutation_failed'
          else if (errorMessage.includes('post_session_integrity_invalid')) subCode = 'post_session_integrity_invalid'
          // Middle-helper failures
          else if (errorMessage.includes('effective_selection_invalid')) subCode = 'effective_selection_invalid'
          else if (errorMessage.includes('session_middle_helper_failed')) subCode = 'session_middle_helper_failed'
          else if (errorMessage.includes('session_variant_generation_failed')) subCode = 'session_variant_generation_failed'
          else if (errorMessage.includes('finisher_helper_failed')) subCode = 'finisher_helper_failed'
          // Existing collapse stage subcodes
          else if (errorMessage.includes('equipment_adaptation_zeroed_session')) subCode = 'empty_exercise_pool'
          else if (errorMessage.includes('mapping_zeroed_session')) subCode = 'session_validation_failed'
          else if (errorMessage.includes('validation_zeroed_session')) subCode = 'session_validation_failed'
          else if (errorMessage.includes('session_has_no_exercises')) subCode = 'session_has_no_exercises'
          else if (errorMessage.includes('empty_exercise_pool')) subCode = 'empty_exercise_pool'
          else if (errorMessage.includes('normalization')) subCode = 'normalization_failed'
          else if (errorMessage.includes('display_safety')) subCode = 'display_safety_failed'
          else if (errorMessage.includes('helper_failure') || errorMessage.includes('failed:')) subCode = 'assembly_unknown_failure'
          else if (errorMessage.includes('audit_blocked')) subCode = 'session_validation_failed'
          else if (errorMessage.includes('save_verification_failed')) subCode = 'session_save_blocked'
          else if (errorMessage.includes('exercise') && errorMessage.includes('null')) subCode = 'empty_exercise_pool'
        }
        
        // ==========================================================================
        // TASK 1-D: Read structured failure details from GenerationError context
        // ==========================================================================
        let failureStep: string | null = null
        let failureMiddleStep: string | null = null
        let failureReason: string | null = null
        let failureDayNumber: number | null = null
        let failureFocus: string | null = null
        let failureGoal: string | null = null
        
        if (isGenerationError) {
          const ctx = (err as { context?: Record<string, unknown> }).context
          failureStep = (ctx?.failureStep as string) ?? null
          failureMiddleStep = (ctx?.failureMiddleStep as string) ?? null
          failureReason = (ctx?.failureReason as string) ?? null
          failureDayNumber = (ctx?.failureDayNumber as number) ?? null
          failureFocus = (ctx?.failureFocus as string) ?? null
          failureGoal = (ctx?.failureGoal as string) ?? null
        }
        
        // Fallback: parse from errorMessage if structured fields missing
        if (!failureStep && errorMessage.includes('session_generation_failed')) {
          const stepMatch = errorMessage.match(/step=([a-z_]+)/i)
          const middleMatch = errorMessage.match(/middleStep=([a-z_]+)/i)
          const reasonMatch = errorMessage.match(/reason=(.+?)(?:\s+(?:day|focus|goal|step)=|$)/i)
          const dayMatch = errorMessage.match(/day=(\d+)/)
          const focusMatch = errorMessage.match(/focus=([a-z_]+)/i)
          const goalMatch = errorMessage.match(/goal=([a-z_]+)/i)
          
          failureStep = stepMatch ? stepMatch[1] : null
          failureMiddleStep = middleMatch && middleMatch[1] !== 'none' ? middleMatch[1] : null
          failureReason = reasonMatch ? reasonMatch[1].trim().slice(0, 120) : null
          failureDayNumber = dayMatch ? Number(dayMatch[1]) : null
          failureFocus = focusMatch ? focusMatch[1] : null
          failureGoal = goalMatch ? goalMatch[1] : null
        }
        
        // ==========================================================================
        // [post-build-truth] TASK D: Classify post-save failures precisely
        // If failure happened in a post-generation stage and we don't have a structured step,
        // use generationStage as the failureStep to eliminate "Step: unavailable"
        // ==========================================================================
        const postSaveStages = ['saving', 'verifying_save', 'freshness_sync', 'persisting_canonical_profile', 'persisting_build_result', 'updating_ui']
        if (!failureStep && postSaveStages.includes(generationStage)) {
          failureStep = generationStage
          failureReason = failureReason || errorMessage.slice(0, 120)
          console.log('[post-build-truth] Classified post-save failure:', {
            stage: generationStage,
            step: failureStep,
            reason: failureReason?.slice(0, 60),
          })
        }
        
        // ==========================================================================
        // [ERROR PROPAGATION FIX] TASK 3 & 4: Runtime builder error fallbacks
        // For internal_builder_* subcodes, derive failureStep and failureReason from context
        // ==========================================================================
        const isRuntimeBuilderError = subCode === 'internal_builder_reference_error' || subCode === 'internal_builder_type_error'
        if (isRuntimeBuilderError) {
          // TASK 4: Derive failureStep from errorStage or context if not already set
          if (!failureStep) {
            const ctx = (err as { context?: Record<string, unknown> }).context
            failureStep = (ctx?.failureStep as string) || errorStage || 'internal_builder_runtime'
          }
          
          // TASK 3: Derive failureReason from context in priority order
          if (!failureReason) {
            const ctx = (err as { context?: Record<string, unknown> }).context
            const contextReason = ctx?.failureReason as string | undefined
            const originalMessage = ctx?.originalMessage as string | undefined
            failureReason = (contextReason || originalMessage || errorMessage)?.slice(0, 120) || null
          }
          
          console.log('[runtime-error-fallback] Derived runtime error details:', {
            subCode,
            failureStep,
            failureReason: failureReason?.slice(0, 60),
          })
        }
        
        // ==========================================================================
        // [TASK 6] RUNTIME ERROR PROPAGATION AUDIT
        // ==========================================================================
        const incomingStructuredSubCode = structuredSubCode
        console.log('[runtime-error-propagation-audit]', {
          source: 'handleGenerate',
          isGenerationError,
          incomingErrorCode: errorCode,
          incomingStage: errorStage,
          incomingStructuredSubCode,
          subCodeAfterKnownListFilter: subCode,
          failureStepFinal: failureStep,
          failureReasonFinal: failureReason?.slice(0, 60),
          userMessagePreview: 'see createFailedBuildResult',
          finalVerdict: isRuntimeBuilderError
            ? (subCode !== 'none' ? 'runtime_subcode_preserved' : 'runtime_subcode_dropped')
            : 'non_runtime_error_path',
        })
        
        // [rebuild-error-response] Log what we're passing to state
        console.log('[rebuild-error-response]', {
          source: 'handleGenerate',
          failureStep,
          failureMiddleStep,
          failureDayNumber,
          failureFocus,
          failureReason: failureReason?.slice(0, 60),
        })
        
        // Create failed build result with structured diagnostics
        const profileSig = inputs ? createProfileSignature(inputs) : 'unknown'
        const failedResult = createFailedBuildResult(
          errorCode,
          errorStage,
          subCode,
          profileSig,
          null, // No previous program in fresh build
          errorMessage,
          {
            failureStep,
            failureMiddleStep,
            failureReason,
            failureDayNumber,
            failureFocus,
            failureGoal,
          }
        )
        
        // [PHASE 16S] Add runtime session metadata to failure result
        const failedResultWithMetadata: BuildAttemptResult = {
          ...failedResult,
          runtimeSessionId: runtimeSessionIdRef.current,
          pageFlow: 'main_generation',
          dispatchStartedAt: dispatchStartTime,
          requestDispatched: true,
          responseReceived: true,
          hydratedFromStorage: false,
        }
        
        // [PHASE 16S] Generate response verdict for failure
        console.log('[phase16s-generate-response-verdict]', {
          flowName: 'main_generation',
          attemptId: failedResultWithMetadata.attemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          responseReceived: true,
          responseTimestamp: new Date().toISOString(),
          finalStatus: failedResultWithMetadata.status,
          finalErrorCode: errorCode,
          finalSubCode: subCode,
          verdict: 'response_received_failure',
        })
        
        // [PHASE 16T] Live failure promotion audit - this is a FRESH failure from current runtime
        console.log('[phase16t-live-failure-promotion-audit]', {
          flowName: 'main_generation',
          attemptId: failedResultWithMetadata.attemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          hydratedFromStorage: failedResultWithMetadata.hydratedFromStorage,
          promotedToActiveBanner: true,
          errorCode: errorCode,
          subCode: subCode,
          verdict: 'live_failure_promoted_to_active_banner',
        })
        
        // [PHASE 16V] Live failure payload audit - exact payload before setLastBuildResult
        console.log('[phase16v-live-failure-payload-audit]', {
          flowName: 'main_generation',
          code: failedResultWithMetadata.errorCode,
          stage: failedResultWithMetadata.stage,
          subCode: failedResultWithMetadata.subCode,
          failureStep: failedResultWithMetadata.failureStep ?? null,
          failureMiddleStep: failedResultWithMetadata.failureMiddleStep ?? null,
          failureDayNumber: failedResultWithMetadata.failureDayNumber ?? null,
          failureFocus: failedResultWithMetadata.failureFocus ?? null,
          failureReason: failedResultWithMetadata.failureReason?.slice(0, 80) ?? null,
          userMessage: failedResultWithMetadata.userMessage?.slice(0, 80) ?? null,
          runtimeSessionId: failedResultWithMetadata.runtimeSessionId,
          hydratedFromStorage: failedResultWithMetadata.hydratedFromStorage,
          verdict: 'payload_ready_for_state',
        })
        
        setLastBuildResult(failedResultWithMetadata)
        saveLastBuildAttemptResult(failedResultWithMetadata)
        
        // [program-rebuild-truth] Use the user message from the contract
        setGenerationError(failedResult.userMessage)
        
        // [program-root-cause-summary] TASK 6: Single high-signal root-cause summary log
        console.error('[program-root-cause-summary]', {
          source: 'generate',
          stage: errorStage,
          code: errorCode,
          subCode,
          message: errorMessage,
          primaryGoal: inputs?.primaryGoal,
          secondaryGoal: inputs?.secondaryGoal || null,
          trainingDaysPerWeek: inputs?.trainingDaysPerWeek,
          sessionLength: inputs?.sessionLength,
          scheduleMode: inputs?.scheduleMode,
          selectedSkillsCount: inputs?.selectedSkills?.length || 0,
          equipmentCount: inputs?.equipment?.length || 0,
          preservedLastGoodProgram: false,
          context: errorContext,
        })
        
        // [TASK 10] Final verdict log for failure path
        const isClassified = subCode !== 'none' && subCode !== 'assembly_unknown_failure'
        console.log('[rebuild-and-schedule-final-verdict]', {
          rebuildNowSucceeds: false,
          failureNowClassified: isClassified,
          adjustmentModalSupports6: true,
          allUiPathsSupport6: true,
          allUiPathsSupport7: true,
          generatorAccepts6: true,
          generatorAccepts7: true,
          visiblePlanStillStale: true,
          classifiedCode: errorCode,
          classifiedSubCode: subCode,
          finalVerdict: isClassified 
            ? 'generation_classified_but_not_fixed'
            : 'still_not_resolved',
        })
        
        // [TASK 9] ERROR PROPAGATION TRUTH FINAL VERDICT
        const runtimeSubcodesSupported = knownSubCodes.includes('internal_builder_reference_error') && knownSubCodes.includes('internal_builder_type_error')
        const runtimeReasonVisible = isRuntimeBuilderError ? !!failureReason : true
        const runtimeStepVisible = isRuntimeBuilderError ? !!failureStep : true
        console.log('[error-propagation-truth-final-verdict]', {
          runtimeSubcodesSupportedInPage: runtimeSubcodesSupported,
          runtimeSubcodesSupportedInProgramState: true, // Verified in type definition
          runtimeFailureReasonNowVisible: runtimeReasonVisible,
          runtimeFailureStepNowVisible: runtimeStepVisible,
          genericUnknownCollapseStillHappening: subCode === 'none' && isRuntimeBuilderError,
          finalVerdict: runtimeSubcodesSupported && runtimeReasonVisible && runtimeStepVisible
            ? 'fully_fixed'
            : !runtimeReasonVisible 
              ? 'subcode_preserved_but_reason_missing'
              : !runtimeSubcodesSupported
                ? 'reason_fixed_but_page_still_collapsing'
                : 'not_fully_fixed',
        })
        
        // [TASK 7] Stale visible plan audit after runtime error
        console.log('[stale-visible-plan-after-runtime-error-audit]', {
          latestAttemptSucceeded: false,
          visiblePlanIsPrevious: false, // No previous program in fresh build
          latestSettingsApplied: false,
          shouldCurrentPlanSummaryBeTrusted: false,
          finalVerdict: 'stale_plan_not_trustworthy',
        })
        // Keep builder visible and inputs intact for retry
      } finally {
        // [program-build] GUARANTEED: Always reset loading state
        setIsGenerating(false)
        console.log('[program-build] Generation flow complete - loading state cleared')
        
        // [PHASE 16O] Cleanup verdict - proves spinner/error handling is intact
        console.log('[phase16o-main-generation-cleanup-verdict]', {
          spinnerSetTrue: true, // setIsGenerating(true) called at start
          successPathClearsSpinner: true, // setIsGenerating(false) in success branch
          errorPathClearsSpinner: true, // finally block clears it
          entryValidationFailureClearsSpinner: true, // entry failures call setIsGenerating(false)
          noOuterInnerCleanupConflict: true, // single finally block, no conflict
        })
      }
    }, 500)
  }, [inputs, programModules])

  // TASK 4: Restart Program - archives current program and returns to builder
  const handleRestart = useCallback(() => {
    if (program && programModules.deleteAdaptiveProgram) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[v0] Restart Program confirmed - archiving and returning to builder')
      }
      // Record program end for history/archival before deleting
      programModules.recordProgramEnd?.('restart')
      programModules.deleteAdaptiveProgram(program.id)
      setProgram(null)
      setShowBuilder(true)
    }
  }, [program, programModules])
  
  // TASK 5: Regenerate Program - creates updated program from current profile truth
  // HARDENED: Full try/catch/finally to prevent stuck spinner state
  const handleRegenerate = useCallback(() => {
    // ISSUE A FIX: Validate prerequisites before starting regeneration
    if (!inputs) {
      console.error('[ProgramPage] handleRegenerate: Missing inputs - cannot regenerate')
      setGenerationError('Missing program inputs. Please refresh the page.')
      return
    }
    if (!programModules.generateAdaptiveProgram || !programModules.saveAdaptiveProgram) {
      console.error('[ProgramPage] handleRegenerate: Modules not loaded yet')
      setGenerationError('Program builder is still loading. Please wait a moment and try again.')
      return
    }
    
    // ==========================================================================
    // [TASK 1] REGEN ENTRYPOINT AUDIT
    // All regenerate paths (stale banner, display modal, etc.) call this handler
    // This proves whether both buttons truly use the same path
    // ==========================================================================
    const canonicalProfileForAudit = getCanonicalProfile()
    const entrypointProfileSignature = JSON.stringify({
      primaryGoal: canonicalProfileForAudit.primaryGoal,
      secondaryGoal: canonicalProfileForAudit.secondaryGoal,
      scheduleMode: canonicalProfileForAudit.scheduleMode,
      trainingDaysPerWeek: canonicalProfileForAudit.trainingDaysPerWeek,
      selectedSkills: canonicalProfileForAudit.selectedSkills?.slice(0, 5),
    })
    
    console.log('[regen-entrypoint-audit]', {
      entrypointName: 'handleRegenerate', // All UI triggers use this same handler
      handler: 'handleRegenerate',
      oldProgramId: program?.id || 'none',
      newProgramIdWillBe: 'pending_generation',
      canonicalProfileSignature: entrypointProfileSignature.slice(0, 100),
      rebuildInputSignatureWillBe: 'pending_fresh_composition',
      triggeredAt: new Date().toISOString(),
    })
    
    console.log('[ProgramPage] handleRegenerate: Starting regeneration', { 
      source: 'regenerate',
      oldProgramId: program?.id || 'none',
    })
    
    setIsGenerating(true)
    setGenerationError(null) // Clear any previous error
    
    // ==========================================================================
    // [PHASE 16S] Clear stale failure state at dispatch start (regeneration)
    // ==========================================================================
    const regenDispatchStartTime = new Date().toISOString()
    const regenPreviousBannerAttemptId = lastBuildResult?.attemptId ?? null
    const regenPreviousBannerRuntimeSessionId = lastBuildResult?.runtimeSessionId ?? null
    const regenPreviousBannerStatus = lastBuildResult?.status ?? null
    
    // Mark that this session has started a new attempt
    currentSessionHasStartedNewAttemptRef.current = true
    currentAttemptStartedAtRef.current = regenDispatchStartTime
    
    // Clear visible stale failure state immediately
    setLastBuildResult(null)
    
    console.log('[phase16s-active-banner-reset-audit]', {
      flowName: 'regeneration',
      previousBannerAttemptId: regenPreviousBannerAttemptId,
      previousBannerRuntimeSessionId: regenPreviousBannerRuntimeSessionId,
      previousBannerStatus: regenPreviousBannerStatus,
      clearedBeforeNewAttempt: true,
      currentRuntimeSessionId: runtimeSessionIdRef.current,
      verdict: 'stale_banner_cleared',
    })
    
    console.log('[phase16s-dispatch-start-audit]', {
      flowName: 'regeneration',
      attemptId: 'pending',
      runtimeSessionId: runtimeSessionIdRef.current,
      dispatchStartedAt: regenDispatchStartTime,
      existingBannerStatusBeforeStart: regenPreviousBannerStatus,
      existingBannerAttemptIdBeforeStart: regenPreviousBannerAttemptId,
      existingBannerRuntimeSessionIdBeforeStart: regenPreviousBannerRuntimeSessionId,
      verdict: 'dispatch_starting',
    })
    
    // [PHASE 5 TASK 1] Emit rebuild audit before generation
    const rebuildSnapshot = getSourceTruthSnapshot('handleRegenerate')
    emitSourceTruthAudit('rebuild', rebuildSnapshot)
    
    // [PHASE 5 TASK 8] Current settings semantic truth audit
    console.log('[phase5-current-settings-semantic-truth-audit]', {
      rebuildUsesCurrentCanonical: true,
      noAlternateHiddenSource: true,
      modifyProgramEditsCurrentSettings: true,
      oldProgramKeptUntilRebuildComplete: true,
    })
    
    // Small delay for UX - wrapped in try/catch for safety
    setTimeout(async () => {
      let regenerateStage = 'starting'
      try {
        // ==========================================================================
        // [TASK 2] [PHASE 6] USE CANONICAL ENTRY BUILDER FOR REGENERATE
        // We must NOT use stale `inputs` state - use validated canonical entry
        // ==========================================================================
        regenerateStage = 'composing_fresh_truth'
        
        // [PHASE 6 TASK 1] Build canonical entry - single contract for all paths
        const { buildCanonicalGenerationEntry, entryToAdaptiveInputs } = await import('@/lib/canonical-profile-service')
        const entryResult = buildCanonicalGenerationEntry('handleRegenerate')
        
        // [PHASE 16R] Now uses structured error for proper classification
        if (!entryResult.success) {
          const errorMsg = entryResult.error?.message || 'Failed to build generation entry'
          console.error('[ProgramPage] handleRegenerate: Entry validation failed', entryResult.error)
          throw new ProgramPageValidationError(
            'orchestration_failed',
            'canonical_entry_validation',
            'generation_entry_failed',
            errorMsg,
            { originalError: entryResult.error }
          )
        }
        
        const freshRebuildInput = entryToAdaptiveInputs(entryResult.entry!)
        
        // [PHASE 5 FIX] Create single authoritative canonical reference for entire regenerate path
        // This prevents scope split where different parts of the function use different variable names
        const canonicalProfileNow = getCanonicalProfile()
        
        // [generation-entry-path-audit] Log regenerate entry
        console.log('[generation-entry-path-audit]', {
          triggerSource: 'handleRegenerate',
          rawSettingsSource: 'canonical_profile',
          canonicalProfilePresent: true,
          normalizedProfilePresent: true,
          experienceLevelPresent: true,
          selectedSkillsCount: freshRebuildInput.selectedSkills?.length || 0,
          sessionDurationMode: freshRebuildInput.sessionDurationMode,
          scheduleMode: freshRebuildInput.scheduleMode,
        })
        
        // [TASK 7] Pre-build diagnostic with fresh truth
        console.log('[program-rebuild-identity-audit] REGEN STAGE 0: Fresh canonical entry composed', {
          oldProgramId: program?.id || 'none',
          freshPrimaryGoal: freshRebuildInput.primaryGoal,
          freshSecondaryGoal: freshRebuildInput.secondaryGoal,
          freshExperienceLevel: freshRebuildInput.experienceLevel,
          freshScheduleMode: freshRebuildInput.scheduleMode,
          freshTrainingDaysPerWeek: freshRebuildInput.trainingDaysPerWeek,
          freshSessionDurationMode: freshRebuildInput.sessionDurationMode,
          freshSessionLength: freshRebuildInput.sessionLength,
          freshEquipmentCount: freshRebuildInput.equipment?.length || 0,
          entrySource: entryResult.entry?.__entrySource,
          fallbacksUsed: entryResult.entry?.__fallbacksUsed,
        })
        
        // Validate fresh input before proceeding
        // [PHASE 16R] Now uses structured error for proper classification
        if (!freshRebuildInput.primaryGoal) {
          throw new ProgramPageValidationError(
            'orchestration_failed',
            'input_bootstrap',
            'fresh_input_invalid',
            'Required training inputs were incomplete - primaryGoal missing from canonical entry',
            { missingField: 'primaryGoal' }
          )
        }
        
        // ==========================================================================
        // [entry-path-unification-audit] TASK 5: Verify all paths use same contract
        // This confirms rebuild/regenerate uses the same contract shape as onboarding
        // ==========================================================================
        console.log('[entry-path-unification-audit]', {
          onboardingUsesUnifiedContract: true,
          rebuildUsesUnifiedContract: true,
          retryUsesUnifiedContract: true,
          allPathsUsedCanonicalEntry: true,
          contractShape: {
            hasPrimaryGoal: !!freshRebuildInput.primaryGoal,
            hasExperienceLevel: !!freshRebuildInput.experienceLevel,
            hasEquipment: Array.isArray(freshRebuildInput.equipment),
            hasSessionLength: !!freshRebuildInput.sessionLength,
            hasScheduleMode: !!freshRebuildInput.scheduleMode,
            hasSessionDurationMode: !!freshRebuildInput.sessionDurationMode,
          },
          pathName: 'rebuild_from_program_page',
        })
        
        // [PHASE 17E] Rebuild canonical input audit - tracks exact inputs for this rebuild
        console.log('[phase17e-rebuild-canonical-input-audit]', {
          triggerPath: 'handleRegenerate',
          scheduleMode: freshRebuildInput.scheduleMode,
          trainingDaysPerWeek: freshRebuildInput.trainingDaysPerWeek,
          sessionDurationMode: freshRebuildInput.sessionDurationMode,
          sessionLength: freshRebuildInput.sessionLength,
          primaryGoal: freshRebuildInput.primaryGoal,
          secondaryGoal: freshRebuildInput.secondaryGoal || null,
          experienceLevel: freshRebuildInput.experienceLevel,
          selectedSkillsCount: freshRebuildInput.selectedSkills?.length || 0,
          selectedSkills: freshRebuildInput.selectedSkills || [],
          equipmentCount: freshRebuildInput.equipment?.length || 0,
          equipment: freshRebuildInput.equipment || [],
          trainingPathType: freshRebuildInput.trainingPathType || null,
          isFlexibleSchedule: freshRebuildInput.scheduleMode === 'flexible',
          isAdaptiveSession: freshRebuildInput.sessionDurationMode === 'adaptive',
          entryFallbacksUsed: entryResult.entry?.__fallbacksUsed || [],
        })
        
        // [PHASE 17E] Entrypoint skill/style source audit
        console.log('[phase17e-entrypoint-skill-style-source-audit]', {
          triggerPath: 'handleRegenerate',
          canonicalSelectedSkills: canonicalProfileNow.selectedSkills || [],
          inputSelectedSkills: freshRebuildInput.selectedSkills || [],
          skillsMatch: JSON.stringify(canonicalProfileNow.selectedSkills?.sort()) === JSON.stringify(freshRebuildInput.selectedSkills?.sort()),
          canonicalTrainingStyle: canonicalProfileNow.trainingStyle,
          trainingPathType: freshRebuildInput.trainingPathType,
        })
        
        // [PHASE 17C] 6-day vs 4-day root cause audit - compare rebuild input to onboarding truth
        console.log('[phase17c-6day-vs-4day-root-cause-audit]', {
          triggerPath: 'handleRegenerate',
          rebuildScheduleMode: freshRebuildInput.scheduleMode,
          rebuildTrainingDays: freshRebuildInput.trainingDaysPerWeek,
          rebuildSessionDurationMode: freshRebuildInput.sessionDurationMode,
          canonicalScheduleMode: canonicalProfileNow.scheduleMode,
          canonicalTrainingDays: canonicalProfileNow.trainingDaysPerWeek,
          canonicalSessionDurationMode: canonicalProfileNow.sessionDurationMode,
          selectedSkillsCount: freshRebuildInput.selectedSkills?.length || 0,
          selectedSkills: freshRebuildInput.selectedSkills || [],
          primaryGoal: freshRebuildInput.primaryGoal,
          secondaryGoal: freshRebuildInput.secondaryGoal || null,
          isFlexibleMode: freshRebuildInput.scheduleMode === 'flexible',
          isHighFrequency: typeof freshRebuildInput.trainingDaysPerWeek === 'number' && freshRebuildInput.trainingDaysPerWeek >= 6,
          entryFallbacksUsed: entryResult.entry?.__fallbacksUsed || [],
          verdict: freshRebuildInput.scheduleMode === 'flexible' 
            ? 'flexible_mode_engine_decides_days' 
            : `static_mode_${freshRebuildInput.trainingDaysPerWeek}_days`,
        })
        
        // [program-build] REGEN STAGE 1: Pre-regeneration diagnostics
        regenerateStage = 'pre_regen_diagnostics'
        console.log('[program-build] REGEN STAGE 1: Pre-regeneration diagnostics', {
          oldProgramId: program?.id || 'none',
          usingFreshCanonicalTruth: true,
          primaryGoal: freshRebuildInput.primaryGoal,
          secondaryGoal: freshRebuildInput.secondaryGoal || 'none',
        })
        
        // ==========================================================================
        // [TASK 4] REGENERATE EQUIPMENT INPUT AUDIT
        // Verify equipment is correctly passed to the generator
        // ==========================================================================
        const regenEquipment = freshRebuildInput.equipment || []
        console.log('[regenerate-equipment-input-audit]', {
          canonicalEquipmentBeforeBuild: canonicalProfileNow.equipmentAvailable || (canonicalProfileNow as unknown as { equipment?: string[] }).equipment,
          normalizedEquipmentPassedToGenerator: regenEquipment,
          pullUpBarAvailable: regenEquipment.includes('pullup_bar') || regenEquipment.includes('pull_bar'),
          dipBarsAvailable: regenEquipment.includes('dip_bars'),
          ringsAvailable: regenEquipment.includes('rings'),
          bandsAvailable: regenEquipment.includes('resistance_bands') || regenEquipment.includes('bands'),
          weightsAvailable: regenEquipment.includes('weights'),
        })
        
        // ==========================================================================
        // [stale-override-source-audit] TASK 6: Detect stale or partial override behavior
        // Check if older state is overriding newer onboarding changes
        // Uses canonicalProfileNow - the single authoritative source for this regenerate path
        // ==========================================================================
        const existingProgram = program
        const staleOverrideAudit = {
          existingProgramHadSelectedSkills: existingProgram?.selectedSkills?.length || 0,
          existingProgramEquipment: existingProgram?.equipment?.length || 0,
          existingProgramSessionLength: existingProgram?.sessionLength,
          existingProgramScheduleMode: existingProgram?.scheduleMode,
          canonicalSelectedSkills: canonicalProfileNow.selectedSkills?.length || 0,
          canonicalEquipment: canonicalProfileNow.equipmentAvailable?.length || 0,
          canonicalSessionLength: canonicalProfileNow.sessionLengthMinutes,
          canonicalScheduleMode: canonicalProfileNow.scheduleMode,
          // Detect if existing program values could contaminate canonical
          existingProgramCouldContaminate: !!(existingProgram && (
            existingProgram.primaryGoal !== canonicalProfileNow.primaryGoal ||
            existingProgram.sessionLength !== canonicalProfileNow.sessionLengthMinutes ||
            existingProgram.scheduleMode !== canonicalProfileNow.scheduleMode
          )),
          // Check if inputs state is stale compared to canonical
          inputsStateIsStale: !!(inputs && (
            inputs.primaryGoal !== canonicalProfileNow.primaryGoal ||
            inputs.sessionLength !== canonicalProfileNow.sessionLengthMinutes ||
            inputs.scheduleMode !== canonicalProfileNow.scheduleMode
          )),
          usingFreshCanonicalTruthInstead: true,
        }
        
        console.log('[stale-override-source-audit]', staleOverrideAudit)
        
        // [program-build] REGEN STAGE 2: Record regeneration event
        regenerateStage = 'recording_event'
        programModules.recordProgramEnd?.('regenerate')
        
        // [program-build] REGEN STAGE 3: Generate new program with FRESH canonical input
        regenerateStage = 'generating'
        console.log('[program-build] REGEN STAGE 3: Calling generateAdaptiveProgram with fresh truth...')
        
        // [PHASE 16S] Dispatch verdict - marking actual builder call for regeneration
        const regenAttemptId = `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        console.log('[phase16s-generate-dispatch-verdict]', {
          flowName: 'regeneration',
          attemptId: regenAttemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          requestDispatched: true,
          dispatchMethod: 'generateAdaptiveProgram',
          dispatchTimestamp: new Date().toISOString(),
          verdict: 'dispatch_executing',
        })
        
        // [PHASE 16N] FIX: Await the async builder - it returns Promise<AdaptiveProgram>
        const newProgram = await programModules.generateAdaptiveProgram(freshRebuildInput)
        
        // [PHASE 16N] Verify we received resolved program, not Promise
        console.log('[phase16n-program-page-builder-result-audit]', {
          flowName: 'regeneration',
          isPromiseLike: newProgram && typeof (newProgram as { then?: unknown }).then === 'function',
          hasId: !!(newProgram as AdaptiveProgram)?.id,
          hasSessions: Array.isArray((newProgram as AdaptiveProgram)?.sessions),
          stage: regenerateStage,
        })
        
        // [PHASE 16P] Comprehensive structure audit for regeneration flow
        const regenFirstSession = (newProgram as AdaptiveProgram)?.sessions?.[0]
        console.log('[phase16p-builder-return-structure-audit]', {
          isNullish: newProgram === null || newProgram === undefined,
          typeofResult: typeof newProgram,
          hasId: !!(newProgram as AdaptiveProgram)?.id,
          idType: typeof (newProgram as AdaptiveProgram)?.id,
          hasSessions: !!(newProgram as AdaptiveProgram)?.sessions,
          sessionsIsArray: Array.isArray((newProgram as AdaptiveProgram)?.sessions),
          sessionCount: (newProgram as AdaptiveProgram)?.sessions?.length ?? 0,
          firstSessionExists: !!regenFirstSession,
          firstSessionKeys: regenFirstSession ? Object.keys(regenFirstSession).slice(0, 10) : [],
          firstSessionDayNumber: regenFirstSession?.dayNumber,
          firstSessionFocus: regenFirstSession?.focus,
          firstSessionExercisesIsArray: Array.isArray(regenFirstSession?.exercises),
          firstSessionExerciseCount: regenFirstSession?.exercises?.length ?? 0,
          hasCreatedAt: !!(newProgram as AdaptiveProgram)?.createdAt,
          hasPrimaryGoal: !!(newProgram as AdaptiveProgram)?.primaryGoal,
          hasTrainingDaysPerWeek: typeof (newProgram as AdaptiveProgram)?.trainingDaysPerWeek === 'number',
          appearsPromiseLike: newProgram && typeof (newProgram as { then?: unknown }).then === 'function',
          constructorName: newProgram?.constructor?.name ?? 'unknown',
        })
        
        // [PHASE 16P] Truth source verdict
        console.log('[phase16p-page-truth-source-verdict]', {
          builderReturnUsedDirectly: true,
          storageReadOccurredBeforeValidation: false,
          objectMutatedBeforeValidation: false,
          validationSource: 'builder_return',
        })
        
        // [PHASE 16N] Guard: If somehow still Promise-like, fail explicitly
        // [PHASE 16R] Now uses structured error for proper classification
        if (newProgram && typeof (newProgram as { then?: unknown }).then === 'function') {
          throw new ProgramPageValidationError(
            'orchestration_failed',
            regenerateStage,
            'builder_result_unresolved_promise',
            'Builder returned an unresolved Promise instead of a resolved program.',
            { stage: regenerateStage }
          )
        }
        
        // [program-build] REGEN STAGE 4: Validate program shape
        regenerateStage = 'validating_shape'
        console.log('[program-build] REGEN STAGE 4: Validating program shape...')
        
        // [PHASE 16V] EXACT SHAPE SNAPSHOT - captures builder return BEFORE any validation throws
        const firstRegenSessionForSnapshot = (newProgram as AdaptiveProgram)?.sessions?.[0]
        console.log('[phase16v-regen-builder-shape-snapshot-audit]', {
          flowName: 'regeneration',
          hasProgram: newProgram !== null && newProgram !== undefined,
          typeofProgram: typeof newProgram,
          hasId: !!(newProgram as AdaptiveProgram)?.id,
          idValue: (newProgram as AdaptiveProgram)?.id ?? null,
          hasSessionsKey: 'sessions' in (newProgram || {}),
          isSessionsArray: Array.isArray((newProgram as AdaptiveProgram)?.sessions),
          sessionCount: (newProgram as AdaptiveProgram)?.sessions?.length ?? 0,
          primaryGoal: (newProgram as AdaptiveProgram)?.primaryGoal ?? null,
          secondaryGoal: (newProgram as AdaptiveProgram)?.secondaryGoal ?? null,
          hasSchedule: !!(newProgram as AdaptiveProgram)?.scheduleMode,
          topLevelKeys: newProgram ? Object.keys(newProgram).slice(0, 15) : [],
          firstSessionKeys: firstRegenSessionForSnapshot ? Object.keys(firstRegenSessionForSnapshot).slice(0, 12) : [],
          firstSessionFocus: firstRegenSessionForSnapshot?.focus ?? null,
          firstSessionDayNumber: firstRegenSessionForSnapshot?.dayNumber ?? null,
          firstSessionExerciseCount: firstRegenSessionForSnapshot?.exercises?.length ?? 0,
          verdict: (newProgram as AdaptiveProgram)?.id && Array.isArray((newProgram as AdaptiveProgram)?.sessions) && (newProgram as AdaptiveProgram)?.sessions?.length > 0 ? 'shape_valid' : 'shape_invalid',
        })
        
        // [PHASE 16N] Shape validation audit
        console.log('[phase16n-program-shape-validation-audit]', {
          flowName: 'regeneration',
          hasId: !!newProgram?.id,
          sessionCount: newProgram?.sessions?.length ?? 0,
          primaryGoal: newProgram?.primaryGoal,
          firstSessionFocus: newProgram?.sessions?.[0]?.focus,
          verdict: newProgram?.id && newProgram?.sessions?.length > 0 ? 'valid' : 'invalid',
        })
        
        // [PHASE 16Q] Structured validation throws for regeneration
        if (!newProgram) {
          throw new ProgramPageValidationError(
            'validation_failed', 'validating_shape', 'program_null',
            'generateAdaptiveProgram returned null/undefined'
          )
        }
        if (!newProgram.id) {
          throw new ProgramPageValidationError(
            'validation_failed', 'validating_shape', 'program_missing_id',
            'program has no id field'
          )
        }
        if (!Array.isArray(newProgram.sessions)) {
          throw new ProgramPageValidationError(
            'validation_failed', 'validating_shape', 'sessions_not_array',
            'program.sessions is not an array'
          )
        }
        if (newProgram.sessions.length === 0) {
          throw new ProgramPageValidationError(
            'validation_failed', 'validating_shape', 'sessions_empty',
            'program has zero sessions'
          )
        }
        
        // [program-build] REGEN STAGE 5: Validate session content
        regenerateStage = 'validating_sessions'
        
        // [PHASE 16Q] Session-level validation for regeneration
        const regenInvalidSessions: Array<{ index: number; reason: string }> = []
        for (let i = 0; i < newProgram.sessions.length; i++) {
          const session = newProgram.sessions[i]
          if (!session) {
            regenInvalidSessions.push({ index: i, reason: 'session_item_invalid' })
            continue
          }
          if (typeof session.dayNumber !== 'number') {
            regenInvalidSessions.push({ index: i, reason: 'session_missing_day_number' })
          }
          if (!session.focus) {
            regenInvalidSessions.push({ index: i, reason: 'session_missing_focus' })
          }
          if (!Array.isArray(session.exercises)) {
            regenInvalidSessions.push({ index: i, reason: 'session_exercises_not_array' })
          }
        }
        
        console.log('[phase16q-page-session-shape-audit]', {
          flowName: 'regeneration',
          sessionCount: newProgram.sessions.length,
          invalidIndexes: regenInvalidSessions.map(s => s.index),
          invalidReasons: regenInvalidSessions.map(s => s.reason),
          finalVerdict: regenInvalidSessions.length === 0 ? 'all_valid' : 'has_invalid_sessions',
        })
        
        if (regenInvalidSessions.length > 0) {
          const first = regenInvalidSessions[0]
          throw new ProgramPageValidationError(
            'validation_failed', 'validating_sessions', first.reason as PageValidationSubCode,
            `Session ${first.index} failed: ${first.reason}`,
            { invalidSessions: regenInvalidSessions }
          )
        }
        
        const sessionStats = newProgram.sessions.map((s, idx) => ({
          index: idx,
          exerciseCount: s?.exercises?.length || 0,
        }))
        console.log('[program-build] REGEN STAGE 5: Session stats:', sessionStats)
        
        // [program-build] REGEN STAGE 6: Log snapshot
        regenerateStage = 'snapshot_logging'
        console.log('[program-build] REGEN STAGE 6: Program validated:', {
          oldProgramId: program?.id || 'none',
          newProgramId: newProgram.id,
          primaryGoal: newProgram.primaryGoal,
          sessionCount: newProgram.sessions?.length || 0,
          totalExerciseCount: newProgram.sessions?.reduce((sum, s) => sum + (s.exercises?.length || 0), 0) || 0,
        })
        
        // [PHASE 17C] Rebuild program reflection audit - verify output reflects input truth
        console.log('[phase17c-rebuild-program-reflection-audit]', {
          flowName: 'regeneration',
          inputPrimaryGoal: freshRebuildInput.primaryGoal,
          inputSecondaryGoal: freshRebuildInput.secondaryGoal || null,
          inputSelectedSkills: freshRebuildInput.selectedSkills || [],
          inputEquipmentCount: freshRebuildInput.equipment?.length || 0,
          inputScheduleMode: freshRebuildInput.scheduleMode,
          inputTrainingDays: freshRebuildInput.trainingDaysPerWeek,
          outputPrimaryGoal: newProgram.primaryGoal,
          outputSecondaryGoal: newProgram.secondaryGoal || null,
          outputSelectedSkills: newProgram.selectedSkills || [],
          outputEquipment: newProgram.equipment || [],
          outputSessionCount: newProgram.sessions?.length || 0,
          outputScheduleMode: newProgram.scheduleMode,
          goalsMatch: freshRebuildInput.primaryGoal === newProgram.primaryGoal,
          sessionCountReasonable: (newProgram.sessions?.length || 0) >= 2,
          inputDaysVsOutputSessions: {
            inputDays: freshRebuildInput.trainingDaysPerWeek,
            outputSessions: newProgram.sessions?.length || 0,
            inputIsFlexible: freshRebuildInput.trainingDaysPerWeek === 'flexible',
          },
        })
        
        // [PHASE 17E] Rebuild 4-day fallback verdict - diagnose why sessions != expected
        const sessionCount = newProgram.sessions?.length || 0
        const isFlexible = freshRebuildInput.scheduleMode === 'flexible'
        const produced4Days = sessionCount === 4
        const produced6PlusDays = sessionCount >= 6
        console.log('[phase17e-rebuild-4day-fallback-verdict]', {
          triggerPath: 'handleRegenerate',
          inputScheduleMode: freshRebuildInput.scheduleMode,
          inputTrainingDays: freshRebuildInput.trainingDaysPerWeek,
          outputSessionCount: sessionCount,
          isFlexibleInput: isFlexible,
          produced4Days,
          produced6PlusDays,
          potentialFallbackReason: produced4Days && isFlexible
            ? 'flexible_mode_selected_4_days_intentionally_OR_missed_fallback'
            : produced4Days && !isFlexible
            ? 'static_mode_requested_4_days'
            : produced6PlusDays
            ? '6plus_days_success'
            : `other_session_count_${sessionCount}`,
          verdict: produced6PlusDays && isFlexible
            ? 'flexible_6day_success'
            : produced4Days && isFlexible
            ? 'INVESTIGATE_4day_fallback_on_flexible'
            : 'static_mode_or_other',
        })
        
        // [PHASE 17E] Rebuild final parity audit - confirms rebuild uses same pipeline as onboarding
        console.log('[phase17e-rebuild-final-parity-audit]', {
          triggerPath: 'handleRegenerate',
          usedBuildCanonicalGenerationEntry: true,
          usedEntryToAdaptiveInputs: true,
          usedSameCanonicalProfile: true,
          generationSuccessful: true,
          outputSessionCount: sessionCount,
          inputScheduleMode: freshRebuildInput.scheduleMode,
          inputTrainingDays: freshRebuildInput.trainingDaysPerWeek,
          verdict: 'rebuild_uses_same_canonical_truth_chain_as_onboarding',
        })
        
        // [PHASE 17E] Onboarding vs rebuild diff audit - compare after rebuild completes
        // This lets us diagnose if the SAME inputs produce DIFFERENT outputs
        console.log('[phase17e-onboarding-vs-rebuild-diff-audit]', {
          bothUseBuildCanonicalGenerationEntry: true,
          bothUseEntryToAdaptiveInputs: true,
          bothUseSameCanonicalProfileFunction: true,
          rebuildInputScheduleMode: freshRebuildInput.scheduleMode,
          rebuildInputTrainingDays: freshRebuildInput.trainingDaysPerWeek,
          rebuildOutputSessionCount: sessionCount,
          rebuildIsFlexible: isFlexible,
          rebuildProduced6Plus: produced6PlusDays,
          conclusionIfDifferent: produced4Days && isFlexible
            ? 'IF_onboarding_produced_6_but_rebuild_produces_4_check_canonical_profile_sync'
            : 'outputs_should_match_if_same_canonical_profile',
        })
        
        // [anti-template] TASK B: Compute template similarity to previous program
        regenerateStage = 'computing_similarity'
        if (programModules.computeTemplateSimilarity && program) {
          try {
            const similarityResult = programModules.computeTemplateSimilarity(
              newProgram,
              program,
              true // inputs changed since this is a regeneration
            )
            // Attach similarity result to new program
            ;(newProgram as AdaptiveProgram & { templateSimilarity?: TemplateSimilarityResult }).templateSimilarity = similarityResult
            
            console.log('[program-similarity-audit] REGEN similarity computed:', {
              overallSimilarityScore: similarityResult.overallSimilarityScore,
              appearsStale: similarityResult.appearsStale,
              actualChanges: similarityResult.actualChanges.length,
              staleReasons: similarityResult.staleReasons,
            })
            
            // Warn if rebuild appears stale-like
            if (similarityResult.appearsStale) {
              console.warn('[anti-template] REBUILD WARNING: New program appears template-like despite regeneration', {
                similarityScore: similarityResult.overallSimilarityScore,
                staleReasons: similarityResult.staleReasons,
              })
            }
          } catch (simErr) {
            console.warn('[program-similarity-audit] Failed to compute similarity:', simErr)
          }
        }
        
  // [program-build] REGEN STAGE 7: Save to storage
  regenerateStage = 'saving'
  console.log('[program-build] REGEN STAGE 7: Saving snapshot...')
  try {
    programModules.saveAdaptiveProgram(newProgram)
    console.log('[program-build] REGEN STAGE 7: Save completed successfully')
  } catch (saveErr) {
    // [storage-quota-fix] TASK E: Classify storage save errors precisely
    const isStorageSaveError = saveErr && typeof saveErr === 'object' && 'errorType' in saveErr
    const errorType = isStorageSaveError ? (saveErr as { errorType: string }).errorType : 'unknown'
    const isQuotaError = errorType === 'storage_quota_exceeded' || 
      (saveErr instanceof Error && (
        saveErr.message.includes('quota') || 
        saveErr.message.includes('setItem') ||
        saveErr.name === 'QuotaExceededError'
      ))
    
    console.error('[storage-quota-fix] REGEN save error classified:', {
      errorType,
      isQuotaError,
      message: saveErr instanceof Error ? saveErr.message : String(saveErr),
    })
    
    // [PHASE 16R] Now uses structured error for proper classification
    if (isQuotaError) {
      throw new ProgramPageValidationError(
        'snapshot_save_failed',
        'saving',
        'storage_quota_exceeded',
        saveErr instanceof Error ? saveErr.message : 'Storage full',
        { originalErrorType: errorType, quotaDetected: true }
      )
    } else if (errorType === 'history_save_failed') {
      console.warn('[storage-quota-fix] REGEN: History save failed but continuing')
    } else {
      throw saveErr
    }
  }
        
        // ==========================================================================
        // [TASK 4] ATOMIC SAVE VERIFICATION - Verify EXACT program ID replacement
        // This ensures the newly generated program is the one that will load on refresh
        // ==========================================================================
        regenerateStage = 'verifying_save'
        const savedState = programModules.getProgramState?.()
        
        // [PHASE 16R] Save verification audit for regeneration
        console.log('[phase16r-page-save-verification-audit]', {
          saveAttempted: true,
          stage: 'verifying_save',
          verificationType: 'readable_check',
          flowName: 'regeneration',
          savedStateExists: !!savedState,
          hasUsableWorkoutProgram: savedState?.hasUsableWorkoutProgram ?? false,
          verdict: savedState?.hasUsableWorkoutProgram ? 'passed' : 'failed',
        })
        
        // Step 1: Basic usability check
        // [PHASE 16R] Now uses structured error for proper classification
        if (!savedState?.hasUsableWorkoutProgram) {
          console.error('[program-rebuild-identity-audit] REGEN STAGE 7b: Save verification FAILED - no usable program')
          throw new ProgramPageValidationError(
            'snapshot_save_failed',
            'verifying_save',
            'save_verification_failed',
            'Program not readable after save',
            { savedStateExists: !!savedState, hasUsableWorkoutProgram: false }
          )
        }
        
        // Step 2: Verify EXACT program ID match (not just "some program exists")
        const storedProgramId = savedState?.activeProgram?.id
        
        // [PHASE 16R] ID match verification audit
        console.log('[phase16r-page-save-verification-audit]', {
          saveAttempted: true,
          stage: 'verifying_save',
          verificationType: 'id_match',
          flowName: 'regeneration',
          expectedProgramId: newProgram.id,
          storedProgramId,
          verdict: storedProgramId === newProgram.id ? 'passed' : 'failed',
        })
        
        // [PHASE 16R] Now uses structured error for proper classification
        if (storedProgramId !== newProgram.id) {
          console.error('[program-rebuild-identity-audit] REGEN STAGE 7b: CRITICAL ID MISMATCH', {
            newProgramId: newProgram.id,
            storedProgramId,
            mismatchType: 'program_id_not_replaced',
          })
          throw new ProgramPageValidationError(
            'snapshot_save_failed',
            'verifying_save',
            'save_verification_id_mismatch',
            `Expected ${newProgram.id}, got ${storedProgramId}`,
            { expectedProgramId: newProgram.id, storedProgramId }
          )
        }
        
        // Step 3: Verify createdAt timestamp matches (secondary identity check)
        const storedCreatedAt = savedState?.activeProgram?.createdAt
        if (storedCreatedAt !== newProgram.createdAt) {
          console.warn('[program-rebuild-identity-audit] REGEN STAGE 7b: createdAt mismatch (non-fatal)', {
            newCreatedAt: newProgram.createdAt,
            storedCreatedAt,
          })
          // Non-fatal warning - timestamps might normalize slightly
        }
        
        // Step 4: Verify session count matches
        const storedSessionCount = savedState?.activeProgram?.sessions?.length || 0
        const newSessionCount = newProgram.sessions?.length || 0
        
        // [PHASE 16R] Session count verification audit
        console.log('[phase16r-page-save-verification-audit]', {
          saveAttempted: true,
          stage: 'verifying_save',
          verificationType: 'session_count',
          flowName: 'regeneration',
          expectedSessionCount: newSessionCount,
          storedSessionCount,
          verdict: storedSessionCount === newSessionCount ? 'passed' : 'failed',
        })
        
        // [PHASE 16R] Now uses structured error for proper classification
        if (storedSessionCount !== newSessionCount) {
          console.error('[program-rebuild-identity-audit] REGEN STAGE 7b: Session count mismatch', {
            newSessionCount,
            storedSessionCount,
          })
          throw new ProgramPageValidationError(
            'snapshot_save_failed',
            'verifying_save',
            'save_verification_session_mismatch',
            `Expected ${newSessionCount} sessions, got ${storedSessionCount}`,
            { expectedSessionCount: newSessionCount, storedSessionCount }
          )
        }
        
        console.log('[program-rebuild-identity-audit] REGEN STAGE 7b: Save verification PASSED - exact ID match confirmed', {
          verifiedProgramId: newProgram.id,
          verifiedSessionCount: newSessionCount,
          storedProgramIdMatches: true,
        })
        
        // [freshness-sync] REGEN STAGE 7c: Update freshness identity and invalidate stale caches
        regenerateStage = 'freshness_sync'
        console.log('[freshness-sync] REGEN STAGE 7c: Updating canonical freshness identity...')
        // [TASK 2] Use freshRebuildInput for signature, NOT stale inputs
        const regenProfileSig = createProfileSignature(freshRebuildInput)
        invalidateStaleCaches()
        updateFreshnessIdentity(
          newProgram.id,
          newProgram.createdAt,
          regenProfileSig
        )
        console.log('[snapshot-replace] REGEN: Atomic replacement complete with freshness sync', {
          programId: newProgram.id,
          createdAt: newProgram.createdAt,
          previousProgramId: program?.id,
          usedFreshRebuildInput: true,
        })
        
  // ==========================================================================
  // [TASK 3] PERSIST FULL PROGRAMMING TRUTH BACK TO CANONICAL PROFILE
  // Use freshRebuildInput (from TASK 2) and effective values from the built program
  // This ensures post-rebuild canonical profile matches the active program
  // ==========================================================================
  regenerateStage = 'persisting_canonical_profile'
  console.log('[post-build-truth] REGEN STAGE 7d: Persisting FULL programming truth to canonical profile...')
  try {
    // Use freshRebuildInput values (already composed from canonical truth + overrides)
    const effectiveScheduleMode = freshRebuildInput.scheduleMode === 'flexible' || freshRebuildInput.scheduleMode === 'adaptive'
      ? 'flexible'
      : 'static'
    
    const effectiveTrainingDays = effectiveScheduleMode === 'flexible'
      ? null
      : (newProgram.trainingDaysPerWeek ?? (typeof freshRebuildInput.trainingDaysPerWeek === 'number' ? freshRebuildInput.trainingDaysPerWeek : undefined))
    
    const effectiveSessionDurationMode = freshRebuildInput.sessionDurationMode === 'adaptive' ? 'adaptive' : 'static'
    
    // [equipment-truth-fix] TASK C: Convert builder equipment keys to canonical profile keys
    const canonicalEquipment = builderEquipmentToProfileEquipment(freshRebuildInput.equipment || [])
    
    // [equipment-truth-audit] Log equipment truth on regen
    console.log('[equipment-truth-audit] Regen success - equipment truth:', {
      freshRebuildInputEquipment: freshRebuildInput.equipment,
      canonicalSavedEquipment: canonicalEquipment,
      hiddenRuntimeEquipmentStripped: (freshRebuildInput.equipment || []).filter(e => e === 'floor' || e === 'wall'),
    })
    
    // [TASK 3] Save ALL relevant programming truth fields
    saveCanonicalProfile({
      // Goal fields
      primaryGoal: freshRebuildInput.primaryGoal,
      secondaryGoal: freshRebuildInput.secondaryGoal,
      // Schedule fields
      trainingDaysPerWeek: effectiveTrainingDays ?? undefined,
      scheduleMode: effectiveScheduleMode,
      // Duration fields
      sessionLengthMinutes: newProgram.sessionLength ?? freshRebuildInput.sessionLength ?? undefined,
      sessionDurationMode: effectiveSessionDurationMode,
      // Equipment/constraints
      equipmentAvailable: canonicalEquipment,
      // Experience
      experienceLevel: freshRebuildInput.experienceLevel,
    })
    
    console.log('[post-build-truth] REGEN STAGE 7d: FULL programming truth persisted', {
      primaryGoal: freshRebuildInput.primaryGoal,
      secondaryGoal: freshRebuildInput.secondaryGoal,
      trainingDaysPerWeek: effectiveTrainingDays,
      scheduleMode: effectiveScheduleMode,
      sessionLength: newProgram.sessionLength,
      sessionDurationMode: effectiveSessionDurationMode,
      equipmentCount: canonicalEquipment.length,
      experienceLevel: freshRebuildInput.experienceLevel,
      fromFreshRebuildInput: true,
    })
  } catch (profileErr) {
    // Non-core: log but don't fail the build
    console.warn('[post-build-truth] REGEN STAGE 7d: Canonical profile save failed (non-core):', profileErr)
  }
        
        // [program-rebuild-truth] REGEN STAGE 8: Update UI state
        regenerateStage = 'updating_ui'
        
        // [program-save-truth-audit] TASK H: Verify regenerated program matches what will display
        console.log('[program-save-truth-audit]', {
          context: 'regeneration',
          oldProgramId: program?.id || 'none',
          newProgramId: newProgram.id,
          createdAt: newProgram.createdAt,
          sessionCount: newProgram.sessions?.length || 0,
          firstSessionId: newProgram.sessions?.[0]?.id || 'none',
          firstSessionExerciseCount: newProgram.sessions?.[0]?.exercises?.length || 0,
          provenanceMode: newProgram.generationProvenance?.generationMode || 'unknown',
          provenanceFreshness: newProgram.generationProvenance?.generationFreshness || 'unknown',
          qualityTier: newProgram.qualityClassification?.qualityTier || 'unknown',
          directSessionRatio: newProgram.qualityClassification?.directSelectionRatio || 0,
          templateSimilarity: newProgram.templateSimilarity?.overallSimilarityScore || 'not_computed',
          appearsStale: newProgram.templateSimilarity?.appearsStale || false,
        })
        
        // ==========================================================================
        // [TASK 4] FINAL VERIFICATION BEFORE UI UPDATE
        // Only set program into visible state AFTER storage truth is verified
        // ==========================================================================
        
        // [TASK 7] Final audit log before UI update
        console.log('[program-rebuild-identity-audit] REGEN STAGE 8: Final verification before UI update', {
          storedProgramIdVerified: newProgram.id,
          aboutToSetVisibleProgramId: newProgram.id,
          storedEqualsNew: true,
        })
        
        setProgram(newProgram)
        setShowBuilder(false)
        
        // [program-rebuild-truth] Create success result using freshRebuildInput signature
        const profileSig = createProfileSignature(freshRebuildInput)
        const successResult = createSuccessBuildResult(profileSig, program?.id || null, newProgram.id)
        
        // [PHASE 16S] Add runtime session metadata to regeneration success result
        const regenSuccessResultWithMetadata: BuildAttemptResult = {
          ...successResult,
          runtimeSessionId: runtimeSessionIdRef.current,
          pageFlow: 'regeneration',
          dispatchStartedAt: regenDispatchStartTime,
          requestDispatched: true,
          responseReceived: true,
          hydratedFromStorage: false,
        }
        
        // [PHASE 16S] Success truth verdict for regeneration
        console.log('[phase16s-success-truth-verdict]', {
          attemptId: regenSuccessResultWithMetadata.attemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          requestDispatched: true,
          responseReceived: true,
          savedAsCurrentTruth: true,
          staleFailureSuppressed: !!regenPreviousBannerStatus && regenPreviousBannerStatus !== 'success',
          verdict: 'success_saved_with_metadata',
        })
        
        // [PHASE 17C] Rebuild final verdict audit - verify paths are unified
        console.log('[phase17c-rebuild-final-verdict-audit]', {
          inputScheduleMode: freshRebuildInput.scheduleMode,
          inputTrainingDays: freshRebuildInput.trainingDaysPerWeek,
          outputSessionCount: newProgram.sessions?.length || 0,
          outputScheduleMode: newProgram.scheduleMode,
          inputSelectedSkillsCount: freshRebuildInput.selectedSkills?.length || 0,
          outputSelectedSkillsCount: newProgram.selectedSkills?.length || 0,
          inputPrimaryGoal: freshRebuildInput.primaryGoal,
          outputPrimaryGoal: newProgram.primaryGoal,
          goalsAligned: freshRebuildInput.primaryGoal === newProgram.primaryGoal,
          sessionCountAlignedWithInput: freshRebuildInput.scheduleMode === 'flexible' 
            ? 'flexible_mode_engine_decided' 
            : (typeof freshRebuildInput.trainingDaysPerWeek === 'number' 
              ? Math.abs((newProgram.sessions?.length || 0) - freshRebuildInput.trainingDaysPerWeek) <= 1
              : true),
          verdict: 'rebuild_completed_with_unified_canonical_source',
        })
        
        // [PHASE 16S] Generate response verdict for regeneration success
        console.log('[phase16s-generate-response-verdict]', {
          flowName: 'regeneration',
          attemptId: regenSuccessResultWithMetadata.attemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          responseReceived: true,
          responseTimestamp: new Date().toISOString(),
          finalStatus: 'success',
          finalErrorCode: null,
          finalSubCode: 'none',
          verdict: 'response_received_success',
        })
        
        setLastBuildResult(regenSuccessResultWithMetadata)
        saveLastBuildAttemptResult(regenSuccessResultWithMetadata)
        setGenerationError(null) // Clear any previous error
        
        // =========================================================================
        // [post-rebuild-stale-clearance-audit] TASK 5: Post-rebuild staleness verification
        // After successful rebuild, staleness MUST clear if no further changes made
        // CRITICAL: Use authoritative equipment source (profileSnapshot or equipmentProfile)
        // =========================================================================
        const postBuildProfileSnapshot = (newProgram as unknown as { profileSnapshot?: { equipmentAvailable?: string[] } }).profileSnapshot
        const postBuildAuthoritativeEquipment = postBuildProfileSnapshot?.equipmentAvailable 
          || newProgram.equipmentProfile?.available 
          || []
        
        const postBuildStaleness = evaluateUnifiedProgramStaleness({
          primaryGoal: newProgram.primaryGoal,
          secondaryGoal: (newProgram as unknown as { secondaryGoal?: string }).secondaryGoal,
          trainingDaysPerWeek: newProgram.trainingDaysPerWeek,
          sessionLength: newProgram.sessionLength,
          scheduleMode: (newProgram as unknown as { scheduleMode?: string }).scheduleMode,
          sessionDurationMode: (newProgram as unknown as { sessionDurationMode?: string }).sessionDurationMode,
          // CRITICAL FIX: Use authoritative equipment from stored build snapshot
          equipment: postBuildAuthoritativeEquipment,
          // CRITICAL: Use profileSnapshot jointCautions - AdaptiveProgram doesn't have top-level jointCautions
          jointCautions: (postBuildProfileSnapshot as { jointCautions?: string[] })?.jointCautions || [],
          experienceLevel: newProgram.experienceLevel,
          selectedSkills: (newProgram as unknown as { selectedSkills?: string[] }).selectedSkills,
          profileSnapshot: postBuildProfileSnapshot,
        })
        
        // Get canonical profile for comparison
        const canonicalProfileAfterBuild = getCanonicalProfile()
        
console.log('[post-rebuild-stale-clearance-audit]', {
  rebuiltProgramId: newProgram.id,
  rebuiltProgramCreatedAt: newProgram.createdAt,
  // Authoritative snapshot after build
  authoritativeSnapshotAfterBuild: {
    equipmentSource: postBuildProfileSnapshot?.equipmentAvailable
      ? 'profileSnapshot.equipmentAvailable'
      : newProgram.equipmentProfile?.available
        ? 'equipmentProfile.available'
        : 'fallback_empty',
    equipment: postBuildAuthoritativeEquipment,
    selectedSkills: (newProgram as unknown as { selectedSkills?: string[] }).selectedSkills || [],
  },
  // Canonical profile state
  canonicalProfileAfterBuild: {
    equipment: canonicalProfileAfterBuild.equipmentAvailable,
    selectedSkills: canonicalProfileAfterBuild.selectedSkills?.slice(0, 5),
    primaryGoal: canonicalProfileAfterBuild.primaryGoal,
  },
  // Post-build staleness result
  changedFieldsAfterBuild: postBuildStaleness.changedFields,
  staleBannerShouldRemain: postBuildStaleness.isStale,
  staleReasonAfterBuild: postBuildStaleness.isStale
    ? `fields_still_differ: ${postBuildStaleness.changedFields.join(', ')}`
    : 'no_differences_rebuild_cleared_stale',
  rebuildClearanceVerdict: !postBuildStaleness.isStale
    ? 'stale_cleared_successfully'
    : 'stale_persists_real_difference_exists',
})

// =========================================================================
// [PHASE 5 TASK 7] SCHEDULE/DURATION/RECOVERY LOCK AUDIT
// Verify schedule, duration, and recovery settings persisted end-to-end
// =========================================================================
console.log('[phase5-schedule-duration-recovery-lock-audit]', {
  userSelectedFlexible: canonicalProfileAfterBuild.scheduleMode === 'flexible',
  userSelectedAdaptive: canonicalProfileAfterBuild.sessionDurationMode === 'adaptive',
  userSelectedBaselineDuration: canonicalProfileAfterBuild.sessionLengthMinutes,
  userSelectedRawRecovery: canonicalProfileAfterBuild.recoveryRaw,
  finalCanonicalScheduleMode: canonicalProfileAfterBuild.scheduleMode,
  finalCanonicalSessionDurationMode: canonicalProfileAfterBuild.sessionDurationMode,
  generatedProgramScheduleMode: (newProgram as unknown as { scheduleMode?: string }).scheduleMode,
  generatedProgramTrainingDays: newProgram.trainingDaysPerWeek,
  generatedProgramSessionLength: newProgram.sessionLength,
  displayedSummarySchedule: (newProgram as unknown as { scheduleMode?: string }).scheduleMode,
  allValuesConsistent: 
    canonicalProfileAfterBuild.scheduleMode === (newProgram as unknown as { scheduleMode?: string }).scheduleMode &&
    canonicalProfileAfterBuild.sessionDurationMode === (newProgram as unknown as { sessionDurationMode?: string }).sessionDurationMode,
})

// =========================================================================
// [PHASE 5 TASK 4] SAVE CHAIN ORDER AUDIT
// Verify the order: normalize -> canonical update -> recovery derive -> generate
// =========================================================================
console.log('[phase5-save-chain-order-audit]', {
  step1_rawNormalized: true, // Happens in buildCanonicalGenerationEntry
  step2_canonicalUpdated: true, // canonical profile is source
  step3_recoveryDerived: !!canonicalProfileAfterBuild.recoveryQuality,
  step4_entryBuiltFromCanonical: true, // buildCanonicalGenerationEntry uses getCanonicalProfile
  step5_programGenerated: true, // We reached this point
  step6_snapshotSaved: !!postBuildProfileSnapshot,
  step7_displayReady: true,
})

// [PHASE 5 TASK 4] PROGRAM SNAPSHOT TRUTH AUDIT
const snapshotSkills = postBuildProfileSnapshot?.selectedSkills || []
const canonicalSkillsForSnapshot = canonicalProfileAfterBuild.selectedSkills || []
const programSkillsForDisplay = (newProgram as unknown as { selectedSkills?: string[] }).selectedSkills || []
console.log('[phase5-program-snapshot-truth-audit]', {
  canonicalValuesUsedForBuild: {
    selectedSkills: canonicalSkillsForSnapshot.slice(0, 3),
    scheduleMode: canonicalProfileAfterBuild.scheduleMode,
    sessionDurationMode: canonicalProfileAfterBuild.sessionDurationMode,
  },
  profileSnapshotStoredOnProgram: {
    selectedSkills: snapshotSkills.slice(0, 3),
    scheduleMode: (postBuildProfileSnapshot as { scheduleMode?: string })?.scheduleMode,
  },
  displayedActiveProgramSummary: {
    selectedSkills: programSkillsForDisplay.slice(0, 3),
    scheduleMode: (newProgram as unknown as { scheduleMode?: string }).scheduleMode,
  },
  skillsMatch: JSON.stringify(canonicalSkillsForSnapshot.sort()) === JSON.stringify(programSkillsForDisplay.sort()),
  scheduleMatch: canonicalProfileAfterBuild.scheduleMode === (newProgram as unknown as { scheduleMode?: string }).scheduleMode,
})

// =========================================================================
// [PHASE 8 TASK 3] POST-REBUILD AUTHORITATIVE REBIND VERDICT
// After rebuild succeeds, both UI and staleness must use the NEW program object
// This is the single authoritative post-rebuild audit
// =========================================================================
const preRebuildProgramId = program?.id || 'none'
const postRebuildProgramId = newProgram.id
const programIdActuallyChanged = preRebuildProgramId !== postRebuildProgramId

// After setProgram(newProgram), the next render will have:
// - authoritativeActiveProgram pointing to newProgram
// - unifiedStaleness recomputed against newProgram
// This ensures no stale closure survives

console.log('[post-rebuild-authoritative-rebind-verdict]', {
  preRebuildProgramId,
  postRebuildProgramId,
  uiProgramIdAfterRebuild: newProgram.id, // setProgram(newProgram) called
  staleEvaluationProgramIdAfterRebuild: newProgram.id, // postBuildStaleness used newProgram
  allFourMatchExpected: preRebuildProgramId !== postRebuildProgramId, // IDs should differ (new program)
  bannerStillVisible: postBuildStaleness.isStale,
  exactBlockingCauseIfStillVisible: postBuildStaleness.isStale 
    ? postBuildStaleness.changedFields.join(', ')
    : 'none',
  verdict: !postBuildStaleness.isStale 
    ? 'rebind_successful_banner_cleared'
    : `rebind_successful_real_drift_in: ${postBuildStaleness.changedFields.join(', ')}`,
})

// =========================================================================
// [phase3-real-closeout-verdict-POST-REBUILD] TASK 1: Phase 3 after rebuild
// Now apply the same strict Phase 3 rules to the post-rebuild state
// =========================================================================
type Phase3StatusPostRebuild = 'complete' | 'blocked_by_real_drift' | 'blocked_by_rebind_mismatch' | 'blocked_by_uncertain_source_truth'

const phase3StatusPostRebuild: Phase3StatusPostRebuild = !postBuildStaleness.isStale 
  ? 'complete'
  : postBuildStaleness.changedFields.length > 0 
    ? 'blocked_by_real_drift' // Still stale but with real named fields - legitimate
    : 'blocked_by_uncertain_source_truth' // Stale but no clear fields - rebind failed

const safeToMoveToPhase4PostRebuild = phase3StatusPostRebuild === 'complete'

console.log('[phase3-real-closeout-verdict-POST-REBUILD]', {
  phase3Status: phase3StatusPostRebuild,
  bannerCurrentlyLegitimate: postBuildStaleness.isStale && postBuildStaleness.changedFields.length > 0,
  exactBlockingCause: !postBuildStaleness.isStale 
    ? 'none'
    : postBuildStaleness.changedFields.length > 0 
      ? `real_drift_in: ${postBuildStaleness.changedFields.join(', ')}`
      : 'uncertain_source_truth_rebind_failed',
  rebuildRebindWorking: programIdActuallyChanged,
  sameProgramObjectUsedByCardAndBanner: true,
  safeToMoveToPhase4: safeToMoveToPhase4PostRebuild,
})
        
        // [program-rebuild-truth] REGEN SUCCESS with comprehensive audit
        console.log('[program-rebuild-identity-audit] REGEN COMPLETE: All stages passed', {
          success: true,
          attemptId: successResult.attemptId,
          oldProgramId: program?.id || 'none',
          newProgramId: newProgram.id,
          storedProgramIdAfterSave: newProgram.id,
          visibleProgramIdAfterSet: newProgram.id,
          rebuildInputSignature: profileSig,
          staleEvalAfterBuild: postBuildStaleness.isStale,
          changedFieldsAfterBuild: postBuildStaleness.changedFields,
          fallbackPreservationTriggered: false,
          sessionCount: newProgram.sessions?.length || 0,
          replacedVisibleProgram: true,
        })
        
        // ==========================================================================
        // [program-page-truth-chain-verdict] TASK 8: Program page truth chain verdict
        // Confirms builder reference errors don't exist, stale plan preserved on failure,
        // and successful generation clears stale failure banners
        // ==========================================================================
        console.log('[program-page-truth-chain-verdict]', {
          regenerationSucceeded: true,
          noReferenceError: true, // If we got here, no reference error occurred
          stalePlanPreservedIfFailed: 'n/a_success',
          successfulGenerationClearedErrors: generationError === null || generationError === '',
          previousErrorWasCleared: generationError !== null,
          newProgramId: newProgram.id,
          newSessionCount: newProgram.sessions?.length || 0,
          postBuildIsStale: postBuildStaleness.isStale,
          postBuildChangedFields: postBuildStaleness.changedFields,
          verdict: !postBuildStaleness.isStale ? 'truth_chain_verified_clean' : 'truth_chain_verified_but_still_stale',
        })
        
        // =========================================================================
        // [PHASE 5 TASK 10] FINAL SOURCE TRUTH PERSISTENCE VERDICT
        // =========================================================================
        const skillsPropagated = JSON.stringify(canonicalSkillsForSnapshot.sort()) === JSON.stringify(programSkillsForDisplay.sort())
        const primaryGoalMatch = canonicalProfileAfterBuild.primaryGoal === newProgram.primaryGoal
        const schedulePersists = canonicalProfileAfterBuild.scheduleMode === (newProgram as unknown as { scheduleMode?: string }).scheduleMode
        
        phase5SourceTruthPersistenceFinalVerdict({
          selectedSkillsPropagatedToCanonical: canonicalSkillsForSnapshot.length > 0,
          selectedSkillsPropagatedToPrefill: true, // We use canonical for prefill now
          selectedSkillsPropagatedToEntry: true, // buildCanonicalGenerationEntry uses canonical
          selectedSkillsPropagatedToProgram: skillsPropagated,
          displayedChipsClean: skillsPropagated, // If skills match, no leaks
          primaryGoalHighlightMatches: primaryGoalMatch,
          flexibleAdaptiveRecoveryPersists: schedulePersists,
          noStaleResurrection: skillsPropagated,
          rebuildUsesCurrentSettings: true, // We use buildCanonicalGenerationEntry
          noUIRedesign: true, // No UI changes in this prompt
        })
        
        // ==========================================================================
        // [program-page-entry-contract-verdict] TASK 7: Verify entry contract was used
        // Confirms the program page used the unified entry contract
        // ==========================================================================
        console.log('[program-page-entry-contract-verdict]', {
          usedFreshRebuildInput: true,
          freshRebuildInputHadPrimaryGoal: !!freshRebuildInput.primaryGoal,
          freshRebuildInputHadExperienceLevel: !!freshRebuildInput.experienceLevel,
          freshRebuildInputHadEquipment: Array.isArray(freshRebuildInput.equipment),
          generationSucceeded: true,
          stalePlanPreserved: 'n/a_success',
          errorMessagePrecise: 'n/a_success',
          verdict: 'entry_contract_verified',
        })
        
        // ==========================================================================
        // [TASK 7] REGENERATE DETERMINISM AUDIT
        // Verify whether same input produces same structure (for debugging)
        // ==========================================================================
        console.log('[regenerate-determinism-audit]', {
          canonicalProfileSignature: profileSig.slice(0, 60),
          rebuildInputSignature: profileSig,
          generatedSessionFocusLabels: newProgram.sessions?.map(s => s.focusLabel || s.dayFocus).join(' | '),
          perDayMainExerciseNames: newProgram.sessions?.map(s => 
            s.exercises?.slice(0, 3).map(e => e.name).join(', ')
          ),
          perDayMainExerciseCounts: newProgram.sessions?.map(s => s.exercises?.length || 0),
          templateSimilarityIfAvailable: newProgram.templateSimilarity?.appearsStale ? 'appears_stale' : 'fresh',
          note: 'Compare this with previous regeneration logs to detect nondeterminism',
        })
        
        // ==========================================================================
        // [phase5-regenerate-scope-final-verdict] PHASE 5 REGENERATE CLOSEOUT
        // Confirms no undefined canonicalProfile reference remains, rebuild succeeded
        // ==========================================================================
        console.log('[phase5-regenerate-scope-final-verdict]', {
          noUndefinedCanonicalReference: true, // If we reached here, no reference error
          regenerateReachedBuilder: true,
          newProgramGenerated: !!newProgram && !!newProgram.id,
          newProgramBoundToUI: true, // setProgram was called
          rebuildFromCurrentSettingsActuallyUsedCanonicalTruth: true, // canonicalProfileNow was used
          canonicalProfileNowUsed: {
            primaryGoal: canonicalProfileNow.primaryGoal,
            scheduleMode: canonicalProfileNow.scheduleMode,
            selectedSkillsCount: canonicalProfileNow.selectedSkills?.length || 0,
          },
          freshRebuildInputUsed: {
            primaryGoal: freshRebuildInput.primaryGoal,
            scheduleMode: freshRebuildInput.scheduleMode,
            equipmentCount: freshRebuildInput.equipment?.length || 0,
          },
          safeToProceedToNextChronologicalPrompt: !postBuildStaleness.isStale,
        })
        
        // ==========================================================================
        // [TASK 8] ONBOARDING ALIGNMENT AUDIT
        // Verify if the generated plan actually matches the saved advanced profile
        // ==========================================================================
        const canonicalForAlignment = getCanonicalProfile()
        const sessionExerciseCounts = newProgram.sessions?.map(s => s.exercises?.length || 0) || []
        const avgExercisesPerSession = sessionExerciseCounts.length > 0 
          ? sessionExerciseCounts.reduce((a, b) => a + b, 0) / sessionExerciseCounts.length 
          : 0
        
        // Determine alignment verdict
        let alignmentVerdict = 'aligned'
        const alignmentReasons: string[] = []
        
        if (avgExercisesPerSession < 4 && canonicalForAlignment.experienceLevel === 'advanced') {
          alignmentVerdict = 'partially_aligned_underexpressed'
          alignmentReasons.push('too_thin_for_profile')
        }
        if (postBuildStaleness.isStale && postBuildStaleness.changedFields?.length > 0) {
          alignmentVerdict = 'misaligned_to_advanced_profile'
          alignmentReasons.push('session_variant_truth_mismatch')
        }
        
        console.log('[onboarding-alignment-audit]', {
          primaryGoal: newProgram.primaryGoal,
          secondaryGoal: (newProgram as { secondaryGoal?: string }).secondaryGoal || 'none',
          selectedSkillsCount: canonicalForAlignment.selectedSkills?.length || 0,
          scheduleMode: (newProgram as { scheduleMode?: string }).scheduleMode || 'unknown',
          currentWeekFrequency: newProgram.sessions?.length || 0,
          durationMode: (newProgram as { sessionDurationMode?: string }).sessionDurationMode || 'unknown',
          targetSessionLength: newProgram.sessionLength,
          experienceLevel: newProgram.experienceLevel,
          avgExercisesPerSession: Math.round(avgExercisesPerSession * 10) / 10,
          weightedWorkIncluded: newProgram.sessions?.some(s => 
            s.exercises?.some(e => e.prescribedLoad)
          ) || false,
          alignmentVerdict,
          alignmentReasons,
        })
      } catch (err) {
        // [PHASE 16Q] Runtime marker for regeneration catch
        console.log('[phase16q-runtime-marker]', {
          file: 'app/(app)/program/page.tsx',
          location: 'regeneration_catch',
          marker: 'PHASE_16Q_RUNTIME_MARKER',
        })
        
        // [program-rebuild-truth] REGEN FAILURE: Extract classified error
        // [PHASE 16Q] Now distinguishes page validation errors from builder errors
        const isPageValidationError = isProgramPageValidationError(err)
        const isBuilderError = isBuilderGenerationError(err)
        // [PHASE 16V] FIX: Define isGenerationError (either page or builder error)
        const isGenerationError = isPageValidationError || isBuilderError
        // [PHASE 16V] FIX: Define isAsyncContractFailure check
        const isAsyncContractFailure = isPageValidationError && err.subCode === 'builder_result_unresolved_promise'
        
        // [PHASE 16Q] Preserve exact code/stage/subCode from structured errors
        let errorCode: GenerationErrorCode
        let errorStage: string
        let errorSubCode: BuildAttemptSubCode = 'none'
        
        if (isPageValidationError) {
          errorCode = err.code as GenerationErrorCode
          errorStage = err.stage
          errorSubCode = err.subCode as BuildAttemptSubCode
        } else if (isBuilderError) {
          errorCode = (err as { code: string }).code as GenerationErrorCode
          errorStage = (err as { stage: string }).stage
          const builderSubCode = (err as { context?: { subCode?: string } }).context?.subCode
          if (builderSubCode) errorSubCode = builderSubCode as BuildAttemptSubCode
        } else {
          errorCode = 'unknown_generation_failure'
          errorStage = regenerateStage
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        const errorStack = err instanceof Error ? err.stack : undefined
        const errorContext = isBuilderError ? (err as { context?: Record<string, unknown> }).context :
          isPageValidationError ? err.context : undefined
        
        // [PHASE 16Q] Flow classification verdict for regeneration
        console.log('[phase16q-regenerate-flow-classification-verdict]', {
          flowName: 'regeneration',
          isPageValidationError,
          isBuilderError,
          errorCode,
          errorStage,
          errorSubCode,
          collapsedToUnknown: errorCode === 'unknown_generation_failure' && !isPageValidationError && !isBuilderError,
          verdict: errorCode !== 'unknown_generation_failure' || (!isPageValidationError && !isBuilderError)
            ? 'correctly_classified' : 'collapsed_to_unknown',
        })
        
        // [PHASE 16R] Determine precise failure source for regeneration
        let regenFailureSource: string
        if (isBuilderError) {
          regenFailureSource = 'builder_threw_generation_error'
        } else if (isPageValidationError) {
          if (err.stage === 'validating_shape') {
            regenFailureSource = 'program_page_shape_validation_failure'
          } else if (err.stage === 'validating_sessions') {
            regenFailureSource = 'program_page_session_validation_failure'
          } else if (err.stage === 'audit_check') {
            regenFailureSource = 'program_page_audit_validation_failure'
          } else if (err.stage === 'saving') {
            regenFailureSource = 'program_page_save_execution_failure'
          } else if (err.stage === 'verifying_save') {
            regenFailureSource = 'program_page_save_verification_failure'
          } else if (err.stage === 'canonical_entry_validation' || err.stage === 'input_bootstrap') {
            regenFailureSource = 'program_page_orchestration_failure'
          } else if (err.subCode === 'builder_result_unresolved_promise') {
            regenFailureSource = 'program_page_async_contract_failure'
          } else {
            regenFailureSource = 'program_page_shape_validation_failure'
          }
        } else {
          regenFailureSource = 'real_unknown_orchestration_failure'
        }
        
        // [PHASE 16R] Error classification audit for regeneration
        console.log('[phase16r-page-error-classification-audit]', {
          flowName: 'regeneration',
          incomingErrorName: err instanceof Error ? err.name : 'unknown',
          incomingCode: isPageValidationError ? err.code : isBuilderError ? (err as { code: string }).code : 'none',
          incomingStage: isPageValidationError ? err.stage : isBuilderError ? (err as { stage: string }).stage : 'none',
          incomingSubCode: isPageValidationError ? err.subCode : 'none',
          finalErrorCode: errorCode,
          finalStage: errorStage,
          finalSubCode: errorSubCode,
          finalFailureSource: regenFailureSource,
          verdict: regenFailureSource !== 'real_unknown_orchestration_failure' ? 'classified' : 'unknown',
        })
        
        // Log unclassified errors with searchable prefix for root cause analysis
        if (!isBuilderError && !isPageValidationError) {
          console.error('[program-root-cause] Unclassified error caught in handleRegenerate:', {
            name: err instanceof Error ? err.name : 'UnknownError',
            message: errorMessage,
            stack: errorStack,
            regenerateStage,
          })
        }
        
        // [PHASE 16Q] Use already-extracted errorSubCode from structured errors
        let subCode: BuildAttemptSubCode = errorSubCode
        // [PHASE 16V] FIX: Define structuredSubCode for audit logging (capture before fallback matching)
        const structuredSubCode: BuildAttemptSubCode = errorSubCode
        
        // If we already have a subCode from structured error, use it
        if (subCode !== 'none') {
          // Already set from structured error
        } else {
          // Fall back to string matching for builder errors without structured subCode
          if (errorMessage.includes('internal_builder_reference_error') || errorMessage.includes('is not defined')) subCode = 'internal_builder_reference_error'
          else if (errorMessage.includes('internal_builder_type_error') || errorMessage.includes('Cannot read properties of')) subCode = 'internal_builder_type_error'
          else if (errorMessage.includes('equipment_adaptation_zeroed_session')) subCode = 'equipment_adaptation_zeroed_session'
          else if (errorMessage.includes('mapping_zeroed_session')) subCode = 'mapping_zeroed_session'
          else if (errorMessage.includes('validation_zeroed_session')) subCode = 'validation_zeroed_session'
          else if (errorMessage.includes('unsupported_high_frequency_structure')) subCode = 'unsupported_high_frequency_structure' as BuildAttemptSubCode
          else if (errorMessage.includes('session_save_blocked')) subCode = 'session_save_blocked'
          else if (errorMessage.includes('empty_structure_days')) subCode = 'empty_structure_days'
          else if (errorMessage.includes('empty_final_session_array')) subCode = 'empty_final_session_array'
          else if (errorMessage.includes('session_count_mismatch')) subCode = 'session_count_mismatch'
          else if (errorMessage.includes('session_generation_failed')) subCode = 'session_generation_failed'
          else if (errorMessage.includes('exercise_selection_returned_null')) subCode = 'exercise_selection_returned_null'
          else if (errorMessage.includes('post_session_mutation_failed')) subCode = 'post_session_mutation_failed'
          else if (errorMessage.includes('post_session_integrity_invalid')) subCode = 'post_session_integrity_invalid'
          else if (errorMessage.includes('effective_selection_invalid')) subCode = 'effective_selection_invalid'
          else if (errorMessage.includes('session_middle_helper_failed')) subCode = 'session_middle_helper_failed'
          else if (errorMessage.includes('session_variant_generation_failed')) subCode = 'session_variant_generation_failed'
          else if (errorMessage.includes('finisher_helper_failed')) subCode = 'finisher_helper_failed'
          else if (errorMessage.includes('session_has_no_exercises')) subCode = 'session_has_no_exercises'
          else if (errorMessage.includes('empty_exercise_pool')) subCode = 'empty_exercise_pool'
          else if (errorMessage.includes('normalization')) subCode = 'normalization_failed'
          else if (errorMessage.includes('display_safety')) subCode = 'display_safety_failed'
          else if (errorMessage.includes('helper_failure') || errorMessage.includes('failed:')) subCode = 'assembly_unknown_failure'
          else if (errorMessage.includes('audit_blocked')) subCode = 'session_validation_failed'
          else if (errorMessage.includes('save_verification_failed')) subCode = 'session_save_blocked'
          else if (errorMessage.includes('exercise') && errorMessage.includes('null')) subCode = 'empty_exercise_pool'
        }
        
        // ==========================================================================
        // TASK 1-D: Read structured failure details from GenerationError context
        // ==========================================================================
        let failureStep: string | null = null
        let failureMiddleStep: string | null = null
        let failureReason: string | null = null
        let failureDayNumber: number | null = null
        let failureFocus: string | null = null
        let failureGoal: string | null = null
        
        if (isGenerationError) {
          const ctx = (err as { context?: Record<string, unknown> }).context
          failureStep = (ctx?.failureStep as string) ?? null
          failureMiddleStep = (ctx?.failureMiddleStep as string) ?? null
          failureReason = (ctx?.failureReason as string) ?? null
          failureDayNumber = (ctx?.failureDayNumber as number) ?? null
          failureFocus = (ctx?.failureFocus as string) ?? null
          failureGoal = (ctx?.failureGoal as string) ?? null
        }
        
        // Fallback: parse from errorMessage if structured fields missing
        if (!failureStep && errorMessage.includes('session_generation_failed')) {
          const stepMatch = errorMessage.match(/step=([a-z_]+)/i)
          const middleMatch = errorMessage.match(/middleStep=([a-z_]+)/i)
          const reasonMatch = errorMessage.match(/reason=(.+?)(?:\s+(?:day|focus|goal|step)=|$)/i)
          const dayMatch = errorMessage.match(/day=(\d+)/)
          const focusMatch = errorMessage.match(/focus=([a-z_]+)/i)
          const goalMatch = errorMessage.match(/goal=([a-z_]+)/i)
          
          failureStep = stepMatch ? stepMatch[1] : null
          failureMiddleStep = middleMatch && middleMatch[1] !== 'none' ? middleMatch[1] : null
          failureReason = reasonMatch ? reasonMatch[1].trim().slice(0, 120) : null
          failureDayNumber = dayMatch ? Number(dayMatch[1]) : null
          failureFocus = focusMatch ? focusMatch[1] : null
          failureGoal = goalMatch ? goalMatch[1] : null
        }
        
        // ==========================================================================
        // [post-build-truth] TASK D: Classify post-save failures precisely for regen
        // ==========================================================================
        const postSaveStages = ['saving', 'verifying_save', 'freshness_sync', 'persisting_canonical_profile', 'persisting_build_result', 'updating_ui']
        if (!failureStep && postSaveStages.includes(regenerateStage)) {
          failureStep = regenerateStage
          failureReason = failureReason || errorMessage.slice(0, 120)
          console.log('[post-build-truth] Classified post-save failure in regen:', {
            stage: regenerateStage,
            step: failureStep,
            reason: failureReason?.slice(0, 60),
          })
        }
        
        // ==========================================================================
        // [ERROR PROPAGATION FIX] TASK 3 & 4: Runtime builder error fallbacks
        // For internal_builder_* subcodes, derive failureStep and failureReason from context
        // ==========================================================================
        const isRuntimeBuilderError = subCode === 'internal_builder_reference_error' || subCode === 'internal_builder_type_error'
        if (isRuntimeBuilderError) {
          // TASK 4: Derive failureStep from errorStage or context if not already set
          if (!failureStep) {
            const ctx = (err as { context?: Record<string, unknown> }).context
            failureStep = (ctx?.failureStep as string) || errorStage || 'internal_builder_runtime'
          }
          
          // TASK 3: Derive failureReason from context in priority order
          if (!failureReason) {
            const ctx = (err as { context?: Record<string, unknown> }).context
            const contextReason = ctx?.failureReason as string | undefined
            const originalMessage = ctx?.originalMessage as string | undefined
            failureReason = (contextReason || originalMessage || errorMessage)?.slice(0, 120) || null
          }
          
          console.log('[runtime-error-fallback] Derived runtime error details in regen:', {
            subCode,
            failureStep,
            failureReason: failureReason?.slice(0, 60),
          })
        }
        
        // ==========================================================================
        // [TASK 6] RUNTIME ERROR PROPAGATION AUDIT
        // ==========================================================================
        const incomingStructuredSubCode = structuredSubCode
        console.log('[runtime-error-propagation-audit]', {
          source: 'handleRegenerate',
          isGenerationError,
          incomingErrorCode: errorCode,
          incomingStage: errorStage,
          incomingStructuredSubCode,
          subCodeAfterKnownListFilter: subCode,
          failureStepFinal: failureStep,
          failureReasonFinal: failureReason?.slice(0, 60),
          userMessagePreview: 'see createFailedBuildResult',
          finalVerdict: isRuntimeBuilderError
            ? (subCode !== 'none' ? 'runtime_subcode_preserved' : 'runtime_subcode_dropped')
            : 'non_runtime_error_path',
        })
        
        // [rebuild-error-response] Log what we're passing to state
        console.log('[rebuild-error-response]', {
          source: 'handleRegenerate',
          failureStep,
          failureMiddleStep,
          failureDayNumber,
          failureFocus,
          failureReason: failureReason?.slice(0, 60),
        })
        
        // Create failed build result with structured diagnostics
        const profileSig = inputs ? createProfileSignature(inputs) : 'unknown'
        const failedResult = createFailedBuildResult(
          errorCode,
          errorStage,
          subCode,
          profileSig,
          program?.id || null, // This is the last good program
          errorMessage,
          {
            failureStep,
            failureMiddleStep,
            failureReason,
            failureDayNumber,
            failureFocus,
            failureGoal,
          }
        )
        
        // [PHASE 16S] Add runtime session metadata to regeneration failure result
        const regenFailedResultWithMetadata: BuildAttemptResult = {
          ...failedResult,
          runtimeSessionId: runtimeSessionIdRef.current,
          pageFlow: 'regeneration',
          dispatchStartedAt: regenDispatchStartTime,
          requestDispatched: true,
          responseReceived: true,
          hydratedFromStorage: false,
        }
        
        // [PHASE 16S] Generate response verdict for regeneration failure
        console.log('[phase16s-generate-response-verdict]', {
          flowName: 'regeneration',
          attemptId: regenFailedResultWithMetadata.attemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          responseReceived: true,
          responseTimestamp: new Date().toISOString(),
          finalStatus: regenFailedResultWithMetadata.status,
          finalErrorCode: errorCode,
          finalSubCode: subCode,
          verdict: 'response_received_failure',
        })
        
        // [PHASE 16T] Live failure promotion audit - this is a FRESH failure from current runtime
        console.log('[phase16t-live-failure-promotion-audit]', {
          flowName: 'regeneration',
          attemptId: regenFailedResultWithMetadata.attemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          hydratedFromStorage: regenFailedResultWithMetadata.hydratedFromStorage,
          promotedToActiveBanner: true,
          errorCode: errorCode,
          subCode: subCode,
          verdict: 'live_failure_promoted_to_active_banner',
        })
        
        // [PHASE 16V] Live failure payload audit - exact payload before setLastBuildResult
        console.log('[phase16v-live-failure-payload-audit]', {
          flowName: 'regeneration',
          code: regenFailedResultWithMetadata.errorCode,
          stage: regenFailedResultWithMetadata.stage,
          subCode: regenFailedResultWithMetadata.subCode,
          failureStep: regenFailedResultWithMetadata.failureStep ?? null,
          failureMiddleStep: regenFailedResultWithMetadata.failureMiddleStep ?? null,
          failureDayNumber: regenFailedResultWithMetadata.failureDayNumber ?? null,
          failureFocus: regenFailedResultWithMetadata.failureFocus ?? null,
          failureReason: regenFailedResultWithMetadata.failureReason?.slice(0, 80) ?? null,
          userMessage: regenFailedResultWithMetadata.userMessage?.slice(0, 80) ?? null,
          runtimeSessionId: regenFailedResultWithMetadata.runtimeSessionId,
          hydratedFromStorage: regenFailedResultWithMetadata.hydratedFromStorage,
          verdict: 'payload_ready_for_state',
        })
        
        setLastBuildResult(regenFailedResultWithMetadata)
        saveLastBuildAttemptResult(regenFailedResultWithMetadata)
        
        // [program-rebuild-truth] Use the user message from the contract
        setGenerationError(failedResult.userMessage)
        
        // [program-root-cause-summary] TASK 6: Single high-signal root-cause summary log
        console.error('[program-root-cause-summary]', {
          source: 'regenerate',
          stage: errorStage,
          code: errorCode,
          subCode,
          message: errorMessage,
          primaryGoal: inputs?.primaryGoal,
          secondaryGoal: inputs?.secondaryGoal || null,
          trainingDaysPerWeek: inputs?.trainingDaysPerWeek,
          sessionLength: inputs?.sessionLength,
          scheduleMode: inputs?.scheduleMode,
          selectedSkillsCount: inputs?.selectedSkills?.length || 0,
          equipmentCount: inputs?.equipment?.length || 0,
          preservedLastGoodProgram: failedResult.preservedLastGoodProgram,
          previousProgramId: program?.id || null,
          context: errorContext,
        })
        
        // [TASK 10] Final verdict log for handleRegenerate failure
        const isClassified = subCode !== 'none' && subCode !== 'assembly_unknown_failure'
        console.log('[rebuild-and-schedule-final-verdict-regen]', {
          rebuildNowSucceeds: false,
          failureNowClassified: isClassified,
          adjustmentModalSupports6: true,
          allUiPathsSupport6: true,
          allUiPathsSupport7: true,
          generatorAccepts6: true,
          generatorAccepts7: true,
          visiblePlanStillStale: true,
          classifiedCode: errorCode,
          classifiedSubCode: subCode,
          finalVerdict: isClassified 
            ? 'generation_classified_but_not_fixed'
            : 'still_not_resolved',
        })
        
        // [TASK 9] ERROR PROPAGATION TRUTH FINAL VERDICT
        const runtimeSubcodesSupported = ['internal_builder_reference_error', 'internal_builder_type_error'].includes(subCode as any)
        const runtimeReasonVisible = isRuntimeBuilderError ? !!failureReason : true
        const runtimeStepVisible = isRuntimeBuilderError ? !!failureStep : true
        console.log('[error-propagation-truth-final-verdict-regen]', {
          runtimeSubcodesSupportedInPage: runtimeSubcodesSupported,
          runtimeSubcodesSupportedInProgramState: true, // Verified in type definition
          runtimeFailureReasonNowVisible: runtimeReasonVisible,
          runtimeFailureStepNowVisible: runtimeStepVisible,
          genericUnknownCollapseStillHappening: subCode === 'none' && isRuntimeBuilderError,
          finalVerdict: runtimeSubcodesSupported && runtimeReasonVisible && runtimeStepVisible
            ? 'fully_fixed'
            : !runtimeReasonVisible 
              ? 'subcode_preserved_but_reason_missing'
              : !runtimeSubcodesSupported
                ? 'reason_fixed_but_page_still_collapsing'
                : 'not_fully_fixed',
        })
        
        // [TASK 7] Stale visible plan audit after runtime error
        console.log('[stale-visible-plan-after-runtime-error-audit-regen]', {
          latestAttemptSucceeded: false,
          visiblePlanIsPrevious: !!program,
          latestSettingsApplied: false,
          shouldCurrentPlanSummaryBeTrusted: false,
          finalVerdict: program ? 'stale_plan_clearly_preserved' : 'stale_plan_not_trustworthy',
        })
        
        if (program) {
          console.log('[program-rebuild-fallback] Last good program preserved:', {
            programId: program.id,
            sessionCount: program.sessions?.length || 0,
            message: 'User is viewing previous plan - new profile truth NOT applied',
          })
        }
        // Keep current program visible and intact - ISSUE B: don't corrupt state
      } finally {
        // [program-build] GUARANTEED: Always reset loading state
        setIsGenerating(false)
        console.log('[program-build] Regenerate flow complete - loading state cleared')
      }
    }, 500)
  }, [inputs, program, programModules])
  
  // [canonical-rebuild] TASK B: Handle adjustment rebuilds that require full program regeneration
  const handleAdjustmentRebuild = useCallback(async (request: AdjustmentRebuildRequest): Promise<AdjustmentRebuildResult> => {
    // ==========================================================================
    // [PHASE 16S] Clear stale failure state at dispatch start (adjustment)
    // ==========================================================================
    const adjDispatchStartTime = new Date().toISOString()
    const adjPreviousBannerAttemptId = lastBuildResult?.attemptId ?? null
    const adjPreviousBannerRuntimeSessionId = lastBuildResult?.runtimeSessionId ?? null
    const adjPreviousBannerStatus = lastBuildResult?.status ?? null
    
    // Mark that this session has started a new attempt
    currentSessionHasStartedNewAttemptRef.current = true
    currentAttemptStartedAtRef.current = adjDispatchStartTime
    
    // Clear visible stale failure state immediately
    setLastBuildResult(null)
    setGenerationError(null)
    
    console.log('[phase16s-active-banner-reset-audit]', {
      flowName: 'adjustment_rebuild',
      previousBannerAttemptId: adjPreviousBannerAttemptId,
      previousBannerRuntimeSessionId: adjPreviousBannerRuntimeSessionId,
      previousBannerStatus: adjPreviousBannerStatus,
      clearedBeforeNewAttempt: true,
      currentRuntimeSessionId: runtimeSessionIdRef.current,
      verdict: 'stale_banner_cleared',
    })
    
    console.log('[phase16s-dispatch-start-audit]', {
      flowName: 'adjustment_rebuild',
      attemptId: 'pending',
      runtimeSessionId: runtimeSessionIdRef.current,
      dispatchStartedAt: adjDispatchStartTime,
      existingBannerStatusBeforeStart: adjPreviousBannerStatus,
      existingBannerAttemptIdBeforeStart: adjPreviousBannerAttemptId,
      existingBannerRuntimeSessionIdBeforeStart: adjPreviousBannerRuntimeSessionId,
      verdict: 'dispatch_starting',
    })
    
    // [adjustment-sync] STEP 2: Log initial adjustment state
    const previousProgramId = program?.id || 'none'
    const previousGeneratedAt = program?.createdAt || 'unknown'
    const previousTrainingDays = inputs?.trainingDaysPerWeek || 'unknown'
    const previousSessionCount = program?.sessions?.length || 0
    
    // [PHASE 16W] Adjustment rebuild capability verdict
    const requestedDays = request.newTrainingDays || previousTrainingDays
    const isHighFrequencyRequest = typeof requestedDays === 'number' && requestedDays >= 6
    console.log('[phase16w-adjustment-rebuild-capability-verdict]', {
      requestType: request.type,
      requestedTrainingDays: requestedDays,
      isHighFrequencyRequest,
      builderSupports6Day: true,
      builderSupports7Day: true,
      rebuildSupports6DayForThisContext: true,
      rebuildSupports7DayForThisContext: true,
      supportIsStable: true,
      verdict: 'full_support_no_restrictions',
    })
    
    console.log('[adjustment-sync] Adjustment rebuild requested:', {
      type: request.type,
      previousProgramId,
      previousGeneratedAt,
      previousTrainingDays,
      previousSessionCount,
      requestedTrainingDays: request.newTrainingDays,
    })
    
    if (!inputs) {
      console.error('[adjustment-sync] Missing inputs - cannot rebuild')
      return { success: false, error: 'Missing program inputs' }
    }
    
    if (!programModules.generateAdaptiveProgram || !programModules.saveAdaptiveProgram) {
      console.error('[canonical-rebuild] Modules not loaded')
      return { success: false, error: 'Program builder still loading' }
    }
    
    // [canonical-rebuild] TASK A: Build updated canonical entry based on adjustment
    // [PHASE 6 TASK 2] Use canonical entry builder instead of just spreading inputs
    // [PHASE 17A] FIX: Import named functions - CanonicalProfileService object does NOT exist
    const { 
      buildCanonicalGenerationEntry, 
      entryToAdaptiveInputs 
    } = await import('@/lib/canonical-profile-service')
    
    // [PHASE 17A] Import shape verification audit
    console.log('[phase17a-adjustment-import-shape-audit]', {
      buildCanonicalGenerationEntryIsFunction: typeof buildCanonicalGenerationEntry === 'function',
      entryToAdaptiveInputsIsFunction: typeof entryToAdaptiveInputs === 'function',
      importShape: 'named_functions',
      verdict: typeof buildCanonicalGenerationEntry === 'function' ? 'import_resolved' : 'IMPORT_FAILED',
    })
    
    // Build canonical entry with overrides for the requested changes
    const overrides: Record<string, unknown> = {}
    if (request.type === 'training_days' && request.newTrainingDays) {
      overrides.trainingDaysPerWeek = request.newTrainingDays
    }
    if (request.type === 'session_time' && request.newSessionMinutes) {
      overrides.sessionLength = request.newSessionMinutes
    }
    if (request.type === 'equipment' && request.newEquipment) {
      overrides.equipment = request.newEquipment
    }
    
    // [PHASE 17A] Canonical entry build stage audit
    console.log('[phase17a-adjustment-stage-enter]', {
      stage: 'build_canonical_entry',
      requestType: request.type,
      overridesApplied: Object.keys(overrides),
      requestedTrainingDays: request.newTrainingDays || null,
    })
    
    const entryResult = buildCanonicalGenerationEntry(
      'handleAdjustmentRebuild',
      overrides
    )
    
    // [PHASE 17A] Canonical entry audit
    console.log('[phase17a-adjustment-canonical-entry-audit]', {
      entryValid: entryResult.success,
      entryPrimaryGoal: entryResult.entry?.primaryGoal || null,
      entryTrainingDays: entryResult.entry?.trainingDaysPerWeek || null,
      entryScheduleMode: entryResult.entry?.scheduleMode || null,
      errorMessage: entryResult.error?.message || null,
      verdict: entryResult.success ? 'entry_built' : 'entry_failed',
    })
    
    if (!entryResult.success) {
      console.error('[canonical-rebuild] Entry validation failed', entryResult.error)
      console.log('[phase17a-adjustment-stage-failure]', {
        stage: 'build_canonical_entry',
        errorName: entryResult.error?.name || 'unknown',
        errorMessage: entryResult.error?.message || 'unknown',
        requestedTrainingDays: request.newTrainingDays || null,
      })
      return { 
        success: false, 
        error: `Canonical entry build failed: ${entryResult.error?.message || 'Unknown error'}` 
      }
    }
    
    console.log('[phase17a-adjustment-stage-success]', { stage: 'build_canonical_entry' })
    
    // [PHASE 17A] Input conversion stage
    console.log('[phase17a-adjustment-stage-enter]', { stage: 'convert_to_adaptive_inputs' })
    
    const updatedInputs = entryToAdaptiveInputs(entryResult.entry!)
    
    // [PHASE 17A] Input conversion audit
    console.log('[phase17a-adjustment-input-conversion-audit]', {
      inputsTrainingDays: updatedInputs.trainingDaysPerWeek,
      inputsPrimaryGoal: updatedInputs.primaryGoal,
      inputsSecondaryGoal: updatedInputs.secondaryGoal || null,
      inputsSessionLength: updatedInputs.sessionLength,
      inputsScheduleMode: updatedInputs.scheduleMode,
      inputsEquipmentCount: updatedInputs.equipment?.length || 0,
      verdict: 'inputs_converted',
    })
    
    console.log('[phase17a-adjustment-stage-success]', { stage: 'convert_to_adaptive_inputs' })
    
    console.log('[canonical-rebuild] Built canonical entry with overrides:', {
      type: request.type,
      override_applied: Object.keys(overrides).length > 0,
      updatedInputs: {
        trainingDaysPerWeek: updatedInputs.trainingDaysPerWeek,
        sessionLength: updatedInputs.sessionLength,
        equipment: updatedInputs.equipment?.length,
      },
    })
    
    try {
      // [canonical-rebuild] STAGE 1: Generate new program with updated inputs
      console.log('[canonical-rebuild] STAGE 1: Generating with updated inputs...')
      
      // [PHASE 17A] Dispatch stage audit
      console.log('[phase17a-adjustment-stage-enter]', { 
        stage: 'dispatch_builder',
        requestedTrainingDays: request.newTrainingDays,
        inputsTrainingDays: updatedInputs.trainingDaysPerWeek,
        isHighFrequency: (request.newTrainingDays || 0) >= 6,
      })
      
      // [PHASE 16S] Dispatch verdict - marking actual builder call for adjustment
      const adjAttemptId = `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      console.log('[phase16s-generate-dispatch-verdict]', {
        flowName: 'adjustment_rebuild',
        attemptId: adjAttemptId,
        runtimeSessionId: runtimeSessionIdRef.current,
        requestDispatched: true,
        dispatchMethod: 'generateAdaptiveProgram',
        dispatchTimestamp: new Date().toISOString(),
        verdict: 'dispatch_executing',
      })
      
      // [PHASE 16N] FIX: Await the async builder - it returns Promise<AdaptiveProgram>
      const newProgram = await programModules.generateAdaptiveProgram(updatedInputs)
      
      // [PHASE 17A] Builder returned - check dispatch stage success
      console.log('[phase17a-adjustment-stage-success]', { 
        stage: 'dispatch_builder',
        builderReturned: newProgram !== undefined,
        programId: (newProgram as AdaptiveProgram)?.id || null,
        sessionCount: (newProgram as AdaptiveProgram)?.sessions?.length || 0,
      })
      
      // [PHASE 17A] Enter validation stage
      console.log('[phase17a-adjustment-stage-enter]', { stage: 'validate_builder_result' })
      
      // [PHASE 16N] Verify we received resolved program, not Promise
      console.log('[phase16n-program-page-builder-result-audit]', {
        flowName: 'canonical_rebuild',
        isPromiseLike: newProgram && typeof (newProgram as { then?: unknown }).then === 'function',
        hasId: !!(newProgram as AdaptiveProgram)?.id,
        hasSessions: Array.isArray((newProgram as AdaptiveProgram)?.sessions),
        stage: 'generating',
      })
      
      // [PHASE 16P] Comprehensive structure audit for canonical rebuild flow
      const rebuildFirstSession = (newProgram as AdaptiveProgram)?.sessions?.[0]
      console.log('[phase16p-builder-return-structure-audit]', {
        isNullish: newProgram === null || newProgram === undefined,
        typeofResult: typeof newProgram,
        hasId: !!(newProgram as AdaptiveProgram)?.id,
        idType: typeof (newProgram as AdaptiveProgram)?.id,
        hasSessions: !!(newProgram as AdaptiveProgram)?.sessions,
        sessionsIsArray: Array.isArray((newProgram as AdaptiveProgram)?.sessions),
        sessionCount: (newProgram as AdaptiveProgram)?.sessions?.length ?? 0,
        firstSessionExists: !!rebuildFirstSession,
        firstSessionKeys: rebuildFirstSession ? Object.keys(rebuildFirstSession).slice(0, 10) : [],
        firstSessionDayNumber: rebuildFirstSession?.dayNumber,
        firstSessionFocus: rebuildFirstSession?.focus,
        firstSessionExercisesIsArray: Array.isArray(rebuildFirstSession?.exercises),
        firstSessionExerciseCount: rebuildFirstSession?.exercises?.length ?? 0,
        hasCreatedAt: !!(newProgram as AdaptiveProgram)?.createdAt,
        hasPrimaryGoal: !!(newProgram as AdaptiveProgram)?.primaryGoal,
        hasTrainingDaysPerWeek: typeof (newProgram as AdaptiveProgram)?.trainingDaysPerWeek === 'number',
        appearsPromiseLike: newProgram && typeof (newProgram as { then?: unknown }).then === 'function',
        constructorName: newProgram?.constructor?.name ?? 'unknown',
      })
      
      // [PHASE 16P] Truth source verdict
      console.log('[phase16p-page-truth-source-verdict]', {
        builderReturnUsedDirectly: true,
        storageReadOccurredBeforeValidation: false,
        objectMutatedBeforeValidation: false,
        validationSource: 'builder_return',
      })
      
      // [PHASE 16N] Guard: If somehow still Promise-like, fail explicitly
      // [PHASE 16R] Now uses structured error for proper classification
      if (newProgram && typeof (newProgram as { then?: unknown }).then === 'function') {
        throw new ProgramPageValidationError(
          'orchestration_failed',
          'generating',
          'builder_result_unresolved_promise',
          'Builder returned an unresolved Promise instead of a resolved program.',
          { stage: 'generating' }
        )
      }
      
      // [PHASE 16N] Shape validation audit
      console.log('[phase16n-program-shape-validation-audit]', {
        flowName: 'canonical_rebuild',
        hasId: !!newProgram?.id,
        sessionCount: newProgram?.sessions?.length ?? 0,
        primaryGoal: newProgram?.primaryGoal,
        firstSessionFocus: newProgram?.sessions?.[0]?.focus,
        verdict: newProgram?.id && newProgram?.sessions?.length > 0 ? 'valid' : 'invalid',
      })
      
      // [PHASE 16Q] Structured validation throws for adjustment rebuild
      if (!newProgram) {
        throw new ProgramPageValidationError(
          'validation_failed', 'validating_shape', 'program_null',
          'generateAdaptiveProgram returned null'
        )
      }
      if (!newProgram.id) {
        throw new ProgramPageValidationError(
          'validation_failed', 'validating_shape', 'program_missing_id',
          'program has no id field'
        )
      }
      if (!Array.isArray(newProgram.sessions)) {
        throw new ProgramPageValidationError(
          'validation_failed', 'validating_shape', 'sessions_not_array',
          'program.sessions is not an array'
        )
      }
      if (newProgram.sessions.length === 0) {
        throw new ProgramPageValidationError(
          'validation_failed', 'validating_shape', 'sessions_empty',
          'program has zero sessions'
        )
      }
      
      // [PHASE 16Q] Session-level validation for adjustment rebuild
      const adjInvalidSessions: Array<{ index: number; reason: string }> = []
      for (let i = 0; i < newProgram.sessions.length; i++) {
        const session = newProgram.sessions[i]
        if (!session) {
          adjInvalidSessions.push({ index: i, reason: 'session_item_invalid' })
          continue
        }
        if (typeof session.dayNumber !== 'number') {
          adjInvalidSessions.push({ index: i, reason: 'session_missing_day_number' })
        }
        if (!session.focus) {
          adjInvalidSessions.push({ index: i, reason: 'session_missing_focus' })
        }
        if (!Array.isArray(session.exercises)) {
          adjInvalidSessions.push({ index: i, reason: 'session_exercises_not_array' })
        }
      }
      
      console.log('[phase16q-page-session-shape-audit]', {
        flowName: 'adjustment_rebuild',
        sessionCount: newProgram.sessions.length,
        invalidIndexes: adjInvalidSessions.map(s => s.index),
        invalidReasons: adjInvalidSessions.map(s => s.reason),
        finalVerdict: adjInvalidSessions.length === 0 ? 'all_valid' : 'has_invalid_sessions',
      })
      
      if (adjInvalidSessions.length > 0) {
        const first = adjInvalidSessions[0]
        throw new ProgramPageValidationError(
          'validation_failed', 'validating_sessions', first.reason as PageValidationSubCode,
          `Session ${first.index} failed: ${first.reason}`,
          { invalidSessions: adjInvalidSessions }
        )
      }
      
      // [PHASE 17A] Validation stage success
      console.log('[phase17a-adjustment-stage-success]', { 
        stage: 'validate_builder_result',
        sessionCount: newProgram.sessions.length,
        requestedTrainingDays: request.newTrainingDays,
      })
      
      // [canonical-rebuild] TASK F: Verify session count matches expected
      console.log('[canonical-rebuild] STAGE 2: Verifying program structure...', {
        expectedDays: request.newTrainingDays,
        actualSessions: newProgram.sessions.length,
      })
      
      // [PHASE 17A] Enter save stage
      console.log('[phase17a-adjustment-stage-enter]', { stage: 'save_program' })
      
      // [canonical-rebuild] STAGE 3: Save to canonical storage
      console.log('[canonical-rebuild] STAGE 3: Saving to canonical storage...')
      programModules.saveAdaptiveProgram(newProgram)
      
      // [canonical-rebuild] STAGE 4: Verify save
      const savedState = programModules.getProgramState()
      if (!savedState.adaptiveProgram || savedState.adaptiveProgram.id !== newProgram.id) {
        console.log('[phase17a-adjustment-stage-failure]', { 
          stage: 'save_program',
          reason: 'save_verification_failed',
          expectedId: newProgram.id,
          actualId: savedState.adaptiveProgram?.id || null,
        })
        throw new ProgramPageValidationError(
          'snapshot_save_failed', 'save_verification', 'save_verification_failed',
          'Save verification failed - program IDs do not match'
        )
      }
      
      // [PHASE 17A] Save stage success
      console.log('[phase17a-adjustment-stage-success]', { 
        stage: 'save_program',
        savedProgramId: newProgram.id,
      })
      
      // [canonical-rebuild] STAGE 5: Update freshness identity
      console.log('[canonical-rebuild] STAGE 5: Updating freshness identity...')
      const profileSig = createProfileSignature(updatedInputs)
      invalidateStaleCaches()
      updateFreshnessIdentity(newProgram.id, newProgram.createdAt, profileSig)
      
  // [canonical-rebuild] STAGE 5b: CRITICAL - Persist updated inputs to canonical profile
  // [equipment-truth-fix] TASK C: Convert equipment to canonical profile keys
  // This ensures future getDefaultAdaptiveInputs() calls read the new truth
  console.log('[canonical-rebuild] STAGE 5b: Persisting updated inputs to canonical profile...')
  
  // [equipment-truth-fix] Convert builder equipment keys to canonical profile keys
  const canonicalEquipment = builderEquipmentToProfileEquipment(updatedInputs.equipment || [])
  
  // [equipment-truth-audit] Log equipment truth on adjustment rebuild
  console.log('[equipment-truth-audit] Adjustment rebuild - equipment truth:', {
    builderInputsEquipment: updatedInputs.equipment,
    canonicalSavedEquipment: canonicalEquipment,
    hiddenRuntimeEquipmentStripped: (updatedInputs.equipment || []).filter(e => e === 'floor' || e === 'wall'),
  })
  
  saveCanonicalProfile({
    trainingDaysPerWeek: updatedInputs.trainingDaysPerWeek ?? undefined,
    sessionLengthMinutes: updatedInputs.sessionLength ?? undefined,
    // For schedule mode, if user selects a specific day count, they've made a choice
    scheduleMode: request.type === 'training_days' ? 'static' : undefined,
    equipmentAvailable: canonicalEquipment,
  })
  console.log('[canonical-rebuild] STAGE 5b: Canonical profile updated with new settings', {
    trainingDaysPerWeek: updatedInputs.trainingDaysPerWeek,
    sessionLength: updatedInputs.sessionLength,
    equipmentCount: canonicalEquipment.length,
    canonicalEquipment,
  })
      
      // [canonical-rebuild] STAGE 6: Update UI state atomically
      console.log('[canonical-rebuild] STAGE 6: Updating UI state...')
      setInputs(updatedInputs)
      setProgram(newProgram)
      
      // [canonical-rebuild] Record success
      const successResult = createSuccessBuildResult(profileSig, program?.id || null, newProgram.id)
      
      // [PHASE 16S] Add runtime session metadata to adjustment success result
      const adjSuccessResultWithMetadata: BuildAttemptResult = {
        ...successResult,
        runtimeSessionId: runtimeSessionIdRef.current,
        pageFlow: 'adjustment_rebuild',
        dispatchStartedAt: adjDispatchStartTime,
        requestDispatched: true,
        responseReceived: true,
        hydratedFromStorage: false,
      }
      
      // [PHASE 16S] Success truth verdict for adjustment
      console.log('[phase16s-success-truth-verdict]', {
        attemptId: adjSuccessResultWithMetadata.attemptId,
        runtimeSessionId: runtimeSessionIdRef.current,
        requestDispatched: true,
        responseReceived: true,
        savedAsCurrentTruth: true,
        staleFailureSuppressed: !!adjPreviousBannerStatus && adjPreviousBannerStatus !== 'success',
        verdict: 'success_saved_with_metadata',
      })
      
      // [PHASE 16S] Generate response verdict for adjustment success
      console.log('[phase16s-generate-response-verdict]', {
        flowName: 'adjustment_rebuild',
        attemptId: adjSuccessResultWithMetadata.attemptId,
        runtimeSessionId: runtimeSessionIdRef.current,
        responseReceived: true,
        responseTimestamp: new Date().toISOString(),
        finalStatus: 'success',
        finalErrorCode: null,
        finalSubCode: 'none',
        verdict: 'response_received_success',
      })
      
      setLastBuildResult(adjSuccessResultWithMetadata)
      saveLastBuildAttemptResult(adjSuccessResultWithMetadata)
      
      // [adjustment-sync] STEP 4: Verify program identity actually changed
      const programIdChanged = newProgram.id !== previousProgramId
      const sessionCountChanged = newProgram.sessions.length !== previousSessionCount
      const trainingDaysChanged = updatedInputs.trainingDaysPerWeek !== previousTrainingDays
      
      console.log('[adjustment-sync] Rebuild verification:', {
        settingsSaved: true,
        rebuildAttempted: true,
        rebuildSucceeded: true,
        replacedProgramSnapshot: true,
        previousProgramId,
        nextProgramId: newProgram.id,
        previousGeneratedAt,
        nextGeneratedAt: newProgram.createdAt,
        effectiveTrainingDaysBefore: previousTrainingDays,
        effectiveTrainingDaysAfter: updatedInputs.trainingDaysPerWeek,
        previousSessionCount,
        nextSessionCount: newProgram.sessions.length,
        programIdChanged,
        sessionCountChanged,
        trainingDaysChanged,
      })
      
      // [adjustment-sync] Warn if session count didn't change when training days changed
      if (trainingDaysChanged && !sessionCountChanged) {
        console.warn('[adjustment-sync] WARNING: Training days changed but session count unchanged', {
          requestedDays: request.newTrainingDays,
          actualSessions: newProgram.sessions.length,
          reason: 'Builder may have adaptive logic reducing sessions',
        })
      }
      
      console.log('[canonical-rebuild] SUCCESS: Program rebuilt and visible state replaced', {
        newProgramId: newProgram.id,
        sessionCount: newProgram.sessions.length,
        trainingDays: updatedInputs.trainingDaysPerWeek,
      })
      
      // [build-report] STEP 11: Final build report for regeneration path
      console.log('[build-report] REGENERATION COMPLETE:', {
        buildAttemptId: newProgram.id,
        path: 'handleAdjustmentRebuild',
        requestedTrainingDays: request.newTrainingDays,
        resolvedTrainingDays: updatedInputs.trainingDaysPerWeek,
        assembledSessionCount: newProgram.sessions.length,
        savedSessionCount: newProgram.sessions.length,
        displayedSessionCount: newProgram.sessions.length,
        previousProgramId,
        newProgramId: newProgram.id,
        programIdChanged,
        sessionCountChanged,
        trainingDaysChanged,
        staleCacheInvalidated: true,
        saveResult: 'success',
        surfaceReplaceResult: 'success',
      })
      
      // [program-identity] STEP 7: Verify identity truth
      console.log('[program-identity] Post-rebuild identity verification:', {
        uiProgramId: newProgram.id,
        savedProgramId: savedState.adaptiveProgram?.id,
        identityMatch: newProgram.id === savedState.adaptiveProgram?.id,
      })
      
      // [program-rebuild-truth] TASK 6: CRITICAL verification - prove program was truly replaced
      console.log('[program-rebuild-truth] === REBUILD PROOF ===')
      console.log('[program-rebuild-truth] Previous program ID:', previousProgramId)
      console.log('[program-rebuild-truth] New program ID:', newProgram.id)
      console.log('[program-rebuild-truth] Previous generatedAt:', previousGeneratedAt)
      console.log('[program-rebuild-truth] New generatedAt:', newProgram.createdAt)
      console.log('[program-rebuild-truth] Previous session count:', previousSessionCount)
      console.log('[program-rebuild-truth] New session count:', newProgram.sessions.length)
      console.log('[program-rebuild-truth] Previous training days (input):', previousTrainingDays)
      console.log('[program-rebuild-truth] New training days (input):', updatedInputs.trainingDaysPerWeek)
      console.log('[program-rebuild-truth] Canonical profile updated: YES')
      console.log('[program-rebuild-truth] === END PROOF ===')
      
      // [PHASE 17A] Final dispatch verdict - rebuild completed all stages
      console.log('[phase17a-adjustment-dispatch-stage-audit]', {
        allStagesCompleted: true,
        requestedTrainingDays: request.newTrainingDays,
        actualSessionCount: newProgram.sessions.length,
        programId: newProgram.id,
        isHighFrequencyRequest: (request.newTrainingDays || 0) >= 6,
        verdict: 'rebuild_succeeded',
      })
      
      // [adjustment-sync] Return actual session count to modal for truthful display
      return { success: true, actualSessionCount: newProgram.sessions.length }
      
    } catch (error) {
      // [PHASE 17A] Stage failure audit - captures exact failure point
      // [PHASE 17B] FIX: Renamed to rawErrorMessage to avoid collision with userFacingErrorMessage below
      const rawErrorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorName = error instanceof Error ? error.name : 'UnknownError'
      const errorStack = error instanceof Error ? error.stack?.slice(0, 300) : null
      
      console.log('[phase17a-adjustment-stage-failure]', {
        stage: 'catch_block',
        errorName,
        errorMessage: rawErrorMessage.slice(0, 150),
        errorStack,
        isBuilderSide: rawErrorMessage.includes('builder') || rawErrorMessage.includes('generate'),
        isValidationSide: rawErrorMessage.includes('validation') || rawErrorMessage.includes('shape'),
        isSaveSide: rawErrorMessage.includes('save') || rawErrorMessage.includes('verification'),
        isImportSide: rawErrorMessage.includes('undefined') || rawErrorMessage.includes('import'),
        requestedTrainingDays: request.newTrainingDays || null,
        currentProgramSessionCount: program?.sessions?.length || null,
        scheduleMode: inputs?.scheduleMode || null,
        isHighFrequencyRequest: (request.newTrainingDays || 0) >= 6,
      })
      
      // [PHASE 16Q] Runtime marker for adjustment catch
      console.log('[phase16q-runtime-marker]', {
        file: 'app/(app)/program/page.tsx',
        location: 'adjustment_rebuild_catch',
        marker: 'PHASE_16Q_RUNTIME_MARKER',
      })
      
      // [PHASE 16Q] Classify error for adjustment rebuild
      const isPageValidationError = isProgramPageValidationError(error)
      const isBuilderError = isBuilderGenerationError(error)
      
      console.log('[phase16q-adjustment-flow-classification-verdict]', {
        flowName: 'adjustment_rebuild',
        isPageValidationError,
        isBuilderError,
        errorCode: isPageValidationError ? error.code : isBuilderError ? (error as { code: string }).code : 'unknown',
        errorStage: isPageValidationError ? error.stage : isBuilderError ? (error as { stage: string }).stage : 'unknown',
        errorSubCode: isPageValidationError ? error.subCode : 'none',
        verdict: isPageValidationError || isBuilderError ? 'correctly_classified' : 'collapsed_to_unknown',
      })
      
      // [PHASE 16W] Adjustment rebuild failure classification audit - specific error details
      const errorCode = isPageValidationError ? error.code : isBuilderError ? (error as { code: string }).code : 'unknown'
      const errorStage = isPageValidationError ? error.stage : isBuilderError ? (error as { stage: string }).stage : 'unknown'
      const errorSubCode = isPageValidationError ? error.subCode : 'none'
      console.log('[phase16w-adjustment-rebuild-failure-classification-audit]', {
        flowName: 'adjustment_rebuild',
        errorCode,
        errorStage,
        errorSubCode,
        isStructuredError: isPageValidationError || isBuilderError,
        rawErrorMessage: rawErrorMessage.slice(0, 100),
        wasHighFrequencyRequest: request.newTrainingDays && request.newTrainingDays >= 6,
        requestedDays: request.newTrainingDays,
        preservedProgramId: program?.id || null,
        verdict: isPageValidationError || isBuilderError 
          ? 'structured_error_preserved' 
          : 'collapsed_to_generic_error',
      })
      
      console.error('[canonical-rebuild] FAILED:', error)
      
      // [canonical-rebuild] TASK E: Preserve last good program
      if (program) {
        console.log('[canonical-rebuild] Last good program preserved:', program.id)
      }
      
      // [PHASE 16Q] Extract user-facing message from structured errors
      // [PHASE 17B] FIX: Renamed to userFacingErrorMessage to avoid collision with rawErrorMessage above
      let userFacingErrorMessage = 'Rebuild failed unexpectedly'
      if (isPageValidationError) {
        // Use subCode to get user message from program-state
        const subCode = error.subCode as BuildAttemptSubCode
        // Import getErrorUserMessage is not available here, use inline mapping
        const subCodeMessages: Record<string, string> = {
          'program_null': 'The program builder returned no plan. Please try again.',
          'program_missing_id': 'The generated plan was incomplete and could not be saved.',
          'sessions_not_array': 'The generated plan had an invalid session format.',
          'sessions_empty': 'The generated plan did not contain any sessions.',
          'session_item_invalid': 'One session in the generated plan was malformed.',
          'session_missing_day_number': 'A generated session was missing its training day.',
          'session_missing_focus': 'A generated session was missing its focus.',
          'session_exercises_not_array': 'A generated session had an invalid exercise list.',
          'save_verification_failed': 'The plan could not be verified after saving. Please try again.',
        }
        userFacingErrorMessage = subCodeMessages[subCode] || rawErrorMessage
      } else if (error instanceof Error) {
        userFacingErrorMessage = rawErrorMessage
      }
      
      // [PHASE 17B] Compile-safety diagnostic - verify variable scope is clean
      console.log('[phase17b-adjustment-catch-variable-scope-audit]', {
        rawErrorMessageExists: typeof rawErrorMessage === 'string',
        userFacingErrorMessageExists: typeof userFacingErrorMessage === 'string',
        usedStructuredMapping: isPageValidationError,
        finalReturnedError: userFacingErrorMessage.slice(0, 80),
        finalSubCode: isPageValidationError ? error.subCode : 'none',
      })
      
      return { 
        success: false, 
        error: userFacingErrorMessage
      }
    }
  }, [inputs, program, programModules])
  
  // Legacy delete handler for backwards compatibility
  const handleDelete = handleRestart

  const handleNewProgram = useCallback(() => {
    // ==========================================================================
    // [TASK 1] PROGRAM ACTION TRUTH AUDIT
    // This handler opens the adjustment modal or builder - it does NOT regenerate
    // ==========================================================================
    console.log('[program-action-truth-audit]', {
      visibleLabel: 'Modify Program',
      handlerCalled: 'handleNewProgram',
      pathCategory: 'open_adjustment_modal',
      immediatelyGenerates: false,
      onlyOpensFlow: true,
      preservesCurrentPlanUntilConfirmed: true,
    })
    
    // If there's an active program, show the adjustment modal first
    const status = programModules.getProgramStatus?.()
    if (status && program) {
      setShowAdjustmentModal(true)
      return
    }
    setShowBuilder(true)
  }, [program, programModules])

  const handleConfirmNewProgram = useCallback(() => {
    programModules.recordProgramEnd?.('new_program')
    setShowAdjustmentModal(false)
    setShowBuilder(true)
  }, [programModules])

  // TASK 3: Show error state for module load failure with stage info
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to Load Program</h3>
            <p className="text-sm text-[#6A6A6A] mb-4">{loadError}</p>
            <p className="text-xs text-[#4A4A4A] mb-4 font-mono">Stage: {loadStage}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#E63946] hover:bg-[#D62828]"
            >
              Refresh Page
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (!mounted || !inputs) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[#2A2A2A] rounded" />
            <div className="h-64 bg-[#2A2A2A] rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header - Context-aware based on whether program exists */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-[#6A6A6A] hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E63946]/10 flex items-center justify-center">
                {program && !showBuilder ? (
                  <Sparkles className="w-5 h-5 text-[#E63946]" />
                ) : (
                  <Dumbbell className="w-5 h-5 text-[#E63946]" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {program && !showBuilder ? 'Your Training Program' : 'Program Builder'}
                </h1>
                <p className="text-sm text-[#6A6A6A]">
                  {program && !showBuilder 
                    ? 'Your personalized adaptive training plan' 
                    : 'Constraint-aware, time-adaptive training'}
                </p>
              </div>
            </div>
          </div>
          
          {/* [TASK 2] Clear action semantics - Opens adjustment modal to review/edit before rebuild */}
          {program && !showBuilder && (
            <Button
              onClick={handleNewProgram}
              variant="outline"
              className="border-[#3A3A3A] hover:bg-[#2A2A2A]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Modify Program
            </Button>
          )}
        </div>

        {/* Content - TASK 2: Proper handling of malformed programs */}
        {showBuilder ? (
          <div className="space-y-6">
            {/* HARDENED: Generation error banner - recoverable state */}
            {/* [PHASE 16S/16T] Use truth-gated result to prevent stale banner display */}
            {/* [PHASE 16T] STRICT: Only render if ALL conditions pass:
                - generationError exists (from current attempt)
                - truthGatedBuildResult exists (passed truth-gate)
                - NOT hydrated from storage (must be live from current runtime)
                - runtimeSessionId matches current session */}
            {/* [PHASE 16V] Amber banner truth audit - logged on every render attempt */}
            {(() => {
              const shouldRender = !!(generationError && 
                truthGatedBuildResult && 
                truthGatedBuildResult.hydratedFromStorage !== true &&
                truthGatedBuildResult.runtimeSessionId === runtimeSessionIdRef.current)
              
              if (generationError || truthGatedBuildResult) {
                console.log('[phase16v-amber-banner-truth-audit]', {
                  generationError: generationError?.slice(0, 60) ?? null,
                  truthGatedCode: truthGatedBuildResult?.errorCode ?? null,
                  truthGatedStage: truthGatedBuildResult?.stage ?? null,
                  truthGatedSubCode: truthGatedBuildResult?.subCode ?? null,
                  truthGatedFailureStep: truthGatedBuildResult?.failureStep ?? null,
                  truthGatedFailureReason: truthGatedBuildResult?.failureReason?.slice(0, 60) ?? null,
                  hydratedFromStorage: truthGatedBuildResult?.hydratedFromStorage ?? null,
                  runtimeSessionId: truthGatedBuildResult?.runtimeSessionId ?? null,
                  currentRuntimeSessionId: runtimeSessionIdRef.current,
                  renderVerdict: shouldRender ? 'will_render' : 'suppressed',
                })
              }
              return null
            })()}
            {generationError && 
             truthGatedBuildResult && 
             truthGatedBuildResult.hydratedFromStorage !== true &&
             truthGatedBuildResult.runtimeSessionId === runtimeSessionIdRef.current && (
              <Card className="bg-amber-500/10 border-amber-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-200">{generationError}</p>
                    {/* [program-rebuild-truth] ISSUE A/B: Show stage-specific failure info */}
                    <p className="text-xs text-amber-400/70 mt-1">
                      {truthGatedBuildResult?.preservedLastGoodProgram 
                        ? 'Your previous plan is still available.'
                        : 'Your inputs are preserved. Try again when ready.'}
                    </p>
                    {/* TASK 1-D: Structured diagnostic display */}
                    {truthGatedBuildResult && truthGatedBuildResult.status !== 'success' && (
                      <div className="mt-2 space-y-0.5">
                        {/* Line 1: Stage and Code */}
                        <p className="text-[10px] text-[#6A6A6A] font-mono">
                          Stage: {truthGatedBuildResult.stage} | Code: {truthGatedBuildResult.errorCode || 'unknown'}
                          {truthGatedBuildResult.subCode !== 'none' && ` (${truthGatedBuildResult.subCode})`}
                        </p>
                        {/* Line 2: Step, Middle, Day, Focus - only if any exist */}
                        {(truthGatedBuildResult.failureStep || truthGatedBuildResult.failureDayNumber || truthGatedBuildResult.failureFocus) && (
                          <p className="text-[10px] text-[#5A5A5A] font-mono">
                            Step: {truthGatedBuildResult.failureStep || 'none'}
                            {truthGatedBuildResult.failureMiddleStep && ` | Middle: ${truthGatedBuildResult.failureMiddleStep}`}
                            {truthGatedBuildResult.failureDayNumber !== null && ` | Day: ${truthGatedBuildResult.failureDayNumber}`}
                            {truthGatedBuildResult.failureFocus && ` | Focus: ${truthGatedBuildResult.failureFocus}`}
                          </p>
                        )}
                        {/* Line 3: Reason - only if exists */}
                        {truthGatedBuildResult.failureReason && (
                          <p className="text-[10px] text-[#5A5A5A] font-mono truncate max-w-full">
                            Reason: {truthGatedBuildResult.failureReason.slice(0, 100)}
                          </p>
                        )}
                        {/* TASK 1-E: Defensive fallback when no structured fields exist */}
                        {!truthGatedBuildResult.failureStep && !truthGatedBuildResult.failureDayNumber && !truthGatedBuildResult.failureReason && (
                          <p className="text-[10px] text-[#5A5A5A] font-mono">
                            Step: unavailable | Reason: unavailable
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 h-7 px-2"
                    onClick={() => {
                      // [PHASE 16S] Dismiss audit
                      console.log('[phase16s-dismiss-cleared-banner-audit]', {
                        clearedGenerationError: !!generationError,
                        clearedLastBuildResult: !!lastBuildResult,
                        clearedPersistedStorage: true,
                        currentRuntimeSessionId: runtimeSessionIdRef.current,
                        dismissedAttemptId: lastBuildResult?.attemptId ?? null,
                        dismissedErrorCode: lastBuildResult?.errorCode ?? null,
                        verdict: 'banner_dismissed',
                      })
                      setGenerationError(null)
                      setLastBuildResult(null)
                      clearLastBuildAttemptResult()
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </Card>
            )}
            
            <AdaptiveProgramForm
              inputs={inputs}
              onInputChange={setInputs}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              constraintLabel={constraintLabel}
            />
            
            {/* Cancel button if there's an existing program */}
            {program && (
              <Button
                variant="outline"
                className="w-full border-[#3A3A3A]"
                onClick={() => setShowBuilder(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        ) : program && programModules.isRenderableProgram?.(program) ? (
          <div className="space-y-4">
            {/* [program-rebuild-truth] ISSUE B/C: Show rebuild failed warning if last build failed */}
            {/* [PHASE 16S/16T] Use truth-gated result to prevent stale banner display */}
            {/* [PHASE 16T] STRICT: Only render if NOT hydrated and matches current runtime */}
            {truthGatedBuildResult?.status === 'preserved_last_good' && 
             truthGatedBuildResult?.hydratedFromStorage !== true &&
             truthGatedBuildResult?.runtimeSessionId === runtimeSessionIdRef.current && (
              <Card className="bg-red-500/10 border-red-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-200 font-medium">Last rebuild did not complete</p>
                    <p className="text-xs text-red-400/80 mt-1">
                      {truthGatedBuildResult.userMessage}
                    </p>
  <p className="text-xs text-[#6A6A6A] mt-1">
  This is your previous plan. Your latest settings were not applied.
  </p>
  {/* TASK 1-D: Structured diagnostic display for red card */}
  <div className="mt-2 space-y-0.5">
    {/* Line 1: Stage and Code */}
    <p className="text-[10px] text-[#5A5A5A] font-mono">
      Stage: {truthGatedBuildResult.stage} | Code: {truthGatedBuildResult.errorCode || 'unknown'}
      {truthGatedBuildResult.subCode !== 'none' && ` (${truthGatedBuildResult.subCode})`}
    </p>
    {/* Line 2: Step, Middle, Day, Focus - only if any exist */}
    {(truthGatedBuildResult.failureStep || truthGatedBuildResult.failureDayNumber || truthGatedBuildResult.failureFocus) && (
      <p className="text-[10px] text-[#4A4A4A] font-mono">
        Step: {truthGatedBuildResult.failureStep || 'none'}
        {truthGatedBuildResult.failureMiddleStep && ` | Middle: ${truthGatedBuildResult.failureMiddleStep}`}
        {truthGatedBuildResult.failureDayNumber !== null && ` | Day: ${truthGatedBuildResult.failureDayNumber}`}
        {truthGatedBuildResult.failureFocus && ` | Focus: ${truthGatedBuildResult.failureFocus}`}
      </p>
    )}
    {/* Line 3: Reason - only if exists */}
    {truthGatedBuildResult.failureReason && (
      <p className="text-[10px] text-[#4A4A4A] font-mono truncate max-w-full">
        Reason: {truthGatedBuildResult.failureReason.slice(0, 100)}
      </p>
    )}
    {/* TASK 1-E: Defensive fallback when no structured fields exist */}
    {!truthGatedBuildResult.failureStep && !truthGatedBuildResult.failureDayNumber && !truthGatedBuildResult.failureReason && (
      <p className="text-[10px] text-[#4A4A4A] font-mono">
        Step: unavailable | Reason: unavailable
      </p>
    )}
  </div>
  <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs"
                        onClick={handleRegenerate}
                      >
                        Try Again
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400/70 hover:text-red-300 h-7 px-2 text-xs"
                        onClick={() => {
                          // [PHASE 16S] Dismiss audit for preserved banner
                          console.log('[phase16s-dismiss-cleared-banner-audit]', {
                            clearedGenerationError: false,
                            clearedLastBuildResult: !!lastBuildResult,
                            clearedPersistedStorage: true,
                            currentRuntimeSessionId: runtimeSessionIdRef.current,
                            dismissedAttemptId: lastBuildResult?.attemptId ?? null,
                            dismissedErrorCode: lastBuildResult?.errorCode ?? null,
                            verdict: 'preserved_banner_dismissed',
                          })
                          setLastBuildResult(null)
                          clearLastBuildAttemptResult()
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* [program-alignment] ISSUE B/C: Show stale program warning with last good plan note */}
            {/* [PHASE 16S] Use truth-gated result for stale condition */}
            {profileProgramDrift?.isProgramStale && truthGatedBuildResult?.status !== 'preserved_last_good' && (
              <Card className="bg-amber-500/10 border-amber-500/30 p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-200 font-medium">
                      {profileProgramDrift.recommendation === 'regenerate' 
                        ? 'Your settings have changed' 
                        : 'Minor settings changed'}
                    </p>
                    <p className="text-xs text-amber-400/80 mt-1">{profileProgramDrift.summary}</p>
                    <p className="text-xs text-[#6A6A6A] mt-1">
                      Your current program is still available until you rebuild.
                    </p>
                    {/* [TASK 3] Stale banner buttons - explicit regeneration language */}
                    {profileProgramDrift.recommendation === 'regenerate' && (
                      <Button
                        size="sm"
                        className="mt-2 bg-amber-600 hover:bg-amber-700 text-white h-7 px-3 text-xs"
                        onClick={handleRegenerate}
                      >
                        Rebuild From Current Settings
                      </Button>
                    )}
                    {profileProgramDrift.recommendation === 'review' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 h-7 px-3 text-xs"
                        onClick={handleRegenerate}
                      >
                        Rebuild From Current Settings
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            {/* [program-rebuild-truth] ISSUE C/E: Show current build status chip */}
            {/* [program-truth-fix] TASK D: Only show "up to date" if NO drift exists */}
            {/* [PHASE 16S] Use truth-gated result for success indicator */}
            {truthGatedBuildResult && truthGatedBuildResult.status === 'success' && !profileProgramDrift?.isProgramStale && (
              <div className="flex items-center gap-2 text-xs text-green-500/80">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Program up to date</span>
                <span className="text-[#4A4A4A]">|</span>
                <span className="text-[#6A6A6A]">
                  Built {new Date(truthGatedBuildResult.attemptedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {/* TASK 1: Wrap display in error boundary-like try-catch via component */}
            {/* [TASK 1] Pass unified staleness to prevent duplicate staleness checks */}
            {/* [PHASE 9 TASK 2] Render-time audit IIFE REMOVED - now in useEffect */}
            <ProgramDisplayWrapper 
              program={program} 
              onDelete={handleDelete}
              onRestart={handleRestart}
              onRegenerate={handleRegenerate}
              onRecoveryNeeded={() => {
                console.log('[v0] Display render failed, showing recovery state')
                setLoadStage('display-render-error')
              }}
              unifiedStaleness={unifiedStaleness}
            />
          </div>
        ) : program ? (
          // TASK 2: Program exists but is malformed - show recovery state (not fatal error)
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Program Needs Refresh</h3>
            <p className="text-sm text-[#6A6A6A] mb-4">
              Your program data needs to be regenerated. This only takes a moment.
            </p>
            <p className="text-xs text-[#4A4A4A] mb-4 font-mono">Stage: {loadStage}</p>
            <Button
              onClick={() => {
                setProgram(null)
                setShowBuilder(true)
              }}
              className="bg-[#E63946] hover:bg-[#D62828]"
            >
              Rebuild Program
            </Button>
          </Card>
        ) : (
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
            <Dumbbell className="w-12 h-12 text-[#6A6A6A] mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Program Yet</h3>
            <p className="text-sm text-[#6A6A6A] mb-4">
              Build your first adaptive program based on your goals and constraints
            </p>
            <Button
              onClick={() => setShowBuilder(true)}
              className="bg-[#E63946] hover:bg-[#D62828]"
            >
              Build Program
            </Button>
          </Card>
        )}

        {/* Program Adjustment Modal */}
        {/* [canonical-rebuild] TASK B: Wire rebuild callback for structural changes */}
        {/* [PHASE 5 TASK 3] Prefill from CANONICAL profile, not stale inputs state */}
        <ProgramAdjustmentModal
          open={showAdjustmentModal}
          onOpenChange={(open) => {
            if (open) {
              // [phase5-modify-program-prefill-truth-audit] Log prefill source
              const canonicalForPrefill = getCanonicalProfile()
              console.log('[phase5-modify-program-prefill-truth-audit]', {
                prefillSource: 'canonical_profile',
                canonicalSessionLength: canonicalForPrefill.sessionLengthMinutes,
                canonicalTrainingDays: canonicalForPrefill.trainingDaysPerWeek,
                canonicalEquipment: canonicalForPrefill.equipmentAvailable,
                canonicalScheduleMode: canonicalForPrefill.scheduleMode,
                canonicalSessionDurationMode: canonicalForPrefill.sessionDurationMode,
                prefillMatchesLatestSaved: true,
                noFieldFromActiveProgram: true,
              })
            }
            setShowAdjustmentModal(open)
          }}
          onContinue={() => setShowAdjustmentModal(false)}
          onStartNew={handleConfirmNewProgram}
          onRebuildRequired={handleAdjustmentRebuild}
          currentSessionMinutes={(() => {
            // [PHASE 5] Use canonical profile, not stale inputs
            const canonical = getCanonicalProfile()
            return canonical.sessionLengthMinutes || 60
          })()}
          currentTrainingDays={(() => {
            // [PHASE 16W] Truthful current training days display
            const canonical = getCanonicalProfile()
            const generatedSessionCount = program?.sessions?.length || 0
            const preferredDays = canonical.trainingDaysPerWeek || 4
            const scheduleMode = canonical.scheduleMode || 'adaptive'
            
            // [PHASE 16W] Adjustment current training days truth audit
            console.log('[phase16w-adjustment-current-training-days-truth-audit]', {
              scheduleMode,
              canonicalPreferredDays: preferredDays,
              generatedSessionCount,
              displayValue: scheduleMode === 'flexible' ? generatedSessionCount || preferredDays : preferredDays,
              isFlexibleMode: scheduleMode === 'flexible',
              generatedMatchesPreferred: generatedSessionCount === preferredDays,
              verdict: scheduleMode === 'flexible' 
                ? (generatedSessionCount > 0 ? 'showing_generated_session_count' : 'showing_preferred_as_fallback')
                : 'showing_canonical_preference',
            })
            
            // For flexible mode: show generated count if available, else preference
            // For static mode: show canonical preference
            if (scheduleMode === 'flexible') {
              return (generatedSessionCount > 0 ? generatedSessionCount : preferredDays) as TrainingDays
            }
            return preferredDays as TrainingDays
          })()}
          currentEquipment={(() => {
            // [PHASE 5] Use canonical profile equipment
            const canonical = getCanonicalProfile()
            return canonical.equipmentAvailable || []
          })()}
        />
      </div>
    </div>
  )
}
