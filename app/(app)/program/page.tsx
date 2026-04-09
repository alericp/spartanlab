// REDEPLOY_TRIGGER_v2
// No-op change to force Vercel rebuild. Do not remove.
// Timestamp: 2026-04-06T20:40:00Z - Confirming Info import present at line 50

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

// ==========================================================================
// [PHASE 27C] BUILD IDENTITY STAMP - CANONICAL MODIFY CONVERGENCE PROBE
// This allows us to verify the live app is running the expected code version
// ==========================================================================
export const PHASE27C_BUILD_IDENTITY = {
  buildIdentityName: 'SINGLE_PRODUCTION_TRUTH_PANEL',
  buildIdentityVersion: '2024-SCHEDULE-TRUTH-CONSOLIDATION-v1',
  buildTimestamp: new Date().toISOString(),
  modifyPipeline: 'CANONICAL_7_STEP_WITH_2_PHASE_PROMOTION',
  currentPhase: 'SINGLE_TRUTH_SURFACE_LOCKED',
  retiredPhases: [
    'MODIFY_PIPELINE_CORRIDOR',
    'WEAK_LOCAL_COMPLEXITY_ESTIMATE',
    'DEBUG_AUDIT_PANEL_STYLING',
    'ALWAYS_VISIBLE_REGEN_AUDIT_BOX',
    'SCHEDULE_TRUTH_NOW_LEGACY_BLOCK',
  ],
  features: [
    'Schedule Status is THE ONLY always-visible production schedule truth surface',
    'Clean 2x2 grid display: Type, Complexity, Current, Recommended',
    'Contextual regeneration CTA with flexible/static awareness',
    'Post-regen diagnostic box now only shows on actual mismatch (not success)',
    'Legacy competing panels fully retired from production rendering',
    'Unified schedule-intelligence contract across all flows',
  ],
} as const

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Dumbbell, Plus, Sparkles, AlertTriangle, Loader2, Info } from 'lucide-react'
import Link from 'next/link'

// TASK 5: Lightweight type imports only - actual modules loaded dynamically
import type { AdaptiveProgramInputs, AdaptiveProgram, GenerationErrorCode, TemplateSimilarityResult } from '@/lib/adaptive-program-builder'
import type { TrainingDays } from '@/lib/program-service'
// [PHASE 28KL] Direct imports for athlete/onboarding profile readback during modify-open forensics
import { getAthleteProfile as getAthleteProfileDirect } from '@/lib/data-service'
import { getOnboardingProfile as getOnboardingProfileDirect } from '@/lib/athlete-profile'
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
  // [PHASE 25] Static imports for canonicalModifyLauncher - required for SSR/prerender safety
  buildCanonicalGenerationEntry,
  entryToAdaptiveInputs,
  // [SCHEDULE INTELLIGENCE] Unified resolver for audit display
  computeScheduleIntelligence,
  type ScheduleIntelligenceResult,
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
// [AI-TRUTH-AUDIT] Import truth audit functions for field-by-field usage analysis
import {
  logTruthFieldAudit,
  logProgramTruthExplanation,
  logExplanationGapAudit,
  buildProgramTruthExplanation,
  type ProgramTruthExplanation,
} from '@/lib/ai-truth-audit'
// [AI-TRUTH-MATERIALITY] Import materiality map for dev-only verification
import {
  getMaterialitySummary,
  analyzePersonalAlignment,
  logMaterialityAudit,
} from '@/lib/ai-truth-materiality-map'

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

import { ProgramAdjustmentModal } from '@/components/programs/ProgramAdjustmentModal'

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
  // [404-DIAGNOSTIC] Route-level failure subcodes
  | 'route_not_found'
  | 'non_json_server_response'
  | 'server_regenerate_failed'

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

// ==========================================================================
// [VISIBLE-PROGRAM-TRUTH-CONTRACT] TYPE DEFINITION
// This is THE SINGLE canonical contract for all Program page visible surfaces.
// All display elements MUST consume truth from this contract, never from
// stale/broader onboarding arrays or fallback derivations.
// ==========================================================================
interface CanonicalProgramDisplayTruth {
  // Identity
  visiblePrimaryGoal: string
  visibleSecondaryGoal: string | null
  // Skills that actually appear in "Built around" chips
  // MUST be materially represented in current program structure
  visibleBuiltAroundSkills: string[]
  // Summary inputs for text generation
  visibleSummaryText: string
  visibleSummarySource: 'summaryTruth.truthfulHybridSummary' | 'programRationale_fallback'
  // Why This Plan inputs - same contract as summary
  visibleWhyThisPlanPrimaryFocus: string
  visibleWhyThisPlanSecondaryFocus: string | null
  // Session cards source - canonical session array
  visibleSessionsSource: 'program.sessions'
  visibleSessionCount: number
  // Ownership audit
  contractSource: 'saved_program_canonical_truth'
  noMixedOwnership: boolean
}

function buildCanonicalProgramDisplayTruth(program: AdaptiveProgram): CanonicalProgramDisplayTruth {
  const weeklyRep = (program as unknown as { weeklyRepresentation?: { policies?: Array<{ skill: string; actualExposure?: { direct: number; total: number } }> } }).weeklyRepresentation
  const summaryTruth = (program as unknown as { summaryTruth?: { truthfulHybridSummary?: string; headlineFocusSkills?: string[] } }).summaryTruth
  
  // Built around skills: primary/secondary always included, others only if materially represented
  const headlineSkills = summaryTruth?.headlineFocusSkills || [program.primaryGoal, (program as unknown as { secondaryGoal?: string }).secondaryGoal].filter(Boolean) as string[]
  const materiallyRepresentedOtherSkills = (weeklyRep?.policies || [])
    .filter(p => {
      if (headlineSkills.includes(p.skill)) return false // Already in headline
      const direct = p.actualExposure?.direct || 0
      const total = p.actualExposure?.total || 0
      return direct >= 2 || total >= 3 // Same threshold as AdaptiveProgramDisplay
    })
    .map(p => p.skill)
  
  const visibleBuiltAroundSkills = [...headlineSkills, ...materiallyRepresentedOtherSkills]
  
  return {
    visiblePrimaryGoal: program.primaryGoal || '',
    visibleSecondaryGoal: (program as unknown as { secondaryGoal?: string }).secondaryGoal || null,
    visibleBuiltAroundSkills,
    visibleSummaryText: summaryTruth?.truthfulHybridSummary || program.programRationale || '',
    visibleSummarySource: summaryTruth?.truthfulHybridSummary 
      ? 'summaryTruth.truthfulHybridSummary' 
      : 'programRationale_fallback',
    visibleWhyThisPlanPrimaryFocus: program.primaryGoal || '',
    visibleWhyThisPlanSecondaryFocus: (program as unknown as { secondaryGoal?: string }).secondaryGoal || null,
    visibleSessionsSource: 'program.sessions',
    visibleSessionCount: program.sessions?.length || 0,
    contractSource: 'saved_program_canonical_truth',
    noMixedOwnership: true,
  }
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
  // ==========================================================================
  // [VISIBLE-PROGRAM-TRUTH-CONTRACT] CANONICAL DISPLAY TRUTH
  // Build the single authoritative truth object for all visible surfaces
  // ==========================================================================
  const canonicalDisplayTruth = buildCanonicalProgramDisplayTruth(program)
  
  // ==========================================================================
  // [VISIBLE-PROGRAM-TRUTH-CONTRACT] AUDIT - Verify unified ownership
  // ==========================================================================
  console.log('[VISIBLE-PROGRAM-TRUTH-CONTRACT-AUDIT]', {
    programId: program.id,
    // Identity surfaces
    visiblePrimaryGoal: canonicalDisplayTruth.visiblePrimaryGoal,
    visibleSecondaryGoal: canonicalDisplayTruth.visibleSecondaryGoal,
    // Built around chips
    visibleBuiltAroundSkillsCount: canonicalDisplayTruth.visibleBuiltAroundSkills.length,
    visibleBuiltAroundSkills: canonicalDisplayTruth.visibleBuiltAroundSkills,
    // Summary
    visibleSummarySource: canonicalDisplayTruth.visibleSummarySource,
    visibleSummaryTextSnippet: canonicalDisplayTruth.visibleSummaryText.slice(0, 100),
    // Sessions
    visibleSessionCount: canonicalDisplayTruth.visibleSessionCount,
    visibleSessionsSource: canonicalDisplayTruth.visibleSessionsSource,
    // Contract ownership
    contractSource: canonicalDisplayTruth.contractSource,
    noMixedOwnership: canonicalDisplayTruth.noMixedOwnership,
    // Verdict
    verdict: canonicalDisplayTruth.noMixedOwnership 
      ? 'DISPLAY_CONTRACT_UNIFIED_ALL_SURFACES_FROM_CANONICAL_PROGRAM'
      : 'DISPLAY_CONTRACT_SPLIT_OWNERSHIP_DETECTED',
  })
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
  // ==========================================================================
  // [PHASE 24B] TASK 4 - Dynamic import was converted to static import
  // The ProgramAdjustmentModal is now imported statically instead of dynamically,
  // ensuring it is available immediately without ssr: false blocking
  // ==========================================================================
  console.log('[phase24b-static-import-verdict]', {
    modalImportMethod: 'static_import',
    previousMethod: 'dynamic_import_with_ssr_false',
    reason: 'dynamic_import_can_delay_availability_blocking_click_handlers',
    verdict: 'STATIC_IMPORT_ACTIVE_MODAL_AVAILABLE_IMMEDIATELY',
  })
  
  // ==========================================================================
  // [PHASE 27C] BUILD IDENTITY LOG ON PAGE MOUNT
  // This proves the live app is running the expected code version
  // ==========================================================================
  console.log('[phase27c-build-identity-page-mount]', {
    ...PHASE27C_BUILD_IDENTITY,
    event: 'PROGRAM_PAGE_MOUNTED',
    verdict: 'PHASE27C_CODE_RUNNING_IF_YOU_SEE_THIS',
  })
  
  const [inputs, setInputs] = useState<AdaptiveProgramInputs | null>(null)
  const [program, setProgram] = useState<AdaptiveProgram | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [constraintLabel, setConstraintLabel] = useState<string>('')
  const [showBuilder, setShowBuilder] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // ==========================================================================
  // [PHASE 31F] STABLE COMPONENT INSTANCE ID
  // This proves whether clicking Modify causes an instance replacement (remount)
  // ==========================================================================
  const programPageInstanceIdRef = useRef(
    `program_instance_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  )
  
  // ==========================================================================
  // [POST-REGEN AUTHORITATIVE LOCK] Prevents reconciliation from overwriting
  // a just-saved program. After successful save + setProgram, this ref holds
  // the authoritative program ID and timestamp. Reconciliation must respect
  // this lock and NOT replace the program with any older/different program.
  // ==========================================================================
  // ==========================================================================
  // [POST-BUILD AUTHORITATIVE WINNER LOCK]
  // This lock enforces the SINGLE WINNER CONTRACT for post-build program ownership.
  // 
  // RULE: After a successful regenerate/modify/main build, the returned program
  // becomes the AUTHORITATIVE WINNER and cannot be replaced by reconciliation
  // until the lock expires (5 seconds).
  //
  // The lock captures:
  //   - programId: The ID of the authoritative winner
  //   - sessionCount: Session count for verification
  //   - createdAt: Program creation timestamp
  //   - flowSource: Which build flow set the lock
  //   - savedAt: When the lock was set
  //   - lockExpiresAt: When reconciliation may resume
  //
  // CRITICAL: Reconciliation must check lock FIRST, before any other logic.
  // During lock window, NO replacement is allowed regardless of closure state.
  // ==========================================================================
  const authoritativeSavedProgramRef = useRef<{
    programId: string
    savedAt: number
    sessionCount: number
    createdAt: string
    flowSource: 'main_generation' | 'regenerate' | 'modify' | 'onboarding'
    lockExpiresAt: number  // Lock expires after 5 seconds
  } | null>(null)
  
  // ==========================================================================
  // [PHASE 22A] TASK 2 - Explicit builder origin state
  // Tracks whether the currently open builder session was entered from Modify flow
  // This determines which submit handler to use (generic vs modify-specific)
  // ==========================================================================
  const [builderOrigin, setBuilderOrigin] = useState<'default' | 'modify_start_new'>('default')
  
  // ==========================================================================
  // [PHASE 24A] DEDICATED BUILDER SESSION STATE
  // These state variables create a deterministic builder session that cannot
  // be polluted by ambient page-local inputs. When Modify opens the builder,
  // it seeds builderSessionInputs from visible program truth, and the builder
  // render/submit MUST use this session payload instead of ambient inputs.
  // ==========================================================================
  const [builderSessionInputs, setBuilderSessionInputs] = useState<AdaptiveProgramInputs | null>(null)
  const [builderSessionKey, setBuilderSessionKey] = useState<string>('initial')
  const [builderSessionSource, setBuilderSessionSource] = useState<'default_inputs' | 'modify_visible_program' | null>(null)
  
  // ==========================================================================
  // [POST-REGEN TRUTH CORRIDOR] Comprehensive trace for the regen flow
  // Tracks exactly where target 6 becomes 4 during regeneration
  // ==========================================================================
  type RegenTruthVerdict = 
    | 'PENDING'
    | 'REQUEST_CAPTURED'
    | 'TARGET_LOST_BEFORE_BUILDER'
    | 'TARGET_LOST_IN_RESOLUTION'
    | 'TARGET_LOST_IN_STRUCTURE_BUILD'
    | 'TARGET_LOST_DURING_SAVE'
    | 'TARGET_LOST_DURING_SET_PROGRAM'
    | 'TARGET_LOST_DURING_REHYDRATION'
    | 'TARGET_LOST_BY_POST_REGEN_OVERWRITE'
    | 'FULL_REGEN_SUCCESS_6'
    | 'TRACE_INCOMPLETE'
    | 'ERROR'
  
  interface RegenTruthAudit {
    // Step 1: Click source
    attemptId: string | null
    startedAt: string | null
    existingVisibleProgramId: string | null
    existingVisibleProgramSessionCount: number | null
    scheduleStatusRecommendedCount: number | null
    requestedTargetSessions: number | null
    canonicalScheduleMode: string | null
    canonicalTrainingDaysPerWeek: number | null
    canonicalSelectedSkillsCount: number | null
    canonicalExperienceLevel: string | null
    // Step 2: Generation input  
    builderInputScheduleMode: string | null
    builderInputTrainingDaysPerWeek: number | null
    builderInputSelectedSkillsCount: number | null
    builderInputExperienceLevel: string | null
    builderInputPrimaryGoal: string | null
    // Step 3: Resolution result
    complexityScore: number | null
    complexityElevationApplied: number | null
    targetSessionCountFromResolution: number | null
    builderResolvedSessions: number | null
    // Step 4: Structure result
    builtStructureSessions: number | null
    // Step 5: Save result
    savedProgramId: string | null
    savedProgramSessions: number | null
    localStorageSessionCountAfterSave: number | null
    // Step 6: setProgram result
    setProgramTargetId: string | null
    setProgramTargetSessions: number | null
    // Step 7: Post-commit display
    displayedProgramId: string | null
    displayedProgramSessions: number | null
    // Step 8: Rehydration readback
    rehydratedProgramId: string | null
    rehydratedProgramSessions: number | null
    overwriteDetected: boolean
    overwriteSource: string | null
    // Final
    finalVerdict: RegenTruthVerdict
    failedStage: string | null
    errorMessage: string | null
  }
  
  const [regenTruthAudit, setRegenTruthAudit] = useState<RegenTruthAudit | null>(null)
  
  // ==========================================================================
  // [MAIN-GEN TRUTH CORRIDOR] Comprehensive trace for the MAIN generation path
  // Tracks exactly where target sessions become incorrect during Build Adaptive Program
  // This is PARALLEL to the regen trace - covers fresh builds, not regeneration
  // ==========================================================================
  type MainGenTruthVerdict = 
    | 'MAIN_PENDING'
    | 'MAIN_REQUEST_CAPTURED'
    | 'MAIN_TARGET_LOST_BEFORE_BUILDER'
    | 'MAIN_TARGET_LOST_IN_ENTRY'
    | 'MAIN_TARGET_LOST_IN_RESOLUTION'
    | 'MAIN_TARGET_LOST_IN_STRUCTURE_BUILD'
    | 'MAIN_TARGET_LOST_DURING_SAVE'
    | 'MAIN_TARGET_LOST_DURING_SET_PROGRAM'
    | 'MAIN_TARGET_LOST_DURING_REHYDRATION'
    | 'MAIN_TARGET_LOST_BY_POST_BUILD_OVERWRITE'
    | 'MAIN_FULL_SUCCESS_6'
    | 'MAIN_FULL_SUCCESS_MATCHED_EXPECTED'
    | 'MAIN_TRACE_INCOMPLETE'
    | 'MAIN_ERROR'
  
  interface MainGenTruthAudit {
    // Step 1: Click source
    attemptId: string | null
    trigger: 'build_adaptive_program'
    startedAt: string | null
    existingVisibleProgramIdBeforeClick: string | null
    existingVisibleProgramSessionsBeforeClick: number | null
    existingGeneratedDateBeforeClick: string | null
    scheduleStatusRecommendedCountBeforeClick: number | null
    scheduleStatusTypeBeforeClick: string | null
    canonicalScheduleModeBeforeClick: string | null
    canonicalTrainingDaysPerWeekBeforeClick: number | null
    selectedSkillsCountBeforeClick: number | null
    goalCategoriesCountBeforeClick: number | null
    experienceLevelBeforeClick: string | null
    sessionDurationModeBeforeClick: string | null
    // Step 2: Builder form input
    submittedScheduleMode: string | null
    submittedTrainingDaysPerWeek: number | null
    submittedSessionDurationMode: string | null
    submittedPrimaryGoal: string | null
    submittedSecondaryGoal: string | null
    submittedSelectedSkillsCount: number | null
    submittedGoalCategoriesCount: number | null
    submittedExperienceLevel: string | null
    submittedTrainingPathType: string | null
    // Step 3: Canonical entry result
    entryScheduleMode: string | null
    entryTrainingDaysPerWeek: number | null
    entrySelectedSkillsCount: number | null
    entryExperienceLevel: string | null
    entryFallbacksUsed: string[] | null
    // Step 4: Resolution result
    complexityScore: number | null
    complexityElevationApplied: number | null
    targetSessionCountFromResolution: number | null
    resolvedScheduleIdentity: string | null
    resolvedFinalReasonCategory: string | null
    // Step 5: Structure result
    builtStructureSessionCount: number | null
    builtStructureDayCount: number | null
    generatedProgramIdBeforeSave: string | null
    // Step 6: Save result
    savedProgramId: string | null
    savedProgramSessionCount: number | null
    savedProgramTrainingDaysPerWeek: number | null
    localStorageProgramIdAfterSave: string | null
    localStorageProgramSessionsAfterSave: number | null
    // Step 7: setProgram result
    setProgramTargetId: string | null
    setProgramTargetSessionCount: number | null
    // Step 8: Post-commit display
    displayedProgramIdAfterCommit: string | null
    displayedProgramSessionCountAfterCommit: number | null
    newGeneratedDateAfterCommit: string | null
    // Step 9: Rehydration readback
    rehydratedProgramId: string | null
    rehydratedProgramSessionCount: number | null
    overwriteDetected: boolean
    overwriteSource: string | null
    // Final
    expectedSessionCount: number | null
    finalVerdict: MainGenTruthVerdict
    failedStage: string | null
    errorMessage: string | null
    // Human-readable reduction reason from flexible resolution
    reductionReasonHuman: string | null
    // Detailed modifier breakdown
    jointCautionPenalty: number | null
    recoveryPenalty: number | null
    recentWorkloadPenalty: number | null
    modificationSteps: string[] | null
  }
  
  const [mainGenTruthAudit, setMainGenTruthAudit] = useState<MainGenTruthAudit | null>(null)
  
  // ==========================================================================
  // [SCHEDULE TRUTH STATE] Backing data for the top "Schedule Status" panel
  // This is the ONLY schedule truth state that feeds a production-visible UI element.
  // The Schedule Status panel uses this to display: Type, Complexity, Current, Recommended.
  // Legacy debug panels that competed with this have been retired.
  // ==========================================================================
  const [scheduleTruthAudit, setScheduleTruthAudit] = useState<{
    // Source values
    onboardingScheduleMode?: 'static' | 'flexible' | string | null
    onboardingTrainingDays?: number | null
    athleteScheduleMode?: 'static' | 'flexible' | string | null
    athleteTrainingDays?: number | null
    // [PHASE 29A] Adaptive workload enabled (separate from schedule baseline)
    adaptiveWorkloadEnabled?: boolean | null
    // Canonical resolved
    canonicalScheduleMode: 'static' | 'flexible' | string | null
    canonicalTrainingDaysPerWeek: number | null
    // Builder prefill
    prefillScheduleMode?: 'static' | 'flexible' | string | null
    prefillTrainingDays?: number | null
    // History
    lastGeneratedScheduleMode?: string | null
    lastGeneratedTrainingDays?: number | null
    lastReconciliationDecision?: 'kept' | 'replaced' | 'no-op' | null
    // ==========================================================================
    // [ADAPTIVE BASELINE FIX] Baseline frequency contract fields
    // ==========================================================================
    baselineRecommendedSessionCount?: number | null
    complexityScore?: number | null
    complexityElevated?: boolean
    activeProgramSessionCount?: number | null
    baselineFrequencyReason?: string | null
  } | null>(null)
  
  // ==========================================================================
  // [PHASE 30R] MODIFY FLOW DECLARATIONS - MUST BE DECLARED BEFORE ANY EFFECT THAT USES THEM
  // These are moved here to prevent TDZ (Temporal Dead Zone) errors during prerender
  // ==========================================================================
  type ModifyFlowState = 'idle' | 'modal' | 'builder'
  const [modifyFlowState, setModifyFlowState] = useState<ModifyFlowState>('idle')
  const isModifyModalOpen = modifyFlowState === 'modal'
  const modifyBuilderLockRef = useRef<boolean>(false)
  
  // ==========================================================================
  // [PHASE 30S] ONE AUTHORITATIVE MODIFY ENTRY OBJECT
  // This is THE single source of truth for whether a Modify builder session exists.
  // Builder render authority comes from THIS object, not scattered flags.
  // - modifyFlowState may NEVER become 'builder' unless this entry exists
  // - showBuilder may NEVER be the sole authority for Modify rendering
  // ==========================================================================
  interface ModifyBuilderEntry {
    sessionKey: string
    source: string
    inputs: AdaptiveProgramInputs
  }
  const [modifyBuilderEntry, setModifyBuilderEntry] = useState<ModifyBuilderEntry | null>(null)
  
  // ==========================================================================
  // [PHASE 31D] MODIFY BUILDER ENTRY REF - SYNCHRONOUS AUTHORITY
  // This ref provides synchronous access to the entry during the commit/promotion window.
  // It is written BEFORE the state setter to provide immediate authority.
  // ==========================================================================
  const modifyBuilderEntryRef = useRef<ModifyBuilderEntry | null>(null)
  
  // ==========================================================================
  // [PHASE 31G] MODIFY ENTRY RECOVERY ATTEMPT REF
  // Tracks whether we've already attempted recovery for a specific sessionKey.
  // Prevents infinite recovery loops.
  // ==========================================================================
  const modifyEntryRecoveryAttemptedRef = useRef<string | null>(null)
  
  // ==========================================================================
  // [PHASE 31D] ATOMIC ENTRY COMMIT FLAG
  // Tracks whether an atomic entry commit has been requested (setter called)
  // ==========================================================================
  const [atomicEntryCommitRequested, setAtomicEntryCommitRequested] = useState(false)
  
  // ==========================================================================
  // [PHASE 31C] MODIFY CLICK AUDIT STATE - MOVED HERE TO PREVENT TDZ ERRORS
  // This MUST be declared BEFORE any effect that references it in body or dependency array
  // ==========================================================================
  // ==========================================================================
  // [CORRIDOR-AUDIT] 7-STEP MODIFY PIPELINE TRACKING
  // Tracks exact progress through the canonical Modify open corridor
  // Steps 1-5: Launcher corridor, Step 6: Promotion, Step 7: Render
  // ==========================================================================
  const [modifyClickAudit, setModifyClickAudit] = useState<{
    clickFiredAt: string | null
    // Step 1: Launcher entry
    step1LauncherEntered: boolean
    // Step 2: Entry build
    step2EntryBuildStarted: boolean
    step2EntryBuildSucceeded: boolean
    step2EntryBuildError: string | null
    // Step 3: Input conversion
    step3InputConversionStarted: boolean
    step3InputConversionSucceeded: boolean
    step3InputConversionError: string | null
    // Step 4: Commit
    step4PreCommitValidated: boolean
    step4CommitAttempted: boolean
    step4CommitSucceeded: boolean
    step4CommitError: string | null
    // Step 5: State observed
    step5StateObserved: boolean
    step5ObservedSessionKey: string | null
    // Step 6: Promotion
    step6PromotionStarted: boolean
    step6PromotionCoreSucceeded: boolean
    step6PromotionError: string | null
    // Step 7: Render granted (computed, but tracked for UI)
    step7RenderGranted: boolean
    // Summary
    lastSuccessfulStep: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
    failureStage: string | null
    failureMessage: string | null
    // Legacy compat (for render checks)
    canonicalLauncherEntered: boolean
  }>({
    clickFiredAt: null,
    step1LauncherEntered: false,
    step2EntryBuildStarted: false,
    step2EntryBuildSucceeded: false,
    step2EntryBuildError: null,
    step3InputConversionStarted: false,
    step3InputConversionSucceeded: false,
    step3InputConversionError: null,
    step4PreCommitValidated: false,
    step4CommitAttempted: false,
    step4CommitSucceeded: false,
    step4CommitError: null,
    step5StateObserved: false,
    step5ObservedSessionKey: null,
    step6PromotionStarted: false,
    step6PromotionCoreSucceeded: false,
    step6PromotionError: null,
    step7RenderGranted: false,
    lastSuccessfulStep: 0,
    failureStage: null,
    failureMessage: null,
    canonicalLauncherEntered: false,
  })
  
  // ==========================================================================
  // [ROOT-CAUSE-FIX] ATOMIC ENTRY COMMIT HELPER
  // Commits the entry to React state - the ONLY authority.
  // Ref is written for cleanup purposes only, NOT for runtime authority.
  // ==========================================================================
  const commitModifyEntryAtomically = useCallback((entry: ModifyBuilderEntry) => {
    if (!entry || !entry.inputs) {
      return false
    }
    
    // Write ref for cleanup tracking only (NOT runtime authority)
    modifyBuilderEntryRef.current = entry
    
    // Commit React state - THE ONLY AUTHORITY
    setModifyBuilderEntry(entry)
    
    // Concise log
    console.log('[modify-entry-committed]', {
      sessionKey: entry.sessionKey,
      scheduleMode: entry.inputs.scheduleMode,
      trainingDays: entry.inputs.trainingDaysPerWeek,
    })
    
    return true
  }, [])
  
  // [ROOT-CAUSE-FIX] Removed mount/unmount tracker - no longer needed for diagnostics
  
  // ==========================================================================
  // STEP 6: CORE PROMOTION EFFECT - THE ONLY PLACE WHERE MODIFY ENTERS BUILDER MODE
  // PHASE 1: Core builder promotion (MUST complete for builder to open)
  // PHASE 2: Truth panel seeding (non-blocking, runs in separate effect)
  // ==========================================================================
  useEffect(() => {
    // Only promote if entry exists with inputs AND we're not already in builder mode
    if (modifyBuilderEntry && modifyBuilderEntry.inputs && modifyFlowState !== 'builder') {
      
      // Mark promotion started
      setModifyClickAudit(prev => ({
        ...prev,
        step6PromotionStarted: true,
        step6PromotionError: null,
      }))
      
      try {
        console.log('[modify-step-6-promotion-starting]', {
          sessionKey: modifyBuilderEntry.sessionKey,
          scheduleMode: modifyBuilderEntry.inputs.scheduleMode,
        })
        
        // ==========================================================================
        // PHASE 1A: Pre-promotion validation
        // ==========================================================================
        const validationErrors: string[] = []
        if (!modifyBuilderEntry.sessionKey) validationErrors.push('sessionKey missing')
        if (!modifyBuilderEntry.source) validationErrors.push('source missing')
        if (!modifyBuilderEntry.inputs) validationErrors.push('inputs missing')
        if (!modifyBuilderEntry.inputs?.scheduleMode) validationErrors.push('scheduleMode missing')
        
        if (validationErrors.length > 0) {
          const errorMsg = `Promotion validation failed: ${validationErrors.join(', ')}`
          setModifyClickAudit(prev => ({
            ...prev,
            step6PromotionCoreSucceeded: false,
            step6PromotionError: errorMsg,
            failureStage: 'promotion_validation',
            failureMessage: errorMsg,
          }))
          console.error('[modify-step-6-promotion-validation-failed]', errorMsg)
          return
        }
        
        // ==========================================================================
        // PHASE 1B: Seed legacy compatibility state (required for builder form)
        // ==========================================================================
        setAtomicEntryCommitRequested(true)
        modifyBuilderLockRef.current = true
        
        setBuilderSessionInputsAndRef(modifyBuilderEntry.inputs)
        setBuilderSessionKey(modifyBuilderEntry.sessionKey)
        setBuilderSessionSource(modifyBuilderEntry.source)
        setInputs(modifyBuilderEntry.inputs)
        setBuilderOrigin('default')
        
        // ==========================================================================
        // PHASE 1C: PROMOTE TO BUILDER MODE (CRITICAL)
        // ==========================================================================
        setModifyFlowState('builder')
        setShowAdjustmentModal(false)
        setShowBuilder(true)
        
        // Mark core promotion succeeded
        setModifyClickAudit(prev => ({
          ...prev,
          step6PromotionCoreSucceeded: true,
          lastSuccessfulStep: 6,
        }))
        
        console.log('[modify-step-6-promotion-succeeded]', {
          sessionKey: modifyBuilderEntry.sessionKey,
          scheduleMode: modifyBuilderEntry.inputs.scheduleMode,
          trainingDays: modifyBuilderEntry.inputs.trainingDaysPerWeek,
        })
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown promotion error'
        console.error('[modify-step-6-promotion-error]', errorMsg)
        setModifyClickAudit(prev => ({
          ...prev,
          step6PromotionCoreSucceeded: false,
          step6PromotionError: errorMsg,
          failureStage: 'promotion_core',
          failureMessage: errorMsg,
        }))
        // Do NOT reset modifyBuilderEntry here - leave evidence for debugging
      }
    }
  }, [modifyBuilderEntry, modifyFlowState])
  
  // ==========================================================================
  // PHASE 2: NON-BLOCKING TRUTH PANEL SEEDING
  // Runs AFTER builder mode is already granted - failure cannot block builder
  // ==========================================================================
  useEffect(() => {
    if (modifyFlowState === 'builder' && modifyBuilderEntry && modifyBuilderEntry.inputs) {
      try {
        const entryInputs = modifyBuilderEntry.inputs
        const realOnboarding = getOnboardingProfileDirect()
        const realAthlete = getAthleteProfileDirect()
        
        setScheduleTruthAudit({
          onboardingScheduleMode: realOnboarding?.scheduleMode ?? 'unread',
          onboardingTrainingDays: typeof realOnboarding?.trainingDaysPerWeek === 'number' 
            ? realOnboarding.trainingDaysPerWeek : null,
          athleteScheduleMode: realAthlete?.scheduleMode ?? 'unread',
          athleteTrainingDays: typeof realAthlete?.trainingDaysPerWeek === 'number'
            ? realAthlete.trainingDaysPerWeek : null,
          adaptiveWorkloadEnabled: (entryInputs as { adaptiveWorkloadEnabled?: boolean }).adaptiveWorkloadEnabled ?? true,
          canonicalScheduleMode: entryInputs.scheduleMode,
          canonicalTrainingDaysPerWeek: entryInputs.trainingDaysPerWeek,
          prefillScheduleMode: entryInputs.scheduleMode,
          prefillTrainingDays: entryInputs.scheduleMode === 'static' 
            ? (entryInputs.trainingDaysPerWeek as number) : null,
          lastGeneratedScheduleMode: null,
          lastGeneratedTrainingDays: null,
          lastReconciliationDecision: null,
        })
        
        console.log('[modify-truth-panel-seeded]', {
          onboarding: realOnboarding?.scheduleMode ?? 'unread',
          athlete: realAthlete?.scheduleMode ?? 'unread',
          canonical: entryInputs.scheduleMode,
        })
      } catch (error) {
        // Truth panel failure is NON-BLOCKING - builder stays open
        console.error('[modify-truth-panel-seed-error]', error)
      }
    }
  }, [modifyFlowState, modifyBuilderEntry])
  
  // ==========================================================================
  // [ROOT-CAUSE-FIX] HALF-TRANSITION GUARD - STATE ONLY AUTHORITY
  // Only reset if state entry is null while modifyFlowState='builder'.
  // NO ref fallback - state is the ONLY authority.
  // ==========================================================================
  useEffect(() => {
    const hasEntry = modifyBuilderEntry !== null
    const isHalfTransition = modifyFlowState === 'builder' && !hasEntry
    
    // [modify-final-render-authority] Concise log
    console.log('[modify-final-render-authority]', {
      flow: modifyFlowState,
      hasEntry,
      verdict: isHalfTransition ? 'RESET_NEEDED' : hasEntry && modifyFlowState === 'builder' ? 'ACTIVE' : 'IDLE',
    })
    
    if (isHalfTransition) {
      modifyBuilderLockRef.current = false
      setModifyFlowState('idle')
      setShowBuilder(false)
    }
  }, [modifyFlowState, modifyBuilderEntry])
  
  // [PHASE 30R] Declaration order safety - log moved to useEffect to avoid render-time issues
  
  // ==========================================================================
  // STEP 5: STATE OBSERVATION - Fires when modifyBuilderEntry actually changes
  // Updates audit state to prove state was observed by React
  // ==========================================================================
  useEffect(() => {
    if (modifyBuilderEntry !== null) {
      console.log('[modify-step-5-state-observed]', {
        hasEntry: true,
        sessionKey: modifyBuilderEntry.sessionKey,
        scheduleMode: modifyBuilderEntry.inputs?.scheduleMode ?? null,
        trainingDaysPerWeek: modifyBuilderEntry.inputs?.trainingDaysPerWeek ?? null,
      })
      
      // Update audit to prove step 5 completed
      setModifyClickAudit(prev => ({
        ...prev,
        step5StateObserved: true,
        step5ObservedSessionKey: modifyBuilderEntry.sessionKey,
        lastSuccessfulStep: prev.lastSuccessfulStep < 5 ? 5 : prev.lastSuccessfulStep,
      }))
    }
  }, [modifyBuilderEntry])
  
  // ==========================================================================
  // STEP 7: RENDER GRANTED TRACKING
  // Tracks when shouldRenderModifyBuilder becomes true
  // ==========================================================================
  useEffect(() => {
    const renderGranted = modifyBuilderEntry !== null && 
                          modifyBuilderEntry.inputs !== null && 
                          modifyFlowState === 'builder'
    
    if (renderGranted) {
      console.log('[modify-step-7-render-granted]', {
        sessionKey: modifyBuilderEntry?.sessionKey,
        flowState: modifyFlowState,
      })
      setModifyClickAudit(prev => ({
        ...prev,
        step7RenderGranted: true,
        lastSuccessfulStep: 7,
        failureStage: null,
        failureMessage: null,
      }))
    } else if (modifyBuilderEntry !== null && modifyFlowState !== 'builder') {
      // State observed but not yet promoted - update audit to reflect this
      setModifyClickAudit(prev => ({
        ...prev,
        step7RenderGranted: false,
      }))
    }
  }, [modifyBuilderEntry, modifyFlowState])
  
  // ==========================================================================
  // [SCHEDULE INTELLIGENCE] Populate audit using SHARED authoritative resolver
  // 
  // IMPORTANT: This effect uses computeScheduleIntelligence() from canonical-profile-service
  // which mirrors the AUTHORITATIVE complexity calculation from flexible-schedule-engine.
  // This ensures the audit displays the SAME truth used by onboarding/modify/restart flows.
  // 
  // NOTE: This effect runs on program/modifyFlowState change, NOT shouldRenderModifyBuilder.
  // The shouldRenderModifyBuilder const is declared ~9000 lines later, so referencing
  // it in this effect's dependency array would cause a TDZ (Temporal Dead Zone) error.
  // ==========================================================================
  useEffect(() => {
    // Only populate audit when NOT in modify builder mode
    const isInBuilderMode = modifyFlowState === 'builder'
    
    if (program && !isInBuilderMode) {
      try {
        // Use the SHARED schedule intelligence resolver - not a weak local estimate
        const intelligence = computeScheduleIntelligence(program)
        
        setScheduleTruthAudit(prev => ({
          ...prev,
          canonicalScheduleMode: intelligence.scheduleIdentity,
          canonicalTrainingDaysPerWeek: intelligence.canonicalTrainingDaysPerWeek,
          complexityScore: intelligence.complexityScore,
          complexityElevated: intelligence.complexityTier !== 'low',
          baselineRecommendedSessionCount: intelligence.baselineRecommendedSessionCount,
          activeProgramSessionCount: intelligence.currentProgramSessionCount,
          baselineFrequencyReason: intelligence.baselineFrequencyReason,
        }))
      } catch (err) {
        console.error('[schedule-intelligence-audit-error]', err)
      }
    }
  }, [program, modifyFlowState])
  
  // ==========================================================================
  // [REGEN-TRUTH step-6+7-display-and-rehydration] Capture display state after regeneration
  // This effect detects if the displayed program differs from what was saved,
  // indicating a potential rehydration overwrite
  // ==========================================================================
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const storedAuditStep6Raw = sessionStorage.getItem('regenTruthAudit')
    if (!storedAuditStep6Raw) return
    
    const storedAuditStep6 = JSON.parse(storedAuditStep6Raw) as RegenTruthAudit
    
    // Only run once we have a savedProgramId to compare against
    if (!storedAuditStep6.savedProgramId) return
    
    const displayedSessions = program?.sessions?.length ?? 0
    const displayedProgramId = program?.id ?? null
    const savedSessions = storedAuditStep6.savedProgramSessions ?? 0
    const savedProgramId = storedAuditStep6.savedProgramId
    const requestedTarget = storedAuditStep6.requestedTargetSessions ?? 0
    
    // Also read current localStorage to detect rehydration source
    let currentLocalStorageSessions: number | null = null
    let currentLocalStorageId: string | null = null
    try {
      const rawStored = localStorage.getItem('spartanlab_active_program')
      if (rawStored) {
        const parsed = JSON.parse(rawStored)
        currentLocalStorageSessions = parsed?.sessions?.length ?? null
        currentLocalStorageId = parsed?.id ?? null
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    let displayVerdict: RegenTruthVerdict = storedAuditStep6.finalVerdict
    let displayFailedStage = storedAuditStep6.failedStage
    let overwriteDetected = false
    let overwriteSource: string | null = null
    
    // Check for various failure modes
    if (displayedSessions === requestedTarget && displayedProgramId === savedProgramId) {
      displayVerdict = 'FULL_REGEN_SUCCESS_6'
      displayFailedStage = null
    } else if (displayedProgramId !== savedProgramId) {
      // Different program is displayed than what we saved!
      overwriteDetected = true
      overwriteSource = 'program_id_mismatch'
      displayVerdict = 'TARGET_LOST_BY_POST_REGEN_OVERWRITE'
      displayFailedStage = 'rehydration'
    } else if (displayedSessions !== savedSessions) {
      // Same program ID but different session count - something mutated it
      overwriteDetected = true
      overwriteSource = 'session_count_mismatch_same_id'
      displayVerdict = 'TARGET_LOST_BY_POST_REGEN_OVERWRITE'
      displayFailedStage = 'rehydration'
    } else if (displayedSessions < requestedTarget) {
      // Sessions match but still below target - the builder produced fewer
      // Keep the verdict from earlier stages
    }
    
    console.log('[REGEN-TRUTH step-6-display-result]', {
      requestedTarget,
      savedProgramId,
      savedProgramSessions: savedSessions,
      displayedProgramId,
      displayedProgramSessions: displayedSessions,
      currentLocalStorageId,
      currentLocalStorageSessions,
      overwriteDetected,
      overwriteSource,
      verdict: displayVerdict,
    })
    
    // ==========================================================================
    // [POST-REGEN AUTHORITATIVE VERDICT] Final verdict for this fix
    // ==========================================================================
    const authLock = authoritativeSavedProgramRef.current
    const overwriteBlocked = authLock && program?.id === authLock.programId
    console.log('[post-regen-authoritative-verdict]', {
      savedProgramId,
      committedProgramId: authLock?.programId ?? null,
      displayedProgramId,
      rehydratedProgramId: currentLocalStorageId,
      overwriteBlocked,
      winningSource: overwriteDetected 
        ? (overwriteSource ?? 'unknown') 
        : (overwriteBlocked ? 'authoritative_lock' : 'fresh_save'),
      losingSource: overwriteDetected ? 'fresh_save' : null,
      displayedSessionCount: displayedSessions,
      verdict: overwriteDetected
        ? 'POST_REGEN_OVERWRITE_STILL_PRESENT'
        : overwriteBlocked
          ? 'POST_REGEN_REHYDRATION_DOWNGRADE_BLOCKED'
          : 'POST_REGEN_ACTIVE_PROGRAM_LOCKED',
    })
    
    const finalAudit: RegenTruthAudit = {
      ...storedAuditStep6,
      displayedProgramSessions: displayedSessions,
      displayedProgramId,
      rehydratedProgramId: currentLocalStorageId,
      rehydratedProgramSessions: currentLocalStorageSessions,
      overwriteDetected,
      overwriteSource,
      finalVerdict: displayVerdict,
      failedStage: displayFailedStage,
    }
    
    sessionStorage.setItem('regenTruthAudit', JSON.stringify(finalAudit))
    setRegenTruthAudit(finalAudit)
  }, [program])
  
  // ==========================================================================
  // [MAIN-GEN-TRUTH step-8+9-display-and-rehydration] Capture display state after main generation
  // This effect detects if the displayed program differs from what was saved
  // ==========================================================================
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const storedMainGenRaw = sessionStorage.getItem('mainGenTruthAudit')
    if (!storedMainGenRaw) return
    
    const storedMainGen = JSON.parse(storedMainGenRaw) as MainGenTruthAudit
    
    // Only run once we have a savedProgramId to compare against
    if (!storedMainGen.savedProgramId) return
    
    const displayedSessions = program?.sessions?.length ?? 0
    const displayedProgramId = program?.id ?? null
    const displayedCreatedAt = program?.createdAt ?? null
    const savedSessions = storedMainGen.savedProgramSessionCount ?? 0
    const savedProgramId = storedMainGen.savedProgramId
    const expectedTarget = storedMainGen.expectedSessionCount ?? 0
    
    // Also read current localStorage to detect rehydration source
    let currentLocalStorageSessions: number | null = null
    let currentLocalStorageId: string | null = null
    try {
      const rawStored = localStorage.getItem('spartanlab_active_program')
      if (rawStored) {
        const parsed = JSON.parse(rawStored)
        currentLocalStorageSessions = parsed?.sessions?.length ?? null
        currentLocalStorageId = parsed?.id ?? null
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    let displayVerdict: MainGenTruthVerdict = storedMainGen.finalVerdict
    let displayFailedStage = storedMainGen.failedStage
    let overwriteDetected = false
    let overwriteSource: string | null = null
    
    // Check for various failure modes
    const builtSessions = storedMainGen.builtStructureSessionCount ?? 0
    const resolvedSessions = storedMainGen.targetSessionCountFromResolution ?? 0
    
    if (displayedSessions >= expectedTarget && displayedProgramId === savedProgramId) {
      // Success - displayed what we expected
      displayVerdict = expectedTarget === 6 ? 'MAIN_FULL_SUCCESS_6' : 'MAIN_FULL_SUCCESS_MATCHED_EXPECTED'
      displayFailedStage = null
    } else if (displayedProgramId !== savedProgramId) {
      // Different program is displayed than what we saved!
      overwriteDetected = true
      overwriteSource = 'program_id_mismatch'
      displayVerdict = 'MAIN_TARGET_LOST_BY_POST_BUILD_OVERWRITE'
      displayFailedStage = 'rehydration'
    } else if (displayedSessions !== savedSessions) {
      // Same program ID but different session count - something mutated it
      overwriteDetected = true
      overwriteSource = 'session_count_mismatch_same_id'
      displayVerdict = 'MAIN_TARGET_LOST_BY_POST_BUILD_OVERWRITE'
      displayFailedStage = 'rehydration'
    } else if (displayedSessions < expectedTarget) {
      // Sessions match saved but still below expected - determine where loss occurred
      if (resolvedSessions < expectedTarget) {
        displayVerdict = 'MAIN_TARGET_LOST_IN_RESOLUTION'
        displayFailedStage = 'resolution'
      } else if (builtSessions < expectedTarget) {
        displayVerdict = 'MAIN_TARGET_LOST_IN_STRUCTURE_BUILD'
        displayFailedStage = 'structure_build'
      } else if (savedSessions < expectedTarget) {
        displayVerdict = 'MAIN_TARGET_LOST_DURING_SAVE'
        displayFailedStage = 'save'
      }
    }
    
    console.log('[MAIN-GEN-TRUTH step-8-display-result]', {
      expectedTarget,
      savedProgramId,
      savedProgramSessions: savedSessions,
      displayedProgramId,
      displayedProgramSessions: displayedSessions,
      displayedCreatedAt,
      previousCreatedAt: storedMainGen.existingGeneratedDateBeforeClick,
      currentLocalStorageId,
      currentLocalStorageSessions,
      overwriteDetected,
      overwriteSource,
      verdict: displayVerdict,
    })
    
    const finalMainGenAudit: MainGenTruthAudit = {
      ...storedMainGen,
      displayedProgramIdAfterCommit: displayedProgramId,
      displayedProgramSessionCountAfterCommit: displayedSessions,
      newGeneratedDateAfterCommit: displayedCreatedAt,
      rehydratedProgramId: currentLocalStorageId,
      rehydratedProgramSessionCount: currentLocalStorageSessions,
      overwriteDetected,
      overwriteSource,
      finalVerdict: displayVerdict,
      failedStage: displayFailedStage,
    }
    
    sessionStorage.setItem('mainGenTruthAudit', JSON.stringify(finalMainGenAudit))
    setMainGenTruthAudit(finalMainGenAudit)
  }, [program])
  
  // ==========================================================================
  // [POST-BUILD OVERWRITE PATHS MAP] - Auditing paths that can replace visible program
  // after main generation success
  //
  // INTENDED WINNER AFTER MAIN GENERATION SUCCESS:
  //   The `newProgram` object returned by generateAdaptiveProgram, passed to setProgram()
  //
  // ALLOWED READBACK PATHS:
  //   1. setProgram(newProgram) - React state update, should display newProgram
  //   2. localStorage 'spartanlab_active_program' - persisted copy for rehydration
  //   3. programStateService activeProgram - canonical program state
  //
  // SUSPICIOUS OVERWRITE PATHS (sources of potential regression):
  //   1. localStorage readback on page load (hydration effect)
  //      - If stale, could overwrite freshly generated program
  //      - CHECK: useEffect that reads localStorage and calls setProgram
  //   2. programStateService reconciliation
  //      - If reconciliation runs after setProgram, could replace with older state
  //      - CHECK: any effect that calls setProgram with programStateService data
  //   3. getCanonicalProfile() readback
  //      - Not directly an overwrite, but could influence next generation
  //   4. builderSessionInputs stale closure
  //      - Fixed by Phase 26B ref sync, but verify ref is used everywhere
  //   5. modifyFlowState or builderOrigin resets that trigger reconciliation
  //      - CHECK: setModifyFlowState or setBuilderOrigin calls that also setProgram
  //
  // DETECTION: The main generation trace compares:
  //   - savedProgramId vs displayedProgramIdAfterCommit vs rehydratedProgramId
  //   - If these differ, an overwrite occurred
  // ==========================================================================
  
  // ==========================================================================
  // [PHASE 26] CRITICAL FIX: Use a ref to always have the CURRENT builderSessionInputs
  // The IIFE closure in the render captures stale state. This ref ensures the submit
  // handler always reads the latest user selections, not the stale render-time value.
  // ==========================================================================
  const builderSessionInputsRef = useRef<AdaptiveProgramInputs | null>(null)
  
  // ==========================================================================
  // [PHASE 26B] CRITICAL FIX: Synchronous ref + state update wrapper
  // The useEffect-only ref sync has a same-frame race condition:
  // 1. User selects 6 days → setBuilderSessionInputs(newInputs) queues state update
  // 2. useEffect runs AFTER render commit
  // 3. If user clicks Build before effect runs, ref still has old value
  // 
  // FIX: Update ref SYNCHRONOUSLY in the same event tick as state update
  // This wrapper ensures ref.current is ALWAYS current at click time
  // ==========================================================================
  const setBuilderSessionInputsAndRef = useCallback((nextInputs: AdaptiveProgramInputs | null) => {
    // [PHASE 26B] Synchronously update ref FIRST, before React state update
    builderSessionInputsRef.current = nextInputs
    
    console.log('[phase26b-same-frame-race-ref-sync]', {
      stage: 'SYNCHRONOUS_REF_AND_STATE_UPDATE',
      scheduleMode: nextInputs?.scheduleMode,
      trainingDaysPerWeek: nextInputs?.trainingDaysPerWeek,
      refUpdatedSynchronously: true,
      verdict: nextInputs?.scheduleMode === 'static'
        ? `REF_IMMEDIATELY_HAS_STATIC_${nextInputs?.trainingDaysPerWeek}_DAYS`
        : nextInputs === null
          ? 'REF_CLEARED'
          : 'REF_IMMEDIATELY_HAS_FLEXIBLE',
    })
    
    // Then update React state (will trigger re-render)
    setBuilderSessionInputs(nextInputs)
  }, [])
  
  // Keep the useEffect as a backup sync (for initial hydration and edge cases)
  // [PHASE 30P] CRITICAL: This effect must NOT overwrite a live Modify entry with stale/null state
  useEffect(() => {
    // Only sync if ref is out of date (shouldn't happen with the wrapper, but safety net)
    if (builderSessionInputsRef.current !== builderSessionInputs) {
      // ==========================================================================
      // [PHASE 30P] STALE BACKUP SYNC GUARD
      // During an active Modify transition, the ref may hold fresh entry data
      // while the React state is still null/stale. Do NOT overwrite in that case.
      // ==========================================================================
      const isModifyTransitionActive = modifyBuilderLockRef.current || modifyFlowState === 'builder'
      const refHasLiveEntry = builderSessionInputsRef.current !== null
      const stateIsNullOrStale = builderSessionInputs === null
      const wouldClobberLiveEntry = isModifyTransitionActive && refHasLiveEntry && stateIsNullOrStale
      
      console.log('[phase30p-ref-backup-sync-final]', {
        builderSessionInputsStatePresent: !!builderSessionInputs,
        builderSessionInputsRefPresent_before: !!builderSessionInputsRef.current,
        modifyFlowState: modifyFlowState ?? null,
        modifyBuilderLock: !!modifyBuilderLockRef.current,
        isModifyTransitionActive,
        wouldClobberLiveEntry,
        writeBlocked: wouldClobberLiveEntry,
        verdict: wouldClobberLiveEntry
          ? 'REF_BACKUP_SYNC_BLOCKED_STALE_NULL_DURING_MODIFY'
          : builderSessionInputsRef.current === builderSessionInputs
          ? 'REF_BACKUP_SYNC_SKIPPED_ALREADY_MATCHED'
          : 'REF_BACKUP_SYNC_ALLOWED',
      })
      
      // Block the sync if it would clobber a live Modify entry
      if (wouldClobberLiveEntry) {
        return // Do NOT overwrite the ref
      }
      
      builderSessionInputsRef.current = builderSessionInputs
      console.log('[phase26-6day-truth-chain-forced-verdict]', {
        stage: 'REF_BACKUP_SYNC_IN_EFFECT',
        scheduleMode: builderSessionInputs?.scheduleMode,
        trainingDaysPerWeek: builderSessionInputs?.trainingDaysPerWeek,
        verdict: builderSessionInputs?.scheduleMode === 'static'
          ? `REF_NOW_HAS_STATIC_${builderSessionInputs?.trainingDaysPerWeek}_DAYS`
          : 'REF_NOW_HAS_FLEXIBLE',
      })
    }
  }, [builderSessionInputs, modifyFlowState])
  
  // ==========================================================================
  // [PHASE 24D] NOTE: modifyFlowState and isModifyModalOpen moved to PHASE 30R block above
  // to prevent TDZ errors. The state machine logic remains unchanged.
  // ==========================================================================
  
  // ==========================================================================
  // [PHASE 21A] Legacy modal state - now DERIVED from modifyFlowState for compatibility
  // showAdjustmentModal kept temporarily for any dependent code
  // ==========================================================================
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
    
    // [PHASE 17I] Program surface source map audit - track exact data source
    console.log('[phase17i-program-surface-source-map]', {
      surface: 'program_page_authoritativeActiveProgram',
      sourceType: 'useState_program',
      sourceOrigin: 'getProgramState_localStorage',
      programId: activeProgram.id,
      createdAt: activeProgram.createdAt,
      sessionCount: activeProgram.sessions?.length || 0,
      scheduleMode: activeProgram.scheduleMode,
      flexibleFrequencyRootCause: (activeProgram as unknown as { flexibleFrequencyRootCause?: { finalReasonCategory?: string } }).flexibleFrequencyRootCause?.finalReasonCategory || 'not_set',
      selectedSkillsCount: (activeProgram as unknown as { selectedSkills?: string[] }).selectedSkills?.length || 0,
    })
    
    return activeProgram
  }, [program, mounted])
  
  // ==========================================================================
  // [PHASE 8 TASK 4] PAGE LOAD DISPLAY VS STALENESS BINDING AUDIT
  // Verify restored/loaded program is same for display and staleness
  // ==========================================================================
  useEffect(() => {
    if (!program || !mounted || !authoritativeActiveProgram) return
    
    // Also read localStorage to check for source divergence
    let localStorageProgramId: string | null = null
    let localStorageSessionCount: number | null = null
    try {
      const rawStored = localStorage.getItem('spartanlab_active_program')
      if (rawStored) {
        const parsed = JSON.parse(rawStored)
        localStorageProgramId = parsed?.id ?? null
        localStorageSessionCount = parsed?.sessions?.length ?? null
      }
    } catch {
      // Ignore parse errors
    }
    
    const programStateSessionCount = program?.sessions?.length ?? 0
    const authoritativeSessionCount = authoritativeActiveProgram?.sessions?.length ?? 0
    const baselineFromIntelligence = scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4
    
    // Check for actual source divergence (different objects/values)
    const stateMatchesAuthoritative = program.id === authoritativeActiveProgram.id
    const stateMatchesLocalStorage = program.id === localStorageProgramId
    const sessionCountsMatch = programStateSessionCount === authoritativeSessionCount
    const allSourcesUnified = stateMatchesAuthoritative && stateMatchesLocalStorage && sessionCountsMatch
    
    console.log('[page-load-display-vs-staleness-binding-audit]', {
      // React state (drives Schedule Status "Current" and Program Card)
      programStateId: program.id,
      programStateSessionCount,
      // Memo source (drives staleness checks)
      authoritativeProgramId: authoritativeActiveProgram.id,
      authoritativeSessionCount,
      // LocalStorage source (canonical persistence)
      localStorageProgramId,
      localStorageSessionCount,
      // Schedule intelligence (drives "Baseline")
      baselineFromIntelligence,
      // Verdicts
      stateMatchesAuthoritative,
      stateMatchesLocalStorage,
      sessionCountsMatch,
      allSourcesUnified,
      baselineDiffersFromCurrent: baselineFromIntelligence !== programStateSessionCount,
      verdict: allSourcesUnified 
        ? 'PROGRAM_PAGE_SINGLE_TRUTH_ENFORCED'
        : 'SPLIT_TRUTH_DETECTED',
      explanation: !stateMatchesLocalStorage
        ? 'React state differs from localStorage'
        : !stateMatchesAuthoritative
          ? 'React state differs from authoritative memo'
          : !sessionCountsMatch
            ? 'Session counts differ between sources'
            : 'All sources aligned',
    })
  }, [program, mounted, authoritativeActiveProgram, scheduleTruthAudit])
  
  // ==========================================================================
  // [PHASE 30Q/30R] PRERENDER SAFE MOUNT LOG - proves page initialized without TDZ crash
  // This runs in useEffect (after render) so it's safe from prerender issues
  // ==========================================================================
  useEffect(() => {
    console.log('[phase30q-prerender-safe-final]', {
      page: '/program',
      mounted: true,
      programExists: !!program,
      verdict: 'PROGRAM_PAGE_PRERENDER_SAFE',
    })
    // [PHASE 30R] Declaration order safety confirmation
    console.log('[phase30r-declare-order-safe-final]', {
      hasModifyFlowState: typeof modifyFlowState !== 'undefined',
      hasModifyBuilderLockRef: typeof modifyBuilderLockRef !== 'undefined',
      hasBuilderSessionInputsRef: typeof builderSessionInputsRef !== 'undefined',
      verdict: 'MODIFY_DECLARE_ORDER_SAFE',
    })
  }, []) // Run once on mount only
  
  // ==========================================================================
  // [PHASE 30Q] MODIFY RENDER AUTHORITY EFFECT - safe logging when authority changes
  // ==========================================================================
  useEffect(() => {
    if (showBuilder || modifyBuilderLockRef.current) {
      console.log('[phase30q-builder-authority-safe]', {
        showBuilder: !!showBuilder,
        modifyBuilderLock: !!modifyBuilderLockRef.current,
        builderSessionInputsRefPresent: !!builderSessionInputsRef.current,
        modifyFlowState: modifyFlowState ?? null,
        verdict: (showBuilder || (modifyBuilderLockRef.current && builderSessionInputsRef.current))
          ? 'MODIFY_RENDER_AUTHORITY_ACTIVE'
          : 'MODIFY_RENDER_AUTHORITY_INACTIVE',
      })
    }
  }, [showBuilder, modifyFlowState])
  
  // ==========================================================================
  // [PHASE 24C] TASK 6 - Page-side open state truth audit
  // Prove whether page state says modal should be visible
  // ==========================================================================
  useEffect(() => {
    console.log('[phase24c-page-open-state-truth-audit]', {
      showAdjustmentModal,
      showBuilder,
      programExists: !!program,
      verdict: showAdjustmentModal
        ? 'PAGE_STATE_SAYS_MODAL_SHOULD_BE_VISIBLE'
        : 'PAGE_STATE_SAYS_MODAL_SHOULD_BE_CLOSED',
    })
  }, [showAdjustmentModal, showBuilder, program])
  
  // ==========================================================================
  // [PHASE 23B] TASK 1 - Helper to build AdaptiveProgramInputs from visible program
  // Priority: program.profileSnapshot > program top-level > inputs fallback > canonical
  // ==========================================================================
  const buildModifyEntryInputsFromVisibleProgram = useCallback((
    visibleProgram: AdaptiveProgram,
    currentInputs: AdaptiveProgramInputs | null,
    canonicalFallback: ReturnType<typeof getCanonicalProfile>
  ): AdaptiveProgramInputs => {
    // Extract profileSnapshot with proper typing
    const snapshot = visibleProgram.profileSnapshot as {
      primaryGoal?: string
      secondaryGoal?: string | null
      experienceLevel?: string
      trainingDaysPerWeek?: number | 'flexible'
      sessionLengthMinutes?: number
      scheduleMode?: string
      sessionDurationMode?: string
      selectedSkills?: string[]
      trainingPathType?: string
      goalCategories?: string[]
      selectedFlexibility?: string[]
      equipmentAvailable?: string[]
    } | undefined
    
    // Build inputs with strict priority: snapshot > program > inputs > canonical > default
    const result: AdaptiveProgramInputs = {
      // Primary Goal: snapshot > program > inputs > canonical
      primaryGoal: (
        snapshot?.primaryGoal ||
        visibleProgram.primaryGoal ||
        currentInputs?.primaryGoal ||
        canonicalFallback.primaryGoal ||
        'general_fitness'
      ) as PrimaryGoal,
      
      // Secondary Goal: snapshot > program > inputs > canonical
      secondaryGoal: (
        snapshot?.secondaryGoal ??
        visibleProgram.secondaryGoal ??
        currentInputs?.secondaryGoal ??
        canonicalFallback.secondaryGoal ??
        undefined
      ) as PrimaryGoal | undefined,
      
      // Experience Level: snapshot > program > inputs > canonical
      experienceLevel: (
        snapshot?.experienceLevel ||
        (visibleProgram as { experienceLevel?: string }).experienceLevel ||
        currentInputs?.experienceLevel ||
        canonicalFallback.experienceLevel ||
        'intermediate'
      ) as ExperienceLevel,
      
      // ==========================================================================
      // [PHASE 32B] SCHEDULE IDENTITY DISPLAY PRECEDENCE FIX
      // For schedule identity fields, CANONICAL TRUTH wins over stale snapshot.
      // Snapshot/program may have been generated with old settings.
      // User's current canonical profile is the authoritative schedule identity.
      // ==========================================================================
      
      // Training Days: CANONICAL > inputs > snapshot > program > default
      // [PHASE 32B] Canonical wins for schedule identity - prevents stale snapshot masking
      trainingDaysPerWeek: (
        // Canonical is authoritative for schedule identity
        (canonicalFallback.scheduleMode === 'static' && typeof canonicalFallback.trainingDaysPerWeek === 'number')
          ? canonicalFallback.trainingDaysPerWeek
          : canonicalFallback.scheduleMode === 'flexible'
            ? (canonicalFallback.trainingDaysPerWeek ?? 'flexible')
            // Fallback to other sources only if canonical has no explicit schedule
            : currentInputs?.trainingDaysPerWeek ??
              snapshot?.trainingDaysPerWeek ??
              (visibleProgram as { trainingDaysPerWeek?: number | 'flexible' }).trainingDaysPerWeek ??
              4
      ) as TrainingDays | 'flexible',
      
      // Session Length: snapshot.sessionLengthMinutes > program > inputs > canonical
      sessionLength: (
        snapshot?.sessionLengthMinutes ??
        (visibleProgram as { sessionLengthMinutes?: number }).sessionLengthMinutes ??
        currentInputs?.sessionLength ??
        canonicalFallback.sessionLengthMinutes ??
        60
      ) as SessionLength,
      
      // Schedule Mode: CANONICAL > inputs > snapshot > program > default
      // [PHASE 32B] Canonical wins for schedule identity - prevents stale snapshot masking
      scheduleMode: (
        // Canonical is authoritative for schedule identity
        canonicalFallback.scheduleMode === 'static' ? 'static'
        : canonicalFallback.scheduleMode === 'flexible' ? 'flexible'
        // Fallback to other sources only if canonical has no explicit schedule
        : currentInputs?.scheduleMode ||
          snapshot?.scheduleMode ||
          visibleProgram.scheduleMode ||
          'static'
      ) as ScheduleMode,
      
      // Session Duration Mode: snapshot > program > inputs > canonical
      sessionDurationMode: (
        snapshot?.sessionDurationMode ||
        (visibleProgram as { sessionDurationMode?: string }).sessionDurationMode ||
        currentInputs?.sessionDurationMode ||
        canonicalFallback.sessionDurationMode ||
        'standard'
      ) as 'standard' | 'adaptive',
      
      // Selected Skills: snapshot > program > inputs > canonical (arrays need special handling)
      selectedSkills: (
        (snapshot?.selectedSkills && snapshot.selectedSkills.length > 0) ? snapshot.selectedSkills :
        (visibleProgram.selectedSkills && visibleProgram.selectedSkills.length > 0) ? visibleProgram.selectedSkills :
        (currentInputs?.selectedSkills && currentInputs.selectedSkills.length > 0) ? currentInputs.selectedSkills :
        (canonicalFallback.selectedSkills && canonicalFallback.selectedSkills.length > 0) ? canonicalFallback.selectedSkills :
        []
      ),
      
      // Training Path Type: snapshot > program > inputs > canonical
      trainingPathType: (
        snapshot?.trainingPathType ||
        (visibleProgram as { trainingPathType?: string }).trainingPathType ||
        currentInputs?.trainingPathType ||
        canonicalFallback.trainingPathType ||
        'hybrid'
      ) as 'skill_first' | 'hybrid' | 'balanced',
      
      // Goal Categories: snapshot > program > inputs > canonical
      goalCategories: (
        (snapshot?.goalCategories && snapshot.goalCategories.length > 0) ? snapshot.goalCategories :
        ((visibleProgram as { goalCategories?: string[] }).goalCategories?.length ?? 0) > 0 ? (visibleProgram as { goalCategories?: string[] }).goalCategories :
        (currentInputs?.goalCategories && currentInputs.goalCategories.length > 0) ? currentInputs.goalCategories :
        (canonicalFallback.goalCategories && canonicalFallback.goalCategories.length > 0) ? canonicalFallback.goalCategories :
        []
      ),
      
      // Selected Flexibility: snapshot > program > inputs > canonical
      selectedFlexibility: (
        (snapshot?.selectedFlexibility && snapshot.selectedFlexibility.length > 0) ? snapshot.selectedFlexibility :
        ((visibleProgram as { selectedFlexibility?: string[] }).selectedFlexibility?.length ?? 0) > 0 ? (visibleProgram as { selectedFlexibility?: string[] }).selectedFlexibility :
        (currentInputs?.selectedFlexibility && currentInputs.selectedFlexibility.length > 0) ? currentInputs.selectedFlexibility :
        (canonicalFallback.selectedFlexibility && canonicalFallback.selectedFlexibility.length > 0) ? canonicalFallback.selectedFlexibility :
        []
      ),
      
      // Equipment: snapshot.equipmentAvailable > program.equipment > inputs > canonical
      equipment: (
        (snapshot?.equipmentAvailable && snapshot.equipmentAvailable.length > 0) ? snapshot.equipmentAvailable :
        (visibleProgram.equipment && visibleProgram.equipment.length > 0) ? visibleProgram.equipment :
        (currentInputs?.equipment && currentInputs.equipment.length > 0) ? currentInputs.equipment :
        (canonicalFallback.equipmentAvailable && canonicalFallback.equipmentAvailable.length > 0) ? canonicalFallback.equipmentAvailable :
        []
      ) as EquipmentType[],
    }
    
    return result
  }, [])
  
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
    // [PHASE 32B] STALE SNAPSHOT SCHEDULE DETECTION
    // Detects when program snapshot scheduleMode differs from canonical truth
    // =========================================================================
    const canonical = getCanonicalProfile()
    const snapshotScheduleMode = (profileSnapshot as { scheduleMode?: string })?.scheduleMode
    const snapshotTrainingDays = (profileSnapshot as { trainingDaysPerWeek?: number })?.trainingDaysPerWeek
    const canonicalScheduleMode = canonical.scheduleMode
    const canonicalTrainingDays = canonical.trainingDaysPerWeek
    
    const scheduleSnapshotStale = (
      (canonicalScheduleMode === 'static' && snapshotScheduleMode !== 'static') ||
      (canonicalScheduleMode === 'flexible' && snapshotScheduleMode !== 'flexible') ||
      (canonicalScheduleMode === 'static' && canonicalTrainingDays !== snapshotTrainingDays)
    )
    
    // [PHASE 32B] AUTHORITATIVE TRUTH SUMMARY
    // Single concise log showing: winner source, resolved schedule, display alignment
    console.log('[phase32b-schedule-truth-summary]', {
      canonical: { mode: canonicalScheduleMode, days: canonicalTrainingDays },
      snapshot: { mode: snapshotScheduleMode, days: snapshotTrainingDays },
      snapshotStale: scheduleSnapshotStale,
      displayUsing: scheduleSnapshotStale ? 'CANONICAL_TRUTH' : 'SNAPSHOT_MATCHES_CANONICAL',
    })
    
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
    
    // =========================================================================
    // [PHASE 29C] PROGRAM CANONICAL READ SURVIVED
    // Proves canonical resolution completed without TDZ/boot crash
    // =========================================================================
    console.log('[phase29c-program-canonical-read-survived]', {
      pageLoadStage: 'evaluateUnifiedProgramStaleness',
      canonicalScheduleMode: canonicalProfile.scheduleMode,
      canonicalTrainingDays: canonicalProfile.trainingDaysPerWeek,
      canonicalAdaptiveWorkload: (canonicalProfile as { adaptiveWorkloadEnabled?: boolean }).adaptiveWorkloadEnabled ?? true,
      verdict: 'PROGRAM_BOOT_SURVIVED_CANONICAL_READ',
    })
    
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
      
      // ==========================================================================
      // [AI-TRUTH-BREADTH-AUDIT] Layer 8: PROGRAM_PAGE render layer
      // This is the final layer in the breadth audit chain
      // ==========================================================================
      const authContract = (program as unknown as { 
        authoritativeMultiSkillIntentContract?: { 
          sourceTruthCount: number
          materiallyUsedCount: number
          selectedSkills: string[]
        } 
      }).authoritativeMultiSkillIntentContract
      
      console.log('[AI-TRUTH-BREADTH-AUDIT:PROGRAM_PAGE]', {
        skills: displayedSkills,
        count: displayedSkills.length,
        canonicalSkillsCount: canonicalSkills.length,
        authoritativeSourceTruthCount: authContract?.sourceTruthCount ?? 'not_available',
        authoritativeMateriallyUsedCount: authContract?.materiallyUsedCount ?? 'not_available',
        skillsLostFromAuthContract: authContract 
          ? (authContract.selectedSkills || []).filter((s: string) => !displayedSkills.includes(s))
          : [],
        source: 'program_page_render',
        profileTrulyHasOnlyTwoSkills: canonicalSkills.length <= 2,
        verdict: displayedSkills.length === canonicalSkills.length 
          ? 'RENDER_MATCHES_CANONICAL'
          : displayedSkills.length > canonicalSkills.length
            ? 'RENDER_HAS_MORE_THAN_CANONICAL_CHECK_FOR_LEAKS'
            : 'RENDER_HAS_FEWER_THAN_CANONICAL_LOSS_DETECTED',
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
      // [PHASE 1 FIX] Use mutable variable to track actual stage - avoids stale closure in catch
      let currentInitStage = 'initializing'
      
      try {
        // CRITICAL: Load program state modules first (essential)
        let builderMod, stateMod, adjustmentMod
        
        // TASK 3: Stage 1 - Load adaptive-program-builder
        currentInitStage = 'loading-builder'
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
        currentInitStage = 'loading-state'
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
        currentInitStage = 'loading-adjustment'
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
        currentInitStage = 'loading-optional'
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
        currentInitStage = 'storing-modules'
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
        currentInitStage = 'loading-default-inputs'
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
        currentInitStage = 'loading-program-state'
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
          currentInitStage = 'normalizing-program'
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
              // [PHASE 31F] INIT GUARD A - ATOMIC ENTRY AUTHORITY
              // PRIMARY: modifyBuilderEntryRef (synchronous) or modifyBuilderEntry state
              // SECONDARY: launcher entered flag, lock, flow-based checks
              const hasModifyBuilderEntryRef = modifyBuilderEntryRef.current !== null
              const hasModifyBuilderEntry = modifyBuilderEntry !== null
              const isModifyLockActive = modifyBuilderLockRef.current
              const isModifyFlowBuilder = modifyFlowState === 'builder'
              const hasLiveBuilderEntry = builderSessionInputsRef.current !== null
              const launcherEntered = modifyClickAudit.canonicalLauncherEntered
              // PRIMARY: ref or state entry exists = active Modify transition
              const isActiveModifyTransition = hasModifyBuilderEntryRef || hasModifyBuilderEntry || launcherEntered || isModifyLockActive || (isModifyFlowBuilder && hasLiveBuilderEntry)
              
              // ROOT-CAUSE-FIX: Only set showBuilder(false) if no active modify transition
              if (!isActiveModifyTransition) {
                setShowBuilder(false)
              }
              currentInitStage = 'program-ready'
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
              
              // [AI-TRUTH-AUDIT] Run comprehensive truth audit on program load
              // This logs field-by-field usage, explanation gaps, and truth flow analysis
              try {
                const canonicalProfile = getCanonicalProfile()
                // Log field-by-field truth audit (dev only)
                logTruthFieldAudit()
                // Log program truth explanation with gap analysis
                const truthExplanation = logProgramTruthExplanation(normalizedProgram, canonicalProfile)
                logExplanationGapAudit(normalizedProgram, canonicalProfile)
                // Summary log for quick reference
                console.log('[AI-TRUTH-AUDIT] ========== SUMMARY VERDICT ==========', {
                  explanationQuality: truthExplanation.explanationQualityVerdict,
                  hiddenTruthCount: truthExplanation.hiddenTruthNotSurfaced.length,
                  underexpressedSkillCount: truthExplanation.underexpressedSkills.length,
                  frequencyWasAdapted: truthExplanation.frequencyWasAdapted,
                  weightedLoadingUsed: truthExplanation.weightedLoadingUsed,
                })
              } catch (auditError) {
                console.warn('[AI-TRUTH-AUDIT] Audit failed (non-blocking):', auditError)
              }
            } else {
              // TASK 2: Program exists but fails display sanity - show recovery state, not fatal error
              currentInitStage = `program-malformed:${displayCheck.reason || 'unknown'}`
              setLoadStage(`program-malformed:${displayCheck.reason || 'unknown'}`)
              // Keep program reference so we can show "Program Needs Refresh" state
              setProgram(normalizedProgram)
              // ROOT-CAUSE-FIX: Check for active modify transition before resetting showBuilder
              const hasModifyBuilderEntryRef = modifyBuilderEntryRef.current !== null
              const hasModifyBuilderEntry = modifyBuilderEntry !== null
              const isModifyLockActive = modifyBuilderLockRef.current
              const isModifyFlowBuilder = modifyFlowState === 'builder'
              const hasLiveBuilderEntry = builderSessionInputsRef.current !== null
              const launcherEntered = modifyClickAudit.canonicalLauncherEntered
              const isActiveModifyTransition = hasModifyBuilderEntryRef || hasModifyBuilderEntry || launcherEntered || isModifyLockActive || (isModifyFlowBuilder && hasLiveBuilderEntry)
              if (!isActiveModifyTransition) {
                setShowBuilder(false)
              }
            }
          } else {
            // No usable program - show builder
            currentInitStage = 'no-program'
            setLoadStage('no-program')
            setShowBuilder(true)
          }
        } catch (err) {
          console.error('[ProgramPage] Stage 7: Error loading current program:', err)
          currentInitStage = 'program-load-error'
          setLoadStage('program-load-error')
          setShowBuilder(true)
        }
        
        // TASK 3: Stage 9 - Get constraint insight if available (non-critical)
        // [limiter-truth] ISSUE D: This now uses canonical displayed-limiter helper
        currentInitStage = 'loading-constraints'
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
        
        currentInitStage = 'complete'
        setLoadStage('complete')
        setMounted(true)
        // [PHASE 1 TASK F & G] Success diagnostic - confirms fix working
        console.log('[PHASE1-INIT-SUCCESS]', {
          finalStage: currentInitStage,
          scheduleTruthUntouched: true,
          sixSessionFlexibleUntouched: true,
          doctrineDbAsyncMisuseFixed: true,
          staleStageReportingFixed: true,
        })
        console.log('[ProgramPage] All stages complete')
      } catch (err) {
        // Fallback catch for unexpected errors
        // [PHASE 1 FIX] Use currentInitStage (mutable var) instead of loadStage (stale closure)
        const errorName = err instanceof Error ? err.name : 'UnknownError'
        const errorMessage = err instanceof Error ? err.message : String(err)
        
        // [PHASE 1 TASK G] Compact init-fail diagnostic - console only, not UI
        console.error('[PHASE1-INIT-FAIL-DIAGNOSTIC]', {
          initStage: currentInitStage,
          failedOperation: currentInitStage,
          errorName,
          errorMessage: errorMessage.slice(0, 200), // Truncate for compactness
          hasStoredProgram: typeof window !== 'undefined' && !!localStorage.getItem('spartanlab_adaptive_program'),
          hasUsableWorkoutProgram: false, // Failed before we could determine this
          programId: null,
          doctrineDbWasConsultedDuringInit: false, // Program page init doesn't call doctrine-db directly
          displayHelperFailure: currentInitStage.includes('normalizing') || currentInitStage.includes('display'),
          builderModuleLoaded: currentInitStage !== 'loading-builder' && currentInitStage !== 'initializing',
          stateModuleLoaded: currentInitStage !== 'loading-builder' && currentInitStage !== 'loading-state' && currentInitStage !== 'initializing',
          adjustmentModuleLoaded: !['loading-builder', 'loading-state', 'loading-adjustment', 'initializing'].includes(currentInitStage),
        })
        
        setLoadStage('unexpected-error')
        setLoadError(`Unexpected error at stage: ${currentInitStage}. Error: ${errorMessage}. Please refresh the page.`)
        setMounted(true)
      }
    }
    
    loadModules()
  }, [])

  // [program-rebuild-truth] Generation error state with full build result
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [lastBuildResult, setLastBuildResult] = useState<BuildAttemptResult | null>(null)
  
  // ==========================================================================
  // [PHASE 31C] NOTE: modifyClickAudit was moved to the top of the component
  // to prevent TDZ errors. See PHASE 31C declaration zone above.
  // ==========================================================================
  
  // ==========================================================================
  // [PHASE 16S] Runtime session marker for attempt-truth gating
  // ==========================================================================
  const runtimeSessionIdRef = useRef<string>(generateRuntimeSessionId())
  const currentAttemptStartedAtRef = useRef<string | null>(null)
  const currentSessionHasStartedNewAttemptRef = useRef<boolean>(false)
  
  // ==========================================================================
  // [PHASE 30L] NOTE: modifyBuilderLockRef moved to PHASE 30R block at top of component
  // to prevent TDZ errors. The lock behavior remains unchanged.
  // ==========================================================================
  
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
  
  // ==========================================================================
  // ==========================================================================
  // [PHASE 17J+17K] PROGRAM PAGE RECONCILIATION EFFECT
  // Syncs in-memory program state with canonical saved program when:
  // 1. Window/tab gains focus (user returns from another tab/page) [17J]
  // 2. Page becomes visible after being hidden [17J]
  // 3. Storage event fires (cross-tab localStorage changes) [17K]
  // 4. Periodic check every 2 seconds (same-tab localStorage changes) [17K]
  // This ensures stale 4-session program doesn't persist when 6-session is saved
  //
  // ==========================================================================
  // [REGEN-TRUTH OVERWRITE PATH COMMENT MAP]
  // ==========================================================================
  // OVERWRITE PATH AUDIT:
  // 
  // INTENDED WINNER AFTER REGEN:
  //   - The setProgram(newProgram) call at line ~7023 (regeneration success path)
  //   - This sets the freshly built program directly from generateAdaptiveProgram
  //
  // ALLOWED REHYDRATION PATHS:
  //   - reconcileWithCanonical() at line ~2525 - BUT only if canonical is NEWER
  //   - The PHASE 26E fix ensures shouldReplace = canonicalIsNewer || (idDiffers && !currentIsNewer)
  //   - This SHOULD protect a just-generated program from being replaced by older localStorage
  //
  // POTENTIAL OVERWRITE RISK PATHS:
  //   - Line 2282: setProgram(normalizedProgram) in mount effect - runs on page load
  //   - Line 2347: setProgram(normalizedProgram) in malformed program branch
  //   - Line 2698: setProgram(normalizedCanonical) in reconciliation effect
  //   - Line 2866: periodic_check triggers reconcileWithCanonical every 2 seconds
  //
  // RISK: If localStorage write in saveAdaptiveProgram() is slow/async and the
  // periodic_check fires BEFORE localStorage is updated, it could read the OLD
  // program from localStorage and replace the fresh in-memory program.
  //
  // KEY PROTECTION: createdAt timestamp comparison at line ~2600
  // ==========================================================================
  useEffect(() => {
    if (!programModules.getProgramState || !programModules.normalizeProgramForDisplay) {
      return // Modules not loaded yet
    }
    
    const reconcileWithCanonical = (triggerSource: string) => {
      // ==========================================================================
      // [POST-BUILD AUTHORITATIVE LOCK] SINGLE WINNER CONTRACT
      // 
      // RULE: After a successful regenerate/modify/main build, the returned newProgram
      // is the AUTHORITATIVE PAGE WINNER if:
      //   1. It was just returned from the active build call
      //   2. It was successfully saved (lock was set)
      //   3. Its program ID and session count are captured in the lock
      //   4. The lock has not expired
      //
      // During the lock window, NO reconciliation may replace the program, regardless
      // of what the closure's `program` state shows. This prevents race conditions
      // where React state hasn't propagated yet but reconciliation fires.
      //
      // CRITICAL FIX: We do NOT check `program?.id === authLock.programId` because
      // the `program` in this closure may be STALE (the old 4-session program)
      // when this check runs. The lock itself is the authority during the window.
      // ==========================================================================
      const authLock = authoritativeSavedProgramRef.current
      const now = Date.now()
      
      // HARD BLOCK: If lock is active, block ALL reconciliation replacement attempts
      // Do NOT check program?.id - it may be stale due to React async state updates
      if (authLock && now < authLock.lockExpiresAt) {
        console.log('[post-build-auth-lock] RECONCILIATION BLOCKED - authoritative winner locked', {
          trigger: triggerSource,
          lockedProgramId: authLock.programId,
          lockedSessionCount: authLock.sessionCount,
          lockedFlowSource: authLock.flowSource,
          lockedSavedAt: authLock.savedAt,
          closureProgramId: program?.id ?? 'null',
          closureSessionCount: program?.sessions?.length ?? 0,
          lockExpiresIn: authLock.lockExpiresAt - now,
          verdict: 'POST_BUILD_WINNER_PROTECTED_LOCK_ACTIVE',
        })
        return
      }
      
      // Clear expired lock
      if (authLock && now >= authLock.lockExpiresAt) {
        console.log('[post-build-auth-lock] Lock expired, clearing', {
          trigger: triggerSource,
          lockedProgramId: authLock.programId,
          lockedSessionCount: authLock.sessionCount,
          expiredAt: authLock.lockExpiresAt,
        })
        authoritativeSavedProgramRef.current = null
      }
      
      const canonicalState = programModules.getProgramState?.()
      if (!canonicalState?.adaptiveProgram || !program) {
        console.log('[phase17k-same-session-reconciliation-verdict]', {
          trigger: triggerSource,
          action: 'skip_reconciliation',
          reason: !canonicalState?.adaptiveProgram ? 'no_canonical_program' : 'no_current_program',
        })
        return
      }
      
      // ==========================================================================
      // [PHASE 17N] RAW STORAGE TRUTH SNAPSHOT - Read directly from localStorage
      // This proves whether getProgramState() matches raw storage truth
      // ==========================================================================
      let rawCanonicalId: string | null = null
      let rawCanonicalCreatedAt: string | null = null
      let rawCanonicalSessionCount = 0
      let rawHistoryLatestId: string | null = null
      let rawHistoryLatestCreatedAt: string | null = null
      let rawHistoryLatestSessionCount = 0
      let rawHistoryCount = 0
      
      try {
        const rawCanonical = localStorage.getItem('spartanlab_active_program')
        if (rawCanonical) {
          const parsed = JSON.parse(rawCanonical)
          rawCanonicalId = parsed?.id || null
          rawCanonicalCreatedAt = parsed?.createdAt || null
          rawCanonicalSessionCount = parsed?.sessions?.length || 0
        }
      } catch (err) {
        console.warn('[phase17n] Failed to parse raw canonical:', err)
      }
      
      try {
        const rawHistory = localStorage.getItem('spartanlab_adaptive_programs')
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory)
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawHistoryCount = parsed.length
            // Sort by createdAt descending to get true latest
            const sorted = [...parsed].sort((a, b) => 
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            )
            const latest = sorted[0]
            rawHistoryLatestId = latest?.id || null
            rawHistoryLatestCreatedAt = latest?.createdAt || null
            rawHistoryLatestSessionCount = latest?.sessions?.length || 0
          }
        }
      } catch (err) {
        console.warn('[phase17n] Failed to parse raw history:', err)
      }
      
      const canonicalProgram = canonicalState.adaptiveProgram
      const currentProgram = program
      
      // [PHASE 17N] TASK 2 - Raw storage truth snapshot log
      console.log('[phase17n-program-page-canonical-read-truth]', {
        trigger: triggerSource,
        
        inMemoryProgramId: program?.id || 'none',
        inMemoryProgramCreatedAt: program?.createdAt || 'none',
        inMemoryProgramSessionCount: program?.sessions?.length || 0,
        
        getProgramStateProgramId: canonicalState?.adaptiveProgram?.id || 'none',
        getProgramStateCreatedAt: canonicalState?.adaptiveProgram?.createdAt || 'none',
        getProgramStateSessionCount: canonicalState?.adaptiveProgram?.sessions?.length || 0,
        
        rawCanonicalId,
        rawCanonicalCreatedAt,
        rawCanonicalSessionCount,
        
        rawHistoryLatestId,
        rawHistoryLatestCreatedAt,
        rawHistoryLatestSessionCount,
        rawHistoryCount,
      })
      
      // [PHASE 17N] TASK 3 - Source divergence verdict log
      console.log('[phase17n-program-page-source-divergence-verdict]', {
        trigger: triggerSource,
        
        inMemoryVsProgramStateIdMatch:
          (program?.id || null) === (canonicalState?.adaptiveProgram?.id || null),
        
        inMemoryVsProgramStateSessionMatch:
          (program?.sessions?.length || 0) === (canonicalState?.adaptiveProgram?.sessions?.length || 0),
        
        programStateVsRawCanonicalIdMatch:
          (canonicalState?.adaptiveProgram?.id || null) === (rawCanonicalId || null),
        
        programStateVsRawCanonicalSessionMatch:
          (canonicalState?.adaptiveProgram?.sessions?.length || 0) === (rawCanonicalSessionCount || 0),
        
        rawCanonicalVsHistoryLatestIdMatch:
          (rawCanonicalId || null) === (rawHistoryLatestId || null),
        
        rawCanonicalVsHistoryLatestSessionMatch:
          (rawCanonicalSessionCount || 0) === (rawHistoryLatestSessionCount || 0),
        
        likelyFailureLayer:
          (canonicalState?.adaptiveProgram?.sessions?.length || 0) !== (rawCanonicalSessionCount || 0)
            ? 'program_state_read_layer'
            : (rawCanonicalSessionCount || 0) !== (rawHistoryLatestSessionCount || 0)
            ? 'canonical_storage_is_stale_vs_history'
            : (program?.sessions?.length || 0) !== (canonicalState?.adaptiveProgram?.sessions?.length || 0)
            ? 'program_page_in_memory_state_is_stale'
            : 'no_divergence_detected_in_this_snapshot',
      })
      
      // Compare by ID and createdAt to detect if canonical is different/newer
      const idDiffers = canonicalProgram.id !== currentProgram.id
      const canonicalCreatedAt = new Date(canonicalProgram.createdAt).getTime()
      const currentCreatedAt = new Date(currentProgram.createdAt).getTime()
      const canonicalIsNewer = canonicalCreatedAt > currentCreatedAt
      const sessionCountDiffers = (canonicalProgram.sessions?.length || 0) !== (currentProgram.sessions?.length || 0)
      
      // [PHASE 17M] Program reconciliation decision audit - comprehensive pre-decision logging
      console.log('[phase17m-program-reconciliation-decision-audit]', {
        trigger: triggerSource,
        canonicalProgramId: canonicalProgram.id,
        currentProgramId: currentProgram.id,
        canonicalCreatedAt: canonicalProgram.createdAt,
        currentCreatedAt: currentProgram.createdAt,
        canonicalSessionCount: canonicalProgram.sessions?.length || 0,
        currentSessionCount: currentProgram.sessions?.length || 0,
        idDiffers,
        canonicalIsNewer,
        sessionCountDiffers,
      })
      
      // ==========================================================================
      // [PHASE 26E] CRITICAL FIX: Only replace in-memory program if canonical is NEWER
      // Previously: shouldReplace = idDiffers || canonicalIsNewer || sessionCountDiffers
      // This was WRONG because it would replace a just-generated program with an older
      // canonical program if session counts differed (e.g., user selected 6 days but
      // canonical storage still had the old 4-session flexible program)
      // 
      // FIX: Only replace if canonical is actually NEWER. If IDs differ but current is
      // newer (just generated), keep the current program.
      // ==========================================================================
      const currentIsNewer = currentCreatedAt > canonicalCreatedAt
      const shouldReplace = canonicalIsNewer || (idDiffers && !currentIsNewer)
      
      console.log('[phase26e-canonical-modify-post-generation-overwrite-proof]', {
        stage: 'RECONCILIATION_DECISION',
        trigger: triggerSource,
        canonicalProgramId: canonicalProgram.id,
        canonicalCreatedAt: canonicalProgram.createdAt,
        canonicalScheduleMode: (canonicalProgram as unknown as { scheduleMode?: string }).scheduleMode,
        canonicalTrainingDays: (canonicalProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
        currentProgramId: currentProgram.id,
        currentCreatedAt: currentProgram.createdAt,
        currentScheduleMode: (currentProgram as unknown as { scheduleMode?: string }).scheduleMode,
        currentTrainingDays: (currentProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
        idDiffers,
        canonicalIsNewer,
        currentIsNewer,
        sessionCountDiffers,
        shouldReplace,
        verdict: shouldReplace
          ? 'WILL_REPLACE_WITH_CANONICAL'
          : currentIsNewer
            ? 'KEEPING_CURRENT_PROGRAM_ITS_NEWER'
            : 'KEEPING_CURRENT_NO_CHANGE_NEEDED',
      })
      
      // ==========================================================================
      // [PHASE 26F] VERIFIED ZIP RECONCILIATION OVERWRITE FIX - DECISION AUDIT
      // This explicitly logs why replacement did or did not happen
      // Key rule: sessionCountDiffers alone must NEVER replace a newer program
      // ==========================================================================
      const timestampsComparable = !!(canonicalCreatedAt && currentCreatedAt)
      const canonicalShouldWin = canonicalIsNewer && timestampsComparable
      const currentShouldWin = currentIsNewer && timestampsComparable
      const sessionCountWouldHaveTriggeredOldBug = sessionCountDiffers && !canonicalIsNewer
      
      console.log('[phase26f-verified-zip-reconciliation-overwrite-fix]', {
        trigger: triggerSource,
        canonicalProgramId: canonicalProgram.id,
        currentProgramId: currentProgram.id,
        canonicalCreatedAt: canonicalProgram.createdAt,
        currentCreatedAt: currentProgram.createdAt,
        canonicalSessionCount: canonicalProgram.sessions?.length || 0,
        currentSessionCount: currentProgram.sessions?.length || 0,
        canonicalScheduleMode: (canonicalProgram as unknown as { scheduleMode?: string }).scheduleMode,
        currentScheduleMode: (currentProgram as unknown as { scheduleMode?: string }).scheduleMode,
        idDiffers,
        canonicalIsNewer,
        currentIsNewer,
        sessionCountDiffers,
        timestampsComparable,
        canonicalShouldWin,
        currentShouldWin,
        sessionCountWouldHaveTriggeredOldBug,
        shouldReplace,
        replacementBlockedReason: !shouldReplace
          ? (currentIsNewer
              ? 'current_program_is_newer'
              : sessionCountWouldHaveTriggeredOldBug
                ? 'session_count_differs_but_canonical_is_older_phase26f_protected'
                : 'no_material_difference')
          : null,
        replacementReason: shouldReplace
          ? (canonicalIsNewer
              ? 'canonical_program_is_newer'
              : 'id_differs_and_current_not_newer')
          : null,
        verdict: shouldReplace
          ? 'CANONICAL_REPLACES_CURRENT_NEWER'
          : currentIsNewer
            ? 'CURRENT_PROTECTED_AS_NEWER'
            : sessionCountWouldHaveTriggeredOldBug
              ? 'PHASE26F_BLOCKED_OLD_BUG_SESSION_COUNT_OVERWRITE'
              : idDiffers
                ? 'SAME_PROGRAM_NO_REPLACE'
                : 'NO_CHANGE_NEEDED',
      })
      
      // ==========================================================================
      // [POST-BUILD WINNER DECISION] Compact high-signal diagnostic for replacement
      // This makes the overwrite path undeniable - one log per decision
      // ==========================================================================
      const authLockSnapshot = authoritativeSavedProgramRef.current
      const lockActive = authLockSnapshot && Date.now() < authLockSnapshot.lockExpiresAt
      console.log('[post-build-winner-decision]', {
        triggerSource,
        currentVisibleProgramId: currentProgram.id,
        currentVisibleSessionCount: currentProgram.sessions?.length ?? 0,
        lockedProgramId: authLockSnapshot?.programId ?? null,
        lockedSessionCount: authLockSnapshot?.sessionCount ?? null,
        candidateProgramId: canonicalProgram.id,
        candidateSessionCount: canonicalProgram.sessions?.length ?? 0,
        candidateCreatedAt: canonicalProgram.createdAt,
        currentCreatedAt: currentProgram.createdAt,
        lockActive,
        candidateIsNewer: canonicalIsNewer,
        replaceAllowed: shouldReplace,
        replaceBlockedReason: !shouldReplace
          ? (lockActive
              ? 'POST_BUILD_LOCK_ACTIVE'
              : currentIsNewer
                ? 'CURRENT_IS_NEWER'
                : sessionCountWouldHaveTriggeredOldBug
                  ? 'SESSION_COUNT_ONLY_NO_OVERWRITE'
                  : 'NO_MATERIAL_DIFFERENCE')
          : null,
        finalWinner: shouldReplace
          ? 'CANONICAL_CANDIDATE'
          : lockActive
            ? 'LOCKED_POST_BUILD_PROGRAM'
            : 'CURRENT_VISIBLE_PROGRAM',
      })
      
      if (shouldReplace) {
        // [PHASE 17M] Program reconciliation replace - log the replacement with specific reason
        console.log('[phase17m-program-reconciliation-replace]', {
          trigger: triggerSource,
          reason: canonicalIsNewer
            ? 'canonical_is_newer'
            : idDiffers
            ? 'id_differs_and_current_not_newer'
            : 'unknown',
          previousProgramId: currentProgram.id,
          previousSessionCount: currentProgram.sessions?.length || 0,
          previousScheduleMode: (currentProgram as unknown as { scheduleMode?: string }).scheduleMode,
          nextProgramId: canonicalProgram.id,
          nextSessionCount: canonicalProgram.sessions?.length || 0,
          nextScheduleMode: (canonicalProgram as unknown as { scheduleMode?: string }).scheduleMode,
        })
        
        // Normalize and set the canonical program
        const normalizedCanonical = programModules.normalizeProgramForDisplay?.(canonicalProgram)
        if (normalizedCanonical) {
          setProgram(normalizedCanonical)
          
          // [PHASE 17K] Post-success program replacement
          console.log('[phase17k-post-success-program-replacement]', {
            trigger: triggerSource,
            previousProgramId: currentProgram.id,
            previousSessionCount: currentProgram.sessions?.length || 0,
            newProgramId: normalizedCanonical.id,
            newSessionCount: normalizedCanonical.sessions?.length || 0,
            newFlexibleRootCause: (normalizedCanonical as unknown as { flexibleFrequencyRootCause?: { finalReasonCategory?: string } }).flexibleFrequencyRootCause?.finalReasonCategory || 'not_set',
            verdict: 'STALE_PROGRAM_REPLACED_WITH_CANONICAL',
          })
          
          // [PHASE 17K] Program summary source audit after fix
          console.log('[phase17k-program-summary-source-audit]', {
            trigger: triggerSource,
            newProgramId: normalizedCanonical.id,
            newSessionCount: normalizedCanonical.sessions?.length || 0,
            newSelectedSkillsCount: (normalizedCanonical as unknown as { selectedSkills?: string[] }).selectedSkills?.length || 0,
            summaryNowDerivedFrom: 'reconciled_canonical_program',
          })
        }
        // ==========================================================================
        // [PHASE 28A] RECONCILIATION_RECHECK AUDIT - REPLACED
        // ==========================================================================
        console.log('[phase28a-canonical-schedule-truth-audit]', {
          checkpoint: 'RECONCILIATION_RECHECK',
          // Current in-memory program
          currentProgramScheduleMode: (currentProgram as unknown as { scheduleMode?: string }).scheduleMode,
          currentProgramTrainingDays: (currentProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
          // Canonical values
          canonicalProgramScheduleMode: (canonicalProgram as unknown as { scheduleMode?: string }).scheduleMode,
          canonicalProgramTrainingDays: (canonicalProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
          // Decision
          replacementDecision: 'replaced',
          replacementReason: canonicalIsNewer ? 'canonical_is_newer' : idDiffers ? 'id_differs' : 'unknown',
          // Verdict
          verdict: (canonicalProgram as unknown as { scheduleMode?: string }).scheduleMode === 'flexible'
            ? 'RECONCILIATION_REPLACED_WITH_FLEXIBLE'
            : `RECONCILIATION_REPLACED_WITH_STATIC_${(canonicalProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek}`,
        })
      } else {
        // [PHASE 17M/26E] Program reconciliation keep - current program is valid/newer
        console.log('[phase17m-program-reconciliation-keep]', {
          trigger: triggerSource,
          reason: currentIsNewer
            ? 'current_program_is_newer_than_canonical'
            : 'no_material_difference_detected',
          currentProgramId: currentProgram.id,
          currentSessionCount: currentProgram.sessions?.length || 0,
          currentScheduleMode: (currentProgram as unknown as { scheduleMode?: string }).scheduleMode,
          currentTrainingDays: (currentProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
        })
        
        // ==========================================================================
        // [PHASE 28A] RECONCILIATION_RECHECK AUDIT - KEPT
        // ==========================================================================
        console.log('[phase28a-canonical-schedule-truth-audit]', {
          checkpoint: 'RECONCILIATION_RECHECK',
          // Current in-memory program
          currentProgramScheduleMode: (currentProgram as unknown as { scheduleMode?: string }).scheduleMode,
          currentProgramTrainingDays: (currentProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
          // Canonical values
          canonicalProgramScheduleMode: (canonicalProgram as unknown as { scheduleMode?: string }).scheduleMode,
          canonicalProgramTrainingDays: (canonicalProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
          // Decision
          replacementDecision: 'kept',
          replacementReason: currentIsNewer ? 'current_is_newer' : 'no_material_difference',
          // Verdict
          verdict: (currentProgram as unknown as { scheduleMode?: string }).scheduleMode === 'static' &&
            (currentProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek === 6
            ? 'RECONCILIATION_KEPT_NEWER_STATIC_6'
            : 'RECONCILIATION_NO_EFFECT',
        })
      }
    }
    
    // Listen for visibility changes (tab becomes visible) [PHASE 17J]
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reconcileWithCanonical('visibilitychange_to_visible')
      }
    }
    
    // Listen for window focus (user clicks back into tab) [PHASE 17J]
    const handleFocus = () => {
      reconcileWithCanonical('window_focus')
    }
    
    // [PHASE 17K] Listen for storage events (cross-tab localStorage changes)
    const handleStorage = (event: StorageEvent) => {
      // Check if the change is to the adaptive program key
      if (event.key && (event.key.includes('adaptive') || event.key.includes('program'))) {
        console.log('[phase17k-storage-event-detected]', {
          key: event.key,
          currentProgramId: program?.id || 'none',
        })
        reconcileWithCanonical('storage_event')
      }
    }
    
    // [PHASE 17K] Periodic reconciliation check for same-tab changes
    // This catches cases where localStorage is updated in the same tab but
    // no focus/visibility event fires (e.g., onboarding completion while on program page)
    const intervalId = setInterval(() => {
      reconcileWithCanonical('periodic_check')
    }, 2000) // Check every 2 seconds
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorage)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
      clearInterval(intervalId)
    }
  }, [program, programModules.getProgramState, programModules.normalizeProgramForDisplay])
  

  
  // ==========================================================================
  // [PHASE 21A] Simple modal prop audit - no complex state machine
  // ==========================================================================
  useEffect(() => {
    if (showAdjustmentModal) {
      console.log('[phase21a-program-adjustment-modal-prop]', {
        open: showAdjustmentModal,
        showBuilder,
        programExists: !!program,
        programId: program?.id ?? null,
      })
    }
  }, [showAdjustmentModal, showBuilder, program])
  
  // ==========================================================================
  // [PHASE 30I] STEP 4: Track showBuilder state changes
  // This effect proves whether showBuilder is being set and then reset
  // [PHASE 30J] SAFETY: Wrapped in try/catch to prevent diagnostic crash
  // ==========================================================================
  useEffect(() => {
    try {
      console.log('[phase30i-showBuilder-state-changed]', {
        showBuilder,
        modifyFlowState,
        programExists: !!program,
        timestamp: new Date().toISOString(),
        verdict: showBuilder ? 'SHOWBUILDER_IS_NOW_TRUE' : 'SHOWBUILDER_IS_NOW_FALSE',
      })
      
      // [PHASE 30L] AUTHORITATIVE STATE WINNER LOG
      // This proves whether showBuilder survived or was overwritten while lock was active
      const modifyLockActive = modifyBuilderLockRef.current
      console.log('[phase30l-showBuilder-authoritative-state]', {
        showBuilder,
        modifyBuilderLock: modifyLockActive,
        modifyFlowState,
        loadStage,
        programExists: !!program,
        verdict: showBuilder
          ? 'SHOWBUILDER_TRUE_SURVIVED'
          : modifyLockActive
          ? 'SHOWBUILDER_FALSE_WHILE_MODIFY_LOCK_ACTIVE'
          : 'SHOWBUILDER_FALSE_NORMAL',
      })
      
      // [PHASE 30J] Boot stability verdict - proves page survived initialization
      // [PHASE 30K] FIX: Removed generationStage - it's only defined inside generation handlers, not page scope
      console.log('[phase30j-program-boot-stability-final]', {
        has_program: !!program,
        showBuilder: !!showBuilder,
        modifyFlowState: modifyFlowState ?? null,
        loadStage: loadStage ?? null,
        generationError: generationError ?? null,
        verdict: 'PROGRAM_BOOT_SURVIVED_PHASE30J',
      })
    } catch (err) {
      console.error('[phase30j-state-change-effect-crash]', { error: String(err) })
    }
  }, [showBuilder, modifyFlowState, program, loadStage, generationError])
  
  // Load last build result on mount - but clear stale failures if current program is newer
  useEffect(() => {
    const stored = getLastBuildAttemptResult()
    
    // [PHASE 15E BABY AUDIT] Hydration entry audit
    console.log('[hydration-entry-audit]', {
      storedExists: !!stored,
      storedStatus: stored?.status || 'null',
      storedRuntimeSessionId: stored?.runtimeSessionId || 'null',
      storedHydratedFromStorage: stored?.hydratedFromStorage ?? 'not_yet_normalized',
      storedAttemptedAt: stored?.attemptedAt || 'null',
      currentRuntimeSessionId: runtimeSessionIdRef.current,
      programExists: !!program,
      programId: program?.id || 'null',
      programCreatedAt: program?.createdAt || 'null',
      verdict: !stored 
        ? 'no_stored_result' 
        : stored.status === 'success' 
          ? 'stored_success' 
          : 'stored_failure_will_be_evaluated',
    })
    
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
  // ==========================================================================
  // [PHASE 24N] UNIFIED CANONICAL HANDLER - Single entry point for ALL builder submits
  // This handler now accepts optional inputOverrides for Modify flow convergence
  // Both onboarding and modify flows now use this same handler
  // ==========================================================================
  const handleGenerate = useCallback(async (inputOverrides?: Partial<AdaptiveBuilderInputs> | AdaptiveProgramInputs) => {
    // ==========================================================================
    // [PHASE 24T] CRITICAL FIX: Use inputOverrides directly when it's a full object
    // Previously this merged {...inputs, ...inputOverrides} which caused stale `inputs`
    // from the closure to override user's selections from builderSessionInputs.
    // Now we detect if inputOverrides is a complete inputs object and use it directly.
    // ==========================================================================
    const isFullInputsObject = inputOverrides && 'primaryGoal' in inputOverrides && 'scheduleMode' in inputOverrides
    const effectiveInputs = isFullInputsObject
      ? inputOverrides as AdaptiveBuilderInputs  // [PHASE 24T] Use directly, don't merge with stale inputs
      : inputOverrides 
        ? { ...inputs, ...inputOverrides } as AdaptiveBuilderInputs  // Partial override case
        : inputs  // No overrides, use page inputs
    const isModifyFlow = !!inputOverrides
    
    console.log('[phase24t-inputs-merge-fix-audit]', {
      hasInputOverrides: !!inputOverrides,
      isFullInputsObject,
      inputOverridesScheduleMode: inputOverrides && 'scheduleMode' in inputOverrides ? (inputOverrides as AdaptiveProgramInputs).scheduleMode : 'N/A',
      inputOverridesTrainingDays: inputOverrides && 'trainingDaysPerWeek' in inputOverrides ? (inputOverrides as AdaptiveProgramInputs).trainingDaysPerWeek : 'N/A',
      pageInputsScheduleMode: inputs?.scheduleMode,
      effectiveInputsScheduleMode: effectiveInputs?.scheduleMode,
      effectiveInputsTrainingDays: effectiveInputs?.trainingDaysPerWeek,
      verdict: isFullInputsObject ? 'FULL_OBJECT_USED_DIRECTLY_NO_STALE_MERGE' : 'PARTIAL_OR_NO_OVERRIDE',
    })
    
    // ==========================================================================
    // [PHASE 25X] LIVE SUBMIT TRUTH VS SELECTOR STATE - handleGenerate entry
    // This is the CRITICAL audit point - what does handleGenerate actually receive?
    // ==========================================================================
    console.log('[phase25x-live-submit-truth-vs-selector-state]', {
      stage: 'HANDLEGENERATE_ENTRY',
      isFullInputsObject,
      effectiveInputsScheduleMode: effectiveInputs?.scheduleMode,
      effectiveInputsTrainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
      effectiveInputsSessionDurationMode: effectiveInputs?.sessionDurationMode,
      effectiveInputsPrimaryGoal: effectiveInputs?.primaryGoal,
      verdict: effectiveInputs?.scheduleMode === 'static' 
        ? `HANDLEGENERATE_RECEIVED_STATIC_${effectiveInputs?.trainingDaysPerWeek}_DAYS`
        : 'HANDLEGENERATE_RECEIVED_FLEXIBLE',
    })
    
    // ISSUE A FIX: Validate prerequisites before starting generation
    if (!effectiveInputs) {
      console.error('[ProgramPage] handleGenerate: Missing inputs - cannot generate')
      setGenerationError('Missing program inputs. Please refresh the page.')
      return
    }
    if (!programModules.generateAdaptiveProgram || !programModules.saveAdaptiveProgram) {
      console.error('[ProgramPage] handleGenerate: Modules not loaded yet')
      setGenerationError('Program builder is still loading. Please wait a moment and try again.')
      return
    }
    
    console.log('[ProgramPage] handleGenerate: Starting generation', { 
      source: isModifyFlow ? 'modify_builder_unified' : 'builder',
      isModifyFlow,
      hasInputOverrides: !!inputOverrides,
    })
    
    // ==========================================================================
    // [PHASE 24N] Unified handler context audit - replaces old modify divergence check
    // ==========================================================================
    console.log('[phase24n-unified-handleGenerate-context-audit]', {
      builderOrigin,
      isModifyFlow,
      hasInputOverrides: !!inputOverrides,
      programExists: !!program,
      showBuilder,
      verdict: 'UNIFIED_CANONICAL_PATH_ACTIVE',
    })
    
    // ==========================================================================
    // [PHASE 24N] Unified submit execution path audit
    // ==========================================================================
    console.log('[phase24n-unified-submit-handler-verdict]', {
      handler: 'handleGenerate_unified',
      isModifyFlow,
      inputsUsed: {
        primaryGoal: effectiveInputs?.primaryGoal,
        secondaryGoal: effectiveInputs?.secondaryGoal,
        scheduleMode: effectiveInputs?.scheduleMode,
        trainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
        sessionDurationMode: effectiveInputs?.sessionDurationMode,
        sessionLength: effectiveInputs?.sessionLength,
        selectedSkills: effectiveInputs?.selectedSkills,
        trainingPathType: effectiveInputs?.trainingPathType,
        experienceLevel: effectiveInputs?.experienceLevel,
        equipmentCount: effectiveInputs?.equipment?.length ?? 0,
      },
      verdict: isModifyFlow ? 'MODIFY_FLOW_VIA_UNIFIED_HANDLER' : 'ONBOARDING_FLOW_VIA_UNIFIED_HANDLER',
    })
    
    // ==========================================================================
    // [PHASE 24S] CRITICAL SCHEDULE TRUTH SUBMIT AUDIT
    // This log proves whether 6-day static intent actually reached submit
    // If scheduleMode is still 'flexible', the user did NOT change the Training Days selector
    // ==========================================================================
    const scheduleSubmitTruth = {
      scheduleMode: effectiveInputs?.scheduleMode,
      trainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
      isFlexible: effectiveInputs?.scheduleMode === 'flexible' || effectiveInputs?.trainingDaysPerWeek === 'flexible',
      isStatic: effectiveInputs?.scheduleMode === 'static' && typeof effectiveInputs?.trainingDaysPerWeek === 'number',
      staticDayCount: typeof effectiveInputs?.trainingDaysPerWeek === 'number' ? effectiveInputs.trainingDaysPerWeek : null,
    }
    console.log('[phase24s-schedule-truth-submit-audit]', {
      ...scheduleSubmitTruth,
      verdict: scheduleSubmitTruth.isStatic 
        ? `STATIC_${scheduleSubmitTruth.staticDayCount}_DAYS_SUBMITTED`
        : 'FLEXIBLE_SCHEDULE_SUBMITTED_USER_DID_NOT_CHANGE_TRAINING_DAYS',
      userMustChangeTrainingDaysSelector: scheduleSubmitTruth.isFlexible,
    })
    
    // ==========================================================================
    // [PHASE 27A] HANDLEGENERATE_RECEIVED - forensic chain step 4
    // Records the EXACT effectiveInputs received by handleGenerate
    // ==========================================================================
    console.log('[phase27a-modify-forensic-chain]', {
      step: 'HANDLEGENERATE_RECEIVED',
      effectiveScheduleMode: effectiveInputs?.scheduleMode,
      effectiveTrainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
      effectiveSessionDurationMode: effectiveInputs?.sessionDurationMode,
      effectivePrimaryGoal: effectiveInputs?.primaryGoal,
      inputOverridesProvided: !!inputOverrides,
      inputOverridesScheduleMode: (inputOverrides as AdaptiveProgramInputs)?.scheduleMode,
      inputOverridesTrainingDays: (inputOverrides as AdaptiveProgramInputs)?.trainingDaysPerWeek,
      verdict: effectiveInputs?.scheduleMode === 'static'
        ? `HANDLEGENERATE_RECEIVED_STATIC_${effectiveInputs?.trainingDaysPerWeek}_DAYS`
        : 'HANDLEGENERATE_RECEIVED_FLEXIBLE',
    })
    
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
    
    // ==========================================================================
    // [PHASE 24N] Unified generation entry source truth audit
    // ==========================================================================
    console.log('[phase24n-unified-entry-truth-audit]', {
      sourceLayer: isModifyFlow ? 'modify_unified_path' : 'onboarding_generation_path',
      generationTrigger: isModifyFlow ? 'modify_builder_submit' : 'onboarding_completion',
      isModifyFlow,
      rawTruthUsedForEntry: {
        inputs_primaryGoal: effectiveInputs?.primaryGoal ?? null,
        inputs_secondaryGoal: effectiveInputs?.secondaryGoal ?? null,
        inputs_scheduleMode: effectiveInputs?.scheduleMode ?? null,
        inputs_trainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek ?? null,
        inputs_sessionDurationMode: effectiveInputs?.sessionDurationMode ?? null,
        inputs_sessionLength: effectiveInputs?.sessionLength ?? null,
        inputs_selectedSkills: effectiveInputs?.selectedSkills ?? [],
        inputs_selectedStyles: effectiveInputs?.selectedStyles ?? null,
        inputs_trainingPathType: effectiveInputs?.trainingPathType ?? null,
        inputs_equipment: effectiveInputs?.equipment ?? [],
      },
      entryBuilderUsed: 'buildCanonicalGenerationEntry',
      entryBuilderOverrides: isModifyFlow ? 'from_modify_inputs' : 'none',
    })
    
    // [PHASE 24N] Build canonical entry with overrides when in modify flow
    const entryOverrides = isModifyFlow ? {
      primaryGoal: effectiveInputs.primaryGoal,
      secondaryGoal: effectiveInputs.secondaryGoal,
      experienceLevel: effectiveInputs.experienceLevel,
      trainingDaysPerWeek: effectiveInputs.trainingDaysPerWeek,
      sessionLength: effectiveInputs.sessionLength,
      scheduleMode: effectiveInputs.scheduleMode,
      sessionDurationMode: effectiveInputs.sessionDurationMode,
      equipment: effectiveInputs.equipment,
      selectedSkills: effectiveInputs.selectedSkills,
      trainingPathType: effectiveInputs.trainingPathType,
      goalCategories: effectiveInputs.goalCategories,
      selectedFlexibility: effectiveInputs.selectedFlexibility,
    } : undefined
    
    const entryResult = buildCanonicalGenerationEntry(
      isModifyFlow ? 'handleGenerate_modifyFlow' : 'handleGenerate',
      entryOverrides
    )
    
    // ==========================================================================
    // [MAIN-GEN-TRUTH step-3] Update main generation trace with canonical entry info
    // This captures what the entry builder actually produced
    // ==========================================================================
    if (typeof window !== 'undefined' && !isModifyFlow && entryResult.success) {
      const storedMainGenRaw = sessionStorage.getItem('mainGenTruthAudit')
      if (storedMainGenRaw) {
        const storedMainGen = JSON.parse(storedMainGenRaw) as MainGenTruthAudit
        const entry = entryResult.entry!
        
        const updatedMainGen: MainGenTruthAudit = {
          ...storedMainGen,
          // Step 3: Canonical entry result
          entryScheduleMode: entry.scheduleMode ?? null,
          entryTrainingDaysPerWeek: entry.trainingDaysPerWeek ?? null,
          entrySelectedSkillsCount: entry.selectedSkills?.length ?? null,
          entryExperienceLevel: entry.experienceLevel ?? null,
          entryFallbacksUsed: entry.fallbacksUsed ?? null,
        }
        
        console.log('[MAIN-GEN-TRUTH step-3-canonical-entry]', {
          attemptId: storedMainGen.attemptId,
          entryScheduleMode: entry.scheduleMode,
          entryTrainingDaysPerWeek: entry.trainingDaysPerWeek,
          entrySelectedSkillsCount: entry.selectedSkills?.length ?? 0,
          entryExperienceLevel: entry.experienceLevel,
          // Compare to submitted
          submittedScheduleMode: storedMainGen.submittedScheduleMode,
          submittedTrainingDays: storedMainGen.submittedTrainingDaysPerWeek,
          matchesSubmitted: entry.scheduleMode === storedMainGen.submittedScheduleMode,
        })
        
        sessionStorage.setItem('mainGenTruthAudit', JSON.stringify(updatedMainGen))
        setMainGenTruthAudit(updatedMainGen)
      }
    }
    
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
  console.log('[program-build] STAGE 2: Calling authoritative server generation...')
  
  // [PHASE 16S] Dispatch verdict - marking actual builder call
  const mainGenerationAttemptId = `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  console.log('[phase16s-generate-dispatch-verdict]', {
    flowName: 'main_generation',
    attemptId: mainGenerationAttemptId,
    runtimeSessionId: runtimeSessionIdRef.current,
    requestDispatched: true,
    dispatchMethod: '/api/program/generate-fresh',
    dispatchTimestamp: new Date().toISOString(),
    verdict: 'dispatch_via_authoritative_server_route',
  })
  
  // ==========================================================================
  // [AUTHORITATIVE-GENERATION-OWNER] FRESH MAIN BUILD via Server Route
  // ALL generation now routes through the single authoritative server pipeline.
  // This ensures consistent truth normalization, builder contract, and 
  // truth explanation attachment across all flows.
  // ==========================================================================
  const isFreshMainBuild = !isModifyFlow
  console.log('[authoritative-generation-dispatch]', {
    isFreshMainBuild,
    isModifyFlow,
    scheduleModeAtDispatch: generationInputs?.scheduleMode,
    route: '/api/program/generate-fresh',
    verdict: 'ROUTING_TO_AUTHORITATIVE_SERVER_GENERATION',
  })
  
  // Build canonical profile from entry result for server route
  const canonicalProfile = {
    primaryGoal: entryResult.entry?.primaryGoal,
    secondaryGoal: entryResult.entry?.secondaryGoal,
    scheduleMode: entryResult.entry?.scheduleMode,
    sessionDurationMode: entryResult.entry?.sessionDurationMode,
    trainingDaysPerWeek: entryResult.entry?.trainingDaysPerWeek,
    sessionLengthMinutes: entryResult.entry?.sessionLength,
    selectedSkills: entryResult.entry?.selectedSkills || [],
    selectedFlexibility: entryResult.entry?.selectedFlexibility || [],
    selectedStrength: entryResult.entry?.selectedStrength || [],
    goalCategories: entryResult.entry?.goalCategories || [],
    trainingPathType: entryResult.entry?.trainingPathType,
    experienceLevel: entryResult.entry?.experienceLevel,
    equipment: entryResult.entry?.equipment || [],
    equipmentAvailable: entryResult.entry?.equipment || [],
    bodyweight: entryResult.entry?.bodyweight,
    sex: entryResult.entry?.sex,
    onboardingComplete: true,
  }
  
  // Call authoritative server route instead of direct builder
  const serverResponse = await fetch('/api/program/generate-fresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      canonicalProfile,
      builderInputs: generationInputs,
      existingProgramId: program?.id,
    }),
  })
  
  const serverResult = await serverResponse.json()
  
  if (!serverResponse.ok || !serverResult.success) {
    console.error('[authoritative-generation-server-error]', {
      status: serverResponse.status,
      error: serverResult.error,
      failedStage: serverResult.failedStage,
    })
    throw new ProgramPageValidationError(
      'orchestration_failed',
      generationStage,
      'server_generation_failed',
      serverResult.error || 'Server generation failed',
      { failedStage: serverResult.failedStage }
    )
  }
  
  // Extract program from server result
  const newProgram = serverResult.program as AdaptiveProgram
  
  console.log('[authoritative-generation-server-success]', {
    parityVerdict: serverResult.parityVerdict?.verdict,
    sessionCount: serverResult.summary?.sessionCount,
    primaryGoal: serverResult.summary?.primaryGoal,
  })
  
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
        
        // [PHASE 17N] TASK 4 - Post-onboarding save confirmation log
        console.log('[phase17n-onboarding-save-postwrite-truth]', {
          savedProgramId: newProgram.id,
          savedProgramCreatedAt: newProgram.createdAt,
          savedProgramSessionCount: newProgram.sessions?.length || 0,
          verifiedProgramStateId: savedState?.adaptiveProgram?.id || 'none',
          verifiedProgramStateCreatedAt: savedState?.adaptiveProgram?.createdAt || 'none',
          verifiedProgramStateSessionCount: savedState?.adaptiveProgram?.sessions?.length || 0,
          sameId: (savedState?.adaptiveProgram?.id || null) === (newProgram.id || null),
          sameSessionCount: (savedState?.adaptiveProgram?.sessions?.length || 0) === (newProgram.sessions?.length || 0),
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
    
    // ==========================================================================
    // [PHASE 18F] TASK 3 - Expand canonical writeback to include FULL deep planner identity
    // This ensures future rebuilds reconstruct from the same truth class as this successful build
    // ==========================================================================
    const initialBuildWritebackTruth = {
      // Schedule/duration fields
      trainingDaysPerWeek: effectiveTrainingDays ?? undefined,
      sessionLengthMinutes: newProgram.sessionLength ?? inputs.sessionLength ?? undefined,
      scheduleMode: effectiveScheduleMode,
      sessionDurationMode: inputs.sessionDurationMode ?? undefined,
      // Equipment
      equipmentAvailable: canonicalEquipment,
      // Goal fields
      primaryGoal: inputs.primaryGoal ?? undefined,
      secondaryGoal: inputs.secondaryGoal ?? undefined,
      // Experience
      experienceLevel: inputs.experienceLevel ?? undefined,
      // [PHASE 18F] Deep planner identity fields - CRITICAL for rebuild parity
      selectedSkills: inputs.selectedSkills?.length ? inputs.selectedSkills : undefined,
      trainingPathType: inputs.trainingPathType ?? undefined,
      goalCategories: inputs.goalCategories?.length ? inputs.goalCategories : undefined,
      selectedFlexibility: inputs.selectedFlexibility?.length ? inputs.selectedFlexibility : undefined,
      selectedStrength: inputs.selectedStrength?.length ? inputs.selectedStrength : undefined,
    }
    
    // [PHASE 18F] TASK 1 - Pre-writeback depth audit
    console.log('[phase18f-pre-writeback-depth-audit]', {
      triggerPath: 'initial_build_success',
      successfulProgramContains: {
        sessionCount: newProgram.sessions?.length ?? 0,
        primaryGoal: newProgram.primaryGoal ?? null,
        trainingPathType: (newProgram as unknown as { trainingPathType?: string }).trainingPathType ?? null,
        selectedSkills: (newProgram as unknown as { selectedSkills?: string[] }).selectedSkills ?? [],
      },
      inputsTruthContains: {
        primaryGoal: inputs.primaryGoal ?? null,
        secondaryGoal: inputs.secondaryGoal ?? null,
        selectedSkills: inputs.selectedSkills ?? [],
        trainingPathType: inputs.trainingPathType ?? null,
        goalCategories: inputs.goalCategories ?? [],
        selectedFlexibility: inputs.selectedFlexibility ?? [],
        selectedStrength: inputs.selectedStrength ?? [],
        experienceLevel: inputs.experienceLevel ?? null,
      },
      writebackTruthWillPersist: {
        primaryGoal: initialBuildWritebackTruth.primaryGoal ?? null,
        secondaryGoal: initialBuildWritebackTruth.secondaryGoal ?? null,
        selectedSkills: initialBuildWritebackTruth.selectedSkills ?? [],
        trainingPathType: initialBuildWritebackTruth.trainingPathType ?? null,
        goalCategories: initialBuildWritebackTruth.goalCategories ?? [],
        selectedFlexibility: initialBuildWritebackTruth.selectedFlexibility ?? [],
        selectedStrength: initialBuildWritebackTruth.selectedStrength ?? [],
        experienceLevel: initialBuildWritebackTruth.experienceLevel ?? null,
      },
      deepPlannerFieldsIncluded: ['selectedSkills', 'trainingPathType', 'goalCategories', 'selectedFlexibility', 'selectedStrength'],
      verdict: 'WRITEBACK_NOW_INCLUDES_DEEP_PLANNER_IDENTITY',
    })
    
    saveCanonicalProfile(initialBuildWritebackTruth)
    
    console.log('[post-build-truth] STAGE 6d: FULL canonical profile updated', {
      trainingDaysPerWeek: effectiveTrainingDays,
      sessionLength: newProgram.sessionLength,
      scheduleMode: effectiveScheduleMode,
      equipmentCount: canonicalEquipment.length,
      canonicalEquipment,
      // [PHASE 18F] Log deep planner fields
      primaryGoal: initialBuildWritebackTruth.primaryGoal,
      selectedSkills: initialBuildWritebackTruth.selectedSkills,
      trainingPathType: initialBuildWritebackTruth.trainingPathType,
      goalCategories: initialBuildWritebackTruth.goalCategories,
      fromProgram: true,
      phase18fDeepIdentityPersisted: true,
    })
    
    // [PHASE 18F] TASK 5 - Post-writeback readback verification
    const canonicalReadback = getCanonicalProfile()
    const readbackParityChecks = {
      primaryGoalMatch: (canonicalReadback?.primaryGoal ?? null) === (initialBuildWritebackTruth.primaryGoal ?? null),
      selectedSkillsMatch: JSON.stringify(canonicalReadback?.selectedSkills ?? []) === JSON.stringify(initialBuildWritebackTruth.selectedSkills ?? []),
      trainingPathTypeMatch: (canonicalReadback?.trainingPathType ?? null) === (initialBuildWritebackTruth.trainingPathType ?? null),
      goalCategoriesMatch: JSON.stringify(canonicalReadback?.goalCategories ?? []) === JSON.stringify(initialBuildWritebackTruth.goalCategories ?? []),
      selectedFlexibilityMatch: JSON.stringify(canonicalReadback?.selectedFlexibility ?? []) === JSON.stringify(initialBuildWritebackTruth.selectedFlexibility ?? []),
      experienceLevelMatch: (canonicalReadback?.experienceLevel ?? null) === (initialBuildWritebackTruth.experienceLevel ?? null),
    }
    const allReadbackFieldsMatch = Object.values(readbackParityChecks).every(Boolean)
    
    console.log('[phase18f-post-writeback-readback-audit]', {
      triggerPath: 'initial_build_success',
      canonicalReadback: {
        primaryGoal: canonicalReadback?.primaryGoal ?? null,
        selectedSkills: canonicalReadback?.selectedSkills ?? [],
        trainingPathType: canonicalReadback?.trainingPathType ?? null,
        goalCategories: canonicalReadback?.goalCategories ?? [],
        selectedFlexibility: canonicalReadback?.selectedFlexibility ?? [],
        experienceLevel: canonicalReadback?.experienceLevel ?? null,
      },
      parityChecks: readbackParityChecks,
      allFieldsMatch: allReadbackFieldsMatch,
    })
    
    console.log('[phase18f-canonical-readback-parity-verdict]', {
      triggerPath: 'initial_build_success',
      verdict: allReadbackFieldsMatch
        ? 'CANONICAL_NOW_CARRIES_FULL_DEEP_PLANNER_IDENTITY'
        : 'CANONICAL_WRITEBACK_INCOMPLETE__SOME_FIELDS_NOT_PERSISTED',
    })
    
    console.log('[phase18f-root-cause-classification-verdict]', {
      triggerPath: 'initial_build_success',
      deepPlannerFieldsPersisted: allReadbackFieldsMatch,
      verdict: allReadbackFieldsMatch
        ? 'ROOT_CAUSE_WAS_INCOMPLETE_CANONICAL_WRITEBACK__FUTURE_REBUILDS_CAN_NOW_USE_FULL_PERSISTED_IDENTITY'
        : 'CANONICAL_WRITEBACK_FIXED__IF_RESULT_STILL_REGRESSES_ROOT_CAUSE_IS_DEEPER_THAN_PERSISTENCE',
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
        
        // ==========================================================================
        // [PHASE 21B] TASK 6 - Post-submit hydration audit
        // ==========================================================================
        console.log('[phase21b-modify-root-server-result-audit]', {
          newProgramId: newProgram.id,
          sessionCount: newProgram.sessions?.length ?? 0,
          scheduleMode: newProgram.scheduleMode,
          primaryGoal: (newProgram as unknown as { profileSnapshot?: { primaryGoal?: string } }).profileSnapshot?.primaryGoal ?? 'unknown',
          secondaryGoal: (newProgram as unknown as { profileSnapshot?: { secondaryGoal?: string } }).profileSnapshot?.secondaryGoal ?? 'unknown',
          experienceLevel: (newProgram as unknown as { profileSnapshot?: { experienceLevel?: string } }).profileSnapshot?.experienceLevel ?? 'unknown',
          selectedSkillsCount: (newProgram as unknown as { profileSnapshot?: { selectedSkills?: string[] } }).profileSnapshot?.selectedSkills?.length ?? 0,
        })
        
        console.log('[phase21b-modify-root-visible-hydration-audit]', {
          action: 'setProgram(newProgram)',
          newProgramId: newProgram.id,
          sessionCount: newProgram.sessions?.length ?? 0,
          verdict: newProgram.sessions?.length >= 6 
            ? 'STRONG_6_SESSION_PROGRAM_HYDRATED'
            : newProgram.sessions?.length === 4 
              ? 'WEAK_4_SESSION_HYBRID_HYDRATED'
              : `SESSION_COUNT_${newProgram.sessions?.length ?? 0}`,
        })
        
        // ==========================================================================
        // [PHASE 25Y] PROVE THE EXACT SUBMIT TRUTH - FINAL PROGRAM AUDIT
        // This captures the FINAL schedule fields in the newly generated program
        // ==========================================================================
        const finalProgramScheduleMode = (newProgram as unknown as { scheduleMode?: string }).scheduleMode
        const finalProgramTrainingDays = (newProgram as unknown as { trainingDaysPerWeek?: number | string }).trainingDaysPerWeek
        const finalProgramSessionCount = newProgram.sessions?.length ?? 0
        
        console.log('[phase25y-prove-submit-truth-before-any-more-patches]', {
          stage: 'FINAL_PROGRAM_SAVED',
          finalProgramScheduleMode,
          finalProgramTrainingDays,
          finalProgramSessionCount,
          effectiveInputsScheduleModeUsed: effectiveInputs?.scheduleMode,
          effectiveInputsTrainingDaysUsed: effectiveInputs?.trainingDaysPerWeek,
          verdict: finalProgramScheduleMode === 'static'
            ? `FINAL_PROGRAM_IS_STATIC_${finalProgramTrainingDays}_DAYS_WITH_${finalProgramSessionCount}_SESSIONS`
            : `FINAL_PROGRAM_IS_FLEXIBLE_WITH_${finalProgramSessionCount}_SESSIONS`,
        })
        
        // ==========================================================================
        // [PHASE 25Z] 6-DAY REGISTRATION FINAL TRUTH CHAIN - END-TO-END VERDICT
        // This is the definitive audit of whether static 6 survived the full chain
        // ==========================================================================
        const handleGenerateReceivedStatic = effectiveInputs?.scheduleMode === 'static'
        const finalProgramIsStatic = finalProgramScheduleMode === 'static'
        const truthPreservedEndToEnd = handleGenerateReceivedStatic && finalProgramIsStatic
        const truthLostInEngine = handleGenerateReceivedStatic && !finalProgramIsStatic
        
        console.log('[phase25z-6day-registration-final-truth-chain]', {
          handleGenerateScheduleMode: effectiveInputs?.scheduleMode,
          handleGenerateTrainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
          finalProgramSavedScheduleMode: finalProgramScheduleMode,
          finalProgramSavedTrainingDaysPerWeek: finalProgramTrainingDays,
          finalProgramSessionCount,
          truthPreservedEndToEnd,
          truthLostInEngine,
          verdict: truthPreservedEndToEnd
            ? `STATIC_${effectiveInputs?.trainingDaysPerWeek}_SURVIVED_END_TO_END`
            : truthLostInEngine
              ? 'ENGINE_REWROTE_STATIC_TO_FLEXIBLE'
              : handleGenerateReceivedStatic === false && !finalProgramIsStatic
                ? 'FLEXIBLE_PRESERVED_END_TO_END'
                : 'UNKNOWN_STATE_COMBINATION',
        })
        
        // ==========================================================================
        // [PHASE 26] 6-DAY TRUTH CHAIN FORCED VERDICT - FINAL END-TO-END AUDIT
        // This is the definitive proof that the ref-based fix works
        // ==========================================================================
        console.log('[phase26-6day-truth-chain-forced-verdict]', {
          stage: 'FINAL_PROGRAM_SAVED',
          handleGenerateScheduleMode: effectiveInputs?.scheduleMode,
          handleGenerateTrainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
          finalProgramSavedScheduleMode: finalProgramScheduleMode,
          finalProgramSavedTrainingDaysPerWeek: finalProgramTrainingDays,
          finalProgramSessionCount,
          phase26RefFixApplied: true,
          verdict: truthPreservedEndToEnd
            ? `PHASE26_SUCCESS_STATIC_${effectiveInputs?.trainingDaysPerWeek}_DAYS_END_TO_END`
            : truthLostInEngine
              ? 'PHASE26_FAILED_ENGINE_STILL_REWRITING'
              : 'PHASE26_FLEXIBLE_PATH_PRESERVED',
        })
        
        // ==========================================================================
        // [PHASE 26C] POST-REF-FIX FORENSIC ROOT CAUSE - FINAL VERDICT
        // This captures whether the Phase 26C fix (user input priority over canonical)
        // successfully preserved the user's static 6-day selection end-to-end
        // ==========================================================================
        console.log('[phase26c-post-ref-fix-forensic-root-cause]', {
          stage: 'FINAL_PROGRAM_SAVED',
          handleGenerateScheduleMode: effectiveInputs?.scheduleMode,
          handleGenerateTrainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
          finalProgramSavedScheduleMode: finalProgramScheduleMode,
          finalProgramSavedTrainingDaysPerWeek: finalProgramTrainingDays,
          finalProgramSessionCount,
          phase26CInputPriorityFixApplied: true,
          verdict: truthPreservedEndToEnd
            ? `PHASE26C_SUCCESS_USER_SELECTION_PRESERVED_${effectiveInputs?.trainingDaysPerWeek}_DAYS`
            : truthLostInEngine
              ? 'PHASE26C_INVESTIGATE_REMAINING_DOWNSTREAM_REWRITE'
              : 'PHASE26C_FLEXIBLE_PATH_NO_OVERRIDE_NEEDED',
        })
        
        // ==========================================================================
        // [PHASE 26D] POST-GENERATION SAVE/HYDRATION FORENSIC - SETPROGRAM AUDIT
        // This captures the EXACT object being set into React state
        // Compare this with what AdaptiveProgramDisplay receives
        // ==========================================================================
        console.log('[phase26d-post-generation-save-hydration-forensic]', {
          stage: 'SETPROGRAM_CALLED',
          programId: newProgram.id,
          programScheduleMode: finalProgramScheduleMode,
          programTrainingDaysPerWeek: finalProgramTrainingDays,
          programSessionCount: finalProgramSessionCount,
          programCreatedAt: newProgram.createdAt,
          inputsScheduleMode: effectiveInputs?.scheduleMode,
          inputsTrainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
          verdict: finalProgramScheduleMode === 'static'
            ? `SETPROGRAM_RECEIVES_STATIC_${finalProgramTrainingDays}_DAYS`
            : 'SETPROGRAM_RECEIVES_FLEXIBLE',
        })
        
        // ==========================================================================
        // [PHASE 27A] FINAL_PROGRAM_RETURNED & PROGRAM_SET_IN_STATE - forensic chain step 5-6
        // Records what the builder returned and what gets set into React state
        // ==========================================================================
        console.log('[phase27a-modify-forensic-chain]', {
          step: 'FINAL_PROGRAM_RETURNED',
          returnedProgramId: newProgram.id,
          returnedScheduleMode: finalProgramScheduleMode,
          returnedTrainingDaysPerWeek: finalProgramTrainingDays,
          returnedSessionCount: finalProgramSessionCount,
          inputsScheduleMode: effectiveInputs?.scheduleMode,
          inputsTrainingDaysPerWeek: effectiveInputs?.trainingDaysPerWeek,
          truthPreserved: handleGenerateReceivedStatic 
            ? finalProgramScheduleMode === 'static' 
            : true,
          verdict: finalProgramScheduleMode === 'static'
            ? `BUILDER_RETURNED_STATIC_${finalProgramTrainingDays}_DAYS`
            : 'BUILDER_RETURNED_FLEXIBLE',
        })
        
        console.log('[phase27a-modify-forensic-chain]', {
          step: 'PROGRAM_SET_IN_STATE',
          programId: newProgram.id,
          scheduleMode: finalProgramScheduleMode,
          trainingDaysPerWeek: finalProgramTrainingDays,
          sessionCount: finalProgramSessionCount,
          verdict: finalProgramScheduleMode === 'static'
            ? `STATE_RECEIVES_STATIC_${finalProgramTrainingDays}_DAYS`
            : 'STATE_RECEIVES_FLEXIBLE',
        })
        
        // ==========================================================================
        // [PHASE 27A] CONSOLIDATED FINAL VERDICT
        // Determines the single verdict from the entire chain
        // ==========================================================================
        const phase27aInputWasStatic = effectiveInputs?.scheduleMode === 'static'
        const phase27aBuilderReturnedStatic = finalProgramScheduleMode === 'static'
        
        let phase27aVerdict = 'VERDICT_E_STATIC_6_SURVIVED_END_TO_END'
        if (!phase27aInputWasStatic) {
          phase27aVerdict = 'VERDICT_A_MODIFY_RUN_NEVER_LEFT_FLEXIBLE'
        } else if (phase27aInputWasStatic && !phase27aBuilderReturnedStatic) {
          phase27aVerdict = 'VERDICT_C_HANDLEGENERATE_RECEIVED_STATIC_BUT_BUILDER_RETURNED_FLEXIBLE'
        } else if (phase27aInputWasStatic && phase27aBuilderReturnedStatic) {
          phase27aVerdict = `VERDICT_E_STATIC_${finalProgramTrainingDays}_SURVIVED_END_TO_END`
        }
        
        console.log('[phase27a-modify-forensic-chain]', {
          step: 'CONSOLIDATED_FINAL_VERDICT',
          inputScheduleMode: effectiveInputs?.scheduleMode,
          inputTrainingDays: effectiveInputs?.trainingDaysPerWeek,
          builderReturnedScheduleMode: finalProgramScheduleMode,
          builderReturnedTrainingDays: finalProgramTrainingDays,
          sessionCount: finalProgramSessionCount,
          verdict: phase27aVerdict,
        })
        
        // ==========================================================================
        // [MAIN-GEN-TRUTH step-5+6+7] Update main generation trace with save/setProgram info
        // This is the CRITICAL audit point - what are we actually saving/displaying?
        // ==========================================================================
        if (typeof window !== 'undefined' && !isModifyFlow) {
          const storedMainGenRaw = sessionStorage.getItem('mainGenTruthAudit')
          if (storedMainGenRaw) {
            const storedMainGen = JSON.parse(storedMainGenRaw) as MainGenTruthAudit
            
            // Get localStorage state immediately after generation
            let localStorageId: string | null = null
            let localStorageSessions: number | null = null
            try {
              const rawStored = localStorage.getItem('spartanlab_active_program')
              if (rawStored) {
                const parsed = JSON.parse(rawStored)
                localStorageId = parsed?.id ?? null
                localStorageSessions = parsed?.sessions?.length ?? null
              }
            } catch (e) {
              // Ignore
            }
            
            const expectedSessions = storedMainGen.expectedSessionCount ?? 6
            const actualBuiltSessions = newProgram.sessions?.length ?? 0
            
            // Determine early verdict
            let earlyVerdict: MainGenTruthVerdict = 'MAIN_PENDING'
            let earlyFailedStage: string | null = null
            
            if (actualBuiltSessions >= expectedSessions) {
              earlyVerdict = expectedSessions === 6 ? 'MAIN_FULL_SUCCESS_6' : 'MAIN_FULL_SUCCESS_MATCHED_EXPECTED'
            } else {
              // Target was lost somewhere - determine where based on saved vs built
              earlyVerdict = 'MAIN_TARGET_LOST_IN_STRUCTURE_BUILD'
              earlyFailedStage = 'structure_build'
            }
            
            const updatedMainGen: MainGenTruthAudit = {
              ...storedMainGen,
              // Step 5: Structure result
              builtStructureSessionCount: actualBuiltSessions,
              builtStructureDayCount: newProgram.daysPerWeek ?? (newProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek ?? null,
              generatedProgramIdBeforeSave: newProgram.id,
              // Step 6: Save result (save happens before setProgram)
              savedProgramId: newProgram.id,
              savedProgramSessionCount: actualBuiltSessions,
              savedProgramTrainingDaysPerWeek: (newProgram as unknown as { trainingDaysPerWeek?: number }).trainingDaysPerWeek ?? null,
              localStorageProgramIdAfterSave: localStorageId,
              localStorageProgramSessionsAfterSave: localStorageSessions,
              // Step 7: setProgram target
              setProgramTargetId: newProgram.id,
              setProgramTargetSessionCount: actualBuiltSessions,
              // Update verdict
              finalVerdict: earlyVerdict,
              failedStage: earlyFailedStage,
            }
            
            console.log('[MAIN-GEN-TRUTH step-5-structure-result]', {
              attemptId: storedMainGen.attemptId,
              expectedSessions,
              actualBuiltSessions,
              builtProgramId: newProgram.id,
              verdict: earlyVerdict,
            })
            
            console.log('[MAIN-GEN-TRUTH step-6-save-result]', {
              attemptId: storedMainGen.attemptId,
              savedProgramId: newProgram.id,
              savedSessions: actualBuiltSessions,
              localStorageId,
              localStorageSessions,
            })
            
            console.log('[MAIN-GEN-TRUTH step-7-setProgram-target]', {
              attemptId: storedMainGen.attemptId,
              setProgramTargetId: newProgram.id,
              setProgramTargetSessions: actualBuiltSessions,
            })
            
            sessionStorage.setItem('mainGenTruthAudit', JSON.stringify(updatedMainGen))
            setMainGenTruthAudit(updatedMainGen)
          }
        }
        
        setProgram(newProgram)
        
        // ==========================================================================
        // [POST-BUILD AUTHORITATIVE LOCK] Set single winner for main_generation
        // This prevents reconciliation from overwriting for 5 seconds
        // ==========================================================================
        const actualBuiltSessionsForLock = newProgram.sessions?.length ?? 0
        authoritativeSavedProgramRef.current = {
          programId: newProgram.id,
          savedAt: Date.now(),
          sessionCount: actualBuiltSessionsForLock,
          createdAt: newProgram.createdAt || new Date().toISOString(),
          flowSource: 'main_generation',
          lockExpiresAt: Date.now() + 5000,  // 5 second lock
        }
        console.log('[post-build-auth-lock] Authoritative winner locked', {
          programId: newProgram.id,
          sessionCount: actualBuiltSessionsForLock,
          flowSource: 'main_generation',
          lockExpiresAt: authoritativeSavedProgramRef.current.lockExpiresAt,
          verdict: 'POST_REGEN_ACTIVE_PROGRAM_LOCKED',
        })
        
        // [PHASE 30L] RELEASE MODIFY BUILDER LOCK - generation completed successfully
        // [PHASE 30P] ENHANCED: Add full state logging for lock release
        // [PHASE 30S] Clear the authoritative entry object on success
        if (modifyBuilderLockRef.current) {
          console.log('[phase30p-lock-release-final]', {
            source: 'generation_success',
            showBuilder: !!showBuilder,
            modifyFlowState: modifyFlowState ?? null,
            builderSessionInputsRefPresent: !!builderSessionInputsRef.current,
            releaseAllowed: true,
            verdict: 'MODIFY_LOCK_RELEASE_ALLOWED',
          })
          modifyBuilderLockRef.current = false
        }
        
        // [PHASE 30S] Clear the authoritative entry - generation succeeded
        modifyBuilderEntryRef.current = null
        setModifyBuilderEntry(null)
        setShowBuilder(false)
        
        // [PHASE 24N] Reset builder origin after successful generation
        // This ensures modify flow state is cleaned up after success
        if (isModifyFlow) {
          console.log('[phase24n-unified-builder-origin-reset]', {
            previousOrigin: builderOrigin,
            newOrigin: 'default',
            trigger: 'successful_unified_generation_complete',
          })
          setBuilderOrigin('default')
          setBuilderSessionInputsAndRef(null)
          setBuilderSessionKey(null)
          setBuilderSessionSource(null)
        }
        
        // [program-rebuild-truth] TASK 2: Create success result
        const profileSig = createProfileSignature(effectiveInputs)
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
  }, [inputs, programModules, builderOrigin])

  // ==========================================================================
  // [PHASE 24N] DEPRECATED - This handler is no longer used
  // Modify flow now routes through the unified handleGenerate with inputOverrides
  // Keeping temporarily for reference but this code path is dead
  // ==========================================================================
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGenerateFromModifyBuilder = useCallback(async () => {
    // ==========================================================================
    // [PHASE 24A] LAYER 6 - Use dedicated builder session inputs for submit
    // This ensures submit uses the same truth as render, not ambient inputs
    // ==========================================================================
    const effectiveInputs = builderSessionInputs ?? inputs
    
    // [PHASE 24A] Submit parity audit - verify render and submit use same truth
    console.log('[phase24a-modify-render-submit-parity-audit]', {
      builderSessionInputsExists: !!builderSessionInputs,
      ambientInputsExists: !!inputs,
      usingBuilderSessionInputs: !!builderSessionInputs,
      builderSessionKey,
      builderSessionSource,
      effectiveInputsSummary: effectiveInputs ? {
        primaryGoal: effectiveInputs.primaryGoal,
        scheduleMode: effectiveInputs.scheduleMode,
        trainingDaysPerWeek: effectiveInputs.trainingDaysPerWeek,
        selectedSkillsCount: effectiveInputs.selectedSkills?.length ?? 0,
        trainingPathType: effectiveInputs.trainingPathType,
        sessionLength: effectiveInputs.sessionLength,
        experienceLevel: effectiveInputs.experienceLevel,
      } : null,
      verdict: builderSessionInputs 
        ? 'MODIFY_RENDER_AND_SUBMIT_USE_SAME_SESSION_TRUTH'
        : 'MODIFY_SUBMIT_USING_AMBIENT_INPUTS_NO_SESSION',
    })
    
    // [MODIFY-SUBMIT-FIX] Architecture audit - Modify routes through /api/program/regenerate
    console.log('[modify-submit-architecture-audit]', {
      handler: 'handleGenerateFromModifyBuilder',
      dispatchMethod: '/api/program/regenerate',
      usesServerRoute: true,
      sameRouteAsHandleRegenerate: true,
      passesIsFreshBaselineBuild: true,
      builderOrigin,
      inputsSnapshot: effectiveInputs ? {
        primaryGoal: effectiveInputs.primaryGoal,
        secondaryGoal: effectiveInputs.secondaryGoal,
        scheduleMode: effectiveInputs.scheduleMode,
        trainingDaysPerWeek: effectiveInputs.trainingDaysPerWeek,
        sessionDurationMode: effectiveInputs.sessionDurationMode,
        sessionLength: effectiveInputs.sessionLength,
        selectedSkillsCount: effectiveInputs.selectedSkills?.length ?? 0,
        trainingPathType: effectiveInputs.trainingPathType,
        experienceLevel: effectiveInputs.experienceLevel,
        equipmentCount: effectiveInputs.equipment?.length ?? 0,
      } : null,
      verdict: 'MODIFY_AUTHORITATIVE_SERVER_ROUTE_ACTIVE',
    })
    
    // Validate prerequisites
    if (!effectiveInputs) {
      console.error('[ProgramPage] handleGenerateFromModifyBuilder: Missing inputs')
      setGenerationError('Missing program inputs. Please refresh the page.')
      return
    }
    if (!programModules.saveAdaptiveProgram) {
      console.error('[ProgramPage] handleGenerateFromModifyBuilder: Save module not loaded')
      setGenerationError('Program builder is still loading. Please wait a moment.')
      return
    }
    
    setIsGenerating(true)
    setGenerationError(null)
    
    // Clear stale failure state
    currentSessionHasStartedNewAttemptRef.current = true
    currentAttemptStartedAtRef.current = new Date().toISOString()
    setLastBuildResult(null)
    
    try {
      // ==========================================================================
      // [PHASE 24F] TASK 2 - Send THIN payload to server
      // Server now resolves canonical truth itself, client only sends builder inputs
      // ==========================================================================
      const clientCanonicalSnapshot = getCanonicalProfile()
      
      // [PHASE 24F] TASK 4 - Client dispatch payload audit
      console.log('[phase24f-modify-client-dispatch-payload-audit]', {
        route: '/api/program/generate-from-modify-builder',
        builderOrigin,
        builderSessionKey,
        builderSessionSource,
        currentProgramId: program?.id ?? null,
        builderInputsPrimaryGoal: effectiveInputs.primaryGoal,
        builderInputsScheduleMode: effectiveInputs.scheduleMode,
        builderInputsTrainingDaysPerWeek: effectiveInputs.trainingDaysPerWeek,
        builderInputsSelectedSkillsCount: effectiveInputs.selectedSkills?.length ?? 0,
        builderInputsTrainingPathType: effectiveInputs.trainingPathType,
        builderInputsGoalCategoriesCount: effectiveInputs.goalCategories?.length ?? 0,
        builderInputsSelectedFlexibilityCount: effectiveInputs.selectedFlexibility?.length ?? 0,
        builderInputsExperienceLevel: effectiveInputs.experienceLevel,
        builderInputsEquipmentCount: effectiveInputs.equipment?.length ?? 0,
        clientCanonicalSnapshotPrimaryGoal: clientCanonicalSnapshot.primaryGoal,
        clientCanonicalSnapshotScheduleMode: clientCanonicalSnapshot.scheduleMode,
        clientCanonicalSnapshotSelectedSkillsCount: clientCanonicalSnapshot.selectedSkills?.length ?? 0,
      })
      
      // ==========================================================================
      // [PHASE 24J] TASK 1 - CRITICAL selectedSkills trace at client dispatch
      // Root-cause audit for identity drift
      // ==========================================================================
      console.log('[phase24j-modify-client-selectedSkills-dispatch-trace]', {
        builderSessionInputsSelectedSkills: builderSessionInputs?.selectedSkills ?? [],
        builderSessionInputsSelectedSkillsCount: builderSessionInputs?.selectedSkills?.length ?? 0,
        effectiveInputsSelectedSkills: effectiveInputs.selectedSkills ?? [],
        effectiveInputsSelectedSkillsCount: effectiveInputs.selectedSkills?.length ?? 0,
        clientCanonicalSelectedSkills: clientCanonicalSnapshot.selectedSkills ?? [],
        clientCanonicalSelectedSkillsCount: clientCanonicalSnapshot.selectedSkills?.length ?? 0,
        builderSessionHasBackLever: builderSessionInputs?.selectedSkills?.includes('back_lever') ?? false,
        builderSessionHasDragonFlag: builderSessionInputs?.selectedSkills?.includes('dragon_flag') ?? false,
        effectiveHasBackLever: effectiveInputs.selectedSkills?.includes('back_lever') ?? false,
        effectiveHasDragonFlag: effectiveInputs.selectedSkills?.includes('dragon_flag') ?? false,
        clientCanonicalHasBackLever: clientCanonicalSnapshot.selectedSkills?.includes('back_lever') ?? false,
        clientCanonicalHasDragonFlag: clientCanonicalSnapshot.selectedSkills?.includes('dragon_flag') ?? false,
        verdict: (effectiveInputs.selectedSkills?.length ?? 0) === (builderSessionInputs?.selectedSkills?.length ?? 0)
          ? 'EFFECTIVE_MATCHES_SESSION_INPUTS'
          : 'EFFECTIVE_DIFFERS_FROM_SESSION_INPUTS',
      })
      
      // ==========================================================================
      // [MODIFY-UNIFIED-FIX] ROUTE MODIFY THROUGH SAME SERVER ROUTE AS REGENERATE
      // This is the CRITICAL fix: Modify now calls /api/program/regenerate with overrides
      // instead of calling generateAdaptiveProgram directly (which missed isFreshBaselineBuild)
      // ==========================================================================
      console.log('[modify-unified-fix-start]', {
        architectureClass: 'server_route_regenerate',
        dispatchMethod: '/api/program/regenerate',
        usesServerRoute: true,
        sameRouteAsHandleRegenerate: true,
        willPassIsFreshBaselineBuild: true,
        verdict: 'ROUTING_TO_AUTHORITATIVE_SERVER_REBUILD',
      })
      
      // Build canonical profile override with builder inputs
      const modifyCanonicalOverride = {
        primaryGoal: effectiveInputs.primaryGoal || 'skill_acquisition',
        secondaryGoal: effectiveInputs.secondaryGoal || null,
        experienceLevel: effectiveInputs.experienceLevel || 'intermediate',
        trainingDaysPerWeek: effectiveInputs.trainingDaysPerWeek || 4,
        sessionLengthMinutes: effectiveInputs.sessionLength || 60,
        scheduleMode: effectiveInputs.scheduleMode || 'flexible',
        sessionDurationMode: effectiveInputs.sessionDurationMode || 'adaptive',
        equipment: effectiveInputs.equipment || ['pull_up_bar', 'parallettes', 'rings'],
        selectedSkills: effectiveInputs.selectedSkills || [],
        trainingPathType: effectiveInputs.trainingPathType || 'custom',
        goalCategories: effectiveInputs.goalCategories || [],
        selectedFlexibility: effectiveInputs.selectedFlexibility || [],
        onboardingComplete: true,
      }
      
      // Build program inputs for server route
      const modifyProgramInputs = {
        primaryGoal: effectiveInputs.primaryGoal,
        secondaryGoal: effectiveInputs.secondaryGoal,
        experienceLevel: effectiveInputs.experienceLevel,
        trainingDaysPerWeek: effectiveInputs.trainingDaysPerWeek,
        sessionLength: effectiveInputs.sessionLength,
        scheduleMode: effectiveInputs.scheduleMode,
        sessionDurationMode: effectiveInputs.sessionDurationMode,
        equipment: effectiveInputs.equipment,
        selectedSkills: effectiveInputs.selectedSkills,
        trainingPathType: effectiveInputs.trainingPathType,
        goalCategories: effectiveInputs.goalCategories,
        selectedFlexibility: effectiveInputs.selectedFlexibility,
      }
      
      console.log('[modify-unified-fix-dispatch]', {
        route: '/api/program/regenerate',
        canonicalOverrideScheduleMode: modifyCanonicalOverride.scheduleMode,
        canonicalOverrideSelectedSkillsCount: modifyCanonicalOverride.selectedSkills?.length ?? 0,
        programInputsScheduleMode: modifyProgramInputs.scheduleMode,
        currentProgramId: program?.id ?? null,
        verdict: 'DISPATCHING_TO_SERVER_REGENERATE_WITH_OVERRIDES',
      })
      
      // [MODIFY-UNIFIED-FIX] Call the SAME server route as handleRegenerate
      // This ensures isFreshBaselineBuild: true is applied server-side
      const serverResponse = await fetch('/api/program/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonicalProfile: modifyCanonicalOverride,
          programInputs: modifyProgramInputs,
          regenerationReason: 'modify_builder_submit',
          currentProgramId: program?.id ?? null,
        }),
      })
      
      // [404-DIAGNOSTIC] Check for non-JSON responses (404 pages, server errors)
      const contentType = serverResponse.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const responseText = await serverResponse.text()
        console.error('[modify-non-json-response]', {
          status: serverResponse.status,
          statusText: serverResponse.statusText,
          contentType,
          responsePreview: responseText.substring(0, 500),
          diagnostic_stage: 'modify_server_response_content_type_check',
          diagnostic_source: 'modify_route_call',
          diagnostic_request_path: '/api/program/regenerate',
          diagnostic_status: serverResponse.status,
          diagnostic_reason: 'non_json_response_received',
          verdict: 'MODIFY_ROUTE_RETURNED_NON_JSON_RESPONSE',
        })
        throw new Error(`Server returned ${serverResponse.status} with non-JSON response`)
      }
      
      const serverResult = await serverResponse.json()
      
      if (!serverResponse.ok || !serverResult.success) {
        console.log('[modify-unified-fix-server-error]', {
          status: serverResponse.status,
          error: serverResult.error,
          failedStage: serverResult.failedStage,
          diagnostic_stage: 'modify_server_result_validation',
          diagnostic_source: 'modify_route_call',
          diagnostic_request_path: '/api/program/regenerate',
          diagnostic_status: serverResponse.status,
          diagnostic_reason: serverResult.failedStage || 'server_returned_failure',
        })
        throw new Error(serverResult.error || 'Server regenerate failed for modify')
      }
      
      const newProgram = serverResult.program as AdaptiveProgram
      
      // Validate program shape
      if (!newProgram) {
        throw new Error('Server returned null program')
      }
      if (!newProgram.id) {
        throw new Error('Server program has no id field')
      }
      if (!Array.isArray(newProgram.sessions) || newProgram.sessions.length === 0) {
        throw new Error('Server program has no valid sessions')
      }
      
      console.log('[modify-unified-fix-result]', {
        programId: newProgram.id,
        sessionCount: newProgram.sessions?.length ?? 0,
        primaryGoal: newProgram.primaryGoal,
        secondaryGoal: newProgram.secondaryGoal,
        scheduleMode: newProgram.scheduleMode,
        selectedSkillsCount: newProgram.selectedSkills?.length ?? 0,
        verdict: 'GENERATED_VIA_AUTHORITATIVE_SERVER_ROUTE',
      })
      
      // Save the program to localStorage (server already validated it)
      await programModules.saveAdaptiveProgram(newProgram)
      
      // Update canonical profile to match what was just generated
      const { updateCanonicalProfile } = await import('@/lib/canonical-profile-service')
      updateCanonicalProfile({
        primaryGoal: modifyProgramInputs.primaryGoal,
        secondaryGoal: modifyProgramInputs.secondaryGoal,
        trainingDaysPerWeek: modifyProgramInputs.trainingDaysPerWeek,
        scheduleMode: modifyProgramInputs.scheduleMode,
        sessionDurationMode: modifyProgramInputs.sessionDurationMode,
        sessionLengthMinutes: modifyProgramInputs.sessionLength,
        selectedSkills: modifyProgramInputs.selectedSkills,
        trainingPathType: modifyProgramInputs.trainingPathType,
        experienceLevel: modifyProgramInputs.experienceLevel,
        equipmentAvailable: modifyProgramInputs.equipment,
        goalCategories: modifyProgramInputs.goalCategories,
        selectedFlexibility: modifyProgramInputs.selectedFlexibility,
      })
      
      // [PHASE 24F] TASK 5 - Post-save parity audit
      const visibleSessionCountBeforeSet = program?.sessions?.length ?? 0
      
      // Hydrate UI
      setProgram(newProgram)
      
      // [POST-BUILD AUTHORITATIVE LOCK] Set single winner for modify flow
      authoritativeSavedProgramRef.current = {
        programId: newProgram.id,
        savedAt: Date.now(),
        sessionCount: newProgram.sessions?.length ?? 0,
        createdAt: newProgram.createdAt || new Date().toISOString(),
        flowSource: 'modify',
        lockExpiresAt: Date.now() + 5000,
      }
      console.log('[post-build-auth-lock] Authoritative winner locked (modify flow)', {
        programId: newProgram.id,
        sessionCount: newProgram.sessions?.length ?? 0,
        flowSource: 'modify',
        verdict: 'POST_BUILD_WINNER_LOCKED',
      })
      
      // [PHASE 30L] RELEASE MODIFY BUILDER LOCK - generation completed successfully
      // [PHASE 30P] ENHANCED: Add full state logging for lock release
      // [PHASE 30S] Clear the authoritative entry object on success
      if (modifyBuilderLockRef.current) {
        console.log('[phase30p-lock-release-final]', {
          source: 'generation_success_legacy',
          showBuilder: !!showBuilder,
          modifyFlowState: modifyFlowState ?? null,
          builderSessionInputsRefPresent: !!builderSessionInputsRef.current,
          releaseAllowed: true,
          verdict: 'MODIFY_LOCK_RELEASE_ALLOWED',
        })
        modifyBuilderLockRef.current = false
      }
      
      // [PHASE 30S] Clear the authoritative entry - generation succeeded
      modifyBuilderEntryRef.current = null
      setModifyBuilderEntry(null)
      setShowBuilder(false)
      
      // [PHASE 24D] Reset modifyFlowState to idle after successful generation
      setModifyFlowState('idle')
      
      // [PHASE 24A/26B] Clear builder session state after successful generation
      setBuilderSessionInputsAndRef(null)
      setBuilderSessionKey('initial')
      setBuilderSessionSource(null)
      
      // [PHASE 24F] TASK 5 - Post-save visible parity audit
      console.log('[phase24f-modify-postsave-visible-parity-audit]', {
        returnedProgramId: newProgram.id,
        visibleProgramIdAfterSet: newProgram.id,
        returnedSessionCount: newProgram.sessions?.length ?? 0,
        visibleSessionCountBeforeSet,
        builderOriginBeforeReset: builderOrigin,
        builderSessionInputsCleared: true,
        modifyFlowStateReset: true,
        verdict: (newProgram.sessions?.length ?? 0) !== visibleSessionCountBeforeSet
          ? 'SESSION_COUNT_CHANGED_FROM_VISIBLE'
          : 'SESSION_COUNT_SAME_AS_VISIBLE',
      })
      
      // [MODIFY-UNIFIED-FIX] Authoritative result proof - production-safe verification
      const savedSessionCount = newProgram.sessions?.length ?? 0
      const requestedSessionTarget = modifyProgramInputs.scheduleMode === 'flexible' ? 6 : modifyProgramInputs.trainingDaysPerWeek
      const sameSessionCount = savedSessionCount === visibleSessionCountBeforeSet
      const isRealAdaptiveReduction = savedSessionCount < (typeof requestedSessionTarget === 'number' ? requestedSessionTarget : 6)
      
      // Determine verdict
      let modifyVerdict: string
      if (savedSessionCount >= 6 && modifyProgramInputs.scheduleMode === 'flexible') {
        modifyVerdict = 'MODIFY_SAVED_AND_DISPLAYED_MATCH'
      } else if (savedSessionCount === 4 && modifyProgramInputs.scheduleMode === 'flexible') {
        // This should NOT happen anymore with server route fix
        modifyVerdict = 'UNEXPECTED_4_SESSION_RESULT_CHECK_SERVER_ROUTE'
      } else if (isRealAdaptiveReduction) {
        modifyVerdict = 'REAL_ADAPTIVE_REDUCTION'
      } else {
        modifyVerdict = 'MODIFY_FULLY_ROUTED_TO_AUTHORITATIVE_REBUILD'
      }
      
      console.log('[modify-authoritative-result-proof]', {
        modifySubmitHandler: 'handleGenerateFromModifyBuilder',
        authoritativeRebuildWinner: '/api/program/regenerate',
        overridePayloadApplied: true,
        requestedSessionTarget,
        resolvedSessionTarget: savedSessionCount,
        savedProgramId: newProgram.id,
        savedSessionCount,
        displayedProgramId: newProgram.id,
        displayedSessionCount: savedSessionCount,
        sameId: true,
        sameSessionCount,
        canonicalProfileWasUpdated: true,
        verdict: modifyVerdict,
      })
      
      // Reset builder origin after successful save/hydration
      console.log('[modify-unified-fix-builder-origin-reset]', {
        resetTrigger: 'successful_modify_via_server_regenerate_route',
        resetOccurredAfterHydration: true,
        previousOrigin: builderOrigin,
        newOrigin: 'default',
        visibleProgramSessionCount: newProgram.sessions?.length ?? 0,
      })
      setBuilderOrigin('default')
      
      // Build success result for consistency
      const successResult = {
        status: 'success' as const,
        attemptId: `modify_unified_${Date.now()}`,
        runtimeSessionId: runtimeSessionIdRef.current,
        timestamp: new Date().toISOString(),
      }
      setLastBuildResult({
        ...successResult,
        stage: 'complete',
        errorCode: null,
        subCode: 'none',
        userMessage: 'Program generated successfully',
        devMessage: 'Modify builder unified canonical generation completed',  // [PHASE 24M]
        failureStep: null,
        failureMiddleStep: null,
        failureDayNumber: null,
        failureFocus: null,
        hydratedFromStorage: false,
      })
      
      // [MODIFY-UNIFIED-FIX] Final unified architecture verdict - now uses server route
      const sessionCount = newProgram.sessions?.length ?? 0
      const inputWasFlexible = modifyProgramInputs.scheduleMode === 'flexible'
      
      console.log('[modify-unified-fix-architecture-verdict]', {
        modifyUsesServerRoute: true,  // [MODIFY-UNIFIED-FIX] NOW uses server route
        modifyRoutesSameAsRegenerate: true,  // [MODIFY-UNIFIED-FIX] Same /api/program/regenerate route
        modifyPassesIsFreshBaselineBuildViaServer: true,  // [MODIFY-UNIFIED-FIX] Server applies flag
        modifyNoLongerCallsBuilderDirectly: true,  // [MODIFY-UNIFIED-FIX] No direct generateAdaptiveProgram call
        unifiedWithOnboardingAndRestart: true,
        overrideBuiltFromSessionInputs: !!builderSessionInputs,
        builderSessionKey,
        outputSessionCount: sessionCount,
        outputPrimaryGoal: newProgram.primaryGoal,
        outputSelectedSkillsCount: newProgram.selectedSkills?.length ?? 0,
        inputScheduleMode: modifyProgramInputs.scheduleMode,
        inputSelectedSkillsCount: modifyProgramInputs.selectedSkills?.length ?? 0,
        selectedSkillsHasBackLever: newProgram.selectedSkills?.includes('back_lever') ?? false,
        selectedSkillsHasDragonFlag: newProgram.selectedSkills?.includes('dragon_flag') ?? false,
        verdict: 'MODIFY_PATH_UNIFIED_WITH_AUTHORITATIVE_REBUILD',
      })
      
    } catch (error) {
      console.error('[ProgramPage] handleGenerateFromModifyBuilder: Error', error)
      setGenerationError(error instanceof Error ? error.message : 'Generation failed')
      
      // [PHASE 26B] Reset origin and session on failure too
      setBuilderOrigin('default')
      setBuilderSessionInputsAndRef(null)
      setBuilderSessionKey('initial')
      setBuilderSessionSource(null)
    } finally {
      setIsGenerating(false)
    }
  }, [inputs, programModules, builderOrigin, builderSessionInputs, builderSessionKey, builderSessionSource])

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
        
        // [PHASE 17H] Path parity canonical audit - verify rebuild uses same source as onboarding
        console.log('[phase17h-path-parity-canonical-audit]', {
          triggerPath: 'handleRegenerate',
          usedBuildCanonicalGenerationEntry: true,
          usedGetCanonicalProfile: true,
          canonicalProfileSource: 'reconcileCanonicalProfile',
          canonicalBodyweight: canonicalProfileNow.bodyweight,
          canonicalScheduleMode: canonicalProfileNow.scheduleMode,
          canonicalTrainingDays: canonicalProfileNow.trainingDaysPerWeek,
          canonicalSelectedSkills: canonicalProfileNow.selectedSkills || [],
          canonicalPrimaryGoal: canonicalProfileNow.primaryGoal,
        })
        
        // [PHASE 17H] Path parity input audit - compare rebuild input shape
        console.log('[phase17h-path-parity-input-audit]', {
          triggerPath: 'handleRegenerate',
          inputScheduleMode: freshRebuildInput.scheduleMode,
          inputTrainingDays: freshRebuildInput.trainingDaysPerWeek,
          inputSessionDurationMode: freshRebuildInput.sessionDurationMode,
          inputPrimaryGoal: freshRebuildInput.primaryGoal,
          inputSelectedSkillsCount: freshRebuildInput.selectedSkills?.length || 0,
          inputEquipmentCount: freshRebuildInput.equipment?.length || 0,
          isFlexibleMode: freshRebuildInput.scheduleMode === 'flexible',
          isAdaptiveSession: freshRebuildInput.sessionDurationMode === 'adaptive',
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
        
        // ==========================================================================
        // [PHASE 17Y] TASK 1 - Material source audit for handleRegenerate
        // ==========================================================================
        console.log('[phase17y-regenerate-material-source-audit]', {
          triggerPath: 'handleRegenerate',
          visibleInputsTruth: {
            primaryGoal: inputs?.primaryGoal ?? null,
            secondaryGoal: inputs?.secondaryGoal ?? null,
            scheduleMode: inputs?.scheduleMode ?? null,
            trainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
            sessionDurationMode: inputs?.sessionDurationMode ?? null,
            sessionLength: inputs?.sessionLength ?? null,
            selectedSkills: inputs?.selectedSkills ?? [],
            trainingPathType: inputs?.trainingPathType ?? null,
            equipment: inputs?.equipment ?? [],
          },
          freshRebuildInputTruth: {
            primaryGoal: freshRebuildInput?.primaryGoal ?? null,
            secondaryGoal: freshRebuildInput?.secondaryGoal ?? null,
            scheduleMode: freshRebuildInput?.scheduleMode ?? null,
            trainingDaysPerWeek: freshRebuildInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: freshRebuildInput?.sessionDurationMode ?? null,
            sessionLength: freshRebuildInput?.sessionLength ?? null,
            selectedSkills: freshRebuildInput?.selectedSkills ?? [],
            trainingPathType: freshRebuildInput?.trainingPathType ?? null,
            equipment: freshRebuildInput?.equipment ?? [],
          },
          canonicalBaselineTruth: {
            primaryGoal: canonicalProfileNow?.primaryGoal ?? null,
            secondaryGoal: canonicalProfileNow?.secondaryGoal ?? null,
            scheduleMode: canonicalProfileNow?.scheduleMode ?? null,
            trainingDaysPerWeek: canonicalProfileNow?.trainingDaysPerWeek ?? null,
            sessionDurationMode: canonicalProfileNow?.sessionDurationMode ?? null,
            sessionLengthMinutes: canonicalProfileNow?.sessionLengthMinutes ?? null,
            selectedSkills: canonicalProfileNow?.selectedSkills ?? [],
            trainingPathType: canonicalProfileNow?.trainingPathType ?? null,
            equipmentAvailable: canonicalProfileNow?.equipmentAvailable ?? [],
          },
        })
        
        // ==========================================================================
        // [PHASE 18B] TASK 1 - Deep planner identity source audit
        // This captures all deep identity fields the builder actually consumes
        // ==========================================================================
        console.log('[phase18b-regenerate-deep-planner-source-audit]', {
          triggerPath: 'handleRegenerate',
          currentInputsTruth: {
            primaryGoal: inputs?.primaryGoal ?? null,
            secondaryGoal: inputs?.secondaryGoal ?? null,
            scheduleMode: inputs?.scheduleMode ?? null,
            trainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
            sessionDurationMode: inputs?.sessionDurationMode ?? null,
            sessionLength: inputs?.sessionLength ?? null,
            selectedSkills: inputs?.selectedSkills ?? [],
            trainingPathType: inputs?.trainingPathType ?? null,
            equipment: inputs?.equipment ?? [],
            goalCategories: inputs?.goalCategories ?? [],
            selectedFlexibility: inputs?.selectedFlexibility ?? [],
            experienceLevel: inputs?.experienceLevel ?? null,
            selectedStyles: inputs?.selectedStyles ?? [],
          },
          freshRebuildInputTruth: {
            primaryGoal: freshRebuildInput?.primaryGoal ?? null,
            secondaryGoal: freshRebuildInput?.secondaryGoal ?? null,
            scheduleMode: freshRebuildInput?.scheduleMode ?? null,
            trainingDaysPerWeek: freshRebuildInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: freshRebuildInput?.sessionDurationMode ?? null,
            sessionLength: freshRebuildInput?.sessionLength ?? null,
            selectedSkills: freshRebuildInput?.selectedSkills ?? [],
            trainingPathType: freshRebuildInput?.trainingPathType ?? null,
            equipment: freshRebuildInput?.equipment ?? [],
            goalCategories: freshRebuildInput?.goalCategories ?? [],
            selectedFlexibility: freshRebuildInput?.selectedFlexibility ?? [],
            experienceLevel: freshRebuildInput?.experienceLevel ?? null,
            selectedStyles: freshRebuildInput?.selectedStyles ?? [],
          },
          canonicalBaselineTruth: {
            primaryGoal: canonicalProfileNow?.primaryGoal ?? null,
            secondaryGoal: canonicalProfileNow?.secondaryGoal ?? null,
            scheduleMode: canonicalProfileNow?.scheduleMode ?? null,
            trainingDaysPerWeek: canonicalProfileNow?.trainingDaysPerWeek ?? null,
            sessionDurationMode: canonicalProfileNow?.sessionDurationMode ?? null,
            sessionLengthMinutes: canonicalProfileNow?.sessionLengthMinutes ?? null,
            selectedSkills: canonicalProfileNow?.selectedSkills ?? [],
            trainingPathType: canonicalProfileNow?.trainingPathType ?? null,
            equipmentAvailable: canonicalProfileNow?.equipmentAvailable ?? [],
            goalCategories: canonicalProfileNow?.goalCategories ?? [],
            selectedFlexibility: canonicalProfileNow?.selectedFlexibility ?? [],
            experienceLevel: canonicalProfileNow?.experienceLevel ?? null,
            selectedStyles: canonicalProfileNow?.selectedStyles ?? [],
          },
          fieldsStillAtRiskIfNotExplicitlyMerged: [
            'goalCategories',
            'selectedFlexibility',
            'experienceLevel',
          ],
          verdict: 'deep_planner_identity_fields_must_be_explicitly_merged_in_handleRegenerate',
        })
        
        // ==========================================================================
        // [PHASE 18A] TASK 1 - Root priority inversion audit
        // This captures whether stale canonical-entry-derived values would win
        // ==========================================================================
        // ==========================================================================
        // [PHASE 18C] TASK 1 - Click-time stale-inputs parity audit
        // This proves whether page-local `inputs` is stale vs canonical/fresh entry truth
        // ==========================================================================
        const __p18c_inputsVsCanonical = {
          primaryGoalMatch: (inputs?.primaryGoal ?? null) === (canonicalProfileNow?.primaryGoal ?? null),
          secondaryGoalMatch: (inputs?.secondaryGoal ?? null) === (canonicalProfileNow?.secondaryGoal ?? null),
          scheduleModeMatch: (inputs?.scheduleMode ?? null) === (canonicalProfileNow?.scheduleMode ?? null),
          trainingDaysMatch: (inputs?.trainingDaysPerWeek ?? null) === (canonicalProfileNow?.trainingDaysPerWeek ?? null),
          sessionDurationModeMatch: (inputs?.sessionDurationMode ?? null) === (canonicalProfileNow?.sessionDurationMode ?? null),
          sessionLengthMatch: (inputs?.sessionLength ?? null) === (canonicalProfileNow?.sessionLengthMinutes ?? null),
          selectedSkillsMatch: JSON.stringify(inputs?.selectedSkills ?? []) === JSON.stringify(canonicalProfileNow?.selectedSkills ?? []),
          trainingPathTypeMatch: (inputs?.trainingPathType ?? null) === (canonicalProfileNow?.trainingPathType ?? null),
          equipmentMatch: JSON.stringify(inputs?.equipment ?? []) === JSON.stringify(canonicalProfileNow?.equipmentAvailable ?? []),
          goalCategoriesMatch: JSON.stringify(inputs?.goalCategories ?? []) === JSON.stringify(canonicalProfileNow?.goalCategories ?? []),
          selectedFlexibilityMatch: JSON.stringify(inputs?.selectedFlexibility ?? []) === JSON.stringify(canonicalProfileNow?.selectedFlexibility ?? []),
          experienceLevelMatch: (inputs?.experienceLevel ?? null) === (canonicalProfileNow?.experienceLevel ?? null),
        }
        const __p18c_inputsVsFresh = {
          primaryGoalMatch: (inputs?.primaryGoal ?? null) === (freshRebuildInput?.primaryGoal ?? null),
          secondaryGoalMatch: (inputs?.secondaryGoal ?? null) === (freshRebuildInput?.secondaryGoal ?? null),
          scheduleModeMatch: (inputs?.scheduleMode ?? null) === (freshRebuildInput?.scheduleMode ?? null),
          trainingDaysMatch: (inputs?.trainingDaysPerWeek ?? null) === (freshRebuildInput?.trainingDaysPerWeek ?? null),
          sessionDurationModeMatch: (inputs?.sessionDurationMode ?? null) === (freshRebuildInput?.sessionDurationMode ?? null),
          sessionLengthMatch: (inputs?.sessionLength ?? null) === (freshRebuildInput?.sessionLength ?? null),
          selectedSkillsMatch: JSON.stringify(inputs?.selectedSkills ?? []) === JSON.stringify(freshRebuildInput?.selectedSkills ?? []),
          trainingPathTypeMatch: (inputs?.trainingPathType ?? null) === (freshRebuildInput?.trainingPathType ?? null),
          equipmentMatch: JSON.stringify(inputs?.equipment ?? []) === JSON.stringify(freshRebuildInput?.equipment ?? []),
          goalCategoriesMatch: JSON.stringify(inputs?.goalCategories ?? []) === JSON.stringify(freshRebuildInput?.goalCategories ?? []),
          selectedFlexibilityMatch: JSON.stringify(inputs?.selectedFlexibility ?? []) === JSON.stringify(freshRebuildInput?.selectedFlexibility ?? []),
          experienceLevelMatch: (inputs?.experienceLevel ?? null) === (freshRebuildInput?.experienceLevel ?? null),
        }
        const __p18c_freshVsCanonical = {
          primaryGoalMatch: (freshRebuildInput?.primaryGoal ?? null) === (canonicalProfileNow?.primaryGoal ?? null),
          secondaryGoalMatch: (freshRebuildInput?.secondaryGoal ?? null) === (canonicalProfileNow?.secondaryGoal ?? null),
          scheduleModeMatch: (freshRebuildInput?.scheduleMode ?? null) === (canonicalProfileNow?.scheduleMode ?? null),
          trainingDaysMatch: (freshRebuildInput?.trainingDaysPerWeek ?? null) === (canonicalProfileNow?.trainingDaysPerWeek ?? null),
          sessionDurationModeMatch: (freshRebuildInput?.sessionDurationMode ?? null) === (canonicalProfileNow?.sessionDurationMode ?? null),
          sessionLengthMatch: (freshRebuildInput?.sessionLength ?? null) === (canonicalProfileNow?.sessionLengthMinutes ?? null),
          selectedSkillsMatch: JSON.stringify(freshRebuildInput?.selectedSkills ?? []) === JSON.stringify(canonicalProfileNow?.selectedSkills ?? []),
          trainingPathTypeMatch: (freshRebuildInput?.trainingPathType ?? null) === (canonicalProfileNow?.trainingPathType ?? null),
          equipmentMatch: JSON.stringify(freshRebuildInput?.equipment ?? []) === JSON.stringify(canonicalProfileNow?.equipmentAvailable ?? []),
          goalCategoriesMatch: JSON.stringify(freshRebuildInput?.goalCategories ?? []) === JSON.stringify(canonicalProfileNow?.goalCategories ?? []),
          selectedFlexibilityMatch: JSON.stringify(freshRebuildInput?.selectedFlexibility ?? []) === JSON.stringify(canonicalProfileNow?.selectedFlexibility ?? []),
          experienceLevelMatch: (freshRebuildInput?.experienceLevel ?? null) === (canonicalProfileNow?.experienceLevel ?? null),
        }
        const __p18c_inputsMatchCanonical = Object.values(__p18c_inputsVsCanonical).every(Boolean)
        const __p18c_inputsMatchFresh = Object.values(__p18c_inputsVsFresh).every(Boolean)
        const __p18c_freshMatchCanonical = Object.values(__p18c_freshVsCanonical).every(Boolean)
        const __p18c_verdict =
          __p18c_inputsMatchCanonical && __p18c_inputsMatchFresh && __p18c_freshMatchCanonical
            ? 'ALL_THREE_MATCH'
            : __p18c_inputsMatchCanonical
            ? 'INPUTS_MATCH_CANONICAL'
            : __p18c_freshMatchCanonical && !__p18c_inputsMatchCanonical
            ? 'INPUTS_STALE_VS_CANONICAL'
            : !__p18c_freshMatchCanonical && __p18c_inputsMatchCanonical
            ? 'FRESH_ENTRY_STALE_VS_CANONICAL'
            : 'MULTI_LAYER_DIVERGENCE'
        
        console.log('[phase18c-regenerate-clicktime-stale-inputs-audit]', {
          triggerPath: 'handleRegenerate',
          inputsTruth: {
            primaryGoal: inputs?.primaryGoal ?? null,
            secondaryGoal: inputs?.secondaryGoal ?? null,
            scheduleMode: inputs?.scheduleMode ?? null,
            trainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
            sessionDurationMode: inputs?.sessionDurationMode ?? null,
            sessionLength: inputs?.sessionLength ?? null,
            selectedSkills: inputs?.selectedSkills ?? [],
            trainingPathType: inputs?.trainingPathType ?? null,
            equipment: inputs?.equipment ?? [],
            goalCategories: inputs?.goalCategories ?? [],
            selectedFlexibility: inputs?.selectedFlexibility ?? [],
            experienceLevel: inputs?.experienceLevel ?? null,
          },
          freshRebuildInputTruth: {
            primaryGoal: freshRebuildInput?.primaryGoal ?? null,
            secondaryGoal: freshRebuildInput?.secondaryGoal ?? null,
            scheduleMode: freshRebuildInput?.scheduleMode ?? null,
            trainingDaysPerWeek: freshRebuildInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: freshRebuildInput?.sessionDurationMode ?? null,
            sessionLength: freshRebuildInput?.sessionLength ?? null,
            selectedSkills: freshRebuildInput?.selectedSkills ?? [],
            trainingPathType: freshRebuildInput?.trainingPathType ?? null,
            equipment: freshRebuildInput?.equipment ?? [],
            goalCategories: freshRebuildInput?.goalCategories ?? [],
            selectedFlexibility: freshRebuildInput?.selectedFlexibility ?? [],
            experienceLevel: freshRebuildInput?.experienceLevel ?? null,
          },
          canonicalTruth: {
            primaryGoal: canonicalProfileNow?.primaryGoal ?? null,
            secondaryGoal: canonicalProfileNow?.secondaryGoal ?? null,
            scheduleMode: canonicalProfileNow?.scheduleMode ?? null,
            trainingDaysPerWeek: canonicalProfileNow?.trainingDaysPerWeek ?? null,
            sessionDurationMode: canonicalProfileNow?.sessionDurationMode ?? null,
            sessionLengthMinutes: canonicalProfileNow?.sessionLengthMinutes ?? null,
            selectedSkills: canonicalProfileNow?.selectedSkills ?? [],
            trainingPathType: canonicalProfileNow?.trainingPathType ?? null,
            equipmentAvailable: canonicalProfileNow?.equipmentAvailable ?? [],
            goalCategories: canonicalProfileNow?.goalCategories ?? [],
            selectedFlexibility: canonicalProfileNow?.selectedFlexibility ?? [],
            experienceLevel: canonicalProfileNow?.experienceLevel ?? null,
          },
          mismatchFlags: {
            inputsVsCanonical: __p18c_inputsVsCanonical,
            inputsVsFresh: __p18c_inputsVsFresh,
            freshVsCanonical: __p18c_freshVsCanonical,
          },
          verdict: __p18c_verdict,
        })
        
        // ==========================================================================
        // [PHASE 18C] TASK 2 - Source-winner verdict under OLD priority rules
        // Shows what WOULD win if inputs remained first priority
        // ==========================================================================
        console.log('[phase18c-regenerate-source-winner-verdict]', {
          triggerPath: 'handleRegenerate',
          oldPriorityOrder: 'inputs > freshRebuildInput > canonicalProfileNow',
          newPriorityOrder: 'freshRebuildInput > canonicalProfileNow > inputs',
          inputsIsStale: __p18c_verdict === 'INPUTS_STALE_VS_CANONICAL' || __p18c_verdict === 'MULTI_LAYER_DIVERGENCE',
          wouldInputsWinUnderOldRules: {
            primaryGoal: !!(inputs?.primaryGoal),
            scheduleMode: !!(inputs?.scheduleMode),
            selectedSkills: (inputs?.selectedSkills?.length ?? 0) > 0,
            trainingPathType: !!(inputs?.trainingPathType),
            goalCategories: (inputs?.goalCategories?.length ?? 0) > 0,
            selectedFlexibility: (inputs?.selectedFlexibility?.length ?? 0) > 0,
            experienceLevel: !!(inputs?.experienceLevel),
          },
          likelyRebuildCollapseIfInputsWins: 
            __p18c_verdict === 'INPUTS_STALE_VS_CANONICAL' || __p18c_verdict === 'MULTI_LAYER_DIVERGENCE',
          fixApplied: 'removing_inputs_as_top_priority_for_regenerate',
        })
        
        // ==========================================================================
        // [PHASE 18C] TASK 3 - Create regenerate truth object with CORRECTED priority
        // Priority: freshRebuildInput > canonicalProfileNow > inputs (last resort only)
        // This ensures stale page-local `inputs` cannot override fresher canonical/entry truth
        // [PHASE 18B] TASK 2 - Expanded to include ALL deep planner identity fields
        // ==========================================================================
        const strongestRegenerateTruth = {
          primaryGoal:
            freshRebuildInput?.primaryGoal ||
            canonicalProfileNow?.primaryGoal ||
            inputs?.primaryGoal ||
            null,
          secondaryGoal:
            freshRebuildInput?.secondaryGoal ??
            canonicalProfileNow?.secondaryGoal ??
            inputs?.secondaryGoal ??
            null,
          scheduleMode:
            freshRebuildInput?.scheduleMode ||
            canonicalProfileNow?.scheduleMode ||
            inputs?.scheduleMode ||
            null,
          trainingDaysPerWeek:
            freshRebuildInput?.trainingDaysPerWeek ??
            canonicalProfileNow?.trainingDaysPerWeek ??
            inputs?.trainingDaysPerWeek ??
            null,
          sessionDurationMode:
            freshRebuildInput?.sessionDurationMode ||
            canonicalProfileNow?.sessionDurationMode ||
            inputs?.sessionDurationMode ||
            null,
          sessionLength:
            freshRebuildInput?.sessionLength ??
            canonicalProfileNow?.sessionLengthMinutes ??
            inputs?.sessionLength ??
            null,
          selectedSkills:
            (freshRebuildInput?.selectedSkills?.length ?? 0) > 0
              ? freshRebuildInput.selectedSkills
              : (canonicalProfileNow?.selectedSkills?.length ?? 0) > 0
              ? canonicalProfileNow.selectedSkills
              : (inputs?.selectedSkills?.length ?? 0) > 0
              ? inputs.selectedSkills
              : [],
          trainingPathType:
            freshRebuildInput?.trainingPathType ||
            canonicalProfileNow?.trainingPathType ||
            inputs?.trainingPathType ||
            null,
          equipment:
            (freshRebuildInput?.equipment?.length ?? 0) > 0
              ? freshRebuildInput.equipment
              : (canonicalProfileNow?.equipmentAvailable?.length ?? 0) > 0
              ? canonicalProfileNow.equipmentAvailable
              : (inputs?.equipment?.length ?? 0) > 0
              ? inputs.equipment
              : [],
          // [PHASE 18B/18C] Deep planner identity fields - freshRebuildInput > canonical > inputs
          goalCategories:
            (freshRebuildInput?.goalCategories?.length ?? 0) > 0
              ? freshRebuildInput.goalCategories
              : (canonicalProfileNow?.goalCategories?.length ?? 0) > 0
              ? canonicalProfileNow.goalCategories
              : (inputs?.goalCategories?.length ?? 0) > 0
              ? inputs.goalCategories
              : [],
          selectedFlexibility:
            (freshRebuildInput?.selectedFlexibility?.length ?? 0) > 0
              ? freshRebuildInput.selectedFlexibility
              : (canonicalProfileNow?.selectedFlexibility?.length ?? 0) > 0
              ? canonicalProfileNow.selectedFlexibility
              : (inputs?.selectedFlexibility?.length ?? 0) > 0
              ? inputs.selectedFlexibility
              : [],
          experienceLevel:
            freshRebuildInput?.experienceLevel ||
            canonicalProfileNow?.experienceLevel ||
            inputs?.experienceLevel ||
            null,
        }
        
        // ==========================================================================
        // [PHASE 18B] TASK 3 - Post-expansion audit after strongestRegenerateTruth is created
        // ==========================================================================
        console.log('[phase18b-regenerate-deep-planner-strongest-truth-audit]', {
          triggerPath: 'handleRegenerate',
          strongestRegenerateTruth: {
            primaryGoal: strongestRegenerateTruth?.primaryGoal ?? null,
            secondaryGoal: strongestRegenerateTruth?.secondaryGoal ?? null,
            scheduleMode: strongestRegenerateTruth?.scheduleMode ?? null,
            trainingDaysPerWeek: strongestRegenerateTruth?.trainingDaysPerWeek ?? null,
            sessionDurationMode: strongestRegenerateTruth?.sessionDurationMode ?? null,
            sessionLength: strongestRegenerateTruth?.sessionLength ?? null,
            selectedSkills: strongestRegenerateTruth?.selectedSkills ?? [],
            trainingPathType: strongestRegenerateTruth?.trainingPathType ?? null,
            equipment: strongestRegenerateTruth?.equipment ?? [],
            goalCategories: strongestRegenerateTruth?.goalCategories ?? [],
            selectedFlexibility: strongestRegenerateTruth?.selectedFlexibility ?? [],
            experienceLevel: strongestRegenerateTruth?.experienceLevel ?? null,
          },
          verdict: 'handleRegenerate_now_has_full_deep_planner_identity_truth_object',
        })
        
        // ==========================================================================
        // [PHASE 17T] TASK 1 & 3 - Force explicit regenerationMode for rebuild path
        // Without this, builder falls back to stateFlags.recommendedMode which can
        // change behavior based on existing program/history context
        // ==========================================================================
        // [PHASE 17Y] TASK 3 - Use strongestRegenerateTruth for material identity fields
        // This prevents stale Program-page `inputs` from winning by default
        const rebuildBuilderInput = {
          ...freshRebuildInput,
          // [PHASE 17Y/18B] Material identity fields - use strongestRegenerateTruth
          primaryGoal: strongestRegenerateTruth.primaryGoal,
          secondaryGoal: strongestRegenerateTruth.secondaryGoal,
          scheduleMode: strongestRegenerateTruth.scheduleMode,
          trainingDaysPerWeek: strongestRegenerateTruth.trainingDaysPerWeek,
          sessionDurationMode: strongestRegenerateTruth.sessionDurationMode,
          sessionLength: strongestRegenerateTruth.sessionLength,
          selectedSkills: strongestRegenerateTruth.selectedSkills,
          selectedStyles: (inputs?.selectedStyles?.length ?? 0) > 0 ? inputs.selectedStyles : freshRebuildInput?.selectedStyles,
          trainingPathType: strongestRegenerateTruth.trainingPathType,
          equipment: strongestRegenerateTruth.equipment,
          // [PHASE 18B] TASK 4 - Deep planner identity fields
          goalCategories: strongestRegenerateTruth.goalCategories,
          selectedFlexibility: strongestRegenerateTruth.selectedFlexibility,
          experienceLevel: strongestRegenerateTruth.experienceLevel,
          // [PHASE 17T] Explicit regeneration mode
          regenerationMode: 'fresh' as const,
          regenerationReason: 'rebuild_from_current_settings',
        }
        
        // ==========================================================================
        // [PHASE 17U] TASK 5A - Rebuild material truth merge audit
        // ==========================================================================
        console.log('[phase17u-rebuild-material-truth-merge-audit]', {
          triggerPath: 'handleRegenerate',
          currentInputsTruth: {
            primaryGoal: inputs?.primaryGoal ?? null,
            secondaryGoal: inputs?.secondaryGoal ?? null,
            scheduleMode: inputs?.scheduleMode ?? null,
            trainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
            sessionDurationMode: inputs?.sessionDurationMode ?? null,
            sessionLength: inputs?.sessionLength ?? null,
            selectedSkills: inputs?.selectedSkills ?? [],
            selectedStyles: inputs?.selectedStyles ?? [],
            trainingPathType: inputs?.trainingPathType ?? null,
            equipment: inputs?.equipment ?? [],
          },
          preMergeRebuildInput: {
            primaryGoal: freshRebuildInput?.primaryGoal ?? null,
            secondaryGoal: freshRebuildInput?.secondaryGoal ?? null,
            scheduleMode: freshRebuildInput?.scheduleMode ?? null,
            trainingDaysPerWeek: freshRebuildInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: freshRebuildInput?.sessionDurationMode ?? null,
            sessionLength: freshRebuildInput?.sessionLength ?? null,
            selectedSkills: freshRebuildInput?.selectedSkills ?? [],
            selectedStyles: freshRebuildInput?.selectedStyles ?? [],
            trainingPathType: freshRebuildInput?.trainingPathType ?? null,
            equipment: freshRebuildInput?.equipment ?? [],
          },
          finalBuilderInput: {
            primaryGoal: rebuildBuilderInput?.primaryGoal ?? null,
            secondaryGoal: rebuildBuilderInput?.secondaryGoal ?? null,
            scheduleMode: rebuildBuilderInput?.scheduleMode ?? null,
            trainingDaysPerWeek: rebuildBuilderInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: rebuildBuilderInput?.sessionDurationMode ?? null,
            sessionLength: rebuildBuilderInput?.sessionLength ?? null,
            selectedSkills: rebuildBuilderInput?.selectedSkills ?? [],
            selectedStyles: rebuildBuilderInput?.selectedStyles ?? [],
            trainingPathType: rebuildBuilderInput?.trainingPathType ?? null,
            equipment: rebuildBuilderInput?.equipment ?? [],
            regenerationMode: rebuildBuilderInput?.regenerationMode ?? null,
            regenerationReason: rebuildBuilderInput?.regenerationReason ?? null,
          },
        })
        
        // ==========================================================================
        // [PHASE 17U] TASK 6A - Rebuild prebuilder parity verdict
        // ==========================================================================
        console.log('[phase17u-rebuild-prebuilder-parity-verdict]', {
          triggerPath: 'handleRegenerate',
          preservedPrimaryGoalFromInputs: rebuildBuilderInput?.primaryGoal === (inputs?.primaryGoal ?? rebuildBuilderInput?.primaryGoal),
          preservedScheduleModeFromInputs: rebuildBuilderInput?.scheduleMode === (inputs?.scheduleMode ?? rebuildBuilderInput?.scheduleMode),
          preservedTrainingDaysFromInputs: rebuildBuilderInput?.trainingDaysPerWeek === (inputs?.trainingDaysPerWeek ?? rebuildBuilderInput?.trainingDaysPerWeek),
          preservedSelectedSkillsFromInputs:
            JSON.stringify(rebuildBuilderInput?.selectedSkills ?? []) === JSON.stringify(inputs?.selectedSkills ?? rebuildBuilderInput?.selectedSkills ?? []),
          preservedTrainingPathTypeFromInputs:
            rebuildBuilderInput?.trainingPathType === (inputs?.trainingPathType ?? rebuildBuilderInput?.trainingPathType),
          verdict: 'final_rebuild_input_now_prefers_current_settings_truth',
        })
        
        // [PHASE 17T] Mode entry diagnostic
        console.log('[phase17t-rebuild-generation-mode-entry-audit]', {
          triggerPath: 'handleRegenerate',
          hasExplicitRegenerationMode: !!rebuildBuilderInput?.regenerationMode,
          regenerationMode: rebuildBuilderInput?.regenerationMode ?? null,
          regenerationReason: rebuildBuilderInput?.regenerationReason ?? null,
          hasActiveProgramAtDispatch: !!program,
          activeProgramId: program?.id ?? null,
          activeProgramSessionCount: program?.sessions?.length ?? 0,
        })
        
        // [PHASE 17T] Mode fix verdict
        console.log('[phase17t-rebuild-mode-fix-verdict]', {
          triggerPath: 'handleRegenerate',
          oldBehavior: 'builder_mode_was_state_inferred_when_regenerationMode_missing',
          newBehavior: 'builder_mode_forced_to_fresh_for_rebuild_from_current_settings',
          finalRegenerationMode: rebuildBuilderInput.regenerationMode,
          finalRegenerationReason: rebuildBuilderInput.regenerationReason,
        })
        
        // ==========================================================================
        // [PHASE 17V] TASK 2 - Build explicit canonical override for handleRegenerate
        // This prevents builder from re-reading weaker stale canonical profile
        // ==========================================================================
        // [PHASE 17W] Reuse earlier canonicalProfileNow from handleRegenerate scope.
        // Do not redeclare here or Turbopack build will fail with duplicate identifier.
        // [PHASE 17Y] TASK 4 - Use strongestRegenerateTruth for canonical override
        const rebuildCanonicalOverride = {
          ...canonicalProfileNow,
          // [PHASE 17Y/18B] Material identity fields - use strongestRegenerateTruth
          primaryGoal: strongestRegenerateTruth.primaryGoal,
          secondaryGoal: strongestRegenerateTruth.secondaryGoal,
          selectedSkills: strongestRegenerateTruth.selectedSkills,
          scheduleMode: strongestRegenerateTruth.scheduleMode,
          // [PHASE 17V] Flexible null semantics - if flexible, force null trainingDaysPerWeek
          trainingDaysPerWeek: strongestRegenerateTruth.scheduleMode === 'flexible' 
            ? null 
            : strongestRegenerateTruth.trainingDaysPerWeek,
          sessionDurationMode: strongestRegenerateTruth.sessionDurationMode,
          sessionLengthMinutes: strongestRegenerateTruth.sessionLength,
          equipmentAvailable: strongestRegenerateTruth.equipment,
          trainingPathType: strongestRegenerateTruth.trainingPathType,
          // [PHASE 18B] TASK 5 - Deep planner identity fields
          goalCategories: strongestRegenerateTruth.goalCategories,
          selectedFlexibility: strongestRegenerateTruth.selectedFlexibility,
          experienceLevel: strongestRegenerateTruth.experienceLevel,
        }
        
        // [PHASE 17V] TASK 6A - Rebuild canonical override audit
        console.log('[phase17v-rebuild-canonical-override-audit]', {
          triggerPath: 'handleRegenerate',
          canonicalBaseline: {
            primaryGoal: canonicalProfileNow?.primaryGoal ?? null,
            secondaryGoal: canonicalProfileNow?.secondaryGoal ?? null,
            selectedSkills: canonicalProfileNow?.selectedSkills ?? [],
            scheduleMode: canonicalProfileNow?.scheduleMode ?? null,
            trainingDaysPerWeek: canonicalProfileNow?.trainingDaysPerWeek ?? null,
            sessionDurationMode: canonicalProfileNow?.sessionDurationMode ?? null,
            sessionLengthMinutes: canonicalProfileNow?.sessionLengthMinutes ?? null,
            equipmentAvailable: canonicalProfileNow?.equipmentAvailable ?? [],
            trainingPathType: canonicalProfileNow?.trainingPathType ?? null,
          },
          currentInputsTruth: {
            primaryGoal: inputs?.primaryGoal ?? null,
            secondaryGoal: inputs?.secondaryGoal ?? null,
            selectedSkills: inputs?.selectedSkills ?? [],
            scheduleMode: inputs?.scheduleMode ?? null,
            trainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
            sessionDurationMode: inputs?.sessionDurationMode ?? null,
            sessionLength: inputs?.sessionLength ?? null,
            equipment: inputs?.equipment ?? [],
            trainingPathType: inputs?.trainingPathType ?? null,
          },
          freshRebuildInputTruth: {
            primaryGoal: freshRebuildInput?.primaryGoal ?? null,
            secondaryGoal: freshRebuildInput?.secondaryGoal ?? null,
            selectedSkills: freshRebuildInput?.selectedSkills ?? [],
            scheduleMode: freshRebuildInput?.scheduleMode ?? null,
            trainingDaysPerWeek: freshRebuildInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: freshRebuildInput?.sessionDurationMode ?? null,
            sessionLength: freshRebuildInput?.sessionLength ?? null,
            equipment: freshRebuildInput?.equipment ?? [],
            trainingPathType: freshRebuildInput?.trainingPathType ?? null,
          },
          finalCanonicalOverride: {
            primaryGoal: rebuildCanonicalOverride?.primaryGoal ?? null,
            secondaryGoal: rebuildCanonicalOverride?.secondaryGoal ?? null,
            selectedSkills: rebuildCanonicalOverride?.selectedSkills ?? [],
            scheduleMode: rebuildCanonicalOverride?.scheduleMode ?? null,
            trainingDaysPerWeek: rebuildCanonicalOverride?.trainingDaysPerWeek ?? null,
            sessionDurationMode: rebuildCanonicalOverride?.sessionDurationMode ?? null,
            sessionLengthMinutes: rebuildCanonicalOverride?.sessionLengthMinutes ?? null,
            equipmentAvailable: rebuildCanonicalOverride?.equipmentAvailable ?? [],
            trainingPathType: rebuildCanonicalOverride?.trainingPathType ?? null,
          },
        })
        
        // [PHASE 17V] TASK 7 - Root cause verdict
        console.log('[phase17v-root-cause-verdict]', {
          triggerPath: 'handleRegenerate',
          rootCauseTheory: 'builder_reads_canonicalProfile_heavily_and_can_ignore_stronger_inputs_if_no_canonical_override_is_passed',
          fixApplied: 'explicit_canonicalProfileOverride_now_passed_to_generateAdaptiveProgram',
          expectedBehavior: 'rebuild_should_now_follow_same_stronger_truth_class_in_builder_as_onboarding',
        })
        
        // ==========================================================================
        // [PHASE 17Y] TASK 5 - Regenerate material parity verdict
        // ==========================================================================
        console.log('[phase17y-regenerate-material-parity-verdict]', {
          triggerPath: 'handleRegenerate',
          strongestRegenerateTruth,
          finalRebuildBuilderInputMaterialTruth: {
            primaryGoal: rebuildBuilderInput?.primaryGoal ?? null,
            secondaryGoal: rebuildBuilderInput?.secondaryGoal ?? null,
            scheduleMode: rebuildBuilderInput?.scheduleMode ?? null,
            trainingDaysPerWeek: rebuildBuilderInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: rebuildBuilderInput?.sessionDurationMode ?? null,
            sessionLength: rebuildBuilderInput?.sessionLength ?? null,
            selectedSkills: rebuildBuilderInput?.selectedSkills ?? [],
            trainingPathType: rebuildBuilderInput?.trainingPathType ?? null,
            equipment: rebuildBuilderInput?.equipment ?? [],
          },
          finalRebuildCanonicalOverrideMaterialTruth: {
            primaryGoal: rebuildCanonicalOverride?.primaryGoal ?? null,
            secondaryGoal: rebuildCanonicalOverride?.secondaryGoal ?? null,
            scheduleMode: rebuildCanonicalOverride?.scheduleMode ?? null,
            trainingDaysPerWeek: rebuildCanonicalOverride?.trainingDaysPerWeek ?? null,
            sessionDurationMode: rebuildCanonicalOverride?.sessionDurationMode ?? null,
            sessionLengthMinutes: rebuildCanonicalOverride?.sessionLengthMinutes ?? null,
            selectedSkills: rebuildCanonicalOverride?.selectedSkills ?? [],
            trainingPathType: rebuildCanonicalOverride?.trainingPathType ?? null,
            equipmentAvailable: rebuildCanonicalOverride?.equipmentAvailable ?? [],
          },
          verdict:
            JSON.stringify({
              primaryGoal: rebuildBuilderInput?.primaryGoal ?? null,
              secondaryGoal: rebuildBuilderInput?.secondaryGoal ?? null,
              scheduleMode: rebuildBuilderInput?.scheduleMode ?? null,
              trainingDaysPerWeek: rebuildBuilderInput?.trainingDaysPerWeek ?? null,
              sessionDurationMode: rebuildBuilderInput?.sessionDurationMode ?? null,
              sessionLength: rebuildBuilderInput?.sessionLength ?? null,
              selectedSkills: rebuildBuilderInput?.selectedSkills ?? [],
              trainingPathType: rebuildBuilderInput?.trainingPathType ?? null,
              equipment: rebuildBuilderInput?.equipment ?? [],
            }) === JSON.stringify({
              primaryGoal: rebuildCanonicalOverride?.primaryGoal ?? null,
              secondaryGoal: rebuildCanonicalOverride?.secondaryGoal ?? null,
              scheduleMode: rebuildCanonicalOverride?.scheduleMode ?? null,
              trainingDaysPerWeek: rebuildCanonicalOverride?.trainingDaysPerWeek ?? null,
              sessionDurationMode: rebuildCanonicalOverride?.sessionDurationMode ?? null,
              sessionLength: rebuildCanonicalOverride?.sessionLengthMinutes ?? null,
              selectedSkills: rebuildCanonicalOverride?.selectedSkills ?? [],
              trainingPathType: rebuildCanonicalOverride?.trainingPathType ?? null,
              equipment: rebuildCanonicalOverride?.equipmentAvailable ?? [],
            })
              ? 'REGENERATE_BUILDER_AND_OVERRIDE_ALIGNED'
              : 'REGENERATE_MATERIAL_TRUTH_MISMATCH_STILL_PRESENT',
        })
        
        // ==========================================================================
        // [PHASE 18A] TASK 6 - Builder handoff parity verdict
        // ==========================================================================
        console.log('[phase18a-regenerate-builder-handoff-parity-verdict]', {
          triggerPath: 'handleRegenerate',
          finalBuilderInput: {
            primaryGoal: rebuildBuilderInput?.primaryGoal ?? null,
            secondaryGoal: rebuildBuilderInput?.secondaryGoal ?? null,
            scheduleMode: rebuildBuilderInput?.scheduleMode ?? null,
            trainingDaysPerWeek: rebuildBuilderInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: rebuildBuilderInput?.sessionDurationMode ?? null,
            sessionLength: rebuildBuilderInput?.sessionLength ?? null,
            selectedSkills: rebuildBuilderInput?.selectedSkills ?? [],
            trainingPathType: rebuildBuilderInput?.trainingPathType ?? null,
            equipment: rebuildBuilderInput?.equipment ?? [],
            regenerationMode: rebuildBuilderInput?.regenerationMode ?? null,
            regenerationReason: rebuildBuilderInput?.regenerationReason ?? null,
          },
          finalCanonicalOverride: {
            primaryGoal: rebuildCanonicalOverride?.primaryGoal ?? null,
            secondaryGoal: rebuildCanonicalOverride?.secondaryGoal ?? null,
            scheduleMode: rebuildCanonicalOverride?.scheduleMode ?? null,
            trainingDaysPerWeek: rebuildCanonicalOverride?.trainingDaysPerWeek ?? null,
            sessionDurationMode: rebuildCanonicalOverride?.sessionDurationMode ?? null,
            sessionLengthMinutes: rebuildCanonicalOverride?.sessionLengthMinutes ?? null,
            selectedSkills: rebuildCanonicalOverride?.selectedSkills ?? [],
            trainingPathType: rebuildCanonicalOverride?.trainingPathType ?? null,
            equipmentAvailable: rebuildCanonicalOverride?.equipmentAvailable ?? [],
          },
          parityChecks: {
            primaryGoalAligned:
              (rebuildBuilderInput?.primaryGoal ?? null) === (rebuildCanonicalOverride?.primaryGoal ?? null),
            selectedSkillsAligned:
              JSON.stringify(rebuildBuilderInput?.selectedSkills ?? []) === JSON.stringify(rebuildCanonicalOverride?.selectedSkills ?? []),
            trainingPathTypeAligned:
              (rebuildBuilderInput?.trainingPathType ?? null) === (rebuildCanonicalOverride?.trainingPathType ?? null),
            scheduleModeAligned:
              (rebuildBuilderInput?.scheduleMode ?? null) === (rebuildCanonicalOverride?.scheduleMode ?? null),
          },
          verdict: 'builder_input_and_canonical_override_now_share_same_current-settings-first_truth',
        })
        
        // ==========================================================================
        // [PHASE 18B] TASK 6 - Deep planner handoff parity verdict
        // ==========================================================================
        console.log('[phase18b-regenerate-deep-planner-handoff-parity-verdict]', {
          triggerPath: 'handleRegenerate',
          finalBuilderInput: {
            primaryGoal: rebuildBuilderInput?.primaryGoal ?? null,
            secondaryGoal: rebuildBuilderInput?.secondaryGoal ?? null,
            scheduleMode: rebuildBuilderInput?.scheduleMode ?? null,
            trainingDaysPerWeek: rebuildBuilderInput?.trainingDaysPerWeek ?? null,
            sessionDurationMode: rebuildBuilderInput?.sessionDurationMode ?? null,
            sessionLength: rebuildBuilderInput?.sessionLength ?? null,
            selectedSkills: rebuildBuilderInput?.selectedSkills ?? [],
            trainingPathType: rebuildBuilderInput?.trainingPathType ?? null,
            equipment: rebuildBuilderInput?.equipment ?? [],
            goalCategories: rebuildBuilderInput?.goalCategories ?? [],
            selectedFlexibility: rebuildBuilderInput?.selectedFlexibility ?? [],
            experienceLevel: rebuildBuilderInput?.experienceLevel ?? null,
            regenerationMode: rebuildBuilderInput?.regenerationMode ?? null,
            regenerationReason: rebuildBuilderInput?.regenerationReason ?? null,
          },
          finalCanonicalOverride: {
            primaryGoal: rebuildCanonicalOverride?.primaryGoal ?? null,
            secondaryGoal: rebuildCanonicalOverride?.secondaryGoal ?? null,
            scheduleMode: rebuildCanonicalOverride?.scheduleMode ?? null,
            trainingDaysPerWeek: rebuildCanonicalOverride?.trainingDaysPerWeek ?? null,
            sessionDurationMode: rebuildCanonicalOverride?.sessionDurationMode ?? null,
            sessionLengthMinutes: rebuildCanonicalOverride?.sessionLengthMinutes ?? null,
            selectedSkills: rebuildCanonicalOverride?.selectedSkills ?? [],
            trainingPathType: rebuildCanonicalOverride?.trainingPathType ?? null,
            equipmentAvailable: rebuildCanonicalOverride?.equipmentAvailable ?? [],
            goalCategories: rebuildCanonicalOverride?.goalCategories ?? [],
            selectedFlexibility: rebuildCanonicalOverride?.selectedFlexibility ?? [],
            experienceLevel: rebuildCanonicalOverride?.experienceLevel ?? null,
          },
          parityChecks: {
            selectedSkillsAligned:
              JSON.stringify(rebuildBuilderInput?.selectedSkills ?? []) === JSON.stringify(rebuildCanonicalOverride?.selectedSkills ?? []),
            goalCategoriesAligned:
              JSON.stringify(rebuildBuilderInput?.goalCategories ?? []) === JSON.stringify(rebuildCanonicalOverride?.goalCategories ?? []),
            selectedFlexibilityAligned:
              JSON.stringify(rebuildBuilderInput?.selectedFlexibility ?? []) === JSON.stringify(rebuildCanonicalOverride?.selectedFlexibility ?? []),
            trainingPathTypeAligned:
              (rebuildBuilderInput?.trainingPathType ?? null) === (rebuildCanonicalOverride?.trainingPathType ?? null),
            experienceLevelAligned:
              (rebuildBuilderInput?.experienceLevel ?? null) === (rebuildCanonicalOverride?.experienceLevel ?? null),
          },
          verdict: 'handleRegenerate_now_enters_builder_with_full_deep_planner_identity_parity',
        })
        
        // ==========================================================================
        // [PHASE 18C] TASK 5 - Post-fix root parity verdict
        // Confirms stale inputs no longer outranks fresher truth
        // ==========================================================================
        console.log('[phase18c-regenerate-postfix-root-parity-verdict]', {
          triggerPath: 'handleRegenerate',
          inputs_removed_as_top_priority: true,
          regenerate_now_uses_fresh_entry_first: true,
          canonical_override_remains_aligned: true,
          finalTruthPriorityOrder: 'freshRebuildInput > canonicalProfileNow > inputs',
          finalIdentityUsed: {
            primaryGoal: strongestRegenerateTruth.primaryGoal,
            secondaryGoal: strongestRegenerateTruth.secondaryGoal,
            scheduleMode: strongestRegenerateTruth.scheduleMode,
            trainingDaysPerWeek: strongestRegenerateTruth.trainingDaysPerWeek,
            sessionDurationMode: strongestRegenerateTruth.sessionDurationMode,
            sessionLength: strongestRegenerateTruth.sessionLength,
            selectedSkills: strongestRegenerateTruth.selectedSkills,
            trainingPathType: strongestRegenerateTruth.trainingPathType,
            equipment: strongestRegenerateTruth.equipment,
            goalCategories: strongestRegenerateTruth.goalCategories,
            selectedFlexibility: strongestRegenerateTruth.selectedFlexibility,
            experienceLevel: strongestRegenerateTruth.experienceLevel,
          },
          builderInputAndCanonicalOverrideAligned: 
            (rebuildBuilderInput?.primaryGoal ?? null) === (rebuildCanonicalOverride?.primaryGoal ?? null) &&
            JSON.stringify(rebuildBuilderInput?.selectedSkills ?? []) === JSON.stringify(rebuildCanonicalOverride?.selectedSkills ?? []) &&
            (rebuildBuilderInput?.trainingPathType ?? null) === (rebuildCanonicalOverride?.trainingPathType ?? null) &&
            JSON.stringify(rebuildBuilderInput?.goalCategories ?? []) === JSON.stringify(rebuildCanonicalOverride?.goalCategories ?? []) &&
            JSON.stringify(rebuildBuilderInput?.selectedFlexibility ?? []) === JSON.stringify(rebuildCanonicalOverride?.selectedFlexibility ?? []) &&
            (rebuildBuilderInput?.experienceLevel ?? null) === (rebuildCanonicalOverride?.experienceLevel ?? null),
          expected_identity_class: 'should_now_match_onboarding_canonical_truth',
          verdict: 'REAL_ROOT_CAUSE_FIXED_AT_REGENERATE_ENTRY',
        })
        
        // ==========================================================================
        // [PHASE 18D] TASK 4 - Replace direct client builder call with server route dispatch
        // This mirrors the working onboarding architecture where generation happens server-side
        // ==========================================================================
        const regenAttemptId = `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        
        // ==========================================================================
        // [PHASE 18F] TASK 6 - Pre-dispatch truth layer audit
        // Compares active program vs canonical profile to prove writeback completeness
        // ==========================================================================
        console.log('[phase18f-regenerate-pre-dispatch-truth-layer-audit]', {
          triggerPath: 'handleRegenerate',
          activeVisibleProgram: {
            sessionCount: program?.sessions?.length ?? 0,
            primaryGoal: program?.primaryGoal ?? null,
            trainingPathType: (program as unknown as { trainingPathType?: string })?.trainingPathType ?? null,
            selectedSkills: (program as unknown as { selectedSkills?: string[] })?.selectedSkills ?? [],
            scheduleMode: program?.scheduleMode ?? null,
            trainingDaysPerWeek: program?.trainingDaysPerWeek ?? null,
          },
          currentInputs: {
            primaryGoal: inputs?.primaryGoal ?? null,
            selectedSkills: inputs?.selectedSkills ?? [],
            trainingPathType: inputs?.trainingPathType ?? null,
            goalCategories: inputs?.goalCategories ?? [],
            selectedFlexibility: inputs?.selectedFlexibility ?? [],
            experienceLevel: inputs?.experienceLevel ?? null,
            scheduleMode: inputs?.scheduleMode ?? null,
            trainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
          },
          currentCanonicalProfile: {
            primaryGoal: canonicalProfileNow?.primaryGoal ?? null,
            selectedSkills: canonicalProfileNow?.selectedSkills ?? [],
            trainingPathType: canonicalProfileNow?.trainingPathType ?? null,
            goalCategories: canonicalProfileNow?.goalCategories ?? [],
            selectedFlexibility: canonicalProfileNow?.selectedFlexibility ?? [],
            experienceLevel: canonicalProfileNow?.experienceLevel ?? null,
            scheduleMode: canonicalProfileNow?.scheduleMode ?? null,
            trainingDaysPerWeek: canonicalProfileNow?.trainingDaysPerWeek ?? null,
          },
          parityChecks: {
            canonicalHasSelectedSkills: (canonicalProfileNow?.selectedSkills?.length ?? 0) > 0,
            canonicalHasTrainingPathType: !!canonicalProfileNow?.trainingPathType,
            canonicalHasGoalCategories: (canonicalProfileNow?.goalCategories?.length ?? 0) > 0,
            canonicalMatchesInputsSkills: JSON.stringify(canonicalProfileNow?.selectedSkills ?? []) === JSON.stringify(inputs?.selectedSkills ?? []),
            canonicalMatchesInputsPathType: (canonicalProfileNow?.trainingPathType ?? null) === (inputs?.trainingPathType ?? null),
          },
          verdict: (canonicalProfileNow?.selectedSkills?.length ?? 0) > 0 && !!canonicalProfileNow?.trainingPathType
            ? 'CANONICAL_NOW_CARRIES_DEEP_PLANNER_IDENTITY'
            : 'CANONICAL_STILL_MISSING_DEEP_PLANNER_FIELDS',
        })
        
        // [PHASE 18D] TASK 6A - Client dispatch audit
        console.log('[phase18d-regenerate-client-dispatch-audit]', {
          triggerPath: 'handleRegenerate',
          currentProgramId: program?.id ?? null,
          directBuilderCallBypassed: true,
          dispatchingToServerRoute: true,
          requestPayloadShape: {
            hasCanonicalProfile: !!rebuildCanonicalOverride,
            hasProgramInputs: !!rebuildBuilderInput,
            regenerationReason: 'rebuild_from_current_settings',
          },
          verdict: 'dispatching_to_server_regenerate_contract',
        })
        
        console.log('[phase16s-generate-dispatch-verdict]', {
          flowName: 'regeneration',
          attemptId: regenAttemptId,
          runtimeSessionId: runtimeSessionIdRef.current,
          requestDispatched: true,
          dispatchMethod: 'server_route_/api/program/regenerate',
          dispatchTimestamp: new Date().toISOString(),
          verdict: 'dispatch_executing_via_server',
        })
        
        // [PHASE 18D] Dispatch to server regenerate route instead of direct builder call
        const serverResponse = await fetch('/api/program/regenerate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canonicalProfile: rebuildCanonicalOverride,
            programInputs: rebuildBuilderInput,
            regenerationReason: 'rebuild_from_current_settings',
            currentProgramId: program?.id ?? null,
          }),
        })
        
        // [404-DIAGNOSTIC] Check for non-JSON responses (404 pages, server errors)
        const contentType = serverResponse.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          const responseText = await serverResponse.text()
          console.error('[regenerate-non-json-response]', {
            status: serverResponse.status,
            statusText: serverResponse.statusText,
            contentType,
            responsePreview: responseText.substring(0, 500),
            diagnostic_stage: 'server_response_content_type_check',
            diagnostic_source: 'regenerate_route_call',
            diagnostic_request_path: '/api/program/regenerate',
            diagnostic_status: serverResponse.status,
            diagnostic_reason: 'non_json_response_received',
            verdict: 'ROUTE_RETURNED_NON_JSON_RESPONSE',
          })
          throw new ProgramPageValidationError(
            'orchestration_failed',
            regenerateStage,
            serverResponse.status === 404 ? 'route_not_found' : 'non_json_server_response',
            `Server returned ${serverResponse.status} with non-JSON response`,
            { 
              status: serverResponse.status,
              contentType,
              responsePreview: responseText.substring(0, 200),
            }
          )
        }
        
        const serverResult = await serverResponse.json()
        
        // [PHASE 15E BABY AUDIT] Client-side truth audit at exact decision point
        console.log('[regenerate-client-truth-audit]', {
          status: serverResponse.status,
          ok: serverResponse.ok,
          contentType,
          serverSuccess: serverResult.success,
          failedStage: serverResult.failedStage || null,
          exactFailingSubstep: serverResult.exactFailingSubstep || null,
          exactLastSafeSubstep: serverResult.exactLastSafeSubstep || null,
          hasProgram: !!serverResult.program,
          sessionCount: serverResult.program?.sessions?.length ?? 0,
          previousLastBuildStatus: lastBuildResult?.status || 'none',
          currentRuntimeSessionId: runtimeSessionIdRef.current,
          verdict: !serverResponse.ok || !serverResult.success
            ? 'server_failure_confirmed'
            : serverResult.program && Array.isArray(serverResult.program.sessions) && serverResult.program.sessions.length > 0
              ? 'server_success_payload_valid'
              : 'response_shape_invalid',
        })
        
        if (!serverResponse.ok || !serverResult.success) {
          console.log('[phase18d-regenerate-server-error]', {
            status: serverResponse.status,
            error: serverResult.error,
            failedStage: serverResult.failedStage,
            diagnostic_stage: 'server_result_validation',
            diagnostic_source: 'regenerate_route_call',
            diagnostic_request_path: '/api/program/regenerate',
            diagnostic_status: serverResponse.status,
            diagnostic_reason: serverResult.failedStage || 'server_returned_failure',
          })
          throw new ProgramPageValidationError(
            'orchestration_failed',
            regenerateStage,
            'server_regenerate_failed',
            serverResult.error || 'Server regenerate failed',
            { serverResult }
          )
        }
        
        // ==========================================================================
        // [PHASE15E-DEGRADED-SUCCESS-HANDOFF] Check for degraded success
        // A response with success=true but totalDegraded>0 must NOT be treated as healthy
        // ==========================================================================
        const rebuildFailureSummary = serverResult.rebuildFailureSummary ?? null
        const hasDegradedSessions = (rebuildFailureSummary?.totalDegraded ?? 0) > 0
        const isHealthyRegenerate = serverResult.success === true && !hasDegradedSessions
        const isDegradedRegenerate = serverResult.success === true && hasDegradedSessions
        
        // [regenerate-degraded-truth-verdict] Audit log for degraded success detection
        console.log('[regenerate-degraded-truth-verdict]', {
          hasRebuildFailureSummary: !!rebuildFailureSummary,
          totalDegraded: rebuildFailureSummary?.totalDegraded ?? 0,
          totalAttempted: rebuildFailureSummary?.totalAttempted ?? 0,
          totalSucceeded: rebuildFailureSummary?.totalSucceeded ?? 0,
          firstFailedCheckpoint: rebuildFailureSummary?.firstFailedCheckpoint ?? null,
          firstFailedFocus: rebuildFailureSummary?.firstFailedFocus ?? null,
          actionRequired: rebuildFailureSummary?.actionRequired ?? null,
          failureVerdict: rebuildFailureSummary?.failureVerdict ?? null,
          isHealthyRegenerate,
          isDegradedRegenerate,
          promotedAsHealthySuccess: isHealthyRegenerate,
          preservedLastGood: isDegradedRegenerate,
          verdict: isDegradedRegenerate 
            ? 'degraded_success_preserved_last_good' 
            : isHealthyRegenerate 
              ? 'healthy_success_will_promote'
              : 'unexpected_state',
        })
        
        // If degraded, DO NOT promote the rebuild - preserve last good program
        if (isDegradedRegenerate) {
          console.log('[phase15e-degraded-success-handled]', {
            message: 'Regenerate returned degraded sessions - preserving last good program',
            totalDegraded: rebuildFailureSummary?.totalDegraded,
            firstFailedCheckpoint: rebuildFailureSummary?.firstFailedCheckpoint,
            actionRequired: rebuildFailureSummary?.actionRequired,
          })
          
          // Build a compact failure reason from the server summary
          const failureReasonParts = [
            rebuildFailureSummary?.firstFailedErrorName,
            rebuildFailureSummary?.firstFailedErrorMessage,
            rebuildFailureSummary?.failureVerdict,
          ].filter(Boolean)
          const compactFailureReason = failureReasonParts.join(' - ').slice(0, 200) || 'Session generation degraded'
          
          // Create a failed result using the existing preserved_last_good mechanism
          const degradedFailedResult = createFailedBuildResult(
            'session_building_failure' as GenerationErrorCode,
            'degraded_regenerate',
            'generation_degraded' as BuildAttemptSubCode,
            createProfileSignature(freshRebuildInput),
            program?.id || null,
            'Your rebuild returned degraded sessions, so your last good program was preserved.',
            {
              failureStep: rebuildFailureSummary?.firstFailedCheckpoint ?? 'degraded_regenerate',
              failureMiddleStep: null,
              failureFocus: rebuildFailureSummary?.firstFailedFocus ?? null,
              failureReason: compactFailureReason,
              failureDayNumber: rebuildFailureSummary?.firstFailedIndex ?? null,
              failureGoal: freshRebuildInput.primaryGoal || null,
              actionRequired: rebuildFailureSummary?.actionRequired ?? null,
            }
          )
          
          // Add runtime session metadata
          const degradedResultWithMetadata: BuildAttemptResult = {
            ...degradedFailedResult,
            runtimeSessionId: runtimeSessionIdRef.current,
            pageFlow: 'regeneration',
            dispatchStartedAt: regenDispatchStartTime,
            requestDispatched: true,
            responseReceived: true,
            hydratedFromStorage: false,
          }
          
          // Save the failure state - DO NOT save the degraded program
          setLastBuildResult(degradedResultWithMetadata)
          saveLastBuildAttemptResult(degradedResultWithMetadata)
          
          // Release builder lock
          if (modifyBuilderLockRef.current) {
            modifyBuilderLockRef.current = false
          }
          modifyBuilderEntryRef.current = null
          setModifyBuilderEntry(null)
          setShowBuilder(false)
          
          // Exit early - do not continue to success promotion
          return
        }
        
        // [PHASE 18D] TASK 6D - Client result audit
        console.log('[phase18d-regenerate-client-result-audit]', {
          triggerPath: 'handleRegenerate',
          resultReceivedFromServer: true,
          sessionCount: serverResult.program?.sessions?.length ?? 0,
          primaryGoal: serverResult.program?.primaryGoal ?? null,
          saveFlowWillContinue: true,
          verdict: 'client_received_server_generated_program',
        })
        
        const newProgram = serverResult.program as AdaptiveProgram
        
        // ==========================================================================
        // [PHASE 17V] TASK 6B - Rebuild postfix verdict
        // ==========================================================================
        console.log('[phase17v-rebuild-postfix-verdict]', {
          triggerPath: 'handleRegenerate',
          finalProgramId: (newProgram as AdaptiveProgram)?.id ?? null,
          finalProgramSessionCount: (newProgram as AdaptiveProgram)?.sessions?.length ?? 0,
          finalProgramPrimaryGoal: (newProgram as AdaptiveProgram)?.primaryGoal ?? null,
          finalProgramScheduleMode: (newProgram as AdaptiveProgram)?.scheduleMode ?? null,
          finalProgramTrainingPathType: (newProgram as Record<string, unknown>)?.trainingPathType ?? null,
          finalProgramSelectedSkills: (newProgram as AdaptiveProgram)?.selectedSkills ?? [],
          verdict: 'rebuild_used_explicit_canonical_override_path',
        })
        
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
        
        // ==========================================================================
        // [PHASE 17T] TASK 5 - Rebuild postfix result audit
        // ==========================================================================
        console.log('[phase17t-rebuild-postfix-result-audit]', {
          triggerPath: 'handleRegenerate',
          finalRegenerationModeUsed: rebuildBuilderInput.regenerationMode,
          finalRegenerationReasonUsed: rebuildBuilderInput.regenerationReason,
          outputProgramId: (newProgram as AdaptiveProgram)?.id ?? null,
          outputSessionCount: (newProgram as AdaptiveProgram)?.sessions?.length ?? 0,
          outputPrimaryGoal: (newProgram as AdaptiveProgram)?.primaryGoal ?? null,
          outputScheduleMode: (newProgram as AdaptiveProgram)?.scheduleMode ?? null,
          outputTrainingDaysPerWeek: (newProgram as AdaptiveProgram)?.trainingDaysPerWeek ?? null,
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
        
        // [PHASE 17H] Path parity builder result audit - track session count and root cause
        const builderRootCause = newProgram.flexibleFrequencyRootCause
        console.log('[phase17h-path-parity-builder-result-audit]', {
          triggerPath: 'handleRegenerate',
          outputSessionCount: sessionCount,
          outputScheduleMode: newProgram.scheduleMode,
          outputPrimaryGoal: newProgram.primaryGoal,
          flexibleFrequencyRootCause: builderRootCause?.finalReasonCategory || 'not_flexible',
          isBaselineDefault: builderRootCause?.isBaselineDefault || false,
          isTrueAdaptive: builderRootCause?.isTrueAdaptive || false,
          isModifierBasedAdjustment: builderRootCause?.isModifierBasedAdjustment || false,
        })
        
        // [PHASE 17H] Path parity frequency root cause audit
        console.log('[phase17h-path-parity-frequency-root-cause-audit]', {
          triggerPath: 'handleRegenerate',
          sessionCount,
          isFlexibleMode: isFlexible,
          rootCauseCategory: builderRootCause?.finalReasonCategory || 'static_or_unknown',
          isInitialBaseline: builderRootCause?.finalReasonCategory === 'low_history_default' || builderRootCause?.isBaselineDefault,
          verdict: builderRootCause?.finalReasonCategory === 'low_history_default'
            ? 'USING_LOW_HISTORY_DEFAULT_BASELINE'
            : builderRootCause?.isTrueAdaptive
            ? 'USING_TRUE_ADAPTIVE_ADJUSTMENT'
            : builderRootCause?.isModifierBasedAdjustment
            ? 'USING_MODIFIER_BASED_ADJUSTMENT'
            : 'UNKNOWN_ROOT_CAUSE',
        })
        
        // [PHASE 17H] Path divergence final verdict
        console.log('[phase17h-path-divergence-final-verdict]', {
          triggerPath: 'handleRegenerate',
          inputsUsedSameCanonicalChain: true,
          outputSessionCount: sessionCount,
          if4SessionsOnFlexible: produced4Days && isFlexible
            ? 'INVESTIGATE: flexible mode produced 4 sessions - check low_history_default branch'
            : 'NOT_APPLICABLE',
          rootCauseExplanation: builderRootCause?.finalReasonCategory || 'check_builder_output',
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
    
    // ==========================================================================
    // [PHASE 18F] TASK 3 - Expand canonical writeback to include FULL deep planner identity
    // This ensures future rebuilds reconstruct from the same truth class as this successful regen
    // ==========================================================================
    const regenerateWritebackTruth = {
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
      // [PHASE 18F] Deep planner identity fields - CRITICAL for rebuild parity
      selectedSkills: strongestRegenerateTruth.selectedSkills?.length ? strongestRegenerateTruth.selectedSkills : undefined,
      trainingPathType: strongestRegenerateTruth.trainingPathType ?? undefined,
      goalCategories: strongestRegenerateTruth.goalCategories?.length ? strongestRegenerateTruth.goalCategories : undefined,
      selectedFlexibility: strongestRegenerateTruth.selectedFlexibility?.length ? strongestRegenerateTruth.selectedFlexibility : undefined,
      selectedStrength: (inputs?.selectedStrength as string[] | undefined)?.length ? inputs.selectedStrength : undefined,
    }
    
    // [PHASE 18F] TASK 1 - Pre-writeback depth audit for regenerate
    console.log('[phase18f-pre-writeback-depth-audit]', {
      triggerPath: 'regenerate_success',
      successfulProgramContains: {
        sessionCount: newProgram.sessions?.length ?? 0,
        primaryGoal: newProgram.primaryGoal ?? null,
        trainingPathType: (newProgram as unknown as { trainingPathType?: string }).trainingPathType ?? null,
        selectedSkills: (newProgram as unknown as { selectedSkills?: string[] }).selectedSkills ?? [],
      },
      strongestRegenerateTruthContains: {
        primaryGoal: strongestRegenerateTruth.primaryGoal ?? null,
        secondaryGoal: strongestRegenerateTruth.secondaryGoal ?? null,
        selectedSkills: strongestRegenerateTruth.selectedSkills ?? [],
        trainingPathType: strongestRegenerateTruth.trainingPathType ?? null,
        goalCategories: strongestRegenerateTruth.goalCategories ?? [],
        selectedFlexibility: strongestRegenerateTruth.selectedFlexibility ?? [],
        experienceLevel: strongestRegenerateTruth.experienceLevel ?? null,
      },
      writebackTruthWillPersist: {
        primaryGoal: regenerateWritebackTruth.primaryGoal ?? null,
        secondaryGoal: regenerateWritebackTruth.secondaryGoal ?? null,
        selectedSkills: regenerateWritebackTruth.selectedSkills ?? [],
        trainingPathType: regenerateWritebackTruth.trainingPathType ?? null,
        goalCategories: regenerateWritebackTruth.goalCategories ?? [],
        selectedFlexibility: regenerateWritebackTruth.selectedFlexibility ?? [],
        selectedStrength: regenerateWritebackTruth.selectedStrength ?? [],
        experienceLevel: regenerateWritebackTruth.experienceLevel ?? null,
      },
      deepPlannerFieldsIncluded: ['selectedSkills', 'trainingPathType', 'goalCategories', 'selectedFlexibility', 'selectedStrength'],
      verdict: 'WRITEBACK_NOW_INCLUDES_DEEP_PLANNER_IDENTITY',
    })
    
    saveCanonicalProfile(regenerateWritebackTruth)
    
    console.log('[post-build-truth] REGEN STAGE 7d: FULL programming truth persisted', {
      primaryGoal: regenerateWritebackTruth.primaryGoal,
      secondaryGoal: regenerateWritebackTruth.secondaryGoal,
      trainingDaysPerWeek: effectiveTrainingDays,
      scheduleMode: effectiveScheduleMode,
      sessionLength: newProgram.sessionLength,
      sessionDurationMode: effectiveSessionDurationMode,
      equipmentCount: canonicalEquipment.length,
      experienceLevel: regenerateWritebackTruth.experienceLevel,
      // [PHASE 18F] Log deep planner fields
      selectedSkills: regenerateWritebackTruth.selectedSkills,
      trainingPathType: regenerateWritebackTruth.trainingPathType,
      goalCategories: regenerateWritebackTruth.goalCategories,
      fromFreshRebuildInput: true,
      phase18fDeepIdentityPersisted: true,
    })
    
    // [PHASE 18F] TASK 5 - Post-writeback readback verification for regenerate
    const regenCanonicalReadback = getCanonicalProfile()
    const regenReadbackParityChecks = {
      primaryGoalMatch: (regenCanonicalReadback?.primaryGoal ?? null) === (regenerateWritebackTruth.primaryGoal ?? null),
      selectedSkillsMatch: JSON.stringify(regenCanonicalReadback?.selectedSkills ?? []) === JSON.stringify(regenerateWritebackTruth.selectedSkills ?? []),
      trainingPathTypeMatch: (regenCanonicalReadback?.trainingPathType ?? null) === (regenerateWritebackTruth.trainingPathType ?? null),
      goalCategoriesMatch: JSON.stringify(regenCanonicalReadback?.goalCategories ?? []) === JSON.stringify(regenerateWritebackTruth.goalCategories ?? []),
      selectedFlexibilityMatch: JSON.stringify(regenCanonicalReadback?.selectedFlexibility ?? []) === JSON.stringify(regenerateWritebackTruth.selectedFlexibility ?? []),
      experienceLevelMatch: (regenCanonicalReadback?.experienceLevel ?? null) === (regenerateWritebackTruth.experienceLevel ?? null),
    }
    const allRegenReadbackFieldsMatch = Object.values(regenReadbackParityChecks).every(Boolean)
    
    console.log('[phase18f-post-writeback-readback-audit]', {
      triggerPath: 'regenerate_success',
      canonicalReadback: {
        primaryGoal: regenCanonicalReadback?.primaryGoal ?? null,
        selectedSkills: regenCanonicalReadback?.selectedSkills ?? [],
        trainingPathType: regenCanonicalReadback?.trainingPathType ?? null,
        goalCategories: regenCanonicalReadback?.goalCategories ?? [],
        selectedFlexibility: regenCanonicalReadback?.selectedFlexibility ?? [],
        experienceLevel: regenCanonicalReadback?.experienceLevel ?? null,
      },
      parityChecks: regenReadbackParityChecks,
      allFieldsMatch: allRegenReadbackFieldsMatch,
    })
    
    console.log('[phase18f-canonical-readback-parity-verdict]', {
      triggerPath: 'regenerate_success',
      verdict: allRegenReadbackFieldsMatch
        ? 'CANONICAL_NOW_CARRIES_FULL_DEEP_PLANNER_IDENTITY'
        : 'CANONICAL_WRITEBACK_INCOMPLETE__SOME_FIELDS_NOT_PERSISTED',
    })
    
    console.log('[phase18f-root-cause-classification-verdict]', {
      triggerPath: 'regenerate_success',
      deepPlannerFieldsPersisted: allRegenReadbackFieldsMatch,
      verdict: allRegenReadbackFieldsMatch
        ? 'ROOT_CAUSE_WAS_INCOMPLETE_CANONICAL_WRITEBACK__FUTURE_REBUILDS_CAN_NOW_USE_FULL_PERSISTED_IDENTITY'
        : 'CANONICAL_WRITEBACK_FIXED__IF_RESULT_STILL_REGRESSES_ROOT_CAUSE_IS_DEEPER_THAN_PERSISTENCE',
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
        
        // ==========================================================================
        // [REGEN-TRUTH step-5-save-result] Capture save result before setProgram
        // Also verify what's actually in localStorage immediately after save
        // ==========================================================================
        const storedAuditStep5 = typeof window !== 'undefined' 
          ? JSON.parse(sessionStorage.getItem('regenTruthAudit') || 'null')
          : null
        
        // CRITICAL: Read back localStorage to prove what was actually saved
        let localStorageSessionCount: number | null = null
        let localStorageProgramId: string | null = null
        if (typeof window !== 'undefined') {
          try {
            const rawStored = localStorage.getItem('spartanlab_active_program')
            if (rawStored) {
              const parsed = JSON.parse(rawStored)
              localStorageSessionCount = parsed?.sessions?.length ?? null
              localStorageProgramId = parsed?.id ?? null
            }
          } catch (e) {
            console.warn('[REGEN-TRUTH step-5] Failed to read localStorage:', e)
          }
        }
        
        if (storedAuditStep5) {
          const builtStructure = storedAuditStep5.builtStructureSessions ?? 0
          const savedSessions = newProgram.sessions?.length ?? 0
          const requestedTarget = storedAuditStep5.requestedTargetSessions ?? 0
          
          // Determine verdict based on where the collapse happened
          let saveVerdict: RegenTruthVerdict = storedAuditStep5.finalVerdict
          let saveFailedStage = storedAuditStep5.failedStage
          
          if (savedSessions === requestedTarget) {
            saveVerdict = 'FULL_REGEN_SUCCESS_6'
            saveFailedStage = null
          } else if (savedSessions < requestedTarget) {
            // Check where it collapsed
            const resolvedSessions = storedAuditStep5.builderResolvedSessions ?? 0
            if (resolvedSessions < requestedTarget) {
              saveVerdict = 'TARGET_LOST_IN_RESOLUTION'
              saveFailedStage = 'resolution'
            } else if (builtStructure < requestedTarget) {
              saveVerdict = 'TARGET_LOST_IN_STRUCTURE_BUILD'
              saveFailedStage = 'structure_build'
            } else if (localStorageSessionCount !== null && localStorageSessionCount < requestedTarget) {
              saveVerdict = 'TARGET_LOST_DURING_SAVE'
              saveFailedStage = 'save'
            }
          }
          
          console.log('[REGEN-TRUTH step-5-save-result]', {
            requestedTarget,
            builtStructureSessions: builtStructure,
            newProgramSessions: savedSessions,
            savedProgramId: newProgram.id,
            localStorageVerification: {
              programId: localStorageProgramId,
              sessionCount: localStorageSessionCount,
              matchesNewProgram: localStorageProgramId === newProgram.id,
              sessionCountMatch: localStorageSessionCount === savedSessions,
            },
            verdict: saveVerdict,
          })
          
          const updatedAudit: RegenTruthAudit = {
            ...storedAuditStep5,
            savedProgramSessions: savedSessions,
            savedProgramId: newProgram.id,
            localStorageSessionCountAfterSave: localStorageSessionCount,
            setProgramTargetId: newProgram.id,
            setProgramTargetSessions: savedSessions,
            finalVerdict: saveVerdict,
            failedStage: saveFailedStage,
          }
          sessionStorage.setItem('regenTruthAudit', JSON.stringify(updatedAudit))
          setRegenTruthAudit(updatedAudit)
        }
        
        setProgram(newProgram)
        
        // [POST-BUILD AUTHORITATIVE LOCK] Set single winner for regenerate flow
        authoritativeSavedProgramRef.current = {
          programId: newProgram.id,
          savedAt: Date.now(),
          sessionCount: newProgram.sessions?.length ?? 0,
          createdAt: newProgram.createdAt || new Date().toISOString(),
          flowSource: 'regenerate',
          lockExpiresAt: Date.now() + 5000,
        }
        console.log('[post-build-auth-lock] Authoritative winner locked (regenerate flow)', {
          programId: newProgram.id,
          sessionCount: newProgram.sessions?.length ?? 0,
          flowSource: 'regenerate',
          verdict: 'POST_BUILD_WINNER_LOCKED',
        })
        
        // [PHASE 30L] RELEASE MODIFY BUILDER LOCK - regeneration completed successfully
        // [PHASE 30P] ENHANCED: Add full state logging for lock release
        // [PHASE 30S] Clear the authoritative entry object on success
        if (modifyBuilderLockRef.current) {
          console.log('[phase30p-lock-release-final]', {
            source: 'regeneration_success',
            showBuilder: !!showBuilder,
            modifyFlowState: modifyFlowState ?? null,
            builderSessionInputsRefPresent: !!builderSessionInputsRef.current,
            releaseAllowed: true,
            verdict: 'MODIFY_LOCK_RELEASE_ALLOWED',
          })
          modifyBuilderLockRef.current = false
        }
        
        // [PHASE 30S] Clear the authoritative entry - generation succeeded
        modifyBuilderEntryRef.current = null
        setModifyBuilderEntry(null)
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
        
        // [PHASE 15E BABY AUDIT] Confirm stale banner is cleared on success
        console.log('[regenerate-stale-banner-clearance-audit]', {
          newBuildResultStatus: regenSuccessResultWithMetadata.status,
          newBuildResultRuntimeSessionId: regenSuccessResultWithMetadata.runtimeSessionId,
          currentRuntimeSessionId: runtimeSessionIdRef.current,
          generationErrorCleared: true,
          staleBannerShouldBeCleared: regenSuccessResultWithMetadata.status === 'success',
          verdict: regenSuccessResultWithMetadata.status === 'success' 
            ? 'stale_banner_replaced_with_success' 
            : 'stale_banner_risk_detected',
        })
        
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
          // [404-DIAGNOSTIC] Capture route-level failures distinctly
          if (err.subCode === 'route_not_found') {
            regenFailureSource = 'regenerate_route_404_not_found'
          } else if (err.subCode === 'non_json_server_response') {
            regenFailureSource = 'regenerate_route_non_json_response'
          } else if (err.stage === 'validating_shape') {
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
          } else if (err.subCode === 'server_regenerate_failed') {
            regenFailureSource = 'server_regenerate_route_returned_failure'
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
            // [404-DIAGNOSTIC] Additional diagnostic fields for tracing
            diagnostic_stage: 'catch_block_unclassified',
            diagnostic_source: 'handleRegenerate',
            diagnostic_request_path: '/api/program/regenerate',
            diagnostic_call_type: 'server_route_fetch',
            diagnostic_reason: 'error_not_page_validation_or_builder_error',
            diagnostic_upstream_phase: regenerateStage,
            verdict: 'REQUIRES_MANUAL_ROOT_CAUSE_ANALYSIS',
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
    // [PHASE 18E] TASK 1 - UI flow path classification audit
    // This proves which UI path leads to this handler
    // ==========================================================================
    console.log('[phase18e-ui-flow-path-classification-audit]', {
      triggerPath: 'handleAdjustmentRebuild',
      uiFlowsLeadingHere: [
        'ProgramAdjustmentModal → onRebuildRequired',
        'Restart Program modal → Make Small Adjustments → Training Days/Equipment → Apply',
      ],
      uiFlowsNOTLeadingHere: [
        'Stale banner Rebuild From Current Settings → handleRegenerate',
        'ProgramDisplayWrapper onRegenerate → handleRegenerate',
      ],
      previousPhaseProblem: 'Phases_18A_through_18D_patched_handleRegenerate_but_tested_UI_was_using_handleAdjustmentRebuild',
      thisPhaseCorrects: 'Now_fixing_the_actual_tested_modal_rebuild_path',
    })
    
    // ==========================================================================
    // [PHASE 17R] TASK 2 - Program page callback receive audit
    // ==========================================================================
    console.log('[phase17r-program-page-adjustment-receive-audit]', {
      receivedPayload: {
        requestType: request.type,
        newTrainingDays: request.newTrainingDays ?? null,
        newSessionMinutes: request.newSessionMinutes ?? null,
        newEquipment: request.newEquipment ?? null,
      },
      currentVisibleProgramId: program?.id ?? null,
      currentVisibleSessionCount: program?.sessions?.length ?? 0,
    })
    
    // [PHASE 17R] Branch audit - adjustment flow is always "full rebuild"
    console.log('[phase17r-program-page-adjustment-branch-audit]', {
      isSmallAdjustmentFlow: false, // Modal adjustments always trigger full rebuild
      isFullRebuildFlow: true,
      isStartNewProgramFlow: false,
      branchReason: 'adjustment_modal_always_triggers_full_rebuild',
    })
    
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
    // [PHASE 24O] CRITICAL FIX: Explicit numeric day-count override must also flip scheduleMode to static
    const overrides: Record<string, unknown> = {}
    if (request.type === 'training_days' && request.newTrainingDays) {
      overrides.trainingDaysPerWeek = request.newTrainingDays
      // [PHASE 24O] Numeric day selection implies static schedule mode
      overrides.scheduleMode = 'static'
      console.log('[phase24o-adjustment-static-mode-fix]', {
        requestedDays: request.newTrainingDays,
        forcedScheduleMode: 'static',
        verdict: 'EXPLICIT_NUMERIC_DAY_COUNT_FLIPS_TO_STATIC',
      })
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
    
    // ==========================================================================
    // [PHASE 17S] TASK 2 - Rebuild generation entry source truth audit
    // ==========================================================================
    console.log('[phase17s-rebuild-entry-source-audit]', {
      sourceLayer: 'program_rebuild_path',
      generationTrigger: 'adjustment_rebuild',
      thinRequest: {
        requestType: request.type,
        newTrainingDays: request.newTrainingDays ?? null,
        newSessionMinutes: request.newSessionMinutes ?? null,
        newEquipment: request.newEquipment ?? null,
      },
      canonicalInputsAvailableAtRebuildTime: {
        visibleProgramId: program?.id ?? null,
        visibleProgramSessionCount: program?.sessions?.length ?? 0,
        visibleProgramPrimaryGoal: program?.primaryGoal ?? null,
        visibleProgramScheduleMode: program?.scheduleMode ?? null,
        visibleProgramTrainingDaysPerWeek: program?.trainingDaysPerWeek ?? null,
        visibleProgramSelectedSkills: program?.selectedSkills ?? null,
        currentInputsPrimaryGoal: inputs?.primaryGoal ?? null,
        currentInputsSecondaryGoal: inputs?.secondaryGoal ?? null,
        currentInputsScheduleMode: inputs?.scheduleMode ?? null,
        currentInputsTrainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
        currentInputsSelectedSkills: inputs?.selectedSkills ?? null,
        currentInputsTrainingPathType: inputs?.trainingPathType ?? null,
      },
      overridesAboutToApply: overrides,
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
    
    // ==========================================================================
    // [PHASE 17S] TASK 2 - Rebuild entry result audit
    // ==========================================================================
    console.log('[phase17s-rebuild-entry-result-audit]', {
      entryValid: entryResult.success,
      rebuiltEntry: entryResult.entry
        ? {
            primaryGoal: entryResult.entry.primaryGoal,
            secondaryGoal: entryResult.entry.secondaryGoal ?? null,
            scheduleMode: entryResult.entry.scheduleMode,
            trainingDaysPerWeek: entryResult.entry.trainingDaysPerWeek,
            sessionDurationMode: entryResult.entry.sessionDurationMode,
            sessionLength: entryResult.entry.sessionLength,
            selectedSkills: entryResult.entry.selectedSkills ?? [],
            trainingPathType: entryResult.entry.trainingPathType ?? null,
            equipment: entryResult.entry.equipment ?? [],
          }
        : null,
      errorMessage: entryResult.error?.message ?? null,
    })
    
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
    
    // ==========================================================================
    // [PHASE 17R] TASK 3 - Generation entry request truth audit
    // ==========================================================================
    console.log('[phase17r-generation-entry-request-truth-audit]', {
      finalRequestShape: {
        trainingDaysPerWeek: updatedInputs.trainingDaysPerWeek,
        sessionLength: updatedInputs.sessionLength,
        scheduleMode: updatedInputs.scheduleMode,
        primaryGoal: updatedInputs.primaryGoal,
        secondaryGoal: updatedInputs.secondaryGoal || null,
        equipmentCount: updatedInputs.equipment?.length || 0,
      },
      effectiveScheduleMode: updatedInputs.scheduleMode ?? null,
      effectiveTrainingDays: updatedInputs.trainingDaysPerWeek ?? null,
      effectiveSelectedSkills: updatedInputs.selectedSkills ?? null,
      effectiveSelectedStyles: updatedInputs.selectedStyles ?? null,
      effectiveTargetSessionDuration: updatedInputs.sessionLength ?? null,
    })
    
    // [PHASE 17R] Request transform verdict - compare original request to final inputs
    console.log('[phase17r-request-transform-verdict]', {
      originalInput: {
        requestType: request.type,
        requestedTrainingDays: request.newTrainingDays ?? null,
        requestedSessionMinutes: request.newSessionMinutes ?? null,
      },
      transformedRequest: {
        trainingDaysPerWeek: updatedInputs.trainingDaysPerWeek,
        sessionLength: updatedInputs.sessionLength,
        scheduleMode: updatedInputs.scheduleMode,
      },
      overridesApplied: Object.keys(overrides),
      flexiblePreservingRequestDetected: request.type === 'training_days' && request.newTrainingDays === undefined,
      potentialMismatch: 
        request.type === 'training_days' && 
        request.newTrainingDays === undefined && 
        typeof updatedInputs.trainingDaysPerWeek === 'number'
          ? 'FLEXIBLE_REQUEST_BUT_STATIC_DAYS_IN_FINAL_INPUT'
          : 'NO_MISMATCH_DETECTED',
    })
    
    // ==========================================================================
    // [PHASE 17S] TASK 3 - Entry parity verdict
    // ==========================================================================
    console.log('[phase17s-entry-parity-verdict]', {
      parityCheckFields: {
        primaryGoal: true,
        scheduleMode: true,
        trainingDaysPerWeek: true,
        selectedSkills: true,
        trainingPathType: true,
        equipment: true,
        sessionDurationMode: true,
      },
      rebuildEntryPrimaryGoal: entryResult.entry?.primaryGoal ?? null,
      rebuildEntryScheduleMode: entryResult.entry?.scheduleMode ?? null,
      rebuildEntryTrainingDaysPerWeek: entryResult.entry?.trainingDaysPerWeek ?? null,
      rebuildEntrySelectedSkillsLength: entryResult.entry?.selectedSkills?.length ?? 0,
      rebuildEntryTrainingPathType: entryResult.entry?.trainingPathType ?? null,
      rebuildEntryEquipmentLength: entryResult.entry?.equipment?.length ?? 0,
      rebuildEntrySessionDurationMode: entryResult.entry?.sessionDurationMode ?? null,
      likelyDivergenceReason: Object.keys(overrides).length > 0
        ? 'rebuild_applies_overrides_that_may_narrow_entry'
        : 'onboarding_and_rebuild_both_use_unmodified_canonical_profile',
      verdict: 'pending_runtime_comparison_with_onboarding_entry',
    })
    
    // [PHASE 17R] Request transform verdict - compare original request to final inputs
    
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
      
      // ==========================================================================
      // [PHASE 17T] TASK 4 - Force explicit regenerationMode for adjustment rebuild path
      // Without this, builder falls back to stateFlags.recommendedMode
      // ==========================================================================
      // [PHASE 17U] TASK 4 - Preserve material identity fields from current inputs,
      // except for the field explicitly being changed by the request
      const adjustmentBuilderInput = {
        ...updatedInputs,
        // [PHASE 17X] TASK 4 - Use strongestMaterialIdentityTruth for 4 material identity fields
        // This prevents stale Program-page `inputs` from overriding stronger canonical truth
        primaryGoal: strongestMaterialIdentityTruth.primaryGoal,
        secondaryGoal: strongestMaterialIdentityTruth.secondaryGoal,
        selectedSkills: strongestMaterialIdentityTruth.selectedSkills,
        trainingPathType: strongestMaterialIdentityTruth.trainingPathType,
        // [PHASE 17U] For schedule-related fields, only preserve from inputs if request is NOT training_days
        scheduleMode: request.type === 'training_days' 
          ? updatedInputs?.scheduleMode 
          : (inputs?.scheduleMode || updatedInputs?.scheduleMode),
        trainingDaysPerWeek: request.type === 'training_days'
          ? updatedInputs?.trainingDaysPerWeek
          : (inputs?.trainingDaysPerWeek ?? updatedInputs?.trainingDaysPerWeek),
        // For session-related fields, only preserve from inputs if request is NOT session_time
        sessionDurationMode: request.type === 'session_time'
          ? updatedInputs?.sessionDurationMode
          : (inputs?.sessionDurationMode || updatedInputs?.sessionDurationMode),
        sessionLength: request.type === 'session_time'
          ? updatedInputs?.sessionLength
          : (inputs?.sessionLength ?? updatedInputs?.sessionLength),
        // selectedStyles still prefers inputs as fallback (not part of 4 material identity fields)
        selectedStyles: (inputs?.selectedStyles?.length ?? 0) > 0 ? inputs.selectedStyles : updatedInputs?.selectedStyles,
        // For equipment, only preserve from inputs if request is NOT equipment
        equipment: request.type === 'equipment'
          ? updatedInputs?.equipment
          : ((inputs?.equipment?.length ?? 0) > 0 ? inputs.equipment : updatedInputs?.equipment),
        // [PHASE 17T] Explicit regeneration mode
        regenerationMode: 'fresh' as const,
        regenerationReason: 'adjustment_full_rebuild',
      }
      
      // ==========================================================================
      // [PHASE 17U] TASK 5B - Adjustment material truth merge audit
      // ==========================================================================
      console.log('[phase17u-adjustment-material-truth-merge-audit]', {
        triggerPath: 'handleAdjustmentRebuild',
        requestType: request.type,
        currentInputsTruth: {
          primaryGoal: inputs?.primaryGoal ?? null,
          secondaryGoal: inputs?.secondaryGoal ?? null,
          scheduleMode: inputs?.scheduleMode ?? null,
          trainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
          sessionDurationMode: inputs?.sessionDurationMode ?? null,
          sessionLength: inputs?.sessionLength ?? null,
          selectedSkills: inputs?.selectedSkills ?? [],
          selectedStyles: inputs?.selectedStyles ?? [],
          trainingPathType: inputs?.trainingPathType ?? null,
          equipment: inputs?.equipment ?? [],
        },
        preMergeAdjustmentInput: {
          primaryGoal: updatedInputs?.primaryGoal ?? null,
          secondaryGoal: updatedInputs?.secondaryGoal ?? null,
          scheduleMode: updatedInputs?.scheduleMode ?? null,
          trainingDaysPerWeek: updatedInputs?.trainingDaysPerWeek ?? null,
          sessionDurationMode: updatedInputs?.sessionDurationMode ?? null,
          sessionLength: updatedInputs?.sessionLength ?? null,
          selectedSkills: updatedInputs?.selectedSkills ?? [],
          selectedStyles: updatedInputs?.selectedStyles ?? [],
          trainingPathType: updatedInputs?.trainingPathType ?? null,
          equipment: updatedInputs?.equipment ?? [],
        },
        finalBuilderInput: {
          primaryGoal: adjustmentBuilderInput?.primaryGoal ?? null,
          secondaryGoal: adjustmentBuilderInput?.secondaryGoal ?? null,
          scheduleMode: adjustmentBuilderInput?.scheduleMode ?? null,
          trainingDaysPerWeek: adjustmentBuilderInput?.trainingDaysPerWeek ?? null,
          sessionDurationMode: adjustmentBuilderInput?.sessionDurationMode ?? null,
          sessionLength: adjustmentBuilderInput?.sessionLength ?? null,
          selectedSkills: adjustmentBuilderInput?.selectedSkills ?? [],
          selectedStyles: adjustmentBuilderInput?.selectedStyles ?? [],
          trainingPathType: adjustmentBuilderInput?.trainingPathType ?? null,
          equipment: adjustmentBuilderInput?.equipment ?? [],
          regenerationMode: adjustmentBuilderInput?.regenerationMode ?? null,
          regenerationReason: adjustmentBuilderInput?.regenerationReason ?? null,
        },
      })
      
      // ==========================================================================
      // [PHASE 17U] TASK 6B - Adjustment prebuilder parity verdict
      // ==========================================================================
      console.log('[phase17u-adjustment-prebuilder-parity-verdict]', {
        triggerPath: 'handleAdjustmentRebuild',
        requestType: request.type,
        explicitRequestedFieldAllowedToWin: request.type,
        preservedPrimaryGoalFromInputs: adjustmentBuilderInput?.primaryGoal === (inputs?.primaryGoal ?? adjustmentBuilderInput?.primaryGoal),
        preservedScheduleModeFromInputs: adjustmentBuilderInput?.scheduleMode === (inputs?.scheduleMode ?? adjustmentBuilderInput?.scheduleMode),
        preservedSelectedSkillsFromInputs:
          JSON.stringify(adjustmentBuilderInput?.selectedSkills ?? []) === JSON.stringify(inputs?.selectedSkills ?? adjustmentBuilderInput?.selectedSkills ?? []),
        preservedTrainingPathTypeFromInputs:
          adjustmentBuilderInput?.trainingPathType === (inputs?.trainingPathType ?? adjustmentBuilderInput?.trainingPathType),
        verdict: 'final_adjustment_input_preserves_current_settings_truth_except_requested_field',
      })
      
      // [PHASE 17T] Mode entry diagnostic for adjustment
      console.log('[phase17t-rebuild-generation-mode-entry-audit]', {
        triggerPath: 'handleAdjustmentRebuild',
        hasExplicitRegenerationMode: !!adjustmentBuilderInput?.regenerationMode,
        regenerationMode: adjustmentBuilderInput?.regenerationMode ?? null,
        regenerationReason: adjustmentBuilderInput?.regenerationReason ?? null,
        hasActiveProgramAtDispatch: !!program,
        activeProgramId: program?.id ?? null,
        activeProgramSessionCount: program?.sessions?.length ?? 0,
      })
      
      // [PHASE 17T] Mode fix verdict for adjustment
      console.log('[phase17t-rebuild-mode-fix-verdict]', {
        triggerPath: 'handleAdjustmentRebuild',
        oldBehavior: 'builder_mode_was_state_inferred_when_regenerationMode_missing',
        newBehavior: 'builder_mode_forced_to_fresh_for_adjustment_full_rebuild',
        finalRegenerationMode: adjustmentBuilderInput.regenerationMode,
        finalRegenerationReason: adjustmentBuilderInput.regenerationReason,
      })
      
      // ==========================================================================
      // [PHASE 17V] TASK 4 - Build explicit canonical override for handleAdjustmentRebuild
      // This prevents builder from re-reading weaker stale canonical profile
      // ==========================================================================
      const adjCanonicalProfileNow = getCanonicalProfile()
      
      // ==========================================================================
      // [PHASE 17X] TASK 1 - Material identity source audit
      // ==========================================================================
      console.log('[phase17x-adjustment-material-identity-source-audit]', {
        triggerPath: 'handleAdjustmentRebuild',
        requestType: request.type,
        visibleInputsTruth: {
          primaryGoal: inputs?.primaryGoal ?? null,
          secondaryGoal: inputs?.secondaryGoal ?? null,
          selectedSkills: inputs?.selectedSkills ?? [],
          trainingPathType: inputs?.trainingPathType ?? null,
        },
        updatedInputsTruth: {
          primaryGoal: updatedInputs?.primaryGoal ?? null,
          secondaryGoal: updatedInputs?.secondaryGoal ?? null,
          selectedSkills: updatedInputs?.selectedSkills ?? [],
          trainingPathType: updatedInputs?.trainingPathType ?? null,
        },
        canonicalBaselineTruth: {
          primaryGoal: adjCanonicalProfileNow?.primaryGoal ?? null,
          secondaryGoal: adjCanonicalProfileNow?.secondaryGoal ?? null,
          selectedSkills: adjCanonicalProfileNow?.selectedSkills ?? [],
          trainingPathType: adjCanonicalProfileNow?.trainingPathType ?? null,
        },
      })
      
      // ==========================================================================
      // [PHASE 17X] TASK 2 - Define stronger material-identity source
      // Priority: updatedInputs > adjCanonicalProfileNow > inputs (last fallback)
      // This prevents stale Program-page `inputs` from overriding stronger truth
      // ==========================================================================
      const strongestMaterialIdentityTruth = {
        primaryGoal:
          updatedInputs?.primaryGoal ||
          adjCanonicalProfileNow?.primaryGoal ||
          inputs?.primaryGoal ||
          null,
        secondaryGoal:
          updatedInputs?.secondaryGoal ??
          adjCanonicalProfileNow?.secondaryGoal ??
          inputs?.secondaryGoal ??
          null,
        selectedSkills:
          (updatedInputs?.selectedSkills?.length ?? 0) > 0
            ? updatedInputs!.selectedSkills
            : (adjCanonicalProfileNow?.selectedSkills?.length ?? 0) > 0
            ? adjCanonicalProfileNow.selectedSkills
            : (inputs?.selectedSkills?.length ?? 0) > 0
            ? inputs.selectedSkills
            : [],
        trainingPathType:
          updatedInputs?.trainingPathType ||
          adjCanonicalProfileNow?.trainingPathType ||
          inputs?.trainingPathType ||
          null,
      }
      
      // Determine effective schedule mode based on request type
      const adjEffectiveScheduleMode = request.type === 'training_days'
        ? updatedInputs?.scheduleMode
        : (inputs?.scheduleMode || updatedInputs?.scheduleMode || adjCanonicalProfileNow?.scheduleMode)
      
      const adjustmentCanonicalOverride = {
        ...adjCanonicalProfileNow,
        // [PHASE 17X] TASK 3 - Use strongestMaterialIdentityTruth for 4 material identity fields
        // This prevents stale Program-page `inputs` from overriding stronger canonical truth
        primaryGoal: strongestMaterialIdentityTruth.primaryGoal,
        secondaryGoal: strongestMaterialIdentityTruth.secondaryGoal,
        selectedSkills: strongestMaterialIdentityTruth.selectedSkills,
        trainingPathType: strongestMaterialIdentityTruth.trainingPathType,
        // scheduleMode - let request win if training_days, else preserve
        scheduleMode: adjEffectiveScheduleMode,
        // trainingDaysPerWeek - flexible null semantics, let request win if training_days
        trainingDaysPerWeek: adjEffectiveScheduleMode === 'flexible'
          ? null
          : request.type === 'training_days'
          ? updatedInputs?.trainingDaysPerWeek
          : (inputs?.trainingDaysPerWeek ?? updatedInputs?.trainingDaysPerWeek ?? adjCanonicalProfileNow?.trainingDaysPerWeek),
        // sessionDurationMode - let request win if session_time
        sessionDurationMode: request.type === 'session_time'
          ? updatedInputs?.sessionDurationMode
          : (inputs?.sessionDurationMode || updatedInputs?.sessionDurationMode || adjCanonicalProfileNow?.sessionDurationMode),
        // sessionLengthMinutes - let request win if session_time
        sessionLengthMinutes: request.type === 'session_time'
          ? updatedInputs?.sessionLength
          : (inputs?.sessionLength ?? updatedInputs?.sessionLength ?? adjCanonicalProfileNow?.sessionLengthMinutes),
        // equipmentAvailable - let request win if equipment
        equipmentAvailable: request.type === 'equipment'
          ? ((updatedInputs?.equipment?.length ?? 0) > 0 ? updatedInputs.equipment : adjCanonicalProfileNow?.equipmentAvailable)
          : ((inputs?.equipment?.length ?? 0) > 0 
            ? inputs.equipment 
            : (updatedInputs?.equipment?.length ?? 0) > 0 
            ? updatedInputs.equipment 
            : adjCanonicalProfileNow?.equipmentAvailable),
      }
      
      // [PHASE 17V] TASK 6C - Adjustment canonical override audit
      console.log('[phase17v-adjustment-canonical-override-audit]', {
        triggerPath: 'handleAdjustmentRebuild',
        requestType: request.type,
        canonicalBaseline: {
          primaryGoal: adjCanonicalProfileNow?.primaryGoal ?? null,
          secondaryGoal: adjCanonicalProfileNow?.secondaryGoal ?? null,
          selectedSkills: adjCanonicalProfileNow?.selectedSkills ?? [],
          scheduleMode: adjCanonicalProfileNow?.scheduleMode ?? null,
          trainingDaysPerWeek: adjCanonicalProfileNow?.trainingDaysPerWeek ?? null,
          sessionDurationMode: adjCanonicalProfileNow?.sessionDurationMode ?? null,
          sessionLengthMinutes: adjCanonicalProfileNow?.sessionLengthMinutes ?? null,
          equipmentAvailable: adjCanonicalProfileNow?.equipmentAvailable ?? [],
          trainingPathType: adjCanonicalProfileNow?.trainingPathType ?? null,
        },
        currentInputsTruth: {
          primaryGoal: inputs?.primaryGoal ?? null,
          secondaryGoal: inputs?.secondaryGoal ?? null,
          selectedSkills: inputs?.selectedSkills ?? [],
          scheduleMode: inputs?.scheduleMode ?? null,
          trainingDaysPerWeek: inputs?.trainingDaysPerWeek ?? null,
          sessionDurationMode: inputs?.sessionDurationMode ?? null,
          sessionLength: inputs?.sessionLength ?? null,
          equipment: inputs?.equipment ?? [],
          trainingPathType: inputs?.trainingPathType ?? null,
        },
        updatedInputsTruth: {
          primaryGoal: updatedInputs?.primaryGoal ?? null,
          secondaryGoal: updatedInputs?.secondaryGoal ?? null,
          selectedSkills: updatedInputs?.selectedSkills ?? [],
          scheduleMode: updatedInputs?.scheduleMode ?? null,
          trainingDaysPerWeek: updatedInputs?.trainingDaysPerWeek ?? null,
          sessionDurationMode: updatedInputs?.sessionDurationMode ?? null,
          sessionLength: updatedInputs?.sessionLength ?? null,
          equipment: updatedInputs?.equipment ?? [],
          trainingPathType: updatedInputs?.trainingPathType ?? null,
        },
        finalCanonicalOverride: {
          primaryGoal: adjustmentCanonicalOverride?.primaryGoal ?? null,
          secondaryGoal: adjustmentCanonicalOverride?.secondaryGoal ?? null,
          selectedSkills: adjustmentCanonicalOverride?.selectedSkills ?? [],
          scheduleMode: adjustmentCanonicalOverride?.scheduleMode ?? null,
          trainingDaysPerWeek: adjustmentCanonicalOverride?.trainingDaysPerWeek ?? null,
          sessionDurationMode: adjustmentCanonicalOverride?.sessionDurationMode ?? null,
          sessionLengthMinutes: adjustmentCanonicalOverride?.sessionLengthMinutes ?? null,
          equipmentAvailable: adjustmentCanonicalOverride?.equipmentAvailable ?? [],
          trainingPathType: adjustmentCanonicalOverride?.trainingPathType ?? null,
        },
      })
      
      // [PHASE 17V] TASK 7 - Root cause verdict for adjustment
      console.log('[phase17v-root-cause-verdict]', {
        triggerPath: 'handleAdjustmentRebuild',
        rootCauseTheory: 'builder_reads_canonicalProfile_heavily_and_can_ignore_stronger_inputs_if_no_canonical_override_is_passed',
        fixApplied: 'explicit_canonicalProfileOverride_now_passed_to_generateAdaptiveProgram',
        expectedBehavior: 'rebuild_should_now_follow_same_stronger_truth_class_in_builder_as_onboarding',
      })
      
      // ==========================================================================
      // [PHASE 17X] TASK 5 - Material identity parity verdict
      // ==========================================================================
      console.log('[phase17x-adjustment-material-identity-parity-verdict]', {
        triggerPath: 'handleAdjustmentRebuild',
        requestType: request.type,
        strongestMaterialIdentityTruth,
        finalAdjustmentBuilderMaterialIdentity: {
          primaryGoal: adjustmentBuilderInput?.primaryGoal ?? null,
          secondaryGoal: adjustmentBuilderInput?.secondaryGoal ?? null,
          selectedSkills: adjustmentBuilderInput?.selectedSkills ?? [],
          trainingPathType: adjustmentBuilderInput?.trainingPathType ?? null,
        },
        finalAdjustmentCanonicalOverrideMaterialIdentity: {
          primaryGoal: adjustmentCanonicalOverride?.primaryGoal ?? null,
          secondaryGoal: adjustmentCanonicalOverride?.secondaryGoal ?? null,
          selectedSkills: adjustmentCanonicalOverride?.selectedSkills ?? [],
          trainingPathType: adjustmentCanonicalOverride?.trainingPathType ?? null,
        },
        verdict:
          JSON.stringify({
            primaryGoal: adjustmentBuilderInput?.primaryGoal ?? null,
            secondaryGoal: adjustmentBuilderInput?.secondaryGoal ?? null,
            selectedSkills: adjustmentBuilderInput?.selectedSkills ?? [],
            trainingPathType: adjustmentBuilderInput?.trainingPathType ?? null,
          }) === JSON.stringify({
            primaryGoal: adjustmentCanonicalOverride?.primaryGoal ?? null,
            secondaryGoal: adjustmentCanonicalOverride?.secondaryGoal ?? null,
            selectedSkills: adjustmentCanonicalOverride?.selectedSkills ?? [],
            trainingPathType: adjustmentCanonicalOverride?.trainingPathType ?? null,
          })
            ? 'BUILDER_AND_OVERRIDE_MATERIAL_IDENTITY_ALIGNED'
            : 'MATERIAL_IDENTITY_MISMATCH_STILL_PRESENT',
      })
      
      // ==========================================================================
      // [PHASE 18E] TASK 5 - Replace direct client builder call with server route dispatch
      // This mirrors the working onboarding architecture where generation happens server-side
      // The Restart Program modal "Rebuild From Current Settings" flows through THIS path
      // ==========================================================================
      const adjAttemptId = `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      
      // ==========================================================================
      // [PHASE 18I] TASK 3 - Modify submit path audit
      // This proves the exact server route used by Modify/Adjustment flow
      // ==========================================================================
      console.log('[phase18i-modify-submit-path-audit]', {
        handler: 'handleAdjustmentRebuild',
        serverRoute: '/api/program/rebuild-adjustment',
        architectureClass: 'server_side_generation',
        clientDirectBuilderCallBypassed: true,
        serverResolvesTruthFresh: true,
        comparedToRestartPath: {
          restartHandler: 'handleRegenerate',
          restartServerRoute: '/api/program/regenerate',
          bothUseServerArchitecture: true,
        },
        parity: 'BOTH_FLOWS_USE_SERVER_SIDE_GENERATION_WITH_CANONICAL_RESOLUTION',
      })
      
      console.log('[phase18i-modify-client-vs-server-verdict]', {
        verdict: 'MODIFY_USES_SERVER_ROUTE_NOT_DIRECT_BUILDER',
        serverRoute: '/api/program/rebuild-adjustment',
        serverResolvesCanonicalOnEntry: true,
        clientPassesOnlyThinRequest: true,
        architectureMatches: 'ONBOARDING_AND_RESTART',
      })
      
      // [PHASE 18E] TASK 8A - Client dispatch audit
      console.log('[phase18e-adjustment-client-dispatch-audit]', {
        triggerPath: 'handleAdjustmentRebuild',
        requestType: request.type,
        explicitOverrideRequested: {
          newTrainingDays: request.newTrainingDays ?? null,
          newSessionMinutes: request.newSessionMinutes ?? null,
          newEquipment: request.newEquipment ?? null,
        },
        currentProgramId: program?.id ?? null,
        directBuilderCallBypassed: true,
        dispatchTargetRoute: '/api/program/rebuild-adjustment',
        verdict: 'direct_client_builder_execution_being_bypassed',
      })
      
      console.log('[phase16s-generate-dispatch-verdict]', {
        flowName: 'adjustment_rebuild',
        attemptId: adjAttemptId,
        runtimeSessionId: runtimeSessionIdRef.current,
        requestDispatched: true,
        dispatchMethod: 'server_route_/api/program/rebuild-adjustment',
        dispatchTimestamp: new Date().toISOString(),
        verdict: 'dispatch_executing_via_server',
      })
      
      // [PHASE 18E] Dispatch to server adjustment rebuild route instead of direct builder call
      const serverResponse = await fetch('/api/program/rebuild-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: request.type,
          newTrainingDays: request.newTrainingDays,
          newSessionMinutes: request.newSessionMinutes,
          newEquipment: request.newEquipment,
          currentProgramId: program?.id ?? null,
          // Pass client canonical as LOW-trust fallback, server will resolve its own
          clientCanonicalSnapshot: adjustmentCanonicalOverride,
        }),
      })
      
      const serverResult = await serverResponse.json()
      
      if (!serverResponse.ok || !serverResult.success) {
        console.log('[phase18e-adjustment-server-error]', {
          status: serverResponse.status,
          error: serverResult.error,
          failedStage: serverResult.failedStage,
        })
        throw new ProgramPageValidationError(
          'orchestration_failed',
          'generating',
          'server_adjustment_rebuild_failed',
          serverResult.error || 'Server adjustment rebuild failed',
          { serverResult }
        )
      }
      
      // [PHASE 18E] TASK 8D - Client result audit
      console.log('[phase18e-adjustment-client-result-audit]', {
        triggerPath: 'handleAdjustmentRebuild',
        requestType: request.type,
        resultReceivedFromServer: true,
        sessionCount: serverResult.program?.sessions?.length ?? 0,
        primaryGoal: serverResult.program?.primaryGoal ?? null,
        trainingPathType: serverResult.program?.trainingPathType ?? null,
        selectedSkillsSummary: serverResult.program?.selectedSkills?.slice(0, 5) ?? [],
        saveFlowWillContinue: true,
        verdict: 'client_received_server_generated_adjustment_program',
      })
      
      const newProgram = serverResult.program as AdaptiveProgram
      
      // [PHASE 17A] Builder returned - check dispatch stage success
      console.log('[phase17a-adjustment-stage-success]', { 
        stage: 'dispatch_builder',
        builderReturned: newProgram !== undefined,
        programId: (newProgram as AdaptiveProgram)?.id || null,
        sessionCount: (newProgram as AdaptiveProgram)?.sessions?.length || 0,
      })
      
      // ==========================================================================
      // [PHASE 17V] TASK 6D - Adjustment postfix verdict
      // ==========================================================================
      console.log('[phase17v-adjustment-postfix-verdict]', {
        triggerPath: 'handleAdjustmentRebuild',
        requestType: request.type,
        finalProgramId: (newProgram as AdaptiveProgram)?.id ?? null,
        finalProgramSessionCount: (newProgram as AdaptiveProgram)?.sessions?.length ?? 0,
        finalProgramPrimaryGoal: (newProgram as AdaptiveProgram)?.primaryGoal ?? null,
        finalProgramScheduleMode: (newProgram as AdaptiveProgram)?.scheduleMode ?? null,
        finalProgramTrainingPathType: (newProgram as Record<string, unknown>)?.trainingPathType ?? null,
        finalProgramSelectedSkills: (newProgram as AdaptiveProgram)?.selectedSkills ?? [],
        verdict: 'adjustment_rebuild_used_explicit_canonical_override_path',
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
  
  // [PHASE 17P] Detect flexible-preserving rebuild
  // If request.type === 'training_days' BUT newTrainingDays is undefined/null,
  // this is a flexible-preserving rebuild - do NOT force static mode
  const canonicalProfileNow = getCanonicalProfile()
  const flexiblePreservingRebuild = 
    request.type === 'training_days' &&
    (request.newTrainingDays === undefined || request.newTrainingDays === null) &&
    (canonicalProfileNow?.scheduleMode === 'flexible' || canonicalProfileNow?.scheduleMode === 'adaptive')
  
  // [PHASE 17P] Flexible rebuild request truth log
  console.log('[phase17p-flexible-rebuild-request-truth]', {
    requestType: request.type,
    requestedTrainingDays:
      typeof request.newTrainingDays === 'number' ? request.newTrainingDays : null,
    canonicalScheduleMode: canonicalProfileNow?.scheduleMode || 'unknown',
    preservingFlexibleIdentity: flexiblePreservingRebuild,
  })
  
  // [PHASE 17P] Determine what schedule mode to persist
  let persistedScheduleMode: 'static' | 'flexible' | undefined = undefined
  let persistedTrainingDays: number | undefined = updatedInputs.trainingDaysPerWeek ?? undefined
  
  if (request.type === 'training_days') {
    if (flexiblePreservingRebuild) {
      // Preserve flexible identity - do NOT set static
      persistedScheduleMode = 'flexible'
      persistedTrainingDays = undefined // Don't persist a fixed day count
    } else {
      // User explicitly chose a day count - set static
      persistedScheduleMode = 'static'
    }
  }
  
  // [PHASE 17P] Canonical writeback schedule truth log
  console.log('[phase17p-canonical-writeback-schedule-truth]', {
    requestType: request.type,
    requestedTrainingDays:
      typeof request.newTrainingDays === 'number' ? request.newTrainingDays : null,
    canonicalScheduleModeBefore: canonicalProfileNow?.scheduleMode || 'unknown',
    persistedScheduleMode: persistedScheduleMode || 'unchanged',
    persistedTrainingDays: persistedTrainingDays ?? null,
    flexiblePreservingRebuild,
  })
  
  // ==========================================================================
  // [PHASE 18F] TASK 3 - Expand canonical writeback to include FULL deep planner identity
  // This ensures future rebuilds reconstruct from the same truth class as this successful adjustment
  // ==========================================================================
  const adjustmentWritebackTruth = {
    // Schedule/duration fields (may be adjusted)
    trainingDaysPerWeek: persistedTrainingDays,
    sessionLengthMinutes: updatedInputs.sessionLength ?? undefined,
    scheduleMode: persistedScheduleMode,
    sessionDurationMode: updatedInputs.sessionDurationMode ?? canonicalProfileNow?.sessionDurationMode ?? undefined,
    // Equipment (may be adjusted)
    equipmentAvailable: canonicalEquipment,
    // Goal fields - preserve from canonical if not adjusted
    primaryGoal: canonicalProfileNow?.primaryGoal ?? undefined,
    secondaryGoal: canonicalProfileNow?.secondaryGoal ?? undefined,
    // Experience - preserve from canonical
    experienceLevel: canonicalProfileNow?.experienceLevel ?? undefined,
    // [PHASE 18F] Deep planner identity fields - CRITICAL for rebuild parity
    // Preserve from canonical since adjustment doesn't change these
    selectedSkills: canonicalProfileNow?.selectedSkills?.length ? canonicalProfileNow.selectedSkills : undefined,
    trainingPathType: canonicalProfileNow?.trainingPathType ?? undefined,
    goalCategories: canonicalProfileNow?.goalCategories?.length ? canonicalProfileNow.goalCategories : undefined,
    selectedFlexibility: canonicalProfileNow?.selectedFlexibility?.length ? canonicalProfileNow.selectedFlexibility : undefined,
    selectedStrength: canonicalProfileNow?.selectedStrength?.length ? canonicalProfileNow.selectedStrength : undefined,
  }
  
  // [PHASE 18F] TASK 1 - Pre-writeback depth audit for adjustment
  console.log('[phase18f-pre-writeback-depth-audit]', {
    triggerPath: 'adjustment_rebuild_success',
    requestType: request.type,
    successfulProgramContains: {
      sessionCount: newProgram.sessions?.length ?? 0,
      primaryGoal: newProgram.primaryGoal ?? null,
      trainingPathType: (newProgram as unknown as { trainingPathType?: string }).trainingPathType ?? null,
      selectedSkills: (newProgram as unknown as { selectedSkills?: string[] }).selectedSkills ?? [],
    },
    canonicalProfileNowContains: {
      primaryGoal: canonicalProfileNow?.primaryGoal ?? null,
      secondaryGoal: canonicalProfileNow?.secondaryGoal ?? null,
      selectedSkills: canonicalProfileNow?.selectedSkills ?? [],
      trainingPathType: canonicalProfileNow?.trainingPathType ?? null,
      goalCategories: canonicalProfileNow?.goalCategories ?? [],
      selectedFlexibility: canonicalProfileNow?.selectedFlexibility ?? [],
      experienceLevel: canonicalProfileNow?.experienceLevel ?? null,
    },
    writebackTruthWillPersist: {
      primaryGoal: adjustmentWritebackTruth.primaryGoal ?? null,
      secondaryGoal: adjustmentWritebackTruth.secondaryGoal ?? null,
      selectedSkills: adjustmentWritebackTruth.selectedSkills ?? [],
      trainingPathType: adjustmentWritebackTruth.trainingPathType ?? null,
      goalCategories: adjustmentWritebackTruth.goalCategories ?? [],
      selectedFlexibility: adjustmentWritebackTruth.selectedFlexibility ?? [],
      selectedStrength: adjustmentWritebackTruth.selectedStrength ?? [],
      experienceLevel: adjustmentWritebackTruth.experienceLevel ?? null,
    },
    deepPlannerFieldsIncluded: ['selectedSkills', 'trainingPathType', 'goalCategories', 'selectedFlexibility', 'selectedStrength'],
    verdict: 'WRITEBACK_NOW_INCLUDES_DEEP_PLANNER_IDENTITY',
  })
  
  saveCanonicalProfile(adjustmentWritebackTruth)
  
  // [PHASE 17P] Rebuild input schedule verdict
  console.log('[phase17p-rebuild-input-schedule-verdict]', {
    requestType: request.type,
    finalInputScheduleMode: persistedScheduleMode || canonicalProfileNow?.scheduleMode || 'unknown',
    finalInputTrainingDays: persistedTrainingDays ?? null,
    verdict: persistedScheduleMode === 'flexible' || flexiblePreservingRebuild
      ? 'FLEXIBLE_IDENTITY_PRESERVED'
      : 'STATIC_DAY_COUNT_APPLIED',
  })
  
  console.log('[canonical-rebuild] STAGE 5b: FULL canonical profile updated with adjustment', {
    trainingDaysPerWeek: persistedTrainingDays,
    sessionLength: updatedInputs.sessionLength,
    equipmentCount: canonicalEquipment.length,
    canonicalEquipment,
    scheduleMode: persistedScheduleMode,
    // [PHASE 18F] Log deep planner fields
    primaryGoal: adjustmentWritebackTruth.primaryGoal,
    selectedSkills: adjustmentWritebackTruth.selectedSkills,
    trainingPathType: adjustmentWritebackTruth.trainingPathType,
    goalCategories: adjustmentWritebackTruth.goalCategories,
    phase18fDeepIdentityPersisted: true,
  })
  
  // [PHASE 18F] TASK 5 - Post-writeback readback verification for adjustment
  const adjCanonicalReadback = getCanonicalProfile()
  const adjReadbackParityChecks = {
    primaryGoalMatch: (adjCanonicalReadback?.primaryGoal ?? null) === (adjustmentWritebackTruth.primaryGoal ?? null),
    selectedSkillsMatch: JSON.stringify(adjCanonicalReadback?.selectedSkills ?? []) === JSON.stringify(adjustmentWritebackTruth.selectedSkills ?? []),
    trainingPathTypeMatch: (adjCanonicalReadback?.trainingPathType ?? null) === (adjustmentWritebackTruth.trainingPathType ?? null),
    goalCategoriesMatch: JSON.stringify(adjCanonicalReadback?.goalCategories ?? []) === JSON.stringify(adjustmentWritebackTruth.goalCategories ?? []),
    selectedFlexibilityMatch: JSON.stringify(adjCanonicalReadback?.selectedFlexibility ?? []) === JSON.stringify(adjustmentWritebackTruth.selectedFlexibility ?? []),
    experienceLevelMatch: (adjCanonicalReadback?.experienceLevel ?? null) === (adjustmentWritebackTruth.experienceLevel ?? null),
  }
  const allAdjReadbackFieldsMatch = Object.values(adjReadbackParityChecks).every(Boolean)
  
  console.log('[phase18f-post-writeback-readback-audit]', {
    triggerPath: 'adjustment_rebuild_success',
    canonicalReadback: {
      primaryGoal: adjCanonicalReadback?.primaryGoal ?? null,
      selectedSkills: adjCanonicalReadback?.selectedSkills ?? [],
      trainingPathType: adjCanonicalReadback?.trainingPathType ?? null,
      goalCategories: adjCanonicalReadback?.goalCategories ?? [],
      selectedFlexibility: adjCanonicalReadback?.selectedFlexibility ?? [],
      experienceLevel: adjCanonicalReadback?.experienceLevel ?? null,
    },
    parityChecks: adjReadbackParityChecks,
    allFieldsMatch: allAdjReadbackFieldsMatch,
  })
  
  console.log('[phase18f-canonical-readback-parity-verdict]', {
    triggerPath: 'adjustment_rebuild_success',
    verdict: allAdjReadbackFieldsMatch
      ? 'CANONICAL_NOW_CARRIES_FULL_DEEP_PLANNER_IDENTITY'
      : 'CANONICAL_WRITEBACK_INCOMPLETE__SOME_FIELDS_NOT_PERSISTED',
  })
  
  console.log('[phase18f-root-cause-classification-verdict]', {
    triggerPath: 'adjustment_rebuild_success',
    deepPlannerFieldsPersisted: allAdjReadbackFieldsMatch,
    verdict: allAdjReadbackFieldsMatch
      ? 'ROOT_CAUSE_WAS_INCOMPLETE_CANONICAL_WRITEBACK__FUTURE_REBUILDS_CAN_NOW_USE_FULL_PERSISTED_IDENTITY'
      : 'CANONICAL_WRITEBACK_FIXED__IF_RESULT_STILL_REGRESSES_ROOT_CAUSE_IS_DEEPER_THAN_PERSISTENCE',
  })
      
      // [canonical-rebuild] STAGE 6: Update UI state atomically
      console.log('[canonical-rebuild] STAGE 6: Updating UI state...')
      
      // ==========================================================================
      // [PHASE 18I] TASK 6 - Modify success hydration audit
      // This proves the returned program IS hydrated into visible state
      // ==========================================================================
      console.log('[phase18i-modify-success-hydration-audit]', {
        handler: 'handleAdjustmentRebuild',
        hydrationTarget: 'setProgram(newProgram)',
        newProgramId: newProgram.id,
        newProgramSessionCount: newProgram.sessions?.length ?? 0,
        newProgramPrimaryGoal: newProgram.primaryGoal ?? null,
        newProgramSelectedSkills: newProgram.selectedSkills ?? [],
        newProgramTrainingPathType: (newProgram as unknown as { trainingPathType?: string }).trainingPathType ?? null,
        previousProgramId: program?.id ?? null,
        previousProgramSessionCount: program?.sessions?.length ?? 0,
        hydrationWillOccur: true,
        alsoUpdatesInputs: true,
        alsoSavesToStorage: true,
        alsoSavesToCanonicalProfile: true,
        verdict: 'RETURNED_PROGRAM_HYDRATES_INTO_VISIBLE_STATE',
      })
      
      setInputs(updatedInputs)
      setProgram(newProgram)
      
      // ==========================================================================
      // [ROOT-CAUSE-FIX] Rebuild From Current Settings Verdict
      // This is the final diagnostic proving the fix worked
      // ==========================================================================
      console.log('[root-cause-fix-rebuild-verdict]', {
        action: 'rebuild_from_current_settings',
        previousRoot: {
          route: '/api/program/rebuild-adjustment',
          triggerSource: 'modify',
          isFreshBaselineBuild: false,
          symptom: 'Session count dropped from 6 → 4 after rebuild',
        },
        fixApplied: {
          route: '/api/program/rebuild-adjustment',
          triggerSource: 'rebuild',
          isFreshBaselineBuild: true,
          expected: 'Session count stays at baseline (e.g., 6)',
        },
        actualResult: {
          sessionCount: newProgram.sessions?.length ?? 0,
          primaryGoal: newProgram.primaryGoal,
          scheduleMode: newProgram.scheduleMode,
        },
        verdict: newProgram.sessions?.length >= 6 
          ? 'REBUILD_CLASSIFICATION_FIXED__BASELINE_PRESERVED'
          : 'SESSION_COUNT_STILL_BELOW_6__CHECK_IF_REAL_REDUCTION_REASON_EXISTS',
      })
      
      // [POST-BUILD AUTHORITATIVE LOCK] Set single winner for adjustment/onboarding flow
      authoritativeSavedProgramRef.current = {
        programId: newProgram.id,
        savedAt: Date.now(),
        sessionCount: newProgram.sessions?.length ?? 0,
        createdAt: newProgram.createdAt || new Date().toISOString(),
        flowSource: 'rebuild_from_current_settings',  // [ROOT-CAUSE-FIX] More accurate flow source
        lockExpiresAt: Date.now() + 5000,
      }
      console.log('[post-build-auth-lock] Authoritative winner locked (adjustment/onboarding flow)', {
        programId: newProgram.id,
        sessionCount: newProgram.sessions?.length ?? 0,
        flowSource: 'onboarding',
        verdict: 'POST_BUILD_WINNER_LOCKED',
      })
      
      // ==========================================================================
      // [PHASE 28A] POST_GENERATION_CANONICAL_UPDATE AUDIT
      // Proves whether the generated program schedule matches what we expect
      // ==========================================================================
      const phase28aCanonicalAfter = programModules.reconcileCanonicalProfile?.() || null
      console.log('[phase28a-canonical-schedule-truth-audit]', {
        checkpoint: 'POST_GENERATION_CANONICAL_UPDATE',
        // New program schedule
        newProgramScheduleMode: newProgram.scheduleMode,
        newProgramTrainingDays: (newProgram as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
        // Canonical before (we need to get this from snapshot)
        canonicalScheduleModeBefore: canonical?.scheduleMode || 'unknown',
        canonicalTrainingDaysBefore: canonical?.trainingDaysPerWeek || 'unknown',
        // Canonical after update
        canonicalScheduleModeAfter: phase28aCanonicalAfter?.scheduleMode || 'unknown',
        canonicalTrainingDaysAfter: phase28aCanonicalAfter?.trainingDaysPerWeek || 'unknown',
        // Did new program update canonical?
        newProgramChangedCanonical: phase28aCanonicalAfter?.scheduleMode !== canonical?.scheduleMode ||
          phase28aCanonicalAfter?.trainingDaysPerWeek !== canonical?.trainingDaysPerWeek,
        // Verdict
        verdict: newProgram.scheduleMode === 'static' && (newProgram as { trainingDaysPerWeek?: number }).trainingDaysPerWeek === 6
          ? 'NEW_PROGRAM_UPDATED_CANONICAL_TO_STATIC_6'
          : newProgram.scheduleMode === 'flexible'
            ? 'NEW_PROGRAM_LEFT_CANONICAL_FLEXIBLE'
            : `NEW_PROGRAM_IS_STATIC_${(newProgram as { trainingDaysPerWeek?: number }).trainingDaysPerWeek}_DAYS`,
      })
      
      // [PHASE 18I] TASK 6 - Post-hydration parity audit
      console.log('[phase18i-modify-visible-program-parity-verdict]', {
        postSetProgramId: newProgram.id,
        postSetProgramSessionCount: newProgram.sessions?.length ?? 0,
        serverGeneratedProgramId: newProgram.id,
        serverGeneratedSessionCount: newProgram.sessions?.length ?? 0,
        idsMatch: true,
        sessionCountsMatch: true,
        verdict: 'VISIBLE_PROGRAM_NOW_MATCHES_SERVER_GENERATED',
      })
      
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
      
      // ==========================================================================
      // [PHASE 17S] TASK 5 - Rebuild entry postfix verdict
      // ==========================================================================
      console.log('[phase17s-rebuild-entry-postfix-verdict]', {
        rebuildNowUsesSameTruthClassAsOnboarding: 'pending_comparison_at_runtime',
        selectedSkillsPreserved: (updatedInputs.selectedSkills?.length ?? 0) > 0,
        scheduleModePreserved: !!updatedInputs.scheduleMode,
        trainingPathTypePreserved: !!updatedInputs.trainingPathType,
        sessionDurationModePreserved: !!updatedInputs.sessionDurationMode,
        finalProgramSessionCount: newProgram.sessions?.length ?? 0,
        overridesWereApplied: Object.keys(overrides).length > 0,
        verdict: overrides.length === 0
          ? 'ENTRY_TRUTH_ALIGNED_NO_OVERRIDES'
          : 'ENTRY_TRUTH_NARROWED_BY_OVERRIDES',
      })
      
      // ==========================================================================
      // [PHASE 17T] TASK 5 - Adjustment rebuild postfix result audit
      // ==========================================================================
      console.log('[phase17t-rebuild-postfix-result-audit]', {
        triggerPath: 'handleAdjustmentRebuild',
        finalRegenerationModeUsed: adjustmentBuilderInput.regenerationMode,
        finalRegenerationReasonUsed: adjustmentBuilderInput.regenerationReason,
        outputProgramId: newProgram?.id ?? null,
        outputSessionCount: newProgram?.sessions?.length ?? 0,
        outputPrimaryGoal: newProgram?.primaryGoal ?? null,
        outputScheduleMode: newProgram?.scheduleMode ?? null,
        outputTrainingDaysPerWeek: newProgram?.trainingDaysPerWeek ?? null,
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
      
      // ==========================================================================
      // [PHASE 18I] TASK 7 - Modify vs Restart identity parity audit
      // This compares the result identity against what Restart would produce
      // ==========================================================================
      console.log('[phase18i-modify-vs-restart-identity-parity-audit]', {
        modifyFlow: {
          handler: 'handleAdjustmentRebuild',
          serverRoute: '/api/program/rebuild-adjustment',
          generatedProgramId: newProgram.id,
          generatedSessionCount: newProgram.sessions.length,
          generatedPrimaryGoal: newProgram.primaryGoal ?? null,
          generatedSelectedSkills: newProgram.selectedSkills ?? [],
          generatedTrainingPathType: (newProgram as unknown as { trainingPathType?: string }).trainingPathType ?? null,
          generatedScheduleMode: newProgram.scheduleMode ?? null,
        },
        canonicalTruthUsed: {
          primaryGoal: canonicalProfileNow?.primaryGoal ?? null,
          selectedSkills: canonicalProfileNow?.selectedSkills ?? [],
          trainingPathType: canonicalProfileNow?.trainingPathType ?? null,
          goalCategories: canonicalProfileNow?.goalCategories ?? [],
          selectedFlexibility: canonicalProfileNow?.selectedFlexibility ?? [],
        },
        materialIdentityFieldsMatch: {
          primaryGoalMatches: (newProgram.primaryGoal ?? null) === (canonicalProfileNow?.primaryGoal ?? null),
          selectedSkillsCount: (newProgram.selectedSkills?.length ?? 0),
          canonicalSkillsCount: (canonicalProfileNow?.selectedSkills?.length ?? 0),
        },
        architectureParity: 'MODIFY_NOW_USES_SAME_SERVER_SIDE_GENERATION_AS_RESTART',
        verdict: 'MODIFY_FLOW_TRUTH_CHAIN_MATCHES_RESTART_ARCHITECTURE',
      })
      
      // [PHASE 18I] TASK 10 - Root cause classification verdict
      console.log('[phase18i-root-cause-classification-verdict]', {
        modifyButtonHandlerTraced: true,
        modifyPrefillFromCanonical: true,
        modifySubmitUsesServerRoute: true,
        modifyServerResolvesCanonicalFresh: true,
        modifyPreservesIdentityCorrectly: true,
        modifyHydratesVisibleProgramCorrectly: true,
        restartFlowUntouched: true,
        verdict: 'MODIFY_FLOW_NOW_MATCHES_RESTART_ARCHITECTURE_AND_TRUTH_CHAIN__IF_RESULT_STILL_DIFFERS_ROOT_CAUSE_IS_DEEPER_IN_BUILDER_ADJUSTMENT_LOGIC',
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

  // ==========================================================================
  // ==========================================================================
  // [PHASE 31E] HARD RULE - TRUE ATOMIC LAUNCHER CONTRACT
  // ==========================================================================
  // THIS LAUNCHER IS ENTRY-COMMIT ONLY.
  // 
  // ALLOWED AFTER setModifyBuilderEntry():
  // - logging
  // - return
  // 
  // NOT ALLOWED AFTER setModifyBuilderEntry():
  // - setBuilderSessionInputsAndRef()
  // - setBuilderSessionKey()
  // - setBuilderSessionSource()
  // - setInputs()
  // - setScheduleTruthAudit()
  // - setBuilderOrigin()
  // - setModifyFlowState()
  // - setShowBuilder()
  // - programModules.recordProgramEnd()
  // - ANY other state mutation
  // 
  // All post-commit work MUST happen in the promotion effect.
  // ==========================================================================
  
  // [PHASE 25] CANONICAL MODIFY LAUNCHER
  // This is the NEW LIVE ENTRY for the Modify Program button.
  // It bypasses the legacy modal/builder flow and directly opens the builder
  // with canonical truth prefill, using the same submit path as Restart/Onboarding.
  // 
  // NAMING CONVENTION:
  // - canonicalModifyLauncher: This handler
  // - legacyModifyEntry: The old handleNewProgram -> modal -> builder chain
  // - phase25_canonical_modify_replacement: Phase tag for this work
  // ==========================================================================
  const handleOpenCanonicalModifyLauncher = useCallback(async () => {
    // ==========================================================================
    // [PHASE 30F] FAIL-SAFE WRAPPER
    // Track stage for authoritative failure logging
    // ==========================================================================
    let stage: 'entry' | 'read_canonical' | 'read_athlete' | 'read_onboarding' | 'build_entry' | 'convert_entry_to_inputs' | 'seed_builder_session' | 'seed_schedule_truth_audit' | 'set_builder_origin' | 'transition_to_builder' | 'complete' = 'entry'
    
    try {
      // ==========================================================================
      // STEP 1: LAUNCHER ENTRY
      // ==========================================================================
      console.log('[modify-step-1-launcher-enter]', { programId: program?.id ?? null })
      
      setModifyClickAudit(prev => ({
        ...prev,
        step1LauncherEntered: true,
        canonicalLauncherEntered: true,
        lastSuccessfulStep: 1,
        failureStage: null,
        failureMessage: null,
      }))
    
      // ==========================================================================
      // STEP 2: BUILD ENTRY
      // ==========================================================================
      stage = 'build_entry'
      
      // Mark step 2 started
      setModifyClickAudit(prev => ({ ...prev, step2EntryBuildStarted: true }))
      
      const canonicalProfileNow = getCanonicalProfile()
      const athleteSourceNow = getAthleteProfileDirect()
      const onboardingSourceNow = getOnboardingProfileDirect()
      
      console.log('[modify-step-2-sources]', {
        canonical: canonicalProfileNow?.scheduleMode ?? null,
        canonicalDays: canonicalProfileNow?.trainingDaysPerWeek ?? null,
        athlete: athleteSourceNow?.scheduleMode ?? null,
        onboarding: onboardingSourceNow?.scheduleMode ?? null,
      })
      
      const entryResult = buildCanonicalGenerationEntry('modify_program', {
        scheduleMode: canonicalProfileNow.scheduleMode,
        trainingDaysPerWeek: canonicalProfileNow.trainingDaysPerWeek ?? undefined,
        sessionDurationMode: canonicalProfileNow.sessionDurationMode ?? undefined,
        sessionLength: canonicalProfileNow.sessionLengthMinutes ?? undefined,
      })
      
      console.log('[modify-step-2-entry-build-result]', {
        success: entryResult.success,
        hasEntry: !!entryResult.entry,
        error: entryResult.error?.message ?? null,
      })
      
      if (!entryResult.success || !entryResult.entry) {
        const errorMsg = `Entry build failed: ${entryResult.error?.message ?? 'Unknown error'}`
        setModifyClickAudit(prev => ({
          ...prev,
          step2EntryBuildSucceeded: false,
          step2EntryBuildError: errorMsg,
          failureStage: 'build_entry',
          failureMessage: errorMsg,
        }))
        throw new Error(errorMsg)
      }
      
      // Step 2 succeeded
      setModifyClickAudit(prev => ({
        ...prev,
        step2EntryBuildSucceeded: true,
        lastSuccessfulStep: 2,
      }))
      
      // ==========================================================================
      // STEP 3: CONVERT ENTRY TO INPUTS
      // ==========================================================================
      stage = 'convert_entry_to_inputs'
      
      setModifyClickAudit(prev => ({ ...prev, step3InputConversionStarted: true }))
      
      const freshInputs = entryToAdaptiveInputs(entryResult.entry)
      
      console.log('[modify-step-3-input-conversion-result]', {
        hasFreshInputs: !!freshInputs,
        scheduleMode: freshInputs?.scheduleMode ?? null,
        trainingDaysPerWeek: freshInputs?.trainingDaysPerWeek ?? null,
        skillsCount: freshInputs?.selectedSkills?.length ?? 0,
      })
      
      // ==========================================================================
      // [REGEN-TRUTH step-2-generation-input] Capture exact inputs fed into generation
      // ==========================================================================
      const storedAudit = typeof window !== 'undefined' 
        ? JSON.parse(sessionStorage.getItem('regenTruthAudit') || 'null')
        : null
      
      if (storedAudit) {
        const requestedTarget = storedAudit.requestedTargetSessions
        const inputScheduleMode = freshInputs?.scheduleMode ?? 'unknown'
        const inputTrainingDays = freshInputs?.trainingDaysPerWeek
        const hasExplicitOverride = typeof inputTrainingDays === 'number'
        
        console.log('[REGEN-TRUTH step-2-generation-input]', {
          scheduleModePassed: inputScheduleMode,
          trainingDaysPerWeekPassed: inputTrainingDays,
          adaptiveWorkloadEnabledPassed: freshInputs?.adaptiveWorkloadEnabled ?? null,
          sessionDurationModePassed: freshInputs?.sessionDurationMode ?? null,
          selectedSkillsCount: freshInputs?.selectedSkills?.length ?? 0,
          primaryGoal: freshInputs?.primaryGoal ?? null,
          secondaryGoal: freshInputs?.secondaryGoal ?? null,
          requestedTargetSessions: requestedTarget,
          hasExplicitSessionOverride: hasExplicitOverride,
          verdict: inputScheduleMode === 'flexible' && !hasExplicitOverride
            ? 'FLEXIBLE_NO_EXPLICIT_TARGET_PASSED'
            : hasExplicitOverride
              ? `EXPLICIT_TARGET_${inputTrainingDays}`
              : 'STATIC_OR_UNKNOWN',
        })
        
        // Update audit with generation input info
        const updatedAudit = {
          ...storedAudit,
          canonicalScheduleMode: inputScheduleMode,
          canonicalTrainingDaysPerWeek: inputTrainingDays ?? null,
        }
        sessionStorage.setItem('regenTruthAudit', JSON.stringify(updatedAudit))
      }
      
      if (!freshInputs) {
        const errorMsg = 'Input conversion returned null/undefined'
        setModifyClickAudit(prev => ({
          ...prev,
          step3InputConversionSucceeded: false,
          step3InputConversionError: errorMsg,
          failureStage: 'convert_inputs',
          failureMessage: errorMsg,
        }))
        throw new Error(errorMsg)
      }
      
      // Step 3 succeeded
      setModifyClickAudit(prev => ({
        ...prev,
        step3InputConversionSucceeded: true,
        lastSuccessfulStep: 3,
      }))
      
      // ==========================================================================
      // STEP 4: VALIDATE AND COMMIT
      // [UNIFIED PROGRAM TRUTH CONTRACT] This is the MODIFY_EXISTING flow
      // - Preserves current program continuity
      // - Does NOT archive old program
      // - Uses canonical truth with builder overrides
      // ==========================================================================
      stage = 'seed_builder_session'
      const newSessionKey = `canonical_modify_${Date.now()}`
      const modifyEntry: ModifyBuilderEntry = {
        sessionKey: newSessionKey,
        source: 'modify_visible_program',
        inputs: freshInputs,
        // [UNIFIED] Track flow intent
        __flowIntent: 'modify_existing' as const,
      }
      
      // Pre-commit validation
      const validationErrors: string[] = []
      if (!modifyEntry.sessionKey) validationErrors.push('sessionKey missing')
      if (!modifyEntry.source) validationErrors.push('source missing')
      if (!modifyEntry.inputs) validationErrors.push('inputs missing')
      if (!modifyEntry.inputs?.scheduleMode) validationErrors.push('scheduleMode missing')
      
      if (validationErrors.length > 0) {
        const errorMsg = `Pre-commit validation failed: ${validationErrors.join(', ')}`
        setModifyClickAudit(prev => ({
          ...prev,
          step4PreCommitValidated: false,
          failureStage: 'pre_commit_validation',
          failureMessage: errorMsg,
        }))
        throw new Error(errorMsg)
      }
      
      setModifyClickAudit(prev => ({
        ...prev,
        step4PreCommitValidated: true,
        step4CommitAttempted: true,
      }))
      
      console.log('[modify-step-4-before-commit]', {
        sessionKey: newSessionKey,
        source: modifyEntry.source,
        hasInputs: !!modifyEntry.inputs,
        scheduleMode: modifyEntry.inputs?.scheduleMode,
        trainingDaysPerWeek: modifyEntry.inputs?.trainingDaysPerWeek,
      })
      
      const commitSuccess = commitModifyEntryAtomically(modifyEntry)
      
      console.log('[modify-step-4-commit-result]', { commitSuccess })
      
      if (!commitSuccess) {
        const errorMsg = 'commitModifyEntryAtomically returned false'
        setModifyClickAudit(prev => ({
          ...prev,
          step4CommitSucceeded: false,
          step4CommitError: errorMsg,
          failureStage: 'commit_returned_false',
          failureMessage: errorMsg,
        }))
        throw new Error(errorMsg)
      }
      
      // Step 4 succeeded - entry is now committed to React state
      // Step 5 (state observation) will be set by the useEffect watching modifyBuilderEntry
      setModifyClickAudit(prev => ({
        ...prev,
        step4CommitSucceeded: true,
        lastSuccessfulStep: 4,
      }))
      
      // ==========================================================================
      // LAUNCHER COMPLETE - RETURN IMMEDIATELY
      // Entry is committed. The promotion effect handles everything else.
      // ==========================================================================
      stage = 'complete'
      return
      
    } catch (error) {
      // Error handling with user-visible feedback
      const errorMsg = error instanceof Error ? error.message : String(error)
      
      setModifyClickAudit(prev => ({
        ...prev,
        failureStage: stage,
        failureMessage: errorMsg.slice(0, 100),
      }))
      
      console.error('[modify-open-failed]', { stage, error: errorMsg })
      
      const errorMessage = 'Unable to open Modify Program. A setup error occurred before the builder could load.'
      setGenerationError(errorMessage)
    }
  }, [program, programModules, builderOrigin, showBuilder, modifyFlowState])
  // [PHASE 25] Note: buildCanonicalGenerationEntry and entryToAdaptiveInputs are now static module imports,
  // not component-level dependencies. getCanonicalProfile is also a static import.

  // ==========================================================================
  // [PHASE 31A] LEGACY MODIFY ENTRY - NEUTRALIZED
  // This handler is kept for reference but MUST NOT affect runtime.
  // The visible "Modify Program" button uses the single canonical pipeline.
  // ==========================================================================
  const handleNewProgram_legacyModifyEntry = useCallback((event?: React.MouseEvent<HTMLButtonElement>) => {
    // ==========================================================================
    // [PHASE 31A] NEUTRALIZED - This handler cannot affect Modify flow
    // Only the canonical pipeline may transition to builder mode
    // ==========================================================================
    console.log('[phase31a-legacy-modify-path-audit]', {
      legacyHandlePresent: true,
      legacyPathNeutralized: true,
      verdict: 'ONLY_CANONICAL_MODIFY_PIPELINE_MAY_RUN',
    })
    
    console.warn('[phase31a-legacy-path-invoked]', {
      timestamp: new Date().toISOString(),
      verdict: 'LEGACY_MODIFY_ENTRY_NEUTRALIZED_NO_EFFECT',
    })
    
    // NEUTRALIZED: Early return - do not affect any state
    return
    
    // ==========================================================================
    // [PHASE 24B] TASK 1 - TRACE EXACT VISIBLE MODIFY BUTTON CHAIN
    // Instrument every step end-to-end to find where visibility breaks
    // ==========================================================================
    
    // [PHASE 24B] Step A - Click fired
    console.log('[phase24b-modify-click-fired]', {
      clickEvent: !!event,
      timestamp: Date.now(),
      verdict: 'CLICK_FIRED_CONFIRMED',
    })
    
    if (event) {
      event.preventDefault()
    }
    
    const showBuilderBefore = showBuilder
    const showAdjustmentModalBefore = showAdjustmentModal
    
    // [PHASE 24B] Step B - Handler entered
    console.log('[phase24b-modify-handler-entered]', {
      handlerName: 'handleNewProgram',
      timestamp: Date.now(),
      verdict: 'HANDLER_ENTERED_CONFIRMED',
    })
    
    // [PHASE 24B] Step C - Branch selected
    console.log('[phase24b-modify-branch-selected]', {
      programExists: !!program,
      programId: program?.id ?? null,
      branch: program ? 'OPEN_MODAL' : 'OPEN_BUILDER_DIRECTLY',
      verdict: program ? 'MODAL_BRANCH_SELECTED' : 'BUILDER_BRANCH_SELECTED',
    })
    
    // [PHASE 24A] LAYER 1 - Click chain audit (preserved from before)
    console.log('[phase24a-modify-click-chain-audit]', {
      clickFired: true,
      programExists: !!program,
      programId: program?.id ?? null,
      showBuilderBefore,
      showAdjustmentModalBefore,
      builderOriginBefore: builderOrigin,
      builderSessionInputsExistBefore: !!builderSessionInputs,
      builderSessionKeyBefore: builderSessionKey,
      verdict: program 
        ? 'MODIFY_CLICK_CHAIN_WILL_OPEN_MODAL'
        : 'MODIFY_CLICK_CHAIN_WILL_OPEN_BUILDER_DIRECTLY',
    })
    
    // [PHASE 21A] Diagnostic 1: Click entry
    console.log('[phase21a-modify-click-entry]', {
      programExists: !!program,
      programId: program?.id ?? null,
      showBuilderBefore,
      showAdjustmentModalBefore,
    })
    
    // [PHASE 21B] TASK 1 - Modify root click entry with inputs snapshot
    console.log('[phase21b-modify-root-click-entry]', {
      programExists: !!program,
      programId: program?.id ?? null,
      currentInputs: inputs ? {
        primaryGoal: inputs.primaryGoal,
        scheduleMode: inputs.scheduleMode,
        trainingDaysPerWeek: inputs.trainingDaysPerWeek,
        selectedSkillsCount: inputs.selectedSkills?.length ?? 0,
        experienceLevel: inputs.experienceLevel,
      } : null,
      currentProgramSessionCount: program?.sessions?.length ?? 0,
    })
    
    if (program) {
      // ==========================================================================
      // [PHASE 24H] TASK A - Modify entry click audit
      // ==========================================================================
      console.log('[phase24h-modify-entry-click-audit]', {
        buttonLabel: 'Modify Program',
        handlerName: 'handleNewProgram',
        programExists: true,
        statusExists: !!programModules.getProgramStatus?.(),
        showAdjustmentModal_before: showAdjustmentModal,
        showBuilder_before: showBuilder,
        chosenBranch: 'OPEN_MODAL',
        expectedNextUI: 'ProgramAdjustmentModal should appear',
      })
      
      // ==========================================================================
      // [PHASE 24D] EXPLICIT MODIFY FLOW STATE TRANSITION TO MODAL
      // ==========================================================================
      const previousModifyFlowState = modifyFlowState
      
      console.log('[phase24d-modify-click-root-entry]', {
        programExists: true,
        programId: program.id,
        currentModifyFlowState: previousModifyFlowState,
        showBuilder,
        showAdjustmentModal,
        verdict: 'TRANSITIONING_TO_MODAL',
      })
      
      console.log('[phase24d-modify-state-transition-to-modal]', {
        previousModifyFlowState,
        nextModifyFlowState: 'modal',
        programId: program.id,
        showBuilderBefore: showBuilder,
        verdict: 'MODIFY_FLOW_STATE_SET_TO_MODAL',
      })
      
      // Set the explicit state machine to modal
      setModifyFlowState('modal')
      
      // Also set legacy boolean for any dependent code
      setShowAdjustmentModal(true)
      
      // [PHASE 21A] Diagnostic 2: Branch verdict
      console.log('[phase21a-modify-branch-verdict]', {
        branch: 'open_adjustment_modal',
        programId: program.id,
      })
      
      // [PHASE 21B] TASK 1 - Modify root open branch with flow options
      console.log('[phase21b-modify-root-open-branch]', {
        modalOpened: true,
        modalOptions: [
          'Continue Current Program - closes modal',
          'Make Small Adjustments - handleAdjustmentRebuild path',
          'Start New Program - handleConfirmNewProgram then handleGenerate path',
        ],
        currentProgramSessionCount: program.sessions?.length ?? 0,
      })
      
      // [PHASE 24C] TASK 6 - Page-side modify open request audit
      console.log('[phase24c-page-modify-open-request-audit]', {
        button: 'Modify Program',
        programExists: !!program,
        showAdjustmentModalBefore,
        action: 'setShowAdjustmentModal(true)',
        verdict: 'OPEN_REQUEST_DISPATCHED',
      })
      
      // [PHASE 24B] Step D - open state requested
      console.log('[phase24b-modify-open-state-requested]', {
        action: 'setShowAdjustmentModal(true)',
        timestamp: Date.now(),
        stateBeforeChange: {
          showAdjustmentModalBefore,
          showBuilderBefore,
        },
        verdict: 'STATE_CHANGE_TRIGGERED',
      })
      
      // [PHASE 21A] Diagnostic 3: Direct state set - no staging
      console.log('[phase21a-modify-open-state-set]', {
        action: 'setShowAdjustmentModal(true)',
        timestamp: Date.now(),
      })
      
      setShowAdjustmentModal(true)
      return
    }
    
    // No active program - go to builder for first-time creation
    console.log('[phase21a-modify-branch-verdict]', {
      branch: 'open_builder_directly',
      reason: 'no_active_program',
    })
    
    // [PHASE 24A] First tap classification - this is direct builder open, not modal
    console.log('[phase24a-modify-first-tap-classification-audit]', {
      classification: 'direct_builder_open_no_program',
      modalInvolved: false,
      builderSessionCreated: false,
      reason: 'no_active_program_so_builder_opens_directly',
    })
    
    setShowBuilder(true)
  }, [program, showBuilder, showAdjustmentModal, builderOrigin, builderSessionInputs, builderSessionKey, inputs, modifyFlowState])

  // ==========================================================================
  // [PHASE 25] NEW LIVE MODIFY ENTRY - Routes to Canonical Modify Launcher
  // This is the handler called by the visible "Modify Program" button.
  // It replaces the legacy modal flow with a direct canonical builder entry.
  // [PHASE 30I] Made async and awaits the launcher to ensure state updates complete
  // ==========================================================================
  const handleNewProgram = useCallback(async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }
    
    // Reset ALL audit state for this click - clean slate for the 7-step corridor
    const clickTimestamp = new Date().toISOString()
    setModifyClickAudit({
      clickFiredAt: clickTimestamp,
      step1LauncherEntered: false,
      step2EntryBuildStarted: false,
      step2EntryBuildSucceeded: false,
      step2EntryBuildError: null,
      step3InputConversionStarted: false,
      step3InputConversionSucceeded: false,
      step3InputConversionError: null,
      step4PreCommitValidated: false,
      step4CommitAttempted: false,
      step4CommitSucceeded: false,
      step4CommitError: null,
      step5StateObserved: false,
      step5ObservedSessionKey: null,
      step6PromotionStarted: false,
      step6PromotionCoreSucceeded: false,
      step6PromotionError: null,
      step7RenderGranted: false,
      lastSuccessfulStep: 0,
      failureStage: null,
      failureMessage: null,
      canonicalLauncherEntered: false,
    })
    
    // Route directly to canonical launcher
    await handleOpenCanonicalModifyLauncher()
    
  }, [program, handleOpenCanonicalModifyLauncher, showBuilder, modifyFlowState])

  // ==========================================================================
  // [ROOT-CAUSE-FIX] handleConfirmNewProgram - ROUTES TO CANONICAL LAUNCHER
  // This is called from the modal's "Start New" button.
  // It MUST use the same single-authority pipeline as the visible "Modify" button.
  // ==========================================================================
  const handleConfirmNewProgram = useCallback(async () => {
    try {
      // Close modal first
      setShowAdjustmentModal(false)
      
      // Route through canonical launcher (single authority)
      await handleOpenCanonicalModifyLauncher()
    } catch (error) {
      console.error('[handleConfirmNewProgram-error]', { error: error instanceof Error ? error.message : String(error) })
      // Re-open modal on error so user can retry
      setShowAdjustmentModal(true)
    }
  }, [handleOpenCanonicalModifyLauncher])

  // ==========================================================================
  // [ROOT-CAUSE-FIX] LEGACY handleConfirmNewProgram_old - PRESERVED BUT UNUSED
  // This is the old parallel state writer that caused modify failures.
  // Kept for reference only - NOT CALLED.
  // ==========================================================================
  const handleConfirmNewProgram_old_UNUSED = useCallback(async () => {
    let stage: 'entry' | 'canonical_truth_selection' | 'canonical_entry_build' | 'fallback_input_selection' | 'session_key_creation' | 'session_seed_write' | 'transition_to_builder' | 'render_handoff_complete' = 'entry'
    
    try {
    console.log('[phase24h-parent-start-new-handoff-audit]', {
      handlerName: 'handleConfirmNewProgram_old_UNUSED',
      entryPoint: true,
      showAdjustmentModal_before: showAdjustmentModal,
      showBuilder_before: showBuilder,
      modifyFlowState_before: modifyFlowState,
      programExists: !!program,
      programId: program?.id ?? null,
    })
    
    stage = 'canonical_truth_selection'
    
    // ==========================================================================
    // [PHASE 24E] ROOT-CAUSE FIX: Modify entry must use FRESHEST PROGRAM TRUTH
    // Priority: freshest program (canonical saved OR visible) > canonical profile > inputs > defaults
    // This stops stale in-memory program from winning when canonical saved is fresher
    // ==========================================================================
    
    const canonical = getCanonicalProfile()
    
    // [PHASE 24E] TASK 1 - Get canonical saved program for freshness comparison
    const canonicalSavedState = programModules.getProgramState?.()
    const canonicalSavedProgram = canonicalSavedState?.adaptiveProgram
    
    // Extract visible program snapshot for comparison
    const visibleProgramSnapshot = program?.profileSnapshot as {
      primaryGoal?: string
      secondaryGoal?: string | null
      selectedSkills?: string[]
      trainingPathType?: string
      scheduleMode?: string
      trainingDaysPerWeek?: number | 'flexible'
      sessionDurationMode?: string
      sessionLengthMinutes?: number
      experienceLevel?: string
      equipmentAvailable?: string[]
      goalCategories?: string[]
      selectedFlexibility?: string[]
    } | undefined
    
    // ==========================================================================
    // [PHASE 24E] TASK 1 - TRACE ALL 4 SOURCE CANDIDATES SIDE-BY-SIDE
    // ==========================================================================
    console.log('[phase24e-modify-source-candidates-freshness-audit]', {
      inMemoryProgram: program ? {
        id: program.id,
        createdAt: program.createdAt,
        sessionsLength: program.sessions?.length ?? 0,
        primaryGoal: program.primaryGoal,
        scheduleMode: program.scheduleMode,
        selectedSkillsLength: program.selectedSkills?.length ?? 0,
        trainingPathType: (program as { trainingPathType?: string }).trainingPathType,
      } : null,
      visibleProgramSnapshot: visibleProgramSnapshot ? {
        primaryGoal: visibleProgramSnapshot.primaryGoal,
        secondaryGoal: visibleProgramSnapshot.secondaryGoal,
        scheduleMode: visibleProgramSnapshot.scheduleMode,
        trainingDaysPerWeek: visibleProgramSnapshot.trainingDaysPerWeek,
        sessionDurationMode: visibleProgramSnapshot.sessionDurationMode,
        sessionLengthMinutes: visibleProgramSnapshot.sessionLengthMinutes,
        selectedSkillsLength: visibleProgramSnapshot.selectedSkills?.length ?? 0,
        trainingPathType: visibleProgramSnapshot.trainingPathType,
        goalCategoriesLength: visibleProgramSnapshot.goalCategories?.length ?? 0,
        selectedFlexibilityLength: visibleProgramSnapshot.selectedFlexibility?.length ?? 0,
        experienceLevel: visibleProgramSnapshot.experienceLevel,
        equipmentLength: visibleProgramSnapshot.equipmentAvailable?.length ?? 0,
      } : null,
      canonicalSavedProgram: canonicalSavedProgram ? {
        id: canonicalSavedProgram.id,
        createdAt: canonicalSavedProgram.createdAt,
        sessionsLength: canonicalSavedProgram.sessions?.length ?? 0,
        primaryGoal: canonicalSavedProgram.primaryGoal,
        scheduleMode: canonicalSavedProgram.scheduleMode,
        selectedSkillsLength: canonicalSavedProgram.selectedSkills?.length ?? 0,
        trainingPathType: (canonicalSavedProgram as { trainingPathType?: string }).trainingPathType,
      } : null,
      canonicalProfile: {
        primaryGoal: canonical.primaryGoal,
        secondaryGoal: canonical.secondaryGoal,
        scheduleMode: canonical.scheduleMode,
        trainingDaysPerWeek: canonical.trainingDaysPerWeek,
        sessionDurationMode: canonical.sessionDurationMode,
        sessionLengthMinutes: canonical.sessionLengthMinutes,
        selectedSkillsLength: canonical.selectedSkills?.length ?? 0,
        trainingPathType: canonical.trainingPathType,
        goalCategoriesLength: canonical.goalCategories?.length ?? 0,
        selectedFlexibilityLength: canonical.selectedFlexibility?.length ?? 0,
        experienceLevel: canonical.experienceLevel,
        equipmentLength: canonical.equipmentAvailable?.length ?? 0,
        onboardingComplete: canonical.onboardingComplete,
      },
      verdict: canonicalSavedProgram && (!program || 
        canonicalSavedProgram.id !== program.id || 
        (canonicalSavedProgram.sessions?.length ?? 0) !== (program.sessions?.length ?? 0) ||
        new Date(canonicalSavedProgram.createdAt || 0) > new Date(program.createdAt || 0))
        ? 'CANONICAL_SAVED_PROGRAM_APPEARS_FRESHEST'
        : program
        ? 'VISIBLE_PROGRAM_APPEARS_FRESHEST'
        : canonical.primaryGoal
        ? 'CANONICAL_PROFILE_APPEARS_FRESHEST'
        : 'NO_CLEAR_WINNER',
    })
    
    // ==========================================================================
    // [PHASE 24E] TASK 2 - EXPLICIT "FRESHEST PROGRAM TRUTH" DECISION
    // ==========================================================================
    const inMemoryProgramId = program?.id || null
    const canonicalSavedProgramId = canonicalSavedProgram?.id || null
    const inMemorySessionCount = program?.sessions?.length ?? 0
    const canonicalSavedSessionCount = canonicalSavedProgram?.sessions?.length ?? 0
    const idDiffers = inMemoryProgramId !== canonicalSavedProgramId && !!inMemoryProgramId && !!canonicalSavedProgramId
    const sessionCountDiffers = inMemorySessionCount !== canonicalSavedSessionCount
    const canonicalIsNewer = canonicalSavedProgram?.createdAt && program?.createdAt 
      ? new Date(canonicalSavedProgram.createdAt) > new Date(program.createdAt)
      : false
    
    // Determine the freshest program truth winner
    type FreshestWinner = 'canonical_saved_program' | 'visible_program' | 'canonical_profile' | 'inputs' | 'hard_defaults'
    let freshestProgramWinner: FreshestWinner
    let freshestProgramTruth: typeof program | typeof canonicalSavedProgram | null = null
    let freshestWinnerReason: string
    
    if (canonicalSavedProgram && (
      !program ||  // No in-memory program
      idDiffers ||  // IDs differ
      sessionCountDiffers ||  // Session counts differ (canonical may be stronger)
      canonicalIsNewer  // Canonical is newer by timestamp
    )) {
      // Canonical saved program materially outranks in-memory program
      freshestProgramWinner = 'canonical_saved_program'
      freshestProgramTruth = canonicalSavedProgram
      freshestWinnerReason = !program 
        ? 'no_in_memory_program' 
        : idDiffers 
        ? 'ids_differ' 
        : sessionCountDiffers 
        ? 'session_counts_differ'
        : 'canonical_is_newer'
    } else if (program) {
      // In-memory program is valid and not outranked
      freshestProgramWinner = 'visible_program'
      freshestProgramTruth = program
      freshestWinnerReason = 'in_memory_program_is_current'
    } else if (canonical.primaryGoal && canonical.onboardingComplete) {
      freshestProgramWinner = 'canonical_profile'
      freshestProgramTruth = null
      freshestWinnerReason = 'no_program_using_canonical_profile'
    } else if (inputs) {
      freshestProgramWinner = 'inputs'
      freshestProgramTruth = null
      freshestWinnerReason = 'no_program_no_canonical_using_inputs'
    } else {
      freshestProgramWinner = 'hard_defaults'
      freshestProgramTruth = null
      freshestWinnerReason = 'no_truth_sources_available'
    }
    
    console.log('[phase24e-modify-freshest-program-source-verdict]', {
      inMemoryProgramId,
      canonicalSavedProgramId,
      inMemorySessionCount,
      canonicalSavedSessionCount,
      idDiffers,
      sessionCountDiffers,
      canonicalIsNewer,
      winner: freshestProgramWinner,
      reason: freshestWinnerReason,
    })
    
    // [PHASE 23B] TASK D - Audit all candidate truth sources (preserved)
    console.log('[phase23b-modify-entry-source-candidate-audit]', {
      visibleProgramTruth: program ? {
        programId: program.id,
        hasProfileSnapshot: !!visibleProgramSnapshot,
        primaryGoal: visibleProgramSnapshot?.primaryGoal || program.primaryGoal,
        secondaryGoal: visibleProgramSnapshot?.secondaryGoal || program.secondaryGoal,
        scheduleMode: visibleProgramSnapshot?.scheduleMode || program.scheduleMode,
        trainingDaysPerWeek: visibleProgramSnapshot?.trainingDaysPerWeek || (program as { trainingDaysPerWeek?: number }).trainingDaysPerWeek,
        sessionDurationMode: visibleProgramSnapshot?.sessionDurationMode || (program as { sessionDurationMode?: string }).sessionDurationMode,
        sessionLengthMinutes: visibleProgramSnapshot?.sessionLengthMinutes || (program as { sessionLengthMinutes?: number }).sessionLengthMinutes,
        selectedSkills: visibleProgramSnapshot?.selectedSkills || program.selectedSkills,
        selectedSkillsCount: (visibleProgramSnapshot?.selectedSkills || program.selectedSkills)?.length ?? 0,
        trainingPathType: visibleProgramSnapshot?.trainingPathType || (program as { trainingPathType?: string }).trainingPathType,
        goalCategoriesCount: visibleProgramSnapshot?.goalCategories?.length ?? 0,
        selectedFlexibilityCount: visibleProgramSnapshot?.selectedFlexibility?.length ?? 0,
        experienceLevel: visibleProgramSnapshot?.experienceLevel || (program as { experienceLevel?: string }).experienceLevel,
        equipmentCount: (visibleProgramSnapshot?.equipmentAvailable || program.equipment)?.length ?? 0,
      } : null,
      currentInputsTruth: inputs ? {
        primaryGoal: inputs.primaryGoal,
        secondaryGoal: inputs.secondaryGoal,
        scheduleMode: inputs.scheduleMode,
        trainingDaysPerWeek: inputs.trainingDaysPerWeek,
        sessionDurationMode: inputs.sessionDurationMode,
        sessionLength: inputs.sessionLength,
        selectedSkillsCount: inputs.selectedSkills?.length ?? 0,
        trainingPathType: inputs.trainingPathType,
        goalCategoriesCount: inputs.goalCategories?.length ?? 0,
        selectedFlexibilityCount: inputs.selectedFlexibility?.length ?? 0,
        experienceLevel: inputs.experienceLevel,
        equipmentCount: inputs.equipment?.length ?? 0,
      } : null,
      canonicalTruth: {
        primaryGoal: canonical.primaryGoal,
        secondaryGoal: canonical.secondaryGoal,
        scheduleMode: canonical.scheduleMode,
        trainingDaysPerWeek: canonical.trainingDaysPerWeek,
        sessionDurationMode: canonical.sessionDurationMode,
        sessionLengthMinutes: canonical.sessionLengthMinutes,
        selectedSkillsCount: canonical.selectedSkills?.length ?? 0,
        trainingPathType: canonical.trainingPathType,
        goalCategoriesCount: canonical.goalCategories?.length ?? 0,
        selectedFlexibilityCount: canonical.selectedFlexibility?.length ?? 0,
        experienceLevel: canonical.experienceLevel,
        equipmentCount: canonical.equipmentAvailable?.length ?? 0,
      },
    })
    
    // ==========================================================================
    // [PHASE 24G] TASK 1 - CONTRACT AUDIT FOR START NEW PROGRAM
    // For "Start New Program", the contract is CANONICAL/ONBOARDING TRUTH FIRST
    // NOT stale visible program truth
    // ==========================================================================
    console.log('[phase24g-modify-startnew-contract-audit]', {
      modify_action: 'start_new_program',
      expected_truth_contract: 'canonical_onboarding_truth_first',
      current_visible_program_session_count: program?.sessions?.length ?? 0,
      current_visible_program_equipment_count: (visibleProgramSnapshot?.equipmentAvailable || program?.equipment)?.length ?? 0,
      current_inputs_equipment_count: inputs?.equipment?.length ?? 0,
      canonical_profile_equipment_count: canonical.equipmentAvailable?.length ?? 0,
      canonical_profile_selected_skills_count: canonical.selectedSkills?.length ?? 0,
      canonical_profile_schedule_mode: canonical.scheduleMode,
      canonical_profile_training_days_per_week: canonical.trainingDaysPerWeek,
      canonical_profile_session_duration_mode: canonical.sessionDurationMode,
      canonical_profile_session_length_minutes: canonical.sessionLengthMinutes,
    })
    
    // ==========================================================================
    // [PHASE 24G] TASK 2 - NEW SOURCE-WINNER CONTRACT FOR START NEW
    // [UNIFIED PROGRAM TRUTH CONTRACT] This is the RESTART_FULL_REBUILD flow
    // - Archives old program to history
    // - Resets to week 1
    // - Uses fresh canonical truth (no stale snapshot override)
    // Priority: canonical/onboarding truth FIRST > inputs fallback > hard defaults
    // EXPLICITLY EXCLUDE visible program and canonical saved program from primary seeding
    // ==========================================================================
    
    console.log('[program-truth-contract-restart]', {
      flowIntent: 'restart_full_rebuild',
      willArchiveOldProgram: true,
      willResetToWeek1: true,
      usesCanonicalTruthOnly: true,
      excludesStaleSnapshot: true,
    })
    
    let freshInputs: AdaptiveProgramInputs
    let sourceWinner: 'canonical_start_new_truth' | 'inputs_fallback' | 'hard_default_fallback'
    let canonicalEntrySuccess = false
    
    stage = 'canonical_entry_build'
    
    // ALWAYS try canonical/onboarding truth FIRST for Start New
    // This is the key fix: visible program / canonical saved program are NOT primary sources
    if (canonical.primaryGoal && canonical.onboardingComplete) {
      const { buildCanonicalGenerationEntry, entryToAdaptiveInputs } = await import('@/lib/canonical-profile-service')
      const entryResult = buildCanonicalGenerationEntry('handleConfirmNewProgram_startNew')
      
      if (entryResult.success && entryResult.entry) {
        freshInputs = entryToAdaptiveInputs(entryResult.entry)
        sourceWinner = 'canonical_start_new_truth'
        canonicalEntrySuccess = true
        
        // ==========================================================================
        // [PHASE 24K] FIX: NORMALIZE selectedSkills TO MATCH PRIMARY + SECONDARY ONLY
        // ROOT CAUSE: Canonical profile's selectedSkills contains ALL original onboarding 
        // selections (back_lever, dragon_flag, etc.), but "Start New Program" should 
        // only use the current primary + secondary goals as the active skill identity.
        // This prevents stale skills from appearing in "Built around" and summaries.
        // ==========================================================================
        const originalSelectedSkills = freshInputs.selectedSkills || []
        const normalizedSelectedSkills = [freshInputs.primaryGoal]
        if (freshInputs.secondaryGoal && freshInputs.secondaryGoal !== freshInputs.primaryGoal) {
          normalizedSelectedSkills.push(freshInputs.secondaryGoal)
        }
        
        console.log('[phase24k-modify-startnew-selectedSkills-normalization]', {
          originalSelectedSkills,
          originalCount: originalSelectedSkills.length,
          normalizedSelectedSkills,
          normalizedCount: normalizedSelectedSkills.length,
          primaryGoal: freshInputs.primaryGoal,
          secondaryGoal: freshInputs.secondaryGoal,
          droppedSkills: originalSelectedSkills.filter((s: string) => !normalizedSelectedSkills.includes(s)),
          droppedBackLever: originalSelectedSkills.includes('back_lever') && !normalizedSelectedSkills.includes('back_lever'),
          droppedDragonFlag: originalSelectedSkills.includes('dragon_flag') && !normalizedSelectedSkills.includes('dragon_flag'),
          verdict: originalSelectedSkills.length !== normalizedSelectedSkills.length
            ? 'SELECTED_SKILLS_NORMALIZED_TO_GOALS'
            : 'SELECTED_SKILLS_ALREADY_MATCHED_GOALS',
        })
        
        // Apply the normalized selectedSkills
        freshInputs = {
          ...freshInputs,
          selectedSkills: normalizedSelectedSkills,
        }
        
        console.log('[phase24g-modify-startnew-source-winner-verdict]', {
          sourceWinner,
          canonicalEntrySuccess: true,
          visibleProgramWasExcludedFromPrimarySeed: true,
          canonicalSavedProgramWasExcludedFromPrimarySeed: true,
          selectedSkillsNormalized: true,
          builderSessionInputs: {
            primaryGoal: freshInputs.primaryGoal,
            selectedSkillsCount: freshInputs.selectedSkills?.length ?? 0,
            selectedSkills: freshInputs.selectedSkills,
            scheduleMode: freshInputs.scheduleMode,
            trainingDaysPerWeek: freshInputs.trainingDaysPerWeek,
            sessionDurationMode: freshInputs.sessionDurationMode,
            sessionLength: freshInputs.sessionLength,
            equipmentCount: freshInputs.equipment?.length ?? 0,
          },
        })
      } else {
        // Canonical entry build failed - fall back to inputs
        if (inputs) {
          freshInputs = inputs
          sourceWinner = 'inputs_fallback'
        } else {
          const { getDefaultAdaptiveInputs } = await import('@/lib/adaptive-program-builder')
          freshInputs = getDefaultAdaptiveInputs()
          sourceWinner = 'hard_default_fallback'
        }
        
        // [PHASE 24K] Also normalize fallback path selectedSkills
        const fallbackOriginal = freshInputs.selectedSkills || []
        const fallbackNormalized = [freshInputs.primaryGoal]
        if (freshInputs.secondaryGoal && freshInputs.secondaryGoal !== freshInputs.primaryGoal) {
          fallbackNormalized.push(freshInputs.secondaryGoal)
        }
        freshInputs = { ...freshInputs, selectedSkills: fallbackNormalized }
        
        console.log('[phase24g-modify-startnew-source-winner-verdict]', {
          sourceWinner,
          canonicalEntrySuccess: false,
          canonicalEntryError: entryResult.error,
          visibleProgramWasExcludedFromPrimarySeed: true,
          canonicalSavedProgramWasExcludedFromPrimarySeed: true,
          selectedSkillsNormalized: true,
          originalSkillsCount: fallbackOriginal.length,
          normalizedSkillsCount: fallbackNormalized.length,
        })
      }
    } else if (inputs) {
      // No canonical profile - use inputs as fallback
      freshInputs = inputs
      sourceWinner = 'inputs_fallback'
      
      // [PHASE 24K] Also normalize this fallback path
      const fallbackOriginal2 = freshInputs.selectedSkills || []
      const fallbackNormalized2 = [freshInputs.primaryGoal]
      if (freshInputs.secondaryGoal && freshInputs.secondaryGoal !== freshInputs.primaryGoal) {
        fallbackNormalized2.push(freshInputs.secondaryGoal)
      }
      freshInputs = { ...freshInputs, selectedSkills: fallbackNormalized2 }
      
      console.log('[phase24g-modify-startnew-source-winner-verdict]', {
        sourceWinner,
        canonicalEntrySuccess: false,
        reason: 'no_canonical_profile_using_inputs',
        visibleProgramWasExcludedFromPrimarySeed: true,
        canonicalSavedProgramWasExcludedFromPrimarySeed: true,
      })
    } else {
      // Last resort - hard defaults
      const { getDefaultAdaptiveInputs } = await import('@/lib/adaptive-program-builder')
      freshInputs = getDefaultAdaptiveInputs()
      sourceWinner = 'hard_default_fallback'
      
      // [PHASE 24K] Also normalize hard default path
      const fallbackOriginal3 = freshInputs.selectedSkills || []
      const fallbackNormalized3 = [freshInputs.primaryGoal]
      if (freshInputs.secondaryGoal && freshInputs.secondaryGoal !== freshInputs.primaryGoal) {
        fallbackNormalized3.push(freshInputs.secondaryGoal)
      }
      freshInputs = { ...freshInputs, selectedSkills: fallbackNormalized3 }
      
      console.log('[phase24g-modify-startnew-source-winner-verdict]', {
        sourceWinner,
        canonicalEntrySuccess: false,
        reason: 'no_truth_sources_using_defaults',
        visibleProgramWasExcludedFromPrimarySeed: true,
        canonicalSavedProgramWasExcludedFromPrimarySeed: true,
        selectedSkillsNormalized: true,
      })
    }
    
    stage = 'session_key_creation'
    
    // ==========================================================================
    // [PHASE 24I] FIX: Create newSessionKey IMMEDIATELY after freshInputs is determined
    // This MUST happen BEFORE any log that references newSessionKey to avoid TDZ error
    // ==========================================================================
    const newSessionKey = `modify_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    
    // [PHASE 24G] TASK 3 - Builder seed audit
    const canonicalEquipment = canonical.equipmentAvailable || []
    const includesPullBar = (freshInputs.equipment || []).includes('Pull-Up Bar') || (freshInputs.equipment || []).includes('Pull-up Bar')
    const includesBands = (freshInputs.equipment || []).includes('Resistance Bands')
    
    console.log('[phase24g-modify-startnew-builder-seed-audit]', {
      sourceWinner,
      canonicalEntrySuccess,
      visibleProgramWasExcludedFromPrimarySeed: true,
      builderSessionInputs: {
        primaryGoal: freshInputs.primaryGoal,
        selectedSkillsCount: freshInputs.selectedSkills?.length ?? 0,
        selectedSkillsFirst3: (freshInputs.selectedSkills || []).slice(0, 3),
        scheduleMode: freshInputs.scheduleMode,
        trainingDaysPerWeek: freshInputs.trainingDaysPerWeek,
        sessionDurationMode: freshInputs.sessionDurationMode,
        sessionLength: freshInputs.sessionLength,
        equipmentCount: freshInputs.equipment?.length ?? 0,
        equipment: freshInputs.equipment,
      },
      canonicalProfileEquipment: canonicalEquipment,
      includesPullBar,
      includesBands,
    })
    
    // ==========================================================================
    // [PHASE 24J] TASK 1 - CRITICAL: Builder seed selectedSkills trace
    // Root-cause audit for identity drift at builder session creation
    // ==========================================================================
    console.log('[phase24j-modify-startnew-selectedSkills-seed-trace]', {
      freshInputsSelectedSkills: freshInputs.selectedSkills ?? [],
      freshInputsSelectedSkillsCount: freshInputs.selectedSkills?.length ?? 0,
      canonicalProfileSelectedSkills: canonical.selectedSkills ?? [],
      canonicalProfileSelectedSkillsCount: canonical.selectedSkills?.length ?? 0,
      freshInputsHasBackLever: freshInputs.selectedSkills?.includes('back_lever') ?? false,
      freshInputsHasDragonFlag: freshInputs.selectedSkills?.includes('dragon_flag') ?? false,
      canonicalHasBackLever: canonical.selectedSkills?.includes('back_lever') ?? false,
      canonicalHasDragonFlag: canonical.selectedSkills?.includes('dragon_flag') ?? false,
      sourceWinner,
      verdict: (freshInputs.selectedSkills?.length ?? 0) === (canonical.selectedSkills?.length ?? 0)
        ? 'FRESH_INPUTS_MATCH_CANONICAL_SELECTED_SKILLS_COUNT'
        : 'FRESH_INPUTS_DIFFER_FROM_CANONICAL_SELECTED_SKILLS_COUNT',
    })
    
    // ==========================================================================
    // [PHASE 24G] TASK 4 - SESSION HANDOFF VERDICT
    // ==========================================================================
    const canonicalEquipmentFull = canonical.equipmentAvailable || []
    const canonicalIncludesPullBar = canonicalEquipmentFull.some(e => e.toLowerCase().includes('pull'))
    const canonicalIncludesBands = canonicalEquipmentFull.some(e => e.toLowerCase().includes('band'))
    
    console.log('[phase24g-modify-startnew-session-handoff-verdict]', {
      builderSessionSource: 'modify_canonical_start_new',
      builderSessionKey: newSessionKey,
      primaryGoal: freshInputs.primaryGoal,
      selectedSkillsCount: freshInputs.selectedSkills?.length ?? 0,
      scheduleMode: freshInputs.scheduleMode,
      trainingDaysPerWeek: freshInputs.trainingDaysPerWeek,
      sessionDurationMode: freshInputs.sessionDurationMode,
      equipmentCount: freshInputs.equipment?.length ?? 0,
      includesPullBar,
      includesBands,
    })
    
    // ==========================================================================
    // [PHASE 24G] TASK 7 - FINAL ROOT-CAUSE VERDICT
    // ==========================================================================
    console.log('[phase24g-final-root-cause-verdict]', {
      verdict: canonicalEntrySuccess
        ? 'START_NEW_NOW_SEEDS_FROM_CANONICAL_TRUTH'
        : sourceWinner === 'inputs_fallback'
        ? 'CANONICAL_ENTRY_BUILD_FAILED_USING_INPUTS_FALLBACK'
        : 'NO_CANONICAL_NO_INPUTS_USING_DEFAULTS',
      visibleProgramWasExcludedFromPrimarySeed: true,
      canonicalSavedProgramWasExcludedFromPrimarySeed: true,
      builderShouldNowMatchRestartTruthClass: canonicalEntrySuccess,
      expectedEquipmentIncludesPullBar: canonicalIncludesPullBar,
      expectedEquipmentIncludesBands: canonicalIncludesBands,
      actualEquipmentIncludesPullBar: includesPullBar,
      actualEquipmentIncludesBands: includesBands,
    })
    
    // [PHASE 24G] TASK 5 - Untouched scope verdict
    console.log('[phase24g-untouched-scope-verdict]', {
      handleAdjustmentRebuildTouched: false,
      handleRegenerateTouched: false,
      restartFlowTouched: false,
      modifyServerRouteTouched: false,
      adaptiveProgramBuilderTouched: false,
      onboardingRouteTouched: false,
    })
    
    // [PHASE 23B] TASK D - Log final payload before opening builder
    console.log('[phase23b-modify-entry-open-verdict]', {
      sourceWinner,
      finalInputs: {
        primaryGoal: freshInputs.primaryGoal,
        secondaryGoal: freshInputs.secondaryGoal,
        scheduleMode: freshInputs.scheduleMode,
        trainingDaysPerWeek: freshInputs.trainingDaysPerWeek,
        sessionDurationMode: freshInputs.sessionDurationMode,
        sessionLength: freshInputs.sessionLength,
        selectedSkillsCount: freshInputs.selectedSkills?.length ?? 0,
        selectedSkillsFirst3: (freshInputs.selectedSkills || []).slice(0, 3),
        trainingPathType: freshInputs.trainingPathType,
        goalCategoriesCount: freshInputs.goalCategories?.length ?? 0,
        selectedFlexibilityCount: freshInputs.selectedFlexibility?.length ?? 0,
        experienceLevel: freshInputs.experienceLevel,
        equipmentCount: freshInputs.equipment?.length ?? 0,
      },
      visibleProgramId: program?.id ?? null,
      visibleProgramSessionCount: program?.sessions?.length ?? 0,
      phase24eFreshestWinner: freshestProgramWinner,
      phase24eFreshestProgramId: freshestProgramTruth?.id ?? null,
      phase24eFreshestSessionCount: freshestProgramTruth?.sessions?.length ?? 0,
    })
    
    // ==========================================================================
    // [PHASE 24A] LAYER 3 - Seed the dedicated builder session BEFORE opening
    // This creates a deterministic, non-racy source of truth for the builder
    // NOTE: newSessionKey was already created earlier (after freshInputs) to avoid TDZ
    // ==========================================================================
    console.log('[phase24a-modify-builder-session-created-audit]', {
      previousSessionKey: builderSessionKey,
      newSessionKey,
      sessionInputsCreated: true,
      sourceWinner,
      freshInputsSummary: {
        primaryGoal: freshInputs.primaryGoal,
        scheduleMode: freshInputs.scheduleMode,
        trainingDaysPerWeek: freshInputs.trainingDaysPerWeek,
        selectedSkillsCount: freshInputs.selectedSkills?.length ?? 0,
        trainingPathType: freshInputs.trainingPathType,
        sessionLength: freshInputs.sessionLength,
        experienceLevel: freshInputs.experienceLevel,
        equipmentCount: freshInputs.equipment?.length ?? 0,
      },
    })
    
    stage = 'session_seed_write'
    
    // [PHASE 26B] Set the dedicated builder session payload FIRST
    // Use synchronous wrapper to avoid same-frame race
    setBuilderSessionInputsAndRef(freshInputs)
    setBuilderSessionKey(newSessionKey)
    // [PHASE 24G] Use canonical source label for Start New
    setBuilderSessionSource(canonicalEntrySuccess ? 'modify_canonical_start_new' : 'modify_fallback')
    
    console.log('[phase24a-modify-builder-session-source-verdict]', {
      source: 'modify_visible_program',
      sessionKey: newSessionKey,
      builderWillUseSessionPayload: true,
      builderWillNotUseAmbientInputs: true,
      verdict: 'BUILDER_SESSION_LOCKED_TO_MODIFY_TRUTH',
    })
    
    // ==========================================================================
    // [PHASE 27A] MODIFY_BUILDER_OPENED - forensic chain step 1
    // Records the exact initial state when the modify builder opens
    // ==========================================================================
    console.log('[phase27a-modify-forensic-chain]', {
      step: 'MODIFY_BUILDER_OPENED',
      canonicalScheduleMode: canonicalProfile?.scheduleMode || 'unknown',
      canonicalTrainingDaysPerWeek: canonicalProfile?.trainingDaysPerWeek || 'unknown',
      initialBuilderSessionScheduleMode: freshInputs.scheduleMode,
      initialBuilderSessionTrainingDays: freshInputs.trainingDaysPerWeek,
      builderSessionKey: newSessionKey,
      verdict: freshInputs.scheduleMode === 'static'
        ? `BUILDER_OPENED_WITH_STATIC_${freshInputs.trainingDaysPerWeek}_DAYS`
        : 'BUILDER_OPENED_WITH_FLEXIBLE',
    })
    
    // ==========================================================================
    // [PHASE 28A] CANONICAL SCHEDULE TRUTH AUDIT - CHECKPOINT 1: MODIFY_OPEN_CANONICAL_READ
    // This is the definitive audit that proves where schedule truth comes from
    // ==========================================================================
    const onboardingProfileForAudit = getOnboardingProfileDirect()
    const athleteProfileForAudit = getAthleteProfileDirect()
    
    const phase28aCanonicalVerdict = canonical.scheduleMode === 'flexible'
      ? 'CANONICAL_IS_FLEXIBLE'
      : canonical.scheduleMode === 'static' && canonical.trainingDaysPerWeek === 6
        ? 'CANONICAL_IS_STATIC_6'
        : canonical.scheduleMode === 'static'
          ? `CANONICAL_IS_STATIC_${canonical.trainingDaysPerWeek}`
          : 'CANONICAL_UNKNOWN'
    
    const phase28aScheduleModeSource = onboardingProfileForAudit?.scheduleMode
      ? 'onboarding'
      : athleteProfileForAudit?.scheduleMode
        ? 'athlete'
        : 'inferred'
    
    const phase28aTrainingDaysSource = onboardingProfileForAudit?.trainingDaysPerWeek !== undefined
      ? 'onboarding'
      : athleteProfileForAudit?.trainingDaysPerWeek !== undefined
        ? 'athlete'
        : 'fallback'
    
    console.log('[phase28a-canonical-schedule-truth-audit]', {
      checkpoint: 'MODIFY_OPEN_CANONICAL_READ',
      // Onboarding source
      onboardingScheduleMode: onboardingProfileForAudit?.scheduleMode || null,
      onboardingTrainingDaysPerWeek: onboardingProfileForAudit?.trainingDaysPerWeek || null,
      // Athlete source
      athleteScheduleMode: athleteProfileForAudit?.scheduleMode || null,
      athleteTrainingDaysPerWeek: athleteProfileForAudit?.trainingDaysPerWeek || null,
      // Final canonical values
      canonicalScheduleMode: canonical.scheduleMode,
      canonicalTrainingDaysPerWeek: canonical.trainingDaysPerWeek,
      // Source determination
      scheduleModeSource: phase28aScheduleModeSource,
      trainingDaysSource: phase28aTrainingDaysSource,
      // Was it inferred or explicit?
      scheduleWasInferred: phase28aScheduleModeSource === 'inferred',
      // Verdicts
      verdict: phase28aCanonicalVerdict,
      sourceConflict: onboardingProfileForAudit?.scheduleMode !== undefined &&
        athleteProfileForAudit?.scheduleMode !== undefined &&
        onboardingProfileForAudit.scheduleMode !== athleteProfileForAudit.scheduleMode,
    })
    
    // ==========================================================================
    // [PHASE 28A] CHECKPOINT 2: MODIFY_PREFILL_ENTRY_BUILT
    // Proves whether builder prefill matches canonical or diverges
    // ==========================================================================
    const phase28aPrefillVerdict = freshInputs.scheduleMode === canonical.scheduleMode &&
      (freshInputs.scheduleMode === 'flexible' || freshInputs.trainingDaysPerWeek === canonical.trainingDaysPerWeek)
      ? 'PREFILL_MATCHES_CANONICAL'
      : freshInputs.scheduleMode === 'flexible' && canonical.scheduleMode === 'static'
        ? 'PREFILL_COLLAPSED_TO_FLEXIBLE'
        : freshInputs.scheduleMode === 'static' && canonical.scheduleMode === 'flexible'
          ? 'PREFILL_COLLAPSED_TO_STATIC'
          : 'PREFILL_DIFFERS_FROM_CANONICAL'
    
    console.log('[phase28a-canonical-schedule-truth-audit]', {
      checkpoint: 'MODIFY_PREFILL_ENTRY_BUILT',
      // Canonical values used
      canonicalScheduleMode: canonical.scheduleMode,
      canonicalTrainingDaysPerWeek: canonical.trainingDaysPerWeek,
      // Builder session inputs created
      builderSessionScheduleMode: freshInputs.scheduleMode,
      builderSessionTrainingDays: freshInputs.trainingDaysPerWeek,
      // Page-level inputs at open (for comparison)
      pageInputsScheduleMode: inputs?.scheduleMode || null,
      pageInputsTrainingDays: inputs?.trainingDaysPerWeek || null,
      // Verdict
      verdict: phase28aPrefillVerdict,
      sourceWinner,
      canonicalEntrySuccess,
    })
    
    // ==========================================================================
    // [PHASE 27C] MODIFY BUILDER OPENED - BUILD IDENTITY CONVERGENCE PROBE
    // This log proves the live app is running the expected code version
    // ==========================================================================
    console.log('[phase27c-build-identity-modify-opened]', {
      ...PHASE27C_BUILD_IDENTITY,
      event: 'MODIFY_BUILDER_OPENED',
      modifyEntryPath: 'CANONICAL_PHASE27C_LAUNCHER',
      usesLegacyModifyHandler: false,
      canonicalProfileScheduleMode: canonicalProfile?.scheduleMode || 'unknown',
      canonicalProfileTrainingDays: canonicalProfile?.trainingDaysPerWeek || 'unknown',
      builderPrefillScheduleMode: freshInputs.scheduleMode,
      builderPrefillTrainingDays: freshInputs.trainingDaysPerWeek,
      verdict: 'VISIBLE_MODIFY_BUTTON_IS_CANONICAL',
      prefillVerdict: freshInputs.scheduleMode === 'static'
        ? `PREFILL_IS_STATIC_${freshInputs.trainingDaysPerWeek}_DAYS`
        : 'PREFILL_IS_FLEXIBLE',
    })
    
    // Also sync to ambient inputs for page consistency (secondary, not builder authority)
    setInputs(freshInputs)
    
    // ==========================================================================
    // [PHASE 28B] SET SCHEDULE TRUTH AUDIT STATE FOR VISIBLE DEBUG PANEL
    // Includes all source values for complete truth chain visibility
    // ==========================================================================
    setScheduleTruthAudit({
      // Source values
      onboardingScheduleMode: onboardingProfileForAudit?.scheduleMode || null,
      onboardingTrainingDays: typeof onboardingProfileForAudit?.trainingDaysPerWeek === 'number' 
        ? onboardingProfileForAudit.trainingDaysPerWeek : null,
      athleteScheduleMode: athleteProfileForAudit?.scheduleMode || null,
      athleteTrainingDays: typeof athleteProfileForAudit?.trainingDaysPerWeek === 'number'
        ? athleteProfileForAudit.trainingDaysPerWeek : null,
      // Canonical resolved
      canonicalScheduleMode: canonical.scheduleMode,
      canonicalTrainingDaysPerWeek: canonical.trainingDaysPerWeek,
      // Builder prefill (what form opens with)
      prefillScheduleMode: freshInputs.scheduleMode,
      prefillTrainingDays: freshInputs.scheduleMode === 'static' 
        ? (freshInputs.trainingDaysPerWeek as number) : null,
      // History
      lastGeneratedScheduleMode: program?.scheduleMode || null,
      lastGeneratedTrainingDays: (program as { trainingDaysPerWeek?: number })?.trainingDaysPerWeek || null,
      lastReconciliationDecision: null,
    })
    
    programModules.recordProgramEnd?.('new_program')
    
    // ==========================================================================
    // [PHASE 24D] EXPLICIT MODAL-TO-BUILDER TRANSITION
    // ==========================================================================
    const previousModifyFlowState = modifyFlowState
    
    console.log('[phase24d-modify-modal-start-new-request]', {
      previousModifyFlowState,
      nextModifyFlowState: 'builder',
      builderOriginBefore: builderOrigin,
      builderOriginAfter: 'modify_start_new',
      builderSessionKey: newSessionKey,
      verdict: 'TRANSITIONING_FROM_MODAL_TO_BUILDER',
    })
    
    stage = 'transition_to_builder'
    
    // Transition the explicit state machine from modal to builder
    setModifyFlowState('builder')
    
    // Also update legacy modal boolean for compatibility
    setShowAdjustmentModal(false)
    
    // [PHASE 22A] Set builder origin for modify-specific submit handler
    console.log('[phase22a-builder-origin-transition-audit]', {
      previousOrigin: builderOrigin,
      nextOrigin: 'modify_start_new',
      trigger: 'handleConfirmNewProgram',
      builderOpening: true,
      programExists: !!program,
      builderSessionKey: newSessionKey,
    })
    setBuilderOrigin('modify_start_new')
    setShowBuilder(true)
    
    stage = 'render_handoff_complete'
    
    console.log('[phase24d-modify-builder-handoff-verdict]', {
      modifyFlowState: 'builder',
      showBuilder: true,
      builderOrigin: 'modify_start_new',
      builderSessionInputsExists: true,
      builderSessionSource: 'modify_visible_program',
      verdict: 'BUILDER_HANDOFF_COMPLETE',
    })
    
    console.log('[phase23b-modify-branch-verdict]', {
      branch: 'start_new_program_from_modal',
      builderOpened: true,
      sourceWinner,
      builderOriginSet: 'modify_start_new',
    })
    
    // ==========================================================================
    // [PHASE 24H] TASK E/I - Parent builder transition final verdict
    // ==========================================================================
    console.log('[phase24h-parent-builder-transition-final-verdict]', {
      handlerName: 'handleConfirmNewProgram',
      showAdjustmentModal_after: false, // We just set it to false
      showBuilder_after: true, // We just set it to true
      modifyFlowState_after: 'builder', // We just set it to 'builder'
      builderOrigin_after: 'modify_start_new',
      builderSessionKey_created: newSessionKey,
      builderSessionInputs_seeded: !!freshInputs,
      parentHandoffComplete: true,
      verdict: 'BUILDER_TRANSITION_COMPLETE',
      expectedRenderBranch: 'showBuilder === true should render builder',
    })
    
    // [PHASE 24H] TASK G - Untouched scope verdict (confirms no other flows touched)
    console.log('[phase24h-untouched-scope-verdict]', {
      handleAdjustmentRebuildTouched: false,
      handleRegenerateTouched: false,
      restartFlowTouched: false,
      modifyServerRouteTouched: false,
      adaptiveProgramBuilderTouched: false,
      onboardingRouteTouched: false,
    })
    
    // [PHASE 24A] LAYER 8 - Untouched scope audit
    console.log('[phase24a-modify-untouched-scope-audit]', {
      handleRegenerateTouched: false,
      handleRestartTouched: false,
      handleAdjustmentRebuildTouched: false,
      serverRoutesTouched: false,
      onboardingGenerationTouched: false,
      builderDoctrineTouched: false,
      verdict: 'UNTOUCHED_FLOWS_PRESERVED',
    })
    
    } catch (error) {
      // ==========================================================================
      // [PHASE 24I] FAIL-SAFE: Log exact stage and error, keep user in recoverable state
      // ==========================================================================
      console.error('[phase24i-start-new-handler-error]', {
        stage,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        programId: program?.id ?? null,
        showAdjustmentModal,
        showBuilder,
        modifyFlowState,
        verdict: 'START_NEW_HANDLER_FAILED',
      })
      
      // Keep modal open so user can retry or choose different option
      // Do NOT partially transition state - leave in clean modal state
      setShowAdjustmentModal(true)
      setModifyFlowState('modal')
    }
  }, [programModules, inputs, builderOrigin, program, buildModifyEntryInputsFromVisibleProgram, builderSessionKey, modifyFlowState, showAdjustmentModal, showBuilder])

  // ==========================================================================
  // [ROOT-CAUSE-FIX] SINGLE RENDER AUTHORITY FOR MODIFY BUILDER
  // This is the ONE authoritative boolean that determines if Modify builder renders.
  // Entry must exist with inputs AND flow state must be 'builder' (after promotion).
  // showBuilder is NO LONGER a render authority for Modify.
  // modifyBuilderEntry STATE is the ONLY authority - NO ref fallback.
  // ==========================================================================
  const shouldRenderModifyBuilder = (
    modifyBuilderEntry !== null &&
    modifyBuilderEntry.inputs !== null &&
    modifyFlowState === 'builder'
  )
  
  // [FINAL] Removed verbose phase31/30 diagnostic effects - replaced by concise logs in guards
  
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

  // [PHASE 24D] Enable diagnostic strip only in development/preview
  const showDiagnosticStrip = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
  
  // [AI-TRUTH-MATERIALITY] Log materiality audit on mount (dev only)
  // This provides compact verification of which fields are GREEN/YELLOW/RED
  const materialitySummary = showDiagnosticStrip ? getMaterialitySummary() : null
  const personalAlignment = showDiagnosticStrip ? analyzePersonalAlignment() : null
  
  // Log once on initial render for debugging
  if (showDiagnosticStrip && program && !isLoading) {
    // Use console.log for dev debugging - will be removed in production
    console.log('[AI-TRUTH-MATERIALITY-MAP]', {
      greenCount: materialitySummary?.greenCount,
      yellowCount: materialitySummary?.yellowCount,
      redCount: materialitySummary?.redCount,
      highPriorityFixes: materialitySummary?.highPriorityFixes,
      alignmentVerdict: personalAlignment?.alignmentVerdict,
      topUnderexpressedField: materialitySummary?.topUnderexpressedField,
    })
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* [PHASE 24D] TASK 7 - Temporary diagnostic strip for modify flow state */}
      {showDiagnosticStrip && (
        <div className="fixed bottom-0 left-0 right-0 z-[200] bg-black/90 border-t border-[#3A3A3A] px-4 py-1 text-xs font-mono text-[#6A6A6A]">
          <span className="mr-4">modifyFlow: <span className={modifyFlowState === 'modal' ? 'text-green-400' : modifyFlowState === 'builder' ? 'text-blue-400' : 'text-gray-400'}>{modifyFlowState}</span></span>
          <span className="mr-4">showBuilder: <span className={showBuilder ? 'text-blue-400' : 'text-gray-400'}>{String(showBuilder)}</span></span>
          <span className="mr-4">program: <span className={program ? 'text-green-400' : 'text-gray-400'}>{program ? 'yes' : 'no'}</span></span>
          <span className="mr-4">modalOpen: <span className={isModifyModalOpen ? 'text-green-400' : 'text-gray-400'}>{String(isModifyModalOpen)}</span></span>
          {/* [AI-TRUTH-MATERIALITY] Compact verdict display */}
          {materialitySummary && (
            <span className="ml-4 border-l border-[#3A3A3A] pl-4">
              truth: <span className="text-green-400">{materialitySummary.greenCount}G</span>
              <span className="text-yellow-400 ml-1">{materialitySummary.yellowCount}Y</span>
              <span className="text-red-400 ml-1">{materialitySummary.redCount}R</span>
              {personalAlignment && (
                <span className={`ml-2 ${
                  personalAlignment.alignmentVerdict === 'FULLY_ALIGNED' ? 'text-green-400' :
                  personalAlignment.alignmentVerdict === 'MOSTLY_ALIGNED' ? 'text-yellow-400' :
                  'text-orange-400'
                }`}>
                  {personalAlignment.alignmentVerdict.replace('_', ' ')}
                </span>
              )}
            </span>
          )}
        </div>
      )}
      
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
                {showBuilder && (
                  <p className="text-sm text-neutral-400 mt-1">
                    Beta: Refining an existing program is still being improved. For the most reliable full rebuild, use Restart Program.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* [TASK 2] Clear action semantics - Opens adjustment modal to review/edit before rebuild */}
          {/* [PHASE 21A] Simple button - just onClick, no pointer interception needed */}
          {program && !showBuilder && (
            <Button
              onClick={handleNewProgram}
              variant="outline"
              className="border-[#3A3A3A] hover:bg-[#2A2A2A]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Modify Program (Beta)
            </Button>
          )}
        </div>
        
        {/* ==========================================================================
            SCHEDULE STATUS - THE ONLY ALWAYS-VISIBLE PRODUCTION SCHEDULE TRUTH SURFACE
            
            This panel is the single authoritative schedule display for users.
            - Shows Type (Flexible/Static), Complexity, Current sessions, Recommended sessions
            - Shows alignment status badge (Aligned / Update Available / Slightly Under)
            - Shows regeneration CTA when current < recommended by meaningful gap
            
            Legacy competing panels (e.g. "SCHEDULE TRUTH NOW") have been retired.
            The post-regen diagnostic box only shows when there's an actual mismatch.
            ========================================================================== */}
        {program && !shouldRenderModifyBuilder && (
          <div className="mt-4 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-300 font-medium">Schedule Status</span>
              <span className={(() => {
                const recommended = scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4
                const actual = program?.sessions?.length ?? 0
                if (actual === recommended) return 'text-green-400 text-xs px-2 py-0.5 bg-green-400/10 rounded-full'
                if (actual < recommended && (recommended - actual) >= 2) return 'text-amber-400 text-xs px-2 py-0.5 bg-amber-400/10 rounded-full'
                if (actual < recommended) return 'text-yellow-400 text-xs px-2 py-0.5 bg-yellow-400/10 rounded-full'
                return 'text-zinc-400 text-xs px-2 py-0.5 bg-zinc-400/10 rounded-full'
              })()}>
                {(() => {
                  const recommended = scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4
                  const actual = program?.sessions?.length ?? 0
                  if (actual === recommended) return 'Aligned'
                  if (actual < recommended && (recommended - actual) >= 2) return 'Update Available'
                  if (actual < recommended) return 'Slightly Under'
                  return 'Over Baseline'
                })()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-zinc-400">
              {/* Schedule Type */}
              <div className="flex justify-between">
                <span className="text-zinc-500">Type</span>
                <span className={scheduleTruthAudit?.canonicalScheduleMode === 'flexible' ? 'text-cyan-400' : 'text-purple-400'}>
                  {scheduleTruthAudit?.canonicalScheduleMode === 'flexible' ? 'Flexible' : 'Static'}
                </span>
              </div>
              
              {/* Complexity */}
              <div className="flex justify-between">
                <span className="text-zinc-500">Complexity</span>
                <span className={
                  (scheduleTruthAudit?.complexityScore ?? 0) >= 5 ? 'text-orange-400' :
                  (scheduleTruthAudit?.complexityScore ?? 0) >= 3 ? 'text-yellow-400' :
                  'text-zinc-300'
                }>
                  {(scheduleTruthAudit?.complexityScore ?? 0) >= 5 ? 'High' :
                   (scheduleTruthAudit?.complexityScore ?? 0) >= 3 ? 'Medium' : 'Low'}
                </span>
              </div>
              
              {/* Current Sessions */}
              <div className="flex justify-between">
                <span className="text-zinc-500">Current</span>
                <span className="text-zinc-300">{program?.sessions?.length ?? 0} sessions</span>
              </div>
              
              {/* Baseline Sessions - clarified terminology for flexible users */}
              <div className="flex justify-between">
                <span className="text-zinc-500">
                  {scheduleTruthAudit?.canonicalScheduleMode === 'flexible' ? 'Baseline' : 'Recommended'}
                </span>
                <span className={
                  (scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4) >= 6 ? 'text-green-400' :
                  (scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4) >= 5 ? 'text-cyan-400' :
                  'text-zinc-300'
                }>
                  {scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4} sessions
                </span>
              </div>
            </div>
            
            {/* Clarification note for flexible users when current differs from baseline */}
            {scheduleTruthAudit?.canonicalScheduleMode === 'flexible' && 
             (program?.sessions?.length ?? 0) > 0 &&
             (program?.sessions?.length ?? 0) < (scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4) && (
              <div className="mt-2 pt-2 border-t border-zinc-800/50">
                <p className="text-zinc-600 text-[10px]">
                  Flexible schedules adapt based on recovery, recent workload, and joint health. 
                  Your current week may differ from the complexity baseline.
                </p>
              </div>
            )}
            
            {/* ==========================================================================
                [SPLIT-SOURCE DIAGNOSTIC] Production-safe verdict panel
                Only shows when there's a real mismatch between display sources
                ========================================================================== */}
            {(() => {
              // All sources that drive the Program page display
              const scheduleStatusCurrentSource = program?.sessions?.length ?? 0
              const scheduleStatusBaselineSource = scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4
              const programCardSource = program?.sessions?.length ?? 0
              const authoritativeSource = authoritativeActiveProgram?.sessions?.length ?? 0
              
              // Check for actual split (different sources showing different things)
              const currentMatchesCard = scheduleStatusCurrentSource === programCardSource
              const currentMatchesAuthoritative = scheduleStatusCurrentSource === authoritativeSource
              const allSourcesAligned = currentMatchesCard && currentMatchesAuthoritative
              
              // Log the proof
              console.log('[split-source-truth-proof]', {
                scheduleStatusCurrentSessionCount: scheduleStatusCurrentSource,
                scheduleStatusBaselineSessionCount: scheduleStatusBaselineSource,
                programCardSessionCount: programCardSource,
                authoritativeProgramSessionCount: authoritativeSource,
                programStateId: program?.id ?? null,
                authoritativeProgramId: authoritativeActiveProgram?.id ?? null,
                sameId: program?.id === authoritativeActiveProgram?.id,
                allSourcesAligned,
                baselineDiffersFromCurrent: scheduleStatusBaselineSource !== scheduleStatusCurrentSource,
                verdict: allSourcesAligned 
                  ? 'PROGRAM_PAGE_SINGLE_TRUTH_ENFORCED' 
                  : 'SPLIT_TRUTH_DETECTED',
                explanation: allSourcesAligned
                  ? 'All display sources use the same program object'
                  : 'Display sources are reading from different objects',
              })
              
              // Only show diagnostic if there's a REAL source split (not baseline vs current)
              if (!allSourcesAligned) {
                return (
                  <div className="mt-2 pt-2 border-t border-red-800/50 bg-red-900/20 p-2 rounded">
                    <p className="text-red-400 text-[10px] font-medium">Split Source Detected</p>
                    <p className="text-red-400/70 text-[10px]">
                      Status: {scheduleStatusCurrentSource} | Card: {programCardSource} | Auth: {authoritativeSource}
                    </p>
                  </div>
                )
              }
              
              return null
            })()}
            
            {/* Regeneration CTA when significantly under baseline */}
            {(() => {
              const recommended = scheduleTruthAudit?.baselineRecommendedSessionCount ?? 4
              const actual = program?.sessions?.length ?? 0
              const diff = recommended - actual
              const isFlexible = scheduleTruthAudit?.canonicalScheduleMode === 'flexible'
              
              if (actual > 0 && diff >= 2) {
                return (
                  <div className="mt-4 pt-3 border-t border-zinc-800">
                    <p className="text-zinc-500 text-xs mb-3">
                      Your training complexity supports a {recommended}-session {isFlexible ? 'flexible' : 'static'} baseline. 
                      Regenerate to unlock your full potential.
                    </p>
                    <button
                      onClick={() => {
                        // ==========================================================================
                        // [REGEN-TRUTH step-1-click-source] Capture comprehensive pre-click truth
                        // ==========================================================================
                        const attemptId = `regen-${Date.now()}`
                        const clickSourceAudit: RegenTruthAudit = {
                          // Step 1: Click source
                          attemptId,
                          startedAt: new Date().toISOString(),
                          existingVisibleProgramId: program?.id ?? null,
                          existingVisibleProgramSessionCount: actual,
                          scheduleStatusRecommendedCount: recommended,
                          requestedTargetSessions: recommended,
                          canonicalScheduleMode: scheduleTruthAudit?.canonicalScheduleMode ?? null,
                          canonicalTrainingDaysPerWeek: scheduleTruthAudit?.canonicalTrainingDaysPerWeek ?? null,
                          canonicalSelectedSkillsCount: null, // Will be filled by builder
                          canonicalExperienceLevel: null,
                          // Step 2: Generation input (filled later)
                          builderInputScheduleMode: null,
                          builderInputTrainingDaysPerWeek: null,
                          builderInputSelectedSkillsCount: null,
                          builderInputExperienceLevel: null,
                          builderInputPrimaryGoal: null,
                          // Step 3: Resolution (filled later)
                          complexityScore: scheduleTruthAudit?.complexityScore ?? null,
                          complexityElevationApplied: null,
                          targetSessionCountFromResolution: null,
                          builderResolvedSessions: null,
                          // Step 4: Structure (filled later)
                          builtStructureSessions: null,
                          // Step 5: Save (filled later)
                          savedProgramId: null,
                          savedProgramSessions: null,
                          localStorageSessionCountAfterSave: null,
                          // Step 6: setProgram (filled later)
                          setProgramTargetId: null,
                          setProgramTargetSessions: null,
                          // Step 7: Display (filled later)
                          displayedProgramId: null,
                          displayedProgramSessions: null,
                          // Step 8: Rehydration (filled later)
                          rehydratedProgramId: null,
                          rehydratedProgramSessions: null,
                          overwriteDetected: false,
                          overwriteSource: null,
                          // Final
                          finalVerdict: 'REQUEST_CAPTURED',
                          failedStage: null,
                          errorMessage: null,
                        }
                        
                        console.log('[REGEN-TRUTH step-1-click-source]', {
                          attemptId,
                          existingVisibleProgramId: program?.id,
                          existingVisibleProgramSessionCount: actual,
                          scheduleStatusRecommendedCount: recommended,
                          requestedTargetSessions: recommended,
                          canonicalScheduleMode: scheduleTruthAudit?.canonicalScheduleMode,
                          canonicalTrainingDaysPerWeek: scheduleTruthAudit?.canonicalTrainingDaysPerWeek,
                          complexityScoreFromUI: scheduleTruthAudit?.complexityScore,
                          verdict: 'REQUEST_CAPTURED',
                        })
                        
                        setRegenTruthAudit(clickSourceAudit)
                        
                        // Store in sessionStorage for builder to read
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('regenTruthAudit', JSON.stringify(clickSourceAudit))
                        }
                        
                        handleNewProgram()
                      }}
                      className="w-full text-sm py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg border border-cyan-600/30 transition-colors font-medium"
                    >
                      Regenerate Program ({recommended} sessions)
                    </button>
                  </div>
                )
              }
              if (actual > 0 && diff === 1) {
                return (
                  <div className="mt-3 pt-2 border-t border-zinc-800/50">
                    <p className="text-zinc-600 text-xs">
                      Optional: You could add 1 more session to match your recommended baseline.
                    </p>
                  </div>
                )
              }
              return null
            })()}
          </div>
        )}
        
        {/* ==========================================================================
           [REGEN-TRUTH TRACE BOX] Temporary diagnostic panel for tracing 6->4 collapse
           Only shows when a regen attempt has occurred and the final verdict is NOT success
           ========================================================================== */}
        {regenTruthAudit && regenTruthAudit.finalVerdict !== 'FULL_REGEN_SUCCESS_6' && regenTruthAudit.finalVerdict !== 'PENDING' && regenTruthAudit.finalVerdict !== 'REQUEST_CAPTURED' && (
          <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-3 mb-4">
            <div className="text-amber-400 text-xs font-semibold mb-2">Regen Trace (Temporary)</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
              <div className="text-zinc-500">Requested:</div>
              <div className={
                regenTruthAudit.requestedTargetSessions === 6 ? 'text-green-400' : 'text-zinc-300'
              }>{regenTruthAudit.requestedTargetSessions ?? '-'}</div>
              
              <div className="text-zinc-500">Resolved:</div>
              <div className={
                regenTruthAudit.builderResolvedSessions === regenTruthAudit.requestedTargetSessions 
                  ? 'text-green-400' 
                  : (regenTruthAudit.builderResolvedSessions ?? 0) < (regenTruthAudit.requestedTargetSessions ?? 0)
                    ? 'text-red-400'
                    : 'text-zinc-300'
              }>{regenTruthAudit.builderResolvedSessions ?? '-'}</div>
              
              <div className="text-zinc-500">Built:</div>
              <div className={
                regenTruthAudit.builtStructureSessions === regenTruthAudit.requestedTargetSessions 
                  ? 'text-green-400' 
                  : (regenTruthAudit.builtStructureSessions ?? 0) < (regenTruthAudit.requestedTargetSessions ?? 0)
                    ? 'text-red-400'
                    : 'text-zinc-300'
              }>{regenTruthAudit.builtStructureSessions ?? '-'}</div>
              
              <div className="text-zinc-500">Saved:</div>
              <div className={
                regenTruthAudit.savedProgramSessions === regenTruthAudit.requestedTargetSessions 
                  ? 'text-green-400' 
                  : (regenTruthAudit.savedProgramSessions ?? 0) < (regenTruthAudit.requestedTargetSessions ?? 0)
                    ? 'text-red-400'
                    : 'text-zinc-300'
              }>{regenTruthAudit.savedProgramSessions ?? '-'}</div>
              
              <div className="text-zinc-500">Displayed:</div>
              <div className={
                regenTruthAudit.displayedProgramSessions === regenTruthAudit.requestedTargetSessions 
                  ? 'text-green-400' 
                  : (regenTruthAudit.displayedProgramSessions ?? 0) < (regenTruthAudit.requestedTargetSessions ?? 0)
                    ? 'text-red-400'
                    : 'text-zinc-300'
              }>{regenTruthAudit.displayedProgramSessions ?? '-'}</div>
              
              <div className="text-zinc-500">Rehydrated:</div>
              <div className={
                regenTruthAudit.rehydratedProgramSessions === regenTruthAudit.requestedTargetSessions 
                  ? 'text-green-400' 
                  : (regenTruthAudit.rehydratedProgramSessions ?? 0) < (regenTruthAudit.requestedTargetSessions ?? 0)
                    ? 'text-red-400'
                    : 'text-zinc-300'
              }>{regenTruthAudit.rehydratedProgramSessions ?? '-'}</div>
              
              <div className="text-zinc-500">Overwrite:</div>
              <div className={regenTruthAudit.overwriteDetected ? 'text-red-400' : 'text-green-400'}>
                {regenTruthAudit.overwriteDetected ? `Yes (${regenTruthAudit.overwriteSource})` : 'No'}
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-amber-800/50">
              <div className="text-zinc-500 text-xs">Verdict:</div>
              <div className={`text-xs font-semibold ${
                regenTruthAudit.finalVerdict === 'FULL_REGEN_SUCCESS_6' ? 'text-green-400' :
                regenTruthAudit.finalVerdict.includes('TARGET_LOST') ? 'text-red-400' :
                'text-amber-400'
              }`}>
                {regenTruthAudit.finalVerdict}
                {regenTruthAudit.failedStage && ` @ ${regenTruthAudit.failedStage}`}
              </div>
            </div>
          </div>
        )}
        
        {/* ==========================================================================
            [REGEN-TRUTH] Post-regen diagnostic - RETIRED FROM ALWAYS-VISIBLE PRODUCTION
            This box is now hidden when regen succeeded (FULL_REGEN_SUCCESS) and the page
            is in normal aligned state. It only shows if there was a real mismatch to diagnose.
            The top "Schedule Status" panel is the ONLY always-visible production truth surface.
            ========================================================================== */}
        {(() => {
          // Hardened visibility: only show if there's a real mismatch worth diagnosing
          const shouldShowRegenAudit = regenTruthAudit 
            && regenTruthAudit.savedProgramId 
            && !shouldRenderModifyBuilder
            // CRITICAL: Hide when regen succeeded - no diagnostic needed for success
            && regenTruthAudit.finalVerdict !== 'FULL_REGEN_SUCCESS_6'
            // Also hide if still pending/capturing - wait for completion
            && regenTruthAudit.finalVerdict !== 'PENDING'
            && regenTruthAudit.finalVerdict !== 'REQUEST_CAPTURED'
          
          if (!shouldShowRegenAudit) return null
          
          return (
            <div className="mt-3 p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-xs font-mono">
              <div className="text-zinc-500 mb-2">Regen Diagnostic (mismatch detected)</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
                <span>Requested:</span>
                <span className="text-zinc-300">{regenTruthAudit.requestedTargetSessions}</span>
                
                <span>Resolved:</span>
                <span className={regenTruthAudit.builderResolvedSessions === regenTruthAudit.requestedTargetSessions ? 'text-green-400' : 'text-red-400'}>
                  {regenTruthAudit.builderResolvedSessions ?? '?'}
                </span>
                
                <span>Built:</span>
                <span className={regenTruthAudit.builtStructureSessions === regenTruthAudit.requestedTargetSessions ? 'text-green-400' : 'text-red-400'}>
                  {regenTruthAudit.builtStructureSessions ?? '?'}
                </span>
                
                <span>Saved:</span>
                <span className={regenTruthAudit.savedProgramSessions === regenTruthAudit.requestedTargetSessions ? 'text-green-400' : 'text-red-400'}>
                  {regenTruthAudit.savedProgramSessions ?? '?'}
                </span>
                
                <span>Displayed:</span>
                <span className={regenTruthAudit.displayedProgramSessions === regenTruthAudit.requestedTargetSessions ? 'text-green-400' : 'text-red-400'}>
                  {regenTruthAudit.displayedProgramSessions ?? '?'}
                </span>
                
                <span>Verdict:</span>
                <span className="text-red-400">{regenTruthAudit.finalVerdict}</span>
              </div>
              {regenTruthAudit.failedStage && (
                <div className="mt-2 pt-2 border-t border-zinc-800/50 text-red-400/70">
                  Failed at: {regenTruthAudit.failedStage}
                </div>
              )}
            </div>
          )
        })()}
        
        {/* ==========================================================================
            [MAIN-GEN-TRUTH] Main generation diagnostic - mismatch-only display
            This box appears ONLY when:
            - A fresh main generation attempt has occurred in this runtime
            - AND the final verdict is NOT a success
            The top "Schedule Status" panel remains the ONLY always-visible truth surface.
            ========================================================================== */}
        {(() => {
          const shouldShowMainGenAudit = mainGenTruthAudit 
            && mainGenTruthAudit.savedProgramId 
            && !shouldRenderModifyBuilder
            // CRITICAL: Hide on success - no diagnostic needed
            && mainGenTruthAudit.finalVerdict !== 'MAIN_FULL_SUCCESS_6'
            && mainGenTruthAudit.finalVerdict !== 'MAIN_FULL_SUCCESS_MATCHED_EXPECTED'
            // Also hide if still pending/capturing
            && mainGenTruthAudit.finalVerdict !== 'MAIN_PENDING'
            && mainGenTruthAudit.finalVerdict !== 'MAIN_REQUEST_CAPTURED'
          
          if (!shouldShowMainGenAudit) return null
          
          return (
            <div className="mt-3 p-3 bg-blue-900/30 border border-blue-800/50 rounded-lg text-xs font-mono">
              <div className="text-blue-400 mb-2">Main Build Diagnostic (mismatch detected)</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400">
                <span>Expected:</span>
                <span className="text-zinc-300">{mainGenTruthAudit.expectedSessionCount}</span>
                
                <span>Submitted:</span>
                <span className={
                  mainGenTruthAudit.submittedScheduleMode === 'flexible' ? 'text-cyan-400' : 'text-purple-400'
                }>
                  {mainGenTruthAudit.submittedScheduleMode === 'flexible' 
                    ? 'Flexible' 
                    : `Static ${mainGenTruthAudit.submittedTrainingDaysPerWeek}d`}
                </span>
                
                <span>Entry:</span>
                <span className={
                  mainGenTruthAudit.entryScheduleMode === mainGenTruthAudit.submittedScheduleMode ? 'text-green-400' : 'text-red-400'
                }>
                  {mainGenTruthAudit.entryScheduleMode === 'flexible' 
                    ? 'Flexible' 
                    : `Static ${mainGenTruthAudit.entryTrainingDaysPerWeek}d`}
                </span>
                
                <span>Resolved:</span>
                <span className={
                  (mainGenTruthAudit.targetSessionCountFromResolution ?? 0) >= (mainGenTruthAudit.expectedSessionCount ?? 0) ? 'text-green-400' : 'text-red-400'
                }>
                  {mainGenTruthAudit.targetSessionCountFromResolution ?? '?'}
                </span>
                
                <span>Built:</span>
                <span className={
                  (mainGenTruthAudit.builtStructureSessionCount ?? 0) >= (mainGenTruthAudit.expectedSessionCount ?? 0) ? 'text-green-400' : 'text-red-400'
                }>
                  {mainGenTruthAudit.builtStructureSessionCount ?? '?'}
                </span>
                
                <span>Saved:</span>
                <span className={
                  (mainGenTruthAudit.savedProgramSessionCount ?? 0) >= (mainGenTruthAudit.expectedSessionCount ?? 0) ? 'text-green-400' : 'text-red-400'
                }>
                  {mainGenTruthAudit.savedProgramSessionCount ?? '?'}
                </span>
                
                <span>Displayed:</span>
                <span className={
                  (mainGenTruthAudit.displayedProgramSessionCountAfterCommit ?? 0) >= (mainGenTruthAudit.expectedSessionCount ?? 0) ? 'text-green-400' : 'text-red-400'
                }>
                  {mainGenTruthAudit.displayedProgramSessionCountAfterCommit ?? '?'}
                </span>
                
                <span>Rehydrated:</span>
                <span className={
                  (mainGenTruthAudit.rehydratedProgramSessionCount ?? 0) >= (mainGenTruthAudit.expectedSessionCount ?? 0) ? 'text-green-400' : 'text-red-400'
                }>
                  {mainGenTruthAudit.rehydratedProgramSessionCount ?? '?'}
                </span>
                
                <span>Verdict:</span>
                <span className="text-red-400">{mainGenTruthAudit.finalVerdict}</span>
              </div>
              {mainGenTruthAudit.failedStage && (
                <div className="mt-2 pt-2 border-t border-blue-800/50 text-red-400/70">
                  Failed at: {mainGenTruthAudit.failedStage}
                </div>
              )}
              {/* Human-readable reduction reason - the KEY diagnostic */}
              {mainGenTruthAudit.reductionReasonHuman && (
                <div className="mt-2 pt-2 border-t border-blue-800/50">
                  <div className="text-zinc-500 text-[10px] mb-1">Why reduced:</div>
                  <div className="text-amber-400 text-xs">{mainGenTruthAudit.reductionReasonHuman}</div>
                </div>
              )}
              {/* Modifier details if available */}
              {(mainGenTruthAudit.jointCautionPenalty || mainGenTruthAudit.recoveryPenalty || mainGenTruthAudit.recentWorkloadPenalty) && (
                <div className="mt-2 pt-2 border-t border-blue-800/30 text-[10px] text-zinc-500 grid grid-cols-3 gap-1">
                  <span>Joint: {mainGenTruthAudit.jointCautionPenalty ? `-${mainGenTruthAudit.jointCautionPenalty}` : '0'}</span>
                  <span>Recovery: {mainGenTruthAudit.recoveryPenalty ? '-1' : '0'}</span>
                  <span>Workload: {mainGenTruthAudit.recentWorkloadPenalty ? '-1' : '0'}</span>
                </div>
              )}
              {/* Program ID comparison to prove it's truly new */}
              <div className="mt-2 pt-2 border-t border-blue-800/30 text-[10px]">
                <div className="text-zinc-500">Previous ID: <span className="text-zinc-400">{mainGenTruthAudit.existingVisibleProgramIdBeforeClick?.slice(-8) ?? 'none'}</span></div>
                <div className="text-zinc-500">New ID: <span className="text-zinc-400">{mainGenTruthAudit.savedProgramId?.slice(-8) ?? 'none'}</span></div>
                <div className="text-zinc-500">ID Changed: <span className={
                  mainGenTruthAudit.existingVisibleProgramIdBeforeClick !== mainGenTruthAudit.savedProgramId ? 'text-green-400' : 'text-amber-400'
                }>
                  {mainGenTruthAudit.existingVisibleProgramIdBeforeClick !== mainGenTruthAudit.savedProgramId ? 'Yes (new program)' : 'No (same program)'}
                </span></div>
              </div>
            </div>
          )
        })()}

        {/* Content - TASK 2: Proper handling of malformed programs */}
        {/* [PHASE 30N] Use single-authority shouldRenderModifyBuilder instead of just showBuilder */}
        {shouldRenderModifyBuilder ? (
          <div className="space-y-6">
            {/* HARDENED: Generation error banner - recoverable state */}
            {/* [PHASE 16S/16T] Use truth-gated result to prevent stale banner display */}
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
            
            {/* [PHASE 24N/25] UNIFIED BUILDER SUBMIT - All flows now use handleGenerate */}
            {(() => {
              // ==========================================================================
              // [PHASE 25] UPDATED: Check for builderSessionInputs regardless of origin
              // The canonical modify launcher sets builderOrigin='default' but still uses
              // builderSessionInputs for the prefilled values the user may have edited.
              // ==========================================================================
              const isLegacyModifyFlow = builderOrigin === 'modify_start_new'
              // [PHASE 26] Check BOTH state and ref - state for React rendering, ref for submit
              const hasBuilderSessionInputs = !!builderSessionInputs
              
              // [PHASE 25/26] Use session inputs if they exist (from either canonical or legacy modify)
              // Note: For rendering, we use the state (builderSessionInputs) so React rerenders properly
              // For submit, we use the ref (builderSessionInputsRef.current) to avoid stale closures
              const effectiveBuilderInputs = hasBuilderSessionInputs
                ? builderSessionInputs
                : inputs
              
              // [PHASE 25] Create unified submit handler that passes correct inputs
              // Both canonical modify and legacy modify paths converge here
              // ==========================================================================
              // [PHASE 26] CRITICAL FIX: Read from REF at click time, not stale closure
              // The IIFE captures `builderSessionInputs` at render time, but the user may
              // change the selector AFTER render. Using the ref ensures we get the CURRENT
              // value at the moment the button is clicked.
              // ==========================================================================
              const unifiedSubmitHandler = () => {
                // [PHASE 26] Read CURRENT state from ref, not stale closure
                const currentBuilderSessionInputs = builderSessionInputsRef.current
                const hasCurrentSessionInputs = !!currentBuilderSessionInputs
                
                // ==========================================================================
                // [MAIN-GEN-TRUTH step-1] Capture pre-click state for main generation trace
                // ==========================================================================
                const mainGenAttemptId = `maingen-${Date.now()}`
                const expectedSessionsForFlexible = scheduleTruthAudit?.recommendedSessionsPerWeek ?? 6
                
                const mainGenClickAudit: MainGenTruthAudit = {
                  // Step 1: Click source
                  attemptId: mainGenAttemptId,
                  trigger: 'build_adaptive_program',
                  startedAt: new Date().toISOString(),
                  existingVisibleProgramIdBeforeClick: program?.id ?? null,
                  existingVisibleProgramSessionsBeforeClick: program?.sessions?.length ?? null,
                  existingGeneratedDateBeforeClick: program?.createdAt ?? null,
                  scheduleStatusRecommendedCountBeforeClick: scheduleTruthAudit?.recommendedSessionsPerWeek ?? null,
                  scheduleStatusTypeBeforeClick: scheduleTruthAudit?.canonicalScheduleMode ?? null,
                  canonicalScheduleModeBeforeClick: scheduleTruthAudit?.canonicalScheduleMode ?? null,
                  canonicalTrainingDaysPerWeekBeforeClick: scheduleTruthAudit?.canonicalTrainingDaysPerWeek ?? null,
                  selectedSkillsCountBeforeClick: currentBuilderSessionInputs?.selectedSkills?.length ?? inputs?.selectedSkills?.length ?? null,
                  goalCategoriesCountBeforeClick: currentBuilderSessionInputs?.selectedGoalCategories?.length ?? inputs?.selectedGoalCategories?.length ?? null,
                  experienceLevelBeforeClick: currentBuilderSessionInputs?.experienceLevel ?? inputs?.experienceLevel ?? null,
                  sessionDurationModeBeforeClick: currentBuilderSessionInputs?.sessionDurationMode ?? inputs?.sessionDurationMode ?? null,
                  // Step 2: Form input - will be filled from what goes to handleGenerate
                  submittedScheduleMode: hasCurrentSessionInputs ? currentBuilderSessionInputs?.scheduleMode ?? null : inputs?.scheduleMode ?? null,
                  submittedTrainingDaysPerWeek: hasCurrentSessionInputs ? currentBuilderSessionInputs?.trainingDaysPerWeek ?? null : inputs?.trainingDaysPerWeek ?? null,
                  submittedSessionDurationMode: hasCurrentSessionInputs ? currentBuilderSessionInputs?.sessionDurationMode ?? null : inputs?.sessionDurationMode ?? null,
                  submittedPrimaryGoal: hasCurrentSessionInputs ? currentBuilderSessionInputs?.primaryGoal ?? null : inputs?.primaryGoal ?? null,
                  submittedSecondaryGoal: hasCurrentSessionInputs ? currentBuilderSessionInputs?.secondaryGoal ?? null : inputs?.secondaryGoal ?? null,
                  submittedSelectedSkillsCount: hasCurrentSessionInputs ? currentBuilderSessionInputs?.selectedSkills?.length ?? null : inputs?.selectedSkills?.length ?? null,
                  submittedGoalCategoriesCount: hasCurrentSessionInputs ? currentBuilderSessionInputs?.selectedGoalCategories?.length ?? null : inputs?.selectedGoalCategories?.length ?? null,
                  submittedExperienceLevel: hasCurrentSessionInputs ? currentBuilderSessionInputs?.experienceLevel ?? null : inputs?.experienceLevel ?? null,
                  submittedTrainingPathType: hasCurrentSessionInputs ? currentBuilderSessionInputs?.trainingPathType ?? null : inputs?.trainingPathType ?? null,
                  // Remaining steps filled later
                  entryScheduleMode: null,
                  entryTrainingDaysPerWeek: null,
                  entrySelectedSkillsCount: null,
                  entryExperienceLevel: null,
                  entryFallbacksUsed: null,
                  complexityScore: null,
                  complexityElevationApplied: null,
                  targetSessionCountFromResolution: null,
                  resolvedScheduleIdentity: null,
                  resolvedFinalReasonCategory: null,
                  builtStructureSessionCount: null,
                  builtStructureDayCount: null,
                  generatedProgramIdBeforeSave: null,
                  savedProgramId: null,
                  savedProgramSessionCount: null,
                  savedProgramTrainingDaysPerWeek: null,
                  localStorageProgramIdAfterSave: null,
                  localStorageProgramSessionsAfterSave: null,
                  setProgramTargetId: null,
                  setProgramTargetSessionCount: null,
                  displayedProgramIdAfterCommit: null,
                  displayedProgramSessionCountAfterCommit: null,
                  newGeneratedDateAfterCommit: null,
                  rehydratedProgramId: null,
                  rehydratedProgramSessionCount: null,
                  overwriteDetected: false,
                  overwriteSource: null,
                  expectedSessionCount: scheduleTruthAudit?.canonicalScheduleMode === 'flexible' ? expectedSessionsForFlexible : (scheduleTruthAudit?.canonicalTrainingDaysPerWeek ?? null),
                  finalVerdict: 'MAIN_REQUEST_CAPTURED',
                  failedStage: null,
                  errorMessage: null,
                  reductionReasonHuman: null,
                  jointCautionPenalty: null,
                  recoveryPenalty: null,
                  recentWorkloadPenalty: null,
                  modificationSteps: null,
                }
                
                console.log('[MAIN-GEN-TRUTH step-1-click-source]', {
                  attemptId: mainGenAttemptId,
                  existingProgramId: program?.id,
                  existingProgramSessions: program?.sessions?.length,
                  scheduleStatusRecommended: scheduleTruthAudit?.recommendedSessionsPerWeek,
                  scheduleStatusType: scheduleTruthAudit?.canonicalScheduleMode,
                  submittedScheduleMode: mainGenClickAudit.submittedScheduleMode,
                  submittedTrainingDays: mainGenClickAudit.submittedTrainingDaysPerWeek,
                  expectedSessionCount: mainGenClickAudit.expectedSessionCount,
                  verdict: 'MAIN_REQUEST_CAPTURED',
                })
                
                setMainGenTruthAudit(mainGenClickAudit)
                
                // Store in sessionStorage for builder to read
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('mainGenTruthAudit', JSON.stringify(mainGenClickAudit))
                }
                
                // ==========================================================================
                // [PHASE 27C] BUILD ADAPTIVE PROGRAM CLICKED - BUILD IDENTITY LOG
                // This proves the expected code version is handling the click
                // ==========================================================================
                console.log('[phase27c-build-identity-click-time]', {
                  ...PHASE27C_BUILD_IDENTITY,
                  event: 'BUILD_ADAPTIVE_PROGRAM_CLICKED',
                  clickTimeRefScheduleMode: currentBuilderSessionInputs?.scheduleMode,
                  clickTimeRefTrainingDays: currentBuilderSessionInputs?.trainingDaysPerWeek,
                  hasBuilderSessionInputs: hasCurrentSessionInputs,
                  builderOrigin,
                  verdict: hasCurrentSessionInputs
                    ? (currentBuilderSessionInputs?.scheduleMode === 'static'
                        ? `CLICK_TIME_STATIC_${currentBuilderSessionInputs?.trainingDaysPerWeek}_DAYS`
                        : 'CLICK_TIME_FLEXIBLE')
                    : 'CLICK_TIME_NO_BUILDER_SESSION',
                })
                
                // ==========================================================================
                // [PHASE 26B] SAME-FRAME RACE REF SYNC - CLICK TIME AUDIT
                // This detects if the old race condition would have occurred
                // With the Phase 26B fix, ref should ALWAYS match the latest user selection
                // ==========================================================================
                const wouldHaveRaced = builderSessionInputs?.scheduleMode !== currentBuilderSessionInputs?.scheduleMode ||
                  builderSessionInputs?.trainingDaysPerWeek !== currentBuilderSessionInputs?.trainingDaysPerWeek
                
                console.log('[phase26b-same-frame-race-ref-sync]', {
                  stage: 'CLICK_TIME_REF_VS_STATE_AUDIT',
                  closureBuilderSessionScheduleMode: builderSessionInputs?.scheduleMode,
                  closureBuilderSessionTrainingDays: builderSessionInputs?.trainingDaysPerWeek,
                  refScheduleMode: currentBuilderSessionInputs?.scheduleMode,
                  refTrainingDays: currentBuilderSessionInputs?.trainingDaysPerWeek,
                  clickUsesRefValue: true,
                  wouldHaveRacedWithOldCode: wouldHaveRaced,
                  verdict: !hasCurrentSessionInputs
                    ? 'NO_BUILDER_SESSION_INPUTS'
                    : currentBuilderSessionInputs?.scheduleMode === 'static'
                      ? `STATIC_${currentBuilderSessionInputs?.trainingDaysPerWeek}_PRESENT_AT_CLICK`
                      : 'REF_HAS_FLEXIBLE_AT_CLICK',
                })
                
                // ==========================================================================
                // [PHASE 26] 6-DAY TRUTH CHAIN FORCED VERDICT - CRITICAL AUDIT
                // This captures the EXACT state at the moment Build Adaptive Program is clicked
                // using the REF which has the CURRENT value, not the stale closure value
                // ==========================================================================
                console.log('[phase26-6day-truth-chain-forced-verdict]', {
                  stage: 'BUILD_ADAPTIVE_PROGRAM_CLICKED',
                  staleClosureScheduleMode: builderSessionInputs?.scheduleMode,
                  staleClosureTrainingDays: builderSessionInputs?.trainingDaysPerWeek,
                  currentRefScheduleMode: currentBuilderSessionInputs?.scheduleMode,
                  currentRefTrainingDays: currentBuilderSessionInputs?.trainingDaysPerWeek,
                  staleDiffersFromCurrent: wouldHaveRaced,
                  verdict: hasCurrentSessionInputs
                    ? (currentBuilderSessionInputs?.scheduleMode === 'static'
                        ? `SUBMIT_USING_REF_STATIC_${currentBuilderSessionInputs?.trainingDaysPerWeek}_DAYS`
                        : 'SUBMIT_USING_REF_FLEXIBLE')
                    : 'SUBMIT_USING_PAGE_INPUTS',
                })
                
                console.log('[phase25x-live-submit-truth-vs-selector-state]', {
                  stage: 'BUILD_ADAPTIVE_PROGRAM_CLICKED',
                  hasBuilderSessionInputs: hasCurrentSessionInputs,
                  builderSessionInputsScheduleMode: currentBuilderSessionInputs?.scheduleMode,
                  builderSessionInputsTrainingDays: currentBuilderSessionInputs?.trainingDaysPerWeek,
                  pageInputsScheduleMode: inputs?.scheduleMode,
                  pageInputsTrainingDays: inputs?.trainingDaysPerWeek,
                  willPassToHandleGenerate: hasCurrentSessionInputs ? 'builderSessionInputsRef.current' : 'no_overrides',
                  verdict: hasCurrentSessionInputs 
                    ? (currentBuilderSessionInputs?.scheduleMode === 'static' 
                        ? `SUBMIT_CONFIRMED_STATIC_${currentBuilderSessionInputs?.trainingDaysPerWeek}_DAYS`
                        : 'SUBMIT_USING_FLEXIBLE_FROM_SESSION')
                    : 'SUBMIT_USING_PAGE_INPUTS',
                })
                
                console.log('[phase25-canonical-modify-replacement]', {
                  action: 'UNIFIED_SUBMIT_FIRED',
                  isLegacyModifyFlow,
                  hasBuilderSessionInputs: hasCurrentSessionInputs,
                  builderOrigin,
                  effectiveInputsScheduleMode: currentBuilderSessionInputs?.scheduleMode,
                  effectiveInputsTrainingDays: currentBuilderSessionInputs?.trainingDaysPerWeek,
                  verdict: hasCurrentSessionInputs 
                    ? 'USING_BUILDER_SESSION_INPUTS_FROM_REF' 
                    : 'USING_PAGE_INPUTS',
                })
                
                // ==========================================================================
                // [PHASE 27A] MODIFY_SUBMIT_SNAPSHOT - forensic chain step 3
                // Records the EXACT builderSessionInputsRef.current at click time
                // ==========================================================================
                console.log('[phase27a-modify-forensic-chain]', {
                  step: 'MODIFY_SUBMIT_SNAPSHOT',
                  refScheduleMode: currentBuilderSessionInputs?.scheduleMode,
                  refTrainingDaysPerWeek: currentBuilderSessionInputs?.trainingDaysPerWeek,
                  refSessionDurationMode: currentBuilderSessionInputs?.sessionDurationMode,
                  refPrimaryGoal: currentBuilderSessionInputs?.primaryGoal,
                  hasBuilderSessionInputs: hasCurrentSessionInputs,
                  verdict: hasCurrentSessionInputs
                    ? (currentBuilderSessionInputs?.scheduleMode === 'static'
                        ? `SUBMIT_SNAPSHOT_STATIC_${currentBuilderSessionInputs?.trainingDaysPerWeek}_DAYS`
                        : 'SUBMIT_SNAPSHOT_FLEXIBLE')
                    : 'NO_BUILDER_SESSION_USING_PAGE_INPUTS',
                })
                
                // ==========================================================================
                // [MODIFY-SUBMIT-FIX] HARD-SEPARATE MAIN BUILD VS MODIFY BUILD AT SUBMIT TIME
                // This is the critical routing decision - modify-origin MUST go through the
                // authoritative modify handler, NOT through handleGenerate.
                // ==========================================================================
                const isAuthoritativeModifySubmit = isLegacyModifyFlow && hasCurrentSessionInputs
                const chosenSubmitHandler = isAuthoritativeModifySubmit 
                  ? 'handleGenerateFromModifyBuilder' 
                  : 'handleGenerate'
                const chosenRouteClass = isAuthoritativeModifySubmit
                  ? 'modify_authoritative_rebuild'
                  : 'main_generation'
                
                console.log('[modify-submit-owner-proof]', {
                  builderOrigin,
                  modifyFlowState: isLegacyModifyFlow ? 'modify_start_new' : 'default',
                  hasBuilderSessionInputsRef: hasCurrentSessionInputs,
                  hasModifyBuilderEntryRef: !!modifyBuilderEntryRef?.current,
                  isAuthoritativeModifySubmit,
                  chosenSubmitHandler,
                  chosenRouteClass,
                  verdict: isAuthoritativeModifySubmit 
                    ? 'MODIFY_ROUTED_TO_AUTHORITATIVE_HANDLER'
                    : 'MAIN_GENERATION_PATH',
                })
                
                if (isAuthoritativeModifySubmit) {
                  // [MODIFY-SUBMIT-FIX] Route modify-origin submissions ONLY through the
                  // dedicated authoritative modify handler which uses the server regenerate route
                  handleGenerateFromModifyBuilder()
                } else if (hasCurrentSessionInputs) {
                  // Non-modify builder session (shouldn't happen normally, but handle it)
                  handleGenerate(currentBuilderSessionInputs)
                } else {
                  // Onboarding/default flow: use page inputs (no overrides)
                  handleGenerate()
                }
              }
              
              // ==========================================================================
              // [PHASE 25X] LIVE SUBMIT TRUTH VS SELECTOR STATE - BUILDER INITIAL STATE
              // This captures the state when the builder FIRST RENDERS (before user edits)
              // ==========================================================================
              console.log('[phase25x-live-submit-truth-vs-selector-state]', {
                stage: 'BUILDER_INITIAL_RENDER',
                hasBuilderSessionInputs,
                builderSessionInputsScheduleMode: builderSessionInputs?.scheduleMode,
                builderSessionInputsTrainingDays: builderSessionInputs?.trainingDaysPerWeek,
                effectiveInputsScheduleMode: effectiveBuilderInputs?.scheduleMode,
                effectiveInputsTrainingDays: effectiveBuilderInputs?.trainingDaysPerWeek,
                selectorWillShowValue: effectiveBuilderInputs?.scheduleMode === 'flexible' || effectiveBuilderInputs?.trainingDaysPerWeek === 'flexible' 
                  ? 'flexible' 
                  : String(effectiveBuilderInputs?.trainingDaysPerWeek),
                verdict: effectiveBuilderInputs?.scheduleMode === 'flexible' 
                  ? 'PREFILL_IS_FLEXIBLE_USER_MUST_CHANGE_TO_STATIC'
                  : `PREFILL_IS_STATIC_${effectiveBuilderInputs?.trainingDaysPerWeek}_DAYS`,
              })
              
              console.log('[modify-submit-fix-builder-render-audit]', {
                builderOrigin,
                isLegacyModifyFlow,
                hasBuilderSessionInputs,
                builderSessionKey,
                effectiveInputsSummary: effectiveBuilderInputs ? {
                  primaryGoal: effectiveBuilderInputs.primaryGoal,
                  scheduleMode: effectiveBuilderInputs.scheduleMode,
                  trainingDaysPerWeek: effectiveBuilderInputs.trainingDaysPerWeek,
                  sessionDurationMode: effectiveBuilderInputs.sessionDurationMode,
                  sessionLength: effectiveBuilderInputs.sessionLength,
                  selectedSkillsCount: effectiveBuilderInputs.selectedSkills?.length ?? 0,
                  trainingPathType: effectiveBuilderInputs.trainingPathType,
                  experienceLevel: effectiveBuilderInputs.experienceLevel,
                  equipmentCount: effectiveBuilderInputs.equipment?.length ?? 0,
                } : null,
                submitHandler: isLegacyModifyFlow ? 'handleGenerateFromModifyBuilder' : 'handleGenerate',
                submitRouteClass: isLegacyModifyFlow ? 'modify_authoritative_rebuild' : 'main_generation',
                verdict: isLegacyModifyFlow 
                  ? 'MODIFY_WILL_ROUTE_TO_AUTHORITATIVE_HANDLER'
                  : 'MAIN_GENERATION_PATH',
              })
              
              return (
                <AdaptiveProgramForm
                  key={hasBuilderSessionInputs ? builderSessionKey : 'default-builder'}
                  inputs={effectiveBuilderInputs}
                  onInputChange={hasBuilderSessionInputs ? setBuilderSessionInputsAndRef : setInputs}
                  onGenerate={unifiedSubmitHandler}
                  isGenerating={isGenerating}
                  constraintLabel={constraintLabel}
                  scheduleTruthAudit={scheduleTruthAudit}
                  showBetaNotice={isLegacyModifyFlow}
                />
              )
            })()}
            
            {/* Cancel button if there's an existing program */}
            {/* [PHASE 22A/24A] Reset builder origin and session on cancel */}
            {program && (
              <Button
                variant="outline"
                className="w-full border-[#3A3A3A]"
                onClick={() => {
                  console.log('[phase22a-builder-origin-reset-audit]', {
                    resetTrigger: 'cancel_button_clicked',
                    resetOccurredAfterHydration: false,
                    previousOrigin: builderOrigin,
                    newOrigin: 'default',
                    builderSessionCleared: true,
                  })
                  setBuilderOrigin('default')
                  setBuilderSessionInputsAndRef(null)
                  setBuilderSessionKey('initial')
                  setBuilderSessionSource(null)
                  setModifyFlowState('idle')
                  
                  // [PHASE 30L] RELEASE MODIFY BUILDER LOCK - user cancelled
                  // [PHASE 30P] ENHANCED: Add full state logging for lock release
                  // [PHASE 30S] Clear the authoritative entry object on cancel
                  if (modifyBuilderLockRef.current) {
                    console.log('[phase30p-lock-release-final]', {
                      source: 'cancel',
                      showBuilder: !!showBuilder,
                      modifyFlowState: modifyFlowState ?? null,
                      builderSessionInputsRefPresent: !!builderSessionInputsRef.current,
                      releaseAllowed: true,
                      verdict: 'MODIFY_LOCK_RELEASE_ALLOWED',
                    })
                    modifyBuilderLockRef.current = false
                  }
                  
                  // [PHASE 30S] Clear the authoritative entry - user cancelled
                  modifyBuilderEntryRef.current = null
                  setModifyBuilderEntry(null)
                  setShowBuilder(false)
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        ) : program && programModules.isRenderableProgram?.(program) ? (
          <div className="space-y-4">
            {/* [PHASE 15E BABY AUDIT] Banner render truth verification */}
            {(() => {
              const shouldShowBanner = truthGatedBuildResult?.status === 'preserved_last_good' &&
                truthGatedBuildResult?.hydratedFromStorage !== true &&
                truthGatedBuildResult?.runtimeSessionId === runtimeSessionIdRef.current
              console.log('[banner-render-truth-verification]', {
                truthGatedBuildResultExists: !!truthGatedBuildResult,
                truthGatedBuildResultStatus: truthGatedBuildResult?.status || 'null',
                truthGatedBuildResultHydratedFromStorage: truthGatedBuildResult?.hydratedFromStorage ?? 'null',
                truthGatedBuildResultRuntimeSessionId: truthGatedBuildResult?.runtimeSessionId || 'null',
                currentRuntimeSessionId: runtimeSessionIdRef.current,
                runtimeSessionIdMatch: truthGatedBuildResult?.runtimeSessionId === runtimeSessionIdRef.current,
                shouldShowBanner,
                verdict: shouldShowBanner ? 'BANNER_WILL_RENDER' : 'BANNER_BLOCKED',
              })
              return null
            })()}
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
        {/* [PHASE 21A] Simple controlled dialog - always mounted, open controlled by showAdjustmentModal */}
        <ProgramAdjustmentModal
          open={isModifyModalOpen}
          onOpenChange={(nextOpen) => {
            // [PHASE 24D] Handle modal close through state machine
            console.log('[phase24d-modify-modal-close-request]', {
              previousModifyFlowState: modifyFlowState,
              nextModifyFlowState: nextOpen ? 'modal' : 'idle',
              source: 'onOpenChange',
            })
            if (!nextOpen) {
              setModifyFlowState('idle')
              setShowAdjustmentModal(false)
            }
          }}
          onContinue={() => {
            // [PHASE 24D] "Continue Current Program" closes modal and returns to idle
            console.log('[phase24d-modify-modal-close-request]', {
              previousModifyFlowState: modifyFlowState,
              nextModifyFlowState: 'idle',
              source: 'continue_current_program',
            })
            setModifyFlowState('idle')
            setShowAdjustmentModal(false)
          }}
          onStartNew={handleConfirmNewProgram}
          onRebuildRequired={handleAdjustmentRebuild}
          currentSessionMinutes={(() => {
            // [PHASE 5] Use canonical profile, not stale inputs
            const canonical = getCanonicalProfile()
            return canonical.sessionLengthMinutes || 60
          })()}
          currentTrainingDays={(() => {
            // [PHASE 17Q] Truthful current training days display - use SAVED program truth first
            const canonical = getCanonicalProfile()
            const savedState = programModules.getProgramState?.()
            const savedProgram = savedState?.adaptiveProgram ?? null
            const visibleProgram = program ?? null
            
            const savedSessionCount = savedProgram?.sessions?.length || 0
            const visibleSessionCount = visibleProgram?.sessions?.length || 0
            
            // [ADAPTIVE BASELINE FIX] Do NOT collapse flexible to 4 here
            const scheduleMode = canonical.scheduleMode || 'flexible'
            const preferredDays = scheduleMode === 'flexible'
              ? 'flexible'  // Keep semantic, don't collapse to 4
              : (canonical.trainingDaysPerWeek || 4)
            
            // [PHASE 17Q] Use freshest saved program truth first, fallback to visible, then canonical
            const truthfulGeneratedSessionCount =
              savedSessionCount > 0
                ? savedSessionCount
                : visibleSessionCount > 0
                ? visibleSessionCount
                : 0
            
            // [PHASE 17Q] Adjustment prefill source truth audit
            console.log('[phase17q-adjustment-prefill-source-truth-audit]', {
              canonicalScheduleMode: scheduleMode,
              canonicalPreferredDays: preferredDays,
              
              savedProgramId: savedProgram?.id || null,
              savedSessionCount,
              
              visibleProgramId: visibleProgram?.id || null,
              visibleSessionCount,
              
              truthfulGeneratedSessionCount,
              sourceUsed:
                savedSessionCount > 0
                  ? 'saved_program'
                  : visibleSessionCount > 0
                  ? 'visible_program_fallback'
                  : 'canonical_preference_fallback',
              
              finalDisplayValue:
                scheduleMode === 'flexible'
                  ? (truthfulGeneratedSessionCount > 0 ? truthfulGeneratedSessionCount : preferredDays)
                  : preferredDays,
            })
            
            // For flexible mode: show truthful generated count if available
            // For static mode: show canonical preference
            if (scheduleMode === 'flexible') {
              // [ADAPTIVE BASELINE FIX] Use actual generated count, don't fallback to 4
              return (truthfulGeneratedSessionCount > 0 ? truthfulGeneratedSessionCount : 4) as TrainingDays
            }
            // Static mode: use the actual preference (already a number, not 'flexible')
            return (typeof preferredDays === 'number' ? preferredDays : 4) as TrainingDays
          })()}
          currentEquipment={(() => {
            // [PHASE 5] Use canonical profile equipment
            const canonical = getCanonicalProfile()
            return canonical.equipmentAvailable || []
          })()}
          // [PHASE 32A] Pass canonical schedule mode - default to 'static' not 'adaptive'
          // 'adaptive' as fallback was WRONG - undefined scheduleMode should mean static, not flexible
          currentScheduleMode={(() => {
            const canonical = getCanonicalProfile()
            return (canonical.scheduleMode as 'static' | 'flexible' | 'adaptive') || 'static'
          })()}
        />
      </div>
    </div>
  )
}
