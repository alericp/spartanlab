'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { AdaptiveSessionCard } from './AdaptiveSessionCard'
// [TASK 1] Removed checkProgramStaleness - unified staleness is now passed from parent
import type { UnifiedStalenessResult } from '@/lib/canonical-profile-service'
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
  Sparkles,
  RefreshCw,
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
  onRestart?: () => void // Explicit restart action: archives current program, returns to builder
  onRegenerate?: () => void // Explicit regenerate action: updates program from current profile
  onExerciseReplace?: (dayNumber: number, exerciseId: string) => void
  // [TASK 1] Unified staleness result passed from parent - display does NOT recompute its own
  unifiedStaleness?: UnifiedStalenessResult | null
}

export function AdaptiveProgramDisplay({ 
  program, 
  onDelete,
  onRestart,
  onRegenerate,
  onExerciseReplace,
  unifiedStaleness, // [TASK 1] Consume parent's staleness evaluation
}: AdaptiveProgramDisplayProps) {
  // TASK 2: Confirmation modal state for restart action
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  
  // ==========================================================================
  // [TASK 1] USE UNIFIED STALENESS FROM PARENT - DO NOT RECOMPUTE
  // The display component receives the exact same staleness result computed by the page.
  // This prevents dual/conflicting staleness warnings.
  // ==========================================================================
  const stalenessCheck = unifiedStaleness ? {
    isStale: unifiedStaleness.isStale,
    staleDegree: unifiedStaleness.severity === 'critical' || unifiedStaleness.severity === 'significant' 
      ? 'significant' as const
      : unifiedStaleness.severity === 'minor' 
        ? 'minor' as const 
        : 'none' as const,
    changedFields: unifiedStaleness.changedFields,
    recommendation: unifiedStaleness.recommendation === 'regenerate' 
      ? 'recommend_regenerate' as const
      : unifiedStaleness.recommendation === 'review'
        ? 'suggest_regenerate' as const
        : 'continue' as const,
  } : {
    // Fallback if no unified staleness passed (backwards compatibility)
    isStale: false,
    staleDegree: 'none' as const,
    changedFields: [] as string[],
    recommendation: 'continue' as const,
  }
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
  
  // [displayed-adjustment-truth] STEP 3: Log what values are being displayed
  // This helps verify that rebuild actually replaced the program snapshot
  // TASK 6: Explicit verification logging for program identity
  console.log('[displayed-adjustment-truth] === DISPLAY TRUTH ===')
  console.log('[displayed-adjustment-truth] Program ID:', program.id)
  console.log('[displayed-adjustment-truth] Generated At:', program.createdAt)
  console.log('[displayed-adjustment-truth] Schedule Mode:', program.scheduleMode)
  console.log('[displayed-adjustment-truth] Program trainingDaysPerWeek:', program.trainingDaysPerWeek)
  console.log('[displayed-adjustment-truth] Actual valid sessions count:', validSessions.length)
  console.log('[displayed-adjustment-truth] currentWeekFrequency:', (program as { currentWeekFrequency?: number }).currentWeekFrequency)
  console.log('[displayed-adjustment-truth] DISPLAYED SESSION COUNT:', validSessions.length)
  console.log('[displayed-adjustment-truth] === END DISPLAY TRUTH ===')
  
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
              <p className="text-xs text-[#6A6A6A]">
                {program.secondaryGoal ? 'Primary Goal' : 'Goal'}
              </p>
              <p className="text-sm font-medium">{program.goalLabel}</p>
              {/* TASK 5: Show secondary goal if present */}
              {program.secondaryGoal && (
                <p className="text-xs text-[#6A6A6A] mt-0.5">
                  + {program.secondaryGoal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">
                {program.scheduleMode === 'flexible' ? 'Schedule' : 'Days/Week'}
              </p>
              {program.scheduleMode === 'flexible' ? (
                // ISSUE D FIX: Clear distinction between saved adaptive preference and current week resolution
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">Adaptive</span>
                  </div>
                  <span className="text-xs text-[#6A6A6A]">
                    {/* TASK 4: Use validSessions.length as canonical truth - never stale summary values */}
                    {validSessions.length} sessions this week
                  </span>
                </div>
              ) : (
                // STATIC USER: Show actual session count from generated program - this is canonical
                // TASK 4: Previously used program.trainingDaysPerWeek which could be stale
                <p className="text-sm font-medium">
                  {validSessions.length} days
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E63946]" />
            <div>
              <p className="text-xs text-[#6A6A6A]">
                {program.sessionDurationMode === 'adaptive' ? 'Duration' : 'Target Duration'}
              </p>
              {program.sessionDurationMode === 'adaptive' ? (
                // ISSUE D FIX: Clear distinction between saved adaptive preference and resolved duration
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">Adaptive</span>
                  </div>
                  <span className="text-xs text-[#6A6A6A]">
                    ~{program.sessionLength || 60} min base target
                  </span>
                </div>
              ) : (
                // STATIC USER: Show fixed duration as saved preference
                <p className="text-sm font-medium">{getDurationPreferenceLabel(program.sessionLength)}</p>
              )}
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

        {/* Built Around Section - Shows training emphasis and selected skills concisely */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Training Path Type Badge */}
          {program.trainingPathType && program.trainingPathType !== 'balanced' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#E63946]/10 text-[#E63946]">
              {program.trainingPathType === 'hybrid' ? 'Hybrid Training' : 
               program.trainingPathType === 'skill_mastery' ? 'Skill Mastery' :
               program.trainingPathType === 'strength_focus' ? 'Strength Focus' :
               program.trainingPathType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          )}
          {/* Selected Skills Summary - show top 3 most relevant */}
          {program.selectedSkills && program.selectedSkills.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#1A1A1A] text-[#A5A5A5]">
              <Sparkles className="w-3 h-3 text-[#E63946]/60" />
              <span className="text-[#6A6A6A]">Built around:</span>
              <span className="text-[#D0D0D0]">
                {program.selectedSkills.slice(0, 3).map(s => 
                  s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                ).join(', ')}
                {program.selectedSkills.length > 3 && ` +${program.selectedSkills.length - 3}`}
              </span>
            </span>
          )}
          {/* Structure name if not showing training path */}
          {(!program.trainingPathType || program.trainingPathType === 'balanced') && structure.structureName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#2A2A2A] text-[#A5A5A5]">
              {structure.structureName}
            </span>
          )}
        </div>
        
        {/* Program Rationale */}
        <div className="p-3 bg-[#1A1A1A] rounded-lg">
          <p className="text-sm text-[#A5A5A5]">{program.programRationale}</p>
        </div>
        
        {/* ==========================================================================
            [TASK 1] REMOVED: Profile Staleness Indicator 
            The staleness warning is now ONLY shown by the parent program page,
            not by the display component. This prevents duplicate/conflicting warnings.
            The display receives stalenessCheck via unifiedStaleness prop for any
            needed state-dependent rendering, but does NOT show its own warning banner.
           ========================================================================== */}
        
        {/* [planner-truth-audit] TASK 10: Audit warning banner - minimal, truthful */}
        {/* [TASK 5] Now shows topIssueDescription as the canonical explanation of the most important issue */}
        {program.plannerTruthAudit?.shouldWarn && program.plannerTruthAudit.topIssueReason && program.plannerTruthAudit.topIssueReason !== 'none' && (
          <div className="mt-4 p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-400 mb-1">
                  Program Quality Notice
                </p>
                <p className="text-xs text-[#A5A5A5]">
                  {/* TASK 5: Use topIssueDescription as the canonical single-reason explanation */}
                  {program.plannerTruthAudit.topIssueDescription || 
                   program.plannerTruthAudit.recommendations?.[0] || 
                   'Some preferences may not be fully reflected. Consider reviewing your profile settings.'}
                </p>
                {program.plannerTruthAudit.overallScore !== undefined && (
                  <p className="text-[10px] text-[#6A6A6A] mt-1">
                    Alignment score: {program.plannerTruthAudit.overallScore}/100
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
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
        
        {/* [trust-polish] ISSUE D: Simpler coaching label */}
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
              <span className="text-xs font-medium text-[#E63946]">Coaching Notes</span>
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

      {/* [trust-polish] ISSUE D: Cleaner label for engine context */}
      {engineContext && (
        <Card className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] border-[#3A3A3A] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#C41E3A]" />
            <span className="text-sm font-medium">Training Status</span>
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

      {/* [trust-polish] ISSUE A: Equipment notes with product-grade language */}
      {equipmentProfile && !equipmentProfile.hasFullSetup && 
       Array.isArray(equipmentProfile.adaptationNotes) && 
       equipmentProfile.adaptationNotes.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Adjusted for Your Equipment</p>
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

      {/* TASK 4: Restart Program Confirmation Modal - clear semantics */}
      <Dialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF]">Restart Program?</DialogTitle>
            <DialogDescription className="text-[#A4ACB8] pt-2">
              Choose how you want to proceed with your training program.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {/* Option 1: Regenerate (update from current profile) */}
            {onRegenerate && (
              <button
                onClick={() => {
                  setShowRestartConfirm(false)
                  onRegenerate()
                }}
                className="w-full flex items-start gap-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-4 h-4 text-[#C1121F]" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Regenerate Program</h4>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Update your program based on your current profile settings. 
                    Your workout history is preserved.
                  </p>
                  {stalenessCheck.isStale && (
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/20">
                      Recommended - profile changed
                    </span>
                  )}
                </div>
              </button>
            )}
            
            {/* Option 2: Full Restart (archive and start fresh) */}
            <button
              onClick={() => {
                setShowRestartConfirm(false)
                if (onRestart) {
                  onRestart()
                } else if (onDelete) {
                  onDelete()
                }
              }}
              className="w-full flex items-start gap-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A] hover:border-amber-500/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <RotateCcw className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#E6E9EF]">Restart from Scratch</h4>
                <p className="text-xs text-[#6B7280] mt-1">
                  Archive your current program and return to the builder to create a completely new program.
                </p>
              </div>
            </button>
          </div>
          
          {/* What's preserved notice */}
          <div className="p-3 bg-[#1A2F1A]/30 border border-[#2D5A2D]/30 rounded-lg">
            <p className="text-xs text-[#4ADE80]">
              <span className="font-medium">Always preserved:</span> Your workout history, completed sessions, and progress data.
            </p>
          </div>
          
          <DialogFooter>
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
