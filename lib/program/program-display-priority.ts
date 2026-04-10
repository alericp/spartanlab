/**
 * PROGRAM DISPLAY PRIORITY
 * 
 * =============================================================================
 * CENTRALIZED COMPACTNESS POLICY FOR PRESCRIPTION-FIRST DISPLAY
 * =============================================================================
 * 
 * This module defines what surfaces at each display tier to keep the Program
 * page prescription-first while maintaining AI logic in a secondary role.
 * 
 * PRIORITY ORDER:
 * 1. Daily routine / workout prescription (ALWAYS VISIBLE)
 * 2. Session structure (ALWAYS VISIBLE)
 * 3. Essential session identity (ALWAYS VISIBLE)
 * 4. Secondary AI explanation (COMPACT - max 1 line)
 * 5. Optional deeper evidence (COLLAPSED - modal only)
 * 
 * =============================================================================
 * TRUTH ENFORCEMENT RULES
 * =============================================================================
 * 
 * 1. All display decisions must be derived from centralized contracts
 * 2. Components are RENDERERS, not REASONERS - no local AI logic
 * 3. Authoritative evidence ALWAYS wins over fallback text
 * 4. Every label/chip must trace to one centralized source
 * 5. Fallback is only allowed when authoritative truth is absent
 * 6. Source markers must be preserved through the render path
 */

import type { SessionAiEvidenceSurface } from './program-ai-evidence-bridge'
import type { ExerciseRowSurface } from './program-display-contract'

// =============================================================================
// DISPLAY DENSITY MODE
// =============================================================================

export type DisplayDensityMode = 'prescription_first' | 'balanced' | 'evidence_rich'

/**
 * Default density mode - keeps prescription dominant
 */
export const DEFAULT_DENSITY_MODE: DisplayDensityMode = 'prescription_first'

// =============================================================================
// SESSION CARD VISIBILITY POLICY
// =============================================================================

export interface SessionCardVisibility {
  /** Show session type badge */
  showSessionTypeBadge: boolean
  /** Show training method chip */
  showTrainingMethodChip: boolean
  /** Show work distribution (primary/support counts) */
  showWorkDistribution: boolean
  /** Show primary objective text */
  showPrimaryObjective: boolean
  /** Show execution priority suffix */
  showExecutionPriority: boolean
  /** Show caution note */
  showCautionNote: boolean
  /** Show evidence signals (protection, secondary intent chips) */
  showEvidenceSignals: boolean
  /** Max evidence chips to show */
  maxEvidenceChips: number
  /** Show variety/repetition info */
  showVarietyInfo: boolean
  /** Show adaptation notes */
  showAdaptationNotes: boolean
}

/**
 * Get session card visibility based on density mode
 */
export function getSessionCardVisibility(
  mode: DisplayDensityMode = DEFAULT_DENSITY_MODE
): SessionCardVisibility {
  switch (mode) {
    case 'prescription_first':
      return {
        showSessionTypeBadge: true,
        showTrainingMethodChip: false, // Suppress - duplicates session type
        showWorkDistribution: false, // Suppress - visible from exercise list
        showPrimaryObjective: true,
        showExecutionPriority: false, // Suppress - verbose
        showCautionNote: true, // Keep - safety critical
        showEvidenceSignals: false, // Suppress - move to modal
        maxEvidenceChips: 0,
        showVarietyInfo: false, // Suppress - move to modal
        showAdaptationNotes: false, // Suppress - internal detail
      }
    case 'balanced':
      return {
        showSessionTypeBadge: true,
        showTrainingMethodChip: true,
        showWorkDistribution: true,
        showPrimaryObjective: true,
        showExecutionPriority: false,
        showCautionNote: true,
        showEvidenceSignals: true,
        maxEvidenceChips: 2,
        showVarietyInfo: false,
        showAdaptationNotes: false,
      }
    case 'evidence_rich':
    default:
      return {
        showSessionTypeBadge: true,
        showTrainingMethodChip: true,
        showWorkDistribution: true,
        showPrimaryObjective: true,
        showExecutionPriority: true,
        showCautionNote: true,
        showEvidenceSignals: true,
        maxEvidenceChips: 3,
        showVarietyInfo: true,
        showAdaptationNotes: true,
      }
  }
}

// =============================================================================
// EXERCISE ROW VISIBILITY POLICY
// =============================================================================

export interface ExerciseRowVisibility {
  /** Show row sublabel (purpose/intent line) */
  showSublabel: boolean
  /** Show row chips */
  showChips: boolean
  /** Max chips to show per row */
  maxChips: number
  /** Show why line */
  showWhyLine: boolean
  /** Show constraint note */
  showConstraintNote: boolean
  /** Show exercise-specific note */
  showExerciseNote: boolean
  /** Show knowledge expansion toggle */
  showKnowledgeExpansion: boolean
  /** Only show sublabel for primary emphasis exercises */
  sublabelPrimaryOnly: boolean
}

/**
 * Get exercise row visibility based on density mode
 */
export function getExerciseRowVisibility(
  mode: DisplayDensityMode = DEFAULT_DENSITY_MODE
): ExerciseRowVisibility {
  switch (mode) {
    case 'prescription_first':
      return {
        showSublabel: true, // Show for all exercises to explain purpose + dosage
        showChips: true,
        maxChips: 1, // Limit to 1 chip
        showWhyLine: false, // Suppress - verbose
        showConstraintNote: true, // Keep - safety critical
        showExerciseNote: true, // Keep - user-facing
        showKnowledgeExpansion: true, // Keep - optional drill-in
        sublabelPrimaryOnly: false, // [UPDATED] All exercises get sublabel explanation
      }
    case 'balanced':
      return {
        showSublabel: true,
        showChips: true,
        maxChips: 2,
        showWhyLine: false,
        showConstraintNote: true,
        showExerciseNote: true,
        showKnowledgeExpansion: true,
        sublabelPrimaryOnly: false,
      }
    case 'evidence_rich':
    default:
      return {
        showSublabel: true,
        showChips: true,
        maxChips: 2,
        showWhyLine: true,
        showConstraintNote: true,
        showExerciseNote: true,
        showKnowledgeExpansion: true,
        sublabelPrimaryOnly: false,
      }
  }
}

// =============================================================================
// DEDUPLICATION HELPERS
// =============================================================================

/**
 * Check if two display strings communicate the same meaning
 */
function stringsOverlap(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()
  // Check if one contains significant words from the other
  const aWords = aLower.split(/\s+/).filter(w => w.length > 3)
  const bWords = bLower.split(/\s+/).filter(w => w.length > 3)
  const overlap = aWords.filter(w => bWords.includes(w))
  return overlap.length >= Math.min(aWords.length, bWords.length) * 0.5
}

/**
 * Deduplicate session evidence against session contract to avoid repetition
 */
export function deduplicateSessionDisplay(
  sessionContract: {
    sessionType: string
    trainingMethod?: string | null
    primaryObjective: string
  },
  sessionEvidence: SessionAiEvidenceSurface
): {
  showSecondaryIntent: boolean
  showProtectionLabels: boolean
  showSupportStrategy: boolean
} {
  // Suppress secondary intent if it duplicates session type or objective
  const showSecondaryIntent = sessionEvidence.secondaryIntentLabel !== null &&
    !stringsOverlap(sessionEvidence.secondaryIntentLabel, sessionContract.sessionType) &&
    !stringsOverlap(sessionEvidence.secondaryIntentLabel, sessionContract.primaryObjective)
  
  // Suppress protection if already in objective
  const showProtectionLabels = sessionEvidence.protectionLabels.length > 0 &&
    !sessionEvidence.protectionLabels.some(p => stringsOverlap(p, sessionContract.primaryObjective))
  
  // Suppress support strategy if it duplicates session type
  const showSupportStrategy = sessionEvidence.supportStrategyLabel !== null &&
    !stringsOverlap(sessionEvidence.supportStrategyLabel, sessionContract.sessionType)
  
  return { showSecondaryIntent, showProtectionLabels, showSupportStrategy }
}

/**
 * Deduplicate row surface against itself to pick the strongest single signal
 */
export function deduplicateRowDisplay(
  rowSurface: ExerciseRowSurface,
  visibility: ExerciseRowVisibility
): {
  showSublabel: boolean
  showChips: boolean
  chips: string[]
} {
  // If primary-only mode and not primary, suppress sublabel
  const showSublabel = visibility.showSublabel && 
    (!visibility.sublabelPrimaryOnly || rowSurface.emphasisKind === 'primary')
  
  // Limit chips and remove redundant ones
  let chips = rowSurface.rowChips.slice(0, visibility.maxChips)
  
  // If sublabel shown and chip says same thing, remove chip
  if (showSublabel && rowSurface.intentLabel) {
    chips = chips.filter(chip => !stringsOverlap(chip, rowSurface.intentLabel))
  }
  
  return {
    showSublabel,
    showChips: visibility.showChips && chips.length > 0,
    chips,
  }
}

// =============================================================================
// COMPACT DISPLAY HELPERS
// =============================================================================

/**
 * Get a single compact session summary line (max ~60 chars)
 */
export function getCompactSessionSummary(
  sessionContract: {
    primaryObjective: string
    sessionType: string
  }
): string {
  // Truncate objective if too long
  const objective = sessionContract.primaryObjective
  if (objective.length <= 60) return objective
  return objective.substring(0, 57) + '...'
}

/**
 * Determine if an exercise row should show any AI intelligence layer
 * [UPDATED] All exercises now show explanation to answer "why this exercise + why this dosage"
 */
export function shouldShowRowIntelligence(
  emphasisKind: ExerciseRowSurface['emphasisKind'],
  mode: DisplayDensityMode = DEFAULT_DENSITY_MODE
): boolean {
  if (mode === 'evidence_rich') return true
  if (mode === 'balanced') return emphasisKind !== 'fallback_minimal'
  // prescription_first: ALL exercises show explanation (not just primary)
  // This ensures support/accessory/strength rows also explain purpose + dosage
  return emphasisKind !== 'fallback_minimal'
}
