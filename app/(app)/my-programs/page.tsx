'use client'

/**
 * Legacy /my-programs route
 * 
 * This route now redirects to /program (the canonical current-program route).
 * The old program builder is preserved at /program for users who need it.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProgramsPage() {
  const router = useRouter()
  
  // Redirect to canonical /program route
  useEffect(() => {
    router.replace('/program')
  }, [router])
  
  // Show loading state during redirect
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#6B7280]">Redirecting to your program...</p>
      </div>
    </div>
  )
}
  const [inputs, setInputs] = useState<ProgramInputs>(getDefaultInputs())
  const [currentProgram, setCurrentProgram] = useState<GeneratedProgram | null>(null)
  const [savedPrograms, setSavedPrograms] = useState<GeneratedProgram[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [constraintInsight, setConstraintInsight] = useState<ReturnType<typeof getConstraintInsight> | null>(null)
  const [calibration, setCalibration] = useState<ReturnType<typeof getAthleteCalibration> | null>(null)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [programStatus, setProgramStatus] = useState<ReturnType<typeof getProgramStatus>>(null)

  useEffect(() => {
    setMounted(true)
    // Load default inputs and saved programs
    setInputs(getDefaultInputs())
    setSavedPrograms(getSavedPrograms())
    setConstraintInsight(getConstraintInsight())
    setCalibration(getAthleteCalibration())
    setProgramStatus(getProgramStatus())
  }, [])

  const handleGenerateAttempt = () => {
    // If there's an active program, show the adjustment modal
    if (programStatus && programStatus.currentWeek < programStatus.minimumRecommendedWeeks) {
      setShowAdjustmentModal(true)
      return
    }
    handleGenerate()
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setIsSaved(false)
    
    // Small delay for UX
    setTimeout(() => {
      const program = generateProgram(inputs)
      setCurrentProgram(program)
      setIsGenerating(false)
      
      // Initialize program state for adjustment tracking
      initializeProgramState(program.id, {
        sessionMinutes: inputs.sessionLength as number || 60,
        trainingDays: inputs.trainingDaysPerWeek,
        equipment: [],
      })
      setProgramStatus(getProgramStatus())
    }, 300)
  }

  const handleSave = () => {
    if (!currentProgram) return
    
    saveProgram(currentProgram)
    setSavedPrograms(getSavedPrograms())
    setIsSaved(true)
  }

  const handleDelete = (id: string) => {
    setSavedPrograms(getSavedPrograms())
  }

  // Loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-[#2A2A2A] rounded w-1/3"></div>
            <div className="h-64 bg-[#2A2A2A] rounded"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-12">
          {/* Page Header */}
          <PageHeader 
            title="Program Builder"
            description="Generate a focused calisthenics program based on your current skill level, weighted strength, and training frequency"
            backHref="/dashboard"
            backLabel="Back to Dashboard"
            icon={<Calendar className="w-5 h-5" />}
          />

          {/* Adaptive Program Feature Card for Free Users */}
          <AdaptiveProgramUpgradeCard variant="inline" />

          {/* Detected Limiter Context */}
          {constraintInsight?.hasInsight && (
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-[#C1121F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider">Detected Limiter</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C1121F]/10 text-[#C1121F] font-medium">
                      {constraintInsight.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#E6E9EF] mb-1">
                    {constraintInsight.label}
                  </p>
                  <p className="text-xs text-[#A4ACB8]">
                    This program will prioritize exercises to address your {constraintInsight.label.toLowerCase()}.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Builder Form */}
          <ProgramBuilderForm
            inputs={inputs}
            onInputChange={setInputs}
            onGenerate={handleGenerateAttempt}
            isGenerating={isGenerating}
          />

          {/* Generated Program */}
          {currentProgram && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <AdaptiveEngineBadge variant="card" message={ENGINE_MESSAGES.program} />
                <p className="text-[11px] text-[#6B7280] px-1">
                  {ENGINE_MESSAGES.programHelper}
                </p>
                {constraintInsight?.hasInsight && (
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <Target className="w-3 h-3 text-[#C1121F]" />
                    <p className="text-[11px] text-[#A4ACB8]">
                      This program emphasizes exercises for your {constraintInsight.label.toLowerCase()} because SpartanLab detected it as your current limiter.
                    </p>
                  </div>
                )}
                {calibration?.calibrationComplete && (
                  <div className="flex items-start gap-2 px-1 pt-1">
                    <div className="w-3 h-3 rounded-full bg-[#4F6D8A]/20 flex items-center justify-center mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4F6D8A]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#A4ACB8]">
                        {calibration.needsCompressionWork && 'Includes compression work to build your foundation. '}
                        {calibration.leverageProfile !== 'average' && 'Progressions adjusted for your body type.'}
                        {!calibration.needsCompressionWork && calibration.leverageProfile === 'average' && 'Built for your current strength and session availability.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <GeneratedProgramCard
                program={currentProgram}
                onSave={handleSave}
                isSaved={isSaved}
              />
              
              {/* Upgrade Trigger - After Program Generation */}
              <UpgradeTriggerPanel
                title={UPGRADE_TRIGGERS.programGenerated.title}
                description={UPGRADE_TRIGGERS.programGenerated.description}
                variant="default"
              />
            </div>
          )}

          {/* Saved Programs */}
          <SavedProgramsList
            programs={savedPrograms}
            onDelete={handleDelete}
          />
        </div>

        {/* Program Adjustment Modal */}
        <ProgramAdjustmentModal
          open={showAdjustmentModal}
          onOpenChange={setShowAdjustmentModal}
          onContinue={() => setShowAdjustmentModal(false)}
          onStartNew={() => {
            setShowAdjustmentModal(false)
            handleGenerate()
          }}
          currentSessionMinutes={inputs.sessionLength as number || 60}
          currentTrainingDays={inputs.trainingDaysPerWeek}
        />
      </main>
    </div>
  )
}
