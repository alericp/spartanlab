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

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Dumbbell, Plus, Sparkles, AlertTriangle, Loader2 } from 'lucide-react'
import Link from 'next/link'

// TASK 5: Lightweight type imports only - actual modules loaded dynamically
import type { AdaptiveProgramInputs, AdaptiveProgram } from '@/lib/adaptive-program-builder'

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
        <h3 className="text-lg font-medium mb-2">Display Error</h3>
        <p className="text-sm text-[#6A6A6A] mb-4">
          There was a problem displaying your program. Try refreshing.
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
    console.log('[v0] ProgramDisplayWrapper: Rendering AdaptiveProgramDisplay')
    return (
      <AdaptiveProgramDisplay
        program={program}
        onDelete={onDelete}
        onRestart={onRestart}
        onRegenerate={onRegenerate}
      />
    )
  } catch (err) {
    console.error('[v0] ProgramDisplayWrapper: Render error:', err)
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
        
        // TASK 1: Stage 7 - Load current program as the critical operation
        setLoadStage('loading-program-state')
        let loadedProgram: AdaptiveProgram | null = null
        try {
          console.log('[v0] Stage 7: Calling getProgramState()')
          const programState = stateMod.getProgramState()
          
          console.log('[v0] Stage 7: Program state loaded:', {
            hasUsableWorkoutProgram: programState.hasUsableWorkoutProgram,
            adaptiveProgramExists: !!programState.adaptiveProgram,
            sessionCount: programState.sessionCount,
          })
          
          // TASK 2: Stage 8 - Normalize and validate program for display
          setLoadStage('normalizing-program')
          if (programState.hasUsableWorkoutProgram && programState.adaptiveProgram) {
            console.log('[v0] Stage 8: Normalizing program for display')
            const normalizedProgram = stateMod.normalizeProgramForDisplay(programState.adaptiveProgram)
            
            // TASK 2: Display-sanity gate - verify all critical display fields
            // This prevents crashes in AdaptiveProgramDisplay when program is malformed
            console.log('[v0] Stage 8: Running display-sanity check')
            const displayCheck = 'isProgramDisplaySafe' in stateMod && stateMod.isProgramDisplaySafe
              ? stateMod.isProgramDisplaySafe(normalizedProgram)
              : { safe: stateMod.isRenderableProgram(normalizedProgram), reason: undefined }
            
            if (displayCheck.safe) {
              // Log summary for diagnostics
              console.log('[v0] Stage 8: Program display-safe:', {
                goalLabel: normalizedProgram?.goalLabel,
                sessionCount: normalizedProgram?.sessions?.length,
                createdAt: normalizedProgram?.createdAt,
              })
              loadedProgram = normalizedProgram
              setProgram(normalizedProgram)
              setShowBuilder(false)
              setLoadStage('program-ready')
            } else {
              // TASK 2: Program exists but fails display sanity - show recovery state, not fatal error
              console.log('[v0] Stage 8: Program fails display-sanity:', displayCheck.reason || 'unknown')
              setLoadStage(`program-malformed:${displayCheck.reason || 'unknown'}`)
              // Keep program reference so we can show "Program Needs Refresh" state
              setProgram(normalizedProgram)
              setShowBuilder(false) // Don't auto-show builder, show recovery state instead
            }
          } else {
            // No usable program - show builder
            console.log('[v0] Stage 7: No usable program - showing builder')
            setLoadStage('no-program')
            setShowBuilder(true)
          }
        } catch (err) {
          console.error('[v0] Stage 7: Error loading current program:', err)
          setLoadStage('program-load-error')
          setShowBuilder(true)
        }
        
        // TASK 3: Stage 9 - Get constraint insight if available (non-critical)
        setLoadStage('loading-constraints')
        if (constraintMod) {
          try {
            const insight = constraintMod.getConstraintInsight()
            setConstraintLabel(insight.label)
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

  // Generation error state for recoverable failures
  const [generationError, setGenerationError] = useState<string | null>(null)
  
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
        // STAGE 1: Generate program
        generationStage = 'generating'
        console.log('[ProgramPage] Generation stage: generating program...')
        const newProgram = programModules.generateAdaptiveProgram(inputs)
        
        // STAGE 2: Validate program shape (fail fast on malformed data)
        generationStage = 'validating'
        console.log('[ProgramPage] Generation stage: validating program shape...')
        if (!newProgram || !newProgram.id || !Array.isArray(newProgram.sessions) || newProgram.sessions.length === 0) {
          throw new Error(`Invalid program shape: missing ${!newProgram ? 'program' : !newProgram.id ? 'id' : !newProgram.sessions ? 'sessions' : 'valid sessions'}`)
        }
        
        // STAGE 3: Log snapshot creation
        generationStage = 'logging'
        console.log('[ProgramPage] Generation stage: program validated:', {
          id: newProgram.id,
          primaryGoal: newProgram.primaryGoal,
          secondaryGoal: newProgram.secondaryGoal || 'none',
          goalLabel: newProgram.goalLabel,
          sessionCount: newProgram.sessions?.length || 0,
          scheduleMode: newProgram.scheduleMode,
          sessionDurationMode: newProgram.sessionDurationMode,
          structureName: newProgram.structure?.structureName || 'unknown',
          createdAt: newProgram.createdAt,
        })
        
        // STAGE 4: Save to storage
        generationStage = 'saving'
        console.log('[ProgramPage] Generation stage: saving snapshot...')
        programModules.saveAdaptiveProgram(newProgram)
        
        // STAGE 5: Update UI state
        generationStage = 'updating-ui'
        console.log('[ProgramPage] Generation stage: updating UI...')
        setProgram(newProgram)
        setShowBuilder(false)
        
        // ISSUE D FIX: Consistent result envelope for success
        console.log('[ProgramPage] Generation complete - all stages passed', {
          success: true,
          stage: 'complete',
          programId: newProgram.id,
          programSaved: true,
        })
      } catch (err) {
        // ISSUE A & B FIX: Extract classified error code if available
        // GenerationError from adaptive-program-builder provides stage + code
        const isGenerationError = err && typeof err === 'object' && 'code' in err && 'stage' in err
        const errorCode = isGenerationError ? (err as { code: string }).code : 'unknown_generation_failure'
        const errorStage = isGenerationError ? (err as { stage: string }).stage : generationStage
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        
        // ISSUE A: Structured console logging for diagnosability
        console.error(`[program-generate] CLIENT ERROR [${errorCode}] at stage "${errorStage}": ${errorMessage}`, {
          success: false,
          code: errorCode,
          stage: errorStage,
          error: errorMessage,
          inputsSnapshot: {
            primaryGoal: inputs?.primaryGoal,
            scheduleMode: inputs?.scheduleMode,
            trainingDays: inputs?.trainingDaysPerWeek,
          },
        })
        
        // ISSUE B: User-friendly message that doesn't expose internals
        const userMessage = errorCode === 'profile_validation_failed'
          ? 'Profile incomplete. Please ensure your training profile is complete.'
          : errorCode === 'structure_selection_failed'
          ? 'Unable to determine optimal structure. Please try adjusting your settings.'
          : errorCode === 'session_assembly_failed'
          ? 'Session assembly encountered an issue. Please try again.'
          : `Program generation failed at ${errorStage}. Please try again.`
        
        setGenerationError(userMessage)
        // Keep builder visible and inputs intact for retry
      } finally {
        // GUARANTEED: Always reset loading state - ISSUE B FIX
        setIsGenerating(false)
        console.log('[ProgramPage] Generation flow complete - loading state cleared')
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
        // STAGE 1: Record regeneration event
        regenerateStage = 'recording-event'
        programModules.recordProgramEnd?.('regenerate')
        
        // STAGE 2: Generate new program
        regenerateStage = 'generating'
        console.log('[ProgramPage] Regenerate stage: generating program...')
        const newProgram = programModules.generateAdaptiveProgram(inputs)
        
        // STAGE 3: Validate program shape
        regenerateStage = 'validating'
        console.log('[ProgramPage] Regenerate stage: validating program shape...')
        if (!newProgram || !newProgram.id || !Array.isArray(newProgram.sessions) || newProgram.sessions.length === 0) {
          throw new Error(`Invalid program shape: missing ${!newProgram ? 'program' : !newProgram.id ? 'id' : !newProgram.sessions ? 'sessions' : 'valid sessions'}`)
        }
        
        // STAGE 4: Log snapshot
        regenerateStage = 'logging'
        console.log('[ProgramPage] Regenerate stage: program validated:', {
          oldProgramId: program?.id || 'none',
          newProgramId: newProgram.id,
          primaryGoal: newProgram.primaryGoal,
          secondaryGoal: newProgram.secondaryGoal || 'none',
          goalLabel: newProgram.goalLabel,
          sessionCount: newProgram.sessions?.length || 0,
          scheduleMode: newProgram.scheduleMode,
          sessionDurationMode: newProgram.sessionDurationMode,
          structureName: newProgram.structure?.structureName || 'unknown',
        })
        
        // STAGE 5: Save to storage
        regenerateStage = 'saving'
        console.log('[ProgramPage] Regenerate stage: saving snapshot...')
        programModules.saveAdaptiveProgram(newProgram)
        
        // STAGE 6: Update UI state
        regenerateStage = 'updating-ui'
        console.log('[ProgramPage] Regenerate stage: updating UI...')
        setProgram(newProgram)
        setShowBuilder(false)
        
        // ISSUE D FIX: Consistent result envelope for success
        console.log('[ProgramPage] Regenerate complete - all stages passed', {
          success: true,
          stage: 'complete',
          programId: newProgram.id,
          programSaved: true,
        })
      } catch (err) {
        // ISSUE A & B FIX: Extract classified error code if available
        const isGenerationError = err && typeof err === 'object' && 'code' in err && 'stage' in err
        const errorCode = isGenerationError ? (err as { code: string }).code : 'unknown_generation_failure'
        const errorStage = isGenerationError ? (err as { stage: string }).stage : regenerateStage
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        
        // ISSUE A: Structured console logging for diagnosability
        console.error(`[program-generate] CLIENT ERROR [${errorCode}] at stage "${errorStage}": ${errorMessage}`, {
          success: false,
          code: errorCode,
          stage: errorStage,
          error: errorMessage,
          oldProgramId: program?.id,
        })
        
        // ISSUE B & C: Prior program preserved - only show error, don't corrupt state
        const userMessage = errorCode === 'profile_validation_failed'
          ? 'Profile incomplete. Please ensure your training profile is complete.'
          : errorCode === 'structure_selection_failed'
          ? 'Unable to determine optimal structure. Please try adjusting your settings.'
          : `Program regeneration failed at ${errorStage}. Your current program is preserved.`
        
        setGenerationError(userMessage)
        // Keep current program visible and intact for retry
      } finally {
        // GUARANTEED: Always reset loading state - ISSUE B FIX
        setIsGenerating(false)
        console.log('[program-generate] Regenerate flow complete - loading state cleared')
      }
    }, 500)
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
                    <p className="text-xs text-amber-400/70 mt-1">Your inputs are preserved. Try again when ready.</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 h-7 px-2"
                    onClick={() => setGenerationError(null)}
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
          // TASK 1: Wrap display in error boundary-like try-catch via component
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
        <ProgramAdjustmentModal
          open={showAdjustmentModal}
          onOpenChange={setShowAdjustmentModal}
          onContinue={() => setShowAdjustmentModal(false)}
          onStartNew={handleConfirmNewProgram}
          currentSessionMinutes={inputs?.sessionLength || 60}
          currentTrainingDays={inputs?.trainingDaysPerWeek || 3}
        />
      </div>
    </div>
  )
}
