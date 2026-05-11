'use client'

/**
 * =============================================================================
 * ProgramCoachIntelligenceHub.tsx
 * -----------------------------------------------------------------------------
 * SPARTANLAB PROMPT 1 — PROGRAM PAGE TOP CLEANUP
 *
 * A compact top-of-page hub that provides obvious buttons/cards to access
 * detailed program intelligence surfaces. Replaces the previous always-expanded
 * proof blocks with a clean, scannable interface.
 *
 * DESIGN DOCTRINE:
 *   - Buttons must look like buttons (not random clickable boxes)
 *   - Mobile-first: buttons wrap cleanly, no horizontal overflow
 *   - Each button opens a modal/sheet with the full detail
 *   - Day 1 should appear much sooner than before
 *   - All data is consumed from existing program truth
 *   - No fake AI reasoning — only display what exists in truth sources
 *
 * SURFACES:
 *   1. Weekly Phase / Skill Map — skill/phase/progression context
 *   2. AI Method Decisions — method decision truth from WeeklyMethodDecisionAccordion
 *   3. Calibration / Evidence — CalibrationCheckpointCard + evidence proof
 *   4. Coach Recommendations — EvidenceCoachRecommendationCard
 *   5. Requested / Deferred Methods — blocked/deferred/not-materialized methods
 * =============================================================================
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Target,
  Layers,
  Brain,
  ClipboardCheck,
  Sparkles,
  ListX,
  ChevronRight,
} from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import type { SelectedSkillRepresentationDisplay } from '@/lib/program/selected-skill-representation-guidance'
import type { ProgramIntelligenceContract } from '@/lib/program/program-display-contract'
import type { ProgramCalibrationInput } from '@/lib/program/program-calibration-recommendation'
import type { EvidenceCoachRecommendationBundle } from '@/lib/program/evidence-derived-coach-recommendations'
import { WeeklyMethodDecisionAccordion } from './WeeklyMethodDecisionAccordion'
import { CalibrationCheckpointCard } from './CalibrationCheckpointCard'
import { EvidenceCoachRecommendationCard } from './EvidenceCoachRecommendationCard'
import { cn } from '@/lib/utils'

// =============================================================================
// REQUESTED/DEFERRED METHOD SURFACE — DATA CONTRACT
// =============================================================================

export type RequestedMethodState =
  | 'applied'
  | 'materialized'
  | 'deferred'
  | 'blocked'
  | 'suppressed'
  | 'not_materialized'
  | 'not_requested'
  | 'unknown'

export interface RequestedMethodDisplayItem {
  methodKey: string
  label: string
  state: RequestedMethodState
  source: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  canOverrideNow: false // Always false in this prompt
}

/**
 * Safe selector that extracts requested/deferred method truth from the program.
 * Inspects available fields without throwing if absent.
 */
function extractRequestedMethodDecisions(
  program: AdaptiveProgram | null | undefined,
): RequestedMethodDisplayItem[] {
  if (!program) return []

  const items: RequestedMethodDisplayItem[] = []
  const seen = new Set<string>()

  // Method labels for display
  const METHOD_LABELS: Record<string, string> = {
    superset: 'Supersets',
    circuit: 'Circuits',
    density_block: 'Density Blocks',
    cluster: 'Cluster Sets',
    top_set_backoff: 'Top Set + Backoff',
    drop_set: 'Drop Sets',
    rest_pause: 'Rest-Pause',
    endurance_density: 'Endurance/Conditioning',
    finisher: 'Finishers',
  }

  // Helper to add item if not seen
  const addItem = (item: RequestedMethodDisplayItem) => {
    if (!seen.has(item.methodKey)) {
      seen.add(item.methodKey)
      items.push(item)
    }
  }

  // 1. Try weeklyMethodRepresentation.byMethod (most authoritative for AB6)
  const weeklyRep = program.weeklyMethodRepresentation
  if (weeklyRep && weeklyRep.byMethod) {
    for (const entry of weeklyRep.byMethod) {
      const methodId = entry.methodId
      if (!methodId) continue

      // Map status to display state
      let state: RequestedMethodState = 'unknown'
      if (entry.status === 'APPLIED' && entry.materializedCount > 0) {
        state = 'materialized'
      } else if (entry.status === 'BLOCKED_BY_SAFETY') {
        state = 'blocked'
      } else if (entry.status === 'NOT_NEEDED_FOR_PROFILE') {
        state = 'not_requested'
      } else if (entry.status === 'MATERIALIZER_NOT_CONNECTED') {
        state = 'not_materialized' // Engine gap - method tracked but no writer
      } else if (entry.status === 'APPLIED' && entry.materializedCount === 0) {
        state = 'not_materialized'
      }

      addItem({
        methodKey: methodId,
        label: METHOD_LABELS[methodId] ?? methodId.replace(/_/g, ' '),
        state,
        source: 'weeklyMethodRepresentation',
        reason: entry.reason || 'Detailed decision reason not yet available from final method truth.',
        confidence: entry.reason ? 'high' : 'low',
        canOverrideNow: false,
      })
    }
  }

  // 2. Try weeklyMethodDecisionSummary
  const decisionSummary = (program as unknown as {
    weeklyMethodDecisionSummary?: {
      decisions?: Array<{
        methodId: string
        applied?: boolean
        blocked?: boolean
        deferred?: boolean
        reason?: string
      }>
    }
  }).weeklyMethodDecisionSummary

  if (decisionSummary?.decisions) {
    for (const d of decisionSummary.decisions) {
      if (!d.methodId || seen.has(d.methodId)) continue

      let state: RequestedMethodState = 'unknown'
      if (d.applied) state = 'applied'
      else if (d.blocked) state = 'blocked'
      else if (d.deferred) state = 'deferred'
      else state = 'not_materialized'

      addItem({
        methodKey: d.methodId,
        label: METHOD_LABELS[d.methodId] ?? d.methodId.replace(/_/g, ' '),
        state,
        source: 'weeklyMethodDecisionSummary',
        reason: d.reason ?? 'Detailed decision reason not yet available from final method truth.',
        confidence: d.reason ? 'medium' : 'low',
        canOverrideNow: false,
      })
    }
  }

  // 3. Try weeklyMethodMaterializationPlan
  const matPlan = (program as unknown as {
    weeklyMethodMaterializationPlan?: {
      methodSlots?: Array<{
        methodId: string
        status?: string
        blockedReason?: string
      }>
    }
  }).weeklyMethodMaterializationPlan

  if (matPlan?.methodSlots) {
    for (const slot of matPlan.methodSlots) {
      if (!slot.methodId || seen.has(slot.methodId)) continue

      let state: RequestedMethodState = 'unknown'
      const status = slot.status?.toLowerCase() ?? ''
      if (status.includes('applied') || status.includes('material')) state = 'materialized'
      else if (status.includes('block')) state = 'blocked'
      else if (status.includes('defer')) state = 'deferred'
      else if (status.includes('suppress')) state = 'suppressed'

      addItem({
        methodKey: slot.methodId,
        label: METHOD_LABELS[slot.methodId] ?? slot.methodId.replace(/_/g, ' '),
        state,
        source: 'weeklyMethodMaterializationPlan',
        reason: slot.blockedReason ?? 'Detailed decision reason not yet available from final method truth.',
        confidence: slot.blockedReason ? 'medium' : 'low',
        canOverrideNow: false,
      })
    }
  }

  // 4. Try methodMaterializationSummary
  const matSummary = (program as unknown as {
    methodMaterializationSummary?: {
      applied?: string[]
      blocked?: string[]
      deferred?: string[]
    }
  }).methodMaterializationSummary

  if (matSummary) {
    for (const methodId of matSummary.applied ?? []) {
      if (seen.has(methodId)) continue
      addItem({
        methodKey: methodId,
        label: METHOD_LABELS[methodId] ?? methodId.replace(/_/g, ' '),
        state: 'applied',
        source: 'methodMaterializationSummary',
        reason: 'Method was applied to the program.',
        confidence: 'medium',
        canOverrideNow: false,
      })
    }
    for (const methodId of matSummary.blocked ?? []) {
      if (seen.has(methodId)) continue
      addItem({
        methodKey: methodId,
        label: METHOD_LABELS[methodId] ?? methodId.replace(/_/g, ' '),
        state: 'blocked',
        source: 'methodMaterializationSummary',
        reason: 'Method was blocked by the program logic.',
        confidence: 'low',
        canOverrideNow: false,
      })
    }
    for (const methodId of matSummary.deferred ?? []) {
      if (seen.has(methodId)) continue
      addItem({
        methodKey: methodId,
        label: METHOD_LABELS[methodId] ?? methodId.replace(/_/g, ' '),
        state: 'deferred',
        source: 'methodMaterializationSummary',
        reason: 'Method was deferred for a future phase.',
        confidence: 'low',
        canOverrideNow: false,
      })
    }
  }

  return items
}

// =============================================================================
// PROPS
// =============================================================================

interface ProgramCoachIntelligenceHubProps {
  program: AdaptiveProgram
  /** Selected skill representations for the skill map surface */
  selectedSkillRepresentations: SelectedSkillRepresentationDisplay[]
  /** Intelligence contract for summary data */
  intelligenceContract: ProgramIntelligenceContract | null
  /** Calibration input for CalibrationCheckpointCard */
  calibrationInput: ProgramCalibrationInput | null
  /** Evidence coach recommendation bundle */
  coachRecommendationBundle: EvidenceCoachRecommendationBundle | null
  /** Current week number */
  currentWeekNumber: number
}

// =============================================================================
// HUB BUTTON COMPONENT
// =============================================================================

interface HubButtonProps {
  icon: React.ReactNode
  label: string
  summary?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info'
  onClick: () => void
  disabled?: boolean
}

function HubButton({
  icon,
  label,
  summary,
  badge,
  badgeVariant = 'secondary',
  onClick,
  disabled = false,
}: HubButtonProps) {
  const badgeClasses: Record<string, string> = {
    default: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20',
    secondary: 'bg-[#3A3A4A] text-[#9A9AAA] border-[#4A4A5A]',
    outline: 'bg-transparent text-[#7A7A8A] border-[#3A3A4A]',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-auto flex-col items-start gap-1.5 p-3 text-left',
        'border-[#2A2A35] bg-[#1A1A22]/60 hover:bg-[#1A1A22] hover:border-[#3A3A45]',
        'transition-all duration-200',
        'min-w-[140px] flex-1',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-center gap-2 w-full">
        <div className="w-6 h-6 rounded-md bg-[#2A2A35] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-xs font-medium text-[#E6E9EF] truncate">{label}</span>
        <ChevronRight className="w-3 h-3 text-[#5A5A6A] ml-auto shrink-0" />
      </div>
      {(summary || badge) && (
        <div className="flex items-center gap-2 w-full pl-8">
          {summary && (
            <span className="text-[10px] text-[#7A7A8A] truncate">{summary}</span>
          )}
          {badge && (
            <span className={cn(
              'text-[9px] font-medium px-1.5 py-0.5 rounded border shrink-0',
              badgeClasses[badgeVariant],
            )}>
              {badge}
            </span>
          )}
        </div>
      )}
    </Button>
  )
}

// =============================================================================
// SKILL PHASE SHEET CONTENT
// =============================================================================

function SkillPhaseSheetContent({
  program,
  selectedSkillRepresentations,
  intelligenceContract,
  currentWeekNumber,
}: {
  program: AdaptiveProgram
  selectedSkillRepresentations: SelectedSkillRepresentationDisplay[]
  intelligenceContract: ProgramIntelligenceContract | null
  currentWeekNumber: number
}) {
  // Compute summary counts
  const primaryCount = selectedSkillRepresentations.filter(r => r.state === 'headline_priority').length
  const directCount = selectedSkillRepresentations.filter(r => r.state === 'direct').length
  const supportCount = selectedSkillRepresentations.filter(r => r.state === 'support' || r.state === 'accessory_carryover').length
  const deferredCount = selectedSkillRepresentations.filter(r => r.state === 'deferred' || r.state === 'compressed').length
  const underrepCount = selectedSkillRepresentations.filter(r => r.state === 'underrepresented' || r.state === 'unknown').length

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Week Phase Header */}
      <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A]">
            Week {currentWeekNumber}
          </span>
          {intelligenceContract?.weeklyDecisionLogic?.structureIdentity && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
              {intelligenceContract.weeklyDecisionLogic.structureIdentity}
            </span>
          )}
        </div>
        {intelligenceContract?.strategicSummary?.architectureLabel && (
          <p className="text-sm font-medium text-[#E6E9EF] mb-1">
            {intelligenceContract.strategicSummary.architectureLabel}
          </p>
        )}
        {intelligenceContract?.weeklyDecisionLogic?.frequencyReason && (
          <p className="text-xs text-[#8A8A9A] leading-relaxed">
            {intelligenceContract.weeklyDecisionLogic.frequencyReason}
          </p>
        )}
      </div>

      {/* Skill Coverage Summary */}
      <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#E6E9EF]">
            Your Selected Skills ({selectedSkillRepresentations.length})
          </span>
          <div className="flex gap-2 text-[10px]">
            {(primaryCount + directCount) > 0 && (
              <span className="text-emerald-400">{primaryCount + directCount} trained</span>
            )}
            {deferredCount > 0 && (
              <span className="text-amber-400">{deferredCount} deferred</span>
            )}
            {underrepCount > 0 && (
              <span className="text-[#7A7A8A]">{underrepCount} underrep</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {selectedSkillRepresentations.map((rep) => {
            const stateColors: Record<string, string> = {
              headline_priority: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
              direct: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
              support: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
              accessory_carryover: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
              deferred: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
              compressed: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
              underrepresented: 'border-[#3A3A4A] bg-[#2A2A35] text-[#8A8A9A]',
              unknown: 'border-[#3A3A4A] bg-[#2A2A35] text-[#7A7A8A]',
            }

            return (
              <div
                key={rep.skill}
                className="flex items-start gap-3 p-2 rounded border border-[#2A2A35]"
              >
                <span className={cn(
                  'px-2 py-0.5 text-[10px] font-medium rounded border shrink-0',
                  stateColors[rep.state] ?? stateColors.unknown,
                )}>
                  {rep.visibleBadge}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#E6E9EF] truncate">{rep.label}</p>
                  <p className="text-[10px] text-[#7A7A8A] leading-relaxed mt-0.5">
                    {rep.explanation}
                  </p>
                </div>
              </div>
            )
          })}

          {selectedSkillRepresentations.length === 0 && (
            <p className="text-xs text-[#7A7A8A] text-center py-4">
              No selected skills found in program truth.
            </p>
          )}
        </div>
      </div>

      {/* Architectural Decisions */}
      {intelligenceContract?.weeklyDecisionLogic?.architecturalDecisions &&
        intelligenceContract.weeklyDecisionLogic.architecturalDecisions.length > 0 && (
          <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
              Architectural Decisions
            </span>
            <ul className="space-y-1.5">
              {intelligenceContract.weeklyDecisionLogic.architecturalDecisions.slice(0, 5).map((d, i) => (
                <li key={i} className="text-xs text-[#8A8A9A] leading-relaxed flex items-start gap-2">
                  <span className="text-[#5A5A6A] mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  )
}

// =============================================================================
// REQUESTED/DEFERRED METHODS SHEET CONTENT
// =============================================================================

function RequestedMethodsSheetContent({
  program,
}: {
  program: AdaptiveProgram
}) {
  const methodItems = extractRequestedMethodDecisions(program)

  // Group by state
  const applied = methodItems.filter(m => m.state === 'applied' || m.state === 'materialized')
  const blocked = methodItems.filter(m => m.state === 'blocked')
  const deferred = methodItems.filter(m => m.state === 'deferred')
  const suppressed = methodItems.filter(m => m.state === 'suppressed')
  const notMaterialized = methodItems.filter(m => m.state === 'not_materialized')
  const notRequested = methodItems.filter(m => m.state === 'not_requested')
  const unknown = methodItems.filter(m => m.state === 'unknown')

  const stateColors: Record<RequestedMethodState, string> = {
    applied: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    materialized: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    blocked: 'border-red-500/30 bg-red-500/10 text-red-400',
    deferred: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    suppressed: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    not_materialized: 'border-[#3A3A4A] bg-[#2A2A35] text-[#8A8A9A]',
    not_requested: 'border-[#3A3A4A] bg-[#2A2A35] text-[#6A6A7A]',
    unknown: 'border-[#3A3A4A] bg-[#2A2A35] text-[#5A5A6A]',
  }

  const stateLabels: Record<RequestedMethodState, string> = {
    applied: 'Applied',
    materialized: 'Materialized',
    blocked: 'Blocked',
    deferred: 'Deferred',
    suppressed: 'Suppressed',
    not_materialized: 'Not Materialized',
    not_requested: 'Not Requested',
    unknown: 'Unknown',
  }

  const renderGroup = (items: RequestedMethodDisplayItem[], title: string) => {
    if (items.length === 0) return null
    return (
      <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
          {title} ({items.length})
        </span>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.methodKey} className="flex items-start gap-3">
              <span className={cn(
                'px-2 py-0.5 text-[9px] font-medium rounded border shrink-0 mt-0.5',
                stateColors[item.state],
              )}>
                {stateLabels[item.state]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#E6E9EF]">{item.label}</p>
                <p className="text-[10px] text-[#7A7A8A] leading-relaxed mt-0.5">
                  {item.reason}
                </p>
                {item.confidence === 'low' && (
                  <p className="text-[9px] text-[#5A5A6A] mt-1 italic">
                    Reason detail confidence: low
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const hasAnyData = methodItems.length > 0

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {!hasAnyData && (
        <div className="p-4 rounded-lg bg-[#1A1A22] border border-[#2A2A35] text-center">
          <ListX className="w-8 h-8 text-[#5A5A6A] mx-auto mb-2" />
          <p className="text-xs text-[#8A8A9A]">
            No blocked or deferred method requests found in the current final program truth.
          </p>
          <p className="text-[10px] text-[#6A6A7A] mt-1">
            This is normal for newly generated programs or programs without method preference conflicts.
          </p>
        </div>
      )}

      {renderGroup(applied, 'Applied / Materialized')}
      {renderGroup(blocked, 'Blocked')}
      {renderGroup(deferred, 'Deferred')}
      {renderGroup(suppressed, 'Suppressed')}
      {renderGroup(notMaterialized, 'Not Materialized')}
      {renderGroup(notRequested, 'Not Requested (Profile)')}
      {renderGroup(unknown, 'Unknown Status')}

      {/* Override notice */}
      <div className="p-3 rounded-lg bg-[#1A1A22]/50 border border-[#2A2A35]/50">
        <p className="text-[10px] text-[#6A6A7A] leading-relaxed">
          Method override functionality is planned for a future update. 
          The decisions shown here reflect the current final program truth.
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProgramCoachIntelligenceHub({
  program,
  selectedSkillRepresentations,
  intelligenceContract,
  calibrationInput,
  coachRecommendationBundle,
  currentWeekNumber,
}: ProgramCoachIntelligenceHubProps) {
  // Sheet open states
  const [skillPhaseOpen, setSkillPhaseOpen] = useState(false)
  const [methodDecisionsOpen, setMethodDecisionsOpen] = useState(false)
  const [calibrationOpen, setCalibrationOpen] = useState(false)
  const [coachRecsOpen, setCoachRecsOpen] = useState(false)
  const [requestedMethodsOpen, setRequestedMethodsOpen] = useState(false)

  // Compute summary data for button badges
  const trainedSkillCount = selectedSkillRepresentations.filter(
    r => r.state === 'headline_priority' || r.state === 'direct' || r.state === 'support'
  ).length
  const skillSummary = trainedSkillCount > 0 
    ? `${trainedSkillCount} trained` 
    : `${selectedSkillRepresentations.length} selected`

  const methodItems = extractRequestedMethodDecisions(program)
  const blockedOrDeferredCount = methodItems.filter(
    m => m.state === 'blocked' || m.state === 'deferred' || m.state === 'suppressed'
  ).length

  const hasCoachRecs = coachRecommendationBundle?.primary !== null

  return (
    <>
      {/* Hub Container */}
      <div 
        className="mb-4 p-3 rounded-lg border border-[#2A2A35] bg-gradient-to-br from-[#1A1A22]/80 to-[#1A1A20]/60"
        data-coach-intelligence-hub="true"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-[#E63946]" />
          <span className="text-xs font-medium text-[#E6E9EF]">Coach Intelligence</span>
          <span className="text-[10px] text-[#5A5A6A] ml-auto">
            Week {currentWeekNumber}
          </span>
        </div>

        {/* Button Grid */}
        <div className="flex flex-wrap gap-2">
          <HubButton
            icon={<Target className="w-3.5 h-3.5 text-[#E63946]" />}
            label="Skill Map"
            summary={skillSummary}
            onClick={() => setSkillPhaseOpen(true)}
          />

          <HubButton
            icon={<Layers className="w-3.5 h-3.5 text-blue-400" />}
            label="Method Decisions"
            onClick={() => setMethodDecisionsOpen(true)}
          />

          <HubButton
            icon={<ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />}
            label="Calibration"
            onClick={() => setCalibrationOpen(true)}
            disabled={!calibrationInput}
          />

          <HubButton
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            label="Coach Recs"
            badge={hasCoachRecs ? 'Active' : undefined}
            badgeVariant={hasCoachRecs ? 'success' : 'secondary'}
            onClick={() => setCoachRecsOpen(true)}
            disabled={!hasCoachRecs}
          />

          <HubButton
            icon={<ListX className="w-3.5 h-3.5 text-[#9A9AAA]" />}
            label="Deferred Methods"
            badge={blockedOrDeferredCount > 0 ? `${blockedOrDeferredCount}` : undefined}
            badgeVariant={blockedOrDeferredCount > 0 ? 'warning' : 'secondary'}
            onClick={() => setRequestedMethodsOpen(true)}
          />
        </div>
      </div>

      {/* Skill Phase Sheet */}
      <Sheet open={skillPhaseOpen} onOpenChange={setSkillPhaseOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#E63946]" />
              Weekly Phase & Skill Map
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              Your skill progression and weekly training phase
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <SkillPhaseSheetContent
              program={program}
              selectedSkillRepresentations={selectedSkillRepresentations}
              intelligenceContract={intelligenceContract}
              currentWeekNumber={currentWeekNumber}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Method Decisions Sheet */}
      <Sheet open={methodDecisionsOpen} onOpenChange={setMethodDecisionsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              AI Method Decisions
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              Day-by-day method strategy and reasoning
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            <WeeklyMethodDecisionAccordion program={program} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Calibration Sheet */}
      <Sheet open={calibrationOpen} onOpenChange={setCalibrationOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              Calibration & Evidence
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              Baseline tests and calibration recommendations
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            {calibrationInput && (
              <CalibrationCheckpointCard input={calibrationInput} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Coach Recommendations Sheet */}
      <Sheet open={coachRecsOpen} onOpenChange={setCoachRecsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Coach Recommendations
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              Evidence-based coaching suggestions
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            <EvidenceCoachRecommendationCard bundle={coachRecommendationBundle} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Requested/Deferred Methods Sheet */}
      <Sheet open={requestedMethodsOpen} onOpenChange={setRequestedMethodsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <ListX className="w-4 h-4 text-[#9A9AAA]" />
              Requested & Deferred Methods
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              Methods requested, blocked, deferred, or not materialized
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <RequestedMethodsSheetContent program={program} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
