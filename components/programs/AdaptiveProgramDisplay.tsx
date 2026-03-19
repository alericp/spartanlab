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
  Trash2,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface AdaptiveProgramDisplayProps {
  program: AdaptiveProgram
  onDelete?: () => void
  onExerciseReplace?: (dayNumber: number, exerciseId: string) => void
}

export function AdaptiveProgramDisplay({ 
  program, 
  onDelete,
  onExerciseReplace 
}: AdaptiveProgramDisplayProps) {
  const recoveryColors: Record<string, string> = {
    HIGH: 'text-green-400 bg-green-400/10 border-green-400/20',
    MODERATE: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    LOW: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  
  // Safe accessor for recoveryColors - returns default if key is missing/invalid
  const getRecoveryColor = (level: string | undefined): string => {
    if (!level || typeof level !== 'string') return recoveryColors.MODERATE
    return recoveryColors[level] || recoveryColors.MODERATE
  }
  
  // Safe accessor for fatigue state display
  const formatFatigueState = (state: string | undefined): string => {
    if (!state || typeof state !== 'string') return 'Normal'
    return state.charAt(0).toUpperCase() + state.slice(1)
  }
  
  // Diagnostic: Log if we detect partial program data (only once per render)
  if (!program.recoveryLevel || !(program.recoveryLevel in recoveryColors)) {
    console.log('[AdaptiveProgramDisplay] Using fallback for recoveryLevel:', program.recoveryLevel)
  }
  if (!program.engineContext?.fatigueState) {
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
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[#6A6A6A] hover:text-red-400"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
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
              <p className="text-xs text-[#6A6A6A]">Days/Week</p>
              <p className="text-sm font-medium">{program.trainingDaysPerWeek}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">Session</p>
              <p className="text-sm font-medium">{program.sessionLength} min</p>
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
        
        {/* Adaptive Coach Messages */}
        {program.trainingBehaviorAnalysis?.adaptationNeeded && 
         Array.isArray(program.trainingBehaviorAnalysis.coachMessages) && 
         program.trainingBehaviorAnalysis.coachMessages.length > 0 && (
          <div className="mt-4 p-3 bg-[#E63946]/5 border border-[#E63946]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {program.trainingBehaviorAnalysis.progressTrend === 'improving' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : program.trainingBehaviorAnalysis.progressTrend === 'declining' ? (
                <TrendingDown className="w-4 h-4 text-amber-400" />
              ) : (
                <Minus className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-xs font-medium text-[#E63946]">Adaptive Coaching</span>
            </div>
            <ul className="space-y-1">
              {program.trainingBehaviorAnalysis.coachMessages.map((msg, idx) => (
                <li key={idx} className="text-sm text-[#A5A5A5]">{msg}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Constraint & Recovery Status */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Constraint Card */}
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <div className="flex items-start gap-3">
            {program.constraintInsight.hasInsight && program.constraintInsight.label !== 'Training Balanced' ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#E63946]" />
                </div>
                <div>
                  <p className="text-xs text-[#6A6A6A]">Current Limiter</p>
                  <p className="font-medium text-[#E63946]">{program.constraintInsight.label}</p>
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

      {/* Engine Context (if available) */}
      {program.engineContext && (
        <Card className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] border-[#3A3A3A] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#C41E3A]" />
            <span className="text-sm font-medium">Training Intelligence Context</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Plateau Status</p>
              <p className={`text-sm font-medium ${
                program.engineContext.plateauStatus === 'plateau_detected' ? 'text-amber-400' :
                program.engineContext.plateauStatus === 'possible_plateau' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {program.engineContext.plateauStatus === 'no_plateau' ? 'Clear' :
                 program.engineContext.plateauStatus === 'possible_plateau' ? 'Possible' : 'Detected'}
              </p>
            </div>
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Strength Support</p>
              <p className={`text-sm font-medium ${
                program.engineContext.strengthSupportLevel === 'sufficient' ? 'text-green-400' :
                program.engineContext.strengthSupportLevel === 'developing' ? 'text-blue-400' :
                program.engineContext.strengthSupportLevel === 'insufficient' ? 'text-amber-400' :
                'text-[#A5A5A5]'
              }`}>
                {program.engineContext.strengthSupportLevel === 'sufficient' ? 'Strong' :
                 program.engineContext.strengthSupportLevel === 'developing' ? 'Building' :
                 program.engineContext.strengthSupportLevel === 'insufficient' ? 'Needs Work' : 'Unknown'}
              </p>
            </div>
            <div className="bg-[#1A1A1A] rounded-lg p-2">
              <p className="text-xs text-[#6A6A6A]">Fatigue State</p>
              <p className={`text-sm font-medium ${
                program.engineContext?.fatigueState === 'fresh' ? 'text-green-400' :
                program.engineContext?.fatigueState === 'normal' ? 'text-blue-400' :
                program.engineContext?.fatigueState === 'fatigued' ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {formatFatigueState(program.engineContext?.fatigueState)}
              </p>
            </div>
            {Array.isArray(program.engineContext?.recommendations) && program.engineContext.recommendations[0] && (
              <div className="bg-[#1A1A1A] rounded-lg p-2 col-span-2 sm:col-span-1">
                <p className="text-xs text-[#6A6A6A]">Top Recommendation</p>
                <p className="text-xs text-[#A5A5A5] line-clamp-2">{program.engineContext.recommendations[0]}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Equipment Notes */}
      {program.equipmentProfile && !program.equipmentProfile.hasFullSetup && 
       Array.isArray(program.equipmentProfile.adaptationNotes) && 
       program.equipmentProfile.adaptationNotes.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Equipment Adaptations Applied</p>
              <ul className="text-xs text-amber-500/70 mt-1 space-y-1">
                {program.equipmentProfile.adaptationNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Structure Overview */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="border-[#E63946]/30 text-[#E63946]">
            {program.structure.structureName}
          </Badge>
          <span className="text-xs text-[#6A6A6A]">Weekly Structure</span>
        </div>
        <p className="text-sm text-[#A5A5A5]">{program.structure.rationale}</p>
      </Card>

      {/* Sessions */}
      <div className="space-y-4">
        <h4 className="text-lg font-bold">Training Sessions</h4>
        {Array.isArray(program.sessions) && program.sessions.length > 0 ? (
          program.sessions.map((session) => (
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
    </div>
  )
}
