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
import { type AdaptiveSession, type AdaptiveExercise, type AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { buildSelectedVariantMain } from '@/lib/workout/selected-variant-session-contract'
import { getProgramState } from '@/lib/program-state'
import { getWeekAdaptationDisplay, getOmittedSkillDisplay, buildExercisePurposeLine } from '@/lib/program/program-display-contract'
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
  const [acclimationNote, setAcclimationNote] = useState<string | null>(null)
  const [omittedSkillNote, setOmittedSkillNote] = useState<string | null>(null)
  const [adaptiveProgram, setAdaptiveProgram] = useState<AdaptiveProgram | null>(null)
  
  // User inputs
  const [wellnessState, setWellnessState] = useState<WellnessState>('normal')
  const [availableMinutes, setAvailableMinutes] = useState(60)
  const [showSettings, setShowSettings] = useState(false)
  const [showExercises, setShowExercises] = useState(true)
  const [useAdjusted, setUseAdjusted] = useState<boolean | null>(null)
  
  // [PHASE-VARIANT-TRUTH] Variant selection state for Full/45/30
  const [selectedVariant, setSelectedVariant] = useState<number>(0) // 0 = Full by default
  
  const [mounted, setMounted] = useState(false)

  const loadData = useCallback(() => {
    // Use safe unified program state
    const { adaptiveProgram: program, hasUsableWorkoutProgram } = getProgramState()
    if (!hasUsableWorkoutProgram || !program) {
      setCurrentSession(null)
      setAdaptiveProgram(null)
      setAcclimationNote(null)
      return
    }
    setAdaptiveProgram(program)
    
    // Safety: Ensure sessions array exists and has valid length
    if (!Array.isArray(program.sessions) || program.sessions.length === 0) {
      console.log('[TodayPage] No sessions array in program')
      setCurrentSession(null)
      return
    }
    
    // Get today's session (simple: use first incomplete or first session)
    const today = new Date().getDay()
    const sessionIdx = Math.min(today === 0 ? 6 : today - 1, program.sessions.length - 1)
    const session = program.sessions[sessionIdx] || program.sessions[0]
    
    // Safety: Validate selected session before using
    if (!session || typeof session !== 'object') {
      console.log('[TodayPage] Selected session is invalid')
      setCurrentSession(null)
      return
    }
    
    // Safety: Ensure exercises array exists (may be empty but must be array)
    if (!Array.isArray(session.exercises)) {
      console.log('[TodayPage] Session has no exercises array')
      setCurrentSession(null)
      return
    }
    
    setCurrentSession(session)
    
    // Check for first-week acclimation protection
    const weekAdaptation = getWeekAdaptationDisplay(program)
    if (weekAdaptation.isFirstWeekProtected) {
      setAcclimationNote('Week 1 — Volume and intensity conservatively managed for adaptation.')
    } else if (weekAdaptation.isProtective && weekAdaptation.phaseLabel !== 'Normal Progression') {
      setAcclimationNote(`${weekAdaptation.phaseLabel} — ${weekAdaptation.loadSummary || 'Adjusted dosage applied'}.`)
    } else {
      setAcclimationNote(null)
    }
    
    // Check for omitted/deferred skill explanation
    const omittedSkill = getOmittedSkillDisplay(program)
    if (omittedSkill.hasOmissions && omittedSkill.explanationLine) {
      // Don't duplicate if acclimation note already covers the same reason
      if (omittedSkill.reasonCategory === 'acclimation' && weekAdaptation.isFirstWeekProtected) {
        setOmittedSkillNote(null) // Already covered by acclimation note
      } else {
        setOmittedSkillNote(omittedSkill.explanationLine)
      }
    } else {
      setOmittedSkillNote(null)
    }
    
    // Calculate adjustment with safe defaults
    const plannedMinutes = typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 45
    const adj = calculateSessionAdjustment(session, {
      wellnessState,
      availableMinutes,
      plannedMinutes,
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

  // [freshness-sync] TASK 3: Listen for snapshot replacement and reload data
  useEffect(() => {
    const handleSnapshotReplaced = () => {
      console.log('[freshness-sync] Today page received snapshot-replaced event - reloading data')
      loadData()
    }
    
    window.addEventListener('spartanlab:snapshot-replaced', handleSnapshotReplaced)
    
    return () => {
      window.removeEventListener('spartanlab:snapshot-replaced', handleSnapshotReplaced)
    }
  }, [loadData])

  const handleWellnessChange = (newWellness: WellnessState) => {
    setWellnessState(newWellness)
    setUseAdjusted(null)
  }

  const handleTimeChange = (minutes: number) => {
    setAvailableMinutes(minutes)
    setUseAdjusted(null)
  }

  // [PHASE-VARIANT-TRUTH] Get variant-aware active session
  // This incorporates both adjustment decisions AND variant selection
  const getActiveSession = (): AdaptiveSession | null => {
    const baseSession = (() => {
      if (!adjustment) return currentSession
      if (useAdjusted === true) return adjustment.adjusted
      if (useAdjusted === false) return adjustment.original
      return adjustment.wasAdjusted ? adjustment.adjusted : adjustment.original
    })()
    
    if (!baseSession) return null
    
    // [PRE-AB6 BUILD GREEN GATE / STEP-5A-OMEGA] Delegate variant body
    //   resolution to the canonical shared helper
    //   `buildSelectedVariantMain` (also used by
    //   `app/(app)/workout/session/page.tsx` and
    //   `components/programs/AdaptiveSessionCard.tsx`). The previous
    //   inline mapper read invalid fields (`sel.name`, `sel.category`,
    //   `sel.wasAdapted`, `sel.coachingMeta`) directly off
    //   `SelectedExercise`, but the authoritative contract at
    //   `lib/program-exercise-selector.ts:796` places identity under
    //   `sel.exercise` (Exercise: id/name/category/...) and exposes
    //   prescription fields directly on `sel`. The shared helper
    //   already does the correct identity match (by id, then
    //   normalized name) against the full session, overlays variant
    //   prescription, preserves `wasAdapted`/`coachingMeta`/method
    //   metadata, and stamps the variant-declared duration into
    //   `estimatedMinutes`. Today page now consumes that single
    //   source of truth instead of maintaining a parallel stale
    //   mapper. No casts, no suppressions, no widening, no
    //   SelectedExercise contract change. Behavior preserved exactly:
    //   selected-variant rendering still occurs only when
    //   `selectedVariant > 0` and within range; full-session
    //   rendering is untouched.
    const variants = baseSession.variants
    if (variants && variants.length > 1 && selectedVariant > 0 && selectedVariant < variants.length) {
      const resolved = buildSelectedVariantMain(baseSession, selectedVariant)
      return {
        ...baseSession,
        exercises: resolved.exercises,
        estimatedMinutes: resolved.estimatedMinutes,
      }
    }
    
    return baseSession
  }
  
  // Get session variants info for UI
  const sessionVariants = currentSession?.variants || []
  const hasVariants = sessionVariants.length > 1

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
                <p className="text-lg font-bold">{activeSession?.focusLabel || 'Today\'s Session'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#A5A5A5]">~{typeof activeSession?.estimatedMinutes === 'number' ? activeSession.estimatedMinutes : 45} min</p>
                <p className="text-xs text-[#6A6A6A]">{Array.isArray(activeSession?.exercises) ? activeSession.exercises.length : 0} exercises</p>
                </div>
              </div>
              
              <p className="text-sm text-[#A5A5A5] mb-4">
                {adjustment.explanation}
              </p>
              
              {/* [PHASE-VARIANT-TRUTH] Session duration variant selector */}
              {hasVariants && (
                <div className="mb-4">
                  <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">Session Length</p>
                  <div className="flex gap-2">
                    {sessionVariants.map((variant, idx) => {
                      const isSelected = selectedVariant === idx
                      const exerciseCount = variant.selection?.main?.length ?? 0
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariant(idx)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected 
                              ? 'bg-[#E63946] text-white' 
                              : 'bg-[#1A1A1A] text-[#A5A5A5] hover:bg-[#333] border border-[#3A3A3A]'
                          }`}
                        >
                          <span className="block">{variant.label}</span>
                          <span className="block text-[10px] opacity-70">{variant.duration}min · {exerciseCount} ex</span>
                        </button>
                      )
                    })}
                  </div>
                  {selectedVariant > 0 && sessionVariants[selectedVariant]?.compressionLevel && (
                    <p className="text-[10px] text-[#6A6A6A] mt-1">
                      {sessionVariants[selectedVariant].compressionLevel === 'moderate' 
                        ? 'Lower-priority exercises trimmed to fit time.' 
                        : sessionVariants[selectedVariant].compressionLevel === 'aggressive'
                        ? 'Significant trimming applied. Skill work preserved.'
                        : ''}
                    </p>
                  )}
                </div>
              )}
              
              {/* [trust-polish] ISSUE A: Simplified adjustment summary - less internal-feeling */}
              {adjustment.wasAdjusted && (
                <div className="flex gap-4 mb-4">
                  {adjustment.whatToKeep.length > 0 && (
                    <div className="flex-1">
                      <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-1">Keeping</p>
                      <p className="text-sm text-green-400">
                        {adjustment.whatToKeep.length} exercises
                      </p>
                    </div>
                  )}
                  {adjustment.whatToCut.length > 0 && (
                    <div className="flex-1">
                      <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-1">Shortened</p>
                      <p className="text-sm text-amber-400">
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
                <Link 
                  href={`/workout/session${hasVariants && selectedVariant > 0 ? `?variant=${selectedVariant}` : ''}`} 
                  className="block"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Session{hasVariants && selectedVariant > 0 ? ` (${sessionVariants[selectedVariant]?.label})` : ''}
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
                
                {showExercises && Array.isArray(activeSession.exercises) && (
                  <SessionExerciseList 
                    session={activeSession}
                    adjustment={adjustment}
                  />
                )}
              </Card>
            )}
            
            {/* First-Week Acclimation Note */}
            {acclimationNote && (
              <Card className="bg-[#1A1A1A] border-[#2A2A2A] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400/70 mt-0.5 shrink-0" />
                  <p className="text-sm text-[#A5A5A5]">{acclimationNote}</p>
                </div>
              </Card>
            )}
            
            {/* Omitted Skill Explanation - separate from acclimation note */}
            {omittedSkillNote && !acclimationNote && (
              <Card className="bg-[#1A1A1A] border-[#2A2A2A] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-blue-400/70 mt-0.5 shrink-0" />
                  <p className="text-sm text-[#A5A5A5]">{omittedSkillNote}</p>
                </div>
              </Card>
            )}

            {/* Science Explanation */}
            <Card className="bg-[#1A1A1A] border-[#2A2A2A] p-4">
              <p className="text-xs text-[#6A6A6A] uppercase tracking-wider mb-2">Why This Adjustment</p>
              <p className="text-sm text-[#A5A5A5]">
                {getSessionAdjustmentExplanation(
                  adjustment.type,
                  wellnessState,
                  { available: availableMinutes, planned: typeof currentSession.estimatedMinutes === 'number' ? currentSession.estimatedMinutes : 45 }
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

// =============================================================================
// SESSION EXERCISE LIST - Grouped Truth Surface
// =============================================================================

interface SessionExerciseListProps {
  session: AdaptiveSession
  adjustment: SessionAdjustment
}

function SessionExerciseList({ session, adjustment }: SessionExerciseListProps) {
  // [GROUPED-TRUTH-LAST-MILE] Prefer authoritative styledGroups. If that array
  // is missing/empty but exercises carry grouping identity on their own
  // (blockId + method, written by the builder's method materialization pass),
  // synthesize a minimal styledGroups shape in canonical exercise order so the
  // existing grouped render below just works. No new imports, no type changes,
  // no flat fallback takeover -- we only synthesize when authoritative data is
  // absent AND exercise-level grouping truth actually exists. Fully reversible.
  let styledGroups = session.styleMetadata?.styledGroups
  if (!styledGroups || styledGroups.length === 0) {
    const synthesized: NonNullable<typeof styledGroups> = []
    const seenBlockIds = new Set<string>()
    for (const ex of session.exercises) {
      const exUnknown = ex as unknown as { blockId?: string; method?: string; methodLabel?: string }
      const method = exUnknown.method?.toLowerCase()
      const blockId = exUnknown.blockId
      if (blockId && seenBlockIds.has(blockId)) continue
      const isGrouped = !!blockId && (method === 'superset' || method === 'circuit' || method === 'cluster')
      if (isGrouped && blockId) {
        const members = session.exercises.filter(e => (e as unknown as { blockId?: string }).blockId === blockId)
        synthesized.push({
          id: blockId,
          groupType: method as 'superset' | 'circuit' | 'cluster',
          exercises: members.map((m, i) => {
            const mUnknown = m as unknown as { methodLabel?: string }
            return {
              id: m.id,
              name: m.name,
              prefix: mUnknown.methodLabel?.match(/[A-Z]\d?$/)?.[0] || `A${i + 1}`,
              trainingMethod: method as string,
              methodRationale: '',
            }
          }),
          instruction: '',
          restProtocol: method === 'circuit'
            ? '60-90s after full circuit'
            : method === 'cluster'
              ? '10-20s intra-set, 120-180s inter-set'
              : '0-15s between, 90-120s after pair',
        })
        seenBlockIds.add(blockId)
      } else {
        synthesized.push({
          id: `straight-${ex.id}`,
          groupType: 'straight',
          exercises: [{
            id: ex.id,
            name: ex.name,
            trainingMethod: 'straight',
            methodRationale: '',
          }],
          instruction: '',
          restProtocol: '60-120s between sets',
        })
      }
    }
    if (synthesized.some(g => g.groupType !== 'straight')) {
      styledGroups = synthesized
    }
  }
  const hasGroupedBlocks = styledGroups && styledGroups.some(g => g.groupType !== 'straight')
  
  // Extract session context for reason-first microcopy
  const sessionContext = {
    sessionFocus: session.focus || session.styleMetadata?.primaryStyle,
    primaryGoal: session.compositionMetadata?.sessionIntent || session.styleMetadata?.primaryStyle,
  }
  
  // Build exercise data map for lookup
  const exerciseMap = new Map<string, AdaptiveExercise>()
  session.exercises.forEach(ex => {
    exerciseMap.set(ex.id, ex)
    exerciseMap.set(ex.name.toLowerCase(), ex)
  })
  
  // Use grouped render if authoritative grouped truth exists
  if (hasGroupedBlocks && styledGroups) {
    let globalIndex = 0
    
    return (
      <div className="px-4 pb-4 space-y-3">
        {styledGroups.map((group, groupIdx) => {
          const isGrouped = group.groupType !== 'straight'
          
          if (isGrouped) {
            // Render grouped block with header and visual grouping
            const groupInfo = getGroupTypeInfo(group.groupType)
            
            return (
              <div key={group.id || `group-${groupIdx}`} className="space-y-1">
                {/* Group header */}
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-t bg-[#222] border-l-2" style={{ borderColor: groupInfo.color }}>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: groupInfo.color + '20', color: groupInfo.color }}>
                    {groupInfo.abbreviation}
                  </span>
                  <span className="text-xs text-[#A5A5A5] font-medium">{groupInfo.label}</span>
                  <span className="text-[10px] text-[#6A6A6A]">{group.exercises.length} exercises</span>
                </div>
                
                {/* Grouped exercises with visual bracket */}
                <div className="pl-3 border-l-2 space-y-1.5" style={{ borderColor: groupInfo.color + '40' }}>
                  {group.exercises.map((groupEx, exIdx) => {
                    globalIndex++
                    const fullExercise = exerciseMap.get(groupEx.id) || exerciseMap.get(groupEx.name.toLowerCase())
                    if (!fullExercise) return null
                    
                    return (
                      <ExerciseRow
                        key={fullExercise.id}
                        exercise={fullExercise}
                        prefix={groupEx.prefix || (group.groupType === 'superset' ? `A${exIdx + 1}` : `${exIdx + 1}`)}
                        wasRemoved={adjustment.whatToCut.includes(fullExercise.name)}
                        sessionContext={sessionContext}
                      />
                    )
                  })}
                </div>
                
                {/* Rest protocol if available */}
                {group.restProtocol && (
                  <p className="text-[10px] text-[#6A6A6A] px-2 py-1">
                    Rest: {group.restProtocol}
                  </p>
                )}
              </div>
            )
          } else {
            // Single exercise (straight set)
            return group.exercises.map((groupEx) => {
              globalIndex++
              const fullExercise = exerciseMap.get(groupEx.id) || exerciseMap.get(groupEx.name.toLowerCase())
              if (!fullExercise) return null
              
              return (
                <ExerciseRow
                  key={fullExercise.id}
                  exercise={fullExercise}
                  index={globalIndex}
                  wasRemoved={adjustment.whatToCut.includes(fullExercise.name)}
                  sessionContext={sessionContext}
                />
              )
            })
          }
        })}
      </div>
    )
  }
  
  // Fallback: flat list render
  return (
    <div className="px-4 pb-4 space-y-2">
      {session.exercises.map((exercise, idx) => (
        <ExerciseRow
          key={exercise.id}
          exercise={exercise}
          index={idx + 1}
          wasRemoved={adjustment.whatToCut.includes(exercise.name)}
          sessionContext={sessionContext}
        />
      ))}
    </div>
  )
}

function getGroupTypeInfo(groupType: string): { label: string; abbreviation: string; color: string } {
  switch (groupType) {
    case 'superset':
      return { label: 'Superset', abbreviation: 'SS', color: '#4F6D8A' }
    case 'circuit':
      return { label: 'Circuit', abbreviation: 'CR', color: '#E63946' }
    case 'cluster':
      return { label: 'Cluster Set', abbreviation: 'CL', color: '#7C3AED' }
    case 'density_block':
      return { label: 'Density Block', abbreviation: 'DB', color: '#F97316' }
    default:
      return { label: 'Block', abbreviation: 'BL', color: '#6A6A6A' }
  }
}

// =============================================================================
// EXERCISE ROW - Enhanced with microcopy
// =============================================================================

interface ExerciseRowProps {
  exercise: AdaptiveExercise
  index?: number
  prefix?: string
  wasRemoved?: boolean
  sessionContext?: { sessionFocus?: string; primaryGoal?: string }
}

function ExerciseRow({ exercise, index, prefix, wasRemoved, sessionContext }: ExerciseRowProps) {
  const categoryColors: Record<string, string> = {
    skill: 'text-[#E63946]',
    strength: 'text-blue-400',
    pull: 'text-blue-400',
    push: 'text-cyan-400',
    accessory: 'text-[#A5A5A5]',
    core: 'text-purple-400',
    mobility: 'text-green-400',
  }
  
  // Build reason-first microcopy from authoritative fields + session context
  const microcopy = buildExerciseMicrocopy(exercise, sessionContext)

  return (
    <div className={`p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3A] ${
      wasRemoved ? 'opacity-50 line-through' : ''
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6A6A6A] font-mono shrink-0">{prefix || (index ? `${index}.` : '')}</span>
            <span className={`text-[10px] uppercase tracking-wider shrink-0 ${categoryColors[exercise.category] || 'text-[#6A6A6A]'}`}>
              {exercise.category}
            </span>
            {exercise.wasAdapted && (
              <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-400/30 px-1 py-0">
                Adj
              </Badge>
            )}
          </div>
          <p className="font-medium mt-1 text-[14px] truncate">{exercise.name}</p>
          {/* Concise microcopy line */}
          {microcopy && (
            <p className="text-[11px] text-[#7A7A7A] mt-0.5">{microcopy}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm text-[#A5A5A5]">
            {exercise.sets} x {exercise.repsOrTime}
          </p>
          {/* RPE target if available */}
          {/* [RPE-DISPLAY-CLEANLINESS-LOCK] Round to clean coaching integer (5-10). */}
          {exercise.targetRPE && (
            <p className="text-[10px] text-[#6A6A6A]">RPE {Math.max(5, Math.min(10, Math.round(exercise.targetRPE)))}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Build concise, reason-first microcopy from authoritative exercise fields.
 * Uses the shared buildExercisePurposeLine from program-display-contract for consistency
 * across Today page, Program page, and Live Workout.
 */
function buildExerciseMicrocopy(
  exercise: AdaptiveExercise, 
  sessionContext?: { sessionFocus?: string; primaryGoal?: string }
): string | null {
  // Use the authoritative reason-first microcopy builder from display contract
  const purposeLine = buildExercisePurposeLine(
    {
      name: exercise.name,
      category: exercise.category,
      selectionReason: exercise.selectionReason,
      isPrimary: exercise.category === 'skill',
      isProtected: false,
      coachingMeta: exercise.coachingMeta,
    },
    sessionContext ? {
      sessionFocus: sessionContext.sessionFocus,
      primaryGoal: sessionContext.primaryGoal,
    } : undefined
  )
  
  if (purposeLine) return purposeLine
  
  // Fallback: use loadDecisionSummary if available
  if (exercise.coachingMeta?.loadDecisionSummary) {
    return exercise.coachingMeta.loadDecisionSummary
  }
  
  // Final fallback: short selectionReason if concise and meaningful
  if (exercise.selectionReason && exercise.selectionReason.length > 0 && exercise.selectionReason.length < 50) {
    return exercise.selectionReason
  }
  
  return null
}
