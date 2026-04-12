import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { executeAuthoritativeGeneration, logGenerationParityTable, type AuthoritativeGenerationRequest } from '@/lib/server/authoritative-program-generation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ==========================================================================
// [REGENERATE_RUNTIME_FINGERPRINT] Proves which source version is executing
// ==========================================================================
const REGENERATE_RUNTIME_FINGERPRINT = 'REGEN_AUDIT_2026_04_11_V2'

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
  
  // ==========================================================================
  // [REGEN_ROUTE_ENTRY] Authoritative runtime proof with fingerprint
  // ==========================================================================
  console.log('[REGEN_ROUTE_ENTRY]', {
    fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
    fileOwner: '/api/program/regenerate/route.ts',
    functionOwner: 'POST',
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
    // Extract post-allocation tracking fields
    const lastSuccessfulPostAllocationCheckpointPayload = (result as Record<string, unknown>).lastSuccessfulPostAllocationCheckpoint as string | undefined
    const failingOwnerClassPayload = (result as Record<string, unknown>).failingOwnerClass as string | undefined
    const failingOwnerNamePayload = (result as Record<string, unknown>).failingOwnerName as string | undefined
    const failedBeforeMicroStep1Payload = (result as Record<string, unknown>).failedBeforeMicroStep1 as boolean | undefined
    const traceGapVerdictPayload = (result as Record<string, unknown>).traceGapVerdict as string | undefined
    
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
      // Post-allocation fatal audit fields
      lastSuccessfulPostAllocationCheckpoint: lastSuccessfulPostAllocationCheckpointPayload,
      failingOwnerClass: failingOwnerClassPayload,
      failingOwnerName: failingOwnerNamePayload,
      // Trace gap detection fields
      failedBeforeMicroStep1: failedBeforeMicroStep1Payload,
      traceGapVerdict: traceGapVerdictPayload,
      timings: result.timings,
      diagnostics: {
        routeStage: 'authoritative_service_call',
        serviceStage: result.failedStage,
        generationIntent: 'regenerate',
        triggerSource: 'regenerate',
        phase15eDiagnostic: exactFailingSubstep ? {
          exactFailingSubstep,
          exactLastSafeSubstep,
          degradationAttempted,
        } : undefined,
        corridorDiagnostic: exactBuilderCorridor ? {
          exactBuilderCorridor,
          exactLocalStep,
          fallbackApplied,
        } : undefined,
        fatalAuditDiagnostic: lastSuccessfulPostAllocationCheckpointPayload ? {
          lastSuccessfulPostAllocationCheckpoint: lastSuccessfulPostAllocationCheckpointPayload,
          failingOwnerClass: failingOwnerClassPayload,
          failingOwnerName: failingOwnerNamePayload,
        } : undefined,
        traceGapDiagnostic: failedBeforeMicroStep1Payload !== undefined ? {
          failedBeforeMicroStep1: failedBeforeMicroStep1Payload,
          traceGapVerdict: traceGapVerdictPayload,
        } : undefined,
      },
    }
    
    console.log('[REGENERATE_ROUTE_FAILURE_PAYLOAD]', {
      fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
      payloadKeys: Object.keys(failurePayload),
      failedStage: failurePayload.failedStage,
      exactFailingSubstep: failurePayload.exactFailingSubstep ?? null,
      exactLocalStep: failurePayload.exactLocalStep ?? null,
      compactBuilderErrorPreview: failurePayload.compactBuilderError?.slice(0, 60) ?? null,
      hasDiagnostics: !!failurePayload.diagnostics,
      verdict: 'PAYLOAD_READY_FOR_CLIENT',
    })
    
    // ==========================================================================
    // [AUTHORITATIVE_REGENERATE_FAILURE_SUMMARY] ONE authoritative summary
    // ==========================================================================
    // This is THE single log that shows the exact failing owner on regenerate failure.
    // Users and developers can look at this ONE log to know exactly what failed.
    // ==========================================================================
    const lastSuccessfulPostAllocationCheckpoint = (result as Record<string, unknown>).lastSuccessfulPostAllocationCheckpoint as string | undefined
    const failingOwnerClass = (result as Record<string, unknown>).failingOwnerClass as string | undefined
    const failingOwnerName = (result as Record<string, unknown>).failingOwnerName as string | undefined
    const failedBeforeMicroStep1 = (result as Record<string, unknown>).failedBeforeMicroStep1 as boolean | undefined
    const traceGapVerdict = (result as Record<string, unknown>).traceGapVerdict as string | undefined
    
    // Determine verdict with trace gap detection
    const verdictType = traceGapVerdict 
      ? traceGapVerdict
      : exactBuilderCorridor?.includes('trace_gap')
        ? 'TRACE_GAP_OWNER_FAILED_BEFORE_MICRO_1'
        : exactBuilderCorridor?.includes('post_allocation') 
          ? 'REQUIRED_OWNER_FAILED'
          : exactLocalStep === 'route_error'
            ? 'ROUTE_ONLY_FAILURE'
            : failingOwnerClass === 'optional_fallback'
              ? 'OPTIONAL_OWNER_FAILED_BUT_CONTINUED'
              : 'NO_POST_ALLOCATION_OWNER_FAILURE_FOUND'
    
    console.error('[AUTHORITATIVE_REGENERATE_FAILURE_SUMMARY]', {
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
      // Trace gap detection
      failedBeforeMicroStep1: failedBeforeMicroStep1 ?? 'not_tracked',
      traceGapVerdict: traceGapVerdict ?? 'not_applicable',
      // Stage info
      builderStage: result.failedStage ?? 'unknown',
      failureZone: exactBuilderCorridor?.includes('trace_gap') 
        ? 'trace_gap' 
        : exactBuilderCorridor?.includes('post_allocation') 
          ? 'post_allocation' 
          : 'other',
      // Verdict
      verdict: verdictType,
    })
    
    // ==========================================================================
    // [AUTHORITATIVE_TRACE_GAP_FAILURE_SUMMARY] Specific trace gap summary
    // ==========================================================================
    if (failedBeforeMicroStep1 || exactBuilderCorridor?.includes('trace_gap')) {
      console.error('[AUTHORITATIVE_TRACE_GAP_FAILURE_SUMMARY]', {
        fingerprint: REGENERATE_RUNTIME_FINGERPRINT,
        exactBuilderCorridor: exactBuilderCorridor ?? 'unknown',
        exactLocalStep: exactLocalStep ?? 'unknown',
        exactLastSafeSubstep: exactLastSafeSubstep ?? 'unknown',
        compactBuilderError: compactBuilderError?.slice(0, 150) ?? 'no_error_captured',
        failingOwnerClass: failingOwnerClass ?? 'unknown',
        failingOwnerName: failingOwnerName ?? 'unknown',
        lastSuccessfulPostAllocationCheckpoint: lastSuccessfulPostAllocationCheckpoint ?? 'not_tracked',
        failedBeforeMicroStep1: true,
        verdict: 'TRACE_GAP_OWNER_FAILED_BEFORE_MICRO_1',
      })
    }
    
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
