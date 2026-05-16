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
  // [MASTER-8C.10.1] New reason codes for collision guard and smarter ranking
  | 'blocked_existing_grouped_method_owner'
  | 'avoided_adjacent_same_exercise'
  | 'avoided_adjacent_high_fatigue_method'
  | 'avoided_duplicate_exercise_frequency'
  | 'selected_best_non_adjacent_alternative'
  | 'forced_duplicate_no_alternative'

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
  // [MASTER-8C.12.2] Affected-day preview fields
  readonly nearbyExercises: readonly string[]  // 2-4 surrounding exercises for context
  readonly existingMethodsOnDay: readonly string[]  // Other methods already on this day
  readonly isFirstPlacementOnDay: boolean  // Whether this is first method placement on day
  readonly dayMethodLoad: number  // Total method load on this day
  readonly sessionFocus?: string  // Session focus/title if available
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
      safeNextStep: `Select frequency ��� ${methodPreview.safeMaxFrequency}x.`,
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
  // [MASTER-8C.10.1] Now returns warnings for adjacent duplicate exercise, etc.
  const { targets, skippedCandidates, warnings: selectionWarnings } = selectPlacementTargets(
    methodPreview,
    requestedFrequency
  )
  
  // Determine status based on targets
  const hasCaution = targets.some(t => t.cautionReasons.length > 0) ||
    methodPreview.eligibilityStatus === 'eligible_with_caution' ||
    selectionWarnings.length > 0
  
  const status: FrequencySlotPlacementPreviewStatus = hasCaution
    ? 'preview_ready_with_caution'
    : 'preview_ready'
  
  const warnings: string[] = [...selectionWarnings]
  if (targets.some(t => t.cautionReasons.length > 0)) {
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
 * [MASTER-8C.10.1] Select up to `requestedFrequency` placement targets from eligible slots.
 * 
 * Ranking rules (enhanced):
 * - Hard block already method-owned targets
 * - Prefer high-confidence slots
 * - Strongly penalize same exercise name on adjacent sessions
 * - Prefer different sessions before repeating
 * - Prefer spacing across the week
 * - Avoid primary skill rows for high-fatigue methods
 * - Do not select more than requestedFrequency
 */
function selectPlacementTargets(
  methodPreview: MethodFrequencyPreview,
  requestedFrequency: number
): {
  targets: FrequencySlotPlacementTarget[]
  skippedCandidates: FrequencySlotSkippedCandidate[]
  warnings: string[]
} {
  const eligibleSlots = [...methodPreview.eligibleSlots]
  const selectedTargets: FrequencySlotPlacementTarget[] = []
  const skippedCandidates: FrequencySlotSkippedCandidate[] = []
  const warnings: string[] = []
  const usedSessionIds = new Set<string>()
  const usedExerciseNames = new Set<string>()
  const selectedSessionIndices: number[] = []
  
  // Helper to normalize exercise name for comparison
  const normalizeExName = (name: string): string => name.toLowerCase().trim().replace(/[\s_-]+/g, '_')
  
  // Helper to check if selecting this slot would create adjacent same-exercise
  const wouldCreateAdjacentDuplicate = (slot: MethodEligibleSlot): boolean => {
    const slotExName = normalizeExName(slot.exerciseNames[0] ?? '')
    if (!slotExName || !usedExerciseNames.has(slotExName)) return false
    
    // Check if any selected target with same exercise is adjacent (within 1 session)
    for (let i = 0; i < selectedTargets.length; i++) {
      const existingTarget = selectedTargets[i]
      const existingExName = normalizeExName(existingTarget.exerciseNames[0] ?? '')
      if (existingExName === slotExName) {
        const indexDiff = Math.abs(slot.sessionIndex - existingTarget.sessionIndex)
        if (indexDiff <= 1) {
          return true
        }
      }
    }
    return false
  }
  
  // [MASTER-8C.12.1D] Calculate session method load for smarter ranking
  // Count existing user-applied methods per session to prefer less-loaded days
  const sessionMethodLoad = new Map<number, number>()
  eligibleSlots.forEach(slot => {
    const currentLoad = sessionMethodLoad.get(slot.sessionIndex) || 0
    // Count owned methods as load
    if (slot.isAlreadyMethodOwned) {
      sessionMethodLoad.set(slot.sessionIndex, currentLoad + 1)
    }
  })
  
  // [MASTER-8C.12.2] Score days for better day-aware selection
  // Group slots by session for day-level scoring
  const slotsBySession = new Map<string, MethodEligibleSlot[]>()
  eligibleSlots.forEach(slot => {
    if (!slotsBySession.has(slot.sessionId)) {
      slotsBySession.set(slot.sessionId, [])
    }
    slotsBySession.get(slot.sessionId)!.push(slot)
  })
  
  // Calculate day scores (lower = better)
  const dayScores = new Map<string, number>()
  const allSessionIndices = [...new Set(eligibleSlots.map(s => s.sessionIndex))]
  const maxSessionIndex = Math.max(...allSessionIndices, 0)
  
  slotsBySession.forEach((slots, sessionId) => {
    const sessionIndex = slots[0]?.sessionIndex ?? 0
    const methodLoad = sessionMethodLoad.get(sessionIndex) || 0
    const hasEligibleSlots = slots.some(s => s.isEligible && !s.isSyntheticArtifact && !s.isAlreadyMethodOwned)
    const bestSlotConfidence = slots.reduce((best, s) => {
      if (!s.isEligible || s.isSyntheticArtifact || s.isAlreadyMethodOwned) return best
      const confScore = s.confidence === 'high' ? 0 : s.confidence === 'medium' ? 1 : 2
      return Math.min(best, confScore)
    }, 3)
    
    // Score components (lower = better):
    // - Method load is primary (0-10 scale per method)
    // - Confidence is secondary  
    // - Later days are NOT penalized (don't bias toward early days)
    let score = methodLoad * 10 + bestSlotConfidence
    
    // If no eligible slots, heavily penalize
    if (!hasEligibleSlots) score += 1000
    
    dayScores.set(sessionId, score)
  })
  
  // Sort slots by ranking priority (enhanced with day-aware scoring)
  const rankedSlots = eligibleSlots
    .filter(slot => slot.isEligible && !slot.isSyntheticArtifact)
    .sort((a, b) => {
      // 1. Hard block already method-owned
      if (a.isAlreadyMethodOwned !== b.isAlreadyMethodOwned) {
        return a.isAlreadyMethodOwned ? 1 : -1
      }
      
      // 2. [MASTER-8C.12.2] Prefer days with lower scores (less method load)
      const dayScoreA = dayScores.get(a.sessionId) ?? 999
      const dayScoreB = dayScores.get(b.sessionId) ?? 999
      if (dayScoreA !== dayScoreB) return dayScoreA - dayScoreB
      
      // 3. Prefer high confidence
      const confOrder = { high: 0, medium: 1, low: 2 }
      const confDiff = confOrder[a.confidence] - confOrder[b.confidence]
      if (confDiff !== 0) return confDiff
      
      // 4. Prefer not primary skill sensitive
      if (a.isPrimarySkillSensitive !== b.isPrimarySkillSensitive) {
        return a.isPrimarySkillSensitive ? 1 : -1
      }
      
      // 5. Prefer fewer caution reasons
      const cautionDiff = a.cautionReasons.length - b.cautionReasons.length
      if (cautionDiff !== 0) return cautionDiff
      
      // 6. [MASTER-8C.12.2] Do NOT bias toward early days
      // Instead, use a deterministic but neutral order (by session index for stability)
      return a.sessionIndex - b.sessionIndex
    })
  
  // Select slots with enhanced spacing and duplicate avoidance
  for (const slot of rankedSlots) {
    if (selectedTargets.length >= requestedFrequency) break
    
    // Hard block: Skip already method-owned slots
    if (slot.isAlreadyMethodOwned) {
      skippedCandidates.push({
        sessionId: slot.sessionId,
        sessionIndex: slot.sessionIndex,
        sessionLabel: slot.sessionLabel,
        exerciseNames: slot.exerciseNames,
        reason: 'Already has method ownership — blocked to prevent stacking',
        reasonCode: 'blocked_existing_grouped_method_owner',
      })
      continue
    }
    
    // Spacing check: Skip if we already have a target in this session and have unused sessions
    const hasUnusedSessions = rankedSlots.some(
      s => !usedSessionIds.has(s.sessionId) && 
           s.isEligible && 
           !s.isSyntheticArtifact &&
           !s.isAlreadyMethodOwned &&
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
    
    // [MASTER-8C.10.1] Adjacent duplicate check
    const slotExName = normalizeExName(slot.exerciseNames[0] ?? '')
    if (wouldCreateAdjacentDuplicate(slot)) {
      // Check if there are better alternatives (different exercise, not adjacent)
      const hasBetterAlternative = rankedSlots.some(s => {
        if (s === slot) return false
        if (s.isAlreadyMethodOwned || !s.isEligible || s.isSyntheticArtifact) return false
        if (selectedTargets.some(t => t.sessionId === s.sessionId)) return false
        const altExName = normalizeExName(s.exerciseNames[0] ?? '')
        // Better if different exercise OR same exercise but not adjacent
        if (altExName !== slotExName) return true
        const wouldBeAdjacent = selectedSessionIndices.some(idx => Math.abs(s.sessionIndex - idx) <= 1)
        return !wouldBeAdjacent
      })
      
      if (hasBetterAlternative) {
        skippedCandidates.push({
          sessionId: slot.sessionId,
          sessionIndex: slot.sessionIndex,
          sessionLabel: slot.sessionLabel,
          exerciseNames: slot.exerciseNames,
          reason: 'Same exercise on adjacent day — better alternative exists',
          reasonCode: 'avoided_adjacent_same_exercise',
        })
        continue
      } else {
        // No better alternative — allow but add warning
        warnings.push(`${slot.exerciseNames[0]} selected on adjacent days — no better alternative available`)
      }
    }
    
    // Add this slot as a target
    usedSessionIds.add(slot.sessionId)
    usedExerciseNames.add(slotExName)
    selectedSessionIndices.push(slot.sessionIndex)
    const methodLoad = sessionMethodLoad.get(slot.sessionIndex) || 0
    const isFirstOnDay = !selectedTargets.some(t => t.sessionId === slot.sessionId)
    selectedTargets.push(buildPlacementTarget(
      methodPreview, 
      slot, 
      selectedTargets.length + 1, 
      methodLoad,
      isFirstOnDay,
      eligibleSlots
    ))
  }
  
  return { targets: selectedTargets, skippedCandidates, warnings }
}

/**
 * Build a single placement target from a slot
 * [MASTER-8C.12.1D] Now accepts method load for whyChosen reasoning
 * [MASTER-8C.12.2] Now includes affected-day preview context
 */
function buildPlacementTarget(
  methodPreview: MethodFrequencyPreview,
  slot: MethodEligibleSlot,
  placementNumber: number,
  methodLoad: number,
  isFirstOnDay: boolean,
  allSlots: MethodEligibleSlot[]
): FrequencySlotPlacementTarget {
  const exerciseName = slot.exerciseNames[0] ?? 'Unknown Exercise'
  
  // [MASTER-8C.12.2] Build nearby exercises for affected-day preview
  const sameSessionSlots = allSlots
    .filter(s => s.sessionId === slot.sessionId)
    .sort((a, b) => a.slotKind.localeCompare(b.slotKind))
  
  const slotIndex = sameSessionSlots.findIndex(s => 
    s.exerciseIds[0] === slot.exerciseIds[0]
  )
  
  // Get 2 exercises before and 2 after for context (up to 4 total)
  const nearbyStart = Math.max(0, slotIndex - 2)
  const nearbyEnd = Math.min(sameSessionSlots.length, slotIndex + 3)
  const nearbyExercises = sameSessionSlots
    .slice(nearbyStart, nearbyEnd)
    .filter(s => s.exerciseIds[0] !== slot.exerciseIds[0])
    .map(s => s.exerciseNames[0] ?? 'Unknown')
    .slice(0, 4)
  
  // Find existing methods on this day (count of method-owned slots)
  const existingMethodsOnDay = sameSessionSlots
    .filter(s => s.isAlreadyMethodOwned)
    .map(s => 'Method override')  // Generic label since we don't have specific method names
    .filter((v, i, a) => a.indexOf(v) === i) // Unique
  
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
    whyChosen: buildWhyChosen(slot, methodLoad, isFirstOnDay),
    confidence: slot.confidence,
    cautionReasons: slot.cautionReasons,
    previewBefore: 'Standard sets',
    previewAfter: `${methodPreview.displayLabel} preview`,
    wouldMutateIfAppliedLater: false,
    appliedNow: false,
    // [MASTER-8C.12.2] New affected-day preview fields
    nearbyExercises,
    existingMethodsOnDay,
    isFirstPlacementOnDay: isFirstOnDay,
    dayMethodLoad: methodLoad,
    sessionFocus: slot.sessionLabel,
  }
}

/**
 * Build human-readable "why chosen" explanation
 * [MASTER-8C.12.1D] Now includes method load reasoning
 * [MASTER-8C.12.2] Enhanced with day spread and first-on-day explanations
 */
function buildWhyChosen(slot: MethodEligibleSlot, methodLoad: number, isFirstOnDay: boolean): string {
  const reasons: string[] = []
  
  // [MASTER-8C.12.2] Lead with spread/stacking context
  if (isFirstOnDay && methodLoad === 0) {
    reasons.push('Best spread: open day')
  } else if (isFirstOnDay) {
    reasons.push('Chosen before stacking')
  } else {
    reasons.push('Stacked: all distinct days used')
  }
  
  // Add confidence
  if (slot.confidence === 'high') {
    reasons.push('high-confidence row')
  } else if (slot.confidence === 'medium') {
    reasons.push('medium-confidence row')
  }
  
  // Add method load context if relevant
  if (methodLoad === 0) {
    reasons.push('no existing methods')
  } else if (methodLoad === 1) {
    reasons.push('1 existing method')
  }
  
  // Add skill sensitivity
  if (!slot.isPrimarySkillSensitive) {
    reasons.push('not skill-sensitive')
  }
  
  // Build final explanation (keep concise: 2-3 key reasons)
  return reasons.slice(0, 3).join(', ') || 'Eligible slot'
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
