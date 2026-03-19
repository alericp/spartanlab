'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navigation } from '@/components/shared/Navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Battery,
  BatteryLow,
  BatteryMedium,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Play,
  Dumbbell,
} from 'lucide-react'
import Link from 'next/link'
import { type AdaptiveSession, type AdaptiveExercise } from '@/lib/adaptive-program-builder'
import { getProgramState } from '@/lib/program-state'
import {
  calculateSessionAdjustment,
  inferWellnessFromRecovery,
  QUICK_ADJUSTMENT_PRESETS,
  type WellnessState,
  type SessionAdjustment,
} from '@/lib/daily-adjustment-engine'
import { assessDeloadNeed, type DeloadAssessment } from '@/lib/deload-detection-engine'
import { getQuickWeekStatus, type QuickWeekStatus } from '@/lib/week-reschedule-engine'
import { getSessionAdjustmentExplanation, getDeloadExplanation } from '@/lib/adjustment-explanation-engine'

export default function TodaySessionPage() {
  const [currentSession, setCurrentSession] = useState<AdaptiveSession | null>(null)
  const [adjustment, setAdjustment] = useState<SessionAdjustment | null>(null)
  const [deloadAssessment, setDeloadAssessment] = useState<DeloadAssessment | null>(null)
  const [weekStatus, setWeekStatus] = useState<QuickWeekStatus | null>(null)
  
  // User inputs
  const [wellnessState, setWellnessState] = useState<WellnessState>('normal')
  const [availableMinutes, setAvailableMinutes] = useState(60)
  const [showSettings, setShowSettings] = useState(false)
  const [showExercises, setShowExercises] = useState(true)
  const [useAdjusted, setUseAdjusted] = useState<boolean | null>(null)
  
  const [mounted, setMounted] = useState(false)

  const loadData = useCallback(() => {
    // Use safe unified program state
    const { adaptiveProgram, hasUsableWorkoutProgram } = getProgramState()
    if (!hasUsableWorkoutProgram || !adaptiveProgram) {
      setCurrentSession(null)
      return
    }
    const program = adaptiveProgram
    
    // Get today's session (simple: use first incomplete or first session)
    const today = new Date().getDay()
    const sessionIdx = Math.min(today === 0 ? 6 : today - 1, program.sessions.length - 1)
    const session = program.sessions[sessionIdx] || program.sessions[0]
    
    setCurrentSession(session)
    
    // Calculate adjustment
    const adj = calculateSessionAdjustment(session, {
      wellnessState,
      availableMinutes,
      plannedMinutes: session.estimatedMinutes,
    })
    setAdjustment(adj)
    
    // Get deload assessment
    setDeloadAssessment(assessDeloadNeed())
    
    // Get week status
    setWeekStatus(getQuickWeekStatus(program, []))
  }, [wellnessState, availableMinutes])

  useEffect(() => {
    setMounted(true)
    const inferredWellness = inferWellnessFromRecovery()
    setWellnessState(inferredWellness)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadData()
    }
  }, [mounted, loadData])

  const handleWellnessChange = (newWellness: WellnessState) => {
    setWellnessState(newWellness)
    setUseAdjusted(null)
  }

  const handleTimeChange = (minutes: number) => {
    setAvailableMinutes(minutes)
    setUseAdjusted(null)
  }

  const getActiveSession = (): AdaptiveSession | null => {
    if (!adjustment) return currentSession
    if (useAdjusted === true) return adjustment.adjusted
    if (useAdjusted === false) return adjustment.original
    return adjustment.wasAdjusted ? adjustment.adjusted : adjustment.original
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-[#6A6A6A]">Loading...</div>
      </div>
    )
  }

  const activeSession = getActiveSession()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-[#6A6A6A] hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Today's Session</h1>
            <p className="text-sm text-[#6A6A6A]">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* No Program State */}
        {!currentSession && (
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-[#3A3A3A] mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Active Program</h2>
            <p className="text-[#6A6A6A] mb-4">
              Generate a training program to see today's session.
            </p>
            <Link href="/program">
              <Button className="bg-[#E63946] hover:bg-[#D62828]">
                Create Program
              </Button>
            </Link>
          </Card>
        )}

        {/* Main Content */}
        {currentSession && adjustment && (
          <div className="space-y-4">
            {/* Wellness & Time Settings */}
            <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <WellnessIcon state={wellnessState} />
                  <div className="text-left">
                    <p className="text-sm font-medium capitalize">{wellnessState}</p>
                    <p className="text-xs text-[#6A6A6A]">{availableMinutes} min available</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#6A6A6A] transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>
              
              {showSettings && (
                <div className="mt-4 pt-4 border-t border-[#3A3A3A] space-y-4">
                  {/* Wellness State */}
                  <div>
                    <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">How do you feel?</p>
                    <div className="flex gap-2">
                      {(['fresh', 'normal', 'fatigued'] as WellnessState[]).map(state => (
                        <Button
                          key={state}
                          size="sm"
                          variant={wellnessState === state ? 'default' : 'outline'}
                          className={
                            wellnessState === state
                              ? 'bg-[#E63946] hover:bg-[#D62828] flex-1'
                              : 'border-[#3A3A3A] flex-1'
                          }
                          onClick={() => handleWellnessChange(state)}
                        >
                          <WellnessIcon state={state} small />
                          <span className="ml-1.5 capitalize">{state}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Available Time */}
                  <div>
                    <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">Available time</p>
                    <div className="flex gap-2 flex-wrap">
                      {[30, 45, 60, 75, 90].map(mins => (
                        <Button
                          key={mins}
                          size="sm"
                          variant={availableMinutes === mins ? 'default' : 'outline'}
                          className={
                            availableMinutes === mins
                              ? 'bg-[#E63946] hover:bg-[#D62828]'
                              : 'border-[#3A3A3A]'
                          }
                          onClick={() => handleTimeChange(mins)}
                        >
                          {mins} min
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Adjustment Card */}
            <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AdjustmentIcon type={adjustment.type} />
                    <span className={`text-sm font-semibold ${getAdjustmentColor(adjustment.type)}`}>
                      {adjustment.label}
                    </span>
                  </div>
                  <p className="text-lg font-bold">{activeSession?.focusLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#A5A5A5]">~{activeSession?.estimatedMinutes} min</p>
                  <p className="text-xs text-[#6A6A6A]">{activeSession?.exercises.length} exercises</p>
                </div>
              </div>
              
              <p className="text-sm text-[#A5A5A5] mb-4">
                {adjustment.explanation}
              </p>
              
              {/* What's Preserved/Cut */}
              {adjustment.wasAdjusted && (
                <div className="flex gap-4 mb-4">
                  {adjustment.whatToKeep.length > 0 && (
                    <div className="flex-1">
                      <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-1">Preserved</p>
                      <p className="text-sm text-green-400">
                        {adjustment.whatToKeep.length} exercises
                      </p>
                    </div>
                  )}
                  {adjustment.whatToCut.length > 0 && (
                    <div className="flex-1">
                      <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-1">Removed</p>
                      <p className="text-sm text-red-400">
                        {adjustment.whatToCut.length} exercises
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              {adjustment.wasAdjusted && useAdjusted === null && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setUseAdjusted(true)}
                    className="flex-1 bg-[#E63946] hover:bg-[#D62828]"
                  >
                    Use Adjusted
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUseAdjusted(false)}
                    className="flex-1 border-[#3A3A3A] hover:bg-[#3A3A3A]"
                  >
                    Keep Original
                  </Button>
                </div>
              )}
              
              {(!adjustment.wasAdjusted || useAdjusted !== null) && (
                <Link href="/workout/session" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                </Link>
              )}
            </Card>

            {/* Week Status (if issues) */}
            {weekStatus && !weekStatus.isOnTrack && (
              <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-1">Week Status</p>
                    <p className="text-sm font-medium text-orange-400">
                      {weekStatus.missedCount} session{weekStatus.missedCount > 1 ? 's' : ''} missed
                    </p>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-green-400">{weekStatus.completedCount}</p>
                      <p className="text-xs text-[#6A6A6A]">Done</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#A5A5A5]">{weekStatus.remainingCount}</p>
                      <p className="text-xs text-[#6A6A6A]">Left</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#A5A5A5] mt-2">{weekStatus.recommendation}</p>
                <Link href="/week" className="block mt-3">
                  <Button variant="outline" size="sm" className="w-full border-[#3A3A3A] text-[#A5A5A5] hover:bg-[#3A3A3A]">
                    View Week Adjustment
                  </Button>
                </Link>
              </Card>
            )}

            {/* Deload Warning (if needed) */}
            {deloadAssessment && deloadAssessment.status !== 'no_deload_needed' && (
              <Card className={`border p-4 ${
                deloadAssessment.status === 'deload_recommended'
                  ? 'bg-red-500/5 border-red-500/20'
                  : deloadAssessment.status === 'lighten_next_session'
                    ? 'bg-orange-500/5 border-orange-500/20'
                    : 'bg-yellow-500/5 border-yellow-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    deloadAssessment.status === 'deload_recommended'
                      ? 'text-red-400'
                      : deloadAssessment.status === 'lighten_next_session'
                        ? 'text-orange-400'
                        : 'text-yellow-400'
                  }`} />
                  <div>
                    <p className="font-medium">{deloadAssessment.label}</p>
                    <p className="text-sm text-[#A5A5A5] mt-1">{deloadAssessment.explanation}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Exercise List */}
            {activeSession && (
              <Card className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden">
                <button
                  onClick={() => setShowExercises(!showExercises)}
                  className="w-full p-4 flex items-center justify-between hover:bg-[#333] transition-colors"
                >
                  <span className="font-semibold">Exercises</span>
                  <ChevronDown className={`w-5 h-5 text-[#6A6A6A] transition-transform ${showExercises ? 'rotate-180' : ''}`} />
                </button>
                
                {showExercises && (
                  <div className="px-4 pb-4 space-y-2">
                    {activeSession.exercises.map((exercise, idx) => (
                      <ExerciseRow
                        key={exercise.id}
                        exercise={exercise}
                        index={idx + 1}
                        wasRemoved={adjustment.whatToCut.includes(exercise.name)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Science Explanation */}
            <Card className="bg-[#1A1A1A] border-[#2A2A2A] p-4">
              <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">Why This Adjustment</p>
              <p className="text-sm text-[#A5A5A5]">
                {getSessionAdjustmentExplanation(
                  adjustment.type,
                  wellnessState,
                  { available: availableMinutes, planned: currentSession.estimatedMinutes }
                ).scienceBasis}
              </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function WellnessIcon({ state, small }: { state: WellnessState; small?: boolean }) {
  const size = small ? 'w-4 h-4' : 'w-5 h-5'
  
  switch (state) {
    case 'fresh':
      return <Battery className={`${size} text-green-400`} />
    case 'normal':
      return <BatteryMedium className={`${size} text-yellow-400`} />
    case 'fatigued':
      return <BatteryLow className={`${size} text-orange-400`} />
  }
}

function AdjustmentIcon({ type }: { type: string }) {
  switch (type) {
    case 'keep_as_planned':
      return <Check className="w-4 h-4 text-green-400" />
    case 'shorten_session':
      return <Clock className="w-4 h-4 text-yellow-400" />
    case 'reduce_volume':
      return <BatteryMedium className="w-4 h-4 text-yellow-400" />
    case 'shift_emphasis':
      return <RefreshCw className="w-4 h-4 text-blue-400" />
    case 'recovery_bias':
      return <BatteryLow className="w-4 h-4 text-orange-400" />
    default:
      return <Zap className="w-4 h-4 text-[#A5A5A5]" />
  }
}

function getAdjustmentColor(type: string): string {
  switch (type) {
    case 'keep_as_planned':
      return 'text-green-400'
    case 'shorten_session':
    case 'reduce_volume':
      return 'text-yellow-400'
    case 'shift_emphasis':
      return 'text-blue-400'
    case 'recovery_bias':
      return 'text-orange-400'
    default:
      return 'text-[#A5A5A5]'
  }
}

interface ExerciseRowProps {
  exercise: AdaptiveExercise
  index: number
  wasRemoved?: boolean
}

function ExerciseRow({ exercise, index, wasRemoved }: ExerciseRowProps) {
  const categoryColors: Record<string, string> = {
    skill: 'text-[#E63946]',
    strength: 'text-blue-400',
    accessory: 'text-[#A5A5A5]',
    core: 'text-purple-400',
  }

  return (
    <div className={`p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] ${
      wasRemoved ? 'opacity-50 line-through' : ''
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6A6A6A] font-mono w-4">{index}.</span>
            <span className={`text-xs uppercase tracking-wider ${categoryColors[exercise.category] || 'text-[#6A6A6A]'}`}>
              {exercise.category}
            </span>
            {exercise.wasAdapted && (
              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30">
                Adjusted
              </Badge>
            )}
          </div>
          <p className="font-medium mt-1">{exercise.name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm text-[#A5A5A5]">
            {exercise.sets} x {exercise.repsOrTime}
          </p>
        </div>
      </div>
    </div>
  )
}
