'use client'

/**
 * Program Page - The canonical current-program experience
 * 
 * Priority order:
 * 1. Show existing adaptive program if available
 * 2. Migration from spartanlab_first_program handled by getProgramState()
 * 3. Show builder as secondary action for creating/regenerating
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdaptiveProgramForm } from '@/components/programs/AdaptiveProgramForm'
import { AdaptiveProgramDisplay } from '@/components/programs/AdaptiveProgramDisplay'
import { ProgramAdjustmentModal } from '@/components/programs/ProgramAdjustmentModal'
import {
  generateAdaptiveProgram,
  saveAdaptiveProgram,
  deleteAdaptiveProgram,
  getDefaultAdaptiveInputs,
  type AdaptiveProgramInputs,
  type AdaptiveProgram,
} from '@/lib/adaptive-program-builder'
import { getProgramState, normalizeProgramForDisplay, isRenderableProgram } from '@/lib/program-state'
import { runClientDataHygiene } from '@/lib/client-data-hygiene'
import { getConstraintInsight } from '@/lib/constraint-engine'
import { getProgramStatus, recordProgramEnd } from '@/lib/program-adjustment-engine'
import { ArrowLeft, Dumbbell, Plus, Sparkles, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function ProgramPage() {
  const [inputs, setInputs] = useState<AdaptiveProgramInputs | null>(null)
  const [program, setProgram] = useState<AdaptiveProgram | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [constraintLabel, setConstraintLabel] = useState<string>('')
  const [showBuilder, setShowBuilder] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // PHASE 5: Run hygiene to clean stale data before loading program
    runClientDataHygiene()
    
    // Load default inputs
    const defaultInputs = getDefaultAdaptiveInputs()
    setInputs(defaultInputs)
    
    // PHASE 1: Load existing program with crash-proof normalization
    // getProgramState() handles migration and validation
    // normalizeProgramForDisplay() ensures all nested objects have safe defaults
    try {
      const programState = getProgramState()
      
      // Diagnostic: Log program state for debugging client crashes
      console.log('[ProgramPage] Program state:', {
        hasUsableWorkoutProgram: programState.hasUsableWorkoutProgram,
        adaptiveProgramExists: !!programState.adaptiveProgram,
        sessionCount: programState.sessionCount,
        source: programState.adaptiveProgram ? 'canonical' : programState.legacyProgram ? 'legacy' : 'none',
      })
      
      if (programState.hasUsableWorkoutProgram && programState.adaptiveProgram) {
        // PHASE 1: Normalize program before setting state to prevent render crashes
        const normalizedProgram = normalizeProgramForDisplay(programState.adaptiveProgram)
        
        if (normalizedProgram && isRenderableProgram(normalizedProgram)) {
          setProgram(normalizedProgram)
          setShowBuilder(false)
          console.log('[ProgramPage] Loaded and normalized usable adaptive program')
        } else {
          // Program exists but couldn't be normalized - show builder
          console.log('[ProgramPage] Program exists but failed normalization - showing builder')
          setShowBuilder(true)
        }
      } else {
        // No usable program - show builder
        if (programState.adaptiveProgram && !programState.hasUsableWorkoutProgram) {
          console.log('[ProgramPage] Adaptive program exists but is not usable - showing builder')
        }
        setShowBuilder(true)
      }
    } catch (err) {
      // PHASE 1: Catch any errors during program loading
      console.error('[ProgramPage] Error loading program:', err)
      setShowBuilder(true)
    }
    
    // Get constraint insight (also wrap in try-catch)
    try {
      const insight = getConstraintInsight()
      setConstraintLabel(insight.label)
    } catch (err) {
      console.error('[ProgramPage] Error getting constraint insight:', err)
      setConstraintLabel('')
    }
  }, [])

  const handleGenerate = () => {
    if (!inputs) return
    
    setIsGenerating(true)
    
    // Small delay for UX
    setTimeout(() => {
      const newProgram = generateAdaptiveProgram(inputs)
      saveAdaptiveProgram(newProgram)
      setProgram(newProgram)
      setShowBuilder(false)
      setIsGenerating(false)
    }, 500)
  }

  const handleDelete = () => {
    if (program) {
      deleteAdaptiveProgram(program.id)
      setProgram(null)
      setShowBuilder(true)
    }
  }

  const handleNewProgram = () => {
    // If there's an active program, show the adjustment modal first
    const status = getProgramStatus()
    if (status && program) {
      setShowAdjustmentModal(true)
      return
    }
    setShowBuilder(true)
  }

  const handleConfirmNewProgram = () => {
    recordProgramEnd('new_program')
    setShowAdjustmentModal(false)
    setShowBuilder(true)
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
        ) : program && isRenderableProgram(program) ? (
          <AdaptiveProgramDisplay
            program={program}
            onDelete={handleDelete}
          />
        ) : program && !isRenderableProgram(program) ? (
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
