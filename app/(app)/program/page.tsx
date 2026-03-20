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

import { useState, useEffect, useCallback } from 'react'
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

export default function ProgramPage() {
  const [inputs, setInputs] = useState<AdaptiveProgramInputs | null>(null)
  const [program, setProgram] = useState<AdaptiveProgram | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [constraintLabel, setConstraintLabel] = useState<string>('')
  const [showBuilder, setShowBuilder] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  // TASK 5: Store dynamically imported module references
  const [programModules, setProgramModules] = useState<{
    generateAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').generateAdaptiveProgram | null
    saveAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').saveAdaptiveProgram | null
    deleteAdaptiveProgram: typeof import('@/lib/adaptive-program-builder').deleteAdaptiveProgram | null
    getDefaultAdaptiveInputs: typeof import('@/lib/adaptive-program-builder').getDefaultAdaptiveInputs | null
    getProgramState: typeof import('@/lib/program-state').getProgramState | null
    normalizeProgramForDisplay: typeof import('@/lib/program-state').normalizeProgramForDisplay | null
    isRenderableProgram: typeof import('@/lib/program-state').isRenderableProgram | null
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
    getProgramStatus: null,
    recordProgramEnd: null,
  })

  useEffect(() => {
    // TASK 5: Load modules individually with proper error handling
    // Do not use Promise.all - if one non-essential module fails, page shouldn't die
    const loadModules = async () => {
      try {
        // CRITICAL: Load program state modules first (essential)
        let builderMod, stateMod, adjustmentMod
        try {
          builderMod = await import('@/lib/adaptive-program-builder')
          console.log('[ProgramPage] Loaded adaptive-program-builder')
        } catch (err) {
          console.error('[ProgramPage] CRITICAL: Failed to load adaptive-program-builder:', err)
          setLoadError('Failed to load program builder. Please refresh the page.')
          setMounted(true)
          return
        }
        
        try {
          stateMod = await import('@/lib/program-state')
          console.log('[ProgramPage] Loaded program-state')
        } catch (err) {
          console.error('[ProgramPage] CRITICAL: Failed to load program-state:', err)
          setLoadError('Failed to load program state. Please refresh the page.')
          setMounted(true)
          return
        }
        
        try {
          adjustmentMod = await import('@/lib/program-adjustment-engine')
          console.log('[ProgramPage] Loaded program-adjustment-engine')
        } catch (err) {
          console.error('[ProgramPage] CRITICAL: Failed to load program-adjustment-engine:', err)
          setLoadError('Failed to load adjustment engine. Please refresh the page.')
          setMounted(true)
          return
        }
        
        // NON-CRITICAL: Load optional modules - page continues if these fail
        let hygieneMod, constraintMod
        try {
          hygieneMod = await import('@/lib/client-data-hygiene')
          console.log('[ProgramPage] Loaded client-data-hygiene')
        } catch (err) {
          console.warn('[ProgramPage] Optional: Failed to load client-data-hygiene:', err)
          // Continue - not essential
        }
        
        try {
          constraintMod = await import('@/lib/constraint-engine')
          console.log('[ProgramPage] Loaded constraint-engine')
        } catch (err) {
          console.warn('[ProgramPage] Optional: Failed to load constraint-engine:', err)
          // Continue - not essential
        }
        
        // TASK 5: Store loaded modules
        setProgramModules({
          generateAdaptiveProgram: builderMod.generateAdaptiveProgram,
          saveAdaptiveProgram: builderMod.saveAdaptiveProgram,
          deleteAdaptiveProgram: builderMod.deleteAdaptiveProgram,
          getDefaultAdaptiveInputs: builderMod.getDefaultAdaptiveInputs,
          getProgramState: stateMod.getProgramState,
          normalizeProgramForDisplay: stateMod.normalizeProgramForDisplay,
          isRenderableProgram: stateMod.isRenderableProgram,
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
        
        // Load default inputs
        const defaultInputs = builderMod.getDefaultAdaptiveInputs()
        setInputs(defaultInputs)
        
        // TASK 6: Load current program as the first critical operation
        try {
          const programState = stateMod.getProgramState()
          
          console.log('[ProgramPage] Program state loaded:', {
            hasUsableWorkoutProgram: programState.hasUsableWorkoutProgram,
            adaptiveProgramExists: !!programState.adaptiveProgram,
            sessionCount: programState.sessionCount,
          })
          
          // TASK 6: If canonical program exists and is renderable, show it
          if (programState.hasUsableWorkoutProgram && programState.adaptiveProgram) {
            const normalizedProgram = stateMod.normalizeProgramForDisplay(programState.adaptiveProgram)
            
            if (normalizedProgram && stateMod.isRenderableProgram(normalizedProgram)) {
              setProgram(normalizedProgram)
              setShowBuilder(false)
              console.log('[ProgramPage] Current program loaded successfully')
            } else {
              console.log('[ProgramPage] Program exists but is malformed - showing recovery state')
              setShowBuilder(true)
            }
          } else {
            // No usable program - show builder
            setShowBuilder(true)
          }
        } catch (err) {
          console.error('[ProgramPage] Error loading current program:', err)
          setShowBuilder(true)
        }
        
        // Get constraint insight if available (non-critical)
        if (constraintMod) {
          try {
            const insight = constraintMod.getConstraintInsight()
            setConstraintLabel(insight.label)
          } catch (err) {
            console.warn('[ProgramPage] Constraint insight failed:', err)
            setConstraintLabel('')
          }
        }
        
        setMounted(true)
      } catch (err) {
        // Fallback catch for unexpected errors
        console.error('[ProgramPage] Unexpected error during module loading:', err)
        setLoadError('An unexpected error occurred. Please refresh the page.')
        setMounted(true)
      }
    }
    
    loadModules()
  }, [])

  // TASK 5: Handlers use dynamically imported modules
  const handleGenerate = useCallback(() => {
    if (!inputs || !programModules.generateAdaptiveProgram || !programModules.saveAdaptiveProgram) return
    
    setIsGenerating(true)
    
    // Small delay for UX
    setTimeout(() => {
      const newProgram = programModules.generateAdaptiveProgram(inputs)
      programModules.saveAdaptiveProgram(newProgram)
      setProgram(newProgram)
      setShowBuilder(false)
      setIsGenerating(false)
    }, 500)
  }, [inputs, programModules])

  const handleDelete = useCallback(() => {
    if (program && programModules.deleteAdaptiveProgram) {
      programModules.deleteAdaptiveProgram(program.id)
      setProgram(null)
      setShowBuilder(true)
    }
  }, [program, programModules])

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

  // TASK 5: Show error state for module load failure
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to Load Program</h3>
            <p className="text-sm text-[#6A6A6A] mb-4">{loadError}</p>
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
          
          {program && !showBuilder && (
            <Button
              onClick={handleNewProgram}
              variant="outline"
              className="border-[#3A3A3A] hover:bg-[#2A2A2A]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          )}
        </div>

        {/* Content */}
        {showBuilder ? (
          <div className="space-y-6">
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
          <AdaptiveProgramDisplay
            program={program}
            onDelete={handleDelete}
          />
        ) : program && !programModules.isRenderableProgram?.(program) ? (
          // PHASE 1: Program exists but is malformed - show recovery state
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Program Needs Refresh</h3>
            <p className="text-sm text-[#6A6A6A] mb-4">
              Your program data needs to be regenerated. This only takes a moment.
            </p>
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
