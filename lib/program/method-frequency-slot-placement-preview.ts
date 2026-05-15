/**
 * MASTER-8C.9 — Frequency-to-Slot Placement Preview
 * 
 * This module converts a selected frequency into concrete proposed placements
 * across actual sessions/slots. It is purely read-only — no mutation, no persistence.
 * 
 * Key invariants:
 * - mutationAllowedNow: false (always)
 * - selectionPersists: false (always)
 * - programChanged: false (always)
 * - existingSavedArtifactsAreSeparate: true (always)
 * - Consumes 8C.8 output, does not duplicate slot eligibility truth
 */

import {
  buildMethodSlotEligibilityFrequencyPlan,
  type MethodSlotEligibilityFrequencyPlan,
  type MethodFrequencyPreview,
  type MethodEligibleSlot,
  type SlotKind,
  type SlotConfidence,
} from './method-slot-eligibility-frequency-planner'
import type { CanonicalMethodFamily } from './method-structure-contract'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Status of a frequency-to-slot placement preview
 */
export type FrequencySlotPlacementPreviewStatus =
  | 'preview_ready'
  | 'preview_ready_with_caution'
  | 'blocked_method_not_selectable'
  | 'blocked_frequency_zero'
  | 'blocked_frequency_above_safe_max'
  | 'blocked_no_slots'
  | 'blocked_runtime_contract'
  | 'blocked_existing_artifact_only'
  | 'blocked_no_structural_writer'
  | 'blocked_no_real_prescription'

/**
 * Reason codes for placement decisions
 */
export type FrequencySlotPlacementReasonCode =
  | 'selected_frequency'
  | 'ranked_by_spacing'
  | 'ranked_by_slot_confidence'
  | 'avoided_existing_method_owner'
  | 'avoided_primary_skill_sensitivity'
  | 'blocked_density_logging'
  | 'blocked_finisher_prescription'
  | 'blocked_superset_writer'
  | 'no_program_mutation'

/**
 * A single proposed placement target
 */
export interface FrequencySlotPlacementTarget {
  readonly methodKey: CanonicalMethodFamily
  readonly displayLabel: string
  readonly sessionId: string
  readonly sessionIndex: number
  readonly sessionLabel: string
  readonly dayTitle: string
  readonly slotKind: SlotKind
  readonly exerciseIds: readonly string[]
  readonly exerciseNames: readonly string[]
  readonly placementLabel: string
  readonly placementSummary: string
  readonly whyChosen: string
  readonly confidence: SlotConfidence
  readonly cautionReasons: readonly string[]
  readonly previewBefore: string
  readonly previewAfter: string
  readonly wouldMutateIfAppliedLater: false
  readonly appliedNow: false
}

/**
 * A skipped candidate slot with reason
 */
export interface FrequencySlotSkippedCandidate {
  readonly sessionId: string
  readonly sessionIndex: number
  readonly sessionLabel: string
  readonly exerciseNames: readonly string[]
  readonly reason: string
  readonly reasonCode: FrequencySlotPlacementReasonCode
}

/**
 * Full placement preview for a method + frequency selection
 */
export interface FrequencySlotPlacementPreview {
  readonly version: 'MASTER-8C.9'
  readonly source: 'slot_eligibility_frequency_preview'
  readonly methodKey: CanonicalMethodFamily
  readonly displayLabel: string
  readonly requestedFrequency: number
  readonly safeMaxFrequency: number
  readonly status: FrequencySlotPlacementPreviewStatus
  readonly mutationAllowedNow: false
  readonly selectionPersists: false
  readonly programChanged: false
  readonly existingSavedArtifactsAreSeparate: true
  readonly targets: readonly FrequencySlotPlacementTarget[]
  readonly skippedCandidates: readonly FrequencySlotSkippedCandidate[]
  readonly warnings: readonly string[]
  readonly proofLines: readonly string[]
  readonly safeNextStep: string
}

// =============================================================================
// MAIN BUILDER
// =============================================================================

export interface BuildFrequencySlotPlacementPreviewInput {
  program: unknown
  methodKey: CanonicalMethodFamily
  requestedFrequency: number
  existingPlan?: MethodSlotEligibilityFrequencyPlan
}

/**
 * Build a frequency-to-slot placement preview for a given method and frequency.
 * 
 * This is purely read-only — it does NOT mutate the program, persist selections,
 * or call any apply handlers.
 */
export function buildFrequencySlotPlacementPreview(
  input: BuildFrequencySlotPlacementPreviewInput
): FrequencySlotPlacementPreview {
  const { program, methodKey, requestedFrequency, existingPlan } = input
  
  // Build or use existing 8C.8 plan
  const plan = existingPlan ?? buildMethodSlotEligibilityFrequencyPlan(program)
  
  // Find the method in the plan
  const methodPreview = plan.methods.find(m => m.canonicalKey === methodKey)
  
  // Base output structure (all mutation flags false)
  const baseOutput = {
    version: 'MASTER-8C.9' as const,
    source: 'slot_eligibility_frequency_preview' as const,
    methodKey,
    displayLabel: methodPreview?.displayLabel ?? methodKey,
    requestedFrequency,
    safeMaxFrequency: methodPreview?.safeMaxFrequency ?? 0,
    mutationAllowedNow: false as const,
    selectionPersists: false as const,
    programChanged: false as const,
    existingSavedArtifactsAreSeparate: true as const,
  }
  
  // Method not found in plan
  if (!methodPreview) {
    return {
      ...baseOutput,
      status: 'blocked_method_not_selectable',
      targets: [],
      skippedCandidates: [],
      warnings: [`Method "${methodKey}" not found in slot eligibility plan.`],
      proofLines: [
        'Method not found in MASTER-8C.8 plan.',
        'No placements can be previewed.',
        'Existing saved Method Planner artifacts are separate.',
      ],
      safeNextStep: 'Verify method key exists in inventory.',
    }
  }
  
  // Frequency is 0 — valid selection, no placements
  if (requestedFrequency === 0) {
    return {
      ...baseOutput,
      displayLabel: methodPreview.displayLabel,
      safeMaxFrequency: methodPreview.safeMaxFrequency,
      status: 'blocked_frequency_zero',
      targets: [],
      skippedCandidates: [],
      warnings: [],
      proofLines: [
        '0x frequency selected — no placements to preview.',
        'This is a valid selection indicating "none for this week."',
        'No program changes applied.',
        'Existing saved Method Planner artifacts are separate.',
      ],
      safeNextStep: 'Select a frequency > 0 to see placement preview.',
    }
  }
  
  // Check if method is blocked
  const isBlocked = methodPreview.frequencyPreviewStatus === 'blocked' ||
    methodPreview.eligibilityStatus.startsWith('blocked_')
  
  if (isBlocked) {
    return buildBlockedPreview(methodPreview, requestedFrequency)
  }
  
  // Check if frequency exceeds safe max
  if (requestedFrequency > methodPreview.safeMaxFrequency) {
    return {
      ...baseOutput,
      displayLabel: methodPreview.displayLabel,
      safeMaxFrequency: methodPreview.safeMaxFrequency,
      status: 'blocked_frequency_above_safe_max',
      targets: [],
      skippedCandidates: [],
      warnings: [
        `Requested ${requestedFrequency}x exceeds safe maximum ${methodPreview.safeMaxFrequency}x.`,
      ],
      proofLines: [
        `Frequency ${requestedFrequency}x exceeds safe max ${methodPreview.safeMaxFrequency}x.`,
        'Reduce frequency to see placement preview.',
        'No program changes applied.',
        'Existing saved Method Planner artifacts are separate.',
      ],
      safeNextStep: `Select frequency ≤ ${methodPreview.safeMaxFrequency}x.`,
    }
  }
  
  // Check if method has no eligible slots
  if (methodPreview.eligibleSlots.length === 0) {
    return {
      ...baseOutput,
      displayLabel: methodPreview.displayLabel,
      safeMaxFrequency: methodPreview.safeMaxFrequency,
      status: 'blocked_no_slots',
      targets: [],
      skippedCandidates: [],
      warnings: ['No eligible slots found for this method.'],
      proofLines: [
        'No eligible exercise slots found.',
        'Cannot preview placements without valid targets.',
        'No program changes applied.',
        'Existing saved Method Planner artifacts are separate.',
      ],
      safeNextStep: 'Check if program has compatible exercises.',
    }
  }
  
  // Build placement targets
  const { targets, skippedCandidates } = selectPlacementTargets(
    methodPreview,
    requestedFrequency
  )
  
  // Determine status based on targets
  const hasCaution = targets.some(t => t.cautionReasons.length > 0) ||
    methodPreview.eligibilityStatus === 'eligible_with_caution'
  
  const status: FrequencySlotPlacementPreviewStatus = hasCaution
    ? 'preview_ready_with_caution'
    : 'preview_ready'
  
  const warnings: string[] = []
  if (hasCaution) {
    warnings.push('Some placements have caution flags — review carefully.')
  }
  if (targets.length < requestedFrequency) {
    warnings.push(`Only ${targets.length} of ${requestedFrequency} placements available.`)
  }
  
  return {
    ...baseOutput,
    displayLabel: methodPreview.displayLabel,
    safeMaxFrequency: methodPreview.safeMaxFrequency,
    status,
    targets,
    skippedCandidates,
    warnings,
    proofLines: [
      `Preview: ${targets.length} placement(s) for ${methodPreview.displayLabel} @ ${requestedFrequency}x/week.`,
      'Preview only — no program changes applied.',
      'Selections are not saved.',
      'Existing saved Method Planner artifacts are separate.',
      'This preview does not remove or alter saved methods.',
    ],
    safeNextStep: 'Implement mutation contract in MASTER-8C.10 to apply.',
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Build a blocked preview with specific reason
 */
function buildBlockedPreview(
  methodPreview: MethodFrequencyPreview,
  requestedFrequency: number
): FrequencySlotPlacementPreview {
  const { canonicalKey, displayLabel, safeMaxFrequency, blockedReason, eligibilityStatus } = methodPreview
  
  // Determine specific blocked status
  let status: FrequencySlotPlacementPreviewStatus = 'blocked_method_not_selectable'
  let blockedMessage = blockedReason ?? 'Method is not selectable for new frequency placement.'
  
  if (eligibilityStatus === 'blocked_density_timed_logging_missing') {
    status = 'blocked_runtime_contract'
    blockedMessage = 'Timed-window logging model required before density placement.'
  } else if (eligibilityStatus === 'blocked_finisher_not_materialized') {
    status = 'blocked_no_real_prescription'
    blockedMessage = 'Real modality/exercise prescription required before finisher placement.'
  } else if (eligibilityStatus === 'blocked_contract_not_ready') {
    status = 'blocked_no_structural_writer'
    blockedMessage = blockedReason ?? 'Structural writer not implemented for this method.'
  }
  
  return {
    version: 'MASTER-8C.9',
    source: 'slot_eligibility_frequency_preview',
    methodKey: canonicalKey,
    displayLabel,
    requestedFrequency,
    safeMaxFrequency,
    status,
    mutationAllowedNow: false,
    selectionPersists: false,
    programChanged: false,
    existingSavedArtifactsAreSeparate: true,
    targets: [],
    skippedCandidates: [],
    warnings: [blockedMessage],
    proofLines: [
      `${displayLabel} is blocked for new frequency placement.`,
      blockedMessage,
      'Existing saved Method Planner artifacts are separate from new planning.',
      'Blocked for NEW placement does not mean existing saved artifact was deleted.',
      'No program changes applied.',
    ],
    safeNextStep: 'Implement required contract/runtime support first.',
  }
}

/**
 * Select up to `requestedFrequency` placement targets from eligible slots.
 * 
 * Ranking rules:
 * - Prefer high-confidence slots
 * - Prefer different sessions before repeating
 * - Prefer spacing across the week
 * - Prefer slots not already method-owned
 * - Avoid primary skill rows for high-fatigue methods
 * - Do not select more than requestedFrequency
 */
function selectPlacementTargets(
  methodPreview: MethodFrequencyPreview,
  requestedFrequency: number
): {
  targets: FrequencySlotPlacementTarget[]
  skippedCandidates: FrequencySlotSkippedCandidate[]
} {
  const eligibleSlots = [...methodPreview.eligibleSlots]
  const selectedTargets: FrequencySlotPlacementTarget[] = []
  const skippedCandidates: FrequencySlotSkippedCandidate[] = []
  const usedSessionIds = new Set<string>()
  
  // Sort slots by ranking priority
  const rankedSlots = eligibleSlots
    .filter(slot => slot.isEligible && !slot.isSyntheticArtifact)
    .sort((a, b) => {
      // 1. Prefer high confidence
      const confOrder = { high: 0, medium: 1, low: 2 }
      const confDiff = confOrder[a.confidence] - confOrder[b.confidence]
      if (confDiff !== 0) return confDiff
      
      // 2. Prefer not already method-owned
      if (a.isAlreadyMethodOwned !== b.isAlreadyMethodOwned) {
        return a.isAlreadyMethodOwned ? 1 : -1
      }
      
      // 3. Prefer not primary skill sensitive
      if (a.isPrimarySkillSensitive !== b.isPrimarySkillSensitive) {
        return a.isPrimarySkillSensitive ? 1 : -1
      }
      
      // 4. Prefer fewer caution reasons
      const cautionDiff = a.cautionReasons.length - b.cautionReasons.length
      if (cautionDiff !== 0) return cautionDiff
      
      // 5. Preserve session order for spacing
      return a.sessionIndex - b.sessionIndex
    })
  
  // Select slots with spacing preference
  for (const slot of rankedSlots) {
    if (selectedTargets.length >= requestedFrequency) break
    
    // Skip if we already have a target in this session and have unused sessions
    const hasUnusedSessions = rankedSlots.some(
      s => !usedSessionIds.has(s.sessionId) && 
           s.isEligible && 
           !s.isSyntheticArtifact &&
           !selectedTargets.some(t => t.sessionId === s.sessionId)
    )
    
    if (usedSessionIds.has(slot.sessionId) && hasUnusedSessions) {
      skippedCandidates.push({
        sessionId: slot.sessionId,
        sessionIndex: slot.sessionIndex,
        sessionLabel: slot.sessionLabel,
        exerciseNames: slot.exerciseNames,
        reason: 'Skipped for spacing — prefer different sessions',
        reasonCode: 'ranked_by_spacing',
      })
      continue
    }
    
    // Skip already method-owned if we have alternatives
    if (slot.isAlreadyMethodOwned) {
      const hasNonOwned = rankedSlots.some(
        s => !s.isAlreadyMethodOwned && 
             s.isEligible && 
             !selectedTargets.some(t => t.sessionId === s.sessionId && t.exerciseIds.join() === s.exerciseIds.join())
      )
      if (hasNonOwned) {
        skippedCandidates.push({
          sessionId: slot.sessionId,
          sessionIndex: slot.sessionIndex,
          sessionLabel: slot.sessionLabel,
          exerciseNames: slot.exerciseNames,
          reason: 'Already method-owned — prefer unowned slots',
          reasonCode: 'avoided_existing_method_owner',
        })
        continue
      }
    }
    
    // Add this slot as a target
    usedSessionIds.add(slot.sessionId)
    selectedTargets.push(buildPlacementTarget(methodPreview, slot, selectedTargets.length + 1))
  }
  
  return { targets: selectedTargets, skippedCandidates }
}

/**
 * Build a single placement target from a slot
 */
function buildPlacementTarget(
  methodPreview: MethodFrequencyPreview,
  slot: MethodEligibleSlot,
  placementNumber: number
): FrequencySlotPlacementTarget {
  const exerciseName = slot.exerciseNames[0] ?? 'Unknown Exercise'
  
  return {
    methodKey: methodPreview.canonicalKey,
    displayLabel: methodPreview.displayLabel,
    sessionId: slot.sessionId,
    sessionIndex: slot.sessionIndex,
    sessionLabel: slot.sessionLabel,
    dayTitle: slot.dayTitle,
    slotKind: slot.slotKind,
    exerciseIds: slot.exerciseIds,
    exerciseNames: slot.exerciseNames,
    placementLabel: `Placement #${placementNumber}`,
    placementSummary: `${slot.sessionLabel} — ${exerciseName}`,
    whyChosen: buildWhyChosen(slot),
    confidence: slot.confidence,
    cautionReasons: slot.cautionReasons,
    previewBefore: 'Standard sets',
    previewAfter: `${methodPreview.displayLabel} preview`,
    wouldMutateIfAppliedLater: false,
    appliedNow: false,
  }
}

/**
 * Build human-readable "why chosen" explanation
 */
function buildWhyChosen(slot: MethodEligibleSlot): string {
  const reasons: string[] = []
  
  if (slot.confidence === 'high') {
    reasons.push('High-confidence slot')
  } else if (slot.confidence === 'medium') {
    reasons.push('Medium-confidence slot')
  }
  
  if (!slot.isAlreadyMethodOwned) {
    reasons.push('Not already method-owned')
  }
  
  if (!slot.isPrimarySkillSensitive) {
    reasons.push('Not primary skill sensitive')
  }
  
  if (slot.cautionReasons.length === 0) {
    reasons.push('No caution flags')
  }
  
  return reasons.length > 0 ? reasons.join(', ') : 'Eligible slot'
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Check if a method can have placement preview generated
 */
export function canGeneratePlacementPreview(
  methodPreview: MethodFrequencyPreview
): boolean {
  return methodPreview.userSelectableNow &&
    methodPreview.frequencyPreviewStatus !== 'blocked' &&
    !methodPreview.eligibilityStatus.startsWith('blocked_')
}

/**
 * Get a human-readable blocked reason for UI display
 */
export function getPlacementBlockedReason(
  methodPreview: MethodFrequencyPreview
): string | null {
  if (!methodPreview.blockedReason) return null
  
  // Map technical reasons to user-friendly messages
  if (methodPreview.eligibilityStatus === 'blocked_density_timed_logging_missing') {
    return 'Timed-window logging required'
  }
  if (methodPreview.eligibilityStatus === 'blocked_finisher_not_materialized') {
    return 'Real exercise prescription required'
  }
  if (methodPreview.eligibilityStatus === 'blocked_contract_not_ready') {
    return 'Structural writer not ready'
  }
  
  return methodPreview.blockedReason
}
