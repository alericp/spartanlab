'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { AdaptiveSessionCard } from './AdaptiveSessionCard'
import { 
  Target, 
  Calendar, 
  Clock, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { WorkoutExplanation, PlanExplanationBadge, DataConfidenceBadge } from './WorkoutExplanation'
import { getDurationPreferenceLabel } from '@/lib/duration-contract'

interface AdaptiveProgramDisplayProps {
  program: AdaptiveProgram
  onDelete?: () => void
  onRestart?: () => void // New: explicit restart action with archive
  onExerciseReplace?: (dayNumber: number, exerciseId: string) => void
}

export function AdaptiveProgramDisplay({ 
  program, 
  onDelete,
  onRestart,
  onExerciseReplace 
}: AdaptiveProgramDisplayProps) {
  // TASK 2: Confirmation modal state for restart action
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const recoveryColors: Record<string, string> = {
    HIGH: 'text-green-400 bg-green-400/10 border-green-400/20',
    MODERATE: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    LOW: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  
  // PHASE 2: Safe accessor for recoveryColors - returns default if key is missing/invalid
  const getRecoveryColor = (level: string | undefined): string => {
    if (!level || typeof level !== 'string') return recoveryColors.MODERATE
    return recoveryColors[level] || recoveryColors.MODERATE
  }
  
  // PHASE 2: Safe accessor for fatigue state display
  const formatFatigueState = (state: string | undefined): string => {
    if (!state || typeof state !== 'string') return 'Normal'
    return state.charAt(0).toUpperCase() + state.slice(1)
  }
  
  // PHASE 2: Safe accessors for nested objects - prevent crashes on partial data
  const constraintInsight = program.constraintInsight || { 
    hasInsight: false, 
    label: 'Training Balanced' 
  }
  const structure = program.structure || { 
    structureName: 'Custom Program', 
    rationale: 'Personalized training structure' 
  }
  const engineContext = program.engineContext
  const equipmentProfile = program.equipmentProfile
  const trainingBehaviorAnalysis = program.trainingBehaviorAnalysis
  
  // PHASE 2: Filter sessions to only include valid ones
  const validSessions = Array.isArray(program.sessions) 
    ? program.sessions.filter(s => s && typeof s === 'object' && Array.isArray(s.exercises))
    : []
  
  // Diagnostic: Log if we detect partial program data (only once per render)
  if (!program.recoveryLevel || !(program.recoveryLevel in recoveryColors)) {
    console.log('[AdaptiveProgramDisplay] Using fallback for recoveryLevel:', program.recoveryLevel)
  }
  if (!engineContext?.fatigueState) {
    console.log('[AdaptiveProgramDisplay] engineContext or fatigueState missing')
  }

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{program.goalLabel} Program</h3>
            <p className="text-sm text-[#6A6A6A]">
              Generated {new Date(program.createdAt).toLocaleDateString()}
            </p>
          </div>
          {/* TASK 1: Restart Program action - truthful labeling instead of misleading trash icon */}
          {(onRestart || onDelete) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#6A6A6A] hover:text-amber-400 gap-1.5"
              onClick={() => setShowRestartConfirm(true)}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Restart</span>
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">Goal</p>
              <p className="text-sm font-medium">{program.goalLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">
                {program.scheduleMode === 'flexible' ? 'Schedule' : 'Days/Week'}
              </p>
              {program.scheduleMode === 'flexible' ? (
                // FLEXIBLE USER: Show adaptive identity + this week's frequency
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">Adaptive</span>
                  <span className="text-xs text-[#6A6A6A]">
                    ({program.currentWeekFrequency || program.sessions?.length || '?'} this week)
                  </span>
                </div>
              ) : (
                // STATIC USER: Show fixed days as before
                <p className="text-sm font-medium">
                  {program.trainingDaysPerWeek} days
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">Target Duration</p>
              <p className="text-sm font-medium">{getDurationPreferenceLabel(program.sessionLength)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">Level</p>
              <p className="text-sm font-medium capitalize">{program.experienceLevel}</p>
            </div>
          </div>
        </div>

        {/* Program Rationale */}
        <div className="p-3 bg-[#1A1A1A] rounded-lg">
          <p className="text-sm text-[#A5A5A5]">{program.programRationale}</p>
        </div>
        
        {/* Why This Plan - Canonical Explanation */}
        {program.explanationMetadata && (
          <div className="mt-4">
            <WorkoutExplanation 
              metadata={program.explanationMetadata} 
              variant="program" 
              compact={true}
            />
            <div className="mt-2">
              <DataConfidenceBadge 
                confidence={program.explanationMetadata.dataConfidence}
                workoutCount={program.explanationMetadata.trustedWorkoutCount}
              />
            </div>
          </div>
        )}
        
        {/* Adaptive Coach Messages - PHASE 2: Uses safe accessor */}
        {trainingBehaviorAnalysis?.adaptationNeeded && 
         Array.isArray(trainingBehaviorAnalysis.coachMessages) && 
         trainingBehaviorAnalysis.coachMessages.length > 0 && (
          <div className="mt-4 p-3 bg-[#E63946]/5 border border-[#E63946]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {trainingBehaviorAnalysis.progressTrend === 'improving' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : trainingBehaviorAnalysis.progressTrend === 'declining' ? (
                <TrendingDown className="w-4 h-4 text-amber-400" />
              ) : (
                <Minus className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-xs font-medium text-[#E63946]">Adaptive Coaching</span>
            </div>
            <ul className="space-y-1">
              {trainingBehaviorAnalysis.coachMessages.map((msg, idx) => (
                <li key={idx} className="text-sm text-[#A5A5A5]">{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Constraint & Recovery Status */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Constraint Card - PHASE 2: Uses safe accessor */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <div className="flex items-start gap-3">
            {constraintInsight.hasInsight && constraintInsight.label !== 'Training Balanced' ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#E63946]" />
                </div>
                <div>
                  <p className="text-xs text-[#6A6A6A]">Current Limiter</p>
                  <p className="font-medium text-[#E63946]">{constraintInsight.label}</p>
                  <p className="text-xs text-[#A5A5A5] mt-1">
                    Program prioritizes addressing this constraint
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-[#6A6A6A]">Training Status</p>
                  <p className="font-medium text-green-400">Balanced</p>
                  <p className="text-xs text-[#A5A5A5] mt-1">
                    No major bottlenecks detected
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Recovery Card */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              getRecoveryColor(program.recoveryLevel).split(' ').slice(1).join(' ')
            }`}>
              <Activity className={`w-4 h-4 ${getRecoveryColor(program.recoveryLevel).split(' ')[0]}`} />
            </div>
            <div>
              <p className="text-xs text-[#6A6A6A]">Recovery State</p>
              <p className={`font-medium ${getRecoveryColor(program.recoveryLevel).split(' ')[0]}`}>
                {program.recoveryLevel === 'HIGH' ? 'Fresh' : program.recoveryLevel === 'MODERATE' ? 'Normal' : 'Fatigued'}
              </p>
              <p className="text-xs text-[#A5A5A5] mt-1">
                {program.recoveryLevel === 'HIGH' && 'Ready for high-intensity work'}
                {program.recoveryLevel === 'MODERATE' && 'Standard training volume appropriate'}
                {(!program.recoveryLevel || program.recoveryLevel === 'LOW') && 'Consider lighter sessions'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Engine Context (if available) - PHASE 2: Uses safe accessor */}
      {engineContext && (
        <Card className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] border-[#3A3A3A] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#C41E3A]" />
            <span className="text-sm font-medium">Training Intelligence Context</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Plateau Status</p>
              <p className={`text-sm font-medium ${
                engineContext.plateauStatus === 'plateau_detected' ? 'text-amber-400' :
                engineContext.plateauStatus === 'possible_plateau' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {engineContext.plateauStatus === 'no_plateau' ? 'Clear' :
                 engineContext.plateauStatus === 'possible_plateau' ? 'Possible' : 'Detected'}
              </p>
            </div>
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Strength Support</p>
              <p className={`text-sm font-medium ${
                engineContext.strengthSupportLevel === 'sufficient' ? 'text-green-400' :
                engineContext.strengthSupportLevel === 'developing' ? 'text-blue-400' :
                engineContext.strengthSupportLevel === 'insufficient' ? 'text-amber-400' :
                'text-[#A5A5A5]'
              }`}>
                {engineContext.strengthSupportLevel === 'sufficient' ? 'Strong' :
                 engineContext.strengthSupportLevel === 'developing' ? 'Building' :
                 engineContext.strengthSupportLevel === 'insufficient' ? 'Needs Work' : 'Unknown'}
              </p>
            </div>
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Fatigue State</p>
              <p className={`text-sm font-medium ${
                engineContext.fatigueState === 'fresh' ? 'text-green-400' :
                engineContext.fatigueState === 'normal' ? 'text-blue-400' :
                engineContext.fatigueState === 'fatigued' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {formatFatigueState(engineContext.fatigueState)}
              </p>
            </div>
            {Array.isArray(engineContext.recommendations) && engineContext.recommendations[0] && (
              <div className="bg-[#1A1A1A] rounded-lg p-2 col-span-2 sm:col-span-1">
                <p className="text-xs text-[#6A6A6A]">Top Recommendation</p>
                <p className="text-xs text-[#A5A5A5] line-clamp-2">{engineContext.recommendations[0]}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Equipment Notes - PHASE 2: Uses safe accessor */}
      {equipmentProfile && !equipmentProfile.hasFullSetup && 
       Array.isArray(equipmentProfile.adaptationNotes) && 
       equipmentProfile.adaptationNotes.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Equipment Adaptations Applied</p>
              <ul className="text-xs text-amber-500/70 mt-1 space-y-1">
                {equipmentProfile.adaptationNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Structure Overview - PHASE 2: Uses safe accessor */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="border-[#E63946]/30 text-[#E63946]">
            {structure.structureName}
          </Badge>
          <span className="text-xs text-[#6A6A6A]">Weekly Structure</span>
        </div>
        <p className="text-sm text-[#A5A5A5]">{structure.rationale}</p>
      </Card>

      {/* Sessions - PHASE 2: Uses safe validSessions array */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold">Training Sessions</h4>
        {validSessions.length > 0 ? (
          validSessions.map((session) => (
            <AdaptiveSessionCard
              key={session.dayNumber}
              session={session}
              onExerciseReplace={
                onExerciseReplace 
                  ? (exerciseId) => onExerciseReplace(session.dayNumber, exerciseId)
                  : undefined
              }
            />
          ))
        ) : (
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6 text-center">
            <p className="text-sm text-[#6A6A6A]">No training sessions available</p>
          </Card>
        )}
      </div>

      {/* TASK 2: Restart Program Confirmation Modal */}
      <Dialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF]">Restart Program?</DialogTitle>
            <DialogDescription className="text-[#A4ACB8] pt-2 space-y-3">
              <p>
                Your current program will be archived to your program history. 
                You can view it later in your training history.
              </p>
              <p>
                After restarting, you can build a new program tailored to your 
                updated goals and schedule.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => {
                setShowRestartConfirm(false)
                // Use onRestart if available, fall back to onDelete for backwards compatibility
                if (onRestart) {
                  onRestart()
                } else if (onDelete) {
                  onDelete()
                }
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Program
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRestartConfirm(false)}
              className="w-full border-[#3A3A3A] text-[#A4ACB8] hover:bg-[#2A2A2A]"
            >
              Keep Current Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
