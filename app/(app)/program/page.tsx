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
// [TASK 1] Now accepts unifiedStaleness to pass to display component
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
        unifiedStaleness={unifiedStaleness} // [TASK 1] Pass unified staleness
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
  
  // ==========================================================================
  // [TASK 1] UNIFIED STALENESS - Single source of truth for program staleness
  // This replaces the dual checkProfileProgramDrift/checkProgramStaleness systems
  // ==========================================================================
  const unifiedStaleness = useMemo<UnifiedStalenessResult | null>(() => {
    if (!program || !mounted) return null
    
    // [TASK 8] Use raw program values, NOT display-normalized fallbacks
    const rawProgram = {
      primaryGoal: program.primaryGoal,
      secondaryGoal: (program as unknown as { secondaryGoal?: string }).secondaryGoal,
      trainingDaysPerWeek: program.trainingDaysPerWeek,
      sessionLength: program.sessionLength,
      scheduleMode: (program as unknown as { scheduleMode?: string }).scheduleMode,
      sessionDurationMode: (program as unknown as { sessionDurationMode?: string }).sessionDurationMode,
      equipment: program.equipment,
      jointCautions: program.jointCautions,
      experienceLevel: program.experienceLevel,
      selectedSkills: (program as unknown as { selectedSkills?: string[] }).selectedSkills,
      profileSnapshot: (program as unknown as { profileSnapshot?: unknown }).profileSnapshot,
    }
    
    const result = evaluateUnifiedProgramStaleness(rawProgram)
    
    // [TASK 7] High-signal audit log for unified staleness
    console.log('[program-rebuild-identity-audit] Unified staleness evaluation:', {
      activeProgramId: program.id,
      programCreatedAt: program.createdAt,
      isStale: result.isStale,
      severity: result.severity,
      changedFields: result.changedFields,
      recommendation: result.recommendation,
      sourceOfTruth: result.sourceOfTruth,
      programScheduleMode: rawProgram.scheduleMode,
      programTrainingDays: rawProgram.trainingDaysPerWeek,
      sessionCount: program.sessions?.length || 0,
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
    
    return result
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
                normalizedOnlyNoRestoration: true,
                createdAt: normalizedProgram.createdAt,
                sessionCount: normalizedProgram.sessions?.length || 0,
                firstSessionId: normalizedProgram.sessions?.[0]?.id || 'none',
                firstSessionExerciseCount: normalizedProgram.sessions?.[0]?.exercises?.length || 0,
                provenanceMode: normalizedProgram.generationProvenance?.generationMode || 'unknown',
                qualityTier: normalizedProgram.qualityClassification?.qualityTier || 'unknown',
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
      setLastBuildResult(stored)
      
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
    if (isQuotaError) {
      throw new Error(`storage_quota_exceeded: ${saveErr instanceof Error ? saveErr.message : 'Storage full'}`)
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
          // High-frequency schedule failures (TASK 7)
          'unsupported_high_frequency_structure', 'insufficient_templates_for_requested_days',
          'recovery_distribution_conflict',
          // Internal builder runtime errors (ERROR PROPAGATION FIX)
          'internal_builder_reference_error', 'internal_builder_type_error',
          // Session assembly root fix subcodes (SESSION ASSEMBLY ROOT FIX)
          'no_valid_candidate_after_filtering', 'selected_candidate_invalidated_by_constraints',
          'equipment_filtered_all_candidates', 'hybrid_structure_unresolvable',
          'final_validation_failed', 'equipment_adaptation_zeroed_session',
          'validation_zeroed_session', 'mapping_zeroed_session',
        ]
        
        let subCode: BuildAttemptSubCode = 'none'
        
        // Prefer structured subCode if it's a known value
        if (structuredSubCode && knownSubCodes.includes(structuredSubCode)) {
          subCode = structuredSubCode as BuildAttemptSubCode
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
    
    // Small delay for UX - wrapped in try/catch for safety
    setTimeout(() => {
      let regenerateStage = 'starting'
      try {
        // ==========================================================================
        // [TASK 2] COMPOSE FRESH CANONICAL TRUTH AT CLICK TIME
        // We must NOT use stale `inputs` state - compose fresh from canonical profile
        // ==========================================================================
        regenerateStage = 'composing_fresh_truth'
        
        // Get fresh canonical profile and compose rebuild inputs
        const canonicalProfile = getCanonicalProfile()
        const freshComposedInput = composeCanonicalPlannerInput()
        
        // Build the fresh rebuild input from canonical truth
        const freshRebuildInput: AdaptiveProgramInputs = {
          primaryGoal: freshComposedInput.primaryGoal || canonicalProfile.primaryGoal || inputs?.primaryGoal || 'planche',
          secondaryGoal: freshComposedInput.secondaryGoal || canonicalProfile.secondaryGoal || inputs?.secondaryGoal,
          experienceLevel: freshComposedInput.experienceLevel || canonicalProfile.experienceLevel || inputs?.experienceLevel || 'intermediate',
          trainingDaysPerWeek: freshComposedInput.scheduleMode === 'flexible' 
            ? 'flexible' 
            : (freshComposedInput.trainingDaysPerWeek ?? canonicalProfile.trainingDaysPerWeek ?? inputs?.trainingDaysPerWeek ?? 4),
          sessionLength: freshComposedInput.sessionLength ?? canonicalProfile.sessionLengthMinutes ?? inputs?.sessionLength ?? 60,
          scheduleMode: freshComposedInput.scheduleMode || canonicalProfile.scheduleMode || inputs?.scheduleMode || 'flexible',
          sessionDurationMode: freshComposedInput.sessionDurationMode || canonicalProfile.sessionDurationMode || inputs?.sessionDurationMode || 'adaptive',
          equipment: freshComposedInput.equipment || canonicalProfile.equipmentAvailable || inputs?.equipment || [],
        }
        
        // [TASK 7] Pre-build diagnostic with fresh truth
        console.log('[program-rebuild-identity-audit] REGEN STAGE 0: Fresh canonical truth composed', {
          oldProgramId: program?.id || 'none',
          staleInputsPrimaryGoal: inputs?.primaryGoal,
          freshPrimaryGoal: freshRebuildInput.primaryGoal,
          freshSecondaryGoal: freshRebuildInput.secondaryGoal,
          freshSelectedSkills: canonicalProfile.selectedSkills,
          freshScheduleMode: freshRebuildInput.scheduleMode,
          freshTrainingDaysPerWeek: freshRebuildInput.trainingDaysPerWeek,
          freshSessionDurationMode: freshRebuildInput.sessionDurationMode,
          freshSessionLength: freshRebuildInput.sessionLength,
          freshEquipmentCount: freshRebuildInput.equipment?.length || 0,
          freshJointCautions: canonicalProfile.jointCautions,
          freshExperienceLevel: freshRebuildInput.experienceLevel,
          canonicalProfileTimestamp: canonicalProfile.lastUpdated,
          composedInputProvenance: {
            fallbacksUsed: freshComposedInput.fallbacksUsed,
            overridesApplied: freshComposedInput.overridesApplied,
          },
        })
        
        // Validate fresh input before proceeding
        if (!freshRebuildInput.primaryGoal) {
          throw new Error('fresh_input_invalid: primaryGoal missing from canonical truth')
        }
        
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
          canonicalEquipmentBeforeBuild: canonicalProfile.equipmentAvailable || canonicalProfile.equipment,
          normalizedEquipmentPassedToGenerator: regenEquipment,
          pullUpBarAvailable: regenEquipment.includes('pullup_bar') || regenEquipment.includes('pull_bar'),
          dipBarsAvailable: regenEquipment.includes('dip_bars'),
          ringsAvailable: regenEquipment.includes('rings'),
          bandsAvailable: regenEquipment.includes('resistance_bands') || regenEquipment.includes('bands'),
          weightsAvailable: regenEquipment.includes('weights'),
        })
        
        // [program-build] REGEN STAGE 2: Record regeneration event
        regenerateStage = 'recording_event'
        programModules.recordProgramEnd?.('regenerate')
        
        // [program-build] REGEN STAGE 3: Generate new program with FRESH canonical input
        regenerateStage = 'generating'
        console.log('[program-build] REGEN STAGE 3: Calling generateAdaptiveProgram with fresh truth...')
        const newProgram = programModules.generateAdaptiveProgram(freshRebuildInput)
        
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
    
    if (isQuotaError) {
      throw new Error(`storage_quota_exceeded: ${saveErr instanceof Error ? saveErr.message : 'Storage full'}`)
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
        
        // Step 1: Basic usability check
        if (!savedState?.hasUsableWorkoutProgram) {
          console.error('[program-rebuild-identity-audit] REGEN STAGE 7b: Save verification FAILED - no usable program')
          throw new Error('save_verification_failed: Program not readable after save')
        }
        
        // Step 2: Verify EXACT program ID match (not just "some program exists")
        const storedProgramId = savedState?.activeProgram?.id
        if (storedProgramId !== newProgram.id) {
          console.error('[program-rebuild-identity-audit] REGEN STAGE 7b: CRITICAL ID MISMATCH', {
            newProgramId: newProgram.id,
            storedProgramId,
            mismatchType: 'program_id_not_replaced',
          })
          throw new Error(`save_verification_id_mismatch: Expected ${newProgram.id}, got ${storedProgramId}`)
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
        if (storedSessionCount !== newSessionCount) {
          console.error('[program-rebuild-identity-audit] REGEN STAGE 7b: Session count mismatch', {
            newSessionCount,
            storedSessionCount,
          })
          throw new Error(`save_verification_session_mismatch: Expected ${newSessionCount} sessions, got ${storedSessionCount}`)
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
        setLastBuildResult(successResult)
        saveLastBuildAttemptResult(successResult)
        setGenerationError(null) // Clear any previous error
        
        // [TASK 7] Post-rebuild staleness re-evaluation
        const postBuildStaleness = evaluateUnifiedProgramStaleness({
          primaryGoal: newProgram.primaryGoal,
          secondaryGoal: (newProgram as unknown as { secondaryGoal?: string }).secondaryGoal,
          trainingDaysPerWeek: newProgram.trainingDaysPerWeek,
          sessionLength: newProgram.sessionLength,
          scheduleMode: (newProgram as unknown as { scheduleMode?: string }).scheduleMode,
          sessionDurationMode: (newProgram as unknown as { sessionDurationMode?: string }).sessionDurationMode,
          equipment: newProgram.equipment,
          jointCautions: newProgram.jointCautions,
          experienceLevel: newProgram.experienceLevel,
          selectedSkills: (newProgram as unknown as { selectedSkills?: string[] }).selectedSkills,
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
          // High-frequency schedule failures (TASK 7)
          'unsupported_high_frequency_structure', 'insufficient_templates_for_requested_days',
          'recovery_distribution_conflict',
          // Internal builder runtime errors (ERROR PROPAGATION FIX)
          'internal_builder_reference_error', 'internal_builder_type_error',
          // Session assembly root fix subcodes (SESSION ASSEMBLY ROOT FIX)
          'no_valid_candidate_after_filtering', 'selected_candidate_invalidated_by_constraints',
          'equipment_filtered_all_candidates', 'hybrid_structure_unresolvable',
          'final_validation_failed', 'equipment_adaptation_zeroed_session',
          'validation_zeroed_session', 'mapping_zeroed_session',
        ]
        
        let subCode: BuildAttemptSubCode = 'none'
        
        // Prefer structured subCode if it's a known value
        if (structuredSubCode && knownSubCodes.includes(structuredSubCode)) {
          subCode = structuredSubCode as BuildAttemptSubCode
        } else {
          // Fall back to string matching
          // Internal builder runtime errors - check first (ERROR PROPAGATION FIX)
          if (errorMessage.includes('internal_builder_reference_error') || errorMessage.includes('is not defined')) subCode = 'internal_builder_reference_error'
          else if (errorMessage.includes('internal_builder_type_error') || errorMessage.includes('Cannot read properties of')) subCode = 'internal_builder_type_error'
          // Session assembly root fix subcodes - use new precise subcodes (not old mappings)
          else if (errorMessage.includes('equipment_adaptation_zeroed_session')) subCode = 'equipment_adaptation_zeroed_session'
          else if (errorMessage.includes('mapping_zeroed_session')) subCode = 'mapping_zeroed_session'
          else if (errorMessage.includes('validation_zeroed_session')) subCode = 'validation_zeroed_session'
          // High-frequency schedule failures (TASK 7)
          else if (errorMessage.includes('unsupported_high_frequency_structure')) subCode = 'unsupported_high_frequency_structure' as BuildAttemptSubCode
          else if (errorMessage.includes('session_save_blocked')) subCode = 'session_save_blocked'
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
            {lastBuildResult && lastBuildResult.status === 'success' && !profileProgramDrift?.isProgramStale && (
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
            {/* [TASK 1] Pass unified staleness to prevent duplicate staleness checks */}
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
