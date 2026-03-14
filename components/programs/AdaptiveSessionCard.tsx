'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdaptiveSession, AdaptiveExercise } from '@/lib/adaptive-program-builder'
import { ChevronDown, ChevronUp, Clock, AlertCircle, Zap, RefreshCw, Play, CheckCircle2 } from 'lucide-react'
import { WorkoutExecutionCard, StartWorkoutButton } from './WorkoutExecutionCard'
import { exerciseSupportsRPE } from '@/lib/rpe-adjustment-engine'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { 
  SessionHeader, 
  StartWorkoutPanel, 
  PausedOverlay,
  FinishConfirmation 
} from '@/components/workout/WorkoutSessionControls'
import { WorkoutSessionSummary } from '@/components/workout/WorkoutSessionSummary'
import { trackWorkoutStarted, trackWorkoutCompleted } from '@/lib/analytics'
import { ExerciseReplacementModal } from './ExerciseReplacementModal'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import type { EquipmentType } from '@/lib/adaptive-exercise-pool'

interface AdaptiveSessionCardProps {
  session: AdaptiveSession
  onExerciseReplace?: (exerciseId: string) => void
  onWorkoutComplete?: () => void
}

export function AdaptiveSessionCard({ session, onExerciseReplace, onWorkoutComplete }: AdaptiveSessionCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(true)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showCooldown, setShowCooldown] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showReplacementModal, setShowReplacementModal] = useState(false)
  const [selectedExerciseForReplace, setSelectedExerciseForReplace] = useState<{id: string, name: string} | null>(null)

  // Session lifecycle hook
  const workoutSession = useWorkoutSession(session)
  const { 
    status, 
    isActive, 
    isPaused, 
    isCompleted,
    stats,
    formattedDuration,
    completedSets,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    finish: finishSession,
    reset: resetSession,
    save: saveSession,
  } = workoutSession

  // Count RPE-enabled exercises
  const rpeExerciseCount = session.exercises.filter((e) => exerciseSupportsRPE(e.name)).length

  const handleStartWorkout = () => {
    startSession()
    setIsExpanded(true)
    trackWorkoutStarted(session.name)
  }

  const handleWorkoutComplete = () => {
    finishSession()
    trackWorkoutCompleted(session.name, stats.durationMinutes, stats.completedExercises)
    onWorkoutComplete?.()
  }

  const handleWorkoutCancel = () => {
    resetSession()
  }

  const handleFinishRequest = () => {
    setShowFinishConfirm(true)
  }

  const handleFinishConfirm = () => {
    setShowFinishConfirm(false)
    finishSession()
  }

  const handleReturnToDashboard = () => {
    router.push('/dashboard')
  }

  const handleReturnToProgram = () => {
    resetSession()
  }

  const handleExerciseReplace = (exerciseId: string, exerciseName: string) => {
    setSelectedExerciseForReplace({ id: exerciseId, name: exerciseName })
    setShowReplacementModal(true)
  }

  const handleReplacementConfirm = (newExerciseId: string) => {
    if (selectedExerciseForReplace && onExerciseReplace) {
      onExerciseReplace(selectedExerciseForReplace.id)
      // The parent component handles the actual replacement logic
    }
    setShowReplacementModal(false)
    setSelectedExerciseForReplace(null)
  }

  // Get equipment from profile for replacement modal
  // Convert profile equipment types to adaptive-exercise-pool types
  const profile = getOnboardingProfile()
  const profileEquipment = profile?.equipment || []
  const equipmentMap: Record<string, EquipmentType> = {
    'pullup_bar': 'pull_bar',
    'dip_bars': 'dip_bars',
    'rings': 'rings',
    'parallettes': 'parallettes',
    'resistance_bands': 'bands',
  }
  const availableEquipment: EquipmentType[] = ['floor', 'wall', ...profileEquipment.map(e => equipmentMap[e] || e).filter((e): e is EquipmentType => !!e)]

  // Get exercises to display based on variant selection
  const displayExercises = selectedVariant !== null && session.variants?.[selectedVariant]
    ? session.variants[selectedVariant].selection.main.map(s => ({
        id: s.exercise.id,
        name: s.exercise.name,
        category: s.exercise.category,
        sets: s.sets,
        repsOrTime: s.repsOrTime,
        note: s.note,
        isOverrideable: s.isOverrideable,
        selectionReason: s.selectionReason,
      }))
    : session.exercises

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-[#333333] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold">{session.dayLabel}</h4>
              {session.isPrimary && (
                <Badge variant="outline" className="text-[#E63946] border-[#E63946]/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
            <p className="text-sm text-[#E63946]">{session.focusLabel}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#6A6A6A]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{session.estimatedMinutes} min
              </span>
              <span>{session.exercises.length} exercises</span>
              {rpeExerciseCount > 0 && (
                <span className="text-[#E63946]">{rpeExerciseCount} RPE tracked</span>
              )}
            </div>
          </div>
          <div className="text-[#6A6A6A]">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Session Header - Shows during active workout */}
      {(isActive || isPaused) && (
        <SessionHeader
          status={status}
          formattedDuration={formattedDuration}
          stats={stats}
          onPause={pauseSession}
          onResume={resumeSession}
          onFinish={handleFinishRequest}
        />
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <PausedOverlay
          formattedDuration={formattedDuration}
          stats={stats}
          onResume={resumeSession}
          onFinish={handleFinishRequest}
        />
      )}

      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
        <FinishConfirmation
          stats={stats}
          onConfirm={handleFinishConfirm}
          onCancel={() => setShowFinishConfirm(false)}
        />
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Session Completed - Show Summary */}
          {isCompleted ? (
            <WorkoutSessionSummary
              stats={stats}
              completedSets={completedSets}
              sessionName={session.dayLabel}
              onSave={saveSession}
              onReturnToDashboard={handleReturnToDashboard}
              onReturnToProgram={handleReturnToProgram}
            />
          ) : (isActive || isPaused) ? (
            /* Active Workout Execution */
            <WorkoutExecutionCard
              session={session}
              onComplete={handleWorkoutComplete}
              onCancel={handleWorkoutCancel}
              sessionState={workoutSession}
            />
          ) : (
            <>
              {/* Start Workout Panel */}
              <StartWorkoutPanel
                sessionName={session.dayLabel}
                exerciseCount={session.exercises.length}
                estimatedMinutes={session.estimatedMinutes}
                rpeExerciseCount={rpeExerciseCount}
                onStart={handleStartWorkout}
              />

              {/* Session Rationale */}
              <div className="p-3 bg-[#1A1A1A] rounded-lg text-sm text-[#A5A5A5]">
                {session.rationale}
              </div>

          {/* Adaptation Notes */}
          {session.adaptationNotes && session.adaptationNotes.length > 0 && (
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  {session.adaptationNotes.map((note, idx) => (
                    <p key={idx} className="text-amber-500/80">{note}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Time Variants */}
          {session.variants && session.variants.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-[#6A6A6A] self-center mr-1">Session length:</span>
              {session.variants.map((variant, idx) => (
                <Button
                  key={variant.duration}
                  size="sm"
                  variant={selectedVariant === idx || (selectedVariant === null && idx === 0) ? 'default' : 'outline'}
                  className={
                    selectedVariant === idx || (selectedVariant === null && idx === 0)
                      ? 'bg-[#E63946] hover:bg-[#D62828] text-xs h-7'
                      : 'border-[#3A3A3A] text-xs h-7'
                  }
                  onClick={() => setSelectedVariant(idx)}
                >
                  {variant.label}
                </Button>
              ))}
            </div>
          )}

{/* Warmup Toggle */}
  <div>
    <button
      className="flex items-center gap-2 text-sm text-[#6A6A6A] hover:text-[#A5A5A5] transition-colors"
      onClick={() => setShowWarmup(!showWarmup)}
    >
      {showWarmup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      <span>Warm-Up</span>
      <span className="text-xs text-[#4F6D8A]">({session.warmup.length} exercises)</span>
    </button>
    {showWarmup && (
      <div className="mt-2 space-y-2">
        {session.warmup[0]?.selectionReason && (
          <p className="text-xs text-[#6A6A6A] italic mb-2 pl-2 border-l-2 border-[#4F6D8A]/30">
            {session.warmup[0].selectionReason}
          </p>
        )}
        {session.warmup.map((exercise, idx) => (
          <ExerciseRow key={idx} exercise={exercise} isWarmupCooldown />
        ))}
      </div>
    )}
  </div>

{/* Main Exercises */}
  <div className="space-y-2">
  {displayExercises.map((exercise, idx) => (
  <ExerciseRow
  key={exercise.id}
  exercise={exercise}
  index={idx + 1}
  onReplace={handleExerciseReplace}
  />
            ))}
          </div>

          {/* Finisher Block */}
          {session.finisher && session.finisherIncluded && (
            <div className="mt-4 p-4 bg-gradient-to-r from-[#E63946]/5 to-[#E63946]/10 rounded-lg border border-[#E63946]/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#E63946]" />
                <h5 className="font-semibold text-[#E63946]">{session.finisher.name}</h5>
                <span className="text-xs text-[#6A6A6A] ml-auto">{session.finisher.durationMinutes} min</span>
              </div>
              <div className="space-y-2 mb-3">
                {session.finisher.exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[#E6E9EF]">{ex.name}</span>
                    <span className="text-[#A5A5A5]">{ex.reps}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#6A6A6A] italic">{session.finisher.instruction}</p>
              <p className="text-xs text-[#E63946]/80 mt-2">{session.finisher.failureBudgetNote}</p>
            </div>
          )}

          {/* Cooldown Toggle */}
          <div>
            <button
              className="flex items-center gap-2 text-sm text-[#6A6A6A] hover:text-[#A5A5A5] transition-colors"
              onClick={() => setShowCooldown(!showCooldown)}
            >
              {showCooldown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Cool-Down
              <span className="text-xs text-[#4F6D8A]">({session.cooldown.length} exercises)</span>
            </button>
            {showCooldown && (
              <div className="mt-2 space-y-2">
                {session.cooldown[0]?.selectionReason && (
                  <p className="text-xs text-[#6A6A6A] italic mb-2 pl-2 border-l-2 border-green-500/30">
                    {session.cooldown[0].selectionReason}
                  </p>
                )}
                {session.cooldown.map((exercise, idx) => (
                  <ExerciseRow key={idx} exercise={exercise} isWarmupCooldown />
                ))}
              </div>
            )}
          </div>
            </>
)}
  </div>
  )}

      {/* Exercise Replacement Modal */}
      {selectedExerciseForReplace && (
        <ExerciseReplacementModal
          open={showReplacementModal}
          onOpenChange={setShowReplacementModal}
          exerciseId={selectedExerciseForReplace.id}
          exerciseName={selectedExerciseForReplace.name}
          availableEquipment={availableEquipment}
          onReplace={handleReplacementConfirm}
        />
      )}
  </Card>
  )
  }

// =============================================================================
// EXERCISE ROW
// =============================================================================

interface ExerciseRowProps {
  exercise: AdaptiveExercise
  index?: number
  isWarmupCooldown?: boolean
  onReplace?: (exerciseId: string, exerciseName: string) => void
  }

function ExerciseRow({ exercise, index, isWarmupCooldown, onReplace }: ExerciseRowProps) {
  const [showReason, setShowReason] = useState(false)
  const hasRPE = !isWarmupCooldown && exerciseSupportsRPE(exercise.name)

  const categoryColors: Record<string, string> = {
    skill: 'text-[#E63946]',
    strength: 'text-blue-400',
    accessory: 'text-[#A5A5A5]',
    core: 'text-purple-400',
    warmup: 'text-green-400',
    cooldown: 'text-green-400',
  }

  return (
    <div className={`p-3 rounded-lg border transition-colors ${
      isWarmupCooldown 
        ? 'bg-[#1A1A1A]/50 border-[#2A2A2A]' 
        : 'bg-[#1A1A1A] border-[#3A3A3A] hover:border-[#4A4A4A]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {index && (
              <span className="text-xs text-[#6A6A6A] font-mono w-4">{index}.</span>
            )}
            <span className={`text-xs uppercase tracking-wider ${categoryColors[exercise.category] || 'text-[#6A6A6A]'}`}>
              {exercise.category}
            </span>
            {exercise.methodLabel && exercise.method !== 'straight_sets' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4F6D8A]/10 text-[#4F6D8A] font-medium">
                {exercise.methodLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-medium">{exercise.name}</p>
            {hasRPE && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E63946]/10 text-[#E63946] font-medium">
                RPE
              </span>
            )}
          </div>
          {exercise.note && (
            <p className="text-xs text-[#6A6A6A] mt-0.5">{exercise.note}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm text-[#A5A5A5]">
            {exercise.sets} x {exercise.repsOrTime}
          </p>
{!isWarmupCooldown && exercise.isOverrideable && onReplace && (
  <button
  className="text-xs text-[#6A6A6A] hover:text-[#A5A5A5] flex items-center gap-1 mt-1 ml-auto"
  onClick={() => onReplace(exercise.id, exercise.name)}
  >
  <RefreshCw className="w-3 h-3" />
  Replace
  </button>
  )}
        </div>
      </div>
      
      {/* Selection Reason (expandable) */}
      {!isWarmupCooldown && exercise.selectionReason && (
        <div className="mt-2">
          <button
            className="text-xs text-[#6A6A6A] hover:text-[#A5A5A5]"
            onClick={() => setShowReason(!showReason)}
          >
            {showReason ? 'Hide why' : 'Why this exercise?'}
          </button>
          {showReason && (
            <p className="text-xs text-[#6A6A6A] mt-1 pl-2 border-l-2 border-[#3A3A3A]">
              {exercise.selectionReason}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
