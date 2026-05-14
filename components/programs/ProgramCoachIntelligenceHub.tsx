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

import { useState, useEffect, useCallback } from 'react'
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
  Loader2,
  Trash2,
  RefreshCw,
  Activity,
  Shield,
} from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import type { SelectedSkillRepresentationDisplay } from '@/lib/program/selected-skill-representation-guidance'
import type { ProgramIntelligenceContract } from '@/lib/program/program-display-contract'
import type { ProgramCalibrationInput } from '@/lib/program/program-calibration-recommendation'
import type { EvidenceCoachRecommendationBundle } from '@/lib/program/evidence-derived-coach-recommendations'
// [MASTER-3/4.1] Import adaptive foundation model builder for fallback resolution
import {
  buildAdaptiveFoundationModel,
  type AdaptiveFoundationModel,
} from '@/lib/program/adaptive-foundation-model'
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
  isCircuitLikePreviewMethodKey,
  isGroupedBlockPreviewMethodKey,
  getMethodOverrideCapability,
  normalizeOverrideMethodKey,
  applyMethodOverridePreviewToProgram,
  hasMethodOverrideAppliedGroup,
  collectMethodOverrideArtifacts,
  type RequestedMethodOverridePlan,
  type MethodOverridePreview,
  type MethodOverrideApplyResult,
  type MethodOverrideRevertResult,
  type MethodOverrideResetAllResult,
  type MethodOverrideCapability,
  type MethodOverrideSeverityLevel,
  type MethodOverrideSeverityAssessment,
  type MethodOverrideArtifact,
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

// =============================================================================
// [IQ6.1 / AB16.0-B] BEST-REASON RESOLVER FOR METHOD DISPLAY
// =============================================================================

/**
 * Resolves the best human-readable reason for a method's current state.
 * Prioritizes richer sources and falls back to honest state-based explanations
 * rather than generic "not yet available" text.
 */
function resolveBestMethodDisplayReason(
  state: RequestedMethodState,
  rawReason: string | undefined | null,
  methodLabel: string,
): string {
  // If we have a real reason that isn't the old generic fallback, use it
  if (rawReason &&
      rawReason.trim().length > 10 &&
      !rawReason.includes('not yet available from final method truth')) {
    return rawReason
  }

  // State-based honest fallbacks that explain what happened without lying
  switch (state) {
    case 'materialized':
    case 'applied':
      return `${methodLabel} was applied because this week's exercise composition and session roles supported it without compromising primary skill quality.`
    case 'blocked':
      return `${methodLabel} was held back because this week's skill priorities or session roles made it a poor fit — quality would have suffered.`
    case 'deferred':
      return `${methodLabel} was deferred so it can rotate in when recovery, session role, or exercise mix fits better in a future week.`
    case 'suppressed':
      return `${methodLabel} was suppressed to preserve workout quality — the session already had enough training stress from other methods or volume.`
    case 'not_materialized':
      return `${methodLabel} is tracked but no safe materialization path was found this week — either the exercise mix didn't support it or the runtime writer isn't connected yet.`
    case 'not_requested':
      return `${methodLabel} was not requested for this profile or wasn't needed given your current training priorities.`
    default:
      return `${methodLabel} status is tracked but the specific reason was not captured during generation.`
  }
}

/**
 * Safe selector that extracts requested/deferred method truth from the program.
 * Inspects available fields without throwing if absent.
 * [AB20.4] Now canonicalizes method keys to prevent duplicate rows.
 */
function extractRequestedMethodDecisions(
  program: AdaptiveProgram | null | undefined,
): RequestedMethodDisplayItem[] {
  if (!program) return []

  const items: RequestedMethodDisplayItem[] = []
  // [AB20.4] Use canonical key for deduplication to prevent duplicate rows
  const seenCanonical = new Set<string>()
  
  // [AB20.4] Track best item per canonical key for merging duplicates
  const bestByCanonical = new Map<string, RequestedMethodDisplayItem>()

  // Method labels for display
  const METHOD_LABELS: Record<string, string> = {
    superset: 'Supersets',
    circuit: 'Circuits',
    circuits: 'Circuits',
    density_block: 'Density Blocks',
    density: 'Density Blocks',
    cluster: 'Cluster Sets',
    cluster_sets: 'Cluster Sets',
    top_set_backoff: 'Top Set + Backoff',
    top_set: 'Top Set + Backoff',
    drop_set: 'Drop Sets',
    drop_sets: 'Drop Sets',
    rest_pause: 'Rest-Pause',
    rest_pause_sets: 'Rest-Pause',
    endurance_density: 'Endurance/Conditioning',
    endurance: 'Endurance/Conditioning',
    conditioning: 'Endurance/Conditioning',
    finisher: 'Finishers',
  }
  
  // [AB20.4] State priority for merging duplicates (higher = stronger)
  const STATE_PRIORITY: Record<RequestedMethodState, number> = {
    applied: 6,
    materialized: 5,
    blocked: 4,
    not_materialized: 3,
    deferred: 2,
    suppressed: 1,
    not_requested: 0,
    unknown: -1,
  }

  // [AB20.4] Helper to add/merge item using canonical key
  const addOrMergeItem = (item: RequestedMethodDisplayItem) => {
    const canonicalKey = normalizeOverrideMethodKey(item.methodKey)
    
    // Get the canonical display label
    const capability = getMethodOverrideCapability(item.methodKey)
    const canonicalLabel = capability.displayLabel !== 'Unknown Method' 
      ? capability.displayLabel 
      : METHOD_LABELS[item.methodKey] ?? item.methodKey.replace(/_/g, ' ')
    
    // Normalize the item to use canonical key and label
    const normalizedItem: RequestedMethodDisplayItem = {
      ...item,
      methodKey: canonicalKey,
      label: canonicalLabel,
    }
    
    if (!seenCanonical.has(canonicalKey)) {
      seenCanonical.add(canonicalKey)
      bestByCanonical.set(canonicalKey, normalizedItem)
    } else {
      // Merge: keep the item with the strongest state
      const existing = bestByCanonical.get(canonicalKey)!
      const existingPriority = STATE_PRIORITY[existing.state] ?? -1
      const newPriority = STATE_PRIORITY[normalizedItem.state] ?? -1
      
      if (newPriority > existingPriority) {
        bestByCanonical.set(canonicalKey, normalizedItem)
      } else if (newPriority === existingPriority && normalizedItem.confidence === 'high' && existing.confidence !== 'high') {
        // Same state but higher confidence - prefer the higher confidence item
        bestByCanonical.set(canonicalKey, normalizedItem)
      }
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

      const methodLabel = METHOD_LABELS[methodId] ?? methodId.replace(/_/g, ' ')
      addOrMergeItem({
        methodKey: methodId,
        label: methodLabel,
        state,
        source: 'weeklyMethodRepresentation',
        reason: resolveBestMethodDisplayReason(state, entry.reason, methodLabel),
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
      if (!d.methodId) continue
      // [AB20.4] Remove raw seen check - addOrMergeItem handles deduplication

      let state: RequestedMethodState = 'unknown'
      if (d.applied) state = 'applied'
      else if (d.blocked) state = 'blocked'
      else if (d.deferred) state = 'deferred'
      else state = 'not_materialized'

      const methodLabel = METHOD_LABELS[d.methodId] ?? d.methodId.replace(/_/g, ' ')
      addOrMergeItem({
        methodKey: d.methodId,
        label: methodLabel,
        state,
        source: 'weeklyMethodDecisionSummary',
        reason: resolveBestMethodDisplayReason(state, d.reason, methodLabel),
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
      if (!slot.methodId) continue
      // [AB20.4] Remove raw seen check - addOrMergeItem handles deduplication

      let state: RequestedMethodState = 'unknown'
      const status = slot.status?.toLowerCase() ?? ''
      if (status.includes('applied') || status.includes('material')) state = 'materialized'
      else if (status.includes('block')) state = 'blocked'
      else if (status.includes('defer')) state = 'deferred'
      else if (status.includes('suppress')) state = 'suppressed'

      const methodLabel = METHOD_LABELS[slot.methodId] ?? slot.methodId.replace(/_/g, ' ')
      addOrMergeItem({
        methodKey: slot.methodId,
        label: methodLabel,
        state,
        source: 'weeklyMethodMaterializationPlan',
        reason: resolveBestMethodDisplayReason(state, slot.blockedReason, methodLabel),
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
      // [AB20.4] Remove raw seen check - addOrMergeItem handles deduplication
      addOrMergeItem({
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
      addOrMergeItem({
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
      addOrMergeItem({
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

  // [AB20.4.4.4] CRITICAL: Cross-check against actual saved artifacts
  // This prevents "summary says applied" while "reset finds nothing"
  const artifacts = collectMethodOverrideArtifacts(program)
  const artifactsByCanonical = new Map<string, MethodOverrideArtifact[]>()
  for (const artifact of artifacts) {
    const key = artifact.canonicalKey
    if (!artifactsByCanonical.has(key)) artifactsByCanonical.set(key, [])
    artifactsByCanonical.get(key)!.push(artifact)
  }
  
  // Validate and potentially downgrade items that claim applied/materialized
  const finalItems = Array.from(bestByCanonical.values()).map(item => {
    // Only validate applied/materialized states
    if (item.state !== 'applied' && item.state !== 'materialized') {
      return item
    }
    
    const canonicalKey = normalizeOverrideMethodKey(item.methodKey)
    const matchingArtifacts = artifactsByCanonical.get(canonicalKey) || []
    
    // Check if any artifact actually exists and is renderable
    const hasRenderableArtifact = matchingArtifacts.some(a => a.isRenderable)
    
    if (hasRenderableArtifact) {
      // Artifact exists and is renderable - keep the state
      // But upgrade confidence since we verified against actual artifacts
      return {
        ...item,
        confidence: 'high' as const,
        reason: item.reason || `${item.label} is applied to the program with verifiable render artifact.`,
      }
    }
    
    // No renderable artifact found - downgrade to not_materialized
    // This is the fix for "applied in summary but reset finds nothing"
    return {
      ...item,
      state: 'not_materialized' as RequestedMethodState,
      confidence: 'low' as const,
      reason: `${item.label} was tracked as applied but no verifiable render artifact was found. The method may need to be re-applied.`,
    }
  })
  
  return finalItems
}

// =============================================================================
// PROPS
// =============================================================================

// =============================================================================
// [AB20 / IQ10] APPLY ELIGIBILITY CLASSIFICATION
// =============================================================================

/**
 * [AB20 / IQ10] Apply eligibility status for method override previews.
 * Determines whether Apply button should be enabled and what message to show.
 */
export type MethodOverrideApplyEligibility =
  | 'applyable_safe'           // Safe preview with real program patch - Apply enabled
  | 'applyable_caution_review' // [AB20] Caution preview eligible for manual review apply
  | 'applyable_force_override' // [AB20.4.4.1] Not recommended but force override available
  | 'preview_only_caution'     // Caution preview (skill hold, etc.) - Apply disabled
  | 'not_applyable_no_candidate'       // No valid candidate found - Apply disabled
  | 'not_applyable_blocked_impossible' // [AB20.4.4.1] Blocked/impossible - no force override
  | 'not_applyable_insufficient_data'  // Missing truth to generate patch - Apply disabled
  | 'not_applyable_stale_program'      // Program changed since preview - Apply disabled
  | 'not_applyable_already_materialized' // Method already in program - Apply disabled
  | 'not_applyable_unsupported_method' // Method type not supported for apply - Apply disabled

/**
 * [AB20 / IQ10] Classify apply eligibility for a method override preview.
 */
function classifyApplyEligibility(
  preview: MethodOverridePreview | null,
  isAlreadyApplied: boolean,
  _programId?: string
): { eligibility: MethodOverrideApplyEligibility; reason: string } {
  // Already materialized
  if (isAlreadyApplied) {
    return { 
      eligibility: 'not_applyable_already_materialized', 
      reason: 'Already included in your program' 
    }
  }
  
  // No preview exists
  if (!preview) {
    return { 
      eligibility: 'not_applyable_no_candidate', 
      reason: 'Create a preview first' 
    }
  }
  
  // [AB20.3] Get method capability to check apply support
  const capability = preview.methodCapability || getMethodOverrideCapability(preview.methodKey)
  
  // [AB20.3] Check if method supports apply
  if (!capability.canApplyToSavedProgramNow) {
    return {
      eligibility: 'not_applyable_unsupported_method',
      reason: capability.applyUnsupportedReason || `${capability.displayLabel} apply not available yet.`
    }
  }
  
  // [AB20.3] Grouped block methods (circuits, density blocks): check candidateStatus
  if (preview.circuitCandidate) {
    const candidate = preview.circuitCandidate
    const status = candidate.candidateStatus
    const selectedCount = candidate.selectedExercises?.length ?? 0
    
    // [AB20.3] Minimum exercises: 3 for circuits, 2 for density blocks
    const minExercises = capability.canonicalKey === 'density_block' ? 2 : 3
    
    // Safe candidate with enough exercises are applyable
    if (status === 'safe_circuit') {
      if (selectedCount >= minExercises) {
        return { 
          eligibility: 'applyable_safe', 
          reason: `Ready to apply ${capability.displayLabel} preview` 
        }
      }
      return {
        eligibility: 'not_applyable_insufficient_data',
        reason: `${capability.displayLabel} requires at least ${minExercises} exercises`
      }
    }
    
    // Caution candidate with enough exercises are applyable with manual review
    if (status === 'override_with_caution') {
      if (selectedCount >= minExercises) {
        return { 
          eligibility: 'applyable_caution_review', 
          reason: 'Manual review required before applying' 
        }
      }
      return {
        eligibility: 'not_applyable_insufficient_data',
        reason: `${capability.displayLabel} requires at least ${minExercises} exercises`
      }
    }
    
    if (status === 'would_be_superset') {
      return { 
        eligibility: 'not_applyable_no_candidate', 
        reason: 'Only 2 exercises — would be superset, not grouped block' 
      }
    }
    
    // no_candidate or missing status
    return { 
      eligibility: 'not_applyable_no_candidate', 
      reason: `No valid ${capability.displayLabel} candidate found` 
    }
  }
  
  // [AB20.4.3] Row-level methods: check targetExercises and applicationPatchPreview
  if (capability.writerKind === 'row_level_method') {
    // Check if preview-level apply is disabled
    if (preview.applyDisabledReason) {
      return {
        eligibility: 'not_applyable_no_candidate',
        reason: preview.applyDisabledReason
      }
    }
    
    // Check if we have valid targets
    const targets = preview.targetExercises || preview.applicationPatchPreview?.targetExercises
    if (!targets || targets.length === 0) {
      return {
        eligibility: 'not_applyable_no_candidate',
        reason: `No safe target found for ${capability.displayLabel}`
      }
    }
    
    const primaryTarget = targets[0]
    
    // Safe target = applyable
    if (primaryTarget.safety === 'safe') {
      return {
        eligibility: 'applyable_safe',
        reason: `Ready to apply ${capability.displayLabel} to ${primaryTarget.exerciseName}`
      }
    }
    
    // Caution target = applyable with review
    if (primaryTarget.safety === 'caution') {
      return {
        eligibility: 'applyable_caution_review',
        reason: `Review required: ${primaryTarget.cautions[0] || 'Caution target'}`
      }
    }
    
    // Blocked target
    return {
      eligibility: 'not_applyable_no_candidate',
      reason: primaryTarget.cautions[0] || 'Target blocked for this method'
    }
  }
  
  // General method preview safety check (unsupported methods)
  if (preview.safety === 'safe_preview') {
    return { 
      eligibility: 'not_applyable_unsupported_method', 
      reason: capability.applyUnsupportedReason || 'Apply coming soon' 
    }
  }
  
  if (preview.safety === 'needs_caution') {
    return { 
      eligibility: 'preview_only_caution', 
      reason: 'Caution preview — manual review needed' 
    }
  }
  
  if (preview.safety === 'not_enough_truth') {
    return { 
      eligibility: 'not_applyable_insufficient_data', 
      reason: 'Insufficient program data for apply' 
    }
  }
  
  // Default fallback
  return { 
    eligibility: 'not_applyable_unsupported_method', 
    reason: capability.applyUnsupportedReason || 'Apply not available for this method yet' 
  }
}

/**
 * [AB20 / IQ10] Get user-friendly Apply button text based on eligibility.
 */
function getApplyButtonText(eligibility: MethodOverrideApplyEligibility): string {
  switch (eligibility) {
  case 'applyable_safe':
  return 'Review & Apply' // [AB20.4.4.2] All applies now go through confirmation
  case 'applyable_caution_review':
  return 'Review & Apply'
  case 'applyable_force_override':
  return 'Review Override'
  case 'preview_only_caution':
  return 'Preview Only'
  case 'not_applyable_no_candidate':
  return 'No Safe Candidate'
  case 'not_applyable_blocked_impossible':
  return 'Blocked / Impossible'
  case 'not_applyable_insufficient_data':
  return 'Insufficient Data'
  case 'not_applyable_stale_program':
  return 'Refresh Program First'
  case 'not_applyable_already_materialized':
  return 'Already Included'
  case 'not_applyable_unsupported_method':
  return 'Apply Coming Soon'
  default:
  return 'Not Available'
  }
  }

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
  /** [AB20 / IQ10] Callback to update parent program state after successful apply */
  onProgramUpdate?: (updatedProgram: AdaptiveProgram) => void
  /** [AB20.1D] Dedicated callback for method override apply that saves via saveAdaptiveProgram */
  onApplyMethodOverridePreview?: (
    preview: MethodOverridePreview, 
    options: { allowCautionApply: boolean }
  ) => Promise<MethodOverrideApplyResult>
  /** [AB20.2] Dedicated callback for method override revert that saves via saveAdaptiveProgram */
  onRevertMethodOverride?: (methodKey: string) => Promise<MethodOverrideRevertResult>
  /** [AB20.4.2] Callback to reset all user-applied method overrides at once */
  onResetAllMethodOverrides?: () => Promise<MethodOverrideResetAllResult>
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
  // [AB20.4.4.5] User-applied manual overrides use amber, native AI uses emerald
  const METHOD_STATE_COLORS: Record<RequestedMethodState, string> = {
    applied: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
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
  // [AB20.4.4.5] Manual Method Override Planner applies use amber/orange, not green
  // Green is reserved for native AI methods only
  const SAFETY_COLORS: Record<string, { border: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
    safe_preview: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: CheckCircle2 },
    needs_caution: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: AlertTriangle },
    not_recommended: { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
    not_enough_truth: { border: 'border-[#3A3A4A]', bg: 'bg-[#2A2A35]', text: 'text-[#7A7A8A]', icon: HelpCircle },
    unsupported_now: { border: 'border-[#3A3A4A]', bg: 'bg-[#2A2A35]', text: 'text-[#6A6A7A]', icon: XCircle },
  }
  
  const SAFETY_LABELS: Record<string, string> = {
    safe_preview: 'Preview Available',
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
  program,
  onCreatePreview,
  onClearPreview,
  onDismiss,
  onApplySafe,
  onRequestCautionApply,
  isApplying,
  applyResult,
  showCautionConfirmation,
  onCancelCautionApply,
  onConfirmCautionApply,
  // [AB20.2] Revert props
  isOverrideApplied,
  onRequestRevert,
  isReverting,
  revertResult,
  showRevertConfirmation,
  onCancelRevert,
  onConfirmRevert,
}: {
  item: RequestedMethodDisplayItem
  plan: RequestedMethodOverridePlan
  preview: MethodOverridePreview | null
  program: AdaptiveProgram | null
  onCreatePreview: () => void
  onClearPreview: () => void
  onDismiss: () => void
  onApplySafe?: () => void
  onRequestCautionApply?: () => void
  isApplying?: boolean
  applyResult?: MethodOverrideApplyResult | null
  showCautionConfirmation?: boolean
  onCancelCautionApply?: () => void
  onConfirmCautionApply?: () => void
  // [AB20.2] Revert props
  isOverrideApplied?: boolean
  onRequestRevert?: () => void
  isReverting?: boolean
  revertResult?: MethodOverrideRevertResult | null
  showRevertConfirmation?: boolean
  onCancelRevert?: () => void
  onConfirmRevert?: () => void
}) {
  // [AB17.2.2] Circuit-specific safety override
  // If circuit preview exists but is not a safe candidate, override the safety display
  // [AB17.2.2.3] Use shared helper for consistent circuit-like method detection
  // [AB20.3] Get method capability for method-specific labels
  const capability = getMethodOverrideCapability(plan.methodKey)
  const isDensityMethod = capability.canonicalKey === 'density_block'
  
  const isCircuitMethod = isCircuitLikePreviewMethodKey(plan.methodKey)
  const circuitCandidate = preview?.circuitCandidate
  const isUnsafeCircuit = isCircuitMethod && circuitCandidate && !circuitCandidate.isSafeCircuitCandidate
  
  // [AB20.3] Method-specific labels
  const blockTypeName = isDensityMethod ? 'Density Block' : 'Circuit'
  const exerciseLabelSafe = isDensityMethod ? 'Density Block Exercises' : 'Circuit Exercises'
  const exerciseLabelCaution = isDensityMethod ? 'Density Block Exercises (with caution)' : 'Circuit Exercises (with caution)'
  
  // [AB17.2.2.1] Determine effective safety for display
  // For circuits before preview: show "Scan Required" instead of "Insufficient Data"
  // For circuits after preview with safe candidate: show "Safe to Preview"
  // For circuits after preview without safe candidate: show specific reason
  let effectiveSafety = plan.safety
  let effectiveSafetyLabel = SAFETY_LABELS[plan.safety]
  
  if (isCircuitMethod) {
    if (!preview) {
      // Before preview: guide user to scan
      effectiveSafety = 'not_enough_truth'
      effectiveSafetyLabel = 'Scan Required'
    } else if (circuitCandidate?.isSafeCircuitCandidate) {
      // After preview with valid exercise candidate
      effectiveSafety = 'safe_preview'
      effectiveSafetyLabel = `Safe to Preview`
    } else if (isUnsafeCircuit) {
      // After preview without safe candidate
      effectiveSafety = 'needs_caution'
      effectiveSafetyLabel = circuitCandidate?.circuitSize === 2 ? 'Would Be Superset' : `No Safe ${blockTypeName}`
    }
  }
  
  const safetyStyle = SAFETY_COLORS[effectiveSafety] || SAFETY_COLORS.not_enough_truth
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
              {effectiveSafetyLabel}
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
      {/* [AB17.2.2] For circuits, show circuit-specific insertion info */}
      {plan.suggestedInsertion && !isCircuitMethod && (
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
      
      {/* [AB17.2.2] Circuit-specific insertion info */}
      {isCircuitMethod && (
        <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
            Circuit Insertion Analysis
          </span>
          {circuitCandidate ? (
            <>
              <div className="flex items-center gap-2 mb-2">
              {/* [AB17.2.2.6] Use candidateStatus for accurate semantic labeling */}
              {/* [AB20.4.5.3] Manual override candidates use amber/orange, not green */}
              <span className={cn(
                'px-2 py-0.5 text-[9px] font-medium rounded border',
                circuitCandidate.candidateStatus === 'safe_circuit'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : circuitCandidate.candidateStatus === 'override_with_caution'
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : circuitCandidate.candidateStatus === 'would_be_superset'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                )}>
                  {circuitCandidate.candidateStatus === 'safe_circuit'
                    ? `${circuitCandidate.circuitSize}-exercise circuit available`
                    : circuitCandidate.candidateStatus === 'override_with_caution'
                      ? `Caution preview (${circuitCandidate.circuitSize} exercises)`
                      : circuitCandidate.candidateStatus === 'would_be_superset'
                        ? 'Would be superset (2 exercises)'
                        : 'No circuit candidate'}
                </span>
              </div>
              <p className="text-xs text-[#9A9AAA] leading-relaxed mb-2">
                {circuitCandidate.dayLabel}
              </p>
              <p className="text-[10px] text-[#7A7A8A]">
                {circuitCandidate.candidateReason}
              </p>
              {circuitCandidate.selectedExercises.length > 0 && (
                <div className="mt-2 text-[10px] text-[#8A8A9A]">
                  <span className="text-[#6A6A7A]">Available: </span>
                  {circuitCandidate.selectedExercises.join(', ')}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-[#9A9AAA] leading-relaxed">
              {plan.suggestedInsertion 
                ? `${plan.suggestedInsertion.sessionTitle} — ${plan.suggestedInsertion.summary}`
                : 'Create preview to analyze circuit candidates across program days'}
            </p>
          )}
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
                    {/* [AB20.4.5.3] Manual override notes use amber bullets */}
                    <span className="text-amber-400 mt-0.5">•</span>
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
        {/* [AB20.4.5.3] Truth source badges use blue (informational), not green */}
        <div className="flex flex-wrap gap-2 mb-2">
          {plan.proof.usedProgramTruth && (
            <span className="px-2 py-0.5 text-[9px] rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Program
            </span>
          )}
          {plan.proof.usedSessionTruth && (
            <span className="px-2 py-0.5 text-[9px] rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Sessions
            </span>
          )}
          {plan.proof.usedMethodTruth && (
            <span className="px-2 py-0.5 text-[9px] rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Method Decision
            </span>
          )}
          {plan.proof.usedExercisePatternTruth && (
            <span className="px-2 py-0.5 text-[9px] rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
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

    {/* [AB16.2 / IQ6.2 / AB17.2 / AB17.2.2] Structured Preview Card with Current vs Proposed */}
    {/* [AB20.4.5.3] Manual override preview cards use amber, not green */}
    {preview && (
      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-amber-400">Override Preview Created</span>
          </div>
          
          {/* [AB20.4.4.1] Severity / Practicality Assessment Card for Row-Level Methods */}
          {preview.severityAssessment && (
            <div className="mb-4 p-2 rounded bg-[#12121A] border border-[#2A2A35]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A]">
                  Practicality / Severity
                </span>
              </div>
              
              {/* Severity Level Chip */}
              <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    'px-2 py-0.5 text-[9px] font-medium rounded border',
                    // [AB20.4.5.3] Manual override severity uses amber for recommended, not green
                    preview.severityAssessment.level === 'recommended'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : preview.severityAssessment.level === 'acceptable_with_caution'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : preview.severityAssessment.level === 'not_recommended'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : preview.severityAssessment.level === 'strongly_discouraged'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-red-600/10 text-red-500 border-red-600/20'
                )}>
                  {preview.severityAssessment.label}
                </span>
              </div>
              
              {/* Summary */}
              <p className="text-[10px] text-[#9A9AAA] mb-2">
                {preview.severityAssessment.summary}
              </p>
              
              {/* Why This Rating */}
              {preview.severityAssessment.whyThisLevel.length > 0 && (
                <div className="mb-2">
                  <span className="text-[9px] uppercase tracking-wide text-[#5A5A6A] block mb-1">
                    Why this rating
                  </span>
                  <ul className="space-y-0.5">
                    {preview.severityAssessment.whyThisLevel.slice(0, 3).map((reason, idx) => (
                      <li key={idx} className="text-[9px] text-[#8A8A9A] flex items-start gap-1">
                        <span className="text-[#5A5A6A] mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Training Tradeoffs */}
              {preview.severityAssessment.trainingTradeoffs.length > 0 && (
                <div className="mb-2">
                  <span className="text-[9px] uppercase tracking-wide text-[#5A5A6A] block mb-1">
                    What this could affect
                  </span>
                  <ul className="space-y-0.5">
                    {preview.severityAssessment.trainingTradeoffs.slice(0, 2).map((tradeoff, idx) => (
                      <li key={idx} className="text-[9px] text-amber-400/70 flex items-start gap-1">
                        <span className="mt-0.5">•</span>
                        <span>{tradeoff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Target Scan Summary */}
              <div className="p-1.5 rounded bg-[#0F0F15] border border-[#1A1A25]">
                <span className="text-[9px] uppercase tracking-wide text-[#5A5A6A] block mb-1">
                  Target scan
                </span>
                <div className="text-[9px] text-[#7A7A8A] space-y-0.5">
                  <div>
                    Scanned: {preview.severityAssessment.candidateScanSummary.totalSessionsScanned} days / {preview.severityAssessment.candidateScanSummary.totalExercisesScanned} exercises
                  </div>
                  {preview.severityAssessment.candidateScanSummary.bestTargetDescription && (
                    <div className="text-[#9A9AAA]">
                      Best target: {preview.severityAssessment.candidateScanSummary.bestTargetDescription}
                    </div>
                  )}
                  {!preview.severityAssessment.candidateScanSummary.bestTargetDescription && 
                   preview.severityAssessment.candidateScanSummary.topBlockerReasons.length > 0 && (
                    <div className="text-amber-400/70">
                      Top blockers: {preview.severityAssessment.candidateScanSummary.topBlockerReasons.slice(0, 2).join(', ')}
                    </div>
                )}
                {/* [AB20.4.5.3] Manual override target counts use amber, not green */}
                <div className="flex gap-2 mt-1 text-[8px]">
                  <span className="text-amber-400/60">Safe: {preview.severityAssessment.candidateScanSummary.safeTargetsFound}</span>
                    <span className="text-amber-400/60">Caution: {preview.severityAssessment.candidateScanSummary.cautionTargetsFound}</span>
                    <span className="text-red-400/60">Blocked: {preview.severityAssessment.candidateScanSummary.blockedTargetsFound}</span>
                  </div>
                </div>
              </div>
              
              {/* Force Override Warning */}
              {preview.severityAssessment.canForceOverride && preview.severityAssessment.forceOverrideWarning && (
                <div className="mt-2 p-1.5 rounded bg-orange-500/5 border border-orange-500/20">
                  <div className="flex items-center gap-1 text-[9px] text-orange-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-medium">Force override available</span>
                  </div>
                  <p className="text-[8px] text-orange-300/70 mt-1">
                    {preview.severityAssessment.forceOverrideWarning}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* [AB17.2.2 / AB17.2.2.2] Circuit-Specific Preview Truth */}
          {preview.circuitCandidate && (
            <div className="mb-4 p-2 rounded bg-[#12121A] border border-[#2A2A35]">
              {/* [AB17.2.2.2] Circuit Status Header - uses candidateStatus for clear states */}
                  {/* [AB20.4.5.3] Manual override safe_circuit uses amber, not green */}
                  <div className="flex items-center gap-2 mb-2">
                    {preview.circuitCandidate.candidateStatus === 'safe_circuit' ? (
                      <>
                        <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {preview.circuitCandidate.statusLabel}
                        </span>
                        <span className="text-[9px] text-amber-400/60">
                      ({preview.circuitCandidate.confidence} confidence)
                    </span>
                  </>
                ) : preview.circuitCandidate.candidateStatus === 'override_with_caution' ? (
                  <>
                    <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {preview.circuitCandidate.statusLabel}
                    </span>
                    <span className="text-[9px] text-amber-400/60">
                      ({preview.circuitCandidate.circuitSize} exercises)
                    </span>
                  </>
                ) : (
                  <span className="px-2 py-0.5 text-[9px] font-medium rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {preview.circuitCandidate.statusLabel}
                  </span>
                )}
              </div>
              
              {/* Affected Day */}
              <div className="text-[10px] font-medium text-amber-400 mb-2">
                {preview.circuitCandidate.dayLabel}
              </div>
              
              {/* Grouped Block Selected Exercises */}
              {preview.circuitCandidate.selectedExercises.length > 0 && (
                <div className="mb-3">
                  <span className="text-[9px] uppercase tracking-wide text-[#5A5A6A] block mb-1">
                    {preview.circuitCandidate.candidateStatus === 'safe_circuit' 
                      ? exerciseLabelSafe 
                      : preview.circuitCandidate.candidateStatus === 'override_with_caution'
                        ? exerciseLabelCaution
                        : 'Available Exercises'}
                  </span>
                  <div className="space-y-1">
                    {preview.circuitCandidate.selectedExercises.map((exercise, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10px]">
                            {/* [AB20.4.5.3] Manual override exercise checks use amber, not green */}
                            <span className={
                              preview.circuitCandidate!.candidateStatus === 'safe_circuit'
                                ? 'text-amber-400'
                                : preview.circuitCandidate!.candidateStatus === 'override_with_caution'
                                  ? 'text-amber-400'
                                  : 'text-[#7A7A8A]'
                        }>
                          {idx + 1}.
                        </span>
                        <span className="text-[#9A9AAA]">{exercise}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Skipped Exercises */}
              {preview.circuitCandidate.skippedExercises.length > 0 && (
                <div className="mb-3">
                  <span className="text-[9px] uppercase tracking-wide text-[#5A5A6A] block mb-1">
                    Not Included (skill holds / same-pattern)
                  </span>
                  <div className="space-y-1">
                    {preview.circuitCandidate.skippedExercises.map((exercise, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px]">
                        <span className="text-[#5A5A6A]">-</span>
                        <span className="text-[#6A6A7A]">{exercise}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Why This Day / Candidate Reason */}
              <div className="text-[9px] text-[#8A8A9A] mb-2">
                {preview.circuitCandidate.candidateReason}
              </div>
              
              {/* Risk Notes */}
              {preview.circuitCandidate.riskNotes.length > 0 && (
                <div className="text-[9px] text-amber-400/80 p-1.5 rounded bg-amber-500/5 border border-amber-500/10">
                  {preview.circuitCandidate.riskNotes.map((note, idx) => (
                    <div key={idx}>{note}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* [AB17.2.2.3] No-silent-fallback guard for circuits */}
          {/* If circuit-like method has preview but no circuitCandidate, show diagnostic instead of generic fallback */}
          {isCircuitMethod && preview && !preview.circuitCandidate && (
            <div className="mb-4 p-2 rounded bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-medium text-red-400">
                  Circuit preview scan did not return candidate
                </span>
              </div>
              <div className="space-y-1 text-[9px] text-[#8A8A9A]">
                <div>This preview should scan all program days. The circuit candidate payload was missing, so the generic workout preview was blocked to avoid a fake circuit preview.</div>
                <div className="mt-2 font-mono text-[8px] text-[#6A6A7A]">
                  <div>Method key: {plan.methodKey}</div>
                  <div>Preview created but circuitCandidate missing</div>
                </div>
                <div className="mt-2 px-2 py-1 bg-[#1A1A25] rounded text-[8px] text-amber-400/80">
                  Preview only — saved program unchanged
                </div>
              </div>
            </div>
          )}
          
          {/* [AB17.2] Concrete Day-Specific Workout Preview (non-circuit methods only) */}
          {/* [AB17.2.2.3] This fallback is now blocked for circuit-like methods via the guard above */}
          {preview.workoutPreview && !preview.circuitCandidate && !isCircuitMethod && (
            <div className="mb-4 p-2 rounded bg-[#12121A] border border-[#2A2A35]">
              <div className="text-[10px] font-medium text-amber-400 mb-2">
                {preview.workoutPreview.affectedDayLabel}
              </div>
              
              {/* Current Workout Structure */}
              <div className="mb-3">
                <span className="text-[9px] uppercase tracking-wide text-[#5A5A6A] block mb-1">
                  Current Workout
                </span>
                <div className="space-y-1">
                  {preview.workoutPreview.currentWorkoutPreview.map((block, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[10px]">
                      <span className="text-[#6A6A7A] min-w-[60px]">{block.label}:</span>
                      <span className="text-[#9A9AAA]">{block.exercises.slice(0, 2).join(', ')}{block.exercises.length > 2 ? '...' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Proposed Workout Structure */}
              <div className="mb-3 p-2 rounded bg-blue-500/5 border border-blue-500/20">
                <span className="text-[9px] uppercase tracking-wide text-blue-400 block mb-1">
                  Proposed Workout
                </span>
                <div className="space-y-1">
                  {preview.workoutPreview.proposedWorkoutPreview.map((block, idx) => (
                  <div
                  key={idx}
                  className={`flex items-start gap-2 text-[10px] ${
                    // [AB20.4.5.3] Manual override inserted blocks use amber, not green
                    block.changeType === 'inserted' ? 'text-amber-400' :
                    block.changeType === 'warning' ? 'text-orange-400' : ''
                  }`}
                  >
                  <span className={`min-w-[60px] ${
                    block.changeType === 'inserted' ? 'text-amber-500' :
                    block.changeType === 'warning' ? 'text-orange-500' : 'text-[#6A6A7A]'
                  }`}>
                  {block.changeType === 'inserted' ? '+ ' : block.changeType === 'warning' ? '! ' : ''}{block.label}:
                  </span>
                  <span className={
                    block.changeType === 'inserted' ? 'text-amber-300/80' :
                    block.changeType === 'warning' ? 'text-orange-300/80' : 'text-[#9A9AAA]'
                  }>
                        {block.exercises.slice(0, 3).join(', ')}{block.exercises.length > 3 ? '...' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Coach Caution */}
              {preview.workoutPreview.coachCaution && (
                <div className="text-[9px] text-amber-400/80 mt-2 p-1.5 rounded bg-amber-500/5 border border-amber-500/10">
                  <span className="font-medium">Coach note:</span> {preview.workoutPreview.coachCaution}
                </div>
              )}
              
              {/* Preview Limitations */}
              {!preview.workoutPreview.isConcretePreview && (
                <div className="text-[8px] text-[#5A5A6A] mt-2 italic">
                  Preview structure only — exact exercises determined at apply time
                </div>
              )}
            </div>
          )}
          
          {/* Fallback to text summaries if no concrete preview */}
          {!preview.workoutPreview && (
            <>
              {/* Current Structure */}
              <div className="mb-3 p-2 rounded bg-[#1A1A22] border border-[#2A2A35]">
                <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-1">
                  Current Structure
                </span>
                <p className="text-xs text-[#9A9AAA]">
                  {preview.currentStructure || 'Standard structure'}
                </p>
              </div>
              
              {/* Proposed Preview */}
              <div className="mb-3 p-2 rounded bg-blue-500/5 border border-blue-500/20">
                <span className="text-[10px] font-medium uppercase tracking-wide text-blue-400 block mb-1">
                  Proposed Preview
                </span>
                <p className="text-xs text-blue-300/80">
                  {preview.proposedStructure || preview.planSummary}
                </p>
              </div>
            </>
          )}
          
          {/* Impact Summary */}
          {preview.impactSummary && (
            <div className="mb-3">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-1">
                Impact
              </span>
              <p className="text-[10px] text-[#8A8A9A]">{preview.impactSummary}</p>
            </div>
          )}
          
          {/* Risk Summary */}
          {preview.riskSummary && (
            <div className="mb-3">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-1">
                Risk Assessment
              </span>
              <p className="text-[10px] text-[#8A8A9A]">{preview.riskSummary}</p>
            </div>
          )}
          
      {/* Saved Program Unchanged Proof */}
      {/* [AB20.4.5.3] Manual override preview border uses amber */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-500/20">
            <span className="px-2 py-0.5 text-[9px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Preview only — saved program unchanged
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
          // [AB20.2] Show different UI based on whether it's an override-applied method
          isOverrideApplied && onRequestRevert ? (
            // [AB20.2] Show revert confirmation dialog
            showRevertConfirmation ? (
              <div className="flex-1 flex flex-col space-y-2 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-200 leading-relaxed">
                    This will remove the Method Override Planner circuit from your saved program. Your original program structure will be preserved.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelRevert}
                    className="flex-1 h-8 text-[#9A9AAA] border-[#3A3A4A] hover:bg-[#2A2A35] text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onConfirmRevert}
                    disabled={isReverting}
                    className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    {isReverting ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      'Remove Override'
                    )}
                  </Button>
                </div>
              </div>
        ) : revertResult?.status === 'success' ? (
          // [AB20.2] Show success state after revert
          // [AB20.4.5.3] Use amber for user-initiated revert success
          <div className="flex-1 flex flex-col">
            <div className="h-10 flex items-center justify-center bg-amber-600/20 border border-amber-500/30 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-amber-400 mr-2" />
              <span className="text-xs text-amber-400 font-medium">Removed</span>
            </div>
            <span className="text-[8px] text-amber-400/70 text-center mt-1 leading-tight">
                  {revertResult.visibleSummary}
                </span>
              </div>
        ) : (
          // [AB20.2] Show remove override button
          // [AB20.4.5.3] User-applied overrides use amber, not green
          <div className="flex-1 flex flex-col">
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs text-amber-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Applied from Method Override Planner
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRequestRevert}
                    className="h-10 px-3 text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
                {revertResult?.status === 'blocked' && (
                  <span className="text-[8px] text-red-400/70 text-center mt-1 leading-tight">
                    {revertResult.visibleSummary}
                  </span>
                )}
              </div>
            )
          ) : (
            // Native/generated method — no remove option
            <div className="flex-1 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xs text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Already included from generated program
              </span>
            </div>
          )
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
            {/* [AB20 / IQ10] Apply button with eligibility classification */}
            {(() => {
              const { eligibility, reason } = classifyApplyEligibility(preview, isAlreadyApplied)
              const isApplyableSafe = eligibility === 'applyable_safe'
              const isApplyableCaution = eligibility === 'applyable_caution_review'
              const isApplyableForce = eligibility === 'applyable_force_override'
              const isBlockedImpossible = eligibility === 'not_applyable_blocked_impossible'
              const isApplyable = isApplyableSafe || isApplyableCaution || isApplyableForce
              const buttonText = getApplyButtonText(eligibility)
              
              // [AB20.4.4.2] Unified handler for all apply types
              const handleUnifiedApply = () => {
                onRequestCautionApply?.()
              }
              
              // [AB20.4.4.5] CANONICAL TRUTH CHECK: Sticky footer must verify artifact exists
              // Local applyResult cannot override artifact truth - prevents "Not Materialized" + "Applied" contradiction
              const canonicalKey = normalizeOverrideMethodKey(preview?.methodKey || item.methodKey)
              const artifacts = collectMethodOverrideArtifacts(program)
              const hasVerifiedArtifact = artifacts.some(a => 
                a.canonicalKey === canonicalKey && a.isRenderable && a.isUserAppliedOverride
              )
              
              // [AB20.4.4.5] Show verified override applied state ONLY if artifact exists
              // Use amber/orange for manual overrides, not green
              if (hasVerifiedArtifact) {
                const matchingArtifact = artifacts.find(a => a.canonicalKey === canonicalKey && a.isRenderable)
                return (
                  <div className="flex-1 flex flex-col">
                    <div className="h-10 flex items-center justify-center bg-amber-600/20 border border-amber-500/30 rounded-md">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 mr-2" />
                      <span className="text-xs text-amber-400 font-medium">Override Applied</span>
                    </div>
                    <span className="text-[8px] text-amber-400/70 text-center mt-1 leading-tight">
                      {matchingArtifact?.exerciseName 
                        ? `Applied to ${matchingArtifact.exerciseName} on ${matchingArtifact.sessionLabel}`
                        : `Applied to ${matchingArtifact?.sessionLabel || 'program'}`}
                    </span>
                  </div>
                )
              }
              
              // [AB20.4.4.5] If applyResult says success but no artifact exists, show error state
              // This prevents the contradiction where local state says "Applied" but artifact truth says "Not Materialized"
              if (applyResult?.status === 'success' && !hasVerifiedArtifact) {
                return (
                  <div className="flex-1 flex flex-col">
                    <div className="h-10 flex items-center justify-center bg-red-600/20 border border-red-500/30 rounded-md">
                      <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
                      <span className="text-xs text-red-400 font-medium">Apply Failed</span>
                    </div>
                    <span className="text-[8px] text-red-400/70 text-center mt-1 leading-tight">
                      No render artifact found — method may need re-apply
                    </span>
                  </div>
                )
              }
              
              // [AB20] Show caution confirmation dialog
              // [AB20.4.4.2] Unified confirmation panel for ALL apply types
              if (showCautionConfirmation && isApplyable) {
                const capability = preview?.methodCapability || getMethodOverrideCapability(item.methodKey)
                const methodLabel = capability.displayLabel !== 'Unknown Method' ? capability.displayLabel : item.label
                const target = preview?.targetExercises?.[0] || preview?.circuitCandidate
                const dayLabel = target?.dayLabel || 'selected day'
                
                // [AB20.4.4.2] Generate confirmation text based on severity/eligibility
                const isSafeApply = isApplyableSafe
                const isCautionApply = isApplyableCaution
                const isForceApply = isApplyableForce
                
                const confirmText = isForceApply
                  ? `The AI coach does not recommend ${methodLabel} for this program. Applying anyway may reduce training quality.`
                  : isCautionApply
                    ? `This will change your saved program. ${methodLabel} will be applied with caution — review the placement carefully.`
                    : `This will update your saved program by applying ${methodLabel} to ${dayLabel}.`
                
                // [AB20.4.4.5] All manual overrides use amber/orange styling
                // Force overrides use orange, all others use amber
                const bgColor = isForceApply 
                  ? 'bg-orange-500/5 border-orange-500/20' 
                  : 'bg-amber-500/5 border-amber-500/20'
                
                const iconColor = isForceApply ? 'text-orange-400' : 'text-amber-400'
                const textColor = isForceApply ? 'text-orange-200' : 'text-amber-200'
                const buttonColor = isForceApply 
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-amber-600 hover:bg-amber-700'
                const buttonText = isForceApply ? 'Force Override Anyway' : 'Apply Override'
                
                return (
                  <div className={cn('flex-1 flex flex-col space-y-2 p-2 rounded-lg border', bgColor)}>
                    <div className="flex items-start gap-2">
                      {/* [AB20.4.4.5] All manual overrides show AlertTriangle - modifying user's saved program */}
                      <AlertTriangle className={cn('w-4 h-4 shrink-0 mt-0.5', iconColor)} />
                      <div className="flex-1">
                        <p className={cn('text-[10px] leading-relaxed', textColor)}>
                          {confirmText}
                        </p>
                        {target && 'exerciseName' in target && (
                          <p className="text-[9px] text-[#8A8A9A] mt-1">
                            Target: {target.dayLabel} — {target.exerciseName}
                          </p>
                        )}
                        {preview?.severityAssessment && (
                          <p className={cn('text-[9px] mt-1', iconColor)}>
                            Severity: {preview.severityAssessment.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancelCautionApply}
                        className="flex-1 h-8 text-[#9A9AAA] border-[#3A3A4A] hover:bg-[#2A2A35] text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={onConfirmCautionApply}
                        disabled={isApplying}
                        className={cn('flex-1 h-8 text-white text-xs', buttonColor)}
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          buttonText
                        )}
                      </Button>
                    </div>
                  </div>
                )
              }
              
              return (
                <div className="flex-1 flex flex-col">
                  <Button
                    variant={isApplyable ? 'default' : 'outline'}
                    size="sm"
                    disabled={(!isApplyable && !isBlockedImpossible) || isApplying}
                    onClick={isApplyable ? handleUnifiedApply : undefined}
                className={cn(
                  'h-10',
                  // [AB20.4.5.3] All manual override apply buttons use amber, not green
                  isApplyableSafe
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : isApplyableCaution
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : isApplyableForce
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : isBlockedImpossible
                        ? 'text-red-400/50 border-red-500/20 cursor-not-allowed'
                        : 'text-[#5A5A6A] border-[#2A2A35] cursor-not-allowed'
                    )}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      buttonText
                    )}
                  </Button>
                  {!isApplyable && (
                    <span className="text-[8px] text-[#5A5A6A] text-center mt-1 leading-tight">
                      {reason}
                    </span>
                  )}
                  {applyResult?.status === 'blocked' && (
                    <span className="text-[8px] text-red-400/70 text-center mt-1 leading-tight">
                      {applyResult.visibleSummary}
                    </span>
                  )}
                </div>
              )
            })()}
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

// =============================================================================
// [MASTER-4.2] ADAPTIVE FOUNDATION SHEET CONTENT
// =============================================================================

/**
 * Resolves the visible adaptive foundation model, using program-stamped model
 * if available, otherwise deriving a display-only fallback from current program truth.
 */
function resolveVisibleAdaptiveFoundation(program: AdaptiveProgram): {
  model: AdaptiveFoundationModel | null
  isCanonical: boolean
} {
  // Prefer program-stamped model, but enrich with safeguard intelligence if missing
  if (program.adaptiveFoundationModel) {
    // If canonical model exists but lacks safeguardIntelligence, enrich it for display
    if (!program.adaptiveFoundationModel.safeguardIntelligence) {
      try {
        const enrichedModel = buildAdaptiveFoundationModel({
          experienceLevel: program.experienceLevel ?? null,
          trainingStyle: program.trainingPathType ?? null,
          trainingDaysPerWeek: program.trainingDaysPerWeek ?? null,
          equipment: program.equipmentProfile?.available ?? null,
          primaryGoal: program.primaryGoal ?? null,
          selectedGoals: program.goalCategories ?? null,
          selectedSkills: program.selectedSkills ?? program.authoritativeMultiSkillIntentContract?.selectedSkills ?? null,
          constraintInsight: program.constraintInsight ?? null,
          authoritativeMultiSkillIntentContract: program.authoritativeMultiSkillIntentContract ?? null,
          hasWorkoutHistory: false,
          hasSkillLogs: false,
          hasReadinessData: false,
          // [MASTER-5/6] Pass sessions for safeguard analysis
          programSessions: program.sessions ?? null,
          jointCautions: null, // Future: wire from profile
        })
        // Return canonical model base with display-enriched safeguard
        return {
          model: {
            ...program.adaptiveFoundationModel,
            safeguardIntelligence: enrichedModel.safeguardIntelligence,
          },
          isCanonical: true,
        }
      } catch {
        // Fallback to canonical without enrichment
        return { model: program.adaptiveFoundationModel, isCanonical: true }
      }
    }
    return { model: program.adaptiveFoundationModel, isCanonical: true }
  }
  
  // Derive display-only fallback
  try {
    const model = buildAdaptiveFoundationModel({
      experienceLevel: program.experienceLevel ?? null,
      trainingStyle: program.trainingPathType ?? null,
      trainingDaysPerWeek: program.trainingDaysPerWeek ?? null,
      equipment: program.equipmentProfile?.available ?? null,
      primaryGoal: program.primaryGoal ?? null,
      selectedGoals: program.goalCategories ?? null,
      selectedSkills: program.selectedSkills ?? program.authoritativeMultiSkillIntentContract?.selectedSkills ?? null,
      constraintInsight: program.constraintInsight ?? null,
      authoritativeMultiSkillIntentContract: program.authoritativeMultiSkillIntentContract ?? null,
      hasWorkoutHistory: false,
      hasSkillLogs: false,
      hasReadinessData: false,
      // [MASTER-5/6] Pass sessions for safeguard analysis
      programSessions: program.sessions ?? null,
      jointCautions: null, // Future: wire from profile
    })
    return { model, isCanonical: false }
  } catch {
    return { model: null, isCanonical: false }
  }
}

function AdaptiveFoundationSheetContent({ program }: { program: AdaptiveProgram }) {
  const { model, isCanonical } = resolveVisibleAdaptiveFoundation(program)
  
  if (!model) {
    return (
      <div className="p-4 text-center text-[#7A7A8A]">
        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Unable to resolve adaptive foundation model.</p>
        <p className="text-xs mt-1">This may happen if profile data is incomplete.</p>
      </div>
    )
  }
  
  const { sourceStatus, display, skillStates, constraints, allowedActions } = model
  
  // Quality colors
  const qualityColors: Record<string, string> = {
    'insufficient': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'partial': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'usable': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'strong': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  }
  
  const qualityClass = qualityColors[sourceStatus.dataQuality] || qualityColors['partial']
  
  // Count skill expression types
  const directCount = skillStates.filter(s => s.expressionStatus === 'direct_priority').length
  const supportCount = skillStates.filter(s => s.expressionStatus === 'support').length
  const carryoverCount = skillStates.filter(s => s.expressionStatus === 'carryover').length
  const deferredCount = skillStates.filter(s => s.expressionStatus === 'deferred').length
  
  return (
    <div className="space-y-4 pb-6">
      {/* Foundation Status Header */}
      <div className={cn('p-3 rounded-lg border', qualityClass)}>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5" />
          <span className="font-medium">{display.confidenceLabel}</span>
        </div>
        <p className="text-sm opacity-80">{display.headline}</p>
        <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
          <span className="px-2 py-0.5 rounded bg-black/20">
            {isCanonical ? 'Program-stamped' : 'Derived from plan'}
          </span>
          <span>{display.actionabilityLabel}</span>
        </div>
      </div>
      
      {/* Evidence Quality Section */}
      <div className="p-3 rounded-lg bg-[#12121A] border border-[#2A2A35]">
        <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
          Evidence Quality
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            {sourceStatus.hasProfileTruth ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <XCircle className="w-3 h-3 text-amber-400" />
            )}
            <span className="text-[#8A8A9A]">Profile truth</span>
          </div>
          <div className="flex items-center gap-1.5">
            {sourceStatus.hasSelectedSkills ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <XCircle className="w-3 h-3 text-amber-400" />
            )}
            <span className="text-[#8A8A9A]">Selected skills</span>
          </div>
          <div className="flex items-center gap-1.5">
            {sourceStatus.hasWorkoutEvidence ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <XCircle className="w-3 h-3 text-amber-400" />
            )}
            <span className="text-[#8A8A9A]">Workout history</span>
          </div>
          <div className="flex items-center gap-1.5">
            {sourceStatus.hasReadinessEvidence ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <XCircle className="w-3 h-3 text-amber-400" />
            )}
            <span className="text-[#8A8A9A]">Readiness data</span>
          </div>
        </div>
      </div>
      
      {/* Skill State Summary */}
      {skillStates.length > 0 && (
        <div className="p-3 rounded-lg bg-[#12121A] border border-[#2A2A35]">
          <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#E63946]" />
            Skill State Summary
          </h4>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {directCount > 0 && (
              <span className="px-2 py-1 rounded bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
                {directCount} direct
              </span>
            )}
            {supportCount > 0 && (
              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {supportCount} support
              </span>
            )}
            {carryoverCount > 0 && (
              <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {carryoverCount} rotating
              </span>
            )}
            {deferredCount > 0 && (
              <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {deferredCount} deferred
              </span>
            )}
          </div>
          {display.skillSummary && (
            <p className="mt-2 text-[10px] text-[#7A7A8A]">{display.skillSummary}</p>
          )}
        </div>
      )}
      
      {/* [MASTER-5/6] Movement Stress Map */}
      {model.safeguardIntelligence && model.safeguardIntelligence.movementFamilies.length > 0 && (
        <div className="p-3 rounded-lg bg-[#12121A] border border-[#2A2A35]">
          <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            Movement Stress Map
          </h4>
          <div className="space-y-2">
            {model.safeguardIntelligence.movementFamilies.slice(0, 6).map((mf, i) => {
              const stressColors: Record<string, string> = {
                'high': 'text-red-400 bg-red-500/10 border-red-500/20',
                'elevated': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                'moderate': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                'low': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                'unknown': 'text-[#7A7A8A] bg-[#2A2A35] border-[#3A3A45]',
              }
              const stressClass = stressColors[mf.estimatedStress] || stressColors['unknown']
              
              return (
                <div key={i} className="flex flex-col gap-1 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#B0B0C0] font-medium">{mf.label}</span>
                    <span className={cn('px-1.5 py-0.5 rounded text-[9px] border', stressClass)}>
                      {mf.estimatedStress}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-[#6A6A7A]">
                    <span>{mf.exposureCount} exercises</span>
                    <span>·</span>
                    <span>{mf.sessionCount} sessions</span>
                    {mf.linkedSkills.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-violet-400/70">{mf.linkedSkills.slice(0, 2).join(', ')}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[9px] text-[#5A5A6A]">{mf.whyItMatters}</p>
                </div>
              )
            })}
          </div>
          {model.safeguardIntelligence.headline && (
            <p className="mt-3 pt-2 border-t border-[#2A2A35] text-[10px] text-[#8A8A9A]">
              {model.safeguardIntelligence.headline}
            </p>
          )}
        </div>
      )}
      
      {/* [MASTER-5/6] Tendon / Joint Safeguards */}
      {model.safeguardIntelligence && model.safeguardIntelligence.tissueSignals.length > 0 && (
        <div className="p-3 rounded-lg bg-[#12121A] border border-[#2A2A35]">
          <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            Tendon / Joint Safeguards
          </h4>
          <div className="space-y-2">
            {model.safeguardIntelligence.tissueSignals.slice(0, 5).map((ts, i) => {
              const riskColors: Record<string, string> = {
                'high': 'text-red-400',
                'elevated': 'text-amber-400',
                'moderate': 'text-blue-400',
                'low': 'text-emerald-400',
                'unknown': 'text-[#7A7A8A]',
              }
              const riskColor = riskColors[ts.riskLevel] || riskColors['unknown']
              
              const postureLabels: Record<string, string> = {
                'monitor': 'Monitor',
                'hold_steady': 'Hold steady',
                'prep_first': 'Prep-first',
                'reduce_next': 'Reduce next',
                'needs_data': 'Needs data',
              }
              
              return (
                <div key={i} className="flex flex-col gap-1 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className={cn('font-medium', riskColor)}>{ts.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#2A2A35] text-[#8A8A9A]">
                      {postureLabels[ts.suggestedPosture] || ts.suggestedPosture}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#6A6A7A]">{ts.explanation}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Constraint Signals — improved to not look empty when safeguard signals exist */}
      <div className="p-3 rounded-lg bg-[#12121A] border border-[#2A2A35]">
        <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Constraint Signals
        </h4>
        {constraints.length > 0 ? (
          <div className="space-y-2">
            {constraints.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide',
                  c.severity === 'major' ? 'bg-red-500/10 text-red-400' :
                  c.severity === 'moderate' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-[#2A2A35] text-[#8A8A9A]'
                )}>
                  {c.severity}
                </span>
                <span className="text-[#8A8A9A]">{c.label}</span>
              </div>
            ))}
          </div>
        ) : model.safeguardIntelligence && model.safeguardIntelligence.tissueSignals.length > 0 ? (
          <div className="text-[10px] text-[#6A6A7A] space-y-1">
            <p>No formal constraint engine blocker detected.</p>
            <p className="text-[#5A5A6A]">Safeguard monitoring is still active from movement/tissue exposure above.</p>
          </div>
        ) : (
          <p className="text-[10px] text-[#6A6A7A]">
            No strong constraint signal detected yet.
          </p>
        )}
      </div>
      
      {/* Current Engine Posture */}
      <div className="p-3 rounded-lg bg-[#12121A] border border-[#2A2A35]">
        <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          What This Affects Now
        </h4>
        <ul className="text-[10px] text-[#8A8A9A] space-y-1">
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Flags movement-family and tissue-stress patterns for coaching visibility.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Recommends {model.safeguardIntelligence?.currentPosture?.replace('_', '-') || 'monitor'} safeguard posture.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
            <span>Does not rewrite exercises or doses yet.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <ArrowRight className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
            <span>Future adaptation gates can use this to guide safer progression.</span>
          </li>
        </ul>
      </div>
      
      {/* What Improves It */}
      <div className="p-3 rounded-lg bg-[#12121A] border border-[#2A2A35]">
        <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          What Improves the Model
        </h4>
        <ul className="text-[10px] text-[#7A7A8A] space-y-1">
          {!sourceStatus.hasWorkoutEvidence && (
            <li>• Log sets and RPE after workouts</li>
          )}
          <li>• Record discomfort or tension notes</li>
          <li>• Exercise-level completion quality</li>
          <li>• RPE and set drop-off trends</li>
          <li>• Joint/tendon check-ins and warm-up feedback</li>
          <li>• Train consistently so patterns become meaningful</li>
        </ul>
      </div>
      
      {/* Foundation-only disclaimer */}
      <div className="px-3 py-2 rounded bg-[#0A0A0D] border border-[#1A1A22] text-[9px] text-[#5A5A6A]">
        {isCanonical
          ? 'Program-stamped foundation — no automatic program changes applied by this layer.'
          : 'Derived from current plan — foundation only, no automatic program changes applied.'}
      </div>
    </div>
  )
}

function RequestedMethodsSheetContent({
  program,
  onApplyMethodOverride,
  onRevertMethodOverride,
  onResetAllMethodOverrides,
  showResetAllConfirmation,
  setShowResetAllConfirmation,
  isResettingAllOverrides,
  resetAllResult,
  onResetAllOverrides,
}: {
  program: AdaptiveProgram
  onApplyMethodOverride?: (preview: MethodOverridePreview, options: { allowCautionApply: boolean }) => Promise<MethodOverrideApplyResult>
  onRevertMethodOverride?: (methodKey: string) => Promise<MethodOverrideRevertResult>
  onResetAllMethodOverrides?: () => Promise<MethodOverrideResetAllResult>
  showResetAllConfirmation: boolean
  setShowResetAllConfirmation: (show: boolean) => void
  isResettingAllOverrides: boolean
  resetAllResult: MethodOverrideResetAllResult | null
  onResetAllOverrides: () => void
}) {
  const methodItems = extractRequestedMethodDecisions(program)
  const [selectedItem, setSelectedItem] = useState<RequestedMethodDisplayItem | null>(null)
  const [currentPlan, setCurrentPlan] = useState<RequestedMethodOverridePlan | null>(null)
  const [previews, setPreviews] = useState<MethodOverridePreview[]>([])
  
  // [AB20] Apply state management
  const [isApplying, setIsApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<MethodOverrideApplyResult | null>(null)
  const [showCautionConfirmation, setShowCautionConfirmation] = useState(false)
  
  // [AB20.2] Revert state management
  const [isReverting, setIsReverting] = useState(false)
  const [revertResult, setRevertResult] = useState<MethodOverrideRevertResult | null>(null)
  const [showRevertConfirmation, setShowRevertConfirmation] = useState(false)
  
  // [AB20.4.2] Load previews from storage on mount
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
    
    // [AB17.2] Extract session exercises for concrete workout preview
    let sessionExercises: string[] = []
    let sessionTitle: string | undefined
    const dayIndex = currentPlan.suggestedInsertion?.dayIndex
    if (dayIndex !== undefined && program.sessions?.[dayIndex]) {
      const session = program.sessions[dayIndex]
      sessionExercises = (session.exercises || []).map(e => e.name || 'Unknown')
      sessionTitle = session.focusLabel || session.focus || `Day ${dayIndex + 1}`
    }
    
  // [AB20.4.4.1] Pass full program sessions to ALL methods that need target scanning
  // Row-level methods (drop_set, rest_pause, cluster, top_set_backoff, endurance_density) need full program
  // context to scan all days for the best target, not just the suggested day.
  // Grouped block methods (circuits, density_block) also need full program context.
  const capability = getMethodOverrideCapability(currentPlan.methodKey)
  const needsFullProgramContext = 
    capability.writerKind === 'row_level_method' || 
    capability.writerKind === 'grouped_circuit' || 
    capability.writerKind === 'grouped_density_block'
  
  const context = needsFullProgramContext && program.sessions ? {
  programSessions: program.sessions.map(s => ({
  exercises: s.exercises,
  focus: s.focus,
  focusLabel: s.focusLabel,
  title: s.focusLabel || s.focus,
  dayLabel: s.dayLabel,
  estimatedMinutes: s.estimatedMinutes,
  styleMetadata: s.styleMetadata,
  }))
  } : undefined
    
    const preview = saveMethodOverridePreview(currentPlan, sessionExercises, sessionTitle, context)
    setPreviews(getMethodOverridePreviews())
    // Stay on the detail view to show the preview
  }
  
  const handleClearPreview = () => {
    if (!selectedItem) return
    clearMethodOverridePreview(selectedItem.methodKey)
    setPreviews(getMethodOverridePreviews())
    // [AB20] Clear apply state when clearing preview
    setApplyResult(null)
    setShowCautionConfirmation(false)
  }
  
  const handleDismiss = () => {
    setSelectedItem(null)
    setCurrentPlan(null)
    // [AB20] Clear apply state when dismissing
    setApplyResult(null)
    setShowCautionConfirmation(false)
  }
  
  // [AB20.4.4.2] All apply paths now show confirmation first
  // handleApplySafe now triggers confirmation instead of directly applying
  const handleApplySafe = () => {
  setShowCautionConfirmation(true)
  }
  
  // [AB20] Request caution confirmation (kept for backwards compatibility)
  const handleRequestCautionApply = () => {
  setShowCautionConfirmation(true)
  }
  
  // [AB20] Cancel caution confirmation
  const handleCancelCautionApply = () => {
    setShowCautionConfirmation(false)
  }
  
  // [AB20] Confirm and apply caution preview
  const handleConfirmCautionApply = async () => {
    if (!selectedItem || !onApplyMethodOverride) return
    const preview = getCurrentPreview(selectedItem.methodKey)
    if (!preview) return
    
    setShowCautionConfirmation(false)
    setIsApplying(true)
    setApplyResult(null)
    
    try {
      const result = await onApplyMethodOverride(preview, { allowCautionApply: true })
      setApplyResult(result)
      
      if (result.status === 'success') {
        // Clear preview from storage after successful apply
        clearMethodOverridePreview(selectedItem.methodKey)
        setPreviews(getMethodOverridePreviews())
      }
    } catch (error) {
      setApplyResult({
        status: 'blocked',
        visibleSummary: 'Failed to apply override.',
        evidence: [`Error: ${error instanceof Error ? error.message : 'unknown'}`],
        reasonCode: 'save_failed',
      })
    } finally {
      setIsApplying(false)
    }
  }
  
  // [AB20.2] Request revert confirmation
  const handleRequestRevert = () => {
    setShowRevertConfirmation(true)
  }
  
  // [AB20.2] Cancel revert confirmation
  const handleCancelRevert = () => {
    setShowRevertConfirmation(false)
  }
  
  // [AB20.2] Confirm and execute revert
  const handleConfirmRevert = async () => {
    if (!selectedItem || !onRevertMethodOverride) return
    
    setShowRevertConfirmation(false)
    setIsReverting(true)
    setRevertResult(null)
    
    try {
      const result = await onRevertMethodOverride(selectedItem.methodKey)
      setRevertResult(result)
      
      if (result.status === 'success') {
        // Clear any preview from storage after successful revert
        clearMethodOverridePreview(selectedItem.methodKey)
        setPreviews(getMethodOverridePreviews())
      }
    } catch (error) {
      setRevertResult({
        status: 'blocked',
        visibleSummary: 'Failed to remove override.',
        evidence: [`Error: ${error instanceof Error ? error.message : 'unknown'}`],
        reasonCode: 'save_failed',
      })
    } finally {
      setIsReverting(false)
    }
  }
  
  // [AB20.2] Check if the selected method has an override-applied circuit
  // [AB20.4.1] Check if the selected method has an override-applied grouped block
  // Uses method-specific detection instead of global "any override exists" check
  const isOverrideAppliedForSelectedMethod = selectedItem
    ? hasMethodOverrideAppliedGroup(program, selectedItem.methodKey)
    : false
  
  // [AB20.4] Use canonical key for preview lookup
  const getCurrentPreview = (methodKey: string) => {
    const canonicalKey = normalizeOverrideMethodKey(methodKey)
    return previews.find(p => normalizeOverrideMethodKey(p.methodKey) === canonicalKey) || null
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
                  // [AB20.4.5.3] Manual override previews use amber, not green
                  hasPreview && 'border-amber-500/20 bg-amber-500/5',
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
                    {/* [AB20.4.5.3] Manual override preview badge uses amber, not green */}
                    {hasPreview && (
                      <span className="px-1.5 py-0.5 text-[8px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Preview
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3 text-[#5A5A6A] ml-auto shrink-0" />
                  </div>
                  <p className="text-[10px] text-[#7A7A8A] leading-relaxed mt-0.5 line-clamp-2">
                    {item.reason}
                  </p>
                  {/* [P2B] Action hint — makes rows obviously actionable */}
                  {/* [AB20.4.5.3] Manual override applied/preview use amber, not green */}
                  <p className={cn(
                    'text-[9px] mt-1 flex items-center gap-1',
                    isApplied ? 'text-amber-400/70' : hasPreview ? 'text-amber-400/70' : 'text-purple-400/70'
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
          program={program}
          onCreatePreview={handleCreatePreview}
          onClearPreview={handleClearPreview}
          onDismiss={handleDismiss}
          onApplySafe={handleApplySafe}
          onRequestCautionApply={handleRequestCautionApply}
          isApplying={isApplying}
          applyResult={applyResult}
          showCautionConfirmation={showCautionConfirmation}
          onCancelCautionApply={handleCancelCautionApply}
          onConfirmCautionApply={handleConfirmCautionApply}
          // [AB20.2] Revert props
          isOverrideApplied={isOverrideAppliedForSelectedMethod || false}
          onRequestRevert={handleRequestRevert}
          isReverting={isReverting}
          revertResult={revertResult}
          showRevertConfirmation={showRevertConfirmation}
          onCancelRevert={handleCancelRevert}
          onConfirmRevert={handleConfirmRevert}
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
                  {/* [AB20.4.5.3] Program/method truth badges use blue (informational) */}
                  <span className={cn(
                    'px-2 py-0.5 text-[9px] rounded border',
                    hasProgramTruth
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-[#2A2A35] text-[#6A6A7A] border-[#3A3A4A]'
                  )}>
                    {hasProgramTruth ? 'Program truth detected' : 'No program truth'}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 text-[9px] rounded border',
                    hasMethodDecisionTruth
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
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
      {/* [IQ6.1 / AB16.0-B] Removed "Planner display corridor: active" debug text.
          Normal users shouldn't see smoke-test markers. */}
    </div>

    {/* [AB20.4.5.4] Active Previews Banner - only count truly unapplied previews */}
    {(() => {
      // [AB20.4.5.4] Derive actual active preview count by excluding methods that have verified artifacts
      const artifacts = collectMethodOverrideArtifacts(program)
      const activePreviewsOnly = previews.filter(p => {
        const canonicalKey = normalizeOverrideMethodKey(p.methodKey)
        const hasAppliedArtifact = artifacts.some(a => 
          a.canonicalKey === canonicalKey && a.isRenderable && a.isUserAppliedOverride
        )
        return !hasAppliedArtifact // Only count if NOT already applied
      })
      const appliedOverrideCount = artifacts.filter(a => a.isUserAppliedOverride && a.isRenderable).length
      
      if (activePreviewsOnly.length > 0) {
        return (
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">
                {activePreviewsOnly.length} Override Preview{activePreviewsOnly.length > 1 ? 's' : ''} Active
                {appliedOverrideCount > 0 && (
                  <span className="text-emerald-400 ml-2">
                    · {appliedOverrideCount} Applied
                  </span>
                )}
              </span>
            </div>
            <p className="text-[10px] text-[#8A8A9A]">
              Preview{activePreviewsOnly.length > 1 ? 's are' : ' is'} not applied to your saved program. 
              Tap a method to view or clear the preview.
            </p>
          </div>
        )
      } else if (appliedOverrideCount > 0) {
        // All previews have been applied - show applied-only banner
        return (
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                {appliedOverrideCount} Method Override{appliedOverrideCount > 1 ? 's' : ''} Applied
              </span>
            </div>
            <p className="text-[10px] text-[#8A8A9A]">
              These overrides are saved into your program and have render artifacts.
            </p>
          </div>
        )
      }
      return null
    })()}

      {/* [AB20.4.2] Reset All Overrides Section */}
      {onResetAllMethodOverrides && (
        <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
          {/* Reset All Result Banner */}
          {resetAllResult && (
            <div className={cn(
              'p-2 rounded-md mb-3 text-xs',
              resetAllResult.status === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : resetAllResult.status === 'not_found'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
            )}>
              {resetAllResult.visibleSummary}
            </div>
          )}
          
          {/* Confirmation Dialog */}
          {showResetAllConfirmation ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-[#E6E9EF]">Reset all method overrides?</p>
                  <p className="text-[10px] text-[#8A8A9A] mt-1 leading-relaxed">
                    This will remove Method Override Planner changes you applied manually 
                    and return the program to the AI/native method structure. 
                    Original AI-selected methods such as native supersets stay.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResetAllConfirmation(false)}
                  disabled={isResettingAllOverrides}
                  className="flex-1 h-8 text-xs border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#2A2A35]"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onResetAllOverrides}
                  disabled={isResettingAllOverrides}
                  className="flex-1 h-8 text-xs bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                >
                  {isResettingAllOverrides ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Confirm Reset'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#9A9AAA]">Reset overrides</p>
                <p className="text-[10px] text-[#6A6A7A] mt-0.5">
                  Removes user-applied method overrides only. AI-selected methods stay.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetAllConfirmation(true)}
                className="h-7 px-3 text-[10px] border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#2A2A35] hover:text-[#E6E9EF]"
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                Reset
              </Button>
            </div>
          )}
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
  onProgramUpdate, // [AB20 / IQ10] Callback for state update
  onApplyMethodOverridePreview, // [AB20.1D] Dedicated callback for apply with save
  onRevertMethodOverride, // [AB20.2] Dedicated callback for revert with save
  onResetAllMethodOverrides, // [AB20.4.2] Callback to reset all overrides
}: ProgramCoachIntelligenceHubProps) {
  // Sheet open states
  const [skillPhaseOpen, setSkillPhaseOpen] = useState(false)
  const [methodDecisionsOpen, setMethodDecisionsOpen] = useState(false)
  const [calibrationOpen, setCalibrationOpen] = useState(false)
  const [coachRecsOpen, setCoachRecsOpen] = useState(false)
  const [requestedMethodsOpen, setRequestedMethodsOpen] = useState(false)
  const [planLogicOpen, setPlanLogicOpen] = useState(false)
  // [MASTER-4.2] Adaptive Foundation sheet state
  const [adaptiveFoundationOpen, setAdaptiveFoundationOpen] = useState(false)
  // [AB20.4.2] Reset-all state
  const [isResettingAllOverrides, setIsResettingAllOverrides] = useState(false)
  const [showResetAllConfirmation, setShowResetAllConfirmation] = useState(false)
  const [resetAllResult, setResetAllResult] = useState<MethodOverrideResetAllResult | null>(null)

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
  
  // [AB20.4.3] Reload context state
  const [isReloadingPlanner, setIsReloadingPlanner] = useState(false)
  const RELOAD_CONTEXT_KEY = 'spartanlab:methodOverridePlannerReloadContext'
  
  // [AB20.4.3] Save reload context and reload page
  const handleReloadPage = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const reloadContext = { openPlanner: true, createdAt: new Date().toISOString() }
      window.sessionStorage.setItem(RELOAD_CONTEXT_KEY, JSON.stringify(reloadContext))
    } catch { /* Storage not available */ }
    setIsReloadingPlanner(true)
    window.location.reload()
  }, [RELOAD_CONTEXT_KEY])
  
  // [AB20.4.3] Restore reload context on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.sessionStorage.getItem(RELOAD_CONTEXT_KEY)
      if (stored) {
        const context = JSON.parse(stored) as { openPlanner?: boolean; createdAt?: string }
        const createdAt = context.createdAt ? new Date(context.createdAt).getTime() : 0
        const isExpired = Date.now() - createdAt > 30000
        if (!isExpired && context.openPlanner) {
          window.sessionStorage.removeItem(RELOAD_CONTEXT_KEY)
          setRequestedMethodsOpen(true)
        } else {
          window.sessionStorage.removeItem(RELOAD_CONTEXT_KEY)
        }
      }
    } catch { /* Storage not available or parse error */ }
  }, [RELOAD_CONTEXT_KEY])
  
  // [AB20.4.2] Handler for reset all method overrides with confirmation
  const handleResetAllOverrides = async () => {
    if (!onResetAllMethodOverrides || isResettingAllOverrides) return
    
    setIsResettingAllOverrides(true)
    setResetAllResult(null)
    
    try {
      const result = await onResetAllMethodOverrides()
      setResetAllResult(result)
      
      if (result.status === 'success') {
        // Refresh active previews from storage (should be cleared)
        setActivePreviews(getMethodOverridePreviews())
        setShowResetAllConfirmation(false)
      }
    } catch (error) {
      setResetAllResult({
        status: 'blocked',
        visibleSummary: 'Failed to reset overrides.',
        evidence: [`Error: ${error instanceof Error ? error.message : 'unknown'}`],
        removedCount: 0,
        removedMethodKeys: [],
        affectedSessions: [],
        reasonCode: 'invalid_program',
      })
    } finally {
      setIsResettingAllOverrides(false)
    }
  }
  
  // [AB20.1D] Apply handler that routes through dedicated save callback or falls back to state-only
  const handleApplyMethodOverride = async (
    preview: MethodOverridePreview,
    options: { allowCautionApply: boolean }
  ): Promise<MethodOverrideApplyResult> => {
    // [AB20.1D] If dedicated save callback is provided, use it (proper persistence path)
    if (onApplyMethodOverridePreview) {
      const result = await onApplyMethodOverridePreview(preview, options)
      // Refresh active previews after successful apply
      if (result.status === 'success') {
        setActivePreviews(getMethodOverridePreviews())
      }
      return result
    }
    
    // Fallback: call pure helper directly (state-only, no save persistence)
    const result = applyMethodOverridePreviewToProgram({
      program,
      preview,
      allowCautionApply: options.allowCautionApply,
    })
    
    // If blocked or no updated program, return early
    if (result.status !== 'success' || !result.updatedProgram) {
      return result
    }
    
    // Fallback: update state only (not persisted to storage)
    if (onProgramUpdate) {
      onProgramUpdate(result.updatedProgram)
      setActivePreviews(getMethodOverridePreviews())
    }
    
    return {
      ...result,
      evidence: [...result.evidence, 'WARNING: State-only update, not persisted via saveAdaptiveProgram'],
    }
  }
  
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

          {/* [MASTER-4.2] Adaptive Foundation tile — first-class Coach Intelligence module */}
          {(() => {
            const { model } = resolveVisibleAdaptiveFoundation(program)
            if (!model) return null
            
            const qualityBadge = model.sourceStatus.dataQuality === 'strong' ? 'Strong' :
                                 model.sourceStatus.dataQuality === 'usable' ? 'Usable' :
                                 model.sourceStatus.dataQuality === 'partial' ? 'Partial' : 'Building'
            const badgeVariant = model.sourceStatus.dataQuality === 'strong' || model.sourceStatus.dataQuality === 'usable' ? 'success' : 'info'
            
            // [MASTER-5/6] Smarter summary from safeguard intelligence
            let tileSummary = model.display.actionabilityLabel
            const safeguard = model.safeguardIntelligence
            if (safeguard) {
              if (safeguard.currentPosture === 'prep_first') {
                tileSummary = 'Prep-first watch'
              } else if (safeguard.currentPosture === 'hold_steady') {
                tileSummary = 'Tissue monitor'
              } else if (safeguard.currentPosture === 'needs_data') {
                tileSummary = 'Needs data'
              } else if (safeguard.movementFamilies.some(mf => mf.family.includes('straight_arm'))) {
                tileSummary = 'Straight-arm watch'
              } else if (safeguard.tissueSignals.length > 0) {
                tileSummary = 'Joint monitor'
              }
            }
            
            return (
              <HubButton
                icon={<Brain className="w-3.5 h-3.5 text-violet-400" />}
                label="Adaptive Foundation"
                summary={tileSummary}
                badge={qualityBadge}
                badgeVariant={badgeVariant}
                onClick={() => setAdaptiveFoundationOpen(true)}
              />
            )
          })()}

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
        
        {/* [AB18 / IQ8 / AB19] Weekly Recovery Check — compact proof line from weeklyStressDistributionPlan */}
        {/* [AB19 / IQ9] Explanation Parity: source classification added for transparency */}
        {(() => {
          const stressPlan = program.weeklyStressDistributionPlan
          const rootCause = (program as unknown as { flexibleFrequencyRootCause?: { 
            finalReasonCategory?: string
            jointCautionPenalty?: number
            recoveryScore?: number
            goalTypical?: number
          }}).flexibleFrequencyRootCause
          const sessionCount = program.sessions?.length || 0
          const headline = stressPlan?.summary?.weeklyHeadline
          
          // [AB19 / IQ9] Determine explanation parity status
          const hasStressPlan = !!stressPlan?.summary
          const hasRootCause = !!rootCause
          const parityStatus: 'authoritative' | 'derived' | 'fallback' = 
            hasStressPlan && headline ? 'authoritative' :
            hasStressPlan || hasRootCause ? 'derived' :
            sessionCount > 0 ? 'fallback' : 'fallback'
          
          // Build a compact recovery proof line
          const proofParts: string[] = []
          
          if (sessionCount > 0) {
            proofParts.push(`${sessionCount} sessions`)
          }
          if (stressPlan?.summary?.highStressDays != null && stressPlan.summary.highStressDays > 0) {
            proofParts.push(`${stressPlan.summary.highStressDays} high-stress`)
          }
          if (stressPlan?.summary?.highRiskAdjacencies != null && stressPlan.summary.highRiskAdjacencies > 0) {
            proofParts.push(`${stressPlan.summary.highRiskAdjacencies} adjacency soften`)
          }
          if (rootCause?.jointCautionPenalty != null && rootCause.jointCautionPenalty > 0) {
            proofParts.push('joint caution applied')
          }
          if (rootCause?.recoveryScore != null && rootCause.recoveryScore < 0.5) {
            proofParts.push('recovery-reduced')
          }
          
          // Use headline if available, else generic
          const displayHeadline = headline && headline.length > 5 
            ? headline 
            : proofParts.length > 0
              ? proofParts.join(' • ')
              : null
          
          if (!displayHeadline) return null
          
          // [AB19] Parity-aware icon color: authoritative=emerald, derived=blue, fallback=amber
          const iconColor = parityStatus === 'authoritative' 
            ? 'text-emerald-400/70' 
            : parityStatus === 'derived' 
              ? 'text-blue-400/70' 
              : 'text-amber-400/70'
          
          return (
            <div className="mt-2 px-2 py-1.5 rounded bg-[#12121A]/50 border border-[#2A2A35]/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={cn('w-3 h-3 flex-shrink-0', iconColor)} />
                <span className="text-[9px] text-[#8A8A9A] leading-relaxed">
                  <span className="text-[#6A6A7A]">Weekly check:</span> {displayHeadline}
                  {/* [AB19] Show parity source only for non-authoritative */}
                  {parityStatus !== 'authoritative' && (
                    <span className="text-[#5A5A6A] ml-1">
                      ({parityStatus === 'derived' ? 'derived' : 'limited'})
                    </span>
                  )}
                </span>
              </div>
            </div>
          )
        })()}
        
        {/* [MASTER-3/4] Adaptive Foundation Status — compact proof line */}
        {(() => {
          // [MASTER-3/4.1] Resolve foundation model with fallback for old programs
          let foundationModel: AdaptiveFoundationModel | null = program.adaptiveFoundationModel ?? null
          let isCanonical = !!program.adaptiveFoundationModel
          
          // If no canonical model, derive display-only fallback from current program truth
          if (!foundationModel) {
            try {
              foundationModel = buildAdaptiveFoundationModel({
                experienceLevel: program.experienceLevel ?? null,
                trainingStyle: program.trainingPathType ?? null,
                trainingDaysPerWeek: program.trainingDaysPerWeek ?? null,
                equipment: program.equipmentProfile?.available ?? null,
                primaryGoal: program.primaryGoal ?? null,
                selectedGoals: program.goalCategories ?? null,
                selectedSkills: program.selectedSkills ?? program.authoritativeMultiSkillIntentContract?.selectedSkills ?? null,
                constraintInsight: program.constraintInsight ?? null,
                authoritativeMultiSkillIntentContract: program.authoritativeMultiSkillIntentContract ?? null,
                hasWorkoutHistory: false, // Safe fallback — can't know from program alone
                hasSkillLogs: false,
                hasReadinessData: false, // Safe fallback — readiness evidence requires server context
              })
              
              // Dev-only diagnostic
              if (process.env.NODE_ENV === 'development') {
                console.log('[master-3-4-adaptive-foundation-display-fallback]', {
                  hasProgramStampedModel: false,
                  usedFallback: true,
                  dataQuality: foundationModel.sourceStatus.dataQuality,
                  skillStateCount: foundationModel.skillStates.length,
                  constraintCount: foundationModel.constraints.length,
                })
              }
            } catch (err) {
              // Non-blocking — return null if fallback fails
              if (process.env.NODE_ENV === 'development') {
                console.log('[master-3-4-adaptive-foundation-fallback-failed]', err)
              }
              return null
            }
          }
          
          if (!foundationModel) return null
          
          const { sourceStatus, display, skillStates, constraints } = foundationModel
          
          // Build compact status line
          const statusParts: string[] = []
          
          // Data quality badge
          const qualityColors: Record<string, string> = {
            'insufficient': 'text-amber-400/70',
            'partial': 'text-blue-400/70',
            'usable': 'text-emerald-400/70',
            'strong': 'text-emerald-400',
          }
          
          // Skill summary if available
          if (display.skillSummary) {
            statusParts.push(display.skillSummary)
          } else if (skillStates.length > 0) {
            statusParts.push(`${skillStates.length} skills mapped`)
          }
          
          // Limiter if available
          if (constraints.length > 0 && constraints[0].label) {
            statusParts.push(`limiter: ${constraints[0].label.toLowerCase()}`)
          }
          
          // Actionability
          statusParts.push(display.actionabilityLabel.toLowerCase())
          
          const displayText = statusParts.join(' · ')
          const iconColor = qualityColors[sourceStatus.dataQuality] || 'text-blue-400/70'
          
          return (
            <button
              onClick={() => setAdaptiveFoundationOpen(true)}
              className="mt-2 px-2 py-1.5 rounded bg-[#12121A]/50 border border-[#2A2A35]/50 w-full text-left hover:bg-[#1A1A22]/80 hover:border-[#3A3A45]/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Brain className={cn('w-3 h-3 flex-shrink-0', iconColor)} />
                <span className="text-[9px] text-[#8A8A9A] leading-relaxed">
                  <span className="text-[#6A6A7A]">Adaptive foundation:</span>{' '}
                  <span className={iconColor}>{display.confidenceLabel.toLowerCase()}</span>
                  {displayText && <span className="text-[#7A7A8A]"> — {displayText}</span>}
                </span>
                <ChevronRight className="w-3 h-3 text-[#5A5A6A] ml-auto flex-shrink-0" />
              </div>
              {/* Foundation-only note — distinguish canonical vs derived */}
              <div className="mt-1 text-[8px] text-[#5A5A6A] pl-5">
                {isCanonical
                  ? 'Program-stamped foundation — no automatic program changes applied by this layer.'
                  : 'Derived from current plan — foundation only, no automatic program changes applied.'}
              </div>
            </button>
          )
        })()}
        
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

      {/* [MASTER-4.2] Adaptive Foundation Sheet */}
      <Sheet open={adaptiveFoundationOpen} onOpenChange={setAdaptiveFoundationOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet-400" />
              Adaptive Foundation
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              Athlete model, skill states, and constraint detection
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            <AdaptiveFoundationSheetContent program={program} />
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
          {/* [AB20.4.3] Reload overlay when reloading */}
          {isReloadingPlanner && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0F0F12]/95">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
                <span className="text-sm text-[#9A9AAA]">Reloading Method Planner...</span>
              </div>
            </div>
          )}
          {/* [AB20.4.3] Reload page button with feedback */}
          <button
            type="button"
            onClick={handleReloadPage}
            disabled={isReloadingPlanner}
            aria-label="Reload page"
            title="Reload page"
            className={cn(
              "absolute right-12 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-md border border-[#2A2A35] bg-[#111116]/90 transition-colors",
              isReloadingPlanner ? "cursor-not-allowed text-[#5A5A6A]" : "text-[#9A9AAA] hover:bg-[#2A2A35] hover:text-[#E6E9EF]"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", isReloadingPlanner && "animate-spin")} />
          </button>
          <SheetHeader className="pr-20">
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Method Override Planner
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              {onApplyMethodOverridePreview 
                ? 'Review and apply method override previews to your saved program.'
                : 'Preview-only. Create safe override previews without changing your saved program.'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <RequestedMethodsSheetContent 
              program={program} 
              onApplyMethodOverride={onApplyMethodOverridePreview ? handleApplyMethodOverride : undefined}
              onRevertMethodOverride={onRevertMethodOverride}
              onResetAllMethodOverrides={onResetAllMethodOverrides}
              showResetAllConfirmation={showResetAllConfirmation}
              setShowResetAllConfirmation={setShowResetAllConfirmation}
              isResettingAllOverrides={isResettingAllOverrides}
              resetAllResult={resetAllResult}
              onResetAllOverrides={handleResetAllOverrides}
            />
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
