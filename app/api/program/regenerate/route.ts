import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { executeAuthoritativeGeneration, logGenerationParityTable, type AuthoritativeGenerationRequest } from '@/lib/server/authoritative-program-generation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ==========================================================================
// [REGENERATE_RUNTIME_FINGERPRINT] Proves which source version is executing
// CORRIDOR_KILL_V4: Final selector corridor hardening - all layers must show V4
// ==========================================================================
const REGENERATE_RUNTIME_FINGERPRINT = 'REGEN_ROUTE_CORRIDOR_KILL_V4_2026_04_14'

/**
 * ==========================================================================
 * REGENERATE ROUTE - THIN ADAPTER
 * ==========================================================================
 * 
 * This route is now a THIN ADAPTER to the authoritative generation service.
 * It only:
 * 1. Validates the request
 * 2. Resolves authentication
 * 3. Maps request to AuthoritativeGenerationRequest
 * 4. Calls executeAuthoritativeGeneration
 * 5. Returns the result
 * 
 * ALL generation logic lives in lib/server/authoritative-program-generation.ts
 * ==========================================================================
 */

export async function POST(request: Request) {
  const routeStartTime = Date.now()
  // [TRUTH_SYNC_V1] Generate attempt ID at route entry for full corridor tracing
  const attemptId = `regen_${routeStartTime}_${Math.random().toString(36).slice(2, 8)}`
  
  // ==========================================================================
  // [REGEN_ROUTE_ENTRY] Authoritative runtime proof with fingerprint
  // [CORRIDOR_KILL_V4] Final selector corridor hardening - trace full corridor
  // ==========================================================================
  console.log('[REGEN_ROUTE_ENTRY]', {
    fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
    attemptId,
    fileOwner: '/api/program/regenerate/route.ts',
    functionOwner: 'POST',
    importChain: 'route.ts → authoritative-program-generation.ts → adaptive-program-builder.ts → program-exercise-selector.ts',
    phase: 'route_entry',
    timestamp: new Date().toISOString(),
  })
  
  console.log('[regenerate-route-thin-adapter-entry]', {
    timestamp: new Date().toISOString(),
    route: '/api/program/regenerate',
    adapterType: 'thin_adapter_to_authoritative_service',
  })
  
  try {
    // ==========================================================================
    // STEP 1: Authentication
    // ==========================================================================
    const { userId: authUserId } = await getSession()
    
    if (!authUserId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        failedStage: 'auth',
      }, { status: 401 })
    }
    
    // ==========================================================================
    // STEP 2: Resolve DB User ID
    // ==========================================================================
    const currentUser = await getCurrentUserServer()
    const { dbUserId, error: userResolutionError } = await resolveCanonicalDbUserId(
      authUserId,
      currentUser?.email,
      currentUser?.username
    )
    
    if (!dbUserId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to resolve user identity',
        failedStage: 'db_user_resolution',
      }, { status: 500 })
    }
    
    // ==========================================================================
    // STEP 3: Parse Request Body
    // ==========================================================================
    const body = await request.json()
    const { 
      canonicalProfile,
      programInputs,
      regenerationReason,
      currentProgramId,
    } = body
    
    // ==========================================================================
    // [PROTECTED_FUNNEL_IDENTITY_ENTRY] Route-level identity audit
    // Check if caller profile has userId before entering protected funnel
    // ==========================================================================
    const callerProfileUserId = canonicalProfile?.userId
    
    console.log('[PROTECTED_FUNNEL_ROUTE_IDENTITY_ENTRY]', {
      fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
      serverAuthUserId: authUserId?.slice(0, 12),
      serverDbUserId: dbUserId?.slice(0, 12),
      callerProfileUserId: callerProfileUserId?.slice(0, 12) || 'MISSING',
      callerProfileHasUserId: !!callerProfileUserId,
      identityWillBeRepaired: !callerProfileUserId && !!dbUserId,
      verdict: callerProfileUserId ? 'CALLER_HAS_IDENTITY' : (dbUserId ? 'WILL_REPAIR_FROM_SERVER' : 'NO_IDENTITY_SOURCE'),
    })
    
    // [ROOT-CAUSE-DIAGNOSTIC] Log request body structure for debugging
    console.log('[regenerate-route-request-body-audit]', {
      hasCanonicalProfile: !!canonicalProfile,
      canonicalProfileKeys: canonicalProfile ? Object.keys(canonicalProfile).slice(0, 10) : [],
      primaryGoal: canonicalProfile?.primaryGoal,
      selectedSkillsCount: canonicalProfile?.selectedSkills?.length || 0,
      scheduleMode: canonicalProfile?.scheduleMode,
      hasProgramInputs: !!programInputs,
      programInputsKeys: programInputs ? Object.keys(programInputs).slice(0, 10) : [],
      hasCurrentProgramId: !!currentProgramId,
      regenerationReason,
    })
    
    // [METHOD-PREFERENCE-BRIDGE, prompt 11] Mandated receipt audit #2.
    // Prove whether trainingMethodPreferences truth actually crossed the
    // HTTP boundary from the program page. The builder reads this field
    // directly; if it is empty, grouped methods are blocked downstream.
    {
      const rcvTrainingMethodPreferences: string[] = Array.isArray(canonicalProfile?.trainingMethodPreferences)
        ? canonicalProfile.trainingMethodPreferences
        : []
      const rcvSelectedStyles: string[] = Array.isArray(programInputs?.selectedStyles)
        ? programInputs.selectedStyles
        : []
      const nonBaseline = rcvTrainingMethodPreferences.filter((m: string) => m !== 'straight_sets')
      console.log('[regenerate-route-method-preference-truth-receipt-audit]', {
        source: 'POST_/api/program/regenerate:after_body_parse',
        canonical_trainingMethodPreferences: rcvTrainingMethodPreferences,
        canonical_trainingMethodPreferences_count: rcvTrainingMethodPreferences.length,
        programInputs_selectedStyles: rcvSelectedStyles,
        programInputs_selectedStyles_count: rcvSelectedStyles.length,
        builderWillSeeMethodTruthAs: nonBaseline.length > 0 ? 'PRESENT' : 'EMPTY',
      })
    }
    
    if (!canonicalProfile || !programInputs) {
      return NextResponse.json({
        success: false,
        error: 'Missing canonical profile or program inputs',
        failedStage: 'parse_request',
        diagnostics: {
          hasCanonicalProfile: !!canonicalProfile,
          hasProgramInputs: !!programInputs,
        },
      }, { status: 400 })
    }
    
    // ==========================================================================
    // STEP 4: Build Authoritative Generation Request
    // ==========================================================================
    const generationRequest: AuthoritativeGenerationRequest = {
      dbUserId,
      generationIntent: 'regenerate',
      triggerSource: 'regenerate',
      canonicalProfile,
      builderInputs: programInputs,
      existingProgramId: currentProgramId,
      isFreshBaselineBuild: true,  // Regenerate is a fresh baseline rebuild
      preserveHistory: true,
      archiveCurrentProgram: false,
      regenerationReason: regenerationReason || 'rebuild_from_current_settings',
    }
    
    console.log('[regenerate-route-dispatching-to-authoritative-service]', {
      generationIntent: generationRequest.generationIntent,
      triggerSource: generationRequest.triggerSource,
      isFreshBaselineBuild: generationRequest.isFreshBaselineBuild,
      primaryGoal: canonicalProfile?.primaryGoal,
      selectedSkillsCount: canonicalProfile?.selectedSkills?.length || 0,
    })
    
    // ==========================================================================
    // STEP 5: Call Authoritative Generation Service
    // ==========================================================================
    const result = await executeAuthoritativeGeneration(generationRequest)
    
    // Log parity table for verification
    logGenerationParityTable()
    
    // ==========================================================================
    // STEP 6: Return Result
    // ==========================================================================
    const totalElapsed = Date.now() - routeStartTime
    
    console.log('[regenerate-route-thin-adapter-complete]', {
      success: result.success,
      totalElapsedMs: totalElapsed,
      sessionCount: result.summary?.sessionCount,
      parityVerdict: result.parityVerdict.verdict,
    })
    
    // [PHASE 15E BABY AUDIT] Route response truth audit
    console.log('[regenerate-route-response-truth-audit]', {
      success: result.success,
      failedStage: result.failedStage || null,
      exactFailingSubstep: result.exactFailingSubstep || null,
      exactLastSafeSubstep: result.exactLastSafeSubstep || null,
      hasProgram: !!result.program,
      sessionCount: result.program?.sessions?.length || 0,
      statusReturned: result.success ? 200 : 500,
      verdict: result.success && result.program && result.program.sessions?.length > 0
        ? 'route_success_valid_program'
        : result.success
          ? 'route_success_but_invalid_program_shape'
          : 'route_failure_confirmed',
    })
    
    if (!result.success) {
      // [PHASE 15E] Extract exact substep diagnostics from service result (now typed)
      // [POST-TRUTH-CORRIDOR] Also extract corridor diagnostic fields
      const { 
        exactFailingSubstep, 
        exactLastSafeSubstep, 
        compactBuilderError, 
        compactStackPreview, 
        degradationAttempted,
        exactBuilderCorridor,
        exactLocalStep,
        fallbackApplied,
      } = result as typeof result & { 
        exactBuilderCorridor?: string
        exactLocalStep?: string
        fallbackApplied?: boolean
      }
      
    console.log('[regenerate-route-generation-failed]', {
      error: result.error,
      failedStage: result.failedStage,
      // [PHASE 15E] Exact substep diagnostic
      exactFailingSubstep,
      exactLastSafeSubstep,
      degradationAttempted,
      // [POST-TRUTH-CORRIDOR] Corridor diagnostic
      exactBuilderCorridor,
      exactLocalStep,
      fallbackApplied,
      timings: result.timings,
    })
    
    // ==========================================================================
    // [REGENERATE_SERVER_FAILURE_CONTRACT] Authoritative proof of failure fields
    // This log proves what failure data the service returned and route is passing
    // ==========================================================================
    console.log('[REGENERATE_SERVER_FAILURE_CONTRACT]', {
      fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
      httpStatus: 500,
      successField: false,
      failedStage: result.failedStage,
      exactFailingSubstep: exactFailingSubstep ?? 'not_present',
      exactLastSafeSubstep: exactLastSafeSubstep ?? 'not_present',
      exactBuilderCorridor: exactBuilderCorridor ?? 'not_present',
      exactLocalStep: exactLocalStep ?? 'not_present',
      compactBuilderError: compactBuilderError?.slice(0, 100) ?? 'not_present',
      degradationAttempted: degradationAttempted ?? false,
      fallbackApplied: fallbackApplied ?? false,
      fieldsSerializable: true,
      verdict: exactFailingSubstep || exactLocalStep 
        ? 'EXACT_FAILURE_FIELDS_PRESENT'
        : 'GENERIC_FAILURE_ONLY',
    })
    
    // ==========================================================================
    // [REGENERATE_ROUTE_FAILURE_PAYLOAD] Final payload being sent to client
    // ==========================================================================
    // Extract post-allocation tracking fields - consolidated owner corridor
    const lastSuccessfulPostAllocationCheckpointPayload = (result as Record<string, unknown>).lastSuccessfulPostAllocationCheckpoint as string | undefined
    const failingOwnerClassPayload = (result as Record<string, unknown>).failingOwnerClass as string | undefined
    const failingOwnerNamePayload = (result as Record<string, unknown>).failingOwnerName as string | undefined
    
    const failurePayload = {
      success: false,
      error: result.error,
      failedStage: result.failedStage,
      exactFailingSubstep,
      exactLastSafeSubstep,
      compactBuilderError,
      compactStackPreview,
      degradationAttempted,
      exactBuilderCorridor,
      exactLocalStep,
      fallbackApplied,
      // Post-allocation fatal audit fields - consolidated
      lastSuccessfulPostAllocationCheckpoint: lastSuccessfulPostAllocationCheckpointPayload,
      failingOwnerClass: failingOwnerClassPayload,
      failingOwnerName: failingOwnerNamePayload,
      timings: result.timings,
      diagnostics: {
        routeStage: 'authoritative_service_call',
        serviceStage: result.failedStage,
        generationIntent: 'regenerate',
        triggerSource: 'regenerate',
        // Consolidated owner corridor diagnostic
        ownerCorridorDiagnostic: exactBuilderCorridor ? {
          exactBuilderCorridor,
          exactLocalStep,
          lastSuccessfulPostAllocationCheckpoint: lastSuccessfulPostAllocationCheckpointPayload,
          failingOwnerClass: failingOwnerClassPayload,
          failingOwnerName: failingOwnerNamePayload,
        } : undefined,
      },
    }
    
    // Check if we have the required failure metadata
    const hasRequiredMetadata = !!(exactBuilderCorridor || exactLocalStep) && !!compactBuilderError
    
    console.log('[REGENERATE_ROUTE_FAILURE_PAYLOAD]', {
      fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
      payloadKeys: Object.keys(failurePayload),
      failedStage: failurePayload.failedStage,
      exactFailingSubstep: failurePayload.exactFailingSubstep ?? null,
      exactLocalStep: failurePayload.exactLocalStep ?? null,
      compactBuilderErrorPreview: failurePayload.compactBuilderError?.slice(0, 60) ?? null,
      hasDiagnostics: !!failurePayload.diagnostics,
      hasRequiredMetadata,
      verdict: hasRequiredMetadata ? 'PAYLOAD_READY_FOR_CLIENT' : 'RUNTIME_FAILURE_METADATA_MISSING',
    })
    
    // Log warning if metadata is missing despite builder/runtime failure
    if (!hasRequiredMetadata && result.failedStage) {
      console.error('[RUNTIME_FAILURE_METADATA_MISSING]', {
        fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
        failedStage: result.failedStage,
        exactBuilderCorridor: exactBuilderCorridor ?? 'MISSING',
        exactLocalStep: exactLocalStep ?? 'MISSING',
        compactBuilderError: compactBuilderError ?? 'MISSING',
        verdict: 'RUNTIME_FAILURE_METADATA_MISSING',
      })
    }
    
    // ==========================================================================
    // [AUTHORITATIVE_POST_ALLOCATION_FAILURE_SUMMARY] ONE authoritative summary
    // ==========================================================================
    // This is THE single log that shows the exact failing owner on regenerate failure.
    // Consolidated owner corridor - no more micro-step fragmentation.
    // ==========================================================================
    const lastSuccessfulPostAllocationCheckpoint = (result as Record<string, unknown>).lastSuccessfulPostAllocationCheckpoint as string | undefined
    const failingOwnerClass = (result as Record<string, unknown>).failingOwnerClass as string | undefined
    const failingOwnerName = (result as Record<string, unknown>).failingOwnerName as string | undefined
    
    // Determine verdict - supports handoff chain and consolidated owner corridor
    const verdictType = exactBuilderCorridor === 'post_allocation_handoff'
      ? 'POST_ALLOCATION_HANDOFF_FAILED'
      : exactBuilderCorridor === 'post_allocation_owner_corridor'
        ? 'POST_ALLOCATION_OWNER_CORRIDOR_FAILED'
        : exactBuilderCorridor === 'post_allocation_to_weekly_allocator'
          ? 'POST_ALLOCATION_HANDOFF_FAILED'
          : exactBuilderCorridor === 'post_allocation_to_visible_week'
            ? 'POST_ALLOCATION_HANDOFF_FAILED'
            : exactBuilderCorridor?.includes('post_allocation') 
              ? 'POST_ALLOCATION_HANDOFF_FAILED'
              : exactLocalStep === 'route_error'
                ? 'ROUTE_ONLY_FAILURE'
                : failingOwnerClass === 'optional_fallback'
                  ? 'OPTIONAL_OWNER_FAILED_BUT_CONTINUED'
                  : exactBuilderCorridor 
                    ? 'ROUTE_PRESERVED_BUILDER_OWNER'
                    : 'ROUTE_LOST_BUILDER_OWNER_METADATA'
    
    console.error('[AUTHORITATIVE_POST_ALLOCATION_FAILURE_SUMMARY]', {
      fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
      // Exact failure identification
      exactBuilderCorridor: exactBuilderCorridor ?? 'unknown',
      exactLocalStep: exactLocalStep ?? 'unknown',
      exactLastSafeSubstep: exactLastSafeSubstep ?? 'unknown',
      compactBuilderError: compactBuilderError?.slice(0, 150) ?? 'no_error_captured',
      // Post-allocation tracking
      lastSuccessfulPostAllocationCheckpoint: lastSuccessfulPostAllocationCheckpoint ?? 'not_tracked',
      failingOwnerClass: failingOwnerClass ?? 'unknown',
      failingOwnerName: failingOwnerName ?? 'unknown',
      // Stage info
      builderStage: result.failedStage ?? 'unknown',
      // Failure zone now differentiates handoff vs corridor
      failureZone: exactBuilderCorridor === 'post_allocation_handoff' 
        ? 'post_allocation_handoff'
        : exactBuilderCorridor?.includes('post_allocation') 
          ? 'post_allocation_handoff_chain' 
          : 'other',
      // Verdict
      verdict: verdictType,
    })
    
    return NextResponse.json(failurePayload, { status: 500 })
    }
    
    // [PHASE15E-FAILURE-SUMMARY-PROMOTION] Log attached summary for debugging
    const rebuildFailureSummary = result.rebuildFailureSummary
    console.log('[REGENERATE_RESPONSE_FAILURE_SUMMARY_ATTACHED]', {
      hasSummary: !!rebuildFailureSummary,
      totalDegraded: rebuildFailureSummary?.totalDegraded ?? 0,
      firstFailedCheckpoint: rebuildFailureSummary?.firstFailedCheckpoint ?? null,
      failureVerdict: rebuildFailureSummary?.failureVerdict ?? 'unknown',
    })
    
    // [ROUTE-RESPONSE-TRUTH-AUDIT] Final authoritative route response classification
    const routeClassification = {
      httpStatus: 200,
      successField: true,
      hasProgramWithSessions: !!(result.program && result.program.sessions?.length > 0),
      sessionCount: result.program?.sessions?.length ?? 0,
      totalDegraded: rebuildFailureSummary?.totalDegraded ?? 0,
      totalAttempted: rebuildFailureSummary?.totalAttempted ?? 0,
      totalSucceeded: rebuildFailureSummary?.totalSucceeded ?? 0,
      firstFailedCheckpoint: rebuildFailureSummary?.firstFailedCheckpoint ?? null,
      firstFailedFocus: rebuildFailureSummary?.firstFailedFocus ?? null,
      firstFailedIndex: rebuildFailureSummary?.firstFailedIndex ?? null,
    }
    
    const routeOutcomeType = 
      routeClassification.totalDegraded === 0 && routeClassification.hasProgramWithSessions
        ? 'HEALTHY_SUCCESS'
        : routeClassification.totalDegraded > 0 && routeClassification.hasProgramWithSessions
          ? 'DEGRADED_SUCCESS_WITH_PARTIAL_PROGRAM'
          : 'UNEXPECTED_STATE'
    
    // ==========================================================================
    // [REGENERATE_OUTCOME_ROUTE] AUTHORITATIVE OUTCOME CONTRACT
    // This is THE single source of truth for regenerate outcome classification
    // ==========================================================================
    const authoritativeOutcome = {
      outcomeMode: routeOutcomeType as 'HEALTHY_SUCCESS' | 'DEGRADED_SUCCESS_WITH_PARTIAL_PROGRAM' | 'UNEXPECTED_STATE',
      currentAttemptId: `regen_${Date.now()}`,
      totalDegraded: routeClassification.totalDegraded,
      totalAttempted: routeClassification.totalAttempted,
      totalSucceeded: routeClassification.totalSucceeded,
      shouldPromoteProgram: routeOutcomeType === 'HEALTHY_SUCCESS',
      shouldPreserveLastGood: routeOutcomeType === 'DEGRADED_SUCCESS_WITH_PARTIAL_PROGRAM',
      shouldClearFailureState: routeOutcomeType === 'HEALTHY_SUCCESS',
      firstFailedCheckpoint: routeClassification.firstFailedCheckpoint,
      firstFailedFocus: routeClassification.firstFailedFocus,
      firstFailedIndex: routeClassification.firstFailedIndex,
      compactFailureReason: rebuildFailureSummary?.failureVerdict ?? null,
      truthSource: routeOutcomeType === 'HEALTHY_SUCCESS' 
        ? 'healthy_generation' 
        : routeOutcomeType === 'DEGRADED_SUCCESS_WITH_PARTIAL_PROGRAM'
          ? 'degraded_generation'
          : 'unexpected_state',
    }
    
    console.log('[REGEN_ROUTE_OUTCOME]', {
      fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
      fileOwner: '/api/program/regenerate/route.ts',
      functionOwner: 'POST',
      ...authoritativeOutcome,
      sessionCount: routeClassification.sessionCount,
      httpStatus: 200,
      verdict: authoritativeOutcome.outcomeMode,
    })
    
    // ==========================================================================
    // [REGENERATE_HEALTHY_SUCCESS_CONTRACT] Proof of healthy success for audits
    // ==========================================================================
    console.log('[REGENERATE_HEALTHY_SUCCESS_CONTRACT]', {
      fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
      httpStatus: 200,
      successField: true,
      sessionCount: routeClassification.sessionCount,
      outcomeMode: authoritativeOutcome.outcomeMode,
      shouldClearFailureState: authoritativeOutcome.shouldClearFailureState,
      totalDegraded: authoritativeOutcome.totalDegraded,
      verdict: authoritativeOutcome.outcomeMode === 'HEALTHY_SUCCESS'
        ? 'HEALTHY_SUCCESS_CONFIRMED'
        : authoritativeOutcome.outcomeMode === 'DEGRADED_SUCCESS_WITH_PARTIAL_PROGRAM'
          ? 'DEGRADED_SUCCESS_CONFIRMED'
          : 'UNEXPECTED_STATE',
    })
    
    return NextResponse.json({
      success: true,
      program: result.program,
      timings: result.timings,
      summary: result.summary,
      parityVerdict: result.parityVerdict,
      // [PHASE15E-FAILURE-SUMMARY-PROMOTION] Expose authoritative rebuild failure summary
      rebuildFailureSummary,
      // [REGENERATE_OUTCOME_ROUTE] Expose authoritative outcome contract to page
      authoritativeOutcome,
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stackPreview = error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : 'no stack'
    
    console.log('[regenerate-route-thin-adapter-error]', {
      error: errorMessage,
      stackPreview,
      totalElapsedMs: Date.now() - routeStartTime,
    })
    
    // ==========================================================================
    // [REGENERATE_500_ROOT_OWNER] Identifies when 500 comes from outer catch
    // This proves the 500 is from route-level exception, not service failure
    // ==========================================================================
    console.log('[REGENERATE_500_ROOT_OWNER]', {
      fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
      httpStatus: 500,
      rootOwner: 'route_outer_catch',
      errorName: error instanceof Error ? error.name : 'unknown',
      errorMessage: errorMessage.slice(0, 200),
      stackTopLine: error instanceof Error ? error.stack?.split('\n')[1]?.trim()?.slice(0, 100) : 'no stack',
      verdict: 'ROUTE_CATCH_FAILURE_NOT_SERVICE_FAILURE',
    })
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      failedStage: 'route_error',
      // Include exact fields for page extraction even in route catch
      exactFailingSubstep: 'route_outer_catch',
      exactLocalStep: 'route_error',
      compactBuilderError: errorMessage.slice(0, 200),
      diagnostics: {
        routeStage: 'route_catch_block',
        serviceStage: 'unknown',
        stackPreview: stackPreview?.substring(0, 500),
        generationIntent: 'regenerate',
        triggerSource: 'regenerate',
      },
    }, { status: 500 })
  }
}
