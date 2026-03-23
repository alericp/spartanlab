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

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Dumbbell, Plus, Sparkles, AlertTriangle, Loader2, Info } from 'lucide-react'
import Link from 'next/link'

// TASK 5: Lightweight type imports only - actual modules loaded dynamically
import type { AdaptiveProgramInputs, AdaptiveProgram, GenerationErrorCode } from '@/lib/adaptive-program-builder'
import type { TrainingDays } from '@/lib/program-service'
// [profile-truth-sync] ISSUE A: Import drift detection for settings/program alignment
import { 
  checkProfileProgramDrift, 
  isProfileSignatureAligned,
  type ProfileProgramDrift,
  validateBuilderDisplayTruth,
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
import { saveCanonicalProfile } from '@/lib/canonical-profile-service'

// TASK 1: Error boundary wrapper for AdaptiveProgramDisplay
// Catches render errors and triggers recovery state instead of crashing
function ProgramDisplayWrapper({ 
  program, 
  onDelete,
  onRestart,
  onRegenerate,
  onRecoveryNeeded 
}: { 
  program: AdaptiveProgram
  onDelete: () => void
  onRestart: () => void
  onRegenerate: () => void
  onRecoveryNeeded: () => void 
}) {
  const [hasRenderError, setHasRenderError] = useState(false)
  
  // Reset error state when program changes
  useEffect(() => {
    setHasRenderError(false)
  }, [program?.id])
  
  if (hasRenderError) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Unable to Display Plan</h3>
        <p className="text-sm text-[#6A6A6A] mb-4">
          We're having trouble displaying your plan. Refreshing may help.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-[#E63946] hover:bg-[#D62828]"
        >
          Refresh Page
        </Button>
      </Card>
    )
  }
  
  // Wrap in try-catch at render time
  try {
    return (
      <AdaptiveProgramDisplay
        program={program}
        onDelete={onDelete}
        onRestart={onRestart}
        onRegenerate={onRegenerate}
      />
    )
  } catch (err) {
    console.error('[ProgramPage] ProgramDisplayWrapper: Render error:', err)
    setHasRenderError(true)
    onRecoveryNeeded()
    return null
  }
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
  
  // [program-alignment] ISSUE A/D: Detect profile-program drift using both methods
  const profileProgramDrift = useMemo<ProfileProgramDrift | null>(() => {
    if (!program || !mounted) return null
    
    // Method 1: Check using profile signature if available (new programs)
    const programWithSignature = program as typeof program & { 
      profileSignature?: { primaryGoal: string | null; equipmentHash: string; hasLoadableEquipment: boolean } 
    }
    if (programWithSignature.profileSignature) {
      const signatureCheck = isProfileSignatureAligned(programWithSignature.profileSignature)
      console.log('[program-alignment] Signature-based drift check:', signatureCheck)
      
      if (!signatureCheck.aligned) {
        return {
          hasDrift: true,
          isProgramStale: true,
          driftFields: signatureCheck.driftedFields.map(f => ({ 
            field: f, 
            profileValue: null, 
            programValue: null, 
            severity: f === 'primaryGoal' ? 'critical' as const : 'major' as const 
          })),
          summary: signatureCheck.summary,
          recommendation: signatureCheck.driftedFields.includes('primaryGoal') ? 'regenerate' as const : 'review' as const,
        }
      }
    }
    
    // Method 2: Fallback to field-by-field comparison (legacy programs without signature)
    return checkProfileProgramDrift({
      primaryGoal: program.primaryGoal,
      secondaryGoal: (program as unknown as { secondaryGoal?: string }).secondaryGoal,
      trainingDaysPerWeek: program.trainingDaysPerWeek,
      sessionLength: program.sessionLength,
      scheduleMode: (program as unknown as { scheduleMode?: string }).scheduleMode,
      equipment: program.equipment,
      jointCautions: program.jointCautions,
      experienceLevel: program.experienceLevel,
    })
  }, [program, mounted])
  
  // TASK 5: Store dynamically imported module references
  const [programModules, setProgramModules] = useState<{
    generateAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').generateAdaptiveProgram | null
    saveAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').saveAdaptiveProgram | null
    deleteAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').deleteAdaptiveProgram | null
    getDefaultAdaptiveInputs: typeof import('@/lib/adaptive-program-builder').getDefaultAdaptiveInputs | null
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
          getProgramState: stateMod.getProgramState,
          normalizeProgramForDisplay: stateMod.normalizeProgramForDisplay,
          isRenderableProgram: stateMod.isRenderableProgram,
          isProgramDisplaySafe: stateMod.isProgramDisplaySafe,
          getProgramStatus: adjustmentMod.getProgramStatus,
          recordProgramEnd: adjustmentMod.recordProgramEnd,
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
        
        // TASK 1: Stage 7 - Load current program as the critical operation
        setLoadStage('loading-program-state')
        let loadedProgram: AdaptiveProgram | null = null
        try {
          const programState = stateMod.getProgramState()
          
          // TASK 2: Stage 8 - Normalize and validate program for display
          setLoadStage('normalizing-program')
          if (programState.hasUsableWorkoutProgram && programState.adaptiveProgram) {
            const normalizedProgram = stateMod.normalizeProgramForDisplay(programState.adaptiveProgram)
            
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
  
  // Load last build result on mount
  useEffect(() => {
    const stored = getLastBuildAttemptResult()
    if (stored) {
      setLastBuildResult(stored)
    }
  }, [])
  
  // TASK 5: Handlers use dynamically imported modules
  // HARDENED: Full try/catch/finally to prevent stuck spinner state
  const handleGenerate = useCallback(() => {
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
    
    // Small delay for UX - wrapped in try/catch for safety
    const timeoutId = setTimeout(() => {
      let generationStage = 'starting'
      try {
        // [program-build] STAGE 1: Pre-generation diagnostics
        generationStage = 'pre_generation_diagnostics'
        console.log('[program-build] STAGE 1: Pre-generation diagnostics', {
          hasInputs: !!inputs,
          primaryGoal: inputs?.primaryGoal,
          secondaryGoal: inputs?.secondaryGoal || 'none',
          trainingDaysPerWeek: inputs?.trainingDaysPerWeek,
          sessionLength: inputs?.sessionLength,
          scheduleMode: inputs?.scheduleMode,
          equipmentCount: inputs?.equipment?.length || 0,
          selectedSkillsCount: inputs?.selectedSkills?.length || 0,
        })
        
        // [program-build] STAGE 2: Generate program
        generationStage = 'generating'
        console.log('[program-build] STAGE 2: Calling generateAdaptiveProgram...')
        const newProgram = programModules.generateAdaptiveProgram(inputs)
        
        // [program-build] STAGE 3: Validate program shape (fail fast on malformed data)
        generationStage = 'validating_shape'
        console.log('[program-build] STAGE 3: Validating program shape...')
        if (!newProgram) {
          throw new Error('program_null: generateAdaptiveProgram returned null/undefined')
        }
        if (!newProgram.id) {
          throw new Error('program_missing_id: program has no id field')
        }
        if (!Array.isArray(newProgram.sessions)) {
          throw new Error('sessions_not_array: program.sessions is not an array')
        }
        if (newProgram.sessions.length === 0) {
          throw new Error('sessions_empty: program has zero sessions')
        }
        
        // [program-build] STAGE 4: Validate session content
        generationStage = 'validating_sessions'
        console.log('[program-build] STAGE 4: Validating session content...')
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
          if (!audit.canSave) {
            console.error('[audit-severity] Audit blocked save:', audit.failureReasons)
            throw new Error(`audit_blocked: ${audit.failureReasons[0] || 'Program failed quality audit'}`)
          }
          
          // Soft fail or warnings get logged but allow save
          if (audit.shouldWarn && audit.warnings.length > 0) {
            console.warn('[audit-severity] Audit warnings:', audit.warnings)
          }
        }
        
        // [program-build] STAGE 6: Save to storage
        generationStage = 'saving'
        console.log('[program-build] STAGE 6: Saving snapshot to storage...')
        programModules.saveAdaptiveProgram(newProgram)
        console.log('[program-build] STAGE 6: Save completed successfully')
        
        // [program-build] STAGE 6b: Verify save succeeded by reading back
        generationStage = 'verifying_save'
        const savedState = programModules.getProgramState?.()
        if (!savedState?.hasUsableWorkoutProgram) {
          console.error('[program-build] STAGE 6b: Save verification FAILED - program not readable after save')
          throw new Error('save_verification_failed: Program not readable after save')
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
        
        // [program-build] STAGE 7: Update UI state
        generationStage = 'updating_ui'
        console.log('[program-build] STAGE 7: Updating UI state...')
        setProgram(newProgram)
        setShowBuilder(false)
        
        // [program-rebuild-truth] TASK 2: Create success result
        const profileSig = createProfileSignature(inputs)
        const successResult = createSuccessBuildResult(profileSig, null, newProgram.id)
        setLastBuildResult(successResult)
        saveLastBuildAttemptResult(successResult)
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
      } catch (err) {
        // [program-rebuild-truth] FAILURE: Extract classified error code if available
        // GenerationError from adaptive-program-builder provides stage + code
        const isGenerationError = err && typeof err === 'object' && 'code' in err && 'stage' in err
        const errorCode = (isGenerationError ? (err as { code: string }).code : 'unknown_generation_failure') as GenerationErrorCode
        const errorStage = isGenerationError ? (err as { stage: string }).stage : generationStage
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        const errorStack = err instanceof Error ? err.stack : undefined
        const errorContext = isGenerationError ? (err as { context?: Record<string, unknown> }).context : undefined
        
        // Log unclassified errors with searchable prefix for root cause analysis
        if (!isGenerationError) {
          console.error('[program-root-cause] Unclassified error caught in handleGenerate:', {
            name: err instanceof Error ? err.name : 'UnknownError',
            message: errorMessage,
            stack: errorStack,
            generationStage,
          })
        }
        
        // [program-rebuild-truth] Determine sub-code for more specific messaging
        // Read structured subCode from GenerationError context FIRST
        const structuredSubCode = isGenerationError 
          ? (err as { context?: Record<string, unknown> }).context?.subCode as string | undefined
          : undefined
        
        // Known BuildAttemptSubCode values from structured context
        const knownSubCodes = [
          'empty_structure_days', 'empty_final_session_array', 'session_count_mismatch',
          'session_save_blocked', 'assembly_unknown_failure', 'empty_exercise_pool',
          'session_validation_failed', 'normalization_failed', 'display_safety_failed',
          'effective_selection_invalid', 'session_middle_helper_failed',
          'session_variant_generation_failed', 'finisher_helper_failed',
          'session_has_no_exercises', 'post_session_mutation_failed', 'post_session_integrity_invalid',
          'session_generation_failed', 'exercise_selection_returned_null',
        ]
        
        let subCode: BuildAttemptSubCode = 'none'
        
        // Prefer structured subCode if it's a known value
        if (structuredSubCode && knownSubCodes.includes(structuredSubCode)) {
          subCode = structuredSubCode as BuildAttemptSubCode
        } else {
          // Fall back to string matching
          if (errorMessage.includes('session_save_blocked')) subCode = 'session_save_blocked'
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
        setLastBuildResult(failedResult)
        saveLastBuildAttemptResult(failedResult)
        
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
        // Keep builder visible and inputs intact for retry
      } finally {
        // [program-build] GUARANTEED: Always reset loading state
        setIsGenerating(false)
        console.log('[program-build] Generation flow complete - loading state cleared')
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
    
    console.log('[ProgramPage] handleRegenerate: Starting regeneration', { 
      source: 'regenerate',
      oldProgramId: program?.id || 'none',
    })
    
    setIsGenerating(true)
    setGenerationError(null) // Clear any previous error
    
    // Small delay for UX - wrapped in try/catch for safety
    setTimeout(() => {
      let regenerateStage = 'starting'
      try {
        // [program-build] REGEN STAGE 1: Pre-regeneration diagnostics
        regenerateStage = 'pre_regen_diagnostics'
        console.log('[program-build] REGEN STAGE 1: Pre-regeneration diagnostics', {
          oldProgramId: program?.id || 'none',
          hasInputs: !!inputs,
          primaryGoal: inputs?.primaryGoal,
          secondaryGoal: inputs?.secondaryGoal || 'none',
        })
        
        // [program-build] REGEN STAGE 2: Record regeneration event
        regenerateStage = 'recording_event'
        programModules.recordProgramEnd?.('regenerate')
        
        // [program-build] REGEN STAGE 3: Generate new program
        regenerateStage = 'generating'
        console.log('[program-build] REGEN STAGE 3: Calling generateAdaptiveProgram...')
        const newProgram = programModules.generateAdaptiveProgram(inputs)
        
        // [program-build] REGEN STAGE 4: Validate program shape
        regenerateStage = 'validating_shape'
        console.log('[program-build] REGEN STAGE 4: Validating program shape...')
        if (!newProgram) {
          throw new Error('program_null: generateAdaptiveProgram returned null/undefined')
        }
        if (!newProgram.id) {
          throw new Error('program_missing_id: program has no id field')
        }
        if (!Array.isArray(newProgram.sessions)) {
          throw new Error('sessions_not_array: program.sessions is not an array')
        }
        if (newProgram.sessions.length === 0) {
          throw new Error('sessions_empty: program has zero sessions')
        }
        
        // [program-build] REGEN STAGE 5: Validate session content
        regenerateStage = 'validating_sessions'
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
        
        // [program-build] REGEN STAGE 7: Save to storage
        regenerateStage = 'saving'
        console.log('[program-build] REGEN STAGE 7: Saving snapshot...')
        programModules.saveAdaptiveProgram(newProgram)
        console.log('[program-build] REGEN STAGE 7: Save completed successfully')
        
        // [program-build] REGEN STAGE 7b: Verify save succeeded
        regenerateStage = 'verifying_save'
        const savedState = programModules.getProgramState?.()
        if (!savedState?.hasUsableWorkoutProgram) {
          console.error('[program-build] REGEN STAGE 7b: Save verification FAILED')
          throw new Error('save_verification_failed: Program not readable after save')
        }
        console.log('[program-build] REGEN STAGE 7b: Save verification PASSED')
        
        // [freshness-sync] REGEN STAGE 7c: Update freshness identity and invalidate stale caches
        regenerateStage = 'freshness_sync'
        console.log('[freshness-sync] REGEN STAGE 7c: Updating canonical freshness identity...')
        const regenProfileSig = inputs ? createProfileSignature(inputs) : 'unknown'
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
        })
        
        // [program-rebuild-truth] REGEN STAGE 8: Update UI state
        regenerateStage = 'updating_ui'
        setProgram(newProgram)
        setShowBuilder(false)
        
        // [program-rebuild-truth] TASK 2: Create success result for regeneration
        const profileSig = inputs ? createProfileSignature(inputs) : 'unknown'
        const successResult = createSuccessBuildResult(profileSig, program?.id || null, newProgram.id)
        setLastBuildResult(successResult)
        saveLastBuildAttemptResult(successResult)
        setGenerationError(null) // Clear any previous error
        
        // [program-rebuild-truth] REGEN SUCCESS
        console.log('[program-rebuild-truth] REGEN COMPLETE: All stages passed', {
          success: true,
          attemptId: successResult.attemptId,
          oldProgramId: program?.id || 'none',
          newProgramId: newProgram.id,
          sessionCount: newProgram.sessions?.length || 0,
          replacedVisibleProgram: true,
        })
      } catch (err) {
        // [program-rebuild-truth] REGEN FAILURE: Extract classified error
        const isGenerationError = err && typeof err === 'object' && 'code' in err && 'stage' in err
        const errorCode = (isGenerationError ? (err as { code: string }).code : 'unknown_generation_failure') as GenerationErrorCode
        const errorStage = isGenerationError ? (err as { stage: string }).stage : regenerateStage
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        const errorStack = err instanceof Error ? err.stack : undefined
        const errorContext = isGenerationError ? (err as { context?: Record<string, unknown> }).context : undefined
        
        // Log unclassified errors with searchable prefix for root cause analysis
        if (!isGenerationError) {
          console.error('[program-root-cause] Unclassified error caught in handleRegenerate:', {
            name: err instanceof Error ? err.name : 'UnknownError',
            message: errorMessage,
            stack: errorStack,
            regenerateStage,
          })
        }
        
        // [program-rebuild-truth] Determine sub-code
        // Read structured subCode from GenerationError context FIRST
        const structuredSubCode = isGenerationError 
          ? (err as { context?: Record<string, unknown> }).context?.subCode as string | undefined
          : undefined
        
        // Known BuildAttemptSubCode values from structured context
        const knownSubCodes = [
          'empty_structure_days', 'empty_final_session_array', 'session_count_mismatch',
          'session_save_blocked', 'assembly_unknown_failure', 'empty_exercise_pool',
          'session_validation_failed', 'normalization_failed', 'display_safety_failed',
          'effective_selection_invalid', 'session_middle_helper_failed',
          'session_variant_generation_failed', 'finisher_helper_failed',
          'session_has_no_exercises', 'post_session_mutation_failed', 'post_session_integrity_invalid',
          'session_generation_failed', 'exercise_selection_returned_null',
        ]
        
        let subCode: BuildAttemptSubCode = 'none'
        
        // Prefer structured subCode if it's a known value
        if (structuredSubCode && knownSubCodes.includes(structuredSubCode)) {
          subCode = structuredSubCode as BuildAttemptSubCode
        } else {
          // Fall back to string matching
          if (errorMessage.includes('session_save_blocked')) subCode = 'session_save_blocked'
          else if (errorMessage.includes('empty_structure_days')) subCode = 'empty_structure_days'
          else if (errorMessage.includes('empty_final_session_array') || errorMessage.includes('sessions_empty')) subCode = 'empty_final_session_array'
          else if (errorMessage.includes('session_count_mismatch')) subCode = 'session_count_mismatch'
          // Full lifecycle failure
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
        setLastBuildResult(failedResult)
        saveLastBuildAttemptResult(failedResult)
        
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
    // [adjustment-sync] STEP 2: Log initial adjustment state
    const previousProgramId = program?.id || 'none'
    const previousGeneratedAt = program?.createdAt || 'unknown'
    const previousTrainingDays = inputs?.trainingDaysPerWeek || 'unknown'
    const previousSessionCount = program?.sessions?.length || 0
    
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
    
    // [canonical-rebuild] TASK A: Build updated canonical inputs based on adjustment
    const updatedInputs = { ...inputs }
    
    if (request.type === 'training_days' && request.newTrainingDays) {
      updatedInputs.trainingDaysPerWeek = request.newTrainingDays
      console.log('[canonical-rebuild] Updated training days:', request.newTrainingDays)
    }
    if (request.type === 'session_time' && request.newSessionMinutes) {
      updatedInputs.sessionLength = request.newSessionMinutes
      console.log('[canonical-rebuild] Updated session length:', request.newSessionMinutes)
    }
    if (request.type === 'equipment' && request.newEquipment) {
      updatedInputs.equipment = request.newEquipment
      console.log('[canonical-rebuild] Updated equipment:', request.newEquipment)
    }
    
    try {
      // [canonical-rebuild] STAGE 1: Generate new program with updated inputs
      console.log('[canonical-rebuild] STAGE 1: Generating with updated inputs...')
      const newProgram = programModules.generateAdaptiveProgram(updatedInputs)
      
      if (!newProgram) {
        throw new Error('Generation returned null')
      }
      if (!newProgram.id || !newProgram.sessions?.length) {
        throw new Error('Generated program has invalid structure')
      }
      
      // [canonical-rebuild] TASK F: Verify session count matches expected
      console.log('[canonical-rebuild] STAGE 2: Verifying program structure...', {
        expectedDays: request.newTrainingDays,
        actualSessions: newProgram.sessions.length,
      })
      
      // [canonical-rebuild] STAGE 3: Save to canonical storage
      console.log('[canonical-rebuild] STAGE 3: Saving to canonical storage...')
      programModules.saveAdaptiveProgram(newProgram)
      
      // [canonical-rebuild] STAGE 4: Verify save
      const savedState = programModules.getProgramState()
      if (!savedState.adaptiveProgram || savedState.adaptiveProgram.id !== newProgram.id) {
        throw new Error('Save verification failed - program IDs do not match')
      }
      
      // [canonical-rebuild] STAGE 5: Update freshness identity
      console.log('[canonical-rebuild] STAGE 5: Updating freshness identity...')
      const profileSig = createProfileSignature(updatedInputs)
      invalidateStaleCaches()
      updateFreshnessIdentity(newProgram.id, newProgram.createdAt, profileSig)
      
      // [canonical-rebuild] STAGE 5b: CRITICAL - Persist updated inputs to canonical profile
      // This ensures future getDefaultAdaptiveInputs() calls read the new truth
      console.log('[canonical-rebuild] STAGE 5b: Persisting updated inputs to canonical profile...')
      saveCanonicalProfile({
        trainingDaysPerWeek: updatedInputs.trainingDaysPerWeek ?? undefined,
        sessionLengthMinutes: updatedInputs.sessionLength ?? undefined,
        // For schedule mode, if user selects a specific day count, they've made a choice
        scheduleMode: request.type === 'training_days' ? 'static' : undefined,
        equipmentAvailable: updatedInputs.equipment ?? undefined,
      })
      console.log('[canonical-rebuild] STAGE 5b: Canonical profile updated with new settings', {
        trainingDaysPerWeek: updatedInputs.trainingDaysPerWeek,
        sessionLength: updatedInputs.sessionLength,
        equipmentCount: updatedInputs.equipment?.length || 0,
      })
      
      // [canonical-rebuild] STAGE 6: Update UI state atomically
      console.log('[canonical-rebuild] STAGE 6: Updating UI state...')
      setInputs(updatedInputs)
      setProgram(newProgram)
      
      // [canonical-rebuild] Record success
      const successResult = createSuccessBuildResult(profileSig, program?.id || null, newProgram.id)
      setLastBuildResult(successResult)
      saveLastBuildAttemptResult(successResult)
      
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
      
      // [adjustment-sync] Return actual session count to modal for truthful display
      return { success: true, actualSessionCount: newProgram.sessions.length }
      
    } catch (error) {
      console.error('[canonical-rebuild] FAILED:', error)
      
      // [canonical-rebuild] TASK E: Preserve last good program
      if (program) {
        console.log('[canonical-rebuild] Last good program preserved:', program.id)
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Rebuild failed unexpectedly' 
      }
    }
  }, [inputs, program, programModules])
  
  // Legacy delete handler for backwards compatibility
  const handleDelete = handleRestart

  const handleNewProgram = useCallback(() => {
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
          
          {/* TASK 3: Clear action semantics - "Update" opens adjustment modal, shows Regenerate/Restart options */}
          {program && !showBuilder && (
            <Button
              onClick={handleNewProgram}
              variant="outline"
              className="border-[#3A3A3A] hover:bg-[#2A2A2A]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Update Program
            </Button>
          )}
        </div>

        {/* Content - TASK 2: Proper handling of malformed programs */}
        {showBuilder ? (
          <div className="space-y-6">
            {/* HARDENED: Generation error banner - recoverable state */}
            {generationError && (
              <Card className="bg-amber-500/10 border-amber-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-200">{generationError}</p>
                    {/* [program-rebuild-truth] ISSUE A/B: Show stage-specific failure info */}
                    <p className="text-xs text-amber-400/70 mt-1">
                      {lastBuildResult?.preservedLastGoodProgram 
                        ? 'Your previous plan is still available.'
                        : 'Your inputs are preserved. Try again when ready.'}
                    </p>
                    {/* TASK 1-D: Structured diagnostic display */}
                    {lastBuildResult && lastBuildResult.status !== 'success' && (
                      <div className="mt-2 space-y-0.5">
                        {/* Line 1: Stage and Code */}
                        <p className="text-[10px] text-[#6A6A6A] font-mono">
                          Stage: {lastBuildResult.stage} | Code: {lastBuildResult.errorCode || 'unknown'}
                          {lastBuildResult.subCode !== 'none' && ` (${lastBuildResult.subCode})`}
                        </p>
                        {/* Line 2: Step, Middle, Day, Focus - only if any exist */}
                        {(lastBuildResult.failureStep || lastBuildResult.failureDayNumber || lastBuildResult.failureFocus) && (
                          <p className="text-[10px] text-[#5A5A5A] font-mono">
                            Step: {lastBuildResult.failureStep || 'none'}
                            {lastBuildResult.failureMiddleStep && ` | Middle: ${lastBuildResult.failureMiddleStep}`}
                            {lastBuildResult.failureDayNumber !== null && ` | Day: ${lastBuildResult.failureDayNumber}`}
                            {lastBuildResult.failureFocus && ` | Focus: ${lastBuildResult.failureFocus}`}
                          </p>
                        )}
                        {/* Line 3: Reason - only if exists */}
                        {lastBuildResult.failureReason && (
                          <p className="text-[10px] text-[#5A5A5A] font-mono truncate max-w-full">
                            Reason: {lastBuildResult.failureReason.slice(0, 100)}
                          </p>
                        )}
                        {/* TASK 1-E: Defensive fallback when no structured fields exist */}
                        {!lastBuildResult.failureStep && !lastBuildResult.failureDayNumber && !lastBuildResult.failureReason && (
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
            {lastBuildResult?.status === 'preserved_last_good' && (
              <Card className="bg-red-500/10 border-red-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-200 font-medium">Last rebuild did not complete</p>
                    <p className="text-xs text-red-400/80 mt-1">
                      {lastBuildResult.userMessage}
                    </p>
  <p className="text-xs text-[#6A6A6A] mt-1">
  This is your previous plan. Your latest settings were not applied.
  </p>
  {/* TASK 1-D: Structured diagnostic display for red card */}
  <div className="mt-2 space-y-0.5">
    {/* Line 1: Stage and Code */}
    <p className="text-[10px] text-[#5A5A5A] font-mono">
      Stage: {lastBuildResult.stage} | Code: {lastBuildResult.errorCode || 'unknown'}
      {lastBuildResult.subCode !== 'none' && ` (${lastBuildResult.subCode})`}
    </p>
    {/* Line 2: Step, Middle, Day, Focus - only if any exist */}
    {(lastBuildResult.failureStep || lastBuildResult.failureDayNumber || lastBuildResult.failureFocus) && (
      <p className="text-[10px] text-[#4A4A4A] font-mono">
        Step: {lastBuildResult.failureStep || 'none'}
        {lastBuildResult.failureMiddleStep && ` | Middle: ${lastBuildResult.failureMiddleStep}`}
        {lastBuildResult.failureDayNumber !== null && ` | Day: ${lastBuildResult.failureDayNumber}`}
        {lastBuildResult.failureFocus && ` | Focus: ${lastBuildResult.failureFocus}`}
      </p>
    )}
    {/* Line 3: Reason - only if exists */}
    {lastBuildResult.failureReason && (
      <p className="text-[10px] text-[#4A4A4A] font-mono truncate max-w-full">
        Reason: {lastBuildResult.failureReason.slice(0, 100)}
      </p>
    )}
    {/* TASK 1-E: Defensive fallback when no structured fields exist */}
    {!lastBuildResult.failureStep && !lastBuildResult.failureDayNumber && !lastBuildResult.failureReason && (
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
            {profileProgramDrift?.isProgramStale && lastBuildResult?.status !== 'preserved_last_good' && (
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
                    {profileProgramDrift.recommendation === 'regenerate' && (
                      <Button
                        size="sm"
                        className="mt-2 bg-amber-600 hover:bg-amber-700 text-white h-7 px-3 text-xs"
                        onClick={handleRegenerate}
                      >
                        Build New Program
                      </Button>
                    )}
                    {profileProgramDrift.recommendation === 'review' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 h-7 px-3 text-xs"
                        onClick={handleRegenerate}
                      >
                        Update Program
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            {/* [program-rebuild-truth] ISSUE C/E: Show current build status chip */}
            {lastBuildResult && lastBuildResult.status === 'success' && (
              <div className="flex items-center gap-2 text-xs text-green-500/80">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Program up to date</span>
                <span className="text-[#4A4A4A]">|</span>
                <span className="text-[#6A6A6A]">
                  Built {new Date(lastBuildResult.attemptedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {/* TASK 1: Wrap display in error boundary-like try-catch via component */}
            <ProgramDisplayWrapper 
              program={program} 
              onDelete={handleDelete}
              onRestart={handleRestart}
              onRegenerate={handleRegenerate}
              onRecoveryNeeded={() => {
                console.log('[v0] Display render failed, showing recovery state')
                setLoadStage('display-render-error')
              }}
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
              Regenerate Program
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
        <ProgramAdjustmentModal
          open={showAdjustmentModal}
          onOpenChange={setShowAdjustmentModal}
          onContinue={() => setShowAdjustmentModal(false)}
          onStartNew={handleConfirmNewProgram}
          onRebuildRequired={handleAdjustmentRebuild}
          currentSessionMinutes={inputs?.sessionLength || 60}
          currentTrainingDays={typeof inputs?.trainingDaysPerWeek === 'number' ? inputs.trainingDaysPerWeek : (program?.sessions?.length || 3) as TrainingDays}
          currentEquipment={inputs?.equipment || []}
        />
      </div>
    </div>
  )
}
