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

import { useState, useEffect } from 'react'
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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Eye,
  Info,
} from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import type { SelectedSkillRepresentationDisplay } from '@/lib/program/selected-skill-representation-guidance'
import type { ProgramIntelligenceContract } from '@/lib/program/program-display-contract'
import type { ProgramCalibrationInput } from '@/lib/program/program-calibration-recommendation'
import type { EvidenceCoachRecommendationBundle } from '@/lib/program/evidence-derived-coach-recommendations'
import { WeeklyMethodDecisionAccordion } from './WeeklyMethodDecisionAccordion'
import { CalibrationCheckpointCard } from './CalibrationCheckpointCard'
import { EvidenceCoachRecommendationCard } from './EvidenceCoachRecommendationCard'
import { ProgramTruthSummary } from './ProgramTruthSummary'
import { cn } from '@/lib/utils'
// [SPARTANLAB-P2] Override planner
import {
  planMethodOverride,
  saveMethodOverridePreview,
  getMethodOverridePreviews,
  clearMethodOverridePreview,
  type RequestedMethodOverridePlan,
  type MethodOverridePreview,
} from '@/lib/program/requested-method-override-planner'

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
  /** Calibration input for CalibrationCheckpointCard (optional) */
  calibrationInput?: ProgramCalibrationInput | null
  /** Evidence coach recommendation bundle (optional) */
  coachRecommendationBundle?: EvidenceCoachRecommendationBundle | null
  /** Current week number */
  currentWeekNumber: number
  /** [P2F-3] Truth explanation for Plan Logic sheet (from resolvedTruthExplanation) */
  truthExplanation?: Parameters<typeof ProgramTruthSummary>[0]['truthExplanation'] | null
  /** [P2F-3] Rule population ledger for Plan Logic sheet */
  rulePopulationLedger?: Parameters<typeof ProgramTruthSummary>[0]['rulePopulationLedger'] | null
  /** [P2F-3] Goal family balance audit for Plan Logic sheet */
  goalFamilyBalanceAudit?: Parameters<typeof ProgramTruthSummary>[0]['goalFamilyBalanceAudit'] | null
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
  
  // [P2D] Detect week phase for explanation
  const isAcclimationWeek = currentWeekNumber === 1
  const totalSkills = selectedSkillRepresentations.length
  const trainedThisWeek = primaryCount + directCount + supportCount

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
          {isAcclimationWeek && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Acclimation
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
            Your Selected Skills ({totalSkills})
          </span>
          <div className="flex gap-2 text-[10px]">
            {trainedThisWeek > 0 && (
              <span className="text-emerald-400">{trainedThisWeek} active</span>
            )}
            {deferredCount > 0 && (
              <span className="text-amber-400">{deferredCount} deferred</span>
            )}
            {underrepCount > 0 && (
              <span className="text-[#7A7A8A]">{underrepCount} pending</span>
            )}
          </div>
        </div>

        {/* [P2D] Skill Representation Legend */}
        <div className="mb-3 p-2 rounded bg-[#0F0F12] border border-[#2A2A35]">
          <span className="text-[9px] font-medium uppercase tracking-wide text-[#5A5A6A] block mb-1.5">
            How Skills Are Categorized
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
              <span className="text-[#8A8A9A]">Primary/Direct = main focus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500/50" />
              <span className="text-[#8A8A9A]">Support = pattern carryover</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500/50" />
              <span className="text-[#8A8A9A]">Deferred = rotates later</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#5A5A6A]" />
              <span className="text-[#8A8A9A]">Pending = needs rotation</span>
            </div>
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

      {/* [P2D] Underrepresentation Explanation - only when relevant */}
      {(deferredCount > 0 || underrepCount > 0) && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-amber-400/70" />
            <span className="text-xs font-medium text-amber-400/90">
              Why Some Skills Are Deferred or Pending
            </span>
          </div>
          <div className="space-y-2 text-[11px] text-[#9A9A9A] leading-relaxed">
            {isAcclimationWeek && (
              <p>
                <span className="text-amber-400/80">Week 1 (Acclimation)</span> intentionally limits volume to protect connective tissue adaptation. Some skills rotate in during later weeks when your body is ready for more stress.
              </p>
            )}
            {!isAcclimationWeek && totalSkills > 5 && (
              <p>
                With {totalSkills} selected skills, the coach rotates focus to prevent overload. Not all skills can receive direct work every week while maintaining quality recovery.
              </p>
            )}
            {!isAcclimationWeek && totalSkills <= 5 && (deferredCount > 0 || underrepCount > 0) && (
              <p>
                Some skills share movement patterns (e.g., planche/front lever both stress shoulders). The coach staggers direct work to protect joint health and maximize adaptation.
              </p>
            )}
            <p className="text-[10px] text-[#6A6A7A]">
              Week {currentWeekNumber + 1}+ may rotate these skills into primary focus based on recovery and priority hierarchy.
            </p>
          </div>
        </div>
      )}

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

// Shared state colors and labels
const METHOD_STATE_COLORS: Record<RequestedMethodState, string> = {
  applied: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  materialized: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-400',
  deferred: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  suppressed: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
  not_materialized: 'border-[#3A3A4A] bg-[#2A2A35] text-[#8A8A9A]',
  not_requested: 'border-[#3A3A4A] bg-[#2A2A35] text-[#6A6A7A]',
  unknown: 'border-[#3A3A4A] bg-[#2A2A35] text-[#5A5A6A]',
}

const METHOD_STATE_LABELS: Record<RequestedMethodState, string> = {
  applied: 'Applied',
  materialized: 'Materialized',
  blocked: 'Blocked',
  deferred: 'Deferred',
  suppressed: 'Suppressed',
  not_materialized: 'Not Materialized',
  not_requested: 'Not Requested',
  unknown: 'Unknown',
}

// Safety verdict colors
const SAFETY_COLORS: Record<string, { border: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
  safe_preview: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
  needs_caution: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle },
  not_recommended: { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
  not_enough_truth: { border: 'border-[#3A3A4A]', bg: 'bg-[#2A2A35]', text: 'text-[#7A7A8A]', icon: HelpCircle },
  unsupported_now: { border: 'border-[#3A3A4A]', bg: 'bg-[#2A2A35]', text: 'text-[#6A6A7A]', icon: XCircle },
}

const SAFETY_LABELS: Record<string, string> = {
  safe_preview: 'Safe to Preview',
  needs_caution: 'Needs Caution',
  not_recommended: 'Not Recommended',
  not_enough_truth: 'Insufficient Data',
  unsupported_now: 'Not Supported',
}

// Method Detail Modal Content
function MethodDetailModalContent({
  item,
  plan,
  preview,
  onCreatePreview,
  onClearPreview,
  onDismiss,
}: {
  item: RequestedMethodDisplayItem
  plan: RequestedMethodOverridePlan
  preview: MethodOverridePreview | null
  onCreatePreview: () => void
  onClearPreview: () => void
  onDismiss: () => void
}) {
  const safetyStyle = SAFETY_COLORS[plan.safety] || SAFETY_COLORS.not_enough_truth
  const SafetyIcon = safetyStyle.icon
  
  const isAlreadyApplied = item.state === 'applied' || item.state === 'materialized'
  const canCreatePreview = plan.canPreview && !isAlreadyApplied && !preview
  
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* [P2C] Scrollable content area with bottom padding for sticky footer */}
      <div className="flex-1 overflow-y-auto pb-24 space-y-4">
      {/* Status & Safety Header */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'px-2 py-0.5 text-[9px] font-medium rounded border',
              METHOD_STATE_COLORS[item.state],
            )}>
              {METHOD_STATE_LABELS[item.state]}
            </span>
            <span className={cn(
              'px-2 py-0.5 text-[9px] font-medium rounded border flex items-center gap-1',
              safetyStyle.border, safetyStyle.bg, safetyStyle.text,
            )}>
              <SafetyIcon className="w-3 h-3" />
              {SAFETY_LABELS[plan.safety]}
            </span>
          </div>
          <p className="text-sm font-medium text-[#E6E9EF]">{plan.headline}</p>
          <p className="text-[10px] text-[#7A7A8A] mt-1">
            Source: {plan.source}
          </p>
        </div>
      </div>

      {/* Current Reason */}
      <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
          Why Coach Held This Back
        </span>
        <p className="text-xs text-[#9A9AAA] leading-relaxed">
          {plan.reason}
        </p>
      </div>

      {/* Suggested Insertion (if available) */}
      {plan.suggestedInsertion && (
        <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
            Best Safe Insertion Point
          </span>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {plan.suggestedInsertion.sessionTitle}
            </span>
            <ArrowRight className="w-3 h-3 text-[#5A5A6A]" />
            <span className="text-[10px] text-[#8A8A9A]">
              {plan.suggestedInsertion.position.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-[#9A9AAA] leading-relaxed">
            {plan.suggestedInsertion.summary}
          </p>
        </div>
      )}

      {/* Placement Notes */}
      {plan.placementNotes.length > 0 && (
        <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
            Placement Guidelines
          </span>
          <ul className="space-y-1">
            {plan.placementNotes.map((note, i) => (
              <li key={i} className="text-[10px] text-[#8A8A9A] flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dosage Guardrails */}
      {plan.dosageGuardrails.length > 0 && (
        <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
            Dosage Guardrails
          </span>
          <ul className="space-y-1">
            {plan.dosageGuardrails.map((guard, i) => (
              <li key={i} className="text-[10px] text-[#8A8A9A] flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{guard}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Notes */}
      {plan.riskNotes.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <span className="text-[10px] font-medium uppercase tracking-wide text-amber-400 block mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Risk Notes
          </span>
          <ul className="space-y-1">
            {plan.riskNotes.map((risk, i) => (
              <li key={i} className="text-[10px] text-amber-300/80 flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Avoids */}
      {plan.avoids.length > 0 && (
        <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
            Coach Avoids
          </span>
          <ul className="space-y-1">
            {plan.avoids.map((avoid, i) => (
              <li key={i} className="text-[10px] text-[#7A7A8A] flex items-start gap-2">
                <XCircle className="w-3 h-3 text-red-400/60 mt-0.5 shrink-0" />
                <span>{avoid}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Proof / Missing Truth */}
      <div className="p-3 rounded-lg bg-[#1A1A22]/50 border border-[#2A2A35]/50">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#5A5A6A] block mb-2">
          Truth Sources Used
        </span>
        <div className="flex flex-wrap gap-2 mb-2">
          {plan.proof.usedProgramTruth && (
            <span className="px-2 py-0.5 text-[9px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Program
            </span>
          )}
          {plan.proof.usedSessionTruth && (
            <span className="px-2 py-0.5 text-[9px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sessions
            </span>
          )}
          {plan.proof.usedMethodTruth && (
            <span className="px-2 py-0.5 text-[9px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Method Decision
            </span>
          )}
          {plan.proof.usedExercisePatternTruth && (
            <span className="px-2 py-0.5 text-[9px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Exercise Patterns
            </span>
          )}
        </div>
        {plan.proof.missingTruth.length > 0 && (
          <div className="mt-2">
            <span className="text-[9px] text-[#5A5A6A]">Missing: </span>
            <span className="text-[9px] text-amber-400/70">
              {plan.proof.missingTruth.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Preview Card (if exists) */}
      {preview && (
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Override Preview Created</span>
          </div>
          <p className="text-[10px] text-[#9A9AAA] mb-2">{preview.planSummary}</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Preview only — not applied to saved program
            </span>
          </div>
          <p className="text-[9px] text-[#5A5A6A] mt-2">
            Created: {new Date(preview.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
      </div>

      {/* [P2C] Sticky footer for action buttons — mobile-safe with safe-area inset */}
      <div className="sticky bottom-0 z-10 border-t border-[#2A2A35] bg-[#0F0F12]/95 backdrop-blur-sm px-1 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
        {isAlreadyApplied ? (
          <div className="flex-1 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-xs text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Already included — no override needed
            </span>
          </div>
        ) : preview ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearPreview}
              className="flex-1 h-10 text-[#9A9AAA] border-[#3A3A4A] hover:bg-[#2A2A35]"
            >
              Clear Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex-1 h-10 text-[#5A5A6A] border-[#2A2A35] cursor-not-allowed"
            >
              Apply (Coming Next)
            </Button>
          </>
        ) : canCreatePreview ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="flex-1 h-10 text-[#9A9AAA] border-[#3A3A4A] hover:bg-[#2A2A35]"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={onCreatePreview}
              className="flex-1 h-10 bg-[#E63946] hover:bg-[#E63946]/90 text-white"
            >
              <Eye className="w-4 h-4 mr-1" />
              Create Override Preview
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="flex-1 h-10 text-[#9A9AAA] border-[#3A3A4A] hover:bg-[#2A2A35]"
            >
              Dismiss
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex-1 h-10 text-[#5A5A6A] border-[#2A2A35] cursor-not-allowed"
            >
              {plan.safety === 'not_enough_truth' ? 'Insufficient Data' : 'Not Available'}
            </Button>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

function RequestedMethodsSheetContent({
  program,
}: {
  program: AdaptiveProgram
}) {
  const methodItems = extractRequestedMethodDecisions(program)
  const [selectedItem, setSelectedItem] = useState<RequestedMethodDisplayItem | null>(null)
  const [currentPlan, setCurrentPlan] = useState<RequestedMethodOverridePlan | null>(null)
  const [previews, setPreviews] = useState<MethodOverridePreview[]>([])
  
  // Load previews from storage on mount
  useEffect(() => {
    setPreviews(getMethodOverridePreviews())
  }, [])

  // Group by state
  const applied = methodItems.filter(m => m.state === 'applied' || m.state === 'materialized')
  const blocked = methodItems.filter(m => m.state === 'blocked')
  const deferred = methodItems.filter(m => m.state === 'deferred')
  const suppressed = methodItems.filter(m => m.state === 'suppressed')
  const notMaterialized = methodItems.filter(m => m.state === 'not_materialized')
  const notRequested = methodItems.filter(m => m.state === 'not_requested')
  const unknown = methodItems.filter(m => m.state === 'unknown')

  const handleItemClick = (item: RequestedMethodDisplayItem) => {
    setSelectedItem(item)
    const plan = planMethodOverride({ methodItem: item, program })
    setCurrentPlan(plan)
  }
  
  const handleCreatePreview = () => {
    if (!currentPlan) return
    const preview = saveMethodOverridePreview(currentPlan)
    setPreviews(getMethodOverridePreviews())
    // Stay on the detail view to show the preview
  }
  
  const handleClearPreview = () => {
    if (!selectedItem) return
    clearMethodOverridePreview(selectedItem.methodKey)
    setPreviews(getMethodOverridePreviews())
  }
  
  const handleDismiss = () => {
    setSelectedItem(null)
    setCurrentPlan(null)
  }
  
  const getCurrentPreview = (methodKey: string) => {
    return previews.find(p => p.methodKey === methodKey) || null
  }

  const renderGroup = (items: RequestedMethodDisplayItem[], title: string) => {
    if (items.length === 0) return null
    return (
      <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
          {title} ({items.length})
        </span>
        <ul className="space-y-2">
          {items.map((item) => {
            const hasPreview = !!getCurrentPreview(item.methodKey)
            const isApplied = item.state === 'applied' || item.state === 'materialized'
            
            // [P2B] Compute action hint based on state
            let actionHint = 'Tap for override plan'
            if (isApplied) {
              actionHint = 'Already included'
            } else if (hasPreview) {
              actionHint = 'View preview'
            } else if (item.confidence === 'low') {
              actionHint = 'Needs more truth'
            }
            
            return (
              <li 
                key={item.methodKey} 
                className={cn(
                  'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all',
                  'hover:bg-[#2A2A35]/50 border border-transparent',
                  hasPreview && 'border-emerald-500/20 bg-emerald-500/5',
                )}
                onClick={() => handleItemClick(item)}
              >
                <span className={cn(
                  'px-2 py-0.5 text-[9px] font-medium rounded border shrink-0 mt-0.5',
                  METHOD_STATE_COLORS[item.state],
                )}>
                  {METHOD_STATE_LABELS[item.state]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-[#E6E9EF]">{item.label}</p>
                    {hasPreview && (
                      <span className="px-1.5 py-0.5 text-[8px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Preview
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3 text-[#5A5A6A] ml-auto shrink-0" />
                  </div>
                  <p className="text-[10px] text-[#7A7A8A] leading-relaxed mt-0.5 line-clamp-2">
                    {item.reason}
                  </p>
                  {/* [P2B] Action hint — makes rows obviously actionable */}
                  <p className={cn(
                    'text-[9px] mt-1 flex items-center gap-1',
                    isApplied ? 'text-emerald-400/70' : hasPreview ? 'text-emerald-400/70' : 'text-purple-400/70'
                  )}>
                    {isApplied ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : (
                      <ArrowRight className="w-2.5 h-2.5" />
                    )}
                    {actionHint}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const hasAnyData = methodItems.length > 0

  // If an item is selected, show the detail view
  if (selectedItem && currentPlan) {
    return (
      <div className="flex flex-col h-[calc(100dvh-120px)] min-h-0">
        {/* [P2C] Fixed header area */}
        <div className="shrink-0 space-y-2 pb-3 border-b border-[#2A2A35]/50 mb-3">
          {/* Back Button */}
          <button
            onClick={handleDismiss}
            className="flex items-center gap-2 text-xs text-[#7A7A8A] hover:text-[#E6E9EF] transition-colors"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            Back to all methods
          </button>
          
          {/* Method Label */}
          <h3 className="text-lg font-semibold text-[#E6E9EF]">{selectedItem.label}</h3>
        </div>
        
        {/* [P2C] Flex container for detail content with sticky footer */}
        <MethodDetailModalContent
          item={selectedItem}
          plan={currentPlan}
          preview={getCurrentPreview(selectedItem.methodKey)}
          onCreatePreview={handleCreatePreview}
          onClearPreview={handleClearPreview}
          onDismiss={handleDismiss}
        />
      </div>
    )
  }

  // [P2B] Detect truth sources
  const hasProgramTruth = !!program
  const hasMethodRepTruth = !!(program?.weeklyMethodRepresentation?.byMethod?.length)
  const hasMethodDecisionTruth = !!(program?.weeklyMethodRepresentation)

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* [P2B] Intro Panel — always visible, proves planner is deployed */}
      <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium text-purple-300">Method Override Planner</span>
        </div>
        <p className="text-[10px] text-[#9A9AAA] mb-3">
          Preview-only. This explains requested or deferred methods and can create a safe override preview without changing your saved program.
        </p>
        {/* Status chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className={cn(
            'px-2 py-0.5 text-[9px] rounded border',
            hasProgramTruth 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-[#2A2A35] text-[#6A6A7A] border-[#3A3A4A]'
          )}>
            {hasProgramTruth ? 'Program truth detected' : 'No program truth'}
          </span>
          <span className={cn(
            'px-2 py-0.5 text-[9px] rounded border',
            hasMethodDecisionTruth 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-[#2A2A35] text-[#6A6A7A] border-[#3A3A4A]'
          )}>
            {hasMethodDecisionTruth ? 'Method decisions detected' : 'No method decisions'}
          </span>
          <span className="px-2 py-0.5 text-[9px] rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Override preview only
          </span>
          <span className="px-2 py-0.5 text-[9px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Saved program unchanged
          </span>
        </div>
        {/* [P2B] Smoke-test marker */}
        <p className="text-[8px] text-[#4A4A5A] mt-2">
          Planner display corridor: active
        </p>
      </div>

      {/* Active Previews Banner */}
      {previews.length > 0 && (
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              {previews.length} Override Preview{previews.length > 1 ? 's' : ''} Active
            </span>
          </div>
          <p className="text-[10px] text-[#8A8A9A]">
            Preview{previews.length > 1 ? 's are' : ' is'} not applied to your saved program. 
            Tap a method to view or clear the preview.
          </p>
        </div>
      )}

      {/* [P2B] Improved empty state with diagnostic */}
      {!hasAnyData && (
        <div className="p-4 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
          <div className="text-center mb-4">
            <HelpCircle className="w-8 h-8 text-[#5A5A6A] mx-auto mb-2" />
            <p className="text-xs font-medium text-[#9A9AAA]">
              No requested/deferred methods found in current final truth
            </p>
            <p className="text-[10px] text-[#6A6A7A] mt-1">
              The override planner is wired, but this program did not expose blocked, deferred, suppressed, or not-materialized method requests to plan from.
            </p>
          </div>
          
          {/* Truth source diagnostics */}
          <div className="p-2 rounded bg-[#0F0F12] border border-[#2A2A35] mb-3">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#5A5A6A] block mb-2">
              Sources Checked
            </span>
            <ul className="space-y-1 text-[9px] text-[#6A6A7A]">
              <li className="flex items-center gap-2">
                {hasMethodRepTruth ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-[#5A5A6A]" />
                )}
                weeklyMethodRepresentation
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-3 h-3 text-[#5A5A6A]" />
                weeklyMethodDecisionSummary (not exposed)
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-3 h-3 text-[#5A5A6A]" />
                weeklyMethodMaterializationPlan (not exposed)
              </li>
            </ul>
          </div>
          
          {/* Status indicators */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2 py-0.5 text-[9px] rounded bg-[#2A2A35] text-[#6A6A7A] border border-[#3A3A4A]">
              Saved program mutation: disabled
            </span>
            <span className="px-2 py-0.5 text-[9px] rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Preview planner: available once truth exists
            </span>
          </div>
          
          {/* [P2B] Diagnostic example row — clearly labeled as example only */}
          <div className="p-2 rounded bg-[#0F0F12]/50 border border-dashed border-[#3A3A4A]">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-3 h-3 text-[#5A5A6A]" />
              <span className="text-[9px] text-[#5A5A6A] font-medium">
                Example only — not from your program
              </span>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-lg bg-[#1A1A22]/50 border border-[#2A2A35] opacity-60">
              <span className="px-2 py-0.5 text-[9px] font-medium rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                Deferred
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-[#8A8A9A]">Circuits</p>
                  <span className="px-1.5 py-0.5 text-[8px] rounded bg-[#2A2A35] text-[#5A5A6A] border border-[#3A3A4A]">
                    Diagnostic
                  </span>
                  <ChevronRight className="w-3 h-3 text-[#4A4A5A] ml-auto shrink-0" />
                </div>
                <p className="text-[10px] text-[#5A5A6A] leading-relaxed mt-0.5">
                  This shows what the UI will look like when real method truth exists.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tap hint */}
      {hasAnyData && (
        <p className="text-[10px] text-[#7A7A8A] flex items-center gap-1">
          <Info className="w-3 h-3" />
          Tap a method to view override planning details
        </p>
      )}

      {renderGroup(applied, 'Applied / Materialized')}
      {renderGroup(blocked, 'Blocked')}
      {renderGroup(deferred, 'Deferred')}
      {renderGroup(suppressed, 'Suppressed')}
      {renderGroup(notMaterialized, 'Not Materialized')}
      {renderGroup(notRequested, 'Not Requested (Profile)')}
      {renderGroup(unknown, 'Unknown Status')}
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
  truthExplanation,
  rulePopulationLedger,
  goalFamilyBalanceAudit,
}: ProgramCoachIntelligenceHubProps) {
  // Sheet open states
  const [skillPhaseOpen, setSkillPhaseOpen] = useState(false)
  const [methodDecisionsOpen, setMethodDecisionsOpen] = useState(false)
  const [calibrationOpen, setCalibrationOpen] = useState(false)
  const [coachRecsOpen, setCoachRecsOpen] = useState(false)
  const [requestedMethodsOpen, setRequestedMethodsOpen] = useState(false)
  const [planLogicOpen, setPlanLogicOpen] = useState(false)

  // Compute summary data for button badges
  const trainedSkillCount = selectedSkillRepresentations.filter(
    r => r.state === 'headline_priority' || r.state === 'direct' || r.state === 'support'
  ).length
  const skillSummary = trainedSkillCount > 0 
    ? `${trainedSkillCount} trained` 
    : `${selectedSkillRepresentations.length} selected`

  const methodItems = extractRequestedMethodDecisions(program)
  // [P2B] Broaden badge count to include useful planner rows
  const attentionMethodCount = methodItems.filter(
    m => ['blocked', 'deferred', 'suppressed', 'not_materialized', 'unknown'].includes(m.state)
  ).length
  const appliedMethodCount = methodItems.filter(
    m => ['applied', 'materialized'].includes(m.state)
  ).length
  const reviewableMethodCount = methodItems.filter(m => m.state !== 'not_requested').length
  
  // [P2B] Check for active previews
  const [activePreviews, setActivePreviews] = useState<MethodOverridePreview[]>([])
  useEffect(() => {
    setActivePreviews(getMethodOverridePreviews())
  }, [requestedMethodsOpen])
  const hasActivePreviews = activePreviews.length > 0
  
  // Compute button summary for Method Planner
  let methodPlannerSummary = 'Preview'
  let methodPlannerBadge: string | undefined
  let methodPlannerBadgeVariant: 'warning' | 'success' | 'secondary' = 'secondary'
  
  if (hasActivePreviews) {
    methodPlannerSummary = 'Preview Active'
    methodPlannerBadge = `${activePreviews.length}`
    methodPlannerBadgeVariant = 'success'
  } else if (attentionMethodCount > 0) {
    methodPlannerSummary = 'Review'
    methodPlannerBadge = `${attentionMethodCount}`
    methodPlannerBadgeVariant = 'warning'
  } else if (appliedMethodCount > 0) {
    methodPlannerSummary = 'Included'
  }

  // [P2F-3] Fixed: check that bundle exists AND primary is not null/undefined
  const hasCoachRecs = Boolean(coachRecommendationBundle?.primary)

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

          {/* [P2B] Method Planner — clearer entry point, always visible */}
          <HubButton
            icon={<Eye className="w-3.5 h-3.5 text-purple-400" />}
            label="Method Planner"
            summary={methodPlannerSummary}
            badge={methodPlannerBadge}
            badgeVariant={methodPlannerBadgeVariant}
            onClick={() => setRequestedMethodsOpen(true)}
          />

          {/* [P2F-3] Plan Logic — surfaces ProgramTruthSummary content */}
          <HubButton
            icon={<Info className="w-3.5 h-3.5 text-cyan-400" />}
            label="Plan Logic"
            summary="View"
            onClick={() => setPlanLogicOpen(true)}
            disabled={!truthExplanation}
          />
        </div>
        {/* [P2B] Compact helper line */}
        <p className="text-[9px] text-[#5A5A6A] mt-2 px-1">
          Review method decisions, plan logic, and coach recommendations.
        </p>
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
              Baseline tests and performance calibration
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)] space-y-4">
            {/* [P2D] Calibration Lifecycle Explanation */}
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400/70" />
                <span className="text-xs font-medium text-blue-400/90">
                  How Calibration Works
                </span>
              </div>
              <div className="space-y-2 text-[10px] text-[#9A9A9A] leading-relaxed">
                <p>
                  <span className="text-blue-400/80">Baseline tests</span> establish initial anchors for your strength and skill levels. These help the coach set appropriate starting intensities.
                </p>
                <p>
                  <span className="text-emerald-400/80">As you log workouts</span>, your actual performance becomes the primary calibration source. Logged sets are more authoritative than baseline tests over time.
                </p>
                <p>
                  <span className="text-amber-400/80">After breaks</span>, current ability may differ from historical peaks. The coach uses recent data when available, or recommends recalibration if evidence is stale.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-2 py-0.5 text-[9px] rounded bg-[#2A2A35] text-[#6A6A7A] border border-[#3A3A4A]">
                  Baseline tests: initial anchors
                </span>
                <span className="px-2 py-0.5 text-[9px] rounded bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20">
                  Logged workouts: primary truth
                </span>
              </div>
            </div>
            
            {calibrationInput ? (
              <CalibrationCheckpointCard input={calibrationInput} />
            ) : (
              <div className="p-4 rounded-lg bg-[#1A1A22] border border-[#2A2A35] text-center">
                <HelpCircle className="w-8 h-8 text-[#5A5A6A] mx-auto mb-2" />
                <p className="text-xs text-[#8A8A9A]">
                  Calibration data not available for this program.
                </p>
                <p className="text-[10px] text-[#6A6A7A] mt-1">
                  This may happen if the program was created before calibration was enabled.
                </p>
              </div>
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
            {coachRecommendationBundle?.primary ? (
              <EvidenceCoachRecommendationCard bundle={coachRecommendationBundle} />
            ) : (
              /* [P2F-3] Clean empty state when no coach recommendations exist */
              <div className="rounded-xl border border-[#2A2A35] bg-[#1A1A1F] p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2A35]">
                  <Sparkles className="h-6 w-6 text-[#7A7A8A]" />
                </div>
                <h3 className="text-base font-medium text-[#E6E9EF] mb-2">
                  No coach recommendations yet
                </h3>
                <p className="text-sm text-[#7A7A8A] leading-relaxed">
                  Coach recommendations appear after logged workouts, calibration results, or enough performance evidence.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* [P2B] Method Override Planner Sheet — clearly labeled entry point */}
      <Sheet open={requestedMethodsOpen} onOpenChange={setRequestedMethodsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Method Override Planner
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              Preview-only. Create safe override previews without changing your saved program.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <RequestedMethodsSheetContent program={program} />
          </div>
        </SheetContent>
      </Sheet>

      {/* [P2F-3] Plan Logic Sheet — surfaces ProgramTruthSummary content */}
      <Sheet open={planLogicOpen} onOpenChange={setPlanLogicOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Plan Logic
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              How your program was constructed and why
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            {truthExplanation ? (
              <ProgramTruthSummary
                truthExplanation={truthExplanation}
                rulePopulationLedger={rulePopulationLedger ?? null}
                goalFamilyBalanceAudit={goalFamilyBalanceAudit ?? null}
              />
            ) : (
              /* Empty state when no truth explanation exists */
              <div className="rounded-xl border border-[#2A2A35] bg-[#1A1A1F] p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2A35]">
                  <Info className="h-6 w-6 text-[#7A7A8A]" />
                </div>
                <h3 className="text-base font-medium text-[#E6E9EF] mb-2">
                  Plan logic unavailable
                </h3>
                <p className="text-sm text-[#7A7A8A] leading-relaxed">
                  This program was generated before plan logic tracking was added.
                  Regenerate your program to see detailed construction logic.
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
