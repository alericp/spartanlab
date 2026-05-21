'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { AdaptiveSessionCard } from './AdaptiveSessionCard'
import { BuildIdentityStamp } from './BuildIdentityStamp'
import { WhyThisPlanBlock } from './WhyThisWorkoutBlock'
// [SPARTANLAB-P2B] Coach Intelligence Hub — method planner corridor
import { ProgramCoachIntelligenceHub } from './ProgramCoachIntelligenceHub'
// [AB20.1D] Types for method override apply callback
import type { MethodOverridePreview, MethodOverrideApplyResult, MethodOverrideRevertResult, MethodOverrideResetAllResult } from '@/lib/program/requested-method-override-planner'
// [MASTER-8C.12A] Types for frequency placement apply callback
import type { FrequencyPlacementApplyResult, SelectiveRemovalResult } from '@/lib/program/method-frequency-placement-apply-contract'
import type { FrequencySlotPlacementPreview } from '@/lib/program/method-frequency-slot-placement-preview'
// [Prompt 80.2] Program Card Adaptation Marker Preview - pure local derivation
import { deriveSessionBasedMarkerPreviewItems } from '@/lib/program/program-card-adaptation-marker-preview'
import type { UnifiedStalenessResult } from '@/lib/canonical-profile-service'
import { 
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  Target,
  Calendar,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  Shield,
  Scale,
  Layers,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Loader2,
  ChevronLeft,
  Zap,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState, useEffect, useMemo } from 'react'
import { 
  consumePendingScheduleNotice, 
  evaluateActiveWeekMutation,
  getCompletedSessionDayNumbers,
  runPhase13FinalVerdict,
  type ScheduleChangeNotice,
} from '@/lib/active-week-mutation-service'
import { runAdaptiveDisplayParityAudit } from '@/lib/adaptive-display-contract'
import { 
  buildProgramIntelligenceContract, 
  getProgramSurfaceSignals,
  getSessionSurfaceSignals,
  buildAllSessionCardSurfaces,
  // [BUILD GREEN GATE / SESSION IDENTITY RESOLVER] Pure read-only resolver
  // for visible session identity (React keys + display labels). Replaces
  // direct `session.name` reads, which fail TS on canonical AdaptiveSession /
  // ScaledSession types (those types do not own `name`).
  resolveSessionKeyParts,
  type ProgramIntelligenceContract,
  type SessionCardSurface,
  type ProgramDisplayProjection,
} from '@/lib/program/program-display-contract'
import { getCompactSessionExplanation } from '@/lib/coaching-explanation-contract'
import { buildProgramDecisionsNarrative, type ProgramDecisionsNarrative } from '@/lib/program/program-decisions-narrative'
import { deriveProgressionClarity, type ProgressionClarity } from '@/lib/program/performance-progression-clarity'
import { deriveTodaySessionGuidance, type TodaySessionGuidance } from '@/lib/program/adaptive-session-readiness-guidance'
import { deriveAllSelectedSkillRepresentations, getRepresentationStateStyles, type SelectedSkillRepresentationDisplay } from '@/lib/program/selected-skill-representation-guidance'
import { 
  advanceToNextWeek, 
  advanceToWeek,
  getWeekProgressionState,
  type WeekProgressionState,
  type WeekAdvancementResult,
} from '@/lib/week-advancement-service'
import { cn } from '@/lib/utils'
import { 
  getWeekDosageScaling, 
  scaleSessionsForWeek, 
  getWeekPhaseLabel, 
  getWeekVolumeIndicator,
  getWeekPhaseContext,
  type ScaledSession,
  type WeekPhaseContext
} from '@/lib/week-dosage-scaling'
// [AB18] Per-day method summary for session coaching handoff
import { 
  buildPerWeekMethodCoachSummary, 
  type PerWeekMethodCoachSummary,
  type SessionTrainingStyleCoaching,
} from '@/lib/program/per-day-method-summary'
// [AB18-E] WeeklyMethodRepresentationContract import removed - now accessed via typed AdaptiveProgram field
// [AB18] Import the handoff type for AdaptiveSessionCard prop
import { type AB18SessionCoachingHandoff } from '@/lib/workout/selected-variant-session-contract'
// [PHASE M1.2 + STEP 21.6] Recovery-to-Program Awareness Bridge + Session Adjustment
import type { 
  RecoveryProgramAwarenessBridge,
  RecoverySessionAdjustmentPreview,
} from '@/lib/program/recovery-program-awareness-bridge'
import { 
  hasRecoveryConcern,
  deriveRecoverySessionAdjustmentPreview,
  applyRecoveryAdjustmentToSession,
} from '@/lib/program/recovery-program-awareness-bridge'
// [STEP 22.7 / T.T7] Injury advisory preview — read-only, no mutation
import type { 
  InjurySubstitutionAdvisorySnapshot,
  InjurySubstitutionRecommendation,
} from '@/lib/program/injury-substitution-advisory'
import {
  hasActionableInjuryAdvisory,
  getRecommendationsForSession,
} from '@/lib/program/injury-substitution-advisory'
// [MASTER-8B.7.1] Future session mutation plan markers
import {
  type FutureSessionMutationPlanBundle,
  loadMutationPlans,
} from '@/lib/program/future-session-mutation-apply-contract'
// [W.W9] Unified recovery/injury/substitution coaching integration
import {
  deriveRecoveryInjurySubstitutionCoaching,
  hasActiveCoaching,
  getCoachingItemsByType,
  type RecoveryInjurySubstitutionCoachModel,
} from '@/lib/program/recovery-injury-substitution-coaching'
// [W.W10] User control coaching — gentle warnings when choices may impact progress
import {
  deriveUserControlCoaching,
  hasActiveUserControlCoaching,
  getUserControlSeverityStyles,
  type UserControlCoachModel,
} from '@/lib/program/user-control-coaching'
// [STEP 23.2 / 23.6] Missed-workout recomposition advisory — advisory-only, no mutation
// [V.V3] Recovery spacing preview — preview-only, no mutation
// [V.V4] Reduce intensity mutation corridor — user-confirmed saved-program mutation
// [V.V5] Protect recovery spacing mutation corridor — user-confirmed saved-program mutation
// [V.V6] Multi-session push-forward mutation guardrail — user-confirmed saved-program mutation
import type { 
  MissedWorkoutRecompositionAdvisory,
  PushSessionForwardResult,
  RecoverySpacingPreview,
  ReduceIntensityResult,
  ReduceIntensityPreview,
  ProtectRecoverySpacingResult,
  ProtectRecoverySpacingMutationPreview,
  MultiSessionPushForwardResult,
  MultiSessionPushForwardMutationPreview,
} from '@/lib/program/missed-workout-recomposition-advisory'
import { 
  getMissedWorkoutAdvisoryDisplayInfo, 
  hasActionableMissedWorkoutAdvisory,
  buildRecoverySpacingPreview,
  buildReduceIntensityPreview,
  reduceSessionIntensity,
  buildProtectRecoverySpacingMutationPreview,
  protectRecoverySpacing,
  buildMultiSessionPushForwardMutationPreview,
  pushForwardMultiSessionSchedule,
} from '@/lib/program/missed-workout-recomposition-advisory'

// [AB18-D] Local type for training style influence (mirrors WeeklyMethodDecisionAccordion)
interface AB18TrainingStyleInfluence {
  resolvedStyleMode: string
  methodsFavoredByStyle: string[]
  methodsBlockedOnSkillWorkByStyle: string[]
  visibleExplanation: string
}

// [AB18-D] Extract training style influence from program (same pattern as WeeklyMethodDecisionAccordion)
function extractAB18TrainingStyleInfluence(
  program: AdaptiveProgram | null | undefined
): AB18TrainingStyleInfluence | null {
  if (!program) return null
  
  // Try the weekly materialization plan first (authoritative AB16 source)
  const matPlan = (program as unknown as {
    weeklyMethodMaterializationPlan?: {
      trainingStyleMaterializationInfluence?: AB18TrainingStyleInfluence
    }
  }).weeklyMethodMaterializationPlan
  
  if (matPlan?.trainingStyleMaterializationInfluence) {
    return matPlan.trainingStyleMaterializationInfluence
  }
  
  // Fallback to intent vector
  const vector = (program as unknown as {
    trainingIntentVector?: {
      trainingStyleInfluence?: {
        resolvedStyleMode: string
        favoredMethods: string[]
        discouragedMethodsOnSkillWork: string[]
        visibleExplanation: string
      }
    }
  }).trainingIntentVector
  
  if (vector?.trainingStyleInfluence) {
    const tsi = vector.trainingStyleInfluence
    return {
      resolvedStyleMode: tsi.resolvedStyleMode,
      methodsFavoredByStyle: tsi.favoredMethods ?? [],
      methodsBlockedOnSkillWorkByStyle: tsi.discouragedMethodsOnSkillWork ?? [],
      visibleExplanation: tsi.visibleExplanation ?? '',
    }
  }
  
  return null
}

interface AdaptiveProgramDisplayProps {
  program: AdaptiveProgram
  onDelete?: () => void
  onRestart?: () => void // Explicit restart action: archives current program, returns to builder
  onRegenerate?: () => void // Explicit regenerate action: updates program from current profile
  onExerciseReplace?: (dayNumber: number, exerciseId: string) => void
  // [TASK 1] Unified staleness result passed from parent - display does NOT recompute its own
  unifiedStaleness?: UnifiedStalenessResult | null
  // [PREVIEW-VISIBLE-PROBE] Enable truth probe on session cards via ?programProbe=1
  showProbe?: boolean
  // [ALWAYS-VISIBLE-PROBE] Force probe to render unconditionally
  forceProbe?: boolean
  // [VISIBLE-SESSION-TRUTH-LOCK] Authoritative per-card surfaces built by the
  // page-level CanonicalProgramDisplayTruth contract. When provided, the
  // visible day cards render from these directly instead of recomputing
  // the same surfaces locally -- enforcing single ownership of visible
  // session truth at the page level. Optional for backward compatibility:
  // when undefined, the component falls back to building surfaces locally
  // via the same canonical helper (no semantic divergence is possible).
  sessionCardSurfaces?: SessionCardSurface[]
  // [PHASE 4F — DISPLAY PROJECTION OWNERSHIP LOCK] Read-only program-level
  // display projection built ONCE on the page from the same `program` object
  // every other display surface reads. AdaptiveProgramDisplay does NOT re-build
  // this projection; it only forwards the matching per-session slice (matched
  // by `dayNumber`) to the corresponding AdaptiveSessionCard. The card body
  // then surfaces the per-session honest doctrine-causal verdict (changed /
  // evaluated / no-match / did-not-run) — a question the existing wrapper
  // chips and the top-of-page DoctrineCausalLine cannot answer per-session.
  // Optional + null-safe: when null/undefined the day cards render exactly
  // as before, with no Phase 4F line.
  programDisplayProjection?: ProgramDisplayProjection | null
  // [PHASE M1.2] Recovery-to-Program Awareness Bridge
  // Advisory-only recovery guidance. When provided, displays a small
  // recovery-aware status card at the top of the program.
  recoveryAwarenessBridge?: RecoveryProgramAwarenessBridge | null
  // [STEP 21.6] Recovery Session Adjustment State
  // Tracks the current adjustment preview and applied state for today's session.
  recoveryAdjustmentPreview?: RecoverySessionAdjustmentPreview | null
  // Callback when user requests adjustment preview
  onRequestAdjustmentPreview?: () => void
  // Callback when user applies the adjustment
  onApplyAdjustment?: () => void
  // Callback when user dismisses/keeps original
  onDismissAdjustment?: () => void
  // [STEP 22.7 / T.T7] Injury advisory snapshot for preview display
  // Read-only, advisory-only — no mutation. Preview shows which exercises
  // may be affected by joint cautions, without changing the program.
  injuryAdvisory?: InjurySubstitutionAdvisorySnapshot | null
// [STEP 23.2] Missed-workout recomposition advisory for display
  // Advisory-only — no mutation, no schedule rewrite, no saved-program changes.
  missedWorkoutAdvisory?: MissedWorkoutRecompositionAdvisory | null
  // [STEP 23.6] Callback for push session forward — user-confirmed mutation only.
  // Program Page owns the save path. Display requests, Page persists.
  onConfirmMissedWorkoutPushForward?: (
  advisory: MissedWorkoutRecompositionAdvisory,
  missedSessionIndex: number
  ) => Promise<PushSessionForwardResult> | PushSessionForwardResult
  // [STEP 24.4 / V.V4] Callback for reduce session intensity — user-confirmed mutation only.
  // Program Page owns the save path. Display requests, Page persists.
  // This enables the first safe saved-program mutation for reduce_next_session_intensity.
  onConfirmReduceIntensity?: (
  advisory: MissedWorkoutRecompositionAdvisory,
  targetSessionIndex: number
  ) => Promise<ReduceIntensityResult> | ReduceIntensityResult
  // [STEP 24.5 / V.V5] Callback for protect recovery spacing — user-confirmed mutation only.
  // Program Page owns the save path. Display requests, Page persists.
  // Second saved-program mutation corridor in Phase V.
  onConfirmProtectRecoverySpacing?: (
  advisory: MissedWorkoutRecompositionAdvisory,
  targetSessionIndex: number
  ) => Promise<ProtectRecoverySpacingResult> | ProtectRecoverySpacingResult
  // [STEP 24.6 / V.V6] Callback for multi-session push-forward — user-confirmed mutation only.
  // Program Page owns the save path. Display requests, Page persists.
  // Third saved-program mutation corridor in Phase V.
  onConfirmMultiSessionPushForward?: (
  advisory: MissedWorkoutRecompositionAdvisory,
  targetSessionIndices: number[]
  ) => Promise<MultiSessionPushForwardResult> | MultiSessionPushForwardResult
  // [AB20 / IQ10] Callback for Method Override Apply — user-confirmed mutation only.
  // Program Page owns the save path. Display requests via Hub, Page persists.
  onProgramUpdate?: (updatedProgram: AdaptiveProgram) => void
  // [AB20.1D] Dedicated callback for method override apply that saves via saveAdaptiveProgram.
  // Program Page owns the save path. Hub requests, Page persists.
  onApplyMethodOverridePreview?: (
    preview: MethodOverridePreview, 
    options: { allowCautionApply: boolean }
  ) => Promise<MethodOverrideApplyResult>
  // [AB20.2] Dedicated callback for method override revert that saves via saveAdaptiveProgram.
  // Program Page owns the save path. Hub requests, Page persists.
  onRevertMethodOverride?: (methodKey: string) => Promise<MethodOverrideRevertResult>
  // [AB20.4.2] Callback to reset all user-applied method overrides at once.
  // Removes override artifacts, preserves native AI-generated methods, saves through canonical path.
  onResetAllMethodOverrides?: () => Promise<MethodOverrideResetAllResult>
  // [MASTER-8C.12A] Dedicated callback for frequency placement apply that saves via saveAdaptiveProgram.
  // Program Page owns the save path. Hub requests, Page persists.
  onApplyFrequencyPlacement?: (
    preview: FrequencySlotPlacementPreview
  ) => Promise<FrequencyPlacementApplyResult>
  // [MASTER-8C.12B] Selective removal callback for removing specific applied methods.
  // Program Page owns the save path. Hub requests, Page persists.
  onRemoveSelectedPlacements?: (placementIds: string[]) => Promise<SelectiveRemovalResult>
}

// =============================================================================
// [BUILD GREEN GATE / DISPLAY STRING-ARRAY NORMALIZER — DISPLAY-ONLY]
//
// Program/profile fields like `program.primaryGoal` are typed as literal
// unions (PrimaryGoal | undefined). Building a fallback `string[]` from those
// values via `.filter(Boolean)` or `.filter((x): x is string => ...)` does NOT
// collapse the element type to plain `string` — TypeScript keeps it as
// `(PrimaryGoal | undefined)[]` because a type predicate cannot narrow a
// subtype-of-string union to the broader `string` type.
//
// This helper accepts `readonly unknown[] | null | undefined` and produces a
// guaranteed `string[]` — fresh, trimmed, non-empty values only. It is
// read-only, never mutates source data, never invents defaults, and never
// transforms identity beyond stripping wrapper whitespace.
// =============================================================================
function compactDisplayStrings(
  values: readonly unknown[] | null | undefined,
): string[] {
  if (!Array.isArray(values)) return []

  return values.reduce<string[]>((acc, value) => {
    if (typeof value !== 'string') return acc

    const trimmed = value.trim()
    if (trimmed.length === 0) return acc

    acc.push(trimmed)
    return acc
  }, [])
}

// =============================================================================
// [BUILD GREEN GATE / DISPLAY WEEKLY-REPRESENTATION CONTRACT — DISPLAY-ONLY]
//
// Program decoration fields like `weeklyRepresentation` enter this display
// component through an `as unknown as { weeklyRepresentation?: ... }` cast.
// Reading them through a loose `object` boundary forces every downstream
// `.policies`, `.find`, `.actualExposure.direct` access to fail TS or
// require an inline structural cast. This narrow display-only contract +
// runtime guard gives the rest of the file a single typed entry point.
//
// Read-only by construction: the guard never mutates program data, never
// invents policies, and never falsifies representation truth — invalid or
// missing input always degrades to `null`, preserving the existing honest
// fallback (chip-state logic at L539 already handles `null` policies by
// downgrading to headline-identity-only chip rules).
// =============================================================================
type DisplayRepresentationVerdict =
  | 'headline_represented'
  | 'broadly_represented'
  | 'support_only'
  | 'selected_but_underexpressed'
  | 'filtered_out_by_constraints'
  | 'not_selected'

type DisplayActualExposure = {
  direct?: number
  technical?: number
  support?: number
  warmupOnly?: number
  total?: number
}

type DisplayWeeklyRepresentationPolicy = {
  skill: string
  selectedRank?: 'headline' | 'secondary' | 'tertiary' | 'optional'
  targetExposure?: number
  eligibleSessionTypes?: string[]
  actualExposure?: DisplayActualExposure
  representationVerdict?: DisplayRepresentationVerdict
  narrowingPoint?: string | null
}

type DisplayWeeklyRepresentation = {
  policies: DisplayWeeklyRepresentationPolicy[]
  coverageRatio?: number
  verdictCounts?: Record<string, number>
}

function isDisplayWeeklyRepresentation(
  value: unknown,
): value is DisplayWeeklyRepresentation {
  if (!value || typeof value !== 'object') return false

  const maybe = value as { policies?: unknown }

  if (!Array.isArray(maybe.policies)) return false

  return maybe.policies.every(policy => {
    if (!policy || typeof policy !== 'object') return false

    const maybePolicy = policy as {
      skill?: unknown
      actualExposure?: unknown
      representationVerdict?: unknown
    }

    if (
      typeof maybePolicy.skill !== 'string' ||
      maybePolicy.skill.trim().length === 0
    ) {
      return false
    }

    if (
      maybePolicy.actualExposure !== undefined &&
      maybePolicy.actualExposure !== null &&
      typeof maybePolicy.actualExposure !== 'object'
    ) {
      return false
    }

    if (
      maybePolicy.representationVerdict !== undefined &&
      typeof maybePolicy.representationVerdict !== 'string'
    ) {
      return false
    }

    return true
  })
}

export function AdaptiveProgramDisplay({
  program,
  onDelete,
  onRestart,
  onRegenerate,
  onExerciseReplace,
  unifiedStaleness, // [TASK 1] Consume parent's staleness evaluation
  showProbe = false, // [PREVIEW-VISIBLE-PROBE] Truth probe visibility
  forceProbe = false, // [ALWAYS-VISIBLE-PROBE] Force probe unconditionally
  // [VISIBLE-SESSION-TRUTH-LOCK] Page-built per-card visible surfaces
  sessionCardSurfaces: injectedSessionCardSurfaces,
  // [PHASE 4F] Page-built read-only program display projection
  programDisplayProjection,
  // [PHASE M1.2 + STEP 21.6] Recovery awareness and adjustment props
  recoveryAwarenessBridge,
  recoveryAdjustmentPreview,
  onRequestAdjustmentPreview,
  onApplyAdjustment,
  onDismissAdjustment,
  // [STEP 22.7 / T.T7] Injury advisory preview
  injuryAdvisory,
  // [STEP 23.2] Missed-workout recomposition advisory
  missedWorkoutAdvisory,
  // [STEP 23.6] Push session forward callback
  onConfirmMissedWorkoutPushForward,
  // [STEP 24.4 / V.V4] Reduce intensity callback
  onConfirmReduceIntensity,
  // [STEP 24.5 / V.V5] Protect recovery spacing callback
  onConfirmProtectRecoverySpacing,
  // [STEP 24.6 / V.V6] Multi-session push-forward callback
  onConfirmMultiSessionPushForward,
  // [AB20 / IQ10] Method Override Apply callback (state-only, deprecated)
  onProgramUpdate,
  // [AB20.1D] Dedicated method override apply callback with save persistence
  onApplyMethodOverridePreview,
  // [AB20.2] Dedicated method override revert callback with save persistence
  onRevertMethodOverride,
  // [AB20.4.2] Reset all method overrides callback with save persistence
  onResetAllMethodOverrides,
  // [MASTER-8C.12A] Dedicated frequency placement apply callback with save persistence
  onApplyFrequencyPlacement,
  // [MASTER-8C.12B] Selective removal callback with save persistence
  onRemoveSelectedPlacements,
}: AdaptiveProgramDisplayProps) {
  // TASK 2: Confirmation modal state for restart action
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  
  // Why This Fits You - premium explanation sheet state
  const [showWhySheet, setShowWhySheet] = useState(false)
  
  // [PPX-5] Skill coverage expand/collapse state (collapsed by default when >5 skills)
  const [showSkillCoverageExpanded, setShowSkillCoverageExpanded] = useState(false)
  
  // [PHASE 13] Schedule change notice state
  const [scheduleNotice, setScheduleNotice] = useState<ScheduleChangeNotice | null>(null)
  
  // [MASTER-8B.7.1] Mutation plan bundle for Program Card markers
  const [mutationPlanBundle, setMutationPlanBundle] = useState<FutureSessionMutationPlanBundle | null>(null)
  useEffect(() => {
    const bundle = loadMutationPlans()
    setMutationPlanBundle(bundle)
  }, [])
  
  // [WEEK-ADVANCEMENT] Week progression state for advancing to next week
  // [AUTHORITATIVE-WEEK-FIX] Initialize synchronously from persisted state to avoid hydration flash
  const [weekProgression, setWeekProgression] = useState<WeekProgressionState | null>(() => {
    // Only run on client
    if (typeof window === 'undefined') return null
    return getWeekProgressionState()
  })
  const [isAdvancingWeek, setIsAdvancingWeek] = useState(false)
  const [weekAdvancementResult, setWeekAdvancementResult] = useState<WeekAdvancementResult | null>(null)
  // [STEP 23.3] Local UI state for dismissing missed-workout advisory
  // Non-persistent — does not mutate program, session, or storage
  const [missedWorkoutAdvisoryDismissed, setMissedWorkoutAdvisoryDismissed] = useState(false)
  // [STEP 23.4] Modal state for "I can't train today" confirmation
  const [showCantTrainModal, setShowCantTrainModal] = useState(false)
  // [STEP 23.6] Push session forward action state
  type PushForwardState = 'idle' | 'confirming' | 'applying' | 'applied' | 'failed'
  const [pushForwardState, setPushForwardState] = useState<PushForwardState>('idle')
  const [pushForwardResult, setPushForwardResult] = useState<PushSessionForwardResult | null>(null)
  // [STEP 24.4 / V.V4] Reduce intensity action state — user-confirmed mutation corridor
  type ReduceIntensityState = 'idle' | 'confirming' | 'applying' | 'applied' | 'failed' | 'already_reduced'
  const [reduceIntensityState, setReduceIntensityState] = useState<ReduceIntensityState>('idle')
  const [reduceIntensityResult, setReduceIntensityResult] = useState<ReduceIntensityResult | null>(null)
  // [STEP 24.5 / V.V5] Protect recovery spacing action state — user-confirmed mutation corridor
  type ProtectRecoverySpacingState = 'idle' | 'confirming' | 'applying' | 'applied' | 'failed' | 'already_protected'
  const [protectRecoverySpacingState, setProtectRecoverySpacingState] = useState<ProtectRecoverySpacingState>('idle')
  const [protectRecoverySpacingResult, setProtectRecoverySpacingResult] = useState<ProtectRecoverySpacingResult | null>(null)
  // [STEP 24.6 / V.V6] Multi-session push-forward action state — user-confirmed mutation corridor
  type MultiSessionPushForwardState = 'idle' | 'confirming' | 'applying' | 'applied' | 'failed' | 'already_applied'
  const [multiSessionPushForwardState, setMultiSessionPushForwardState] = useState<MultiSessionPushForwardState>('idle')
  const [multiSessionPushForwardResult, setMultiSessionPushForwardResult] = useState<MultiSessionPushForwardResult | null>(null)

  // [Prompt 80.2] programCardAdaptationMarkerPreviewItems is computed below, after scaledSessions is declared
  
  // Premium explanation contract - doctrine-driven intelligence
  const intelligenceContract: ProgramIntelligenceContract | null = program 
    ? buildProgramIntelligenceContract(program) 
    : null
  
  // [SURFACE-SIGNALS] Compact surface signals for main card display
  const programSurfaceSignals = program ? getProgramSurfaceSignals(program) : null
  
  // [STEP 25.3] Program Decisions Narrative — why this program was built this way
  const decisionsNarrative: ProgramDecisionsNarrative | null = program 
    ? buildProgramDecisionsNarrative(program) 
    : null
  
  // [STEP 25.4] Performance Progression Clarity — current progression status
  const progressionClarity: ProgressionClarity | null = program
    ? deriveProgressionClarity(program)
    : null
  
  // [STEP 25.5] Today Session Readiness Guidance — what should I do today?
  const todayGuidance: TodaySessionGuidance | null = program
    ? deriveTodaySessionGuidance(program)
    : null
  
  // ==========================================================================
  // [PHASE 15A-HOTFIX] SAFE DISPLAY VIEW-MODEL - MOVED ABOVE useEffects
  // These MUST be declared before any useEffect that references them
  // to avoid TDZ (Temporal Dead Zone) errors
  // 
  // ROOT CAUSE OF TDZ BUG:
  // - Phase 15A added audit logs to useEffect at ~line 112-171
  // - These logs referenced safeSelectedSkills, safeRepresentedSkills, safeSummaryTruth
  // - Those variables were declared AFTER the useEffect (~line 180-199)
  // - JavaScript hoists const/let but doesn't initialize until declaration
  // - Accessing them in useEffect deps array caused TDZ error
  // - Minified as 'ee' in production build
  //
  // [phase15a-hotfix-tdz-source-map-audit]:
  //   file: components/programs/AdaptiveProgramDisplay.tsx
  //   minifiedSymbol: 'ee'
  //   realSymbol: 'safeSelectedSkills' (or safeRepresentedSkills/safeSummaryTruth)
  //   location: useEffect dependency array at line 171
  //   declaredAt: line 187 (was after the useEffect)
  //
  // [phase15a-hotfix-real-symbol-identity-audit]:
  //   minified: 'ee'
  //   actual: safeSelectedSkills, safeRepresentedSkills, safeSummaryTruth
  //   type: const declarations
  //   issue: used in useEffect before declaration
  //
  // [phase15a-hotfix-root-cause-classification-verdict]:
  //   category: pre-declaration-access
  //   cause: Phase 15A audit logs added to useEffect referenced safe* locals
  //   fix: move safe* locals declarations above the useEffect
  //   risk: none - pure ordering change, no logic change
  //
  // [phase15a-hotfix-ordering-hazard-removed-audit]: declarations moved above consumers
  // ==========================================================================
  
  // Get training days and displayed label
  const trainingDaysPerWeek = (program as unknown as { trainingDaysPerWeek?: number | string }).trainingDaysPerWeek
  const displayedScheduleLabelText = program.scheduleMode === 'flexible' 
    ? 'Adaptive' 
    : `${trainingDaysPerWeek} days/week`
  
  // Get raw program fields with type assertions for optional fields
  const rawSelectedSkills = (program as unknown as { selectedSkills?: string[] }).selectedSkills
  const rawRepresentedSkills = (program as unknown as { representedSkills?: string[] }).representedSkills
  const rawSummaryTruth = (program as unknown as { summaryTruth?: unknown }).summaryTruth
  const rawWeeklyRepresentation = (program as unknown as { weeklyRepresentation?: unknown }).weeklyRepresentation
  // [PPX-5] Extract deferred skills from session architecture truth
  const rawDeferredSkills = (program as unknown as { 
    sessionArchitectureTruth?: { 
      deferredSkills?: Array<{ skill: string; reason: string }> 
    } 
  }).sessionArchitectureTruth?.deferredSkills
  
  // Build safe locals from raw fields - NO self-references allowed
  const safeSelectedSkills = Array.isArray(rawSelectedSkills) ? rawSelectedSkills : []
  const safeSessions = Array.isArray(program.sessions) 
    ? program.sessions.filter(s => s && typeof s === 'object') 
    : []
  // [PHASE 15C-HOTFIX] validSessions MUST be declared here, BEFORE any useEffect that references it
  // ROOT CAUSE: Phase 15C added useEffect audits at ~line 246/289 that referenced validSessions.length
  // But validSessions was declared at line 713, causing TDZ error (minified as 'ew')
  const validSessions = safeSessions.filter(s => Array.isArray(s.exercises))
  
  // ==========================================================================
  // [WEEK-PROGRESSION-TRUTH] Apply week-specific dosage scaling
  // Week 1 uses stored acclimation values, Week 2+ get progressively scaled dosage
  // CRITICAL FIX: Use weekProgression?.currentWeek as AUTHORITATIVE source when available
  // This ensures UI updates immediately when user changes week via navigation
  // ==========================================================================
  const currentWeekNumber = weekProgression?.currentWeek ?? program.weekNumber ?? 1
  const weekDosageScaling = getWeekDosageScaling(currentWeekNumber)
  const scaledSessions: ScaledSession[] = scaleSessionsForWeek(validSessions, currentWeekNumber)
  const weekVolumeIndicator = getWeekVolumeIndicator(currentWeekNumber)
  const weekPhaseLabel = getWeekPhaseLabel(currentWeekNumber)
  // [WEEK-PHASE-DOCTRINE-FIX] Get comprehensive week phase context for dynamic UI
  const weekPhaseContext = getWeekPhaseContext(currentWeekNumber)
  
  // [Prompt 80.2] Program Card Adaptation Marker Preview items - pure local derivation via useMemo
  // No state lifting, no effects, no child-to-parent callbacks - eliminates React #185 risk
  const programCardAdaptationMarkerPreviewItems = useMemo(() => {
    if (!scaledSessions || scaledSessions.length === 0) {
      return []
    }
    return deriveSessionBasedMarkerPreviewItems(
      scaledSessions.map(s => ({
        dayNumber: s.dayNumber,
        dayLabel: s.dayLabel,
        sessionTitle: s.dayLabel || `Day ${s.dayNumber}`,
      }))
    )
  }, [scaledSessions])


  
  const safeRepresentedSkills = Array.isArray(rawRepresentedSkills) ? rawRepresentedSkills : []
  // [BUILD GREEN GATE] safeSummaryTruth — narrow shape via inline structural
  // cast (kept for inline-cast continuity; existing downstream access is safe).
  const safeSummaryTruth = rawSummaryTruth && typeof rawSummaryTruth === 'object'
    ? (rawSummaryTruth as { 
        headlineFocusSkills?: string[]
        weekRepresentedSkills?: string[]
        weekSupportSkills?: string[]
        truthfulHybridSummary?: string
        profileSelectedSkills?: string[]
        summaryRenderableSkills?: string[]
      })
    : null
  // [BUILD GREEN GATE] safeWeeklyRepresentation — narrow through the typed
  // runtime guard so every downstream `.policies` / `.find` / `.actualExposure`
  // read typechecks structurally without inline casts. Invalid or missing
  // input degrades to `null`, preserving the existing honest fallback in
  // chip-state logic (L541-544 returns headline-identity only when policies
  // are absent).
  const safeWeeklyRepresentation: DisplayWeeklyRepresentation | null =
    isDisplayWeeklyRepresentation(rawWeeklyRepresentation) ? rawWeeklyRepresentation : null
  
  // [VISIBLE-SESSION-TRUTH-LOCK] Build authoritative per-card display surfaces.
  // Prefer surfaces injected by the page-level CanonicalProgramDisplayTruth
  // contract -- when provided, the page is the single owner of visible
  // session truth. Fall back to the same canonical builder when the parent
  // does not inject (older callers / standalone usage), so semantics never
  // diverge regardless of which path produced the array.
  const sessionCardSurfaces: SessionCardSurface[] = (
    injectedSessionCardSurfaces && injectedSessionCardSurfaces.length === validSessions.length
      ? injectedSessionCardSurfaces
      : validSessions.length > 0
        ? buildAllSessionCardSurfaces(
            validSessions as Parameters<typeof buildAllSessionCardSurfaces>[0],
            {
              isFirstWeek: program.weekAdaptationDecision?.firstWeekGovernor?.active ?? false,
              adaptationPhase: program.weekAdaptationDecision?.phase,
              totalSessions: validSessions.length,
              primaryGoal: program.primaryGoal,
              secondaryGoal: program.secondaryGoal,
            }
          )
        : []
  )
  
  // [AB18-D] Extract training style influence for proper session coaching
  const ab18StyleInfluence = extractAB18TrainingStyleInfluence(program)
  
  // [AB18-E] Build per-day session coaching for live workout handoff
  // The summary is computed once; each session looks up its coaching by dayNumber
  // Now uses typed AdaptiveProgram.weeklyMethodRepresentation field (no unknown bridge)
  const perDayCoachingSummary: PerWeekMethodCoachSummary | null = (() => {
    try {
      // [AB18-E] Direct typed access now that AdaptiveProgram owns the field
      const representation = program.weeklyMethodRepresentation ?? null
      return buildPerWeekMethodCoachSummary({
        program,
        representation,
        // [AB18-D] Pass style influence for proper session-level coaching generation
        trainingStyleInfluence: ab18StyleInfluence ? {
          resolvedStyleMode: ab18StyleInfluence.resolvedStyleMode,
          favoredMethods: ab18StyleInfluence.methodsFavoredByStyle,
          discouragedMethodsOnSkillWork: ab18StyleInfluence.methodsBlockedOnSkillWorkByStyle,
          visibleExplanation: ab18StyleInfluence.visibleExplanation,
        } : null,
      })
    } catch {
      return null
    }
  })()
  
  // Build render context for skills
  const renderPrimaryGoal = program.primaryGoal
  const renderSecondaryGoal = program.secondaryGoal
  const renderSelectedSkills = safeSelectedSkills
  const summaryTextRaw = safeSummaryTruth?.truthfulHybridSummary || program.programRationale || ''
  
  // Dominant spine resolution from builder
  const dominantSpineResolution = program.dominantSpineResolution || null
  
  // [PHASE 13] Listen for workout completion and check for pending notices
  useEffect(() => {
    // Check for pending notice on mount
    const pendingNotice = consumePendingScheduleNotice()
    if (pendingNotice && pendingNotice.type !== 'no_change') {
      setScheduleNotice(pendingNotice)
    }
    
    // Listen for workout logged events
    const handleWorkoutLogged = (event: CustomEvent) => {
      const { programId } = event.detail || {}
      
      if (programId && program.id?.includes(programId)) {
        // Evaluate active week mutation
        const completedDays = getCompletedSessionDayNumbers(program.id)
        const mutationResult = evaluateActiveWeekMutation(program, completedDays)
        
        // Run final verdict audit
        runPhase13FinalVerdict(mutationResult)
        
        // Show notice if mutation happened
        if (mutationResult.noticePayload && mutationResult.applied) {
          setScheduleNotice(mutationResult.noticePayload)
        }
      }
    }
    
    window.addEventListener('spartanlab:workout-logged', handleWorkoutLogged as EventListener)
    
    return () => {
      window.removeEventListener('spartanlab:workout-logged', handleWorkoutLogged as EventListener)
    }
  }, [program.id, program])
  
  // [WEEK-ADVANCEMENT] Load week progression state and listen for advancement events
  useEffect(() => {
    // Load current week progression state
    const state = getWeekProgressionState()
    setWeekProgression(state)
    
    // Listen for week advancement events to update state
    const handleWeekAdvanced = () => {
      const newState = getWeekProgressionState()
      setWeekProgression(newState)
      // Clear any previous advancement result after a short delay
      setTimeout(() => setWeekAdvancementResult(null), 3000)
    }
    
    window.addEventListener('spartanlab:week-advanced', handleWeekAdvanced)
    
    return () => {
      window.removeEventListener('spartanlab:week-advanced', handleWeekAdvanced)
    }
  }, [program.id])
  
  // [WEEK-ADVANCEMENT] Handler for advancing to next week
  const handleAdvanceWeek = async () => {
    setIsAdvancingWeek(true)
    setWeekAdvancementResult(null)
    
    try {
      const result = advanceToNextWeek()
      setWeekAdvancementResult(result)
      
      if (result.success) {
        // Update local state immediately
        const newState = getWeekProgressionState()
        setWeekProgression(newState)
      }
    } catch (err) {
      console.error('Error advancing week:', err)
      setWeekAdvancementResult({
        success: false,
        previousWeek: weekProgression?.currentWeek || 1,
        newWeek: weekProgression?.currentWeek || 1,
        programId: program.id,
        advancedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsAdvancingWeek(false)
    }
  }
  
  // [WEEK-ADVANCEMENT] Handler for going to a specific week (forward or backward)
  const handleGoToWeek = async (targetWeek: number) => {
    setIsAdvancingWeek(true)
    setWeekAdvancementResult(null)
    
    try {
      const result = advanceToWeek(targetWeek)
      setWeekAdvancementResult(result)
      
      if (result.success) {
        // Update local state immediately
        const newState = getWeekProgressionState()
        setWeekProgression(newState)
      }
    } catch (err) {
      console.error('Error changing week:', err)
      setWeekAdvancementResult({
        success: false,
        previousWeek: weekProgression?.currentWeek || 1,
        newWeek: weekProgression?.currentWeek || 1,
        programId: program.id,
        advancedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsAdvancingWeek(false)
    }
  }
  
  // Run adaptive display parity audit when program renders
  useEffect(() => {
    const displayedScheduleLabel = program.scheduleMode === 'flexible' ? 'Adaptive' : `${program.trainingDaysPerWeek} days/week`
    const displayedDurationLabel = program.sessionDurationMode === 'adaptive' ? 'Adaptive' : `${program.sessionLength} min`
    
    runAdaptiveDisplayParityAudit(
      'AdaptiveProgramDisplay',
      program.scheduleMode,
      program.trainingDaysPerWeek,
      program.sessionDurationMode,
      program.sessionLength,
      displayedScheduleLabel,
      displayedDurationLabel
    )
  }, [program.scheduleMode, program.sessionDurationMode, program.trainingDaysPerWeek, program.sessionLength])
  
  // Additional safe locals
  const safePlannerTruthAudit = program.plannerTruthAudit || null
  const safeFlexibleRootCause = program.flexibleFrequencyRootCause || null
  
  // Hoisted chip truth locals - true component render scope
  // These must be defined OUTSIDE the built-around IIFE so Phase 7 audits can access them
  // ==========================================================================
  
  // A. Compute representedSkills from server or client fallback
  const sharedRepresentedSkills: string[] = (() => {
    if (safeRepresentedSkills.length > 0) {
      return safeRepresentedSkills
    }
    // Client-side fallback computation.
    // [BUILD GREEN GATE] AdaptiveExercise is flat — exercise truth lives on
    // `e.name` directly (lib/adaptive-program-builder.ts AdaptiveExercise).
    // Read the canonical flat shape; empty/missing names are filtered out so
    // the keyword-match loop below never matches against a hollow string.
    const allExerciseNames = safeSessions.flatMap(s =>
      s.exercises
        ?.map(e => (typeof e?.name === 'string' ? e.name.toLowerCase() : ''))
        .filter((name): name is string => name.length > 0) || []
    ) || []
    
    const skillKeywords: Record<string, string[]> = {
      'planche': ['planche', 'lean', 'tuck', 'pseudo'],
      'front_lever': ['front lever', 'front-lever', 'tuck lever', 'adv tuck'],
      'back_lever': ['back lever', 'back-lever', 'german hang'],
      'handstand': ['handstand', 'pike', 'wall walk', 'freestanding'],
      'muscle_up': ['muscle up', 'muscle-up', 'transition'],
    }
    
    return safeSelectedSkills.filter(skill => {
      const keywords = skillKeywords[skill] || [skill.replace(/_/g, ' ')]
      return keywords.some(kw => allExerciseNames.some(name => name.includes(kw)))
    })
  })()
  
  // B. Compute unrepresentedSkills
  const sharedUnrepresentedSkills = safeSelectedSkills.filter(s => !sharedRepresentedSkills.includes(s))
  
  // C. Compute headline skills.
  // [BUILD GREEN GATE] safeSummaryTruth is `T | null`; primaryGoal/secondaryGoal
  // are `PrimaryGoal | undefined` literal unions. Use compactDisplayStrings to
  // normalize both sources into a guaranteed `string[]` — TS cannot collapse
  // a literal-union subtype to plain string via predicate, so the helper does
  // it structurally instead. Honest fallback: real present primary/secondary
  // goals only; never invent skills.
  const summaryHeadlineSkills = compactDisplayStrings(safeSummaryTruth?.headlineFocusSkills)
  const fallbackHeadlineSkills = compactDisplayStrings([
    program.primaryGoal,
    program.secondaryGoal,
  ])
  const sharedHeadlineSkills: string[] =
    summaryHeadlineSkills.length > 0 ? summaryHeadlineSkills : fallbackHeadlineSkills
  
  // D. Compute week support skills (empty array when summary truth missing).
  const sharedWeekSupportSkills: string[] = compactDisplayStrings(
    safeSummaryTruth?.weekSupportSkills,
  )
  
  // E. ChipState type and getChipState helper
  type SharedChipState = 'headline_priority' | 'represented_broader' | 'support_only' | 'selected_not_represented'
  
  const getSharedChipState = (skill: string): SharedChipState => {
    // ==========================================================================
    // [PHASE 24P] CRITICAL FIX: Check headline identity FIRST, before weeklyRepresentation
    // Primary and secondary goals are always headline_priority regardless of week-level expression
    // This prevents secondary goals from being downgraded by stricter representation thresholds
    // ==========================================================================
    const isHeadlineIdentity = sharedHeadlineSkills.includes(skill)
    if (isHeadlineIdentity) {
      return 'headline_priority'
    }
    
    // For non-headline skills, check weekly representation policies if available
    if (safeWeeklyRepresentation?.policies) {
      const policy = safeWeeklyRepresentation.policies.find(p => p.skill === skill)
      if (policy) {
        switch (policy.representationVerdict) {
          case 'headline_represented':
            return 'headline_priority'
          case 'broadly_represented':
            return 'represented_broader'
          case 'support_only':
            return 'support_only'
          case 'selected_but_underexpressed':
          case 'filtered_out_by_constraints':
          default:
            return 'selected_not_represented'
        }
      }
    }
    
    // Fallback to summary truth based logic for non-headline skills
    if (sharedRepresentedSkills.includes(skill)) return 'represented_broader'
    if (sharedWeekSupportSkills.includes(skill)) return 'support_only'
    return 'selected_not_represented'
  }
  
  // F. Compute sharedStrictRepresentedSkillsForChips - THE KEY HOISTED LOCAL
  // [VISIBLE-PROGRAM-TRUTH-CONTRACT] This is the SINGLE owner of "Built around" chip content
  // Only skills that meet strict representation thresholds appear as chips
  const sharedStrictRepresentedSkillsForChips = safeSelectedSkills.filter(skill => {
    const chipState = getSharedChipState(skill)
    const policy = safeWeeklyRepresentation?.policies.find(p => p.skill === skill)
    const directExposure = policy?.actualExposure?.direct ?? 0
    const totalExposure = policy?.actualExposure?.total ?? 0
    
    // [PHASE 6B TASK 2] TIGHTENED MEANINGFUL REPRESENTATION THRESHOLDS
    const isHeadline = chipState === 'headline_priority'
    const hasMeaningfulDirect = directExposure >= 2
    const hasSignificantTotal = totalExposure >= 3
    const isRepresentedBroaderWithSubstance = chipState === 'represented_broader' && (hasMeaningfulDirect || hasSignificantTotal)
    
    // [VISIBLE-PROGRAM-TRUTH-CONTRACT] TASK 3 - TIGHTER FALLBACK
    // When weeklyRepresentation policies are unavailable, ONLY show headline skills
    // Do NOT show broader skills from fallback client-side exercise name matching
    // This prevents stale/generic chips when canonical truth is unavailable
    const hasWeeklyRepPolicies = (safeWeeklyRepresentation?.policies.length ?? 0) > 0
    
    if (!hasWeeklyRepPolicies) {
      // Fallback: only headline identity chips, no others
      return isHeadline
    }
    
    return isHeadline || isRepresentedBroaderWithSubstance
  })
  
  // ==========================================================================
  // [W.W8] SELECTED SKILL REPRESENTATION TRUTH
  // Uses centralized helper for consistent display derivation and explanations.
  // Every selected skill is visible with honest representation state.
  // ==========================================================================
  
  // [W.W8R] Adapter: normalize weekly representation policies for the helper.
  // The display type allows representationVerdict to be undefined, but the helper
  // requires a definite string. This adapter provides truthful fallbacks.
  const normalizedPoliciesForSkillRepresentation = (() => {
    const policies = safeWeeklyRepresentation?.policies
    if (!Array.isArray(policies) || policies.length === 0) return null
    
    return policies
      .map(policy => {
        const skill = typeof policy.skill === 'string' ? policy.skill.trim() : ''
        if (!skill) return null
        
        // Derive truthful verdict: use real verdict if available, otherwise conservative fallback
        const representationVerdict = typeof policy.representationVerdict === 'string' && policy.representationVerdict.trim()
          ? policy.representationVerdict.trim()
          : 'not_assessed' // Conservative fallback when verdict is missing
        
        return {
          skill,
          representationVerdict,
          actualExposure: policy.actualExposure ? {
            direct: typeof policy.actualExposure.direct === 'number' ? policy.actualExposure.direct : undefined,
            total: typeof policy.actualExposure.total === 'number' ? policy.actualExposure.total : undefined,
          } : undefined,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
  })()
  
  const selectedSkillRepresentations: SelectedSkillRepresentationDisplay[] = deriveAllSelectedSkillRepresentations({
    selectedSkills: safeSelectedSkills,
    headlineSkills: sharedHeadlineSkills,
    weeklyRepresentationPolicies: normalizedPoliciesForSkillRepresentation,
    weekSupportSkills: sharedWeekSupportSkills,
    weekRepresentedSkills: sharedRepresentedSkills,
    // [PPX-5] Pass deferred skills for explicit deferred state labeling
    deferredSkills: rawDeferredSkills ?? null,
  })
  

  
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
  
  // ==========================================================================
  // [TASK 2] TRUTHFUL BANNER TITLE AND FIELD LIST FROM PARENT
  // Use banner title and field list from parent staleness if available
  // Falls back to computed values if not provided
  // ==========================================================================
  const bannerTitle = (unifiedStaleness as { bannerTitle?: string })?.bannerTitle || 'Minor settings changed'
  const fieldListSummary = (unifiedStaleness as { fieldListSummary?: string })?.fieldListSummary || (
    stalenessCheck.isStale && stalenessCheck.changedFields.length > 0
      ? `Training settings have changed (${stalenessCheck.changedFields.slice(0, 2).join(', ')}). Consider regenerating.`
      : 'Consider regenerating your program.'
  )
  
  // Phase 3 status from parent (if computed)
  const phase3Status = (unifiedStaleness as { phase3Status?: string })?.phase3Status || 'unknown'
  const safeToMoveToPhase4 = (unifiedStaleness as { safeToMoveToPhase4?: boolean })?.safeToMoveToPhase4 ?? false
  

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
  
  // Determine session structure for variant handling
  const hasVariants = validSessions.some(s => s.variants && s.variants.length > 1)

  return (
    <div className="space-y-4">
      {/* Program Command Header - Premium coaching dashboard */}
      <Card className="bg-gradient-to-b from-[#2A2A2A] to-[#252525] border-[#3A3A3A] overflow-hidden">
        {/* Hero Zone - Program Identity */}
        <div className="relative px-4 pt-4 pb-3">
          {/* Subtle accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E63946]/40 to-transparent" />
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Truthful Program Title - reflects actual week content */}
              <div className="flex items-center gap-2.5 mb-1">
                <h3 className="text-xl font-bold tracking-tight">
                  {/* Show primary + secondary if both exist, otherwise just goalLabel */}
                  {program.secondaryGoal 
                    ? `${program.goalLabel?.split(' ')[0] || program.primaryGoal?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} + ${program.secondaryGoal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
                    : program.goalLabel}
                </h3>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#E63946]/70 px-2 py-0.5 bg-[#E63946]/10 rounded">
                  Active
                </span>
              </div>
              {/* Training architecture with decision clarity */}
              <p className="text-sm text-[#8A8A8A]">
                {intelligenceContract?.strategicSummary?.architectureLabel 
                  ? `${intelligenceContract.strategicSummary.architectureLabel} · `
                  : intelligenceContract?.trainingSpine?.label 
                    ? `${intelligenceContract.trainingSpine.label} · `
                    : ''}
                {validSessions.length} days/week · {program.sessionLength || 60}min sessions
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* Why This Fits You - premium explanation trigger */}
              <Button
                variant="ghost"
                size="sm"
                className="text-[#6A6A6A] hover:text-[#E63946] h-8 w-8 p-0 rounded-full hover:bg-[#E63946]/10"
                onClick={() => setShowWhySheet(true)}
                title="Why this program fits you"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              {(onRestart || onDelete) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#5A5A5A] hover:text-amber-400 h-8 w-8 p-0 rounded-full hover:bg-[#333]"
                  onClick={() => setShowRestartConfirm(true)}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Compact Summary Strip - key facts at a glance */}
        <div className="px-4 py-2.5 bg-[#1E1E1E]/40 border-t border-[#333]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-[#E63946]" />
                <span className="text-[#C8C8C8] font-medium capitalize">{program.experienceLevel}</span>
              </div>
              <div className="w-px h-3 bg-[#3A3A3A]" />
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#6A6A6A]" />
                <span className="text-[#9A9A9A]">{program.scheduleMode === 'flexible' ? 'Adaptive' : 'Fixed'} schedule</span>
              </div>
              {/* Premium confidence indicator */}
              {intelligenceContract?.premiumConfidence && (
                <>
                  <div className="w-px h-3 bg-[#3A3A3A]" />
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      intelligenceContract.premiumConfidence.level === 'high' ? 'bg-green-500' :
                      intelligenceContract.premiumConfidence.level === 'moderate' ? 'bg-amber-500' :
                      'bg-[#5A5A5A]'
                    }`} />
                    <span className="text-[#6A6A6A] text-[10px]">
                      {intelligenceContract.premiumConfidence.level === 'high' ? 'High confidence' :
                       intelligenceContract.premiumConfidence.level === 'moderate' ? 'Good confidence' :
                       'Building confidence'}
                    </span>
                  </div>
                </>
              )}
            </div>
            {/* Learn more link */}
            <button 
              onClick={() => setShowWhySheet(true)}
              className="text-[10px] text-[#E63946]/70 hover:text-[#E63946] font-medium uppercase tracking-wide"
            >
              View decisions
            </button>
          </div>
        </div>
        
        {/* [P2D] Skill Goals — Ultra-compact one-liner, details in Hub Skill Map sheet */}
        {selectedSkillRepresentations.length > 0 && (() => {
          const trainedCount = selectedSkillRepresentations.filter(r => 
            r.state === 'headline_priority' || r.state === 'direct' || r.state === 'support' || r.state === 'accessory_carryover'
          ).length
          const underrepCount = selectedSkillRepresentations.filter(r => 
            r.state === 'underrepresented' || r.state === 'unknown' || r.state === 'deferred' || r.state === 'compressed'
          ).length
          const totalCount = selectedSkillRepresentations.length
          
          return (
            <div className="px-4 py-1.5 border-t border-[#333]/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px]">
                <Target className="w-3 h-3 text-[#E63946]" />
                <span className="text-[#8A8A8A]">
                  {totalCount} skills · {trainedCount} active this week
                  {underrepCount > 0 && <span className="text-[#5A5A5A]"> · {underrepCount} deferred/pending</span>}
                </span>
              </div>
              <span className="text-[9px] text-[#5A5A5A]">See Skill Map in hub</span>
            </div>
          )
        })()}
        
        {/* [WEEK-ADVANCEMENT] Week Progression Control - Safe advancement without regeneration */}
        {weekProgression && (
          <div className="px-4 py-2.5 border-t border-[#333]/30 bg-[#1A1A1A]/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Week number with phase label */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#C8C8C8]">
                    Week {weekProgression.currentWeek}
                  </span>
                  <span className="text-[10px] text-[#6A6A6A]">
                    of {weekProgression.totalWeeksInCycle}
                  </span>
                </div>
                
                {/* [WEEK-PROGRESSION-TRUTH] Phase label chip */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium ${
                  weekPhaseLabel === 'Acclimation' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : weekPhaseLabel === 'Ramp Up'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : weekPhaseLabel === 'Peak'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                }`}>
                  <Zap className="w-2.5 h-2.5" />
                  {weekPhaseLabel}
                </span>
                
                {/* Volume indicator */}
                <span className="text-[9px] text-[#5A5A5A]">
                  {weekVolumeIndicator.percentage}% volume
                </span>
              </div>
              
              {/* Week navigation buttons */}
              <div className="flex items-center gap-1.5">
                {/* Go back button */}
                {weekProgression.currentWeek > 1 && (
                  <button
                    onClick={() => handleGoToWeek(weekProgression.currentWeek - 1)}
                    disabled={isAdvancingWeek}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#6A6A6A] hover:text-[#8A8A8A] bg-[#1A1A1A] hover:bg-[#252525] rounded border border-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Go back to Week ${weekProgression.currentWeek - 1}`}
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Week {weekProgression.currentWeek - 1}</span>
                  </button>
                )}
                
                {/* Advance button */}
                {weekProgression.canAdvance ? (
                  <button
                    onClick={handleAdvanceWeek}
                    disabled={isAdvancingWeek}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#E63946] bg-[#E63946]/10 hover:bg-[#E63946]/20 rounded-md border border-[#E63946]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdvancingWeek ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Advancing...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Week {weekProgression.currentWeek + 1}</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[10px] text-[#5A5A5A]">
                    {weekProgression.cannotAdvanceReason || 'Final week'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Success/Error feedback */}
            {weekAdvancementResult && (
              <div className={`mt-2 text-[10px] ${weekAdvancementResult.success ? 'text-green-500' : 'text-amber-500'}`}>
                {weekAdvancementResult.success 
                  ? `Advanced to Week ${weekAdvancementResult.newWeek}`
                  : weekAdvancementResult.error || 'Could not advance week'}
              </div>
            )}
          </div>
        )}
        
        {/* [P2C] Condensed Weekly Intelligence Strip — essential context only, details moved to hub */}
        {intelligenceContract && (
          <div className="px-4 py-2.5 border-t border-[#333]/30 bg-[#1A1A1A]/30">
            {/* [WEEK-PHASE-DOCTRINE-FIX] Protective week indicator - compact version */}
            {weekPhaseContext.isProtectiveWeek && (
              <div className="mb-2 flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-500/8 border border-blue-500/20">
                <Shield className="w-3 h-3 text-blue-400/70 shrink-0" />
                <span className="text-[10px] text-blue-400/90 font-medium">
                  Week {currentWeekNumber} · {weekPhaseContext.phaseName}
                </span>
              </div>
            )}
            
            {/* Coaching headline - kept concise */}
            <p className="text-[12px] text-[#C8C8C8] font-medium leading-relaxed">
              {weekPhaseContext.coachingHeadline}
            </p>
            
            {/* Compact structure row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[9px]">
              {/* Week/phase for non-protective */}
              {!weekPhaseContext.isProtectiveWeek && (
                <span className="text-[#6A6A6A]">
                  Week {currentWeekNumber} · {weekPhaseContext.phaseName}
                </span>
              )}
              {/* Structure identity */}
              {intelligenceContract.weeklyDecisionLogic?.structureIdentity && (
                <span className="text-[#7A7A7A]">{intelligenceContract.weeklyDecisionLogic.structureIdentity}</span>
              )}
              {/* Primary tradeoff - super compact */}
              {intelligenceContract.tradeoffs?.[0] && (
                <span className="text-[#5A5A5A]">
                  {intelligenceContract.tradeoffs[0].prioritized} &gt; {intelligenceContract.tradeoffs[0].limited}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Quality notice - only show when significant */}
        {program.plannerTruthAudit?.shouldWarn && 
         program.plannerTruthAudit.topIssueReason && 
         program.plannerTruthAudit.topIssueReason !== 'none' &&
         program.plannerTruthAudit.overallScore !== undefined &&
         program.plannerTruthAudit.overallScore < 70 && (
          <div className="mx-4 mb-3 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-400/90 line-clamp-1">
              {program.plannerTruthAudit.topIssueDescription || 'Some preferences may not be fully reflected'}
            </p>
          </div>
        )}
      </Card>

  {/* [SPARTANLAB-P2B] Coach Intelligence Hub — Method Override Planner corridor */}
  <ProgramCoachIntelligenceHub
    program={program}
    selectedSkillRepresentations={selectedSkillRepresentations}
    intelligenceContract={intelligenceContract}
    currentWeekNumber={currentWeekNumber}
    onProgramUpdate={onProgramUpdate} // [AB20 / IQ10] Wire through for state update
    onApplyMethodOverridePreview={onApplyMethodOverridePreview} // [AB20.1D] Wire through for save
    onRevertMethodOverride={onRevertMethodOverride} // [AB20.2] Wire through for revert
    onResetAllMethodOverrides={onResetAllMethodOverrides} // [AB20.4.2] Wire through for reset-all
    onApplyFrequencyPlacement={onApplyFrequencyPlacement} // [MASTER-8C.12A] Wire through for frequency save
    onRemoveSelectedPlacements={onRemoveSelectedPlacements} // [MASTER-8C.12B] Wire through for selective removal
    // [Prompt 80.2] Removed callback - markers now derived locally via useMemo
  />

      {/* [P2C] Condensed Today Guidance — compact actionable inline, details available in hub */}
      {todayGuidance && todayGuidance.available && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0",
              todayGuidance.state === 'ready' && "bg-emerald-500",
              todayGuidance.state === 'controlled' && "bg-blue-400",
              todayGuidance.state === 'protect_recovery' && "bg-purple-400",
              todayGuidance.state === 'reduce_or_shorten' && "bg-amber-400",
              todayGuidance.state === 'collecting_data' && "bg-gray-400",
            )} />
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-medium",
              todayGuidance.state === 'ready' && "bg-emerald-500/10 text-emerald-400/90",
              todayGuidance.state === 'controlled' && "bg-blue-500/10 text-blue-400/90",
              todayGuidance.state === 'protect_recovery' && "bg-purple-500/10 text-purple-400/90",
              todayGuidance.state === 'reduce_or_shorten' && "bg-amber-500/10 text-amber-400/90",
              todayGuidance.state === 'collecting_data' && "bg-gray-500/10 text-gray-400/90",
            )}>
              {todayGuidance.label}
            </span>
            <p className="text-[10px] text-[#9A9A9A] flex-1 line-clamp-1">
              {todayGuidance.nextAction}
            </p>
          </div>
        </div>
      )}

      {/* [PHASE 13 TASK 6] Schedule Change Notice - only shown after real mutation */}
      {scheduleNotice && scheduleNotice.type !== 'no_change' && (
        <div className="mb-4 p-3 rounded-lg bg-[#1A2A1A] border border-[#2A3A2A]">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#E6E9EF]">
                {scheduleNotice.headline}
              </p>
              <p className="text-xs text-[#8A9A8A] mt-0.5">
                {scheduleNotice.reason}
              </p>
              {scheduleNotice.preservedCompleted && (
                <p className="text-[10px] text-[#6A7A6A] mt-1">
                  Completed sessions preserved
                </p>
              )}
            </div>
            <button 
              onClick={() => setScheduleNotice(null)}
              className="text-[#6A7A6A] hover:text-[#9AAA9A] transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
      </div>
      )}

      {/* [W.W9] UNIFIED RECOVERY / INJURY / SUBSTITUTION COACHING INTEGRATION
          Derives a single coaching model from existing recovery and injury truth sources.
          Shows combined guidance when either source has actionable items.
          Advisory-only — no program mutation. */}
      {(() => {
        const coachingModel = deriveRecoveryInjurySubstitutionCoaching({
          recoveryBridge: recoveryAwarenessBridge,
          injuryAdvisory: injuryAdvisory,
        })
        
        if (!hasActiveCoaching(coachingModel)) return null
        
        const itemsByType = getCoachingItemsByType(coachingModel)
        const hasSubstitutions = itemsByType.substitution.length > 0
        
        return (
          <div className="rounded-lg border bg-gradient-to-br from-[#1A1820]/60 via-[#1A1A25]/50 to-[#181A20]/60 border-[#2A2A35] overflow-hidden">
            {/* Coaching header */}
            <div className="px-3 py-2 border-b border-[#2A2A35]/50 bg-[#15151A]/30">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  coachingModel.riskLevel === 'high' ? "bg-amber-500/20" :
                  coachingModel.riskLevel === 'moderate' ? "bg-yellow-500/15" :
                  "bg-blue-500/15"
                )}>
                  {coachingModel.riskLevel === 'high' ? (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  ) : coachingModel.riskLevel === 'moderate' ? (
                    <Shield className="w-3 h-3 text-yellow-400/80" />
                  ) : (
                    <Activity className="w-3 h-3 text-blue-400/70" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  coachingModel.riskLevel === 'high' ? "text-amber-300/90" :
                  coachingModel.riskLevel === 'moderate' ? "text-yellow-300/80" :
                  "text-blue-300/80"
                )}>
                  {coachingModel.headline}
                </span>
                <span className="ml-auto text-[10px] text-[#5A5A6A] uppercase tracking-wide">
                  Recovery Coach
                </span>
              </div>
            </div>
            
            {/* Coaching content */}
            <div className="p-3 space-y-2">
              {/* Summary */}
              <p className="text-xs text-[#9A9A9A] leading-relaxed">
                {coachingModel.summary}
              </p>
              
              {/* Primary cue if available */}
              {coachingModel.primaryCue && (
                <p className="text-[11px] text-[#7A8A7A] flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-emerald-500/60 mt-0.5 shrink-0" />
                  <span>{coachingModel.primaryCue}</span>
                </p>
              )}
              
              {/* Show substitution items if any */}
              {hasSubstitutions && (
                <div className="mt-2 pt-2 border-t border-[#2A2A35]/30">
                  <p className="text-[10px] text-[#6A6A7A] uppercase tracking-wide mb-1.5">
                    Safer Options Available
                  </p>
                  <div className="space-y-1">
                    {itemsByType.substitution.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px]">
                        <span className="text-[#7A7A8A] truncate flex-1">{item.originalExercise}</span>
                        <span className="text-[#4A4A5A]">→</span>
                        <span className="text-emerald-400/70 truncate max-w-[120px]">
                          {item.suggestedAlternative || 'alternative available'}
                        </span>
                      </div>
                    ))}
                    {itemsByType.substitution.length > 3 && (
                      <p className="text-[10px] text-[#5A5A6A]">
                        +{itemsByType.substitution.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Non-mutation proof */}
              <div className="flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                <span className="text-[10px] text-[#5A5A6A]">
                  Advisory only — {coachingModel.savedProgramUnchanged ? 'program unchanged' : 'current session only'}
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* [W.W10] USER CONTROL WITHOUT BREAKING INTELLIGENCE
          Shows gentle coaching when user's exercise override patterns suggest attention needed.
          Truth source: override-signal-service (analyzeSignalsForAdaptive).
          Advisory-only — program unchanged. */}
      {(() => {
        const userControlModel = deriveUserControlCoaching()
        
        if (!hasActiveUserControlCoaching(userControlModel)) return null
        
        const hasPatterns = userControlModel.patterns.length > 0
        const topPattern = userControlModel.patterns[0]
        const severityStyles = topPattern ? getUserControlSeverityStyles(topPattern.severity) : getUserControlSeverityStyles('low')
        
        return (
          <div className="rounded-lg border bg-gradient-to-br from-[#181A20]/60 via-[#1A1A22]/50 to-[#1A1820]/60 border-[#2A2A30] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-[#2A2A30]/50 bg-[#15151A]/30">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  topPattern?.severity === 'high' ? "bg-amber-500/20" :
                  topPattern?.severity === 'moderate' ? "bg-yellow-500/15" :
                  "bg-blue-500/15"
                )}>
                  <TrendingUp className={cn("w-3 h-3", severityStyles.iconColor)} />
                </div>
                <span className={cn("text-xs font-medium", severityStyles.badgeClass.replace('/70', '/90').replace('/60', '/80').replace('/50', '/70'))}>
                  {userControlModel.headline}
                </span>
                <span className="ml-auto text-[10px] text-[#5A5A6A] uppercase tracking-wide">
                  Preference Coach
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-3 space-y-2">
              <p className="text-xs text-[#9A9A9A] leading-relaxed">
                {userControlModel.summary}
              </p>
              
              {/* Show top patterns */}
              {hasPatterns && (
                <div className="space-y-1.5">
                  {userControlModel.patterns.slice(0, 2).map((pattern, idx) => {
                    const patternStyles = getUserControlSeverityStyles(pattern.severity)
                    return (
                      <div key={idx} className="flex items-start gap-2 text-[11px]">
                        <ChevronRight className={cn("w-3 h-3 mt-0.5 shrink-0", patternStyles.iconColor)} />
                        <span className="text-[#8A8A8A]">
                          {pattern.description}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Recommendations if available */}
              {userControlModel.recommendations.length > 0 && (
                <div className="pt-1.5 border-t border-[#2A2A30]/30">
                  <p className="text-[10px] text-emerald-400/70">
                    {userControlModel.recommendations[0]}
                  </p>
                </div>
              )}
              
              {/* Advisory marker */}
              <div className="flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                <span className="text-[10px] text-[#5A5A6A]">
                  Advisory only — program unchanged
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* [PHASE M1.2 + STEP 21.6] Recovery-to-Program Awareness Bridge with Adjustment Preview
          Displays recovery-aware guidance and adjustment CTA when bridge indicates concern.
          Step 21.6 adds user-approved, preview-first, current-session-only adjustment. */}
      {recoveryAwarenessBridge && hasRecoveryConcern(recoveryAwarenessBridge) && (
        <div 
          className="rounded-lg border bg-gradient-to-r from-[#1A1A2A]/50 to-[#1A2020]/50 border-[#2A3040] overflow-hidden"
          data-m1-recovery-program-awareness="true"
          data-m1-advisory-level={recoveryAwarenessBridge.level}
          data-m1-no-program-mutation="true"
        >
          {/* Main advisory content */}
          <div className="p-3">
            <div className="flex items-start gap-3">
              {/* Icon based on severity */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                recoveryAwarenessBridge.level === 'deload_recommended' 
                  ? "bg-amber-500/20"
                  : recoveryAwarenessBridge.level === 'reduce_load'
                    ? "bg-yellow-500/15"
                    : "bg-blue-500/15"
              )}>
                {recoveryAwarenessBridge.level === 'deload_recommended' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-blue-400/80" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {/* Headline */}
                <p className={cn(
                  "text-sm font-medium",
                  recoveryAwarenessBridge.level === 'deload_recommended'
                    ? "text-amber-300/90"
                    : recoveryAwarenessBridge.level === 'reduce_load'
                      ? "text-yellow-300/80"
                      : "text-blue-300/80"
                )}>
                  {recoveryAwarenessBridge.headline}
                </p>
                {/* Summary */}
                <p className="text-xs text-[#8A8A9A] mt-0.5 leading-relaxed">
                  {recoveryAwarenessBridge.summary}
                </p>
                {/* Non-mutation proof line */}
                <p className="text-[10px] text-[#5A5A6A] mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                  <span>Advisory only — no automatic program changes applied</span>
                </p>
              </div>
            </div>
          </div>

          {/* [STEP 21.6] Adjustment Preview Section */}
          {recoveryAdjustmentPreview ? (
            <div 
              className="border-t border-[#2A3040] bg-[#0D0D15]/50 p-3"
              data-step-21-6-adjustment-preview="true"
              data-adjustment-status={recoveryAdjustmentPreview.status}
            >
              {recoveryAdjustmentPreview.status === 'preview' && (
                <>
                  {/* Preview header */}
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400/70" />
                    <span className="text-xs font-medium text-blue-300/80">
                      Recovery Adjustment Preview
                    </span>
                    <span className="text-[10px] text-[#5A5A6A] ml-auto">
                      Today only — program unchanged
                    </span>
                  </div>
                  {/* User message */}
                  <p className="text-xs text-[#9A9AAA] mb-3">
                    {recoveryAdjustmentPreview.userMessage}
                  </p>
                  {/* Changes summary */}
                  <div className="space-y-1.5 mb-3">
                    {recoveryAdjustmentPreview.exerciseAdjustments
                      .filter(ea => ea.changes.length > 0)
                      .slice(0, 3)
                      .map(ea => (
                        <div key={ea.exerciseId} className="flex items-center gap-2 text-[11px]">
                          <span className="text-[#7A7A8A] truncate flex-1">{ea.exerciseName}</span>
                          <span className="text-[#5A5A6A]">→</span>
                          <span className="text-emerald-400/70">
                            {ea.changes.map(c => c.label).join(', ')} adjusted
                          </span>
                        </div>
                      ))}
                    {recoveryAdjustmentPreview.overallSummary.totalExercisesAffected > 3 && (
                      <p className="text-[10px] text-[#5A5A6A]">
                        +{recoveryAdjustmentPreview.overallSummary.totalExercisesAffected - 3} more exercises
                      </p>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={onApplyAdjustment}
                      className="flex-1 h-8 text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Apply to Today Only
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onDismissAdjustment}
                      className="flex-1 h-8 text-xs border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#1A1A2A]"
                    >
                      Keep Original
                    </Button>
                  </div>
                </>
              )}

              {recoveryAdjustmentPreview.status === 'applied' && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-emerald-300/90">
                      Recovery-adjusted session active
                    </p>
                    <p className="text-[10px] text-[#6A6A7A]">
                      {recoveryAdjustmentPreview.overallSummary.totalExercisesAffected} exercises adjusted — today only
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Show CTA to preview adjustment when no preview exists yet */
            onRequestAdjustmentPreview && (recoveryAwarenessBridge.level === 'reduce_load' || recoveryAwarenessBridge.level === 'deload_recommended') && (
              <div className="border-t border-[#2A3040] bg-[#0D0D15]/30 p-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRequestAdjustmentPreview}
                  className="w-full h-8 text-xs border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#1A1A2A] hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Preview Recovery Adjustment for Today
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {/* [STEP 22.7 / T.T7] Injury Advisory Preview Card
          Displays compact joint caution advisory when recommendations exist.
          Preview only — no mutation. Shows which exercises may be affected
          by joint cautions, without changing the program. */}
      {injuryAdvisory && hasActionableInjuryAdvisory(injuryAdvisory) && (
        <div className="rounded-lg border bg-gradient-to-r from-[#2A1A1A]/50 to-[#1A1A20]/50 border-[#3A2A2A] overflow-hidden">
          <div className="p-3">
            <div className="flex items-start gap-3">
              {/* Icon based on status */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                injuryAdvisory.status === 'urgent_block' 
                  ? "bg-red-500/20"
                  : "bg-amber-500/15"
              )}>
                <AlertTriangle className={cn(
                  "w-3.5 h-3.5",
                  injuryAdvisory.status === 'urgent_block'
                    ? "text-red-400"
                    : "text-amber-400/80"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                {/* Headline */}
                <p className={cn(
                  "text-sm font-medium",
                  injuryAdvisory.status === 'urgent_block'
                    ? "text-red-300/90"
                    : "text-amber-300/80"
                )}>
                  {injuryAdvisory.visibleHeadline || 'Joint caution advisory'}
                </p>
                {/* Summary */}
                <p className="text-xs text-[#8A8A9A] mt-0.5 leading-relaxed">
                  {injuryAdvisory.visibleSummary || `${injuryAdvisory.affectedExerciseCount} exercise${injuryAdvisory.affectedExerciseCount !== 1 ? 's' : ''} may be affected by your joint concerns.`}
                </p>
                {/* Affected exercises list (max 3) */}
                {injuryAdvisory.recommendations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {injuryAdvisory.recommendations.slice(0, 3).map(rec => (
                      <div key={rec.recommendationId} className="flex items-center gap-2 text-[11px]">
                        <span className="text-[#7A7A8A] truncate flex-1">{rec.affectedExerciseName}</span>
                        <span className="text-[#5A5A6A]">—</span>
                        <span className="text-amber-400/70 shrink-0">
                          {rec.jointOrRegion.replace(/_/g, ' ')} caution
                        </span>
                      </div>
                    ))}
                    {injuryAdvisory.recommendations.length > 3 && (
                      <p className="text-[10px] text-[#5A5A6A]">
                        +{injuryAdvisory.recommendations.length - 3} more
                      </p>
                    )}
                  </div>
                )}
                {/* Non-mutation proof line */}
                <p className="text-[10px] text-[#5A5A6A] mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                  <span>Preview only — your plan has not been changed</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [V.V5] Protect Recovery Spacing Mutation Corridor Card
          User-confirmed mutation corridor for protect_recovery_spacing action.
          Second saved-program mutation corridor in Phase V.
          @step 24.5 */}
      {missedWorkoutAdvisory &&
       missedWorkoutAdvisory.action === 'protect_recovery_spacing' &&
       !missedWorkoutAdvisoryDismissed && (() => {
        // Determine target session — for now use the first incomplete session (index 0)
        const targetSessionIndex = 0
        const spacingPreview = buildProtectRecoverySpacingMutationPreview(program, targetSessionIndex, missedWorkoutAdvisory)
        const recoveryPreview = buildRecoverySpacingPreview(missedWorkoutAdvisory)
        
        return (
          <div
            className="rounded-lg border bg-gradient-to-br from-[#1A1A25]/60 via-[#1A1820]/50 to-[#181A20]/60 border-[#2A2A35] overflow-hidden"
            data-step-24-vv5-protect-recovery-spacing="true"
            data-advisory-action="protect_recovery_spacing"
            data-user-confirmed={protectRecoverySpacingState === 'applied' ? 'true' : 'false'}
            data-saved-program-mutation={protectRecoverySpacingState === 'applied' ? 'true' : 'false'}
            data-no-live-workout-mutation="true"
          >
            <div className="p-3">
              <div className="flex items-start gap-3">
                {/* Recovery spacing icon */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  missedWorkoutAdvisory.severity === 'high'
                    ? "bg-amber-500/15"
                    : "bg-blue-500/15"
                )}>
                  <Shield className={cn(
                    "w-3.5 h-3.5",
                    missedWorkoutAdvisory.severity === 'high'
                      ? "text-amber-400"
                      : "text-blue-400"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-[#FAFAFA]">
                      {missedWorkoutAdvisory.title || 'Protect Recovery Spacing'}
                    </p>
                    <span className={cn(
                      "px-1.5 py-0.5 text-[9px] rounded font-medium",
                      missedWorkoutAdvisory.severity === 'high'
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-blue-500/15 text-blue-400"
                    )}>
                      Recovery
                    </span>
                  </div>
                  
                  {/* Summary */}
                  <p className="text-[11px] text-[#9A9AAA] mb-2 leading-relaxed">
                    {recoveryPreview.summary || missedWorkoutAdvisory.summary}
                  </p>
                  
                  {/* Applied state */}
                  {protectRecoverySpacingState === 'applied' && protectRecoverySpacingResult?.status === 'success' && (
                    <div 
                      className="p-2 bg-emerald-500/10 rounded border border-emerald-500/30 mb-2"
                      data-step-24-vv5-protect-recovery-spacing-success="true"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-emerald-300">
                            Recovery Spacing Protected
                          </p>
                          <p className="text-[10px] text-emerald-400/80 mt-0.5">
                            {protectRecoverySpacingResult.visibleSummary}
                          </p>
                          <p className="text-[9px] text-[#6A6A7A] mt-1">
                            Saved program updated. Exercises/sets/reps unchanged. Live workout unaffected.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Already protected state */}
                  {(protectRecoverySpacingState === 'already_protected' || spacingPreview.alreadyProtected) && (
                    <div 
                      className="p-2 bg-blue-500/10 rounded border border-blue-500/30 mb-2"
                      data-step-24-vv5-already-protected="true"
                    >
                      <div className="flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-blue-300">
                            Already Protected
                          </p>
                          <p className="text-[10px] text-blue-400/80 mt-0.5">
                            {spacingPreview.blockedReason || 'This session already has recovery spacing protection.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Failed state */}
                  {protectRecoverySpacingState === 'failed' && (
                    <div 
                      className="p-2 bg-red-500/10 rounded border border-red-500/30 mb-2"
                      data-step-24-vv5-protect-recovery-spacing-failed="true"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-red-300">
                            Could Not Protect Recovery Spacing
                          </p>
                          <p className="text-[10px] text-red-400/80 mt-0.5">
                            {protectRecoverySpacingResult?.visibleSummary || 'An error occurred.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Applying state */}
                  {protectRecoverySpacingState === 'applying' && (
                    <div 
                      className="p-2 bg-[#2A2A35]/50 rounded border border-[#3A3A4A] mb-2"
                      data-step-24-vv5-applying="true"
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        <p className="text-[11px] text-[#9A9AAA]">
                          Protecting recovery spacing...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Confirmation state — show preview of what will change */}
                  {protectRecoverySpacingState === 'confirming' && spacingPreview.canShow && !spacingPreview.alreadyProtected && (
                    <div 
                      className="p-2 bg-amber-500/10 rounded border border-amber-500/30 mb-2"
                      data-step-24-vv5-confirmation-preview="true"
                    >
                      <p className="text-[11px] font-medium text-amber-300 mb-2">
                        Confirm Recovery Spacing Protection?
                      </p>
                      <p className="text-[10px] text-[#8A8A9A] mb-2">
                        Target: <span className="text-amber-300">{spacingPreview.targetSessionLabel}</span>
                      </p>
                      
                      {/* What will change */}
                      <div className="mb-2">
                        <p className="text-[10px] font-medium text-[#9A9AAA] mb-1">What will change:</p>
                        <ul className="text-[10px] text-[#7A7A8A] space-y-0.5 ml-2">
                          {spacingPreview.whatWillChange.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-amber-400 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* What will NOT change */}
                      <div className="mb-2">
                        <p className="text-[10px] font-medium text-[#9A9AAA] mb-1">What stays the same:</p>
                        <ul className="text-[10px] text-[#6A6A7A] space-y-0.5 ml-2">
                          {spacingPreview.whatWillNotChange.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Confirm/cancel buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!onConfirmProtectRecoverySpacing || !missedWorkoutAdvisory) return
                            setProtectRecoverySpacingState('applying')
                            try {
                              const result = await onConfirmProtectRecoverySpacing(missedWorkoutAdvisory, targetSessionIndex)
                              setProtectRecoverySpacingResult(result)
                              if (result.status === 'success') {
                                setProtectRecoverySpacingState('applied')
                              } else if (result.status === 'already_protected') {
                                setProtectRecoverySpacingState('already_protected')
                              } else {
                                setProtectRecoverySpacingState('failed')
                              }
                            } catch (error) {
                              setProtectRecoverySpacingResult({
                                status: 'blocked',
                                visibleSummary: 'An unexpected error occurred.',
                                evidence: [`Error: ${error instanceof Error ? error.message : 'unknown'}`],
                                reasonCode: 'unexpected_error',
                              })
                              setProtectRecoverySpacingState('failed')
                            }
                          }}
                          className="flex-1 h-7 text-xs bg-blue-600/80 hover:bg-blue-600 text-white"
                          data-step-24-vv5-protect-recovery-spacing-apply="true"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Confirm Protection
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setProtectRecoverySpacingState('idle')}
                          className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A]"
                          data-action="cancel-protect-recovery-spacing"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Idle state — show initiate button */}
                  {protectRecoverySpacingState === 'idle' && 
                   !spacingPreview.alreadyProtected && 
                   spacingPreview.canShow &&
                   onConfirmProtectRecoverySpacing && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setProtectRecoverySpacingState('confirming')}
                        className="flex-1 h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                        data-action="initiate-protect-recovery-spacing"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Review & Protect Spacing
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A] hover:bg-[#1A1A2A]/50"
                        data-action="dismiss-protect-recovery-spacing"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Idle state without callback — advisory only (fallback to V.V3 behavior) */}
                  {protectRecoverySpacingState === 'idle' && 
                   !spacingPreview.alreadyProtected && 
                   spacingPreview.canShow &&
                   !onConfirmProtectRecoverySpacing && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="flex-1 h-7 text-xs border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#1A1A2A] hover:text-white"
                        data-action="got-it"
                        data-no-mutation="true"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Got It
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A] hover:bg-[#1A1A2A]/50"
                        data-action="dismiss"
                        data-no-mutation="true"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Done state — after successful application */}
                  {protectRecoverySpacingState === 'applied' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="flex-1 h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        data-action="done"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Done
                      </Button>
                    </div>
                  )}
                  
                  {/* Proof line — shows plan status */}
                  {protectRecoverySpacingState !== 'applied' && !spacingPreview.alreadyProtected && (
                    <p className="text-[10px] text-[#5A5A6A] mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                      <span>Your plan has not been changed yet.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* [V.V6] Multi-Session Push Forward Guardrail Card
          User-confirmed mutation corridor for multi-session push-forward scenarios.
          Third saved-program mutation corridor in Phase V.
          @step 24.6 */}
      {missedWorkoutAdvisory &&
       (missedWorkoutAdvisory.action === 'push_session_forward' || 
        missedWorkoutAdvisory.action === 'recommend_regeneration') &&
       !missedWorkoutAdvisoryDismissed &&
       onConfirmMultiSessionPushForward && (() => {
        const multiPushPreview = buildMultiSessionPushForwardMutationPreview(program, missedWorkoutAdvisory)
        
        // Only show V.V6 card if there are multiple sessions to push
        if (!multiPushPreview.canShow || multiPushPreview.targetSessions.length < 2) {
          return null
        }
        
        return (
          <div
            className="rounded-lg border bg-gradient-to-br from-[#1A1A25]/60 via-[#1A1820]/50 to-[#181A20]/60 border-[#2A2A35] overflow-hidden"
            data-step-24-vv6-multi-session-push-forward="true"
            data-vv6-preview-ready={multiPushPreview.canConfirm ? 'true' : 'false'}
            data-vv6-applied={multiSessionPushForwardState === 'applied' ? 'true' : 'false'}
            data-user-confirmed-mutation={multiSessionPushForwardState === 'applied' ? 'true' : 'false'}
            data-no-live-workout-mutation="true"
          >
            <div className="p-3">
              <div className="flex items-start gap-3">
                {/* Multi-session icon */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-purple-500/15">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-[#FAFAFA]">
                      {multiPushPreview.title}
                    </p>
                    <span className="px-1.5 py-0.5 text-[9px] rounded font-medium bg-purple-500/15 text-purple-400">
                      Multi-Session
                    </span>
                  </div>
                  
                  {/* Summary */}
                  <p className="text-[11px] text-[#9A9AAA] mb-2 leading-relaxed">
                    {multiPushPreview.summary}
                  </p>
                  
                  {/* Applied state */}
                  {multiSessionPushForwardState === 'applied' && multiSessionPushForwardResult?.status === 'success' && (
                    <div 
                      className="p-2 bg-emerald-500/10 rounded border border-emerald-500/30 mb-2"
                      data-step-24-vv6-success="true"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-emerald-300">
                            Multi-Session Push Forward Applied
                          </p>
                          <p className="text-[10px] text-emerald-400/80 mt-0.5">
                            {multiSessionPushForwardResult.visibleSummary}
                          </p>
                          <p className="text-[9px] text-[#6A6A7A] mt-1">
                            {multiSessionPushForwardResult.changedSessionCount} session(s) marked. No live workout mutation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Already applied state */}
                  {(multiSessionPushForwardState === 'already_applied' || 
                    multiPushPreview.targetSessions.every(t => t.alreadyMarked)) && (
                    <div 
                      className="p-2 bg-blue-500/10 rounded border border-blue-500/30 mb-2"
                      data-step-24-vv6-already-applied="true"
                    >
                      <div className="flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-blue-300">
                            Already Applied
                          </p>
                          <p className="text-[10px] text-blue-400/80 mt-0.5">
                            All target sessions already have push-forward protection.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Failed state */}
                  {multiSessionPushForwardState === 'failed' && (
                    <div 
                      className="p-2 bg-red-500/10 rounded border border-red-500/30 mb-2"
                      data-step-24-vv6-failed="true"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-red-300">
                            Could Not Apply Push Forward
                          </p>
                          <p className="text-[10px] text-red-400/80 mt-0.5">
                            {multiSessionPushForwardResult?.visibleSummary || 'An error occurred.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Applying state */}
                  {multiSessionPushForwardState === 'applying' && (
                    <div 
                      className="p-2 bg-[#2A2A35]/50 rounded border border-[#3A3A4A] mb-2"
                      data-step-24-vv6-applying="true"
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                        <p className="text-[11px] text-[#9A9AAA]">
                          Applying multi-session push forward...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Confirmation state — show preview of what will change */}
                  {multiSessionPushForwardState === 'confirming' && multiPushPreview.canConfirm && (
                    <div 
                      className="p-2 bg-purple-500/10 rounded border border-purple-500/30 mb-2"
                      data-step-24-vv6-confirmation-preview="true"
                    >
                      <p className="text-[11px] font-medium text-purple-300 mb-2">
                        Confirm Multi-Session Push Forward?
                      </p>
                      
                      {/* Target sessions */}
                      <div className="mb-2">
                        <p className="text-[10px] font-medium text-[#9A9AAA] mb-1">Target Sessions:</p>
                        <div className="flex flex-wrap gap-1">
                          {multiPushPreview.targetSessions.map((session, idx) => (
                            <span 
                              key={idx} 
                              className={cn(
                                "px-1.5 py-0.5 text-[9px] rounded",
                                session.alreadyMarked 
                                  ? "bg-blue-500/10 text-blue-400" 
                                  : "bg-purple-500/10 text-purple-300"
                              )}
                            >
                              {session.label} {session.alreadyMarked && '(already marked)'}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* What will change */}
                      <div className="mb-2">
                        <p className="text-[10px] font-medium text-[#9A9AAA] mb-1">What will change:</p>
                        <ul className="text-[10px] text-[#7A7A8A] space-y-0.5 ml-2">
                          {multiPushPreview.whatWillChange.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-purple-400 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* What will NOT change */}
                      <div className="mb-2">
                        <p className="text-[10px] font-medium text-[#9A9AAA] mb-1">What stays the same:</p>
                        <ul className="text-[10px] text-[#6A6A7A] space-y-0.5 ml-2">
                          {multiPushPreview.whatWillNotChange.slice(0, 4).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Safety notes */}
                      {multiPushPreview.safetyNotes.length > 0 && (
                        <div className="mb-2 p-1.5 bg-[#1A1A20]/50 rounded border border-[#2A2A35]">
                          <p className="text-[9px] text-[#6A6A7A] italic">
                            {multiPushPreview.safetyNotes[0]}
                          </p>
                        </div>
                      )}
                      
                      {/* Confirm/cancel buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!onConfirmMultiSessionPushForward || !missedWorkoutAdvisory) return
                            const targetIndices = multiPushPreview.targetSessions
                              .filter(t => !t.alreadyMarked)
                              .map(t => t.index)
                            if (targetIndices.length < 2) {
                              // Should not happen if canConfirm is true, but guard anyway
                              setMultiSessionPushForwardState('failed')
                              return
                            }
                            setMultiSessionPushForwardState('applying')
                            try {
                              const result = await onConfirmMultiSessionPushForward(missedWorkoutAdvisory, targetIndices)
                              setMultiSessionPushForwardResult(result)
                              if (result.status === 'success' || result.status === 'partial_already_applied') {
                                setMultiSessionPushForwardState('applied')
                              } else if (result.status === 'already_applied') {
                                setMultiSessionPushForwardState('already_applied')
                              } else {
                                setMultiSessionPushForwardState('failed')
                              }
                            } catch (error) {
                              setMultiSessionPushForwardResult({
                                status: 'blocked',
                                visibleSummary: 'An unexpected error occurred.',
                                evidence: [`Error: ${error instanceof Error ? error.message : 'unknown'}`],
                                reasonCode: 'unexpected_error',
                                changedSessionCount: 0,
                                targetSessionLabels: [],
                                mutationApplied: false,
                                liveWorkoutMutationAllowed: false,
                                savedProgramMutationAllowed: false,
                              })
                              setMultiSessionPushForwardState('failed')
                            }
                          }}
                          className="flex-1 h-7 text-xs bg-purple-600/80 hover:bg-purple-600 text-white"
                          data-step-24-vv6-apply="true"
                        >
                          <Layers className="w-3 h-3 mr-1" />
                          Confirm Push Forward
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setMultiSessionPushForwardState('idle')}
                          className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A]"
                          data-action="cancel-multi-session-push-forward"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Idle state — show initiate button */}
                  {multiSessionPushForwardState === 'idle' && 
                   multiPushPreview.canConfirm &&
                   !multiPushPreview.targetSessions.every(t => t.alreadyMarked) && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMultiSessionPushForwardState('confirming')}
                        className="flex-1 h-7 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                        data-action="initiate-multi-session-push-forward"
                      >
                        <Layers className="w-3 h-3 mr-1" />
                        Review Multi-Session Push
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A] hover:bg-[#1A1A2A]/50"
                        data-action="dismiss-multi-session-push-forward"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Done state — after successful application */}
                  {multiSessionPushForwardState === 'applied' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="flex-1 h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        data-action="done"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Done
                      </Button>
                    </div>
                  )}
                  
                  {/* Proof line */}
                  {multiSessionPushForwardState !== 'applied' && 
                   !multiPushPreview.targetSessions.every(t => t.alreadyMarked) && (
                    <p className="text-[10px] text-[#5A5A6A] mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                      <span>Your plan has not been changed yet. Live workout unaffected.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* [V.V4] Reduce Next Session Intensity Card
          User-confirmed mutation corridor for reduce_next_session_intensity action.
          First saved-program mutation corridor in Phase V.
          @step 24.4 */}
      {missedWorkoutAdvisory &&
       missedWorkoutAdvisory.action === 'reduce_next_session_intensity' &&
       !missedWorkoutAdvisoryDismissed && (() => {
        // Determine target session — for now use the first incomplete session (index 0)
        // In a real scenario, this would come from advisory context
        const targetSessionIndex = 0
        const intensityPreview = buildReduceIntensityPreview(program, targetSessionIndex)
        
        return (
          <div
            className="rounded-lg border bg-gradient-to-br from-[#1A1A25]/60 via-[#1A1820]/50 to-[#181A20]/60 border-[#2A2A35] overflow-hidden"
            data-step-24-vv4-reduce-intensity-confirmation="true"
            data-advisory-action="reduce_next_session_intensity"
            data-user-confirmed={reduceIntensityState === 'applied' ? 'true' : 'false'}
            data-saved-program-mutation={reduceIntensityState === 'applied' ? 'true' : 'false'}
            data-no-live-workout-mutation="true"
          >
            <div className="p-3">
              <div className="flex items-start gap-3">
                {/* Reduce intensity icon */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  missedWorkoutAdvisory.severity === 'high'
                    ? "bg-amber-500/15"
                    : "bg-blue-500/15"
                )}>
                  <TrendingDown className={cn(
                    "w-3.5 h-3.5",
                    missedWorkoutAdvisory.severity === 'high'
                      ? "text-amber-400"
                      : "text-blue-400"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-[#FAFAFA]">
                      {missedWorkoutAdvisory.title || 'Reduce Next Session Intensity'}
                    </p>
                    <span className={cn(
                      "px-1.5 py-0.5 text-[9px] rounded font-medium",
                      missedWorkoutAdvisory.severity === 'high'
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-blue-500/15 text-blue-400"
                    )}>
                      Adjust
                    </span>
                  </div>
                  
                  {/* Summary */}
                  <p className="text-[11px] text-[#9A9AAA] mb-2 leading-relaxed">
                    {missedWorkoutAdvisory.summary}
                  </p>
                  
                  {/* Applied state */}
                  {reduceIntensityState === 'applied' && reduceIntensityResult?.status === 'success' && (
                    <div 
                      className="p-2 bg-emerald-500/10 rounded border border-emerald-500/30 mb-2"
                      data-step-24-vv4-reduce-intensity-success="true"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-emerald-300">
                            Intensity Reduced
                          </p>
                          <p className="text-[10px] text-emerald-400/80 mt-0.5">
                            {reduceIntensityResult.visibleSummary}
                          </p>
                          <p className="text-[9px] text-[#6A6A7A] mt-1">
                            Saved program updated. Live workout unchanged.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Already reduced state */}
                  {(reduceIntensityState === 'already_reduced' || intensityPreview.alreadyReduced) && (
                    <div 
                      className="p-2 bg-blue-500/10 rounded border border-blue-500/30 mb-2"
                      data-step-24-vv4-already-reduced="true"
                    >
                      <div className="flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-blue-300">
                            Already Reduced
                          </p>
                          <p className="text-[10px] text-blue-400/80 mt-0.5">
                            {intensityPreview.blockedReason || 'This session has already had intensity reduced.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Failed state */}
                  {reduceIntensityState === 'failed' && (
                    <div 
                      className="p-2 bg-red-500/10 rounded border border-red-500/30 mb-2"
                      data-step-24-vv4-reduce-intensity-failed="true"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-medium text-red-300">
                            Could Not Reduce Intensity
                          </p>
                          <p className="text-[10px] text-red-400/80 mt-0.5">
                            {reduceIntensityResult?.visibleSummary || 'An error occurred.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Applying state */}
                  {reduceIntensityState === 'applying' && (
                    <div 
                      className="p-2 bg-[#2A2A35]/50 rounded border border-[#3A3A4A] mb-2"
                      data-step-24-vv4-applying="true"
                    >
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                        <p className="text-[11px] text-[#9A9AAA]">
                          Reducing intensity...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Confirmation state — show preview of what will change */}
                  {reduceIntensityState === 'confirming' && intensityPreview.canShow && !intensityPreview.alreadyReduced && (
                    <div 
                      className="p-2 bg-amber-500/10 rounded border border-amber-500/30 mb-2"
                      data-step-24-vv4-confirmation-preview="true"
                    >
                      <p className="text-[11px] font-medium text-amber-300 mb-2">
                        Confirm Intensity Reduction?
                      </p>
                      <p className="text-[10px] text-[#8A8A9A] mb-2">
                        Target: <span className="text-amber-300">{intensityPreview.targetSessionLabel}</span>
                      </p>
                      
                      {/* What will change */}
                      <div className="mb-2">
                        <p className="text-[10px] font-medium text-[#9A9AAA] mb-1">What will change:</p>
                        <ul className="text-[10px] text-[#7A7A8A] space-y-0.5 ml-2">
                          {intensityPreview.whatWillChange.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-amber-400 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* What will NOT change */}
                      <div className="mb-2">
                        <p className="text-[10px] font-medium text-[#9A9AAA] mb-1">What stays the same:</p>
                        <ul className="text-[10px] text-[#6A6A7A] space-y-0.5 ml-2">
                          {intensityPreview.whatWillNotChange.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Confirm/cancel buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!onConfirmReduceIntensity || !missedWorkoutAdvisory) return
                            setReduceIntensityState('applying')
                            try {
                              const result = await onConfirmReduceIntensity(missedWorkoutAdvisory, targetSessionIndex)
                              setReduceIntensityResult(result)
                              if (result.status === 'success') {
                                setReduceIntensityState('applied')
                              } else if (result.status === 'already_reduced') {
                                setReduceIntensityState('already_reduced')
                              } else {
                                setReduceIntensityState('failed')
                              }
                            } catch (error) {
                              setReduceIntensityResult({
                                status: 'blocked',
                                visibleSummary: 'An unexpected error occurred.',
                                evidence: [`Error: ${error instanceof Error ? error.message : 'unknown'}`],
                                reasonCode: 'unexpected_error',
                              })
                              setReduceIntensityState('failed')
                            }
                          }}
                          className="flex-1 h-7 text-xs bg-amber-600/80 hover:bg-amber-600 text-white"
                          data-step-24-vv4-reduce-intensity-apply="true"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Confirm Reduction
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReduceIntensityState('idle')}
                          className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A]"
                          data-action="cancel-reduce-intensity"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Idle state — show initiate button */}
                  {reduceIntensityState === 'idle' && 
                   !intensityPreview.alreadyReduced && 
                   intensityPreview.canShow &&
                   onConfirmReduceIntensity && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReduceIntensityState('confirming')}
                        className="flex-1 h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                        data-action="initiate-reduce-intensity"
                      >
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Review & Reduce Intensity
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A] hover:bg-[#1A1A2A]/50"
                        data-action="dismiss-reduce-intensity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Idle state without callback — advisory only */}
                  {reduceIntensityState === 'idle' && 
                   !intensityPreview.alreadyReduced && 
                   intensityPreview.canShow &&
                   !onConfirmReduceIntensity && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="flex-1 h-7 text-xs border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#1A1A2A] hover:text-white"
                        data-action="got-it"
                        data-no-mutation="true"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Got It
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A] hover:bg-[#1A1A2A]/50"
                        data-action="dismiss"
                        data-no-mutation="true"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Done state — after successful application */}
                  {reduceIntensityState === 'applied' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="flex-1 h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        data-action="done"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Done
                      </Button>
                    </div>
                  )}
                  
                  {/* Proof line — shows plan status */}
                  {reduceIntensityState !== 'applied' && !intensityPreview.alreadyReduced && (
                    <p className="text-[10px] text-[#5A5A6A] mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                      <span>Your plan has not been changed yet.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* [STEP 23.2/23.3] Missed-Workout Recomposition Advisory Card (generic)
          Displays advisory when there's actionable guidance about schedule.
          Advisory only — no mutation. No saved-program rewrite.
          [STEP 23.3] Adds user-controlled action buttons — non-mutating.
          Note: protect_recovery_spacing uses dedicated V.V3 preview above.
          Note: reduce_next_session_intensity uses dedicated V.V4 corridor above. */}
      {missedWorkoutAdvisory && 
       hasActionableMissedWorkoutAdvisory(missedWorkoutAdvisory) && 
       missedWorkoutAdvisory.action !== 'protect_recovery_spacing' &&
       missedWorkoutAdvisory.action !== 'reduce_next_session_intensity' &&
       !missedWorkoutAdvisoryDismissed && (() => {
        const displayInfo = getMissedWorkoutAdvisoryDisplayInfo(missedWorkoutAdvisory)
        return (
          <div className="rounded-lg border bg-gradient-to-r from-[#1A1A25]/50 to-[#1A1A20]/50 border-[#2A2A35] overflow-hidden">
            <div className="p-3">
              <div className="flex items-start gap-3">
                {/* Icon based on severity */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  missedWorkoutAdvisory.severity === 'high' 
                    ? "bg-amber-500/15"
                    : missedWorkoutAdvisory.severity === 'caution'
                    ? "bg-blue-500/15"
                    : "bg-[#2A2A35]"
                )}>
                  <Info className={cn(
                    "w-3.5 h-3.5",
                    missedWorkoutAdvisory.severity === 'high'
                      ? "text-amber-400/80"
                      : missedWorkoutAdvisory.severity === 'caution'
                      ? "text-blue-400/80"
                      : "text-[#6A6A7A]"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Badge + Headline */}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      missedWorkoutAdvisory.severity === 'high'
                        ? "bg-amber-500/20 text-amber-400"
                        : missedWorkoutAdvisory.severity === 'caution'
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-[#2A2A35] text-[#7A7A8A]"
                    )}>
                      {displayInfo.badgeLabel}
                    </span>
                    <p className="text-sm font-medium text-[#B5B5C5]">
                      {displayInfo.title}
                    </p>
                  </div>
                  {/* Summary */}
                  <p className="text-xs text-[#8A8A9A] mt-1 leading-relaxed">
                    {displayInfo.description}
                  </p>
                  
                  {/* [STEP 23.3] Expandable reasoning section */}
                  {missedWorkoutAdvisory.reasoning.length > 0 && (
                    <details className="mt-2 group">
                      <summary className="flex items-center gap-1 cursor-pointer text-[11px] text-[#6A6A8A] hover:text-[#8A8AAA] transition-colors select-none">
                        <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                        <span>View reasoning ({missedWorkoutAdvisory.reasoning.length} points)</span>
                      </summary>
                      <div className="mt-1.5 ml-4 space-y-0.5 border-l border-[#2A2A35] pl-2">
                        {missedWorkoutAdvisory.reasoning.map((reason, idx) => (
                          <p key={idx} className="text-[11px] text-[#6A6A7A]">
                            {reason}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                  
                  {/* User-facing recommendation */}
                  {missedWorkoutAdvisory.userFacingRecommendation && (
                    <p className="text-xs text-[#9A9AAA] mt-2 italic">
                      {missedWorkoutAdvisory.userFacingRecommendation}
                    </p>
                  )}
                  
                  {/* [STEP 23.3/23.4] Action buttons — user-controlled */}
                  <div className="flex flex-col gap-2 mt-3">
                    {/* [STEP 23.4] "I can't train today" button */}
                    {missedWorkoutAdvisory.action !== 'continue_as_planned' && 
                     missedWorkoutAdvisory.action !== 'insufficient_context' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setShowCantTrainModal(true)}
                        className="h-8 text-xs bg-[#E63946]/10 border border-[#E63946]/30 text-[#E63946] hover:bg-[#E63946]/20"
                        data-action="cant-train-today"
                        data-step-23-4="true"
                      >
                        <Calendar className="w-3 h-3 mr-1.5" />
                        I Can&apos;t Train Today
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="flex-1 h-7 text-xs border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#1A1A2A] hover:text-white"
                        data-action="keep-plan"
                        data-no-mutation="true"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Keep Plan
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMissedWorkoutAdvisoryDismissed(true)}
                        className="h-7 text-xs text-[#6A6A7A] hover:text-[#8A8A9A] hover:bg-[#1A1A2A]/50"
                        data-action="dismiss"
                        data-no-mutation="true"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Advisory-only proof line */}
                  <p className="text-[10px] text-[#5A5A6A] mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                    <span>{displayInfo.secondaryNote}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
      
      {/* [P2E] Condensed structure — Day cards now appear immediately after hub */}
      <div className="space-y-3">
        
        {/* [WEEK-PROGRESSION-TRUTH] Render scaled sessions with week-appropriate dosage */}
        {scaledSessions.length > 0 ? (
          scaledSessions.map((session, sessionIndex) => {
            // ================================================================
            // [FINAL-DAY-CARD-OWNERSHIP-LOCK]
            //
            // The day-card visible header now consumes ONE owner: an
            // enriched `cardSurface` derived from `SessionCardSurface`. The
            // previously-parallel `intelligenceContract.coachingExplanation`,
            // `intelligenceContract.dayRationales` and raw
            // `getSessionSurfaceSignals(session)` reads are folded into
            // surface fields here, once per session, and the JSX below
            // never references those parallel paths again.
            //
            // The previous in-render `[FUNNEL-AUDIT-S3S4]` console probe
            // that read raw `session.exercises` / `session.styleMetadata`
            // on every render is removed (debug leakage in the visible
            // card body render path). The probes still exist elsewhere
            // for QA and the underlying truth was never depending on
            // those logs.
            // ================================================================
            const baseSurface = sessionCardSurfaces[sessionIndex]

            // Enrich the surface ONCE per session. All visible-claim
            // overlap collapses here so the JSX cannot accidentally
            // double-source a header line.
            const dayRationale = intelligenceContract?.dayRationales?.find(
              r => r.dayNumber === session.dayNumber
            )
            const compactCoaching = intelligenceContract?.coachingExplanation
              ? getCompactSessionExplanation(intelligenceContract.coachingExplanation, session.dayNumber)
              : null
            const surfaceSignals = getSessionSurfaceSignals(session as Parameters<typeof getSessionSurfaceSignals>[0])

            const cardSurface: SessionCardSurface | undefined = baseSurface
              ? {
                  ...baseSurface,
                  // [WEEKLY-SESSION-ROLE-CONTRACT — WHY-LINE PRIMACY]
                  // When the per-day weekly role provides a rationale, it is
                  // the strongest authoritative why source for THIS specific
                  // day. Compact coaching purpose tends to be program-level
                  // and reads identically across all six days — letting it
                  // win the why-line slot was the dominant dilution path.
                  // Order: weeklyRoleRationale > compactCoaching.purpose >
                  // baseSurface.coachingPurpose > null.
                  coachingPurpose:
                    baseSurface.weeklyRoleRationale ??
                    compactCoaching?.purpose ??
                    baseSurface.coachingPurpose ??
                    null,
                  fallbackWeeklyRole: dayRationale?.weeklyRole ?? baseSurface.fallbackWeeklyRole ?? null,
                  fallbackRationale: dayRationale?.rationale ?? baseSurface.fallbackRationale ?? null,
                  microSignals: surfaceSignals.microSignals.length > 0
                    ? surfaceSignals.microSignals
                    : baseSurface.microSignals ?? [],
                }
              : undefined

            const hasAuthoritativeSurface = cardSurface && cardSurface.source === 'authoritative'
            const hasAnyChips = !!cardSurface && (
              cardSurface.primaryIntentChips.length > 0 ||
              cardSurface.protectionSignals.length > 0 ||
              cardSurface.methodSignals.length > 0
            )
            const headerHasContent = !!cardSurface && (
              !!cardSurface.sessionHeadline ||
              hasAnyChips ||
              !!cardSurface.coachingPurpose ||
              !!cardSurface.evidenceLabel ||
              !!cardSurface.fallbackWeeklyRole ||
              !!cardSurface.fallbackRationale ||
              (cardSurface.microSignals?.length ?? 0) > 0
            )

            // [BUILD GREEN GATE / SESSION IDENTITY] React-key fragments derived
            // through the typed resolver. ScaledSession does not own `name` —
            // the resolver prefers `focusLabel`/`focus`/`dayLabel` and only
            // reads legacy `name` through a guarded `unknown` path. The key
            // remains stable across day reorders and week changes.
            const sessionKeyParts = resolveSessionKeyParts(session)

            return (
              <div key={`${program.id}-${sessionKeyParts.dayPart}-${sessionKeyParts.identityPart}-week${currentWeekNumber}`}>
                {/* [FINAL-DAY-CARD-OWNERSHIP-LOCK] Visible header reads ONLY
                    `cardSurface.*`. Border / badge styling derive from the
                    same surface; nothing here re-reads `session` or
                    `intelligenceContract` for visible truth. */}
                {headerHasContent && cardSurface ? (
                  <div className={`mb-2 px-2 py-1.5 bg-[#1A1A1A]/40 rounded-md border-l-2 ${
                    cardSurface.protectionSignals.length
                      ? 'border-[#E63946]/40'
                      : hasAuthoritativeSurface
                        ? 'border-[#E63946]/30'
                        : 'border-[#E63946]/20'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                        cardSurface.protectionSignals.length
                          ? 'bg-[#E63946]/15'
                          : 'bg-[#E63946]/10'
                      }`}>
                        <span className={`text-[8px] font-bold ${
                          cardSurface.protectionSignals.length
                            ? 'text-[#E63946]/90'
                            : 'text-[#E63946]/70'
                        }`}>{session.dayNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* [DOMINANT-CARD-OWNERSHIP-LOCK]
                            The role headline + intensity·progression·breadth
                            supporting line + per-day rationale are now OWNED
                            by the dominant <AdaptiveSessionCard /> below
                            (which receives the same `cardSurface` prop).
                            Rendering them here as well would violate the
                            "NO COSMETIC DOUBLING" rule — same statement in
                            two places with slightly different styling. So we
                            ONLY render the headline here as a tiny upstream
                            tag for legacy sessions where `weeklyRoleLabel`
                            is absent, to preserve the prior wrapper strip
                            behavior for those. When weeklyRoleLabel IS
                            present, the dominant card owns the identity
                            and this slot stays silent. */}
                        {!cardSurface.weeklyRoleLabel && cardSurface.sessionHeadline ? (
                          <p className="text-[11px] text-[#9A9A9A] font-medium leading-snug">
                            {cardSurface.sessionHeadline}
                          </p>
                        ) : !cardSurface.weeklyRoleLabel && cardSurface.fallbackWeeklyRole ? (
                          <p className="text-[11px] text-[#9A9A9A] font-medium leading-snug">
                            {cardSurface.fallbackWeeklyRole}
                          </p>
                        ) : null}

                        {/* B. Truth chips: primary intent + protection + method
                            (surface-owned only; method labels were already
                            materiality-gated upstream). */}
                        {hasAnyChips && (
                          <div className="flex flex-wrap gap-x-1.5 gap-y-1 mt-1">
                            {cardSurface.primaryIntentChips.map((chip, i) => (
                              <span
                                key={`intent-${i}`}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[#E63946]/8 text-[#C8C8C8] font-medium"
                              >
                                {chip}
                              </span>
                            ))}
                            {cardSurface.protectionSignals.map((chip, i) => (
                              <span
                                key={`protect-${i}`}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80 font-medium"
                              >
                                {chip}
                              </span>
                            ))}
                            {cardSurface.methodSignals.map((chip, i) => (
                              <span
                                key={`method-${i}`}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400/70 font-medium"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* C. Coaching purpose (surface-owned). Falls back to
                            evidence label, then to last-resort rationale.
                            At most ONE of these renders.
                            [DOMINANT-CARD-OWNERSHIP-LOCK] Suppressed entirely
                            when `weeklyRoleRationale` is present, because the
                            dominant <AdaptiveSessionCard /> below now renders
                            the per-day rationale itself — duplicating it here
                            would violate the "NO COSMETIC DOUBLING" rule. */}
                        {cardSurface.weeklyRoleRationale ? null : cardSurface.coachingPurpose ? (
                          <p className="text-[10px] text-[#8A8A8A] mt-1 leading-relaxed">
                            {cardSurface.coachingPurpose}
                          </p>
                        ) : cardSurface.evidenceLabel ? (
                          <p className="text-[10px] text-[#6A6A6A] mt-1 leading-relaxed">
                            {cardSurface.evidenceLabel}
                          </p>
                        ) : cardSurface.fallbackRationale ? (
                          <p className="text-[10px] text-[#6A6A6A] mt-1 leading-relaxed">
                            {cardSurface.fallbackRationale}
                          </p>
                        ) : null}

                        {/* D. Micro-signals (surface-owned). Suppressed when
                            chips already render to avoid visual repetition.
                            [MATERIAL-COMPOSITION-TRUTH-LOCK] Also suppressed
                            when the dominant card is rendering material
                            adaptations — those chips are concrete programming
                            decisions ("Sets reduced", "RPE capped"), while
                            microSignals are generic prose ("Volume adjusted")
                            describing the same source flags. NO COSMETIC
                            DOUBLING — the dominant card owns this slot. */}
                        {!hasAnyChips &&
                          (cardSurface.materialAdaptations?.length ?? 0) === 0 &&
                          (cardSurface.microSignals?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                              {cardSurface.microSignals!.map((signal, i) => (
                                <span key={i} className="text-[9px] text-[#E63946]/70 font-medium">
                                  {signal}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ) : null}
                {/* [MASTER-8B.7.1] Mutation Plan Marker — shows when a confirmed plan targets this day */}
                {mutationPlanBundle?.plansByTargetDay?.[session.dayNumber] && (
                  <div className="mb-2 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-cyan-400 truncate">
                          Mutation plan confirmed
                        </p>
                        <p className="text-[9px] text-[#6A6A7A]">
                          {mutationPlanBundle.plansByTargetDay[session.dayNumber]?.sourceCandidateHeadline} — marker only, workout structure unchanged
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* [Prompt 80.1] Program Card Adaptation Marker Preview — read-only preview indicator */}
                {(() => {
                  // [Prompt 80.1] Match preview items to this session by targetDayNumber
                  const matchedPreviewItem = programCardAdaptationMarkerPreviewItems.find(item => {
                    // Match by day number - this is the stable identifier
                    if (item.targetDayNumber !== undefined && session.dayNumber === item.targetDayNumber) {
                      return true
                    }
                    return false
                  })
                  
                  // Only show on matched future sessions
                  if (!matchedPreviewItem) return null
                  
                  return (
                    <div 
                      className="mb-3 p-3 rounded-lg bg-emerald-500/10 border-2 border-emerald-500/40"
                      data-program-card-adaptation-marker-preview="true"
                      data-no-start-workout-bridge="true"
                      data-no-live-workout-bridge="true"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Activity className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-2">
                            <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                              Adaptive preview
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-300">
                              Program Card proof
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-300">
                              read-only
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              No workout change
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              Start Workout unchanged
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-300 font-medium mb-1">
                            {matchedPreviewItem.markerLabel}
                          </p>
                          <p className="text-[9px] text-[#8A8A9A] mb-1">
                            {matchedPreviewItem.markerPreviewText}
                          </p>
                          <p className="text-[9px] text-[#6A6A7A]">
                            {matchedPreviewItem.whyShown}
                          </p>
                          <p className="text-[8px] text-zinc-500 mt-2 border-t border-zinc-700/30 pt-2">
                            Program Card marker only — Start Workout and Live Workout still use the original session.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
<AdaptiveSessionCard
  session={session}
  programId={program.id}
  primaryGoal={program.primaryGoal}
  secondaryGoal={program.secondaryGoal}
  defaultExpanded={sessionIndex === 0}
  onExerciseReplace={
  onExerciseReplace
  ? (exerciseId) => onExerciseReplace(session.dayNumber, exerciseId)
  : undefined
  }
  // [COACHING-EXPLANATION-CONTRACT] Pass authoritative coaching explanation surface
  coachingExplanation={intelligenceContract?.coachingExplanation || null}
  // [DOCTRINE-STRENGTHENING] Pass week character for visible differentiation badges
  weekCharacter={session.weekCharacter}
  // [DOMINANT-CARD-OWNERSHIP-LOCK] Pass the SAME authoritative SessionCardSurface
  // that the wrapper strip currently consumes. Without this prop, the dominant
  // visible card silently re-derives identity from raw `session.focusLabel` /
  // `session.dayLabel` while the strengthened weekly-role truth lives only in
  // the small wrapper strip above it. Single source of truth for visible day
  // identity is now this `cardSurface`.
  cardSurface={cardSurface}
  // [PREVIEW-VISIBLE-PROBE] Pass probe flag
  showProbe={showProbe}
  // [ALWAYS-VISIBLE-PROBE] Pass force probe flag
  forceProbe={forceProbe}
  // [WEEK-AUTHORITY-HANDOFF] Pass the AUTHORITATIVE selected week so Start
  // Workout carries the same week as the dosage rendered on this card.
  currentWeekNumber={currentWeekNumber}
  // [PHASE 3C] Pass the program-level profile snapshot + stamp version so the
  // card's Doctrine Decision panel can (a) bridge profile-aware attribution
  // for legacy programs that pre-date the wrapper stamp and (b) honestly tag
  // saved programs whose stamp version is older than the current engine.
  programProfileSnapshot={
    (program as unknown as { profileSnapshot?: unknown }).profileSnapshot as
      | Parameters<typeof AdaptiveSessionCard>[0]['programProfileSnapshot']
      | undefined ?? null
  }
  methodDecisionVersion={
    ((program as unknown as { doctrineIntegration?: { methodDecisionVersion?: string | null } })
      .doctrineIntegration?.methodDecisionVersion) ?? null
  }
  // [PHASE 4F — DISPLAY PROJECTION OWNERSHIP LOCK] Per-session projection slice.
  // Looked up by `dayNumber` (not array index) so a filtered/sliced session
  // array on the page level cannot mismatch this card. When the projection is
  // null (older callers / standalone usage) or has no matching slice, the
  // card simply renders no Phase 4F line — existing behavior unchanged.
  displayProjectionSession={
    programDisplayProjection
      ? programDisplayProjection.sessions.find(
          ps => ps.dayNumber === ((session as unknown as { dayNumber?: number }).dayNumber ?? -1)
        ) ?? null
      : null
  }
  // [AB18] Session training style coaching for live workout handoff.
  // Looked up by dayNumber from the per-day coaching summary. When present,
  // the card stamps it into AB10LaunchProof so live workout can display parity.
  sessionTrainingStyleCoaching={(() => {
    if (!perDayCoachingSummary) return null
    const sessionDayNumber = (session as unknown as { dayNumber?: number }).dayNumber
    const dayCoaching = perDayCoachingSummary.days.find(d => d.dayNumber === sessionDayNumber)
    if (!dayCoaching?.trainingStyleCoaching) return null
    const tsc = dayCoaching.trainingStyleCoaching
    // Convert SessionTrainingStyleCoaching to AB18SessionCoachingHandoff
    return {
      styleMode: tsc.styleMode,
      coachingLine: tsc.coachingLine,
      activeOnThisSession: tsc.activeOnThisSession,
      favoredMethodsApplied: tsc.favoredMethodsApplied,
      methodsLimitedForProtection: tsc.methodsLimitedForProtection,
    } satisfies AB18SessionCoachingHandoff
  })()}
  />
              </div>
            )
          })
        ) : (
          <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6 text-center">
            <p className="text-sm text-[#6A6A6A]">No training sessions available</p>
          </Card>
        )}
      </div>

      {/* [PPX-7] Why This Plan Fits - Premium evidence-driven explanation sheet */}
      <Dialog open={showWhySheet} onOpenChange={setShowWhySheet}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF] flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#E63946]/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#E63946]" />
              </div>
              {/* [PPX-7] User-friendly title based on confidence */}
              {intelligenceContract?.premiumConfidence?.level === 'high' 
                ? 'Why This Plan Is Optimal'
                : 'Why This Plan Fits You'}
            </DialogTitle>
            <DialogDescription className="text-[#A4ACB8] pt-1">
              How your goals, schedule, and progress shaped this plan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {/* [COACHING-EXPLANATION-CONTRACT] PRIMARY: Coach-style program fit explanation */}
            {intelligenceContract?.coachingExplanation?.program && (
              <div className="p-4 bg-gradient-to-br from-[#E63946]/8 to-[#0F1115] rounded-lg border border-[#E63946]/25">
                <p className="text-sm text-[#F5F5F5] font-medium leading-relaxed mb-3">
                  {intelligenceContract.coachingExplanation.program.headline}
                </p>
                
                {/* Primary coaching explanations */}
                <ul className="space-y-1.5 mb-3">
                  {/* Goal fit explanation - the main "why this fits you" */}
                  {intelligenceContract.coachingExplanation.program.goalFitExplanation && (
                    <li className="text-xs text-[#A5A5A5] flex items-start gap-2">
                      <span className="text-[#E63946] mt-0.5 shrink-0">·</span>
                      {intelligenceContract.coachingExplanation.program.goalFitExplanation}
                    </li>
                  )}
                  {/* Week focus insight */}
                  {intelligenceContract.coachingExplanation.program.weekFocusInsight && (
                    <li className="text-xs text-[#A5A5A5] flex items-start gap-2">
                      <span className="text-[#E63946] mt-0.5 shrink-0">·</span>
                      {intelligenceContract.coachingExplanation.program.weekFocusInsight}
                    </li>
                  )}
                  {/* Structure fit explanation */}
                  {intelligenceContract.coachingExplanation.program.structureFitExplanation && (
                    <li className="text-xs text-[#A5A5A5] flex items-start gap-2">
                      <span className="text-[#E63946] mt-0.5 shrink-0">·</span>
                      {intelligenceContract.coachingExplanation.program.structureFitExplanation}
                    </li>
                  )}
                  {/* First tradeoff if meaningful */}
                  {intelligenceContract.coachingExplanation.program.tradeoffExplanations?.[0] && (
                    <li className="text-xs text-[#8A8A8A] flex items-start gap-2">
                      <span className="text-amber-500/70 mt-0.5 shrink-0">·</span>
                      {intelligenceContract.coachingExplanation.program.tradeoffExplanations[0]}
                    </li>
                  )}
                </ul>
                
                {/* Schedule fit */}
                {intelligenceContract.coachingExplanation.program.scheduleFitExplanation && (
                  <p className="text-xs text-[#8A8A8A] border-l-2 border-[#E63946]/30 pl-2">
                    {intelligenceContract.coachingExplanation.program.scheduleFitExplanation}
                  </p>
                )}
                
                {/* Progression insight */}
                {intelligenceContract.coachingExplanation.program.progressionInsight && (
                  <p className="text-[11px] text-[#6A6A6A] italic mt-2">
                    {intelligenceContract.coachingExplanation.program.progressionInsight}
                  </p>
                )}
              </div>
            )}
            
            {/* [DECISION-EVIDENCE] Strategic Summary - Core decision architecture (fallback if no coaching explanation) */}
            {!intelligenceContract?.coachingExplanation?.program && intelligenceContract?.strategicSummary && (
              <div className="p-3 bg-gradient-to-br from-[#E63946]/5 to-[#0F1115] rounded-lg border border-[#E63946]/20">
                <p className="text-sm text-[#E6E9EF] font-medium leading-relaxed">
                  {intelligenceContract.strategicSummary.headline}
                </p>
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-[#A4ACB8]">
                    <span className="text-[#E63946]">Architecture:</span> {intelligenceContract.strategicSummary.architectureLabel}
                  </p>
                  <p className="text-xs text-[#8A8A8A]">
                    {intelligenceContract.strategicSummary.fitReason}
                  </p>
                </div>
              </div>
            )}
            
            {/* [DECISION-EVIDENCE + PPX-7] Weekly Structure - Why this frequency/structure */}
            {intelligenceContract?.weeklyDecisionLogic && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Weekly Structure</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-[#C8C8C8]">
                    {intelligenceContract.weeklyDecisionLogic.structureIdentity}
                  </p>
                  <p className="text-xs text-[#8A8A8A]">
                    {intelligenceContract.weeklyDecisionLogic.frequencyReason}
                  </p>
                  {intelligenceContract.weeklyDecisionLogic.architecturalDecisions.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {intelligenceContract.weeklyDecisionLogic.architecturalDecisions.slice(0, 3).map((decision, i) => (
                        <li key={i} className="text-[11px] text-[#6A6A6A] flex items-start gap-1.5">
                          <span className="text-[#E63946] mt-0.5">��</span>
                          {decision}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            
            {/* [STEP 25.9] Daily Training Variation - Day-by-day method/role proof */}
            {perDayCoachingSummary && perDayCoachingSummary.days.length > 0 && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Daily Training Variation</h4>
                </div>
                
                {/* Week strategy intro */}
                <p className="text-xs text-[#A4ACB8] mb-3">
                  {perDayCoachingSummary.weekStrategy}
                </p>
                
                {/* Day-by-day summary */}
                <div className="space-y-2">
                  {perDayCoachingSummary.days.map((day) => (
                    <div 
                      key={day.dayNumber} 
                      className="pl-2 border-l-2 border-[#E63946]/30"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#E6E9EF]">
                          Day {day.dayNumber}
                        </span>
                        {day.roleLabel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2B313A] text-[#A4ACB8]">
                            {day.roleLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                        {day.strategy}
                      </p>
                      
                      {/* Methods summary */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {day.methodsUsed.map((m) => (
                          <span 
                            key={m.methodId} 
                            className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          >
                            {m.label}
                          </span>
                        ))}
                        {day.methodsNotUsed.filter(m => m.isUserPreference).slice(0, 2).map((m) => (
                          <span 
                            key={m.methodId} 
                            className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-500/70 border border-amber-500/20"
                            title={m.reason}
                          >
                            {m.label} (held)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Totals footer */}
                <div className="mt-3 pt-2 border-t border-[#2B313A]/60 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#6B7280]">
                  <span>
                    <span className="text-emerald-400">{perDayCoachingSummary.totals.methodsUsedAcrossWeek.length}</span> methods active
                  </span>
                  <span>
                    <span className="text-[#A4ACB8]">{perDayCoachingSummary.totals.daysWithAnyMethod}</span>/{perDayCoachingSummary.days.length} days with overlays
                  </span>
                  {perDayCoachingSummary.totals.preferredNeverHonored.length > 0 && (
                    <span>
                      <span className="text-amber-400">{perDayCoachingSummary.totals.preferredNeverHonored.length}</span> preferred held back
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* [PPX-7] What We Protect - Training principles we never compromise */}
            {intelligenceContract?.protectedConstraints && intelligenceContract.protectedConstraints.length > 0 && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">What We Protect</h4>
                </div>
                <ul className="space-y-1.5">
                  {intelligenceContract.protectedConstraints.slice(0, 4).map((constraint, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="text-green-500/80 shrink-0 mt-0.5">✓</span>
                      <div>
                        <span className="text-[#A4ACB8]">{constraint.label}</span>
                        {constraint.reason && (
                          <span className="text-[#5A5A5A]"> - {constraint.reason}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* [PPX-7] What We Balanced - Tradeoffs we made for your goals */}
            {intelligenceContract?.tradeoffs && intelligenceContract.tradeoffs.length > 0 && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">What We Balanced</h4>
                </div>
                <ul className="space-y-2">
                  {intelligenceContract.tradeoffs.slice(0, 3).map((tradeoff, i) => (
                    <li key={i} className="text-xs">
                      <div className="flex items-center gap-1.5 text-[#A4ACB8]">
                        <span className="text-green-500/80">+</span>
                        <span>{tradeoff.prioritized}</span>
                        <span className="text-[#3A3A3A]">/</span>
                        <span className="text-amber-500/60">-</span>
                        <span className="text-[#6A6A6A]">{tradeoff.limited}</span>
                      </div>
                      {tradeoff.reason && (
                        <p className="mt-0.5 ml-3.5 text-[10px] text-[#5A5A5A]">
                          {tradeoff.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Secondary Skill Integration */}
            {intelligenceContract?.secondarySkillHandling && 
             intelligenceContract.secondarySkillHandling.strategy && 
             intelligenceContract.secondarySkillHandling.strategy !== 'none' && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Secondary Integration</h4>
                </div>
                <p className="text-xs text-[#8A8A8A] leading-relaxed">
                  {intelligenceContract.secondarySkillHandling.strategy.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} approach
                  {intelligenceContract.secondarySkillHandling.skills?.length > 0 && (
                    <span className="text-[#A4ACB8]"> for {intelligenceContract.secondarySkillHandling.skills.map(s => s.replace(/_/g, ' ')).join(', ')}</span>
                  )}
                </p>
              </div>
            )}
            
            {/* Decision Inputs - What truth the engine used */}
            {intelligenceContract?.decisionInputs && intelligenceContract.decisionInputs.length > 0 && (
              <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-[#E63946]" />
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Decision Inputs</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {intelligenceContract.decisionInputs.slice(0, 8).map((input, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[10px] text-[#5A5A5A] uppercase tracking-wide">{input.label}</span>
                      <span className="text-xs text-[#A4ACB8]">{input.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* [DECISION-EVIDENCE] Premium Confidence Block - Evidence-backed */}
            {intelligenceContract?.premiumConfidence && (
              <div className="p-3 bg-[#0F1115]/70 rounded-lg border border-[#2B313A]/50">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${
                    intelligenceContract.premiumConfidence.level === 'high' ? 'text-green-400' :
                    intelligenceContract.premiumConfidence.level === 'moderate' ? 'text-amber-400' :
                    'text-[#8A8A8A]'
                  }`}>
                    {intelligenceContract.premiumConfidence.label}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    intelligenceContract.premiumConfidence.level === 'high' ? 'bg-green-500' :
                    intelligenceContract.premiumConfidence.level === 'moderate' ? 'bg-amber-500' :
                    'bg-[#5A5A5A]'
                  }`} />
                </div>
                <p className="text-[11px] text-[#6A6A6A] mb-2">
                  {intelligenceContract.premiumConfidence.sublabel}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {intelligenceContract.premiumConfidence.strongSignals.map((signal, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400/80 rounded border border-green-500/20">
                      {signal}
                    </span>
                  ))}
                  {intelligenceContract.premiumConfidence.limitedSignals.map((signal, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#2A2A2A] text-[#6A6A6A] rounded border border-[#333]">
                      {signal} (building)
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-[#5A5A5A]">
                  {intelligenceContract.premiumConfidence.sourceCoverage}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWhySheet(false)}
              className="w-full border-[#3A3A3A] text-[#A4ACB8] hover:bg-[#2A2A2A]"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {/* [TASK 4] Option 1: Regenerate - true regeneration from current profile */}
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
                  <h4 className="text-sm font-medium text-[#E6E9EF]">Rebuild From Current Settings</h4>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Immediately rebuild your program using your current profile. 
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

      {/* [STEP 23.4] "I Can't Train Today" Confirmation Modal
          Shows advisory reasoning and preview before any schedule change.
          Mutation is confirm-gated — nothing changes until user confirms. */}
      <Dialog open={showCantTrainModal} onOpenChange={setShowCantTrainModal}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E63946]" />
              Can&apos;t Train Today?
            </DialogTitle>
            <DialogDescription className="text-[#A4ACB8] pt-2">
              Review what the system recommends based on your current schedule.
            </DialogDescription>
          </DialogHeader>
          
          {missedWorkoutAdvisory && (
            <div className="space-y-4 py-2">
              {/* Advisory summary */}
              <div className="p-3 bg-[#151A20] rounded-lg border border-[#2A2A35]">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    missedWorkoutAdvisory.severity === 'high'
                      ? "bg-amber-500/20 text-amber-400"
                      : missedWorkoutAdvisory.severity === 'caution'
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-[#2A2A35] text-[#7A7A8A]"
                  )}>
                    {getMissedWorkoutAdvisoryDisplayInfo(missedWorkoutAdvisory).badgeLabel}
                  </span>
                  <span className="text-sm font-medium text-[#B5B5C5]">
                    {missedWorkoutAdvisory.title}
                  </span>
                </div>
                <p className="text-xs text-[#8A8A9A] leading-relaxed">
                  {missedWorkoutAdvisory.summary}
                </p>
              </div>
              
              {/* Recommendation */}
              {missedWorkoutAdvisory.userFacingRecommendation && (
                <div className="p-3 bg-[#E63946]/5 rounded-lg border border-[#E63946]/20">
                  <p className="text-xs font-medium text-[#E63946] mb-1">Recommendation</p>
                  <p className="text-xs text-[#B5B5C5]">
                    {missedWorkoutAdvisory.userFacingRecommendation}
                  </p>
                </div>
              )}
              
              {/* Reasoning (collapsible) */}
              {missedWorkoutAdvisory.reasoning.length > 0 && (
                <details className="group">
                  <summary className="flex items-center gap-1 cursor-pointer text-[11px] text-[#6A6A8A] hover:text-[#8A8AAA] select-none">
                    <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                    <span>View full reasoning ({missedWorkoutAdvisory.reasoning.length} points)</span>
                  </summary>
                  <div className="mt-2 ml-4 space-y-1 border-l border-[#2A2A35] pl-2">
                    {missedWorkoutAdvisory.reasoning.map((reason, idx) => (
                      <p key={idx} className="text-[11px] text-[#6A6A7A]">
                        {reason}
                      </p>
                    ))}
                  </div>
                </details>
              )}
              
              {/* [STEP 23.5/23.6] Final action boundary — conditional based on callback availability */}
              {/* Applied state */}
              {pushForwardState === 'applied' && pushForwardResult?.status === 'success' && (
                <div 
                  className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30"
                  data-step-23-6-applied="true"
                  data-missed-workout-update-applied="true"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-emerald-300">
                        Plan updated
                      </p>
                      <p className="text-[11px] text-emerald-400/80 mt-1">
                        {pushForwardResult.visibleSummary}
                      </p>
                      <p className="text-[10px] text-[#6A6A7A] mt-2">
                        Saved program updated. Live workout unchanged.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Failed/blocked state */}
              {(pushForwardState === 'failed' || (pushForwardResult && pushForwardResult.status !== 'success' && pushForwardState !== 'idle')) && (
                <div 
                  className="p-3 bg-red-500/10 rounded-lg border border-red-500/30"
                  data-step-23-6-failed="true"
                  data-missed-workout-update-failed="true"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400/70 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-300">
                        Plan was not changed
                      </p>
                      <p className="text-[11px] text-red-400/70 mt-1">
                        {pushForwardResult?.visibleSummary || 'An error occurred.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Confirmation step — only for push_session_forward with callback */}
              {missedWorkoutAdvisory.action === 'push_session_forward' && 
               onConfirmMissedWorkoutPushForward && 
               pushForwardState === 'idle' && (
                <div 
                  className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30"
                  data-step-23-6-push-forward-enabled="true"
                  data-advisory-action="push_session_forward"
                >
                  <p className="text-xs font-medium text-blue-300 mb-2">
                    Push This Workout Forward
                  </p>
                  <p className="text-[11px] text-[#8A8A9A] mb-3">
                    This will move the missed workout one slot forward in your schedule. Your saved program will be updated. No live workout changes.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setPushForwardState('confirming')}
                    className="w-full h-8 text-xs bg-blue-600/80 hover:bg-blue-600 text-white"
                    data-action="initiate-push-forward"
                  >
                    Review & Confirm
                  </Button>
                </div>
              )}
              
              {/* Second confirmation step */}
              {pushForwardState === 'confirming' && (
                <div 
                  className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30"
                  data-step-23-6-confirmation="true"
                  data-no-live-workout-mutation="true"
                >
                  <p className="text-xs font-medium text-amber-300 mb-2">
                    Confirm Schedule Adjustment?
                  </p>
                  <p className="text-[11px] text-[#8A8A9A] mb-3">
                    This will move the missed workout one position forward using the saved-program update path. No live workout will be changed. No automatic changes happen unless you confirm.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!onConfirmMissedWorkoutPushForward || !missedWorkoutAdvisory) return
                        setPushForwardState('applying')
                        try {
                          // Use index 0 as default — the first session is the "missed" one in this context
                          const result = await onConfirmMissedWorkoutPushForward(missedWorkoutAdvisory, 0)
                          setPushForwardResult(result)
                          setPushForwardState(result.status === 'success' ? 'applied' : 'failed')
                        } catch (error) {
                          setPushForwardResult({
                            status: 'blocked',
                            visibleSummary: 'An unexpected error occurred.',
                            evidence: [`Error: ${error instanceof Error ? error.message : 'unknown'}`],
                            reasonCode: 'unexpected_error',
                          })
                          setPushForwardState('failed')
                        }
                      }}
                      className="flex-1 h-8 text-xs bg-amber-600/80 hover:bg-amber-600 text-white"
                      data-action="confirm-missed-workout-recomposition"
                      data-advisory-action={missedWorkoutAdvisory.action}
                    >
                      {/* [STEP 23.6D] In confirming branch, show confirm text. 
                          Applying state renders its own separate branch. */}
                      Confirm Push Forward
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPushForwardState('idle')}
                      className="h-8 text-xs text-[#6A6A7A] hover:text-[#8A8A9A]"
                      data-action="cancel-confirmation"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Applying state */}
              {pushForwardState === 'applying' && (
                <div 
                  className="p-3 bg-[#2A2A35]/50 rounded-lg border border-[#3A3A4A]"
                  data-step-23-6-applying="true"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <p className="text-xs text-[#9A9AAA]">
                      Updating your schedule...
                    </p>
                  </div>
                </div>
              )}
              
              {/* Blocked state for unsupported actions or missing callback */}
              {(missedWorkoutAdvisory.action !== 'push_session_forward' || !onConfirmMissedWorkoutPushForward) && 
               pushForwardState === 'idle' && (
                <div 
                  className="p-3 bg-[#2A2A35]/50 rounded-lg border border-[#3A3A4A]"
                  data-step-23-5-final-action-boundary="true"
                  data-action-blocked="true"
                  data-blocked-reason={!onConfirmMissedWorkoutPushForward ? 'missing-callback' : 'unsupported-action'}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400/70 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#9A9AAA]">
                        Advisory only
                      </p>
                      <p className="text-[11px] text-[#6A6A7A] mt-1">
                        This recommendation is for review only. Use this guidance to manually adjust your training if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* No-mutation notice — show when not applied */}
              {pushForwardState !== 'applied' && (
                <div className="p-2 bg-emerald-500/5 rounded border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400/80 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Your current plan has not been changed</span>
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCantTrainModal(false)
                setMissedWorkoutAdvisoryDismissed(true)
                // Reset push forward state for next open
                setPushForwardState('idle')
                setPushForwardResult(null)
              }}
              className="flex-1 border-[#3A3A4A] text-[#9A9AAA] hover:bg-[#2A2A2A]"
              data-action="acknowledge-and-dismiss"
            >
              {pushForwardState === 'applied' ? 'Done' : 'Got It'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCantTrainModal(false)
                // Reset push forward state for next open
                setPushForwardState('idle')
                setPushForwardResult(null)
              }}
              className="text-[#6A6A7A] hover:text-[#8A8A9A]"
              data-action="close-modal"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* [BUILD-IDENTITY-STAMP] Tiny footer marker so the user can verify
          the live page is running the expected deploy, not a stale bundle. */}
      <BuildIdentityStamp />
    </div>
  )
}
