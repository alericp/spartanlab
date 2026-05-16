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

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Eye,
  Loader2,
  Trash2,
  RefreshCw,
  Activity,
  Scale,
  Shield,
  Database,
  AlertCircle,
  X,
  Check,
  Settings2,
  Minus,
} from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import type { SelectedSkillRepresentationDisplay } from '@/lib/program/selected-skill-representation-guidance'
import type { ProgramIntelligenceContract } from '@/lib/program/program-display-contract'
import type { ProgramCalibrationInput } from '@/lib/program/program-calibration-recommendation'
import type { EvidenceCoachRecommendationBundle } from '@/lib/program/evidence-derived-coach-recommendations'
// [MASTER-8C.6] Generator knowledge consumption proof rollup
import { 
  rollUpProgramGeneratorKnowledgeProof, 
  resolveSessionGeneratorKnowledgeProofFromSession,
  type ProgramGeneratorKnowledgeProof 
} from '@/lib/program/generator-knowledge-consumption-proof'
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
// [MASTER-8B.4] Program Balance read-only analyzer imports
import {
  analyzeProgramBalanceReadOnly,
  getProgramBalanceReadOnlyUnavailable,
} from '@/lib/program/program-balance-readonly-analyzer'
import type {
  ProgramBalanceReadOnlyResult,
  ProgramBalanceFinding,
  ProgramBalanceSkillExpression,
  ProgramBalanceMovementFamilySummary,
  ProgramBalanceTissueStressSummary,
  FutureSessionCandidate,
  FutureSessionPlanningDetail,
  ProgramBalanceSeverity,
} from '@/lib/program/program-balance-intelligence-contract'
import {
  type FutureSessionMutationPlanBundle,
  type ConfirmedFutureSessionMutationPlan,
  type FutureSessionMutationEligibilityResult,
  loadMutationPlans,
  addConfirmedPlan,
  createConfirmedPlan,
  resolveFutureSessionMutationEligibility,
  getEligibilitySummary,
} from '@/lib/program/future-session-mutation-apply-contract'
import {
  buildProgramBalanceBranchInputFromProgram,
  buildProgramBalanceBranchInputWithFoundation,
  extractSelectedSkillIdsFromRepresentations,
} from '@/lib/program/program-balance-ui-adapter'
// [MASTER-8B.5] Method Planner foundation context
import {
  buildMethodPlannerFoundationContext,
  type MethodPlannerFoundationContext,
} from '@/lib/program/method-planner-foundation-context'
// [MASTER-8C.7] Method Contract Slot Frequency Inventory
import {
  buildMethodContractSlotFrequencyInventory,
  type MethodContractInventoryRollup,
} from '@/lib/program/method-contract-slot-frequency-inventory'
// [MASTER-8C.8] Slot Eligibility & Frequency Preview
import {
  buildMethodSlotEligibilityFrequencyPlan,
  type MethodSlotEligibilityFrequencyPlan,
  type MethodFrequencyPreview,
} from '@/lib/program/method-slot-eligibility-frequency-planner'
import {
  buildFrequencySlotPlacementPreview,
  type FrequencySlotPlacementPreview,
  type FrequencySlotPlacementTarget,
} from '@/lib/program/method-frequency-slot-placement-preview'
import type { CanonicalMethodFamily } from '@/lib/program/method-structure-contract'
// [MASTER-8C.10] Frequency Placement Apply Contract
import {
  applyConfirmedFrequencyPlacementPreview,
  isMethodSupportedForFrequencyApply,
  extractAppliedMethodPlacements,
  type FrequencyPlacementApplyResult,
  type SelectiveRemovalResult,
  type AppliedMethodPlacement,
} from '@/lib/program/method-frequency-placement-apply-contract'

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
// [MASTER-8A.1.1] CANONICAL METHOD PLANNER SUMMARY
// =============================================================================
// This creates ONE shared source of truth for all Method Planner visible counts.
// The tile, banner, and grouped rows must all consume this same summary.

type PlannerSummaryBadgeVariant = 'warning' | 'success' | 'secondary' | 'info'

interface CanonicalMethodPlannerSummary {
  // Unique canonical method keys by category
  appliedOverrideMethodKeys: string[]
  nativeMaterializedMethodKeys: string[]
  activePreviewOnlyMethodKeys: string[]
  reviewMethodKeys: string[]
  notRequestedMethodKeys: string[]
  visibleMethodKeys: string[]

  // Counts derived from the above key arrays
  appliedOverrideCount: number
  nativeMaterializedCount: number
  activePreviewOnlyCount: number
  reviewCount: number
  visibleMethodCount: number

  // Tile display fields
  tileSummary: string
  tileBadge?: string
  tileBadgeVariant: PlannerSummaryBadgeVariant

  // Banner display fields
  bannerHeadline: string | null
  bannerTone: 'applied' | 'preview' | 'review' | 'none'
  bannerBody: string | null

  // Compact proof line for visible parity verification
  proofLine: string
}

/**
 * [MASTER-8A.1.1] Builds the canonical planner summary from all truth sources.
 * This is the ONLY source for Method Planner visible counts.
 */
function buildCanonicalMethodPlannerSummary(
  program: AdaptiveProgram | null | undefined,
  methodItems: RequestedMethodDisplayItem[],
  previews: MethodOverridePreview[]
): CanonicalMethodPlannerSummary {
  // Collect artifacts to identify user-applied overrides
  const artifacts = program ? collectMethodOverrideArtifacts(program) : []
  
  // Build set of user-applied override canonical keys
  const userAppliedOverrideKeySet = new Set<string>()
  for (const artifact of artifacts) {
    if (artifact.isUserAppliedOverride && artifact.isRenderable) {
      userAppliedOverrideKeySet.add(artifact.canonicalKey)
    }
  }
  
  // Build set of preview canonical keys that are NOT already applied
  const activePreviewOnlyKeySet = new Set<string>()
  for (const preview of previews) {
    const canonicalKey = normalizeOverrideMethodKey(preview.methodKey)
    if (!userAppliedOverrideKeySet.has(canonicalKey)) {
      activePreviewOnlyKeySet.add(canonicalKey)
    }
  }
  
  // Categorize method items
  const nativeMaterializedKeySet = new Set<string>()
  const reviewKeySet = new Set<string>()
  const notRequestedKeySet = new Set<string>()
  const visibleKeySet = new Set<string>()
  
  for (const item of methodItems) {
    const canonicalKey = normalizeOverrideMethodKey(item.methodKey)
    
    if (item.state === 'not_requested') {
      notRequestedKeySet.add(canonicalKey)
      // not_requested items are still visible in the planner
      visibleKeySet.add(canonicalKey)
      continue
    }
    
    visibleKeySet.add(canonicalKey)
    
    if (item.state === 'applied' || item.state === 'materialized') {
      // Only count as native materialized if NOT in user-applied set
      if (!userAppliedOverrideKeySet.has(canonicalKey)) {
        nativeMaterializedKeySet.add(canonicalKey)
      }
    } else if (['blocked', 'deferred', 'suppressed', 'not_materialized', 'unknown'].includes(item.state)) {
      reviewKeySet.add(canonicalKey)
    }
  }
  
  // Convert sets to arrays
  const appliedOverrideMethodKeys = Array.from(userAppliedOverrideKeySet)
  const nativeMaterializedMethodKeys = Array.from(nativeMaterializedKeySet)
  const activePreviewOnlyMethodKeys = Array.from(activePreviewOnlyKeySet)
  const reviewMethodKeys = Array.from(reviewKeySet)
  const notRequestedMethodKeys = Array.from(notRequestedKeySet)
  const visibleMethodKeys = Array.from(visibleKeySet)
  
  // Derive counts
  const appliedOverrideCount = appliedOverrideMethodKeys.length
  const nativeMaterializedCount = nativeMaterializedMethodKeys.length
  const activePreviewOnlyCount = activePreviewOnlyMethodKeys.length
  const reviewCount = reviewMethodKeys.length
  const visibleMethodCount = visibleMethodKeys.length
  
  // Compute tile display (priority: preview > applied > review > native > view)
  let tileSummary = 'View'
  let tileBadge: string | undefined
  let tileBadgeVariant: PlannerSummaryBadgeVariant = 'secondary'
  
  if (activePreviewOnlyCount > 0) {
    tileSummary = 'Preview Active'
    tileBadge = `${activePreviewOnlyCount}`
    tileBadgeVariant = 'warning'
  } else if (appliedOverrideCount > 0) {
    // If both applied and review, show applied with count
    tileSummary = reviewCount > 0 ? 'Applied' : 'Applied'
    tileBadge = `${appliedOverrideCount}`
    tileBadgeVariant = 'success'
  } else if (reviewCount > 0) {
    tileSummary = 'Review'
    tileBadge = `${reviewCount}`
    tileBadgeVariant = 'warning'
  } else if (nativeMaterializedCount > 0) {
    tileSummary = 'Included'
    // No badge for native only
  }
  
  // Compute banner display
  let bannerHeadline: string | null = null
  let bannerTone: 'applied' | 'preview' | 'review' | 'none' = 'none'
  let bannerBody: string | null = null
  
  if (activePreviewOnlyCount > 0) {
    bannerHeadline = `${activePreviewOnlyCount} Override Preview${activePreviewOnlyCount > 1 ? 's' : ''} Active`
    bannerTone = 'preview'
    bannerBody = appliedOverrideCount > 0 
      ? `${appliedOverrideCount} method${appliedOverrideCount > 1 ? 's' : ''} already applied. Preview${activePreviewOnlyCount > 1 ? 's are' : ' is'} not yet saved.`
      : `Preview${activePreviewOnlyCount > 1 ? 's are' : ' is'} not applied to your saved program.`
  } else if (appliedOverrideCount > 0) {
    bannerHeadline = `${appliedOverrideCount} Method Planner Addition${appliedOverrideCount > 1 ? 's' : ''} Saved`
    bannerTone = 'applied'
    const notAppliedCount = visibleMethodCount - appliedOverrideCount - nativeMaterializedCount
    bannerBody = notAppliedCount > 0 
      ? `${notAppliedCount} other method${notAppliedCount > 1 ? 's' : ''} available to review.` 
      : 'All requested methods are applied.'
  }
  
  // Compact proof line for visible parity verification - use clearer terms
  const notAppliedCount = visibleMethodCount - appliedOverrideCount - nativeMaterializedCount
  const proofLine = `Planner truth: ${appliedOverrideCount} saved · ${activePreviewOnlyCount} preview · ${notAppliedCount > 0 ? notAppliedCount + ' not applied' : 'all applied'}`
  
  return {
    appliedOverrideMethodKeys,
    nativeMaterializedMethodKeys,
    activePreviewOnlyMethodKeys,
    reviewMethodKeys,
    notRequestedMethodKeys,
    visibleMethodKeys,
    appliedOverrideCount,
    nativeMaterializedCount,
    activePreviewOnlyCount,
    reviewCount,
    visibleMethodCount,
    tileSummary,
    tileBadge,
    tileBadgeVariant,
    bannerHeadline,
    bannerTone,
    bannerBody,
    proofLine,
  }
}

// =============================================================================
// [MASTER-8A.2] CANONICAL METHOD PLANNER ROWS
// =============================================================================
// This promotes rows to "Applied" when artifact truth confirms they are applied,
// regardless of stale source state (blocked/not_materialized/etc).

type MethodPlannerRowStatus = 'applied' | 'recommended' | 'caution' | 'high_risk' | 'not_available'

interface CanonicalMethodPlannerRow {
  methodKey: string
  label: string
  status: MethodPlannerRowStatus
  sourceState: RequestedMethodState
  isAppliedByArtifact: boolean
  reason: string
  actionHint: string
  hasPreview: boolean
  sortRank: number
}

/**
 * [MASTER-8A.2] Builds canonical rows that reflect artifact truth.
 * If an artifact proves a method is applied/renderable, the row status MUST be 'applied'
 * regardless of stale source state.
 */
function buildCanonicalMethodPlannerRows(args: {
  program: AdaptiveProgram | null | undefined
  methodItems: RequestedMethodDisplayItem[]
  plannerSummary: CanonicalMethodPlannerSummary
  previews: MethodOverridePreview[]
}): CanonicalMethodPlannerRow[] {
  const { program, methodItems, plannerSummary, previews } = args
  
  const appliedOverrideSet = new Set(plannerSummary.appliedOverrideMethodKeys)
  const previewSet = new Set(plannerSummary.activePreviewOnlyMethodKeys)
  const rows: CanonicalMethodPlannerRow[] = []
  const seenKeys = new Set<string>()
  
  // Process all methodItems first
  for (const item of methodItems) {
    const canonicalKey = normalizeOverrideMethodKey(item.methodKey)
    if (seenKeys.has(canonicalKey)) continue
    seenKeys.add(canonicalKey)
    
    const hasPreview = previewSet.has(canonicalKey)
    const isAppliedByArtifact = appliedOverrideSet.has(canonicalKey)
    
    // Determine status - artifact truth overrides stale source state
    let status: MethodPlannerRowStatus
    let reason: string
    let actionHint: string
    let sortRank: number
    
    if (isAppliedByArtifact) {
      // Artifact truth says applied - this is the fix!
      status = 'applied'
      reason = 'Saved in your program via Method Planner'
      actionHint = 'Already in program'
      sortRank = 0
    } else if (item.state === 'applied' || item.state === 'materialized') {
      // Native/original AI method (not user-applied override)
      status = 'applied'
      reason = 'Included in original program design'
      actionHint = 'Native method'
      sortRank = 1
    } else if (item.state === 'not_requested') {
      status = 'not_available'
      reason = 'Not requested in your skill profile'
      actionHint = 'Update profile to enable'
      sortRank = 400
    } else if (item.state === 'blocked') {
      status = 'high_risk'
      reason = item.reason || 'Currently blocked by program constraints'
      actionHint = 'Tap to see why'
      sortRank = 300
    } else if (hasPreview) {
      // Has preview - classify as recommended/caution based on preview
      status = 'recommended'
      reason = 'Preview available'
      actionHint = 'Tap to review and apply'
      sortRank = 100
    } else if (item.state === 'not_materialized' || item.state === 'deferred' || item.state === 'suppressed') {
      status = 'caution'
      reason = item.reason || 'May be available with tradeoffs'
      actionHint = 'Tap to review tradeoffs'
      sortRank = 200
    } else {
      // Unknown state
      status = 'caution'
      reason = 'Status unclear'
      actionHint = 'Tap for details'
      sortRank = 250
    }
    
    rows.push({
      methodKey: canonicalKey,
      label: item.label,
      status,
      sourceState: item.state,
      isAppliedByArtifact,
      reason,
      actionHint,
      hasPreview,
      sortRank,
    })
  }
  
  // Add any artifact-only applied keys that weren't in methodItems
  // This ensures Applied count matches row count
  for (const key of plannerSummary.appliedOverrideMethodKeys) {
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      // Get label from capability if available
      const capability = getMethodOverrideCapability(key)
      rows.push({
        methodKey: key,
        label: capability?.displayLabel || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        status: 'applied',
        sourceState: 'applied',
        isAppliedByArtifact: true,
        reason: 'Confirmed by saved-program method artifact',
        actionHint: 'Already in program',
        hasPreview: false,
        sortRank: 0,
      })
    }
  }
  
  // Sort: applied first, then by sortRank, then alphabetically
  rows.sort((a, b) => {
    if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank
    return a.label.localeCompare(b.label)
  })
  
  return rows
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

// =============================================================================
// [MASTER-8B.6.1] COACH INTELLIGENCE HUB — 8-TILE CONTRACT INVENTORY
// =============================================================================
// 
// FROZEN TILE COUNT: 8 top-level tiles (do not add more without architecture review)
//
// 1. Skill Map — selected skills, direct/support/maintenance exposure, skill gaps
// 2. Method Decisions — generated method logic and method decision truth
// 3. Adaptive Foundation — readiness, constraints, tissue/joint/safeguard intelligence
// 4. Calibration — benchmark/calibration evidence and test recommendations
// 5. Coach Recs — evidence-derived coach recommendations
// 6. Method Planner — protected method override planner and applied/native method state
// 7. Plan Logic — truth explanation / rule population / goal family balance proof
// 8. Program Balance — read-only skill/movement/anchor/tissue balance and future planning
//
// OUTSIDE SURFACE INVENTORY (for later consolidation):
// - Keep near action path: Start Workout, Today Guidance, injury/substitution warnings
// - Later consolidate into hub: FeedbackLoopProofCard, EvidenceCoachRecommendationCard,
//   standalone CalibrationCheckpointCard, large proof/debug boxes, "why this plan" content
//
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
  /** [MASTER-8C.12A] Dedicated callback for frequency placement apply that saves via saveAdaptiveProgram */
  onApplyFrequencyPlacement?: (
    preview: FrequencySlotPlacementPreview
  ) => Promise<FrequencyPlacementApplyResult>
  /** [MASTER-8C.12B] Selective removal callback for removing specific applied methods */
  onRemoveSelectedPlacements?: (placementIds: string[]) => Promise<SelectiveRemovalResult>
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
  /** [MASTER-8B.6.1] Shows muted styling but allows click to open empty-state sheet */
  sourceUnavailable?: boolean
}

function HubButton({
  icon,
  label,
  summary,
  badge,
  badgeVariant = 'secondary',
  onClick,
  disabled = false,
  sourceUnavailable = false,
}: HubButtonProps) {
  const badgeClasses: Record<string, string> = {
    default: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20',
    secondary: 'bg-[#3A3A4A] text-[#9A9AAA] border-[#4A4A5A]',
    outline: 'bg-transparent text-[#7A7A8A] border-[#3A3A4A]',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  // [MASTER-8B.6.1] sourceUnavailable shows muted styling but is still clickable
  const isMuted = sourceUnavailable && !disabled

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
        isMuted && 'opacity-60',
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
  // [MASTER-8C.12.1A] Frequency placement props
  onApplyFrequencyPlacement,
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
  // [MASTER-8C.12.1A] Frequency placement props
  onApplyFrequencyPlacement?: (preview: FrequencySlotPlacementPreview) => Promise<FrequencyPlacementApplyResult>
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
      
      {/* [MASTER-8C.12.1A] Method-specific frequency controls for row-level methods */}
      {!isAlreadyApplied && (
        <MethodDetailFrequencyControls
          program={program}
          methodKey={plan.methodKey}
          methodLabel={item.label}
          onApplyFrequencyPlacement={onApplyFrequencyPlacement}
        />
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
  // Prefer program-stamped model, but enrich with safeguard/preview intelligence if missing
  if (program.adaptiveFoundationModel) {
    // If canonical model exists but lacks safeguardIntelligence, guardedAdaptationPreview, or evidenceSnapshot, enrich it for display
    const needsEnrichment = !program.adaptiveFoundationModel.safeguardIntelligence || 
                            !program.adaptiveFoundationModel.guardedAdaptationPreview ||
                            !program.adaptiveFoundationModel.evidenceSnapshot
    if (needsEnrichment) {
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
          // [MASTER-8A] Honestly mark evidence as unavailable at client display boundary
          // Pass undefined (not null) to signal "not connected" vs "checked but missing"
          hasWorkoutHistory: false, // Cannot verify from client component
          hasSkillLogs: false,
          hasReadinessData: false,
          recentWorkoutLogs: undefined, // Not connected at this view
          skillLogEvidence: undefined, // Not connected at this view
          readinessEvidence: undefined, // Not connected at this view
          // [MASTER-5/6] Pass sessions for safeguard analysis
          programSessions: program.sessions ?? null,
          jointCautions: null, // Future: wire from profile
        })
        // Return canonical model base with display-enriched safeguard, preview, and evidence
        return {
          model: {
            ...program.adaptiveFoundationModel,
            safeguardIntelligence: program.adaptiveFoundationModel.safeguardIntelligence ?? enrichedModel.safeguardIntelligence,
            guardedAdaptationPreview: program.adaptiveFoundationModel.guardedAdaptationPreview ?? enrichedModel.guardedAdaptationPreview,
            evidenceSnapshot: program.adaptiveFoundationModel.evidenceSnapshot ?? enrichedModel.evidenceSnapshot,
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
      // [MASTER-8A] Honestly mark evidence as unavailable at client display boundary
      hasWorkoutHistory: false,
      hasSkillLogs: false,
      hasReadinessData: false,
      recentWorkoutLogs: undefined, // Not connected at this view
      skillLogEvidence: undefined, // Not connected at this view
      readinessEvidence: undefined, // Not connected at this view
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
          {/* [MASTER-7] Preview status indicator */}
          {model.guardedAdaptationPreview && model.guardedAdaptationPreview.candidates.length > 0 && (
            <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] bg-violet-500/20 text-violet-400">
              Preview ready
            </span>
          )}
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
      
      {/* [MASTER-8A] Evidence Sources / Provenance Section */}
      {model.evidenceSnapshot && (
        <div className="p-3 rounded-lg bg-[#12121A] border border-[#2A2A35]">
          <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Evidence Sources
            <span className={cn(
              'ml-auto px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide',
              model.evidenceSnapshot.status === 'live_evidence_active'
                ? 'bg-emerald-500/20 text-emerald-400'
                : model.evidenceSnapshot.status === 'partial_live_evidence'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-amber-500/20 text-amber-400'
            )}>
              {model.evidenceSnapshot.headline}
            </span>
          </h4>
          <p className="text-[10px] text-[#7A7A8A] mb-3">{model.evidenceSnapshot.summary}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {model.evidenceSnapshot.sources.map((source) => {
              const statusColors: Record<string, string> = {
                'active': 'text-emerald-400',
                'partial': 'text-blue-400',
                'missing': 'text-amber-400',
                'not_connected': 'text-[#5A5A6A]',
              }
              const statusIcons: Record<string, React.ReactNode> = {
                'active': <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
                'partial': <AlertCircle className="w-3 h-3 text-blue-400" />,
                'missing': <XCircle className="w-3 h-3 text-amber-400" />,
                'not_connected': <XCircle className="w-3 h-3 text-[#4A4A5A]" />,
              }
              return (
                <div key={source.key} className="flex items-center gap-1.5 text-[9px]">
                  {statusIcons[source.status] || statusIcons['missing']}
                  <span className={cn('truncate', statusColors[source.status] || 'text-[#8A8A9A]')}>
                    {source.label}
                    {source.count > 0 && <span className="text-[#6A6A7A] ml-1">({source.count})</span>}
                  </span>
                </div>
              )
            })}
          </div>
          {model.evidenceSnapshot.status === 'plan_only' && (
            <p className="mt-2 pt-2 border-t border-[#1A1A22] text-[8px] text-[#5A5A6A]">
              Live workout evidence is not connected to this view yet. Complete workouts to enable evidence-based adaptation.
            </p>
          )}
        </div>
      )}
      
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
      
      {/* [MASTER-7] Guarded Adaptation Preview */}
      {model.guardedAdaptationPreview && model.guardedAdaptationPreview.candidates.length > 0 && (
        <div className="p-3 rounded-lg bg-[#12121A] border border-violet-500/30">
          <h4 className="text-xs font-medium text-[#E6E9EF] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            Guarded Adaptation Preview
            <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] bg-violet-500/20 text-violet-400 uppercase tracking-wide">
              Preview only
            </span>
          </h4>
          <p className="text-[10px] text-[#8A8A9A] mb-3">{model.guardedAdaptationPreview.summary}</p>
          <div className="space-y-3">
            {model.guardedAdaptationPreview.candidates.slice(0, 5).map((candidate) => {
              const statusColors: Record<string, string> = {
                'preview_only': 'bg-violet-500/20 text-violet-400',
                'blocked_needs_evidence': 'bg-amber-500/20 text-amber-400',
                'blocked_requires_user_confirmation': 'bg-blue-500/20 text-blue-400',
                'blocked_no_writer_yet': 'bg-[#2A2A35] text-[#8A8A9A]',
              }
              const statusLabels: Record<string, string> = {
                'preview_only': 'Preview',
                'blocked_needs_evidence': 'Needs data',
                'blocked_requires_user_confirmation': 'Needs confirm',
                'blocked_no_writer_yet': 'Not applied',
              }
              const statusClass = statusColors[candidate.applyStatus] || statusColors['blocked_no_writer_yet']
              const statusLabel = statusLabels[candidate.applyStatus] || 'Blocked'
              
              return (
                <div key={candidate.id} className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-medium text-[#B0B0C0]">{candidate.label}</span>
                    <span className={cn('px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide flex-shrink-0', statusClass)}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#7A7A8A] space-y-0.5">
                    <p><span className="text-[#5A5A6A]">Target:</span> {candidate.target}</p>
                    <p><span className="text-[#5A5A6A]">Trigger:</span> {candidate.trigger}</p>
                    <p className="text-[#6A6A7A]">{candidate.expectedEffect}</p>
                  </div>
                  <p className="mt-1 text-[8px] text-[#5A5A6A]">Blocked: {candidate.blockedReason}</p>
                </div>
              )
            })}
          </div>
          <p className="mt-3 pt-2 border-t border-[#1A1A22] text-[9px] text-[#5A5A6A]">
            {model.guardedAdaptationPreview.nonMutationNote}
          </p>
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

// =============================================================================
// [MASTER-8B.4] PROGRAM BALANCE SHEET CONTENT
// =============================================================================

function getSeverityColor(severity: ProgramBalanceSeverity): string {
  switch (severity) {
    case 'high':
      return 'text-red-400'
    case 'moderate':
      return 'text-amber-400'
    case 'mild':
    case 'watch':
      return 'text-blue-400'
    case 'blocked':
      return 'text-rose-500'
    default:
      return 'text-[#7A7A8A]'
  }
}

function getSeverityBgColor(severity: ProgramBalanceSeverity): string {
  switch (severity) {
    case 'high':
      return 'bg-red-500/10 border-red-500/20'
    case 'moderate':
      return 'bg-amber-500/10 border-amber-500/20'
    case 'mild':
    case 'watch':
      return 'bg-blue-500/10 border-blue-500/20'
    case 'blocked':
      return 'bg-rose-500/10 border-rose-500/20'
    default:
      return 'bg-[#2A2A35] border-[#3A3A45]'
  }
}

function ProgramBalanceSheetContent({
  result,
  generatorKnowledgeProof,
}: {
  result: ProgramBalanceReadOnlyResult
  generatorKnowledgeProof: ProgramGeneratorKnowledgeProof
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  
  // [MASTER-8B.7.1] Mutation preview/confirm state
  const [selectedCandidateForPreview, setSelectedCandidateForPreview] = useState<{
    index: number
    candidate: FutureSessionCandidate
    plan: FutureSessionPlanningDetail | undefined
  } | null>(null)
  const [showMutationPreviewConfirm, setShowMutationPreviewConfirm] = useState(false)
  const [mutationPlanBundle, setMutationPlanBundle] = useState<FutureSessionMutationPlanBundle | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // [MASTER-8B.7.1] Load mutation plans on mount
  useEffect(() => {
    const bundle = loadMutationPlans()
    setMutationPlanBundle(bundle)
  }, [])
  
  // [MASTER-8B.7.1.1] Helper to get confirmed plan for a candidate by index
  const getConfirmedPlanForCandidate = useCallback((candidateIndex: number) => {
    const candidateId = `candidate_${candidateIndex}`
    return mutationPlanBundle?.confirmedPlans?.find(p => p.sourceCandidateId === candidateId) || null
  }, [mutationPlanBundle])

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  // Sort findings by severity
  const sortedFindings = useMemo(() => {
    const severityOrder: Record<ProgramBalanceSeverity, number> = {
      high: 0,
      blocked: 1,
      moderate: 2,
      mild: 3,
      watch: 4,
      none: 5,
    }
    return [...result.findings].sort((a, b) => 
      (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)
    )
  }, [result.findings])

  const highCount = result.findings.filter(f => f.severity === 'high').length
  const moderateCount = result.findings.filter(f => f.severity === 'moderate').length
  const watchCount = result.findings.filter(f => f.severity === 'watch' || f.severity === 'mild').length
  
  // [MASTER-8C.1] Compute current-program coverage truth from result
  // This replaces the hardcoded false and uses actual analyzed program coverage
  const currentProgramKnowledgeCoverageComplete = useMemo(() => {
    return result.knowledgeMissingExerciseCount === 0 && result.analyzedExerciseCount > 0
  }, [result.knowledgeMissingExerciseCount, result.analyzedExerciseCount])

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Status Banner */}
      <div className={cn(
        'p-3 rounded-lg border',
        result.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20' :
        result.status === 'partial' ? 'bg-blue-500/10 border-blue-500/20' :
        'bg-amber-500/10 border-amber-500/20'
      )}>
        <div className="flex items-center gap-2 mb-1">
          <Scale className={cn(
            'w-4 h-4',
            result.status === 'ready' ? 'text-emerald-400' :
            result.status === 'partial' ? 'text-blue-400' :
            'text-amber-400'
          )} />
          <span className="text-sm font-medium text-[#E6E9EF]">
            {result.status === 'ready' ? 'Analysis Ready' :
             result.status === 'partial' ? 'Partial Analysis' :
             'Analysis Unavailable'}
          </span>
          <span className={cn(
            'ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded border',
            'bg-[#2A2A35] border-[#3A3A45] text-[#9A9AAA]'
          )}>
            Read-only
          </span>
        </div>
        <p className="text-xs text-[#7A7A8A]">
          No program changes applied &mdash; this is a read-only analysis.
        </p>
        <p className="text-[10px] text-[#5A5A6A] mt-1">
          Full coaching science: {result.knowledgeCoverageSummary.sourceCounts?.fullScienceSeedTotal ?? result.knowledgeMatchedExerciseCount} exercises | App pool: {result.knowledgeCoverageSummary.sourceCounts?.adaptivePoolTotal ?? '~130'} exercises
        </p>
      </div>

      {/* Proof Strip */}
      <div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
        <div className="flex flex-wrap gap-2 text-[9px] text-[#5A5A6A]">
          {result.proof.consumedKnowledgeSeed && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
              Seed consumed
            </span>
          )}
          {result.proof.consumedRepresentativeSeedOnly && (
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-blue-400/60" />
              Partial seed
            </span>
          )}
          {result.proof.noMutationPerformed && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400/60" />
              No mutation
            </span>
          )}
          {result.proof.noGeneratorChange && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400/60" />
              Generator safe
            </span>
          )}
        </div>
      </div>

      {/* Coverage Summary */}
      <div className="p-3 rounded-lg bg-[#1A1A22]/60 border border-[#2A2A35]">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-3.5 h-3.5 text-[#7A7A8A]" />
          <span className="text-xs font-medium text-[#E6E9EF]">Coverage Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
            <span className="text-[10px] text-[#5A5A6A]">Sessions</span>
            <p className="text-sm font-medium text-[#E6E9EF]">{result.analyzedSessionCount}</p>
          </div>
          <div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
            <span className="text-[10px] text-[#5A5A6A]">Exercises</span>
            <p className="text-sm font-medium text-[#E6E9EF]">{result.analyzedExerciseCount}</p>
          </div>
          <div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
            <span className="text-[10px] text-[#5A5A6A]">Full Science</span>
            <p className="text-sm font-medium text-emerald-400">{result.knowledgeMatchedExerciseCount}</p>
          </div>
          <div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
            <span className="text-[10px] text-[#5A5A6A]">Need Science</span>
            <p className="text-sm font-medium text-amber-400">{result.knowledgeMissingExerciseCount}</p>
          </div>
        </div>
        {result.knowledgeMissingExerciseCount > 0 && (
          <div className="text-[10px] text-[#5A5A6A] mt-2 space-y-0.5">
            {/* MASTER-8C.2: Improved coverage messaging */}
            {result.knowledgeCoverageSummary.trulyUnknownCount !== undefined && result.knowledgeCoverageSummary.trulyUnknownCount > 0 ? (
              <>
                <p>{result.knowledgeCoverageSummary.trulyUnknownCount} exercise(s) not found in any app source.</p>
                {/* MASTER-8C.4.E: Show exact unresolved exercise IDs for diagnosis */}
                {result.knowledgeCoverageSummary.trulyUnknownIds && result.knowledgeCoverageSummary.trulyUnknownIds.length > 0 && (
                  <p className="text-[9px] text-amber-400/80 mt-1">
                    Unresolved: {result.knowledgeCoverageSummary.trulyUnknownIds.slice(0, 3).join(', ')}
                    {result.knowledgeCoverageSummary.trulyUnknownIds.length > 3 && ` (+${result.knowledgeCoverageSummary.trulyUnknownIds.length - 3} more)`}
                  </p>
                )}
              </>
            ) : result.knowledgeCoverageSummary.basicIdentityKnownCount !== undefined && result.knowledgeCoverageSummary.basicIdentityKnownCount > 0 ? (
              <p>{result.knowledgeMissingExerciseCount} exercise(s) in app pool need full coaching science entries.</p>
            ) : (
              <p>{result.knowledgeMissingExerciseCount} exercise(s) need full coaching science entries for safe mutation.</p>
            )}
            {/* MASTER-8C.4.E: Show authoritative need-science IDs for any coverage gap */}
            {result.knowledgeCoverageSummary.unknownExerciseIds && result.knowledgeCoverageSummary.unknownExerciseIds.length > 0 && (
              <p className="text-[9px] text-amber-400/80 mt-1">
                Need science: {result.knowledgeCoverageSummary.unknownExerciseIds.slice(0, 3).join(', ')}
                {result.knowledgeCoverageSummary.unknownExerciseIds.length > 3 && ` (+${result.knowledgeCoverageSummary.unknownExerciseIds.length - 3} more)`}
              </p>
            )}
          </div>
        )}
        {/* MASTER-8C.4.D: Runtime resolver proof */}
        <div className="text-[9px] text-[#3A3A4A] mt-2 pt-2 border-t border-[#1A1A22] flex justify-between items-center">
          <span>Resolver: identity/full-science (8C.4.D)</span>
          <span>
            {result.knowledgeCoverageSummary.fullScienceKnownCount ?? '?'}+{result.knowledgeCoverageSummary.aliasResolvedCount ?? '?'} = {result.knowledgeMatchedExerciseCount}/{result.analyzedExerciseCount}
          </span>
        </div>
      </div>

      {/* [MASTER-8C.6] Generator DB Consumption Proof */}
      <div className="p-3 rounded-lg bg-[#1A1A22]/60 border border-[#2A2A35]">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5 text-[#7A7A8A]" />
          <span className="text-xs font-medium text-[#E6E9EF]">Generator DB Consumption</span>
          <div className="flex gap-1 ml-auto">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Read-only
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
              Selector bridge
            </span>
          </div>
        </div>
        {generatorKnowledgeProof.verdict === 'unavailable' ? (
          <div className="text-[10px] text-[#5A5A6A]">
            Generator proof unavailable — selector bridge not found on saved program
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
                <span className="text-[10px] text-[#5A5A6A]">Sessions</span>
                <p className="text-sm font-medium text-[#E6E9EF]">
                  {generatorKnowledgeProof.sessionsWithProof}/{generatorKnowledgeProof.sessionCount}
                </p>
              </div>
              <div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
                <span className="text-[10px] text-[#5A5A6A]">Exercises Matched</span>
                <p className={`text-sm font-medium ${
                  generatorKnowledgeProof.verdict === 'ready' ? 'text-emerald-400' : 
                  generatorKnowledgeProof.verdict === 'partial' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {generatorKnowledgeProof.matchedExercises}/{generatorKnowledgeProof.totalSelectedExercises}
                </p>
              </div>
            </div>
            <div className="text-[9px] text-[#3A3A4A] mt-2 pt-2 border-t border-[#1A1A22]">
              <p>Mode: {generatorKnowledgeProof.mode}</p>
              <p>No workout structure changed</p>
            </div>
          </>
        )}
      </div>

      {/* Findings Summary */}
      {sortedFindings.length > 0 && (
        <div className="p-3 rounded-lg bg-[#1A1A22]/60 border border-[#2A2A35]">
          <button
            onClick={() => toggleSection('findings')}
            className="flex items-center gap-2 w-full text-left"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-[#E6E9EF] flex-1">
              Balance Findings
            </span>
            <div className="flex gap-1">
              {highCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                  {highCount} high
                </span>
              )}
              {moderateCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {moderateCount} moderate
                </span>
              )}
              {watchCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  {watchCount} watch
                </span>
              )}
            </div>
            <ChevronRight className={cn(
              'w-3 h-3 text-[#5A5A6A] transition-transform',
              expandedSection === 'findings' && 'rotate-90'
            )} />
          </button>
          {expandedSection === 'findings' && (
            <div className="mt-3 space-y-2">
              {sortedFindings.map((finding, idx) => (
                <div
                  key={finding.id || idx}
                  className={cn(
                    'p-2 rounded border',
                    getSeverityBgColor(finding.severity)
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className={cn('w-3 h-3 mt-0.5 shrink-0', getSeverityColor(finding.severity))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#E6E9EF]">{finding.title}</p>
                      <p className="text-[10px] text-[#7A7A8A] mt-0.5">{finding.summary}</p>
                      {finding.readOnlyRecommendation && (
                        <p className="text-[10px] text-[#9A9AAA] mt-1 italic">
                          {finding.readOnlyRecommendation}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={cn(
                          'text-[8px] px-1 py-0.5 rounded border',
                          getSeverityBgColor(finding.severity),
                          getSeverityColor(finding.severity)
                        )}>
                          {finding.severity}
                        </span>
                        {finding.futureMutationCandidate && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-[#2A2A35] border border-[#3A3A45] text-[#7A7A8A]">
                            Candidate only
                          </span>
                        )}
                        {!finding.mutationAllowedNow && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-[#2A2A35] border border-[#3A3A45] text-[#7A7A8A]">
                            Not applied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skill Expression */}
      {result.skillExpression.length > 0 && (
        <div className="p-3 rounded-lg bg-[#1A1A22]/60 border border-[#2A2A35]">
          <button
            onClick={() => toggleSection('skills')}
            className="flex items-center gap-2 w-full text-left"
          >
            <Target className="w-3.5 h-3.5 text-[#E63946]" />
            <span className="text-xs font-medium text-[#E6E9EF] flex-1">
              Skill Expression ({result.skillExpression.length} skills)
            </span>
            <ChevronRight className={cn(
              'w-3 h-3 text-[#5A5A6A] transition-transform',
              expandedSection === 'skills' && 'rotate-90'
            )} />
          </button>
          {expandedSection === 'skills' && (
            <div className="mt-3 space-y-2">
              {result.skillExpression.map((skill, idx) => (
                <div
                  key={skill.skillId || idx}
                  className={cn(
                    'p-2 rounded border',
                    getSeverityBgColor(skill.severity)
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#E6E9EF]">{skill.skillName}</span>
                    <span className={cn(
                      'text-[8px] px-1 py-0.5 rounded border',
                      skill.expressionStatus === 'direct_primary' || skill.expressionStatus === 'direct_secondary'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : skill.expressionStatus === 'support_only' || skill.expressionStatus === 'maintenance_only'
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    )}>
                      {skill.expressionStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-[#7A7A8A]">
                    <span>Direct: {skill.directExposureCount}</span>
                    <span>Support: {skill.supportExposureCount}</span>
                    <span>Maint: {skill.maintenanceExposureCount}</span>
                  </div>
                  {skill.rationale && (
                    <p className="text-[10px] text-[#5A5A6A] mt-1">{skill.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Movement Family Balance */}
      {result.movementFamilySummary.length > 0 && (
        <div className="p-3 rounded-lg bg-[#1A1A22]/60 border border-[#2A2A35]">
          <button
            onClick={() => toggleSection('movement')}
            className="flex items-center gap-2 w-full text-left"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-[#E6E9EF] flex-1">
              Movement Families ({result.movementFamilySummary.length})
            </span>
            <ChevronRight className={cn(
              'w-3 h-3 text-[#5A5A6A] transition-transform',
              expandedSection === 'movement' && 'rotate-90'
            )} />
          </button>
          {expandedSection === 'movement' && (
            <div className="mt-3 space-y-2">
              {result.movementFamilySummary.map((family, idx) => (
                <div
                  key={family.family || idx}
                  className={cn(
                    'p-2 rounded border',
                    getSeverityBgColor(family.severity)
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#E6E9EF] capitalize">
                      {family.family.replace(/_/g, ' ')}
                    </span>
                    <span className={cn('text-[8px] px-1 py-0.5 rounded border', getSeverityBgColor(family.severity), getSeverityColor(family.severity))}>
                      {family.severity}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-[#7A7A8A]">
                    <span>Exposures: {family.exposureCount}</span>
                    <span>Hard: {family.hardExposureCount}</span>
                    {family.consecutiveDayStreak > 1 && (
                      <span>Streak: {family.consecutiveDayStreak}d</span>
                    )}
                  </div>
                  {family.rationale && (
                    <p className="text-[10px] text-[#5A5A6A] mt-1">{family.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weighted Anchor Status */}
      <div className="p-3 rounded-lg bg-[#1A1A22]/60 border border-[#2A2A35]">
        <button
          onClick={() => toggleSection('anchors')}
          className="flex items-center gap-2 w-full text-left"
        >
          <Activity className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-[#E6E9EF] flex-1">
            Weighted Anchors
          </span>
          <ChevronRight className={cn(
            'w-3 h-3 text-[#5A5A6A] transition-transform',
            expandedSection === 'anchors' && 'rotate-90'
          )} />
        </button>
        {expandedSection === 'anchors' && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className={cn(
                'p-2 rounded border',
                result.weightedAnchorSummary.weightedPullUpPresent
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              )}>
                <span className="text-[10px] text-[#7A7A8A]">Weighted Pull-up</span>
                <p className={cn(
                  'text-xs font-medium',
                  result.weightedAnchorSummary.weightedPullUpPresent ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {result.weightedAnchorSummary.weightedPullUpPresent ? 'Present' : 'Missing'}
                </p>
                <span className="text-[9px] text-[#5A5A6A]">
                  {result.weightedAnchorSummary.pullAnchorStatus.replace(/_/g, ' ')}
                </span>
              </div>
              <div className={cn(
                'p-2 rounded border',
                result.weightedAnchorSummary.weightedDipPresent
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              )}>
                <span className="text-[10px] text-[#7A7A8A]">Weighted Dip</span>
                <p className={cn(
                  'text-xs font-medium',
                  result.weightedAnchorSummary.weightedDipPresent ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {result.weightedAnchorSummary.weightedDipPresent ? 'Present' : 'Missing'}
                </p>
                <span className="text-[9px] text-[#5A5A6A]">
                  {result.weightedAnchorSummary.dipAnchorStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            {result.weightedAnchorSummary.missingReason && (
              <p className="text-[10px] text-[#5A5A6A]">
                {result.weightedAnchorSummary.missingReason}
              </p>
            )}
            {result.weightedAnchorSummary.rationale && (
              <p className="text-[10px] text-[#7A7A8A]">
                {result.weightedAnchorSummary.rationale}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tissue Stress Summary */}
      {result.tissueStressSummary.length > 0 && (
        <div className="p-3 rounded-lg bg-[#1A1A22]/60 border border-[#2A2A35]">
          <button
            onClick={() => toggleSection('tissue')}
            className="flex items-center gap-2 w-full text-left"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-medium text-[#E6E9EF] flex-1">
              Tissue Stress ({result.tissueStressSummary.length} regions)
            </span>
            <ChevronRight className={cn(
              'w-3 h-3 text-[#5A5A6A] transition-transform',
              expandedSection === 'tissue' && 'rotate-90'
            )} />
          </button>
          {expandedSection === 'tissue' && (
            <div className="mt-3 space-y-2">
              {result.tissueStressSummary.map((tissue, idx) => (
                <div
                  key={tissue.region || idx}
                  className={cn(
                    'p-2 rounded border',
                    getSeverityBgColor(tissue.severity)
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#E6E9EF] capitalize">
                      {tissue.region.replace(/_/g, ' ')}
                    </span>
                    <span className={cn('text-[8px] px-1 py-0.5 rounded border', getSeverityBgColor(tissue.severity), getSeverityColor(tissue.severity))}>
                      {tissue.severity}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-[#7A7A8A]">
                    <span>Exposures: {tissue.exposureCount}</span>
                    <span>High stress: {tissue.highStressExposureCount}</span>
                    {tissue.consecutiveExposureDays > 1 && (
                      <span>Consecutive: {tissue.consecutiveExposureDays}d</span>
                    )}
                  </div>
                  {tissue.rationale && (
                    <p className="text-[10px] text-[#5A5A6A] mt-1">{tissue.rationale}</p>
                  )}
                  {tissue.futureSafeguardNeed && (
                    <p className="text-[10px] text-amber-400/80 mt-1 italic">
                      {tissue.futureSafeguardNeed}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Future Session Candidates - MASTER-8B.6: Enhanced planning display */}
      {result.futureSessionCandidates.length > 0 && (() => {
        // [MASTER-8B.7.2] Compute eligibility summary for section header
        // [MASTER-8C.1] Use computed coverage truth instead of hardcoded false
        const eligibilitySummary = mutationPlanBundle 
          ? getEligibilitySummary(mutationPlanBundle, {
              knownExerciseCoverageComplete: currentProgramKnowledgeCoverageComplete,
              structuralWriterEnabled: false,
            })
          : null
        
        return (
        <div className="p-3 rounded-lg bg-[#1A1A22]/60 border border-[#2A2A35]">
          <button
            onClick={() => toggleSection('future')}
            className="flex items-center gap-2 w-full text-left"
          >
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-[#E6E9EF] flex-1">
              Future Candidates ({result.futureSessionCandidates.length})
            </span>
            {mutationPlanBundle?.hasConfirmedPlans ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                {eligibilitySummary?.summaryText || `${mutationPlanBundle.confirmedPlans.length} queued`}
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A35] border border-[#3A3A45] text-[#7A7A8A]">
                Read-only
              </span>
            )}
            <ChevronRight className={cn(
              'w-3 h-3 text-[#5A5A6A] transition-transform',
              expandedSection === 'future' && 'rotate-90'
            )} />
          </button>
          {expandedSection === 'future' && (
            <div className="mt-3 space-y-3">
              {result.futureSessionCandidates.map((candidate, idx) => {
                const plan = candidate.planningDetail
                const confirmedPlan = getConfirmedPlanForCandidate(idx)
                const isUserConfirmed = !!confirmedPlan?.userConfirmed
                const isBlockedNeedsFullDb = confirmedPlan?.status === 'blocked_needs_full_db'
                const isQueuedTargetUnresolved = confirmedPlan?.status === 'queued_target_unresolved'
                const isConfirmedMarkerOnly = confirmedPlan?.status === 'confirmed_marker_only'
                
                // [MASTER-8B.7.2] Resolve structural eligibility for this candidate
                // [MASTER-8C.1] Use computed coverage truth instead of hardcoded false
                const eligibility = resolveFutureSessionMutationEligibility(confirmedPlan, {
                  knownExerciseCoverageComplete: currentProgramKnowledgeCoverageComplete,
                  structuralWriterEnabled: false, // MASTER-8B.7.3+ not yet enabled
                })
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-lg border space-y-2",
                      isUserConfirmed 
                        ? "bg-cyan-500/5 border-cyan-500/20" 
                        : "bg-[#0A0A0D] border-[#1A1A22]"
                    )}
                  >
                    {/* Coach Title */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-[#E6E9EF] flex-1">
                        {plan?.coachTitle || candidate.candidateType.replace(/_/g, ' ')}
                      </span>
                      {isUserConfirmed ? (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 shrink-0">
                          {isBlockedNeedsFullDb ? 'Queued' : isQueuedTargetUnresolved ? 'Queued' : 'Confirmed'}
                        </span>
                      ) : (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                          Read-only
                        </span>
                      )}
                    </div>
                    
                    {/* Trigger / Problem */}
                    {plan?.triggerSummary && (
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-[#6A6A7A] font-medium">Problem detected:</p>
                        <p className="text-[10px] text-[#9A9AA8]">{plan.triggerSummary}</p>
                      </div>
                    )}
                    
                    {/* Proposed Future Action */}
                    {plan?.proposedChangeSummary && (
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-[#6A6A7A] font-medium">Proposed future action:</p>
                        <p className="text-[10px] text-[#8A8A9A]">{plan.proposedChangeSummary}</p>
                      </div>
                    )}
                    
                    {/* Preserve / Guardrails */}
                    {plan?.preserveSummary && (
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-emerald-400/80 font-medium">Preservation guardrails:</p>
                        <p className="text-[10px] text-emerald-300/60">{plan.preserveSummary}</p>
                      </div>
                    )}
                    
                    {/* Target Scope */}
                    <div className="text-[10px] text-[#6A6A7A]">
                      {plan?.affectedFutureDayIndexes && plan.affectedFutureDayIndexes.length > 0 ? (
                        <span>Target: Day {plan.affectedFutureDayIndexes.join(', Day ')}</span>
                      ) : (
                        <span>Target: Future session boundary not resolved yet</span>
                      )}
                    </div>
                    
                    {/* Blocked Reason */}
                    {plan?.blockedReason && (
                      <div className="p-2 rounded bg-amber-500/5 border border-amber-500/15">
                        <p className="text-[9px] text-amber-400/80 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{plan.blockedReason}</span>
                        </p>
                      </div>
                    )}
                    
                    {/* Data Needed */}
                    {plan?.dataNeeded && plan.dataNeeded.length > 0 && (
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-[#5A5A6A] font-medium">Data needed:</p>
                        <ul className="text-[9px] text-[#5A5A6A] pl-2 space-y-0.5">
                          {plan.dataNeeded.slice(0, 3).map((item, i) => (
                            <li key={i}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Status Chips — MASTER-8B.7 writer design proof */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {isUserConfirmed ? (
                        <>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                            8B.7.1 queued
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            User confirmed
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2A2A35] border border-[#3A3A45] text-[#6A6A7A]">
                            Future sessions only
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2A2A35] border border-[#3A3A45] text-[#6A6A7A]">
                            Marker only
                          </span>
                          {isBlockedNeedsFullDb && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400/80">
                              Needs full DB
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            8B.7 design
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2A2A35] border border-[#3A3A45] text-[#6A6A7A]">
                            User-confirmed only
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2A2A35] border border-[#3A3A45] text-[#6A6A7A]">
                            Future sessions only
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#2A2A35] border border-[#3A3A45] text-[#6A6A7A]">
                            No saved change
                          </span>
                          {candidate.requiresFullKnowledgeBase && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400/80">
                              Needs full DB
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* [MASTER-8B.7.1.1] Confirmed/Queued Notice */}
                    {isUserConfirmed && confirmedPlan && (
                      <div className="p-2 rounded bg-cyan-500/5 border border-cyan-500/20">
                        <p className="text-[9px] text-cyan-400 flex items-start gap-1.5">
                          <Check className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>
                            {isBlockedNeedsFullDb 
                              ? 'Plan queued after confirmation — full exercise DB required before structural changes.'
                              : isQueuedTargetUnresolved
                                ? 'Plan queued after confirmation — target future session still unresolved.'
                                : 'Mutation plan confirmed — marker-only proof saved; workout structure unchanged.'}
                          </span>
                        </p>
                      </div>
                    )}
                    
                    {/* [MASTER-8B.7.2] Structural Eligibility Block */}
                    {isUserConfirmed && eligibility && (
                      <div className="p-2 rounded bg-[#0F0F12] border border-[#2A2A35] space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-[#5A5A6A]" />
                          <span className="text-[9px] font-medium text-[#8A8A9A]">Structural eligibility</span>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded",
                            eligibility.canPreviewStructuralMutation
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                          )}>
                            {eligibility.canPreviewStructuralMutation ? 'Preview eligible' : 'Blocked'}
                          </span>
                        </div>
                        
                        {eligibility.blockedReasons.length > 0 && (
                          <ul className="text-[9px] text-[#6A6A7A] pl-4 space-y-0.5">
                            {eligibility.blockedReasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-400/60">-</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        <div className="flex items-center gap-1 pt-1 border-t border-[#1A1A22]">
                          <ArrowRight className="w-2.5 h-2.5 text-[#5A5A6A]" />
                          <span className="text-[8px] text-[#5A5A6A]">
                            Next gate: {eligibility.nextRequiredGate.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* MASTER-8B.7 Writer Gate Notice */}
                    <div className="mt-1 p-1.5 rounded bg-[#1A1A22] border border-[#2A2A35]">
                      <p className="text-[8px] text-[#5A5A6A] leading-relaxed">
                        Program cards unchanged · Live workout later (8B.8)
                      </p>
                    </div>
                    
                    {/* [MASTER-8B.7.1] Preview Mutation Plan Button */}
                    <div className="pt-2 border-t border-[#1A1A22]">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full h-7 text-[10px]",
                          isUserConfirmed
                            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/40"
                            : "bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                        )}
                        onClick={() => {
                          // [MASTER-8B.7.1.1] Pre-populate confirmation state if already confirmed
                          if (confirmedPlan) {
                            setConfirmationResult({
                              success: true,
                              message: confirmedPlan.honestUserLabel,
                            })
                          } else {
                            setConfirmationResult(null)
                          }
                          setSelectedCandidateForPreview({
                            index: idx,
                            candidate,
                            plan,
                          })
                          setShowMutationPreviewConfirm(true)
                        }}
                      >
                        {isUserConfirmed ? 'Review queued plan' : 'Preview mutation plan'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        )
      })()}

      {/* Missing Data */}
      {result.missingData.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-[#E6E9EF]">Missing Data</span>
          </div>
          <ul className="space-y-1">
            {result.missingData.slice(0, 5).map((item, idx) => (
              <li key={idx} className="text-[10px] text-[#7A7A8A] flex items-start gap-1">
                <span className="text-amber-400/60">•</span>
                {item}
              </li>
            ))}
            {result.missingData.length > 5 && (
              <li className="text-[10px] text-[#5A5A6A]">
                ...and {result.missingData.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}
      
      {/* Next Step — MASTER-8B.7.2 Status */}
<div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22] text-[9px] text-[#5A5A6A]">
          {mutationPlanBundle?.hasConfirmedPlans ? (() => {
            // [MASTER-8C.1] Use computed coverage truth
            const summary = getEligibilitySummary(mutationPlanBundle, {
              knownExerciseCoverageComplete: currentProgramKnowledgeCoverageComplete,
              structuralWriterEnabled: false,
            })
          return (
            <span className="text-cyan-400">
              {summary.summaryText} — no workout structure changed
            </span>
          )
        })() : (
          <span>Current status: MASTER-8B.7.2 eligibility gate — preview a Future Candidate to stage a marker-only mutation plan</span>
        )}
      </div>
      
      {/* [MASTER-8B.7.1] Mutation Preview Confirmation Modal */}
      {showMutationPreviewConfirm && selectedCandidateForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0F0F12] border border-[#2A2A35] rounded-lg max-w-md w-full p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#E6E9EF]">Confirm Mutation Plan</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setShowMutationPreviewConfirm(false)
                  setSelectedCandidateForPreview(null)
                  setConfirmationResult(null)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Candidate Summary */}
            <div className="space-y-2 p-3 rounded bg-[#1A1A22] border border-[#2A2A35]">
              <p className="text-xs font-medium text-[#E6E9EF]">
                {selectedCandidateForPreview.plan?.coachTitle || selectedCandidateForPreview.candidate.candidateType.replace(/_/g, ' ')}
              </p>
              {selectedCandidateForPreview.plan?.triggerSummary && (
                <p className="text-[10px] text-[#9A9AA8]">{selectedCandidateForPreview.plan.triggerSummary}</p>
              )}
              {selectedCandidateForPreview.plan?.proposedChangeSummary && (
                <p className="text-[10px] text-[#7A7A8A]">{selectedCandidateForPreview.plan.proposedChangeSummary}</p>
              )}
            </div>
            
            {/* Safety Guarantees */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-emerald-400">Safety guarantees:</p>
              <ul className="text-[9px] text-[#8A8A9A] space-y-1 pl-2">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Completed sessions protected</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Future sessions only</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-cyan-400" />
                  <span>Program Card marker only — no exercise changes yet</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-cyan-400" />
                  <span>Live Workout bridge pending (8B.8)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-cyan-400" />
                  <span>Start Workout unchanged</span>
                </li>
              </ul>
            </div>
            
            {/* Target Info */}
            <div className="p-2 rounded bg-[#0A0A0D] border border-[#1A1A22]">
              <p className="text-[9px] text-[#6A6A7A]">
                {selectedCandidateForPreview.plan?.affectedFutureDayIndexes && selectedCandidateForPreview.plan.affectedFutureDayIndexes.length > 0 
                  ? `Target: Day ${selectedCandidateForPreview.plan.affectedFutureDayIndexes.join(', Day ')} (future session)`
                  : 'Target: Future session boundary not resolved — plan will be queued'}
              </p>
            </div>
            
            {/* [MASTER-8B.7.2] Structural Eligibility Line */}
            {confirmationResult?.success && (() => {
              const candidateId = `candidate_${selectedCandidateForPreview.index}`
              const plan = mutationPlanBundle?.confirmedPlans?.find(p => p.sourceCandidateId === candidateId)
              // [MASTER-8C.1] Use computed coverage truth
              const elig = resolveFutureSessionMutationEligibility(plan, {
                knownExerciseCoverageComplete: currentProgramKnowledgeCoverageComplete,
                structuralWriterEnabled: false,
              })
              return (
                <div className="p-2 rounded bg-[#0F0F12] border border-[#2A2A35]">
                  <p className="text-[9px] text-[#6A6A7A] flex items-center gap-1.5">
                    <Database className="w-3 h-3" />
                    <span>Structural eligibility: </span>
                    <span className={elig.canPreviewStructuralMutation ? 'text-emerald-400' : 'text-amber-400'}>
                      {elig.canPreviewStructuralMutation ? 'preview eligible' : 'blocked'}
                    </span>
                    <span>— {elig.nextRequiredGate.replace(/_/g, ' ')}</span>
                  </p>
                </div>
              )
            })()}
            
            {/* Confirmation Result */}
            {confirmationResult && (
              <div className={cn(
                'p-2 rounded text-[10px]',
                confirmationResult.success 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              )}>
                {confirmationResult.message}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => {
                  setShowMutationPreviewConfirm(false)
                  setSelectedCandidateForPreview(null)
                  setConfirmationResult(null)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={!!confirmationResult?.success}
                onClick={() => {
                  const candidate = selectedCandidateForPreview.candidate
                  const plan = selectedCandidateForPreview.plan
                  const targetDays = plan?.affectedFutureDayIndexes || []
                  const targetResolved = targetDays.length > 0
                  
                  const confirmedPlan = createConfirmedPlan(
                    `candidate_${selectedCandidateForPreview.index}`,
                    plan?.coachTitle || candidate.candidateType.replace(/_/g, ' '),
                    candidate.candidateType,
                    plan?.triggerSummary || candidate.rationale || 'Balance finding detected',
                    plan?.proposedChangeSummary || 'Future adjustment proposed',
                    targetDays,
                    targetResolved,
                    candidate.requiresFullKnowledgeBase || false
                  )
                  
                  const result = addConfirmedPlan(confirmedPlan)
                  
                  if (result.success) {
                    setMutationPlanBundle(result.bundle)
                    setConfirmationResult({
                      success: true,
                      message: confirmedPlan.honestUserLabel,
                    })
                  } else {
                    setConfirmationResult({
                      success: false,
                      message: 'Failed to save mutation plan',
                    })
                  }
                }}
              >
                {confirmationResult?.success ? 'Confirmed' : 'Confirm Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    )
}

// =============================================================================
// [MASTER-8C.7] METHOD CONTRACT FOUNDATION SECTION
// =============================================================================

// =============================================================================
// [MASTER-8C.12.2] AFFECTED DAY PREVIEW CARD
// =============================================================================

/**
 * [MASTER-8C.12.2] Compact card showing how a method will blend into a workout day.
 * Shows the target exercise, surrounding exercises, before/after state, and why chosen.
 */
function AffectedDayPreviewCard({
  target,
  methodLabel,
  isExpanded: defaultExpanded = false,
}: {
  target: FrequencySlotPlacementTarget
  methodLabel: string
  isExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <div className="rounded-lg bg-[#0F0F12] border border-[#2A2A35] overflow-hidden">
      {/* Compact header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-2 text-left hover:bg-[#1A1A22]/50 transition-colors"
      >
        <span className="text-[9px] font-medium text-emerald-400 shrink-0 min-w-[40px]">
          {target.dayTitle}
        </span>
        <span className="text-[10px] text-[#E6E9EF] truncate flex-1">
          {target.exerciseNames[0]}
        </span>
        <span className="text-[9px] text-[#6A6A7A] shrink-0 max-w-[120px] truncate">
          {target.whyChosen}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-[#6A6A7A] shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[#6A6A7A] shrink-0" />
        )}
      </button>
      
      {/* Expanded affected-day preview */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-2 border-t border-[#2A2A35]/50">
          {/* Session focus */}
          {target.sessionFocus && (
            <div className="pt-2 flex items-center gap-1.5">
              <Target className="w-3 h-3 text-[#6A6A7A]" />
              <span className="text-[9px] text-[#8A8A9A]">{target.sessionFocus}</span>
            </div>
          )}
          
          {/* Before → After transformation */}
          <div className="flex items-center gap-2 text-[9px]">
            <span className="text-[#6A6A7A]">Before:</span>
            <span className="text-[#8A8A9A]">{target.previewBefore}</span>
            <ArrowRight className="w-3 h-3 text-emerald-400/60" />
            <span className="text-[#6A6A7A]">After:</span>
            <span className="text-emerald-400 font-medium">{methodLabel}</span>
          </div>
          
          {/* Nearby exercises context */}
          {target.nearbyExercises.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] text-[#6A6A7A]">Surrounding exercises:</span>
              <div className="flex flex-wrap gap-1">
                {target.nearbyExercises.map((ex, i) => (
                  <span 
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1A22] text-[#8A8A9A] border border-[#2A2A35]"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Day method load status */}
          <div className="flex items-center gap-3 text-[9px]">
            {target.isFirstPlacementOnDay ? (
              <span className="flex items-center gap-1 text-emerald-400/80">
                <Check className="w-3 h-3" />
                First method on this day
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400/80">
                <AlertTriangle className="w-3 h-3" />
                Stacked placement
              </span>
            )}
            {target.dayMethodLoad > 0 && (
              <span className="text-[#6A6A7A]">
                {target.dayMethodLoad} existing method{target.dayMethodLoad > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Caution reasons if any */}
          {target.cautionReasons.length > 0 && (
            <div className="space-y-0.5">
              {target.cautionReasons.map((reason, i) => (
                <p key={i} className="text-[9px] text-amber-400/70 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {reason}
                </p>
              ))}
            </div>
          )}
          
          {/* Confidence badge */}
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-[9px] px-1.5 py-0.5 rounded',
              target.confidence === 'high' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : target.confidence === 'medium'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-[#2A2A35] text-[#6A6A7A] border border-[#3A3A4A]'
            )}>
              {target.confidence} confidence
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// [MASTER-8C.12.1A] METHOD DETAIL FREQUENCY CONTROLS
// =============================================================================

interface MethodDetailFrequencyControlsProps {
  program: AdaptiveProgram | null
  methodKey: string
  methodLabel: string
  onApplyFrequencyPlacement?: (preview: FrequencySlotPlacementPreview) => Promise<FrequencyPlacementApplyResult>
}

/**
 * [MASTER-8C.12.1A] Method-specific frequency controls inside method detail view.
 * This allows users to select frequency and preview targets for a single selected method.
 * Replaces the need to use the standalone frequency list for row-level methods.
 */
function MethodDetailFrequencyControls({
  program,
  methodKey,
  methodLabel,
  onApplyFrequencyPlacement,
}: MethodDetailFrequencyControlsProps) {
  const [selectedFrequency, setSelectedFrequency] = useState(0)
  const [isApplying, setIsApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<FrequencyPlacementApplyResult | null>(null)
  
  // Build the slot eligibility plan to check if this method supports frequency placement
  const frequencyPlan = useMemo(() => {
    if (!program) return null
    return buildMethodSlotEligibilityFrequencyPlan(program)
  }, [program])
  
  // Find this method in the plan
  const methodFrequencyPreview = useMemo(() => {
    if (!frequencyPlan) return null
    return frequencyPlan.methods.find(m => m.canonicalKey === methodKey) ?? null
  }, [frequencyPlan, methodKey])
  
  // Check if this method supports frequency placement
  const isSupported = isMethodSupportedForFrequencyApply(methodKey)
  const safeMax = methodFrequencyPreview?.safeMaxFrequency ?? 0
  const isBlocked = !isSupported || safeMax === 0 || 
    methodFrequencyPreview?.frequencyPreviewStatus === 'blocked'
  
  // Get blocked reason for display
  const blockedReason = useMemo(() => {
    if (!methodFrequencyPreview) return 'Method not found in frequency plan'
    if (methodFrequencyPreview.blockedReason) return methodFrequencyPreview.blockedReason
    if (!isSupported) return 'This method uses structural apply, not row-level frequency'
    if (safeMax === 0) return 'No eligible slots available'
    return null
  }, [methodFrequencyPreview, isSupported, safeMax])
  
  // Build placement preview when frequency is selected
  const placementPreview = useMemo(() => {
    if (!program || selectedFrequency === 0) return null
    return buildFrequencySlotPlacementPreview({
      program,
      methodKey: methodKey as CanonicalMethodFamily,
      requestedFrequency: selectedFrequency,
      existingPlan: frequencyPlan ?? undefined,
    })
  }, [program, methodKey, selectedFrequency, frequencyPlan])
  
  // Handle apply
  const handleApply = async () => {
    if (!placementPreview || !onApplyFrequencyPlacement) return
    setIsApplying(true)
    setApplyResult(null)
    
    try {
      const result = await onApplyFrequencyPlacement(placementPreview)
      setApplyResult(result)
      
      if (result.status === 'success' || result.status === 'partial_success') {
        setSelectedFrequency(0)
      }
    } catch (error) {
      setApplyResult({
        status: 'blocked',
        visibleSummary: error instanceof Error ? error.message : 'Apply failed',
        evidence: ['Exception during apply'],
        appliedCount: 0,
        blockedCount: selectedFrequency,
        methodKey: methodKey,
        displayLabel: methodLabel,
        requestedFrequency: selectedFrequency,
        targetedDays: [],
        targetedExercises: [],
        blockedReasons: ['Exception during apply'],
        programChanged: false,
        persistRequired: false,
        liveWorkoutChanged: false as const,
        completedSessionsProtected: true as const,
        existingSavedArtifactsPreserved: true as const,
      })
    } finally {
      setIsApplying(false)
    }
  }
  
  // Don't render if callback not available
  if (!onApplyFrequencyPlacement) return null
  
  // If method is blocked, show compact message
  if (isBlocked) {
    const isStructuralMethod = ['superset', 'circuit', 'density_block'].includes(methodKey)
    
    // [MASTER-8C.12.1E] Method-specific messaging for structural methods
    const getStructuralMessage = () => {
      if (methodKey === 'circuit') {
        return `Circuits use the structural Method Planner apply flow above, not row-level frequency placement.`
      }
      if (methodKey === 'superset') {
        return `Superset needs structural pair writer before frequency placement.`
      }
      if (methodKey === 'density_block') {
        return `Density Block needs timed/sequence runtime, logging, and save/reload support.`
      }
      return `${methodLabel} uses the structural apply flow above, not row-level frequency.`
    }
    
    return (
      <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-3.5 h-3.5 text-[#6A6A7A]" />
          <span className="text-[10px] font-medium text-[#8A8A9A]">
            {isStructuralMethod ? 'Structural Apply' : 'Frequency Placement'}
          </span>
        </div>
        <p className="text-[10px] text-[#6A6A7A] leading-relaxed">
          {isStructuralMethod 
            ? getStructuralMessage()
            : blockedReason ?? 'Not available for frequency placement.'
          }
        </p>
      </div>
    )
  }
  
  return (
    <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-medium text-[#E6E9EF]">Add Weekly Frequency</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Row-level
        </span>
      </div>
      
      {/* Apply result banner */}
      {applyResult && (
        <div className={cn(
          'mb-3 p-2 rounded text-[10px]',
          applyResult.status === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : applyResult.status === 'partial_success'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
        )}>
          {applyResult.visibleSummary}
        </div>
      )}
      
      {/* Frequency chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Array.from({ length: safeMax + 1 }, (_, i) => (
          <button
            key={i}
            onClick={() => { setSelectedFrequency(i); setApplyResult(null); }}
            className={cn(
              'px-2.5 py-1 text-[10px] rounded border transition-colors',
              selectedFrequency === i
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-[#2A2A35] text-[#8A8A9A] border-[#3A3A4A] hover:border-[#4A4A5A]'
            )}
          >
            {i}x
          </button>
        ))}
      </div>
      
      {/* Preview targets */}
      {placementPreview && selectedFrequency > 0 && (
        <div className="space-y-2">
          {placementPreview.targets.length > 0 ? (
            <>
              <p className="text-[10px] text-[#8A8A9A]">
                Proposed targets for {methodLabel}:
              </p>
              {/* [MASTER-8C.12.2] Enhanced affected-day preview cards */}
              <div className="space-y-2">
                {placementPreview.targets.map((target, idx) => (
                  <AffectedDayPreviewCard
                    key={idx}
                    target={target}
                    methodLabel={methodLabel}
                    isExpanded={idx === 0}  // First target expanded by default
                  />
                ))}
              </div>
              
              {/* Warnings */}
              {placementPreview.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {placementPreview.warnings.map((w, i) => (
                    <p key={i} className="text-[9px] text-amber-400/80 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Apply button */}
              <Button
                size="sm"
                onClick={handleApply}
                disabled={isApplying || placementPreview.status === 'blocked_method_not_selectable'}
                className="w-full mt-2 h-8 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-1.5" />
                    Apply {selectedFrequency}x {methodLabel}
                  </>
                )}
              </Button>
            </>
          ) : (
            <p className="text-[10px] text-amber-400/80">
              No eligible targets found for {selectedFrequency}x placement.
            </p>
          )}
        </div>
      )}
      
      {/* Empty state hint */}
      {selectedFrequency === 0 && (
        <p className="text-[10px] text-[#6A6A7A]">
          Select a frequency to preview where {methodLabel} would be placed.
        </p>
      )}
    </div>
  )
}

// =============================================================================
// [MASTER-8C.7] METHOD CONTRACT FOUNDATION SECTION
// =============================================================================

/**
 * Compact read-only section showing method contract / slot ownership / frequency foundation.
 * This is informational only — no mutation, no frequency controls enabled.
 */
function MethodContractFoundationSection() {
  const inventory = useMemo<MethodContractInventoryRollup>(() => {
    return buildMethodContractSlotFrequencyInventory()
  }, [])

  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="space-y-2">
      {/* Header with expand toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-[#E6E9EF]">Method Contract Foundation</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6A6A7A]">
            {inventory.totalMethodsInventoried} methods
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#6A6A7A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6A6A7A]" />
          )}
        </div>
      </button>

      {/* Summary badges - always visible */}
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 text-[9px] rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">
          Read-only
        </span>
        <span className="px-2 py-0.5 text-[9px] rounded border border-purple-500/20 bg-purple-500/10 text-purple-400">
          Mutation locked
        </span>
        <span className="px-2 py-0.5 text-[9px] rounded border border-[#3A3A4A] bg-[#2A2A35] text-[#8A8A9A]">
          {inventory.activeCount} active
        </span>
        {inventory.previewOnlyCount > 0 && (
          <span className="px-2 py-0.5 text-[9px] rounded border border-amber-500/20 bg-amber-500/10 text-amber-400">
            {inventory.previewOnlyCount} preview-only
          </span>
        )}
        {inventory.blockedCount > 0 && (
          <span className="px-2 py-0.5 text-[9px] rounded border border-[#3A3A4A] bg-[#2A2A35] text-[#6A6A7A]">
            {inventory.blockedCount} blocked/future
          </span>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="pt-2 space-y-2 border-t border-[#2A2A35]">
          {/* Frequency & Slot status */}
          <div className="space-y-1">
            <p className="text-[10px] text-[#7A7A8A] leading-relaxed">
              <span className="text-[#9A9AAA] font-medium">Frequency controls:</span>{' '}
              Not enabled yet — slot ownership scoring required first.
            </p>
            <p className="text-[10px] text-[#7A7A8A] leading-relaxed">
              <span className="text-[#9A9AAA] font-medium">Slot ownership:</span>{' '}
              Inventory complete — no mutations in this step.
            </p>
          </div>

          {/* Warnings */}
          {inventory.densityWarning && (
            <div className="flex items-start gap-2 p-2 rounded bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-300 leading-relaxed">
                {inventory.densityWarning}
              </p>
            </div>
          )}
          {inventory.finisherWarning && (
            <div className="flex items-start gap-2 p-2 rounded bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-300 leading-relaxed">
                {inventory.finisherWarning}
              </p>
            </div>
          )}

          {/* Proof lines */}
          <div className="text-[9px] text-[#6A6A7A] space-y-0.5">
            {inventory.proofLines.slice(0, 5).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {/* Next step */}
          <p className="text-[10px] text-[#5A5A6A] italic">
            Next: {inventory.safeNextStep}
          </p>
        </div>
  )}
  </div>
  )
}

// =============================================================================
// [MASTER-8C.8] SLOT ELIGIBILITY & FREQUENCY PREVIEW SECTION
// =============================================================================

interface SlotEligibilityFrequencyPreviewSectionProps {
  program: unknown
  /** [MASTER-8C.10] Callback to update saved program after confirmed apply */
  onProgramUpdate?: (updatedProgram: AdaptiveProgram) => void
  /** [MASTER-8C.12A] Dedicated callback for frequency placement apply that saves via saveAdaptiveProgram */
  onApplyFrequencyPlacement?: (
    preview: FrequencySlotPlacementPreview
  ) => Promise<FrequencyPlacementApplyResult>
  /** [MASTER-8C.12.1B] When true, section is collapsed by default and labeled as diagnostic */
  isDiagnosticMode?: boolean
}

/**
 * Compact read-only section showing slot eligibility and frequency preview.
 * [MASTER-8C.10] Now supports confirmed apply for eligible row-level methods.
 * [MASTER-8C.12A] Now uses dedicated save callback for persistence.
 */
function SlotEligibilityFrequencyPreviewSection({ program, onProgramUpdate, onApplyFrequencyPlacement, isDiagnosticMode = false }: SlotEligibilityFrequencyPreviewSectionProps) {
  const plan = useMemo<MethodSlotEligibilityFrequencyPlan>(() => {
    return buildMethodSlotEligibilityFrequencyPlan(program)
  }, [program])

  // [MASTER-8C.12.1B] Default to collapsed in diagnostic mode
  const [isExpanded, setIsExpanded] = useState(!isDiagnosticMode)
  const [selectedFrequencies, setSelectedFrequencies] = useState<Record<string, number>>({})
  // [MASTER-8C.10] Track apply results
  const [applyResults, setApplyResults] = useState<Record<string, FrequencyPlacementApplyResult>>({})
  const [programChanged, setProgramChanged] = useState(false)

  // Filter to only show actionable methods (not straight_sets, not inventory-only prescription modifiers)
  const actionableMethods = useMemo(() => {
    return plan.methods.filter(m => 
      m.canonicalKey !== 'straight_sets' &&
      m.canonicalKey !== 'prescription_rest' &&
      m.canonicalKey !== 'prescription_rpe'
    )
  }, [plan.methods])

  const handleFrequencySelect = (methodKey: string, freq: number) => {
    // Local state only - does NOT persist or apply anything
    setSelectedFrequencies(prev => ({
      ...prev,
      [methodKey]: freq
    }))
    // Clear any previous apply result for this method when frequency changes
    setApplyResults(prev => {
      const { [methodKey]: _, ...rest } = prev
      return rest
    })
  }

  // [MASTER-8C.10 + 8C.12A] Handle confirmed apply with persistence
  const handleConfirmApply = async (methodKey: string, placementPreview: FrequencySlotPlacementPreview, allowCaution: boolean) => {
    // [MASTER-8C.12A] Use dedicated save callback if available (persists to localStorage)
    if (onApplyFrequencyPlacement) {
      const result = await onApplyFrequencyPlacement(placementPreview)
      
      setApplyResults(prev => ({
        ...prev,
        [methodKey]: result,
      }))
      
      if (result.status === 'success' || result.status === 'partial_success') {
        setProgramChanged(true)
        // Reset frequency selection after successful apply
        setSelectedFrequencies(prev => ({
          ...prev,
          [methodKey]: 0,
        }))
      }
      return
    }
    
    // Fallback: Local state only - does NOT persist (shows warning in result)
    const result = applyConfirmedFrequencyPlacementPreview({
      program,
      placementPreview,
      allowCautionApply: allowCaution,
    })
    
    // Add warning about non-persistence to evidence
    const resultWithWarning: FrequencyPlacementApplyResult = {
      ...result,
      evidence: [...result.evidence, 'WARNING: State-only update - not persisted via saveAdaptiveProgram. Will be lost on refresh.'],
    }
    
    setApplyResults(prev => ({
      ...prev,
      [methodKey]: resultWithWarning,
    }))
    
    if (result.status === 'success' || result.status === 'partial_success') {
      setProgramChanged(true)
      // Call the parent update callback with the updated program (state-only, not persisted)
      if (onProgramUpdate && result.updatedProgram) {
        onProgramUpdate(result.updatedProgram as AdaptiveProgram)
      }
      // Reset frequency selection after successful apply
      setSelectedFrequencies(prev => ({
        ...prev,
        [methodKey]: 0,
      }))
    }
  }

  return (
    <div className="space-y-2">
      {/* Header with expand toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Layers className={cn("w-4 h-4", isDiagnosticMode ? "text-[#6A6A7A]" : "text-emerald-400")} />
          <span className={cn("text-xs font-medium", isDiagnosticMode ? "text-[#8A8A9A]" : "text-[#E6E9EF]")}>
            {isDiagnosticMode ? 'Advanced Placement Diagnostics' : 'Slot Eligibility & Frequency Preview'}
          </span>
          {isDiagnosticMode && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A35] text-[#6A6A7A] border border-[#3A3A4A]">
              Optional
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6A6A7A]">
            {plan.previewSelectableMethodCount} selectable
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#6A6A7A]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6A6A7A]" />
          )}
        </div>
      </button>

      {/* Summary badges - always visible */}
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 text-[9px] rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          Preview only
        </span>
        <span className="px-2 py-0.5 text-[9px] rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">
          Not saved
        </span>
        <span className="px-2 py-0.5 text-[9px] rounded border border-[#3A3A4A] bg-[#2A2A35] text-[#8A8A9A]">
          {plan.eligibleMethodCount} eligible
        </span>
        {plan.blockedMethodCount > 0 && (
          <span className="px-2 py-0.5 text-[9px] rounded border border-amber-500/20 bg-amber-500/10 text-amber-400">
            {plan.blockedMethodCount} blocked
          </span>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="pt-2 space-y-3 border-t border-[#2A2A35]">
          {/* No program changes disclaimer */}
          <div className="flex items-start gap-2 p-2 rounded bg-blue-500/5 border border-blue-500/20">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[10px] text-blue-300 leading-relaxed">
              <p className="font-medium">Preview only — no program changes applied</p>
              <p className="text-blue-400/70 mt-0.5">
                Frequency selections are local preview only. Nothing is saved or applied to your program.
              </p>
            </div>
          </div>

          {/* Method list */}
          <div className="space-y-2">
            {actionableMethods.map((method) => (
              <MethodFrequencyPreviewRow
                key={method.canonicalKey}
                method={method}
                program={program}
                selectedFrequency={selectedFrequencies[method.canonicalKey] ?? 0}
                onFrequencySelect={(freq) => handleFrequencySelect(method.canonicalKey, freq)}
                onConfirmApply={(preview, allowCaution) => handleConfirmApply(method.canonicalKey, preview, allowCaution)}
                applyResult={applyResults[method.canonicalKey]}
              />
            ))}
          </div>

          {/* Warnings */}
          {plan.warnings.length > 0 && (
            <div className="space-y-1.5">
              {plan.warnings.slice(0, 3).map((warning, i) => (
                <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-amber-500/5 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-amber-300 leading-relaxed">{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Mutation status */}
          <div className="text-[9px] text-[#5A5A6A] space-y-0.5">
            <p>Mutation ready: {actionableMethods.filter(m => isMethodSupportedForFrequencyApply(m.canonicalKey)).length} methods</p>
            <p>Selections persist: No</p>
            <p>Program changed: {programChanged ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Single method row in frequency preview
 * [MASTER-8C.9] Now shows placement preview when frequency > 0 is selected
 * [MASTER-8C.10] Now supports confirmed apply for eligible row-level methods
 */
function MethodFrequencyPreviewRow({
  method,
  program,
  selectedFrequency,
  onFrequencySelect,
  onConfirmApply,
  applyResult,
}: {
  method: MethodFrequencyPreview
  program: unknown
  selectedFrequency: number
  onFrequencySelect: (freq: number) => void
  onConfirmApply: (preview: FrequencySlotPlacementPreview, allowCaution: boolean) => void
  applyResult?: FrequencyPlacementApplyResult
}) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const isBlocked = method.frequencyPreviewStatus === 'blocked' || 
                    method.eligibilityStatus.startsWith('blocked_')
  const isSelectable = method.userSelectableNow && !isBlocked
  // [MASTER-8C.10] Check if this method supports row-level apply
  const supportsApply = isMethodSupportedForFrequencyApply(method.canonicalKey)

  // Generate frequency options
  const frequencyOptions = useMemo(() => {
    if (!isSelectable) return []
    const options: number[] = [0]
    for (let i = 1; i <= method.safeMaxFrequency; i++) {
      options.push(i)
    }
    return options
  }, [isSelectable, method.safeMaxFrequency])

  // [MASTER-8C.9] Build placement preview when frequency > 0 is selected
  const placementPreview = useMemo<FrequencySlotPlacementPreview | null>(() => {
    if (selectedFrequency === 0 || !isSelectable) return null
    return buildFrequencySlotPlacementPreview({
      program,
      methodKey: method.canonicalKey,
      requestedFrequency: selectedFrequency,
    })
  }, [program, method.canonicalKey, selectedFrequency, isSelectable])

  const showPlacementPreview = placementPreview && 
    selectedFrequency > 0 && 
    (placementPreview.status === 'preview_ready' || placementPreview.status === 'preview_ready_with_caution')

  return (
    <div className="p-2 rounded bg-[#1A1A22]/50 border border-[#2A2A35]/50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-medium text-[#D6D9DF] truncate">
            {method.displayLabel}
          </span>
          {isBlocked ? (
            <span className="px-1.5 py-0.5 text-[8px] rounded border border-red-500/20 bg-red-500/10 text-red-400 shrink-0">
              Blocked
            </span>
          ) : method.eligibilityStatus === 'eligible_with_caution' ? (
            <span className="px-1.5 py-0.5 text-[8px] rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 shrink-0">
              Caution
            </span>
          ) : method.eligibilityStatus === 'eligible' ? (
            <span className="px-1.5 py-0.5 text-[8px] rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shrink-0">
              Eligible
            </span>
          ) : null}
        </div>

        {/* Frequency chips or blocked reason */}
        {isSelectable ? (
          <div className="flex items-center gap-1 shrink-0">
            {frequencyOptions.map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => onFrequencySelect(freq)}
                className={cn(
                  'px-2 py-0.5 text-[9px] rounded transition-colors',
                  selectedFrequency === freq
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#2A2A35] text-[#8A8A9A] border border-[#3A3A4A] hover:border-[#4A4A5A]'
                )}
              >
                {freq}x
              </button>
            ))}
          </div>
        ) : (
          <span className="text-[9px] text-[#6A6A7A] shrink-0">
            {method.eligibleSessionCount}/{method.eligibleSlotCount > 0 ? method.eligibleSlotCount : '-'} slots
          </span>
        )}
      </div>

      {/* Blocked reason or stats */}
      {isBlocked && method.blockedReason && (
        <div className="mt-1 space-y-0.5">
          <p className="text-[9px] text-[#6A6A7A] truncate">
            {method.blockedReason}
          </p>
          {/* [MASTER-8C.10.2] Show capacity summary for context */}
          {method.capacitySummary && (
            <p className="text-[8px] text-[#5A5A6A]">
              {method.capacitySummary}
            </p>
          )}
        </div>
      )}
      {!isBlocked && !showPlacementPreview && method.eligibleSlotCount > 0 && (
        <p className="text-[9px] text-[#5A5A6A] mt-1">
          {method.capacitySummary || `${method.eligibleSessionCount} sessions · max ${method.safeMaxFrequency}x/week`}
        </p>
      )}

      {/* [MASTER-8C.9] Placement preview when frequency > 0 selected */}
      {showPlacementPreview && placementPreview && (
        <div className="mt-2 pt-2 border-t border-[#2A2A35]/50 space-y-1.5">
          {/* Preview header */}
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] text-emerald-400 font-medium">
              {placementPreview.targets.length} placement{placementPreview.targets.length !== 1 ? 's' : ''} proposed
            </span>
            <span className="text-[8px] text-[#5A5A6A]">· Preview only</span>
          </div>

          {/* Placement targets */}
          {placementPreview.targets.map((target, i) => (
            <div key={`${target.sessionId}-${i}`} className="pl-4 text-[9px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#9A9AAA] font-medium">{target.sessionLabel}</span>
                <span className="text-[#6A6A7A]">—</span>
                <span className="text-[#8A8A9A] truncate">{target.exerciseNames[0] ?? 'Unknown'}</span>
              </div>
              <p className="text-[8px] text-[#5A5A6A] mt-0.5">
                {target.previewBefore} → {target.previewAfter}
              </p>
            </div>
          ))}

          {/* Caution warnings if any */}
          {placementPreview.status === 'preview_ready_with_caution' && placementPreview.warnings.length > 0 && (
            <div className="flex items-start gap-1.5 mt-1">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[8px] text-amber-300">{placementPreview.warnings[0]}</p>
            </div>
          )}

          {/* [MASTER-8C.10] Confirm button for eligible row-level methods */}
          {supportsApply && !showConfirmation && !applyResult && (
            <button
              type="button"
              onClick={() => setShowConfirmation(true)}
              className={cn(
                'w-full mt-2 px-3 py-1.5 text-[10px] font-medium rounded transition-colors',
                placementPreview.status === 'preview_ready_with_caution'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              )}
            >
              {placementPreview.status === 'preview_ready_with_caution' 
                ? 'Review & Apply with caution' 
                : `Confirm ${placementPreview.targets.length} placement${placementPreview.targets.length !== 1 ? 's' : ''}`}
            </button>
          )}

          {/* [MASTER-8C.10] Confirmation panel */}
          {showConfirmation && !applyResult && (
            <div className="mt-2 p-2 rounded bg-[#1A1A22] border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">Confirm Apply</span>
              </div>
              
              <div className="text-[9px] text-[#9A9AAA] space-y-1">
                <p><strong>Method:</strong> {method.displayLabel}</p>
                <p><strong>Frequency:</strong> {selectedFrequency}x/week</p>
                <p><strong>Targets:</strong></p>
                <ul className="pl-3 space-y-0.5">
                  {placementPreview.targets.map((t, i) => (
                    <li key={i} className="text-[8px] text-[#8A8A9A]">
                      {t.sessionLabel} — {t.exerciseNames[0]}
                    </li>
                  ))}
                </ul>
              </div>

              {placementPreview.status === 'preview_ready_with_caution' && (
                <div className="flex items-start gap-1.5 p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[8px] text-amber-300">
                    This placement has caution flags. Review targets carefully.
                  </p>
                </div>
              )}

              <p className="text-[8px] text-[#5A5A6A]">
                This will update the saved program. Existing saved methods are preserved.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-2 py-1 text-[9px] rounded bg-[#2A2A35] text-[#8A8A9A] border border-[#3A3A4A] hover:border-[#4A4A5A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmApply(placementPreview, placementPreview.status === 'preview_ready_with_caution')
                    setShowConfirmation(false)
                  }}
                  className="flex-1 px-2 py-1 text-[9px] font-medium rounded bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/40"
                >
                  Confirm Apply
                </button>
              </div>
            </div>
          )}

          {/* [MASTER-8C.10] Apply result display */}
          {applyResult && (
            <div className={cn(
              'mt-2 p-2 rounded border space-y-1',
              applyResult.status === 'success' || applyResult.status === 'partial_success'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            )}>
              <div className="flex items-center gap-1.5">
                {applyResult.status === 'success' || applyResult.status === 'partial_success' ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className={cn(
                  'text-[10px] font-medium',
                  applyResult.status === 'success' || applyResult.status === 'partial_success'
                    ? 'text-emerald-400'
                    : 'text-red-400'
                )}>
                  {applyResult.visibleSummary}
                </span>
              </div>
              
              {applyResult.appliedCount > 0 && (
                <p className="text-[8px] text-[#7A7A8A]">
                  Applied to: {applyResult.targetedDays.join(', ')}
                </p>
              )}
              
              <p className="text-[8px] text-[#5A5A6A]">
                Program changed: {applyResult.programChanged ? 'Yes' : 'No'} · Existing saved methods preserved
              </p>
            </div>
          )}

          {/* Explicit no-mutation proof (only show if not in confirmation/result state) */}
          {!showConfirmation && !applyResult && !supportsApply && (
            <p className="text-[8px] text-[#4A4A5A] italic mt-1">
              Not saved · No program changes · Existing saved methods are separate
            </p>
          )}
          
          {/* Show blocked reason for methods that don't support apply */}
          {!supportsApply && (
            <p className="text-[8px] text-amber-400/70 mt-1">
              {method.canonicalKey === 'circuit'
                ? 'Use existing Method Planner for circuit application'
                : `${method.displayLabel} does not support frequency apply yet`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// [MASTER-8C.12.1C] MANAGE APPLIED ADDITIONS SECTION
// =============================================================================

interface ManageAppliedAdditionsSectionProps {
  program: AdaptiveProgram | null
  onRemoveSelectedPlacements: (placementIds: string[]) => Promise<SelectiveRemovalResult>
}

/**
 * [MASTER-8C.12.1C] Section for managing and selectively removing user-applied method placements.
 * Shows all user-applied methods (not native AI methods) with checkboxes for selective removal.
 */
function ManageAppliedAdditionsSection({
  program,
  onRemoveSelectedPlacements,
}: ManageAppliedAdditionsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isRemoving, setIsRemoving] = useState(false)
  const [removalResult, setRemovalResult] = useState<SelectiveRemovalResult | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Extract applied placements from program
  const { placements, totalCount } = useMemo(() => {
    return extractAppliedMethodPlacements(program)
  }, [program])
  
  // Toggle selection
  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setRemovalResult(null)
  }
  
  // Select/deselect all
  const handleSelectAll = () => {
    if (selectedIds.size === placements.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(placements.map(p => p.id)))
    }
    setRemovalResult(null)
  }
  
  // Remove selected placements
  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return
    
    setIsRemoving(true)
    setRemovalResult(null)
    
    try {
      const result = await onRemoveSelectedPlacements(Array.from(selectedIds))
      setRemovalResult(result)
      
      if (result.status === 'success' || result.status === 'partial_success') {
        // Clear selection for successfully removed items
        setSelectedIds(prev => {
          const next = new Set(prev)
          result.removedIds.forEach(id => next.delete(id))
          return next
        })
      }
    } catch (error) {
      setRemovalResult({
        status: 'blocked',
        visibleSummary: error instanceof Error ? error.message : 'Removal failed',
        removedCount: 0,
        failedCount: selectedIds.size,
        removedIds: [],
        failedIds: Array.from(selectedIds),
        evidence: [error instanceof Error ? error.message : 'Unknown error'],
      })
    } finally {
      setIsRemoving(false)
      setShowConfirmation(false)
    }
  }
  
  const allSelected = placements.length > 0 && selectedIds.size === placements.length
  const someSelected = selectedIds.size > 0
  
  // Don't render if no placements
  if (totalCount === 0) {
    return (
      <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <div className="flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-[#6A6A7A]" />
          <span className="text-xs font-medium text-[#8A8A9A]">Manage Applied Additions</span>
        </div>
        <p className="text-[10px] text-[#6A6A7A] mt-2">
          No user-added method placements to manage. Apply methods through the method detail view above.
        </p>
      </div>
    )
  }
  
  return (
    <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
      {/* Header with expand toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-[#E6E9EF]">
            Manage Applied Additions
          </span>
          <span className="text-[9px] text-[#6A6A7A] bg-[#2A2A35] px-1.5 py-0.5 rounded">
            {totalCount}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#6A6A7A]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6A6A7A]" />
        )}
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Result banner */}
          {removalResult && (
            <div className={cn(
              'p-2 rounded-md text-[10px]',
              removalResult.status === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : removalResult.status === 'partial_success'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
            )}>
              {removalResult.visibleSummary}
            </div>
          )}
          
          {/* Select all / controls */}
          <div className="flex items-center justify-between pb-2 border-b border-[#2A2A35]">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-[10px] text-[#9A9AAA] hover:text-[#E6E9EF]"
            >
              <div className={cn(
                'w-3.5 h-3.5 rounded border flex items-center justify-center',
                allSelected 
                  ? 'bg-cyan-500/20 border-cyan-500/50'
                  : someSelected
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'border-[#3A3A4A]'
              )}>
                {allSelected && <Check className="w-2.5 h-2.5 text-cyan-400" />}
                {!allSelected && someSelected && <Minus className="w-2.5 h-2.5 text-cyan-400" />}
              </div>
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-[10px] text-[#6A6A7A]">
              {selectedIds.size} selected
            </span>
          </div>
          
          {/* Placements list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {placements.map((placement) => (
              <button
                key={placement.id}
                onClick={() => handleToggleSelection(placement.id)}
                className={cn(
                  'w-full flex items-center gap-2 p-2 rounded text-left transition-colors',
                  selectedIds.has(placement.id)
                    ? 'bg-cyan-500/10 border border-cyan-500/30'
                    : 'bg-[#0F0F12] border border-transparent hover:border-[#3A3A4A]'
                )}
              >
                <div className={cn(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                  selectedIds.has(placement.id)
                    ? 'bg-cyan-500/20 border-cyan-500/50'
                    : 'border-[#3A3A4A]'
                )}>
                  {selectedIds.has(placement.id) && (
                    <Check className="w-2.5 h-2.5 text-cyan-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-cyan-400 shrink-0">
                      Day {placement.dayNumber}
                    </span>
                    <span className="text-[10px] text-[#E6E9EF] truncate">
                      {placement.exerciseName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A35] text-[#9A9AAA]">
                      {placement.methodLabel}
                    </span>
                    <span className="text-[9px] text-[#6A6A7A]">Added by you</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Remove button / confirmation */}
          {showConfirmation ? (
            <div className="space-y-2 pt-2 border-t border-[#2A2A35]">
              <p className="text-[10px] text-[#9A9AAA]">
                Remove {selectedIds.size} selected placement{selectedIds.size === 1 ? '' : 's'}?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isRemoving}
                  className="flex-1 h-7 text-[10px] border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#2A2A35]"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveSelected}
                  disabled={isRemoving}
                  className="flex-1 h-7 text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Confirm Remove'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            someSelected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmation(true)}
                className="w-full h-7 text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                Remove {selectedIds.size} Selected
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}

function RequestedMethodsSheetContent({
  program,
  plannerSummary,
  foundationContext,
  onApplyMethodOverride,
  onRevertMethodOverride,
  onResetAllMethodOverrides,
  showResetAllConfirmation,
  setShowResetAllConfirmation,
  isResettingAllOverrides,
  resetAllResult,
  onResetAllOverrides,
  onProgramUpdate,
  onApplyFrequencyPlacement,
  onRemoveSelectedPlacements,
}: {
  program: AdaptiveProgram
  plannerSummary: CanonicalMethodPlannerSummary
  foundationContext?: MethodPlannerFoundationContext
  onApplyMethodOverride?: (preview: MethodOverridePreview, options: { allowCautionApply: boolean }) => Promise<MethodOverrideApplyResult>
  onRevertMethodOverride?: (methodKey: string) => Promise<MethodOverrideRevertResult>
  onResetAllMethodOverrides?: () => Promise<MethodOverrideResetAllResult>
  showResetAllConfirmation: boolean
  setShowResetAllConfirmation: (show: boolean) => void
  isResettingAllOverrides: boolean
  resetAllResult: MethodOverrideResetAllResult | null
  onResetAllOverrides: () => void
  /** [MASTER-8C.10] Callback for frequency placement apply */
  onProgramUpdate?: (updatedProgram: AdaptiveProgram) => void
  /** [MASTER-8C.12A] Dedicated callback for frequency placement with save */
  onApplyFrequencyPlacement?: (preview: FrequencySlotPlacementPreview) => Promise<FrequencyPlacementApplyResult>
  /** [MASTER-8C.12B] Selective removal callback */
  onRemoveSelectedPlacements?: (placementIds: string[]) => Promise<SelectiveRemovalResult>
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

  // [MASTER-8A.2] Build canonical rows from artifact truth - replaces stale grouped sections
  const canonicalRows = buildCanonicalMethodPlannerRows({
    program,
    methodItems,
    plannerSummary,
    previews,
  })
  
  // [MASTER-8A.2] Info bubble state for explaining "Applied" count
  const [showAppliedInfo, setShowAppliedInfo] = useState(false)
  useEffect(() => {
    if (showAppliedInfo) {
      const timer = setTimeout(() => setShowAppliedInfo(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showAppliedInfo])

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
  
  // [MASTER-8A.2] Handle row click - find the matching methodItem for detail view
  const handleCanonicalRowClick = (row: CanonicalMethodPlannerRow) => {
    // Find matching methodItem (or create a minimal one for artifact-only rows)
    const existingItem = methodItems.find(
      m => normalizeOverrideMethodKey(m.methodKey) === row.methodKey
    )
    
    if (existingItem) {
      setSelectedItem(existingItem)
      const plan = planMethodOverride({ methodItem: existingItem, program })
      setCurrentPlan(plan)
    } else {
      // Artifact-only row - create minimal item for detail view
      const minimalItem: RequestedMethodDisplayItem = {
        methodKey: row.methodKey,
        label: row.label,
        state: 'applied',
        source: 'artifact',
        reason: row.reason,
        confidence: 'high',
        canOverrideNow: false,
      }
      setSelectedItem(minimalItem)
      const plan = planMethodOverride({ methodItem: minimalItem, program })
      setCurrentPlan(plan)
    }
  }
  
  // [MASTER-8A.2] Status chip colors and labels
  const STATUS_CHIP_STYLES: Record<MethodPlannerRowStatus, { bg: string; text: string; border: string; label: string }> = {
    applied: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Applied' },
    recommended: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Recommended' },
    caution: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Caution' },
    high_risk: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'High Risk' },
    not_available: { bg: 'bg-[#2A2A35]', text: 'text-[#6A6A7A]', border: 'border-[#3A3A4A]', label: 'Not Available' },
  }
  
  // [MASTER-8A.2] Render canonical method list - replaces old renderGroup sections
  const renderCanonicalMethodList = () => {
    if (canonicalRows.length === 0) return null
    
    const appliedRows = canonicalRows.filter(r => r.status === 'applied')
    const otherRows = canonicalRows.filter(r => r.status !== 'applied')
    
    return (
      <div className="space-y-3">
        {/* Applied section */}
        {appliedRows.length > 0 && (
          <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A]">
                Applied ({appliedRows.length})
              </span>
              <button
                onClick={() => setShowAppliedInfo(true)}
                className="p-0.5 rounded hover:bg-[#2A2A35] transition-colors"
                aria-label="What does Applied mean?"
              >
                <Info className="w-3 h-3 text-[#5A5A6A]" />
              </button>
              {showAppliedInfo && (
                <span className="text-[9px] text-[#8A8A9A] bg-[#2A2A35] px-2 py-1 rounded animate-in fade-in duration-200">
                  Applied = Method Planner additions saved to your program
                </span>
              )}
            </div>
            <ul className="space-y-2">
              {appliedRows.map((row) => (
                <li
                  key={row.methodKey}
                  className="flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-[#2A2A35]/50 border border-transparent"
                  onClick={() => handleCanonicalRowClick(row)}
                >
                  <span className={cn(
                    'px-2 py-0.5 text-[9px] font-medium rounded border shrink-0 mt-0.5',
                    STATUS_CHIP_STYLES[row.status].bg,
                    STATUS_CHIP_STYLES[row.status].text,
                    STATUS_CHIP_STYLES[row.status].border,
                  )}>
                    {STATUS_CHIP_STYLES[row.status].label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-[#E6E9EF]">{row.label}</p>
                      {row.isAppliedByArtifact && (
                        <span className="px-1.5 py-0.5 text-[8px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Saved
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-[#5A5A6A] ml-auto shrink-0" />
                    </div>
                    <p className="text-[10px] text-[#7A7A8A] leading-relaxed mt-0.5 line-clamp-2">
                      {row.reason}
                    </p>
                    <p className="text-[9px] mt-1 flex items-center gap-1 text-emerald-400/70">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {row.actionHint}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Other methods section */}
        {otherRows.length > 0 && (
          <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#6A6A7A] block mb-2">
              Other Methods ({otherRows.length})
            </span>
            <ul className="space-y-2">
              {otherRows.map((row) => {
                const hasPreview = row.hasPreview
                return (
                  <li
                    key={row.methodKey}
                    className={cn(
                      'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all',
                      'hover:bg-[#2A2A35]/50 border border-transparent',
                      hasPreview && 'border-amber-500/20 bg-amber-500/5',
                    )}
                    onClick={() => handleCanonicalRowClick(row)}
                  >
                    <span className={cn(
                      'px-2 py-0.5 text-[9px] font-medium rounded border shrink-0 mt-0.5',
                      STATUS_CHIP_STYLES[row.status].bg,
                      STATUS_CHIP_STYLES[row.status].text,
                      STATUS_CHIP_STYLES[row.status].border,
                    )}>
                      {STATUS_CHIP_STYLES[row.status].label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-[#E6E9EF]">{row.label}</p>
                        {hasPreview && (
                          <span className="px-1.5 py-0.5 text-[8px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Preview
                          </span>
                        )}
                        <ChevronRight className="w-3 h-3 text-[#5A5A6A] ml-auto shrink-0" />
                      </div>
                      <p className="text-[10px] text-[#7A7A8A] leading-relaxed mt-0.5 line-clamp-2">
                        {row.reason}
                      </p>
                      <p className={cn(
                        'text-[9px] mt-1 flex items-center gap-1',
                        row.status === 'recommended' ? 'text-blue-400/70' :
                        row.status === 'caution' ? 'text-amber-400/70' :
                        row.status === 'high_risk' ? 'text-red-400/70' : 'text-[#5A5A6A]'
                      )}>
                        <ArrowRight className="w-2.5 h-2.5" />
                        {row.actionHint}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }
  
  // [MASTER-8A.2] Use canonical rows for data presence check
  const hasAnyData = canonicalRows.length > 0

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
          // [MASTER-8C.12.1A] Frequency placement props
          onApplyFrequencyPlacement={onApplyFrequencyPlacement}
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

    {/* [MASTER-8A.1.1] Proof line for visible parity verification */}
    <div className="text-[10px] text-[#6A6A7A] px-1 py-0.5 bg-[#0A0A0F] rounded border border-[#1A1A22]">
      {plannerSummary.proofLine}
    </div>

    {/* [MASTER-8B.5] Foundation Context Panel - read-only Program Balance link */}
    {foundationContext && (
      <div className={cn(
        'p-2.5 rounded-lg border',
        foundationContext.status === 'linked' ? 'bg-teal-500/5 border-teal-500/20' :
        foundationContext.status === 'partial' ? 'bg-blue-500/5 border-blue-500/20' :
        'bg-[#1A1A22] border-[#2A2A35]'
      )}>
        <div className="flex items-center gap-2 mb-1.5">
          <Scale className={cn(
            'w-3.5 h-3.5',
            foundationContext.status === 'linked' ? 'text-teal-400' :
            foundationContext.status === 'partial' ? 'text-blue-400' :
            'text-[#6A6A7A]'
          )} />
          <span className={cn(
            'text-[10px] font-medium',
            foundationContext.status === 'linked' ? 'text-teal-300' :
            foundationContext.status === 'partial' ? 'text-blue-300' :
            'text-[#8A8A9A]'
          )}>
            {foundationContext.headline}
          </span>
        </div>
        {/* Chips */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {foundationContext.chips.map((chip, idx) => (
            <span
              key={idx}
              className={cn(
                'px-1.5 py-0.5 text-[8px] rounded border',
                chip === 'Program Balance linked' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                chip === 'Read-only' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                chip === 'No method changes' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                'bg-[#2A2A35] text-[#8A8A9A] border-[#3A3A4A]'
              )}
            >
              {chip}
            </span>
          ))}
        </div>
        {/* Warnings */}
        {foundationContext.warnings.length > 0 && (
          <div className="space-y-0.5 mb-1.5">
            {foundationContext.warnings.slice(0, 2).map((warning, idx) => (
              <p key={idx} className="text-[9px] text-amber-400/80 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                {warning}
              </p>
            ))}
          </div>
        )}
        {/* Proof lines */}
        <div className="text-[8px] text-[#5A5A6A] space-y-0.5">
          {foundationContext.proofLines.slice(0, 2).map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      </div>
    )}

    {/* [MASTER-8A.1.1] Unified Banner - uses canonical plannerSummary, NOT local IIFE counts */}
    {plannerSummary.bannerHeadline && (
      <div className={cn(
        'p-3 rounded-lg',
        plannerSummary.bannerTone === 'preview' 
          ? 'bg-amber-500/5 border border-amber-500/20'
          : plannerSummary.bannerTone === 'applied'
          ? 'bg-emerald-500/5 border border-emerald-500/20'
          : 'bg-blue-500/5 border border-blue-500/20'
      )}>
        <div className="flex items-center gap-2 mb-2">
          {plannerSummary.bannerTone === 'preview' ? (
            <Eye className="w-4 h-4 text-amber-400" />
          ) : plannerSummary.bannerTone === 'applied' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-blue-400" />
          )}
          <span className={cn(
            'text-xs font-medium',
            plannerSummary.bannerTone === 'preview' ? 'text-amber-400' :
            plannerSummary.bannerTone === 'applied' ? 'text-emerald-400' : 'text-blue-400'
          )}>
            {plannerSummary.bannerHeadline}
          </span>
        </div>
        {plannerSummary.bannerBody && (
          <p className="text-[10px] text-[#8A8A9A]">
            {plannerSummary.bannerBody}
          </p>
        )}
      </div>
      )}

{/* [MASTER-8C.7] Method Contract Foundation Section */}
  <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
  <MethodContractFoundationSection />
  </div>

  {/* [MASTER-8C.12.2] Old Slot Eligibility & Frequency Preview Section REMOVED from normal view */}
  {/* Users should use method-detail frequency controls as the primary apply path */}
  {/* The SlotEligibilityFrequencyPreviewSection component is kept for potential debug use but not rendered */}
  
  {/* [MASTER-8C.12.1C] Manage Applied Additions Section */}
  {onRemoveSelectedPlacements && (
    <ManageAppliedAdditionsSection
      program={program}
      onRemoveSelectedPlacements={onRemoveSelectedPlacements}
    />
  )}
  
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

      {/* [MASTER-8A.2] Use canonical method list instead of stale grouped sections */}
      {renderCanonicalMethodList()}
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
  onApplyFrequencyPlacement, // [MASTER-8C.12A] Dedicated callback for frequency placement with save
  onRemoveSelectedPlacements, // [MASTER-8C.12B] Selective removal callback
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
  // [MASTER-8B.4] Program Balance sheet state
  const [programBalanceOpen, setProgramBalanceOpen] = useState(false)
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
  
  // [P2B] Check for active previews
  const [activePreviews, setActivePreviews] = useState<MethodOverridePreview[]>([])
  useEffect(() => {
    setActivePreviews(getMethodOverridePreviews())
  }, [requestedMethodsOpen])
  
  // [MASTER-8A.1.1] Build ONE canonical planner summary for all visible counts
  // This replaces the scattered attentionMethodCount, appliedMethodCount, hasActivePreviews logic
  const plannerSummary = buildCanonicalMethodPlannerSummary(program, methodItems, activePreviews)
  
  // [MASTER-8B.4] Program Balance read-only analysis
  // [MASTER-8C.4] Now links Adaptive Foundation from resolveVisibleAdaptiveFoundation
  const programBalanceResult = useMemo<ProgramBalanceReadOnlyResult>(() => {
    try {
      // Extract selected skill IDs from representations
      const selectedSkillIds = extractSelectedSkillIdsFromRepresentations(selectedSkillRepresentations)
      
      // [MASTER-8C.4] Resolve the adaptive foundation model to pass to analyzer
      // This ensures "Adaptive Foundation analyzer input not linked" doesn't appear
      // when the Adaptive Foundation tile can resolve a model
      const { model: adaptiveFoundationModel } = resolveVisibleAdaptiveFoundation(program)
      
      // Build input from program with explicit Adaptive Foundation override
      const input = buildProgramBalanceBranchInputWithFoundation(
        program,
        selectedSkillIds,
        currentWeekNumber,
        adaptiveFoundationModel ?? undefined,
      )
      
      // Run analyzer
      return analyzeProgramBalanceReadOnly(input)
    } catch (error) {
      // Safe fallback - never crash the hub
      return getProgramBalanceReadOnlyUnavailable(
        `Analysis error: ${error instanceof Error ? error.message : 'unknown'}`
      )
    }
  }, [program, selectedSkillRepresentations, currentWeekNumber])
  
  // [MASTER-8C.6] Compute generator knowledge consumption proof from sessions
  // [MASTER-8C.6.2] Uses resolver that can backfill from saved program exercises
  const generatorKnowledgeProof = useMemo<ProgramGeneratorKnowledgeProof>(() => {
    const sessions = program?.sessions || []
    const sessionProofs = sessions.map((session) =>
      resolveSessionGeneratorKnowledgeProofFromSession(session)
    )
    return rollUpProgramGeneratorKnowledgeProof(sessionProofs)
  }, [program])
  
  // [MASTER-8B.4] Derive tile summary and badge from balance result
  const programBalanceTileSummary = useMemo(() => {
    if (programBalanceResult.status === 'unavailable') return 'Needs program'
    
    const highCount = programBalanceResult.findings.filter(f => f.severity === 'high').length
    const moderateCount = programBalanceResult.findings.filter(f => f.severity === 'moderate').length
    const watchCount = programBalanceResult.findings.filter(f => f.severity === 'watch' || f.severity === 'mild').length
    
    if (highCount > 0) return `${highCount} high priority`
    if (moderateCount > 0) return `${moderateCount} watch items`
    if (watchCount > 0) return 'Minor notes'
    if (programBalanceResult.knowledgeMissingExerciseCount > programBalanceResult.knowledgeMatchedExerciseCount) {
      return 'Limited coverage'
    }
    return 'Balanced'
  }, [programBalanceResult])
  
  const programBalanceBadge = useMemo(() => {
    if (programBalanceResult.status === 'unavailable') return 'Missing'
    
    const highCount = programBalanceResult.findings.filter(f => f.severity === 'high').length
    const moderateCount = programBalanceResult.findings.filter(f => f.severity === 'moderate').length
    
    if (highCount > 0) return 'High'
    if (moderateCount > 0) return 'Moderate'
    if (programBalanceResult.status === 'partial') return 'Partial'
    return 'Ready'
  }, [programBalanceResult])
  
  const programBalanceBadgeVariant = useMemo<'warning' | 'success' | 'info' | 'secondary'>(() => {
    if (programBalanceResult.status === 'unavailable') return 'secondary'
    
    const highCount = programBalanceResult.findings.filter(f => f.severity === 'high').length
    const moderateCount = programBalanceResult.findings.filter(f => f.severity === 'moderate').length
    
    if (highCount > 0 || moderateCount > 0) return 'warning'
    if (programBalanceResult.status === 'partial') return 'info'
    return 'success'
  }, [programBalanceResult])
  
  // [MASTER-8B.5] Derive Method Planner foundation context from Program Balance
  const methodPlannerFoundationContext = useMemo(
    () => buildMethodPlannerFoundationContext(programBalanceResult),
    [programBalanceResult]
  )
  
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
  
  // [MASTER-8A.1.1] Use canonical planner summary for tile display
  // This replaces the old scattered if/else logic
  const methodPlannerSummary = plannerSummary.tileSummary
  const methodPlannerBadge = plannerSummary.tileBadge
  const methodPlannerBadgeVariant = plannerSummary.tileBadgeVariant
  
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

          {/* [MASTER-8B.6.1] Calibration — tappable with honest empty state when source unavailable */}
          <HubButton
            icon={<ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />}
            label="Calibration"
            summary={calibrationInput ? undefined : 'View'}
            onClick={() => setCalibrationOpen(true)}
            sourceUnavailable={!calibrationInput}
          />

          {/* [MASTER-8B.6.1] Coach Recs — tappable with honest empty state when no recommendations */}
          <HubButton
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            label="Coach Recs"
            badge={hasCoachRecs ? 'Active' : undefined}
            badgeVariant={hasCoachRecs ? 'success' : 'secondary'}
            summary={hasCoachRecs ? undefined : 'View'}
            onClick={() => setCoachRecsOpen(true)}
            sourceUnavailable={!hasCoachRecs}
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

          {/* [MASTER-8B.6.1] Plan Logic — tappable with honest empty state when source unavailable */}
          <HubButton
            icon={<Info className="w-3.5 h-3.5 text-cyan-400" />}
            label="Plan Logic"
            summary="View"
            onClick={() => setPlanLogicOpen(true)}
            sourceUnavailable={!truthExplanation}
          />

          {/* [MASTER-8B.4] Program Balance — read-only balance analysis */}
          <HubButton
            icon={<Scale className="w-3.5 h-3.5 text-teal-400" />}
            label="Program Balance"
            summary={programBalanceTileSummary}
            badge={programBalanceBadge}
            badgeVariant={programBalanceBadgeVariant}
            onClick={() => setProgramBalanceOpen(true)}
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
        
        {/* [MASTER-7] Old duplicate inline Adaptive Foundation strip removed — 
            the first-class Adaptive Foundation tile in the hub grid now owns this corridor.
            The tile opens the full detail sheet with safeguard intelligence and preview. */}
        
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
    plannerSummary={plannerSummary}
    foundationContext={methodPlannerFoundationContext}
    onApplyMethodOverride={onApplyMethodOverridePreview ? handleApplyMethodOverride : undefined}
    onRevertMethodOverride={onRevertMethodOverride}
    onResetAllMethodOverrides={onResetAllMethodOverrides}
    showResetAllConfirmation={showResetAllConfirmation}
    setShowResetAllConfirmation={setShowResetAllConfirmation}
    isResettingAllOverrides={isResettingAllOverrides}
    resetAllResult={resetAllResult}
    onResetAllOverrides={handleResetAllOverrides}
    onProgramUpdate={onProgramUpdate}
    onApplyFrequencyPlacement={onApplyFrequencyPlacement}
    onRemoveSelectedPlacements={onRemoveSelectedPlacements}
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

      {/* [MASTER-8B.4] Program Balance Sheet — read-only balance analysis */}
      <Sheet open={programBalanceOpen} onOpenChange={setProgramBalanceOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F0F12] border-[#2A2A35]">
          <SheetHeader>
            <SheetTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-400" />
              Program Balance
            </SheetTitle>
            <SheetDescription className="text-[#7A7A8A]">
              Read-only balance, skill expression, anchor, and stress analysis
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <ProgramBalanceSheetContent result={programBalanceResult} generatorKnowledgeProof={generatorKnowledgeProof} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
