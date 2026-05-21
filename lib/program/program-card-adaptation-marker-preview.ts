/**
 * [Prompt 78] Program Card Adaptation Marker Preview
 * MASTER-8C.83 / AB20.4.76
 *
 * Read-only preview model showing how future adapted sessions would be marked
 * on Program Cards. This is preview-only: no actual Program Card mutation,
 * no Start Workout bridge, no Live Workout bridge.
 *
 * Hard invariants:
 * - programCardsChanged: false
 * - startWorkoutChanged: false
 * - liveWorkoutChanged: false
 * - futureSessionsMutated: false
 * - completedSessionsProtected: true
 * - storageTouched: false
 * - apiTouched: false
 * - dbTouched: false
 * - schemaTouched: false
 * - mutationWriterEnabled: false
 * - appliedChangeCount: 0
 */

import type { PlanLogicMutationReadinessRoadmapStep } from './plan-logic-mutation-readiness-roadmap-source'
import type { FutureSessionMutationApplyCandidateModel } from './future-session-mutation-apply-candidate'
import type { FutureSessionMutationDraftPreviewModel } from './future-session-mutation-draft-preview'

// ─────────────────────────────────────────────────────────────────────────────
// Status union
// ─────────────────────────────────────────────────────────────────────────────
export type ProgramCardAdaptationMarkerPreviewStatus =
  | 'blocked_roadmap_missing'
  | 'blocked_apply_candidate_missing'
  | 'blocked_draft_preview_missing'
  | 'blocked_no_draft_items'
  | 'blocked_upstream_not_ready'
  | 'not_ready'
  | 'preview_ready'

// ─────────────────────────────────────────────────────────────────────────────
// Preview item interface
// ─────────────────────────────────────────────────────────────────────────────
export interface ProgramCardAdaptationMarkerPreviewItem {
  readonly sessionId: string
  readonly dayLabel: string
  readonly sessionTitle: string
  readonly markerLabel: string
  readonly markerTone: 'emerald' | 'amber' | 'cyan' | 'violet' | 'zinc'
  readonly markerPreviewText: string
  readonly whyShown: string
  readonly wouldProgramCardChange: false
  readonly wouldStartWorkoutChange: false
  readonly wouldLiveWorkoutChange: false
  readonly sourceDraftItemId?: string
  readonly sourceTargetSessionId?: string
  // [Prompt 80.1] Target day number for matching to actual Program Day cards
  readonly targetDayNumber?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Model interface
// ─────────────────────────────────────────────────────────────────────────────
export interface ProgramCardAdaptationMarkerPreviewModel {
  readonly promptNumber: 78
  readonly totalPrompts: 85
  readonly masterStep: 'MASTER-8C.83'
  readonly abStep: 'AB20.4.76'
  readonly sourceStep: 'MASTER-8C.83 / AB20.4.76 / Prompt 78'
  readonly status: ProgramCardAdaptationMarkerPreviewStatus
  readonly statusLabel: string
  readonly headline: string
  readonly summary: string

  // Hard-locked invariants
  readonly previewOnly: true
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionsMutated: false
  readonly completedSessionsProtected: true
  readonly storageTouched: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly schemaTouched: false
  readonly mutationWriterEnabled: false
  readonly appliedChangeCount: 0

  // Upstream state
  readonly applyCandidateReady: boolean
  readonly applyButtonEnabled: boolean
  readonly userConfirmationPresent: boolean

  // Preview state
  readonly markerPreviewReady: boolean
  readonly markerPreviewItemCount: number
  readonly targetSessionCount: number
  readonly previewItems: readonly ProgramCardAdaptationMarkerPreviewItem[]

  // Diagnostic
  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Input interface
// ─────────────────────────────────────────────────────────────────────────────
export interface ProgramCardAdaptationMarkerPreviewInput {
  readonly roadmapStep: PlanLogicMutationReadinessRoadmapStep | null | undefined
  readonly futureSessionMutationApplyCandidateModel: FutureSessionMutationApplyCandidateModel | null | undefined
  readonly futureSessionMutationDraftPreviewModel: FutureSessionMutationDraftPreviewModel | null | undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────────────────────
export function getProgramCardAdaptationMarkerPreviewStatusLabel(
  status: ProgramCardAdaptationMarkerPreviewStatus
): string {
  switch (status) {
    case 'blocked_roadmap_missing':
      return 'Blocked: Roadmap Missing'
    case 'blocked_apply_candidate_missing':
      return 'Blocked: Apply Candidate Missing'
    case 'blocked_draft_preview_missing':
      return 'Blocked: Draft Preview Missing'
    case 'blocked_no_draft_items':
      return 'Blocked: No Draft Items'
    case 'blocked_upstream_not_ready':
      return 'Blocked: Upstream Not Ready'
    case 'not_ready':
      return 'Not Ready'
    case 'preview_ready':
      return 'Preview Ready'
    default:
      return 'Unknown'
  }
}

export function getProgramCardAdaptationMarkerPreviewStatusColor(
  status: ProgramCardAdaptationMarkerPreviewStatus
): 'red' | 'amber' | 'lime' | 'sky' {
  switch (status) {
    case 'blocked_roadmap_missing':
    case 'blocked_apply_candidate_missing':
    case 'blocked_draft_preview_missing':
      return 'red'
    case 'blocked_no_draft_items':
    case 'blocked_upstream_not_ready':
    case 'not_ready':
      return 'amber'
    case 'preview_ready':
      return 'lime'
    default:
      return 'amber'
  }
}

export function getProgramCardMarkerToneClass(
  tone: ProgramCardAdaptationMarkerPreviewItem['markerTone']
): string {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20'
    case 'amber':
      return 'bg-amber-500/10 text-amber-400/70 border-amber-500/20'
    case 'cyan':
      return 'bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20'
    case 'violet':
      return 'bg-violet-500/10 text-violet-400/70 border-violet-500/20'
    case 'zinc':
    default:
      return 'bg-zinc-500/10 text-zinc-400/70 border-zinc-500/20'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolver
// ─────────────────────────────────────────────────────────────────────────────
export function resolveProgramCardAdaptationMarkerPreview(
  input: ProgramCardAdaptationMarkerPreviewInput
): ProgramCardAdaptationMarkerPreviewModel {
  const { roadmapStep, futureSessionMutationApplyCandidateModel, futureSessionMutationDraftPreviewModel } = input

  // Hard-locked base fields
  const base = {
    promptNumber: 78 as const,
    totalPrompts: 85 as const,
    masterStep: 'MASTER-8C.83' as const,
    abStep: 'AB20.4.76' as const,
    sourceStep: 'MASTER-8C.83 / AB20.4.76 / Prompt 78' as const,
    previewOnly: true as const,
    programCardsChanged: false as const,
    startWorkoutChanged: false as const,
    liveWorkoutChanged: false as const,
    futureSessionsMutated: false as const,
    completedSessionsProtected: true as const,
    storageTouched: false as const,
    apiTouched: false as const,
    dbTouched: false as const,
    schemaTouched: false as const,
    mutationWriterEnabled: false as const,
    appliedChangeCount: 0 as const,
  }

  // Step 1: Missing roadmap
  if (!roadmapStep) {
    return {
      ...base,
      status: 'blocked_roadmap_missing',
      statusLabel: getProgramCardAdaptationMarkerPreviewStatusLabel('blocked_roadmap_missing'),
      headline: 'Program Card Marker Preview Blocked',
      summary: 'Prompt 78 roadmap source entry not found. Cannot generate marker preview without roadmap context.',
      applyCandidateReady: false,
      applyButtonEnabled: false,
      userConfirmationPresent: false,
      markerPreviewReady: false,
      markerPreviewItemCount: 0,
      targetSessionCount: 0,
      previewItems: [],
      blockers: ['Prompt 78 roadmap source entry not found'],
      safetyNotes: ['No marker preview can be generated until roadmap source is present'],
      nextRequiredStep: 'Add Prompt 78 roadmap entry',
    }
  }

  // Step 2: Missing apply candidate model
  if (!futureSessionMutationApplyCandidateModel) {
    return {
      ...base,
      status: 'blocked_apply_candidate_missing',
      statusLabel: getProgramCardAdaptationMarkerPreviewStatusLabel('blocked_apply_candidate_missing'),
      headline: 'Program Card Marker Preview Blocked',
      summary: 'Prompt 77 apply candidate model is missing. Cannot generate marker preview without upstream apply candidate.',
      applyCandidateReady: false,
      applyButtonEnabled: false,
      userConfirmationPresent: false,
      markerPreviewReady: false,
      markerPreviewItemCount: 0,
      targetSessionCount: 0,
      previewItems: [],
      blockers: ['Prompt 77 apply candidate model is missing'],
      safetyNotes: ['Marker preview requires upstream apply candidate model'],
      nextRequiredStep: 'Wire Prompt 77 apply candidate model',
    }
  }

  // Step 3: Missing draft preview model
  if (!futureSessionMutationDraftPreviewModel) {
    return {
      ...base,
      status: 'blocked_draft_preview_missing',
      statusLabel: getProgramCardAdaptationMarkerPreviewStatusLabel('blocked_draft_preview_missing'),
      headline: 'Program Card Marker Preview Blocked',
      summary: 'Prompt 76 draft preview model is missing. Cannot generate marker preview without upstream draft data.',
      applyCandidateReady: futureSessionMutationApplyCandidateModel.applyCandidateReady,
      applyButtonEnabled: futureSessionMutationApplyCandidateModel.applyButtonEnabled,
      userConfirmationPresent: futureSessionMutationApplyCandidateModel.prompt75UserConfirmationPresent,
      markerPreviewReady: false,
      markerPreviewItemCount: 0,
      targetSessionCount: 0,
      previewItems: [],
      blockers: ['Prompt 76 draft preview model is missing'],
      safetyNotes: ['Marker preview requires upstream draft preview model'],
      nextRequiredStep: 'Wire Prompt 76 draft preview model',
    }
  }

  // Extract upstream state
  const applyCandidateReady = futureSessionMutationApplyCandidateModel.applyCandidateReady
  const applyButtonEnabled = futureSessionMutationApplyCandidateModel.applyButtonEnabled
  const userConfirmationPresent = futureSessionMutationApplyCandidateModel.prompt75UserConfirmationPresent
  const draftItems = futureSessionMutationDraftPreviewModel.draftItems
  const targetSessionCount = futureSessionMutationDraftPreviewModel.targetSessionCount

  // Step 4: No draft items
  if (draftItems.length === 0) {
    return {
      ...base,
      status: 'blocked_no_draft_items',
      statusLabel: getProgramCardAdaptationMarkerPreviewStatusLabel('blocked_no_draft_items'),
      headline: 'No Program Card Markers to Preview',
      summary: 'No draft session items exist yet. Program Card marker preview requires at least one draft candidate session.',
      applyCandidateReady,
      applyButtonEnabled,
      userConfirmationPresent,
      markerPreviewReady: false,
      markerPreviewItemCount: 0,
      targetSessionCount,
      previewItems: [],
      blockers: ['No draft session items exist — cannot generate marker preview'],
      safetyNotes: ['Marker preview will populate when upstream draft items are created'],
      nextRequiredStep: 'Wait for upstream draft preview to produce candidate sessions',
    }
  }

  // Step 5: Generate preview items from draft items
  const previewItems: ProgramCardAdaptationMarkerPreviewItem[] = draftItems.map((item, index) => {
    const tones: ProgramCardAdaptationMarkerPreviewItem['markerTone'][] = ['emerald', 'amber', 'cyan', 'violet', 'zinc']
    const tone = tones[index % tones.length]

    return {
      sessionId: item.key || `draft-session-${index}`,
      dayLabel: `Session ${index + 1}`,
      sessionTitle: item.label || 'Future Session',
      markerLabel: 'Adaptive preview',
      markerTone: tone,
      markerPreviewText: `Would show: ${item.reason || 'Workout adjusted from recent performance.'}`,
      whyShown: `Draft item: ${item.label} (${item.confidence} confidence)`,
      wouldProgramCardChange: false as const,
      wouldStartWorkoutChange: false as const,
      wouldLiveWorkoutChange: false as const,
      sourceDraftItemId: item.key,
      sourceTargetSessionId: item.key,
      // [Prompt 80.1] Target day number for matching - derived from draft item index
      targetDayNumber: index + 1,
    }
  })

  // Build blockers and safety notes
  const blockers: string[] = []
  const safetyNotes: string[] = [
    'This is a preview only — no actual Program Cards have been changed',
    'Start Workout and Live Workout remain unchanged',
    'Completed sessions are protected',
  ]

  if (!userConfirmationPresent) {
    blockers.push('User confirmation not yet present — markers shown as preview only')
    safetyNotes.push('Markers will only apply after explicit user confirmation')
  }

  if (!applyCandidateReady) {
    blockers.push('Apply candidate not ready — upstream gates must pass first')
  }

  // Determine final status
  const markerPreviewReady = previewItems.length > 0
  const status: ProgramCardAdaptationMarkerPreviewStatus = markerPreviewReady ? 'preview_ready' : 'not_ready'

  return {
    ...base,
    status,
    statusLabel: getProgramCardAdaptationMarkerPreviewStatusLabel(status),
    headline: markerPreviewReady
      ? 'Program Card Marker Preview Ready'
      : 'Program Card Marker Preview Not Ready',
    summary: markerPreviewReady
      ? `Showing how ${previewItems.length} Program Card(s) would be marked if adaptation is later authorized. No actual cards changed yet.`
      : 'No marker preview is available because no eligible draft session markers exist.',
    applyCandidateReady,
    applyButtonEnabled,
    userConfirmationPresent,
    markerPreviewReady,
    markerPreviewItemCount: previewItems.length,
    targetSessionCount,
    previewItems,
    blockers,
    safetyNotes,
    nextRequiredStep: markerPreviewReady
      ? 'Prompt 79: Program Card Changed-Session Proof / No Start Workout Bridge'
      : 'Wait for draft items to be generated',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// [Prompt 80.3] Source-backed marker extraction - no hardcoded Day 1, no demo data
// Returns preview items only from real ProgramCardAdaptationMarkerPreviewModel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract marker preview items from a source-backed preview model.
 * Returns items only when the model is ready and has real source-backed data.
 * Returns empty array when model is missing, blocked, or has no items.
 * Never invents markers or hardcodes target days.
 */
export function extractSourceBackedMarkerPreviewItems(
  model: ProgramCardAdaptationMarkerPreviewModel | null | undefined
): readonly ProgramCardAdaptationMarkerPreviewItem[] {
  // No model = no markers
  if (!model) {
    return []
  }
  
  // Model not ready = no markers
  if (!model.markerPreviewReady) {
    return []
  }
  
  // No items = no markers
  if (!model.previewItems || model.previewItems.length === 0) {
    return []
  }
  
  // Return real source-backed items only
  return model.previewItems
}
