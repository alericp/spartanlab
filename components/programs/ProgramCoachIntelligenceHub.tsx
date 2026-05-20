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
  ClipboardList,
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
  FileSearch,
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
  Lock,
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
  buildSupersetStructuralCandidates,
  applySupersetStructuralCandidate,
  type MethodSlotEligibilityFrequencyPlan,
  type MethodFrequencyPreview,
  type SupersetCandidate,
  type SupersetStructuralPreview,
  type SupersetApplyResult,
} from '@/lib/program/method-slot-eligibility-frequency-planner'
import {
  buildFrequencySlotPlacementPreview,
  type FrequencySlotPlacementPreview,
  type FrequencySlotPlacementTarget,
  type DayInsertionPreview,
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
// [MASTER-8C.16] Intelligence Foundation Branch Map
import {
  INTELLIGENCE_FOUNDATION_BRANCH_MAP,
  getFoundationMapSummary,
  getUIStatusLabel,
  getMutationStatusLabel,
  type IntelligenceFoundationBranchEntry,
} from '@/lib/program/intelligence-foundation-branch-map'
// [MASTER-8C.18.1] Prehab/Rehab/Tendon Safeguard Read-Only Analyzer
import {
  resolvePrehabRehabTendonSafeguardReadonly,
  type PrehabRehabTendonSafeguardReadonlyModel,
  type PrehabRehabTendonSafeguardReadonlyInput,
} from '@/lib/program/prehab-rehab-tendon-safeguard-readonly-analyzer'
// [MASTER-8C.19] Recovery / Readiness Read-Only Analyzer
import {
  resolveRecoveryReadinessReadonly,
  type RecoveryReadinessReadonlyModel,
  type RecoveryReadinessSessionInput,
} from '@/lib/program/recovery-readiness-readonly-analyzer'
// [MASTER-8C.20] Exercise Knowledge Coverage Read-Only Analyzer
import {
  resolveExerciseKnowledgeCoverage,
  type ExerciseKnowledgeCoverageReadonlyModel,
} from '@/lib/program/exercise-knowledge-coverage-readonly-analyzer'
// [MASTER-8C.21] Progression / Periodization Read-Only Analyzer
import {
  resolveProgressionPeriodization,
  type ProgressionPeriodizationReadonlyModel,
} from '@/lib/program/progression-periodization-readonly-analyzer'
// [MASTER-8C.22] Coach Recommendation Candidate Read-Only Analyzer
import {
  resolveCoachRecommendationCandidates,
  type CoachRecommendationCandidateReadonlyModel,
} from '@/lib/program/coach-recommendation-candidate-readonly-analyzer'
// [MASTER-8C.24] Workout evidence bridge for Coach Recs
import {
  resolveCoachRecsWorkoutEvidenceSummary,
} from '@/lib/program/coach-recommendation-workout-evidence-readonly-bridge'
import { getRecentWorkoutLogsForGenerationRequest } from '@/lib/program/performance-feedback-integration'
// [MASTER-8C.27] Plan evidence read-only hook for Plan Logic
import {
  resolvePlanEvidenceReadonlyHook,
  type PlanEvidenceReadonlyHookModel,
} from '@/lib/program/plan-evidence-readonly-hook'
// [MASTER-8C.28] Evidence trend classification / plan-level readiness scoring
import {
  resolvePlanEvidenceTrendReadiness,
  getClassificationLabel,
  getPostureLabel,
  type PlanEvidenceTrendReadinessModel,
} from '@/lib/program/plan-evidence-trend-readiness'
// [MASTER-8C.29] Mutation-readiness review gate
import {
  resolveMutationReadinessReviewGate,
  getGateStatusLabel,
  getResolutionLabel,
  type MutationReadinessReviewGateModel,
} from '@/lib/program/mutation-readiness-review-gate'
// [MASTER-8C.30] Mutation pathway readiness map
import {
  resolveMutationPathwayReadinessMap,
  getPathwayMapStatusLabel,
  getGateStatusLabel as getPathwayGateStatusLabel,
  getGateStatusColor,
  type MutationPathwayReadinessMapModel,
} from '@/lib/program/mutation-pathway-readiness-map'
// [MASTER-8C.31] Target session resolution preview
import {
  resolveMutationTargetSessionResolutionPreview,
  buildTargetResolutionProgramInput,
  getTargetResolutionStatusLabel,
  getTargetCandidateStatusLabel,
  getTargetCandidateStatusColor,
  type MutationTargetSessionResolutionPreviewModel,
} from '@/lib/program/mutation-target-session-resolution-preview'
// [MASTER-8C.32] Workout log session identity bridge
import {
  resolveWorkoutLogSessionIdentity,
  getSessionIdentityStatusLabel,
  getSessionIdentityStatusColor,
} from '@/lib/program/workout-log-session-identity-readonly-bridge'
// [MASTER-8C.33] Confirmation contract preview
import {
  resolveMutationConfirmationContractPreview,
  getConfirmationContractStatusLabel,
  getConfirmationContractStatusColor,
  type MutationConfirmationContractPreviewModel,
} from '@/lib/program/mutation-confirmation-contract-preview'
// [MASTER-8C.34] Caution clearance gate
import {
  resolveMutationCautionClearanceGate,
  getMutationCautionClearanceStatusLabel,
  getMutationCautionClearanceStatusColor,
  type MutationCautionClearanceGateModel,
} from '@/lib/program/mutation-caution-clearance-gate'
// [MASTER-8C.35] Structural mutation preview contract
import {
  resolveStructuralMutationPreviewContract,
  getStructuralPreviewContractStatusLabel,
  getStructuralPreviewContractStatusColor,
  type StructuralMutationPreviewContractModel,
} from '@/lib/program/structural-mutation-preview-contract'
// [MASTER-8C.36] User confirmation / marker permission preview gate
import {
  resolveUserConfirmationMarkerPermissionPreviewGate,
  getUserConfirmationMarkerPermissionStatusLabel,
  getUserConfirmationMarkerPermissionStatusColor,
  type UserConfirmationMarkerPermissionPreviewGateModel,
} from '@/lib/program/user-confirmation-marker-permission-preview-gate'
// [MASTER-8C.37] Future-session mutation writer readiness boundary
import {
  resolveFutureSessionMutationWriterReadinessBoundary,
  getFutureSessionMutationWriterReadinessStatusLabel,
  getFutureSessionMutationWriterReadinessStatusColor,
  type FutureSessionMutationWriterReadinessBoundaryModel,
} from '@/lib/program/future-session-mutation-writer-readiness-boundary'
// [MASTER-8C.38] Pre-mutation lock / bundle closure
import {
  resolvePreMutationLockBundleClosure,
  getPreMutationLockBundleClosureStatusLabel,
  getPreMutationLockBundleClosureStatusColor,
  type PreMutationLockBundleClosureModel,
} from '@/lib/program/pre-mutation-lock-bundle-closure'
// [MASTER-8C.39] Controlled future-session mutation writer dry-run
import {
  resolveControlledFutureSessionMutationWriterDryRun,
  getControlledFutureSessionMutationWriterDryRunStatusLabel,
  getControlledFutureSessionMutationWriterDryRunStatusColor,
  type ControlledFutureSessionMutationDryRunEnvelope,
} from '@/lib/program/controlled-future-session-mutation-writer-dry-run'
// [MASTER-8C.40] Bounded mutation apply eligibility gate
import {
  resolveBoundedMutationApplyEligibilityGate,
  getBoundedMutationApplyEligibilityStatusLabel,
  getBoundedMutationApplyEligibilityStatusColor,
  type BoundedMutationApplyEligibilityGateModel,
} from '@/lib/program/bounded-mutation-apply-eligibility-gate'
// [MASTER-8C.41] Marker-only confirmation boundary preview
import {
  resolveMarkerOnlyConfirmationBoundaryPreview,
  getMarkerOnlyConfirmationBoundaryStatusLabel,
  getMarkerOnlyConfirmationBoundaryStatusColor,
  type MarkerOnlyConfirmationBoundaryModel,
} from '@/lib/program/marker-only-confirmation-boundary-preview'
// [MASTER-8C.42] Marker-save authorization preflight boundary
import {
  resolveMarkerSaveAuthorizationPreflightBoundary,
  getMarkerSaveAuthorizationPreflightStatusLabel,
  getMarkerSaveAuthorizationPreflightStatusColor,
  type MarkerSaveAuthorizationPreflightBoundaryModel,
} from '@/lib/program/marker-save-authorization-preflight-boundary'
// [MASTER-8C.43] Controlled marker-save action boundary
import {
  resolveControlledMarkerSaveActionBoundary,
  getControlledMarkerSaveActionStatusLabel,
  getControlledMarkerSaveActionStatusColor,
  type ControlledMarkerSaveActionBoundaryModel,
} from '@/lib/program/controlled-marker-save-action-boundary'
// [Prompt 21] Marker-save artifact preview
import {
  resolveMarkerSaveArtifactPreview,
  getMarkerSaveArtifactPreviewStatusLabel,
  getMarkerSaveArtifactPreviewStatusColor,
  type MarkerSaveArtifactPreviewModel,
} from '@/lib/program/marker-save-artifact-preview'
// [Prompt 22] Marker write readiness ledger
import {
  resolveMarkerWriteReadinessLedger,
  getMarkerWriteReadinessLedgerStatusLabel,
  getMarkerWriteReadinessLedgerStatusColor,
  getMarkerWriteReadinessItemStatusColor,
  type MarkerWriteReadinessLedgerModel,
} from '@/lib/program/marker-write-readiness-ledger'
// [Prompt 41] Durable marker receipt readiness
import {
  resolveDurableMarkerReceiptReadiness,
  getDurableMarkerReceiptReadinessStatusLabel,
  getDurableMarkerReceiptReadinessStatusColor,
  type DurableMarkerReceiptReadinessModel,
} from '@/lib/program/durable-marker-receipt-readiness'
// [Prompt 42] Controlled durable marker receipt writer preview
import {
  resolveControlledDurableMarkerReceiptWriterPreview,
  getControlledDurableMarkerReceiptWriterPreviewStatusLabel,
  getControlledDurableMarkerReceiptWriterPreviewStatusColor,
  type ControlledDurableMarkerReceiptWriterPreviewModel,
} from '@/lib/program/controlled-durable-marker-receipt-writer-preview'
// [Prompt 43] Persistence writer activation lock gate
import {
  resolvePersistenceWriterActivationLockGate,
  getPersistenceWriterActivationLockGateStatusLabel,
  getPersistenceWriterActivationLockGateStatusColor,
  type PersistenceWriterActivationLockGateModel,
} from '@/lib/program/persistence-writer-activation-lock-gate'
// [Prompt 44] Controlled durable marker receipt writer no-write harness
import {
  resolveControlledDurableMarkerReceiptWriterNoWriteHarness,
  getControlledDurableMarkerReceiptWriterNoWriteHarnessStatusLabel,
  getControlledDurableMarkerReceiptWriterNoWriteHarnessStatusColor,
  type ControlledDurableMarkerReceiptWriterNoWriteHarnessModel,
} from '@/lib/program/controlled-durable-marker-receipt-writer-no-write-harness'
// [Prompt 45] Durable receipt writer eligibility ledger
import {
  resolveDurableReceiptWriterEligibilityLedger,
  getDurableReceiptWriterEligibilityLedgerStatusLabel,
  getDurableReceiptWriterEligibilityLedgerStatusColor,
  getDurableReceiptWriterEligibilityItemStatusLabel,
  getDurableReceiptWriterEligibilityItemStatusColor,
  type DurableReceiptWriterEligibilityLedgerModel,
} from '@/lib/program/durable-receipt-writer-eligibility-ledger'
// [Prompt 46] Durable receipt writer activation preconditions review
import {
  resolveDurableReceiptWriterActivationPreconditionsReview,
  getDurableReceiptWriterActivationPreconditionsReviewStatusLabel,
  getDurableReceiptWriterActivationPreconditionsReviewStatusColor,
  getDurableReceiptWriterActivationPreconditionStatusLabel,
  getDurableReceiptWriterActivationPreconditionStatusColor,
  type DurableReceiptWriterActivationPreconditionsReviewModel,
} from '@/lib/program/durable-receipt-writer-activation-preconditions-review'
// [Prompt 47] Explicit persistence activation request preview
import {
  resolveExplicitPersistenceActivationRequestPreview,
  getExplicitPersistenceActivationRequestPreviewStatusLabel,
  getExplicitPersistenceActivationRequestPreviewStatusColor,
  getExplicitPersistenceActivationRequestRequirementStatusLabel,
  getExplicitPersistenceActivationRequestRequirementStatusColor,
  type ExplicitPersistenceActivationRequestPreviewModel,
} from '@/lib/program/explicit-persistence-activation-request-preview'
// [Prompt 48] Activation request authorization lock
import {
  resolveActivationRequestAuthorizationLock,
  getActivationRequestAuthorizationLockStatusLabel,
  getActivationRequestAuthorizationLockStatusColor,
  getActivationRequestAuthorizationLockRequirementStatusLabel,
  getActivationRequestAuthorizationLockRequirementStatusColor,
  type ActivationRequestAuthorizationLockModel,
} from '@/lib/program/activation-request-authorization-lock'
// [Prompt 49] Explicit activation request intent capture preview
import {
  resolveExplicitActivationRequestIntentCapturePreview,
  getExplicitActivationRequestIntentCapturePreviewStatusLabel,
  getExplicitActivationRequestIntentCapturePreviewStatusColor,
  getExplicitActivationRequestIntentCaptureRequirementStatusLabel,
  getExplicitActivationRequestIntentCaptureRequirementStatusColor,
  type ExplicitActivationRequestIntentCapturePreviewModel,
} from '@/lib/program/explicit-activation-request-intent-capture-preview'
// [Prompt 50] Explicit activation authorization review preview
import {
  resolveExplicitActivationAuthorizationReviewPreview,
  getExplicitActivationAuthorizationReviewPreviewStatusLabel,
  getExplicitActivationAuthorizationReviewPreviewStatusColor,
  getExplicitActivationAuthorizationReviewRequirementStatusLabel,
  getExplicitActivationAuthorizationReviewRequirementStatusColor,
  type ExplicitActivationAuthorizationReviewPreviewModel,
} from '@/lib/program/explicit-activation-authorization-review-preview'
// [Prompt 51] Controlled activation permission boundary preview
import {
  resolveControlledActivationPermissionBoundaryPreview,
  getControlledActivationPermissionBoundaryPreviewStatusLabel,
  getControlledActivationPermissionBoundaryPreviewStatusColor,
  getControlledActivationPermissionBoundaryStatusLabel,
  getControlledActivationPermissionBoundaryStatusColor,
  type ControlledActivationPermissionBoundaryPreviewModel,
} from '@/lib/program/controlled-activation-permission-boundary-preview'
// [Prompt 52] Explicit persistence activation consent preview
import {
  resolveExplicitPersistenceActivationConsentPreview,
  getExplicitPersistenceActivationConsentPreviewStatusLabel,
  getExplicitPersistenceActivationConsentPreviewStatusColor,
  getExplicitPersistenceActivationConsentRequirementStatusLabel,
  getExplicitPersistenceActivationConsentRequirementStatusColor,
  type ExplicitPersistenceActivationConsentPreviewModel,
} from '@/lib/program/explicit-persistence-activation-consent-preview'
// [Prompt 53] Consent authorization lock preview
import {
  resolveConsentAuthorizationLockPreview,
  getConsentAuthorizationLockPreviewStatusLabel,
  getConsentAuthorizationLockPreviewStatusColor,
  getConsentAuthorizationLockItemStatusLabel,
  getConsentAuthorizationLockItemStatusColor,
  type ConsentAuthorizationLockPreviewModel,
} from '@/lib/program/consent-authorization-lock-preview'
// [Prompt 54] Consent decision state preview
import {
  resolveConsentDecisionStatePreview,
  getConsentDecisionStatePreviewStatusLabel,
  getConsentDecisionStatePreviewStatusColor,
  getConsentDecisionStatePreviewBranchStatusLabel,
  getConsentDecisionStatePreviewBranchStatusColor,
  type ConsentDecisionStatePreviewModel,
} from '@/lib/program/consent-decision-state-preview'
// [Prompt 55] Consent decision review lock preview
import {
  resolveConsentDecisionReviewLockPreview,
  getConsentDecisionReviewLockPreviewStatusLabel,
  getConsentDecisionReviewLockPreviewStatusColor,
  getConsentDecisionReviewLockItemStatusLabel,
  getConsentDecisionReviewLockItemStatusColor,
  type ConsentDecisionReviewLockPreviewModel,
} from '@/lib/program/consent-decision-review-lock-preview'
// [Prompt 56] Consent permission boundary preview
import {
  resolveConsentPermissionBoundaryPreview,
  getConsentPermissionBoundaryPreviewStatusLabel,
  getConsentPermissionBoundaryPreviewStatusColor,
  getConsentPermissionBoundaryItemStatusLabel,
  getConsentPermissionBoundaryItemStatusColor,
  type ConsentPermissionBoundaryPreviewModel,
} from '@/lib/program/consent-permission-boundary-preview'
// [Prompt 57] Persistence permission review preview
import {
  resolvePersistencePermissionReviewPreview,
  getPersistencePermissionReviewPreviewStatusLabel,
  getPersistencePermissionReviewPreviewStatusColor,
  getPersistencePermissionReviewItemStatusLabel,
  getPersistencePermissionReviewItemStatusColor,
  type PersistencePermissionReviewPreviewModel,
} from '@/lib/program/persistence-permission-review-preview'
// [Prompt 58] Persistence write preflight preview
import {
  resolvePersistenceWritePreflightPreview,
  getPersistenceWritePreflightPreviewStatusLabel,
  getPersistenceWritePreflightPreviewStatusColor,
  getPersistenceWritePreflightItemStatusLabel,
  getPersistenceWritePreflightItemStatusColor,
  type PersistenceWritePreflightPreviewModel,
} from '@/lib/program/persistence-write-preflight-preview'
// [Prompt 59] Persistence writer activation review preview
import {
  resolvePersistenceWriterActivationReviewPreview,
  getPersistenceWriterActivationReviewPreviewStatusLabel,
  getPersistenceWriterActivationReviewPreviewStatusColor,
  getPersistenceWriterActivationReviewItemStatusLabel,
  getPersistenceWriterActivationReviewItemStatusColor,
  type PersistenceWriterActivationReviewPreviewModel,
} from '@/lib/program/persistence-writer-activation-review-preview'
// [Prompt 60] Persistence boundary review preview
import {
  resolvePersistenceBoundaryReviewPreview,
  getPersistenceBoundaryReviewPreviewStatusLabel,
  getPersistenceBoundaryReviewPreviewStatusColor,
  getPersistenceBoundaryReviewItemStatusLabel,
  getPersistenceBoundaryReviewItemStatusColor,
  type PersistenceBoundaryReviewPreviewModel,
} from '@/lib/program/persistence-boundary-review-preview'
// [Prompt 61] Persistence writer gate preview
import {
  resolvePersistenceWriterGatePreview,
  getPersistenceWriterGatePreviewStatusLabel,
  getPersistenceWriterGatePreviewStatusColor,
  getPersistenceWriterGateItemStatusLabel,
  getPersistenceWriterGateItemStatusColor,
  type PersistenceWriterGatePreviewModel,
} from '@/lib/program/persistence-writer-gate-preview'
// [Prompt 62] Persistence writer boundary step preview
import {
  resolvePersistenceWriterBoundaryStepPreview,
  getPersistenceWriterBoundaryStepPreviewStatusLabel,
  getPersistenceWriterBoundaryStepPreviewStatusColor,
  getPersistenceWriterBoundaryStepItemStatusLabel,
  getPersistenceWriterBoundaryStepItemStatusColor,
  type PersistenceWriterBoundaryStepPreviewModel,
} from '@/lib/program/persistence-writer-boundary-step-preview'
// [Prompt 63] Persistence writer boundary continuity preview
import {
  resolvePersistenceWriterBoundaryContinuityPreview,
  getPersistenceWriterBoundaryContinuityPreviewStatusLabel,
  getPersistenceWriterBoundaryContinuityPreviewStatusColor,
  getPersistenceWriterBoundaryContinuityItemStatusLabel,
  getPersistenceWriterBoundaryContinuityItemStatusColor,
  type PersistenceWriterBoundaryContinuityPreviewModel,
} from '@/lib/program/persistence-writer-boundary-continuity-preview'
// [Prompt 64] Mutation unlock roadmap decision gate
import {
  resolveMutationUnlockRoadmapDecisionGate,
  getMutationUnlockDecisionStatusLabel,
  getMutationUnlockDecisionStatusColor,
  getMutationUnlockDecisionItemStatusLabel,
  getMutationUnlockDecisionItemStatusColor,
  type MutationUnlockRoadmapDecisionGateModel,
} from '@/lib/program/mutation-unlock-roadmap-decision-gate'
// [Prompt 23] Root/candidate clearance evidence detail
import {
  resolveRootCandidateClearanceEvidenceDetail,
  getRootCandidateClearanceEvidenceDetailStatusLabel,
  getRootCandidateClearanceEvidenceDetailStatusColor,
  getRootCandidateEvidenceItemStatusColor,
  getRootCandidateEvidenceItemStatusLabel,
  type RootCandidateClearanceEvidenceDetailModel,
} from '@/lib/program/root-candidate-clearance-evidence-detail'

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
  
  // [MASTER-8C.15.1.1A] Split state model for proper provenance-aware rendering
  const isAlreadyApplied = item.state === 'applied' || item.state === 'materialized'
  const isUserAppliedOverride = Boolean(isOverrideApplied)
  const isNativeMaterialized = isAlreadyApplied && !isUserAppliedOverride
  // [MASTER-8C.15.1.1B] Native methods can still show additive controls
  const canShowAdditiveControls = !isAlreadyApplied || isNativeMaterialized
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
                  Preview structure only �� exact exercises determined at apply time
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
      
      {/* [MASTER-8C.12.1A / MASTER-8C.15.1.1B] Method-specific frequency controls for row-level methods */}
      {/* [MASTER-8C.15.1.1B] Show for native methods too - they can add extra placements */}
      {canShowAdditiveControls && (
        <MethodDetailFrequencyControls
          program={program}
          methodKey={plan.methodKey}
          methodLabel={item.label}
          onApplyFrequencyPlacement={onApplyFrequencyPlacement}
          isNativeMaterialized={isNativeMaterialized}
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

// =============================================================================
// [MASTER-8C.16] AI INTELLIGENCE FOUNDATION MAP COMPONENT
// =============================================================================

/**
 * AI Intelligence Foundation Map - displays all intelligence branches with
 * their status, mutation capability, and next safe actions.
 * 
 * This is a read-only component that does not change any workouts.
 * [MASTER-8C.18.1] Now accepts optional safeguard model for dynamic proof.
 */
function AIIntelligenceFoundationMap({
  safeguardModel,
  recoveryReadinessModel,
  exerciseKnowledgeCoverageModel,
  progressionPeriodizationModel,
  coachRecommendationCandidateModel,
  planEvidenceHookModel,
  planEvidenceTrendReadinessModel,
  mutationReadinessReviewGateModel,
  mutationPathwayReadinessMapModel,
  mutationTargetSessionResolutionPreviewModel,
  mutationConfirmationContractPreviewModel,
  mutationCautionClearanceGateModel,
  structuralMutationPreviewContractModel,
  userConfirmationMarkerPermissionPreviewGateModel,
  futureSessionMutationWriterReadinessBoundaryModel,
  preMutationLockBundleClosureModel,
  controlledFutureSessionMutationWriterDryRunModel,
  boundedMutationApplyEligibilityGateModel,
  markerOnlyConfirmationBoundaryModel,
  markerSaveAuthorizationPreflightBoundaryModel,
  controlledMarkerSaveActionBoundaryModel,
  // [Prompt 21] Marker-save artifact preview
  markerSaveArtifactPreviewModel,
  // [Prompt 22] Marker write readiness ledger
  markerWriteReadinessLedgerModel,
  // [Prompt 41] Durable marker receipt readiness
  durableMarkerReceiptReadinessModel,
  // [Prompt 42] Controlled durable marker receipt writer preview
  controlledDurableMarkerReceiptWriterPreviewModel,
  // [Prompt 43] Persistence writer activation lock gate
  persistenceWriterActivationLockGateModel,
  // [Prompt 44] Controlled durable marker receipt writer no-write harness
  controlledDurableMarkerReceiptWriterNoWriteHarnessModel,
  // [Prompt 45] Durable receipt writer eligibility ledger
  durableReceiptWriterEligibilityLedgerModel,
  // [Prompt 46] Durable receipt writer activation preconditions review
  durableReceiptWriterActivationPreconditionsReviewModel,
  // [Prompt 47] Explicit persistence activation request preview
  explicitPersistenceActivationRequestPreviewModel,
  // [Prompt 48] Activation request authorization lock
  activationRequestAuthorizationLockModel,
  // [Prompt 49] Explicit activation request intent capture preview
  explicitActivationRequestIntentCapturePreviewModel,
  // [Prompt 50] Explicit activation authorization review preview
  explicitActivationAuthorizationReviewPreviewModel,
  // [Prompt 51] Controlled activation permission boundary preview
  controlledActivationPermissionBoundaryPreviewModel,
  // [Prompt 52] Explicit persistence activation consent preview
  explicitPersistenceActivationConsentPreviewModel,
  // [Prompt 53] Consent authorization lock preview
  consentAuthorizationLockPreviewModel,
  // [Prompt 54] Consent decision state preview
  consentDecisionStatePreviewModel,
  // [Prompt 55] Consent decision review lock preview
  consentDecisionReviewLockPreviewModel,
  // [Prompt 56] Consent permission boundary preview
  consentPermissionBoundaryPreviewModel,
  // [Prompt 57] Persistence permission review preview
  persistencePermissionReviewPreviewModel,
  // [Prompt 58] Persistence write preflight preview
  persistenceWritePreflightPreviewModel,
}: {
  safeguardModel?: PrehabRehabTendonSafeguardReadonlyModel | null
  recoveryReadinessModel?: RecoveryReadinessReadonlyModel | null
  exerciseKnowledgeCoverageModel?: ExerciseKnowledgeCoverageReadonlyModel | null
  progressionPeriodizationModel?: ProgressionPeriodizationReadonlyModel | null
  coachRecommendationCandidateModel?: CoachRecommendationCandidateReadonlyModel | null
  planEvidenceHookModel?: PlanEvidenceReadonlyHookModel | null
  planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
  mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  mutationPathwayReadinessMapModel?: MutationPathwayReadinessMapModel | null
  mutationTargetSessionResolutionPreviewModel?: MutationTargetSessionResolutionPreviewModel | null
  mutationConfirmationContractPreviewModel?: MutationConfirmationContractPreviewModel | null
  mutationCautionClearanceGateModel?: MutationCautionClearanceGateModel | null
  structuralMutationPreviewContractModel?: StructuralMutationPreviewContractModel | null
  userConfirmationMarkerPermissionPreviewGateModel?: UserConfirmationMarkerPermissionPreviewGateModel | null
  futureSessionMutationWriterReadinessBoundaryModel?: FutureSessionMutationWriterReadinessBoundaryModel | null
  preMutationLockBundleClosureModel?: PreMutationLockBundleClosureModel | null
  controlledFutureSessionMutationWriterDryRunModel?: ControlledFutureSessionMutationDryRunEnvelope | null
  boundedMutationApplyEligibilityGateModel?: BoundedMutationApplyEligibilityGateModel | null
  // [MASTER-8C.48] Marker-gate proof parity bridge
  markerOnlyConfirmationBoundaryModel?: MarkerOnlyConfirmationBoundaryModel | null
  markerSaveAuthorizationPreflightBoundaryModel?: MarkerSaveAuthorizationPreflightBoundaryModel | null
  controlledMarkerSaveActionBoundaryModel?: ControlledMarkerSaveActionBoundaryModel | null
  // [Prompt 21] Marker-save artifact preview
  markerSaveArtifactPreviewModel?: MarkerSaveArtifactPreviewModel | null
  // [Prompt 22] Marker write readiness ledger
  markerWriteReadinessLedgerModel?: MarkerWriteReadinessLedgerModel | null
  // [Prompt 41] Durable marker receipt readiness
  durableMarkerReceiptReadinessModel?: DurableMarkerReceiptReadinessModel | null
  // [Prompt 42] Controlled durable marker receipt writer preview
  controlledDurableMarkerReceiptWriterPreviewModel?: ControlledDurableMarkerReceiptWriterPreviewModel | null
  // [Prompt 43] Persistence writer activation lock gate
  persistenceWriterActivationLockGateModel?: PersistenceWriterActivationLockGateModel | null
  // [Prompt 44] Controlled durable marker receipt writer no-write harness
  controlledDurableMarkerReceiptWriterNoWriteHarnessModel?: ControlledDurableMarkerReceiptWriterNoWriteHarnessModel | null
  // [Prompt 45] Durable receipt writer eligibility ledger
  durableReceiptWriterEligibilityLedgerModel?: DurableReceiptWriterEligibilityLedgerModel | null
  // [Prompt 46] Durable receipt writer activation preconditions review
  durableReceiptWriterActivationPreconditionsReviewModel?: DurableReceiptWriterActivationPreconditionsReviewModel | null
  // [Prompt 47] Explicit persistence activation request preview
  explicitPersistenceActivationRequestPreviewModel?: ExplicitPersistenceActivationRequestPreviewModel | null
  // [Prompt 48] Activation request authorization lock
  activationRequestAuthorizationLockModel?: ActivationRequestAuthorizationLockModel | null
  // [Prompt 49] Explicit activation request intent capture preview
  explicitActivationRequestIntentCapturePreviewModel?: ExplicitActivationRequestIntentCapturePreviewModel | null
  // [Prompt 50] Explicit activation authorization review preview
  explicitActivationAuthorizationReviewPreviewModel?: ExplicitActivationAuthorizationReviewPreviewModel | null
  // [Prompt 51] Controlled activation permission boundary preview
  controlledActivationPermissionBoundaryPreviewModel?: ControlledActivationPermissionBoundaryPreviewModel | null
  // [Prompt 52] Explicit persistence activation consent preview
  explicitPersistenceActivationConsentPreviewModel?: ExplicitPersistenceActivationConsentPreviewModel | null
  // [Prompt 53] Consent authorization lock preview
  consentAuthorizationLockPreviewModel?: ConsentAuthorizationLockPreviewModel | null
  // [Prompt 54] Consent decision state preview
  consentDecisionStatePreviewModel?: ConsentDecisionStatePreviewModel | null
  // [Prompt 55] Consent decision review lock preview
  consentDecisionReviewLockPreviewModel?: ConsentDecisionReviewLockPreviewModel | null
  // [Prompt 56] Consent permission boundary preview
  consentPermissionBoundaryPreviewModel?: ConsentPermissionBoundaryPreviewModel | null
  // [Prompt 57] Persistence permission review preview
  persistencePermissionReviewPreviewModel?: PersistencePermissionReviewPreviewModel | null
  // [Prompt 58] Persistence write preflight preview
  persistenceWritePreflightPreviewModel?: PersistenceWritePreflightPreviewModel | null
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const summary = getFoundationMapSummary()
  
  // Helper to get status chip styling
  const getStatusChipStyle = (status: IntelligenceFoundationBranchEntry['uiStatus']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'partial':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'read_only':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      case 'mutation_locked':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'protected_runtime':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20'
      case 'missing_foundation':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'future_needed':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default:
        return 'bg-[#2A2A35] text-[#8A8A9A] border-[#3A3A45]'
    }
  }
  
  // Filter to show key branches in collapsed view
  const keyBranches = INTELLIGENCE_FOUNDATION_BRANCH_MAP.filter(b => 
    ['exercise_skill_knowledge_base', 'program_balance', 'prehab_rehab_tendon_joint', 
     'set_volume_prescription_rationale', 'live_workout_runtime'].includes(b.id)
  )
  
  const branchesToShow = isExpanded ? INTELLIGENCE_FOUNDATION_BRANCH_MAP : keyBranches
  
  return (
    <div className="rounded-xl border border-[#2A2A35] bg-[#1A1A1F] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1F1F27] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-[#E6E9EF]">AI Intelligence Foundation Map</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {summary.total} branches
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#6A6A7A]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6A6A7A]" />
        )}
      </button>
      
      {/* Notice */}
      <div className="px-4 pb-2">
        <p className="text-[9px] text-[#6A6A7A] leading-relaxed">
          This map shows which intelligence branches are source-backed, which are read-only, 
          and which are locked before future workout mutation. No workout changes from this panel.
        </p>
      </div>
      
      {/* Summary chips */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {summary.active} Active
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {summary.readOnly} Read-only
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {summary.partial} Partial
        </span>
        {summary.missingFoundation > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
            {summary.missingFoundation} Foundation needed
          </span>
        )}
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
          {summary.protectedRuntime} Protected
        </span>
      </div>
      
      {/* Branch rows */}
      <div className="border-t border-[#2A2A35]">
        {branchesToShow.map((branch) => (
          <div 
            key={branch.id}
            className="px-4 py-2.5 border-b border-[#2A2A35]/50 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-[11px] font-medium text-[#E6E9EF]">{branch.label}</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap",
                getStatusChipStyle(branch.uiStatus)
              )}>
                {getUIStatusLabel(branch.uiStatus)}
              </span>
            </div>
            <p className="text-[10px] text-[#8A8A9A] leading-relaxed mb-1.5">
              {branch.currentRole}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A35] text-[#6A6A7A] border border-[#3A3A45]">
                {getMutationStatusLabel(branch.mutationStatus)}
              </span>
              {branch.currentUISurface && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A35] text-[#6A6A7A] border border-[#3A3A45]">
                  {branch.currentUISurface}
                </span>
              )}
            </div>
            
            {/* [MASTER-8C.18.1] Dynamic safeguard proof for prehab_rehab_tendon_joint */}
            {branch.id === 'prehab_rehab_tendon_joint' && (
              <div className="mt-2 pt-2 border-t border-[#2A2A35]/30">
                {safeguardModel ? (
                  <div className="space-y-1.5">
                    {/* Risk/Confidence summary */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded border",
                        safeguardModel.riskLevel === 'elevated' || safeguardModel.riskLevel === 'high'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : safeguardModel.riskLevel === 'moderate'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      )}>
                        Risk: {safeguardModel.riskLevel}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A35] text-[#6A6A7A] border border-[#3A3A45]">
                        Confidence: {safeguardModel.confidence}
                      </span>
                    </div>
                    
                    {/* Top signals */}
                    {safeguardModel.detectedSignals.length > 0 && (
                      <div className="text-[9px] text-[#8A8A9A]">
                        <span className="text-[#6A6A7A]">Top signals: </span>
                        {safeguardModel.detectedSignals.slice(0, 3).map(s => s.label).join(', ')}
                      </div>
                    )}
                    
                    {/* Source basis */}
                    {safeguardModel.sourceBasis.length > 0 && (
                      <div className="text-[9px] text-[#6A6A7A]">
                        Sources: {safeguardModel.sourceBasis.slice(0, 3).join(', ')}
                      </div>
                    )}
                    
                    {/* Mutation lock reminder */}
                    <div className="text-[9px] text-cyan-400/60">
                      No substitutions or exercise changes applied.
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-[#6A6A7A] italic">
                    Read-only scan unavailable from current program props; branch remains mutation locked.
                  </div>
                )}
              </div>
            )}
            
            {/* [MASTER-8C.19] Dynamic recovery/readiness proof for recovery_readiness */}
            {branch.id === 'recovery_readiness' && (
              <div className="mt-2 pt-2 border-t border-[#2A2A35]/30">
                {recoveryReadinessModel ? (
                  <div className="space-y-1.5">
                    {/* Readiness/Confidence summary */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded border",
                        recoveryReadinessModel.readinessLevel === 'protected' || recoveryReadinessModel.readinessLevel === 'reduced'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : recoveryReadinessModel.readinessLevel === 'watch'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : recoveryReadinessModel.readinessLevel === 'ready'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-[#2A2A35] text-[#6A6A7A] border-[#3A3A45]'
                      )}>
                        {recoveryReadinessModel.headline}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2A35] text-[#6A6A7A] border border-[#3A3A45]">
                        {recoveryReadinessModel.confidence} confidence
                      </span>
                    </div>
                    
                    {/* Top signals */}
                    {recoveryReadinessModel.signals.length > 0 && (
                      <div className="text-[9px] text-[#8A8A9A]">
                        <span className="text-[#6A6A7A]">Signals: </span>
                        {recoveryReadinessModel.signals.slice(0, 3).map(s => s.label).join(', ')}
                      </div>
                    )}
                    
                    {/* Source basis */}
                    {recoveryReadinessModel.sourceBasis.length > 0 && (
                      <div className="text-[9px] text-[#6A6A7A]">
                        Sources: {recoveryReadinessModel.sourceBasis.slice(0, 3).join(', ')}
                      </div>
                    )}
                    
                    {/* Missing sources */}
                    {recoveryReadinessModel.missingSources.length > 0 && (
                      <div className="text-[9px] text-[#5A5A6A]">
                        Missing: {recoveryReadinessModel.missingSources.slice(0, 3).join(', ')}
                      </div>
                    )}
                    
                    {/* Mutation lock */}
                    <div className="text-[9px] text-cyan-400/60">
                      No future sessions changed.
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-[#6A6A7A] italic">
                    Read-only scan unavailable from current program props; recovery mutation remains locked.
                  </div>
                )}
              </div>
            )}
            
            {/* [MASTER-8C.20] Dynamic exercise knowledge coverage proof */}
            {branch.id === 'exercise_skill_knowledge_base' && (
              <div className="mt-2 pt-2 border-t border-[#2A2A35]/30">
                {exerciseKnowledgeCoverageModel ? (
                  <div className="space-y-1.5">
                    {/* Coverage headline */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded border",
                        exerciseKnowledgeCoverageModel.coverageRatio >= 0.9
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : exerciseKnowledgeCoverageModel.coverageRatio >= 0.6
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      )}>
                        {exerciseKnowledgeCoverageModel.headline}
                      </span>
                    </div>
                    
                    {/* Breakdown counts */}
                    <div className="text-[9px] text-[#8A8A9A]">
                      {exerciseKnowledgeCoverageModel.summary}
                    </div>
                    
                    {/* Top partial/basic exercises */}
                    {exerciseKnowledgeCoverageModel.topPartialOrBasicExercises.length > 0 && (
                      <div className="text-[9px] text-[#6A6A7A]">
                        <span className="text-[#5A5A6A]">Basic/partial: </span>
                        {exerciseKnowledgeCoverageModel.topPartialOrBasicExercises.slice(0, 3).join(', ')}
                      </div>
                    )}
                    
                    {/* Top unknown exercises */}
                    {exerciseKnowledgeCoverageModel.topUnknownExercises.length > 0 && (
                      <div className="text-[9px] text-amber-400/70">
                        <span className="text-[#5A5A6A]">Unknown: </span>
                        {exerciseKnowledgeCoverageModel.topUnknownExercises.slice(0, 3).join(', ')}
                      </div>
                    )}
                    
                    {/* Source basis */}
                    {exerciseKnowledgeCoverageModel.sourceBasis.length > 0 && (
                      <div className="text-[9px] text-[#6A6A7A]">
                        Sources: {exerciseKnowledgeCoverageModel.sourceBasis.join(', ')}
                      </div>
                    )}
                    
                    {/* Mutation lock */}
                    <div className="text-[9px] text-cyan-400/60">
                      No exercise selection changed.
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-[#6A6A7A] italic">
                    Coverage scan unavailable from current program props; knowledge branch remains read-only.
                  </div>
                )}
              </div>
            )}
            
            {/* [MASTER-8C.21] Dynamic progression/periodization proof */}
            {branch.id === 'progression_periodization' && (
              <div className="mt-2 pt-2 border-t border-[#2A2A35]/30">
                {progressionPeriodizationModel ? (
                  <div className="space-y-1.5">
                    {/* Status + posture + direction chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded border",
                        progressionPeriodizationModel.status === 'read_only_active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : progressionPeriodizationModel.status === 'partial'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      )}>
                        {progressionPeriodizationModel.headline}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        {progressionPeriodizationModel.confidence} confidence
                      </span>
                    </div>
                    
                    {/* Summary */}
                    <div className="text-[9px] text-[#8A8A9A]">
                      {progressionPeriodizationModel.summary}
                    </div>
                    
                    {/* Top signals */}
                    {progressionPeriodizationModel.signals.length > 0 && (
                      <div className="text-[9px] text-[#6A6A7A]">
                        <span className="text-[#5A5A6A]">Signals: </span>
                        {progressionPeriodizationModel.signals.slice(0, 3).map(s => s.label).join(', ')}
                      </div>
                    )}
                    
                    {/* Sources */}
                    {progressionPeriodizationModel.sourceBasis.length > 0 && (
                      <div className="text-[9px] text-[#6A6A7A]">
                        Sources: {progressionPeriodizationModel.sourceBasis.slice(0, 4).join(', ')}
                      </div>
                    )}
                    
                    {/* Missing sources */}
                    {progressionPeriodizationModel.missingSources.length > 0 && (
                      <div className="text-[9px] text-amber-400/60">
                        Missing: {progressionPeriodizationModel.missingSources.slice(0, 3).join(', ')}
                      </div>
                    )}
                    
                    {/* Mutation lock */}
                    <div className="text-[9px] text-cyan-400/60">
                      No future sessions changed.
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-[#6A6A7A] italic">
                    Progression scan unavailable from current program props; branch remains read-only.
                  </div>
                )}
              </div>
            )}
            
            {/* [MASTER-8C.22] Dynamic coach recommendation candidate proof */}
            {/* [MASTER-8C.23] Refined with source-quality / evidence-tier proof */}
            {branch.id === 'coach_recs' && (
              <div className="mt-2 pt-2 border-t border-[#2A2A35]/30">
                {coachRecommendationCandidateModel && coachRecommendationCandidateModel.topCandidate ? (
                  <div className="space-y-1.5">
                    {/* Status + confidence + evidence tier chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded border",
                        coachRecommendationCandidateModel.status === 'read_only_active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : coachRecommendationCandidateModel.status === 'waiting_for_evidence'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      )}>
                        {coachRecommendationCandidateModel.headline}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        {coachRecommendationCandidateModel.confidence} confidence
                      </span>
                    </div>
                    
                    {/* Top candidate title */}
                    <div className="text-[9px] text-[#8A8A9A]">
                      Top: {coachRecommendationCandidateModel.topCandidate.title}
                    </div>
                    
                    {/* [MASTER-8C.23] Source quality summary */}
                    {/* [MASTER-8C.24] Enhanced with workout evidence bridge proof */}
                    <div className="text-[9px] text-[#6A6A7A] italic">
                      {coachRecommendationCandidateModel.evidenceTierSummary}
                    </div>
                    
                    {/* [MASTER-8C.24] Compact workout evidence label */}
                    {coachRecommendationCandidateModel.workoutEvidenceLabel && (
                      <div className="text-[9px] text-emerald-400/60">
                        {coachRecommendationCandidateModel.workoutEvidenceLabel}
                      </div>
                    )}
                    
                    {/* Sources */}
                    {coachRecommendationCandidateModel.sourceBasis.length > 0 && (
                      <div className="text-[9px] text-[#6A6A7A]">
                        Sources: {coachRecommendationCandidateModel.sourceBasis.slice(0, 4).join(', ')}
                      </div>
                    )}
                    
                    {/* Missing sources */}
                    {coachRecommendationCandidateModel.missingSources.length > 0 && (
                      <div className="text-[9px] text-amber-400/60">
                        Missing: {coachRecommendationCandidateModel.missingSources.slice(0, 3).join(', ')}
                      </div>
                    )}
                    
                    {/* Mutation lock */}
                    <div className="text-[9px] text-cyan-400/60">
                      Not applied. No future sessions changed.
                    </div>
                  </div>
                ) : coachRecommendationCandidateModel ? (
                  <div className="text-[9px] text-[#6A6A7A] italic">
                    No actionable candidates from current source branches. Awaiting evidence or stronger signals.
                  </div>
                ) : (
                  <div className="text-[9px] text-[#6A6A7A] italic">
                    Coach recommendation scan unavailable; branch remains read-only.
                  </div>
                )}
              </div>
            )}
            
            {/* [MASTER-8C.27] Dynamic plan evidence hook proof */}
            {branch.id === 'plan_logic' && planEvidenceHookModel && planEvidenceHookModel.status !== 'unavailable' && (
              <div className="mt-2 pt-2 border-t border-[#2A2A35]/30">
                <div className="space-y-1.5">
                  {/* Status + confidence chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded border",
                      planEvidenceHookModel.status === 'read_only_connected'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {planEvidenceHookModel.status === 'read_only_connected' ? 'Plan evidence hook connected' : 'Waiting for logged evidence'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {planEvidenceHookModel.confidence} confidence
                    </span>
                  </div>
                  
                  {/* Evidence label */}
                  {planEvidenceHookModel.evidenceLabel && (
                    <div className="text-[9px] text-emerald-400/70">
                      {planEvidenceHookModel.evidenceLabel}
                    </div>
                  )}
                  
                  {/* Source quality */}
                  <div className="text-[9px] text-[#6A6A7A] italic">
                    {planEvidenceHookModel.sourceQualityLabel}
                  </div>
                  
                  {/* Missing evidence */}
                  {planEvidenceHookModel.missingEvidence.length > 0 && (
                    <div className="text-[9px] text-amber-400/60">
                      Missing: {planEvidenceHookModel.missingEvidence.slice(0, 3).join(', ')}
                    </div>
                  )}
                  
                  {/* Mutation lock */}
                  <div className="text-[9px] text-cyan-400/60">
                    No program or future sessions changed.
                  </div>
                </div>
              </div>
            )}
            
            {/* [MASTER-8C.28] Dynamic plan evidence trend/readiness proof */}
            {branch.id === 'plan_logic' && planEvidenceTrendReadinessModel && planEvidenceTrendReadinessModel.status !== 'unavailable' && (
              <div className="mt-1.5 pt-1.5 border-t border-[#2A2A35]/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400 border-violet-500/20">
                      {getClassificationLabel(planEvidenceTrendReadinessModel.classification)}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {getPostureLabel(planEvidenceTrendReadinessModel.readinessPosture)}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {planEvidenceTrendReadinessModel.confidence} confidence
                    </span>
                  </div>
                  <div className="text-[9px] text-violet-400/60">
                    Read-only scoring. No future-session mutation.
                  </div>
                </div>
              </div>
            )}
            
            {/* [MASTER-8C.29] Dynamic mutation-readiness review gate proof */}
            {branch.id === 'plan_logic' && mutationReadinessReviewGateModel && mutationReadinessReviewGateModel.status !== 'unavailable' && (
              <div className="mt-1.5 pt-1.5 border-t border-[#2A2A35]/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400 border-rose-500/20">
                      {getGateStatusLabel(mutationReadinessReviewGateModel.status)}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {mutationReadinessReviewGateModel.readinessLabel}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {mutationReadinessReviewGateModel.confidence} confidence
                    </span>
                  </div>
                  <div className="text-[9px] text-rose-400/60">
                    Read-only gate. Mutation locked.
                  </div>
                </div>
              </div>
            )}
            
            {/* [MASTER-8C.30] Dynamic mutation pathway readiness map proof */}
            {branch.id === 'plan_logic' && mutationPathwayReadinessMapModel && mutationPathwayReadinessMapModel.status !== 'unavailable' && (
              <div className="mt-1.5 pt-1.5 border-t border-[#2A2A35]/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      {getPathwayMapStatusLabel(mutationPathwayReadinessMapModel.status)}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      Next: {mutationPathwayReadinessMapModel.nextSafeGate}
                    </span>
                  </div>
                  <div className="text-[9px] text-indigo-400/60">
                    Controlled mutation locked.
                  </div>
                </div>
              </div>
            )}
            
            {/* [MASTER-8C.31] Dynamic target session resolution preview proof */}
            {branch.id === 'plan_logic' && mutationTargetSessionResolutionPreviewModel && mutationTargetSessionResolutionPreviewModel.status !== 'unavailable' && (
              <div className="mt-1.5 pt-1.5 border-t border-[#2A2A35]/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400 border-teal-500/20">
                      {getTargetResolutionStatusLabel(mutationTargetSessionResolutionPreviewModel.status)}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {mutationTargetSessionResolutionPreviewModel.futureSessionCount} future sessions
                    </span>
                    {(() => {
                      const idColor = getSessionIdentityStatusColor(
                        mutationTargetSessionResolutionPreviewModel.completedSessionIdentityStatus
                      )
                      return (
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", idColor.bg, idColor.text, idColor.border)}>
                          Identity: {getSessionIdentityStatusLabel(mutationTargetSessionResolutionPreviewModel.completedSessionIdentityStatus)}
                        </span>
                      )
                    })()}
                    {/* [MASTER-8C.33] Confirmation contract status chip */}
                    {mutationConfirmationContractPreviewModel && (
                      (() => {
                        const ccColor = getConfirmationContractStatusColor(
                          mutationConfirmationContractPreviewModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", ccColor.bg, ccColor.text, ccColor.border)}>
                            Confirm: {getConfirmationContractStatusLabel(mutationConfirmationContractPreviewModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.34] Caution clearance status chip */}
                    {mutationCautionClearanceGateModel && (
                      (() => {
                        const cautionColor = getMutationCautionClearanceStatusColor(
                          mutationCautionClearanceGateModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", cautionColor.bg, cautionColor.text, cautionColor.border)}>
                            Caution: {getMutationCautionClearanceStatusLabel(mutationCautionClearanceGateModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.35] Structural preview contract status chip */}
                    {structuralMutationPreviewContractModel && (
                      (() => {
                        const structColor = getStructuralPreviewContractStatusColor(
                          structuralMutationPreviewContractModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", structColor.bg, structColor.text, structColor.border)}>
                            Struct: {getStructuralPreviewContractStatusLabel(structuralMutationPreviewContractModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.36] User confirmation/marker permission status chip */}
                    {userConfirmationMarkerPermissionPreviewGateModel && (
                      (() => {
                        const permColor = getUserConfirmationMarkerPermissionStatusColor(
                          userConfirmationMarkerPermissionPreviewGateModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", permColor.bg, permColor.text, permColor.border)}>
                            Confirm: {getUserConfirmationMarkerPermissionStatusLabel(userConfirmationMarkerPermissionPreviewGateModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.37] Writer readiness boundary status chip */}
                    {futureSessionMutationWriterReadinessBoundaryModel && (
                      (() => {
                        const writerColor = getFutureSessionMutationWriterReadinessStatusColor(
                          futureSessionMutationWriterReadinessBoundaryModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", writerColor.bg, writerColor.text, writerColor.border)}>
                            Writer: {getFutureSessionMutationWriterReadinessStatusLabel(futureSessionMutationWriterReadinessBoundaryModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.38] Pre-mutation lock / bundle closure status chip */}
                    {preMutationLockBundleClosureModel && (
                      (() => {
                        const closureColor = getPreMutationLockBundleClosureStatusColor(
                          preMutationLockBundleClosureModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", closureColor.bg, closureColor.text, closureColor.border)}>
                            Bundle: {getPreMutationLockBundleClosureStatusLabel(preMutationLockBundleClosureModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.39] Controlled dry-run writer status chip */}
                    {controlledFutureSessionMutationWriterDryRunModel && (
                      (() => {
                        const dryRunColor = getControlledFutureSessionMutationWriterDryRunStatusColor(
                          controlledFutureSessionMutationWriterDryRunModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", dryRunColor.bg, dryRunColor.text, dryRunColor.border)}>
                            Dry-Run: {getControlledFutureSessionMutationWriterDryRunStatusLabel(controlledFutureSessionMutationWriterDryRunModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.40] Bounded apply eligibility gate status chip */}
                    {boundedMutationApplyEligibilityGateModel && (
                      (() => {
                        const applyGateColor = getBoundedMutationApplyEligibilityStatusColor(
                          boundedMutationApplyEligibilityGateModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", applyGateColor.bg, applyGateColor.text, applyGateColor.border)}>
                            Apply: {getBoundedMutationApplyEligibilityStatusLabel(boundedMutationApplyEligibilityGateModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.48] Marker-only confirmation boundary status chip */}
                    {markerOnlyConfirmationBoundaryModel && (
                      (() => {
                        const markerColor = getMarkerOnlyConfirmationBoundaryStatusColor(
                          markerOnlyConfirmationBoundaryModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", markerColor.bg, markerColor.text, markerColor.border)}>
                            Marker: {getMarkerOnlyConfirmationBoundaryStatusLabel(markerOnlyConfirmationBoundaryModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.48] Marker-save authorization preflight status chip */}
                    {markerSaveAuthorizationPreflightBoundaryModel && (
                      (() => {
                        const preflightColor = getMarkerSaveAuthorizationPreflightStatusColor(
                          markerSaveAuthorizationPreflightBoundaryModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", preflightColor.bg, preflightColor.text, preflightColor.border)}>
                            Auth: {getMarkerSaveAuthorizationPreflightStatusLabel(markerSaveAuthorizationPreflightBoundaryModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [MASTER-8C.48] Controlled marker-save action boundary status chip */}
                    {controlledMarkerSaveActionBoundaryModel && (
                      (() => {
                        const actionColor = getControlledMarkerSaveActionStatusColor(
                          controlledMarkerSaveActionBoundaryModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", actionColor.bg, actionColor.text, actionColor.border)}>
                            Action: {getControlledMarkerSaveActionStatusLabel(controlledMarkerSaveActionBoundaryModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [Prompt 21] Artifact preview status chip */}
                    {markerSaveArtifactPreviewModel && (
                      (() => {
                        const artifactColor = getMarkerSaveArtifactPreviewStatusColor(
                          markerSaveArtifactPreviewModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", artifactColor.bg, artifactColor.text, artifactColor.border)}>
                            Artifact: {getMarkerSaveArtifactPreviewStatusLabel(markerSaveArtifactPreviewModel.status)}
                          </span>
                        )
                      })()
                    )}
                    {/* [Prompt 22] Ledger status chip */}
                    {markerWriteReadinessLedgerModel && (
                      (() => {
                        const ledgerColor = getMarkerWriteReadinessLedgerStatusColor(
                          markerWriteReadinessLedgerModel.status
                        )
                        return (
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", ledgerColor.bg, ledgerColor.text, ledgerColor.border)}>
                            Ledger: {getMarkerWriteReadinessLedgerStatusLabel(markerWriteReadinessLedgerModel.status)}
                          </span>
                        )
                      })()
                    )}
                  </div>
                  {/* [P40] Dynamic marker saved proof display */}
                  <div className="text-[9px] text-teal-400/60">
                    {markerWriteReadinessLedgerModel && markerWriteReadinessLedgerModel.markerSavedCount > 0 ? (
                      <>
                        Local marker saved: {markerWriteReadinessLedgerModel.markerSavedCount}.{' '}
                        {durableMarkerReceiptReadinessModel?.status === 'persistence_candidate_ready_no_write' 
                          ? `Receipt candidate: ${durableMarkerReceiptReadinessModel.receiptCandidateCount}. `
                          : 'Receipt candidate: blocked. '
                        }
                        {controlledDurableMarkerReceiptWriterPreviewModel?.status === 'writer_contract_preview_ready_no_write'
                          ? `Writer contract: ${controlledDurableMarkerReceiptWriterPreviewModel.writerPreviewCandidateCount}. `
                          : 'Writer contract: blocked. '
                        }
                        {persistenceWriterActivationLockGateModel?.status === 'explicit_persistence_lock_engaged_no_write'
                          ? `Persistence lock: engaged (${persistenceWriterActivationLockGateModel.activationCandidateCount}). `
                          : 'Persistence lock: blocked. '
                        }
                        {controlledDurableMarkerReceiptWriterNoWriteHarnessModel?.status === 'dry_run_ready_persistence_disabled'
                          ? `No-write harness: ${controlledDurableMarkerReceiptWriterNoWriteHarnessModel.dryRunCandidateCount}. `
                          : 'No-write harness: blocked. '
                        }
                        {durableReceiptWriterEligibilityLedgerModel?.status === 'eligible_for_future_activation_review_persistence_disabled'
                          ? `Eligibility: ${durableReceiptWriterEligibilityLedgerModel.eligibilitySummary.satisfiedItems}/${durableReceiptWriterEligibilityLedgerModel.eligibilitySummary.totalItems} satisfied. `
                          : 'Eligibility: blocked. '
                        }
                        {durableReceiptWriterActivationPreconditionsReviewModel?.status === 'ready_for_explicit_activation_request_review_persistence_disabled'
                          ? `Preconditions: ${durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.satisfiedPreconditions}/${durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.totalPreconditions} satisfied. `
                          : 'Preconditions: blocked. '
                        }
                        {explicitPersistenceActivationRequestPreviewModel?.status === 'request_preview_ready_persistence_disabled'
                          ? `Request preview: ${explicitPersistenceActivationRequestPreviewModel.requestSummary.previewAvailableRequirements}/${explicitPersistenceActivationRequestPreviewModel.requestSummary.totalRequirements} available. `
                          : 'Request preview: blocked. '
                        }
                        {activationRequestAuthorizationLockModel?.status === 'authorization_lock_engaged_persistence_disabled'
                          ? `Auth lock: ${activationRequestAuthorizationLockModel.lockSummary.lockEngagedRequirements}/${activationRequestAuthorizationLockModel.lockSummary.totalRequirements} engaged. `
                          : 'Auth lock: not ready. '
                        }
                        {explicitActivationRequestIntentCapturePreviewModel?.status === 'intent_capture_preview_ready_persistence_disabled'
                          ? `Intent preview: ${explicitActivationRequestIntentCapturePreviewModel.previewSummary.sourceLockVerifiedRequirements}/${explicitActivationRequestIntentCapturePreviewModel.previewSummary.totalRequirements} verified. `
                          : 'Intent preview: not ready. '
                        }
                        {explicitActivationAuthorizationReviewPreviewModel?.status === 'authorization_review_preview_ready_persistence_disabled'
                          ? `Auth review: ${explicitActivationAuthorizationReviewPreviewModel.previewSummary.sourceIntentPreviewVerifiedRequirements}/${explicitActivationAuthorizationReviewPreviewModel.previewSummary.totalRequirements} verified. `
                          : 'Auth review: not ready. '
                        }
                        {controlledActivationPermissionBoundaryPreviewModel?.status === 'permission_boundary_preview_ready_persistence_disabled'
                          ? `Perm boundary: ${controlledActivationPermissionBoundaryPreviewModel.previewSummary.sourceAuthorizationReviewVerifiedBoundaries}/${controlledActivationPermissionBoundaryPreviewModel.previewSummary.totalBoundaries} verified. `
                          : 'Perm boundary: not ready. '
                        }
                        {explicitPersistenceActivationConsentPreviewModel?.status === 'consent_preview_ready_persistence_disabled'
                          ? `Consent: ${explicitPersistenceActivationConsentPreviewModel.previewSummary.sourcePermissionBoundaryVerifiedRequirements}/${explicitPersistenceActivationConsentPreviewModel.previewSummary.totalRequirements} verified. `
                          : 'Consent: not ready. '
                        }
                        {consentAuthorizationLockPreviewModel?.status === 'consent_authorization_locked_persistence_disabled'
                          ? `Auth lock: ${consentAuthorizationLockPreviewModel.lockSummary.authorizationLockedItems}/${consentAuthorizationLockPreviewModel.lockSummary.totalLockItems} locked. `
                          : 'Auth lock: not ready. '
                        }
                        {consentDecisionStatePreviewModel?.status === 'consent_decision_state_preview_ready_persistence_disabled'
                          ? `Decision: ${consentDecisionStatePreviewModel.decisionSummary.totalBranches} branches, no decision. `
                          : 'Decision: not ready. '
                        }
                        {consentDecisionReviewLockPreviewModel?.status === 'consent_decision_review_locked_persistence_disabled'
                          ? `Review: ${consentDecisionReviewLockPreviewModel.reviewLockSummary.totalItems} items locked. `
                          : 'Review: not ready. '
                        }
                        {consentPermissionBoundaryPreviewModel?.status === 'consent_permission_boundary_ready_persistence_disabled'
                          ? `Permission: ${consentPermissionBoundaryPreviewModel.permissionBoundarySummary.totalItems} items, not granted. `
                          : 'Permission: not ready. '
                        }
                        {persistencePermissionReviewPreviewModel?.status === 'persistence_permission_review_ready_persistence_disabled'
                          ? `Persistence: ${persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.totalItems} items reviewed, not granted. `
                          : 'Persistence: not ready. '
                        }
                        {persistenceWritePreflightPreviewModel?.status === 'persistence_write_preflight_ready_but_blocked_persistence_disabled'
                          ? `Preflight: ${persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.totalItems} items, blocked. `
                          : 'Preflight: not ready. '
                        }
                        No receipt written. No write attempted. No workout changes.
                      </>
                    ) : (
                      <>
                        Read-only target mapping. No mutation.{' '}
                        {mutationConfirmationContractPreviewModel?.noMarkerSaved && 'No marker saved. '}
                        {markerOnlyConfirmationBoundaryModel?.noMarkerSaved && 'Marker locked. '}
                        {controlledMarkerSaveActionBoundaryModel && !controlledMarkerSaveActionBoundaryModel.canExecuteMarkerSave && 'Action locked. '}
                        {markerSaveArtifactPreviewModel && !markerSaveArtifactPreviewModel.canPreviewMarkerArtifact && 'Artifact preview blocked. '}
                        {markerWriteReadinessLedgerModel && !markerWriteReadinessLedgerModel.canWriteMarker && 'Persistence locked.'}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-[9px] text-cyan-400/70 mt-1.5">
              Next: {branch.nextSafeAction}
            </p>
          </div>
        ))}
      </div>
      
      {/* Set/Volume rationale note - MASTER-8C.17 updated */}
      <div className="px-4 py-3 bg-[#0F0F12] border-t border-[#2A2A35]">
        <div className="flex items-start gap-2">
          <Info className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-[9px] text-[#8A8A9A] leading-relaxed">
            <span className="text-emerald-400">Set/Volume Prescription Rationale</span> now has a read-only analyzer 
            that explains why rows get 3/4/5+ sets based on role, progression, method context, and RPE/rest. 
            Current set counts are unchanged - this is explanation only.
          </p>
        </div>
      </div>
      
      {/* [MASTER-8C.18.1] Prehab/Rehab/Tendon Safeguard note - shortened since dynamic proof is in row */}
      <div className="px-4 py-2 bg-[#0F0F12] border-t border-[#2A2A35]">
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-cyan-400 flex-shrink-0" />
          <p className="text-[9px] text-[#6A6A7A]">
            Prehab/Rehab/Tendon Safeguards is read-only. Substitutions and workout changes remain locked.
          </p>
        </div>
      </div>
      
      {/* Expand/collapse toggle */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-2 text-[10px] text-cyan-400 hover:bg-[#1F1F27] transition-colors border-t border-[#2A2A35]"
        >
          Show all {summary.total} branches
        </button>
      )}
    </div>
  )
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
// [MASTER-8C.13] SUPERSET STRUCTURAL CONTROLS
// =============================================================================

/**
 * [MASTER-8C.13 / MASTER-8C.14F] Superset structural preview and apply controls.
 * Shows candidate pairs, full day context, and allows applying safe pairs.
 * [MASTER-8C.14F] Now shows native/generated superset status.
 */
function SupersetStructuralControls({
  program,
  onApplyFrequencyPlacement,
}: {
  program: unknown
  onApplyFrequencyPlacement: (preview: FrequencySlotPlacementPreview) => Promise<FrequencyPlacementApplyResult>
}) {
  const [supersetPreview, setSupersetPreview] = useState<SupersetStructuralPreview | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<SupersetCandidate | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<SupersetApplyResult | null>(null)
  
  // [MASTER-8C.14F] Check for existing native supersets in program
  const nativeSupersets = useMemo(() => {
    const prog = program as { sessions?: Array<{ styleMetadata?: { styledGroups?: Array<{ groupType?: string; source?: string; methodOverrideApplied?: boolean; id?: string; exercises?: Array<{ name?: string }> }> } }> } | null
    const results: Array<{ dayNumber: number; exerciseNames: string[] }> = []
    
    prog?.sessions?.forEach((session, idx) => {
      const groups = session?.styleMetadata?.styledGroups ?? []
      groups.forEach(group => {
        // Native = superset type but NOT method override planner applied
        if (group.groupType === 'superset' && 
            group.source !== 'method_override_planner' && 
            group.methodOverrideApplied !== true &&
            !group.id?.startsWith('method-override-superset-')) {
          results.push({
            dayNumber: idx + 1,
            exerciseNames: group.exercises?.map(e => e.name || 'Unknown') || [],
          })
        }
      })
    })
    
    return results
  }, [program])
  
  // Build superset candidates on mount
  useEffect(() => {
    if (program) {
      const preview = buildSupersetStructuralCandidates(program)
      setSupersetPreview(preview)
      // Auto-select first safe candidate
      const firstSafe = preview.candidates.find(c => 
        c.status === 'safe_apply' || c.status === 'caution_apply_requires_confirmation'
      )
      if (firstSafe) {
        setSelectedCandidate(firstSafe)
      }
    }
  }, [program])
  
  const handleApply = async () => {
    if (!selectedCandidate || !program) return
    
    setIsApplying(true)
    try {
      const result = applySupersetStructuralCandidate(program, selectedCandidate)
      setApplyResult(result)
      
      if (result.status === 'success' && result.updatedProgram) {
        // Use the frequency placement callback to persist
        // We create a minimal preview to pass through
        await onApplyFrequencyPlacement({
          methodKey: 'superset' as CanonicalMethodFamily,
          displayLabel: 'Superset',
          requestedFrequency: 1,
          actualPlacementCount: 1,
          targets: [],
          status: 'ready_to_apply',
          warnings: [],
          blockedReasons: [],
          proofLines: result.evidence as string[],
          // Pass the updated program through evidence for the parent to use
          _supersetApplyResult: result,
        } as unknown as FrequencySlotPlacementPreview)
      }
    } finally {
      setIsApplying(false)
    }
  }
  
  if (!supersetPreview) {
    return (
      <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-[#6A6A7A] animate-spin" />
          <span className="text-[10px] text-[#8A8A9A]">Scanning for superset pairs...</span>
        </div>
      </div>
    )
  }
  
  const hasCandidates = supersetPreview.status === 'has_candidates'
  const safeCandidates = supersetPreview.candidates.filter(c => 
    c.status === 'safe_apply' || c.status === 'caution_apply_requires_confirmation'
  )
  
  return (
    <div className="p-3 rounded-lg bg-[#1A1A22] border border-[#2A2A35]">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-medium text-[#E6E9EF]">Superset Pair Preview</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Structural
        </span>
      </div>
      
      {/* [MASTER-8C.14F / MASTER-8C.15.1C] Native superset info */}
      {nativeSupersets.length > 0 && (
        <div className="mb-3 p-2 rounded bg-[#0F0F12] border border-[#2A2A35]/50">
          <div className="flex items-center gap-2 mb-1.5">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400">Native Generated</span>
          </div>
          <p className="text-[9px] text-[#8A8A9A] mb-2">
            Already included from generated program. Native method is protected.
          </p>
          <div className="space-y-1">
            {nativeSupersets.map((ns, i) => (
              <div key={i} className="text-[9px] text-[#6A6A7A]">
                Day {ns.dayNumber}: {ns.exerciseNames.join(' + ')}
              </div>
            ))}
          </div>
          {/* [MASTER-8C.15.1C] Additive note */}
          <p className="text-[9px] text-cyan-400/70 mt-2 pt-2 border-t border-[#2A2A35]/50">
            You can add extra superset pairs below. Extra additions are removable; the native method will remain.
          </p>
        </div>
      )}
      
      {/* Apply result banner */}
      {applyResult && (
        <div className={cn(
          'mb-3 p-2 rounded text-[10px]',
          applyResult.status === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        )}>
          {applyResult.visibleSummary}
        </div>
      )}
      
      {/* Status summary */}
      <p className="text-[10px] text-[#8A8A9A] mb-3">
        {supersetPreview.summary}
      </p>
      
      {/* [MASTER-8C.15.1C] Updated messaging for native additive context */}
      {!hasCandidates ? (
        <p className="text-[10px] text-amber-400/80">
          {supersetPreview.status === 'all_blocked' 
            ? 'All potential pairs blocked by safety gates.'
            : nativeSupersets.length > 0
              ? 'No additional safe superset pairs available. Native method remains active.'
              : 'No eligible exercise pairs found for superset.'}
        </p>
      ) : (
        <div className="space-y-3">
          {/* Candidate selector */}
          {safeCandidates.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {safeCandidates.map((candidate, idx) => (
                <button
                  key={candidate.id}
                  onClick={() => { setSelectedCandidate(candidate); setApplyResult(null); }}
                  className={cn(
                    'px-2.5 py-1 text-[10px] rounded border transition-colors',
                    selectedCandidate?.id === candidate.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-[#2A2A35] text-[#8A8A9A] border-[#3A3A4A] hover:border-[#4A4A5A]'
                  )}
                >
                  Day {candidate.dayNumber}
                </button>
              ))}
            </div>
          )}
          
          {/* Selected candidate preview */}
          {selectedCandidate && (
            <SupersetCandidateCard 
              candidate={selectedCandidate}
              isExpanded={true}
            />
          )}
          
          {/* Apply button */}
          {selectedCandidate && (selectedCandidate.status === 'safe_apply' || selectedCandidate.status === 'caution_apply_requires_confirmation') && (
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isApplying || applyResult?.status === 'success'}
              className="w-full mt-2 h-8 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Applying...
                </>
              ) : applyResult?.status === 'success' ? (
                <>
                  <Check className="w-3 h-3 mr-1.5" />
                  Applied
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1.5" />
                  Apply Superset to Day {selectedCandidate.dayNumber}
                </>
              )}
            </Button>
          )}
          
          {/* Caution warning */}
          {selectedCandidate?.status === 'caution_apply_requires_confirmation' && (
            <p className="text-[9px] text-amber-400/80 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              Caution: {selectedCandidate.riskReasons.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * [MASTER-8C.13] Superset candidate preview card with full day context
 */
function SupersetCandidateCard({
  candidate,
  isExpanded: defaultExpanded = false,
}: {
  candidate: SupersetCandidate
  isExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <div className="rounded-lg bg-[#0F0F12] border border-[#2A2A35] overflow-hidden">
      {/* Compact header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-2 text-left hover:bg-[#1A1A22]/50 transition-colors"
      >
        <span className="text-[9px] font-medium text-emerald-400 shrink-0 min-w-[40px]">
          Day {candidate.dayNumber}
        </span>
        <span className="text-[10px] text-[#E6E9EF] truncate flex-1">
          {candidate.exerciseA.name} + {candidate.exerciseB.name}
        </span>
        <span className={cn(
          'text-[9px] px-1.5 py-0.5 rounded shrink-0',
          candidate.status === 'safe_apply'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : candidate.status === 'caution_apply_requires_confirmation'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
        )}>
          {candidate.status === 'safe_apply' ? 'Safe' : 
           candidate.status === 'caution_apply_requires_confirmation' ? 'Caution' : 'Blocked'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-[#6A6A7A] shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[#6A6A7A] shrink-0" />
        )}
      </button>
      
      {/* Expanded preview */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-3 border-t border-[#2A2A35]/50">
          {/* Session label */}
          <div className="pt-2 flex items-center gap-2">
            <Target className="w-3 h-3 text-[#6A6A7A]" />
            <span className="text-[9px] text-[#8A8A9A]">{candidate.sessionLabel}</span>
          </div>
          
          {/* Superset pair highlight - A1/A2 */}
          <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-medium text-emerald-400">Superset Pair</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-emerald-400 font-medium w-5">A1</span>
                <span className="text-[#E6E9EF]">{candidate.exerciseA.name}</span>
                {candidate.exerciseA.setCount && (
                  <span className="text-[#6A6A7A]">({candidate.exerciseA.setCount} sets)</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-emerald-400 font-medium w-5">A2</span>
                <span className="text-[#E6E9EF]">{candidate.exerciseB.name}</span>
                {candidate.exerciseB.setCount && (
                  <span className="text-[#6A6A7A]">({candidate.exerciseB.setCount} sets)</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Ordered day context */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="w-3 h-3 text-[#6A6A7A]" />
              <span className="text-[9px] font-medium text-[#8A8A9A]">Workout order</span>
            </div>
            <div className="space-y-0.5 pl-1 border-l border-[#2A2A35]">
              {candidate.orderedDayRows.map((row, idx) => (
                <div
                  key={row.exerciseId || idx}
                  className={cn(
                    'flex items-center gap-2 py-1 px-2 rounded text-[9px]',
                    row.isPartOfPair 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-transparent'
                  )}
                >
                  <span className="text-[#5A5A6A] shrink-0 w-4">{row.position}.</span>
                  <span className={cn(
                    'truncate flex-1',
                    row.isPartOfPair ? 'text-emerald-400 font-medium' : 'text-[#8A8A9A]'
                  )}>
                    {row.exerciseName}
                  </span>
                  {row.isPartOfPair && (
                    <span className="text-emerald-400 shrink-0">
                      {row.exerciseId === candidate.exerciseA.id ? 'A1' : 'A2'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Workout effect */}
          <div className="p-2 rounded bg-[#1A1A22] border border-[#2A2A35]/50">
            <p className="text-[9px] text-[#9A9AAA] leading-relaxed">
              {candidate.workoutEffectSummary}
            </p>
            <p className="text-[9px] text-[#6A6A7A] mt-1">
              Rest: {candidate.restProtocol}
            </p>
          </div>
          
          {/* Compatibility reasons */}
          {candidate.compatibilityReasons.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {candidate.compatibilityReasons.map((reason, i) => (
                <span 
                  key={i}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
          
          {/* Risk reasons if any */}
          {candidate.riskReasons.length > 0 && (
            <div className="space-y-0.5">
              {candidate.riskReasons.map((reason, i) => (
                <p key={i} className="text-[9px] text-amber-400/70 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {reason}
                </p>
              ))}
            </div>
          )}
          
          {/* Confidence and paired rounds */}
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-[9px] px-1.5 py-0.5 rounded',
              candidate.confidence === 'high' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            )}>
              {candidate.confidence} confidence
            </span>
            {candidate.pairedRounds && (
              <span className="text-[9px] text-[#6A6A7A]">
                {candidate.pairedRounds} paired rounds
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
  const { dayInsertionPreview } = target
  
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
      
      {/* Expanded full-day insertion preview */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-3 border-t border-[#2A2A35]/50">
          {/* Session focus header */}
          <div className="pt-2 flex items-center gap-2">
            <Target className="w-3 h-3 text-[#6A6A7A]" />
            <span className="text-[9px] text-[#8A8A9A]">{dayInsertionPreview.sessionLabel}</span>
          </div>
          
          {/* [MASTER-8C.12.3] Inserted into workout - ordered rows */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="w-3 h-3 text-[#6A6A7A]" />
              <span className="text-[9px] font-medium text-[#8A8A9A]">Inserted into workout</span>
            </div>
            <div className="space-y-0.5 pl-1 border-l border-[#2A2A35]">
              {dayInsertionPreview.orderedRows.map((row, idx) => (
                <div
                  key={row.exerciseId || idx}
                  className={cn(
                    'flex items-center gap-2 py-1 px-2 rounded text-[9px]',
                    row.isTarget 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-transparent'
                  )}
                >
                  <span className="text-[#5A5A6A] shrink-0 w-4">{row.position}.</span>
                  <span className={cn(
                    'truncate flex-1',
                    row.isTarget ? 'text-emerald-400 font-medium' : 'text-[#8A8A9A]'
                  )}>
                    {row.exerciseName}
                  </span>
                  {row.isTarget ? (
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-[#6A6A7A]">{row.beforeMethodLabel}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">{methodLabel}</span>
                    </span>
                  ) : row.existingMethodLabel ? (
                    <span className="text-amber-400/70 shrink-0">{row.existingMethodLabel}</span>
                  ) : (
                    <span className="text-[#5A5A6A] shrink-0">{row.beforeMethodLabel}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Workout effect summary */}
          <div className="p-2 rounded bg-[#1A1A22] border border-[#2A2A35]/50">
            <p className="text-[9px] text-[#9A9AAA] leading-relaxed">
              {dayInsertionPreview.workoutBlendSummary}
            </p>
          </div>
          
          {/* Day fit reasons */}
          {dayInsertionPreview.dayFitReasons.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] text-[#6A6A7A]">Why this day/row:</span>
              <div className="flex flex-wrap gap-1">
                {dayInsertionPreview.dayFitReasons.map((reason, i) => (
                  <span 
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Caution reasons if any */}
          {dayInsertionPreview.dayCautionReasons.length > 0 && (
            <div className="space-y-0.5">
              {dayInsertionPreview.dayCautionReasons.map((reason, i) => (
                <p key={i} className="text-[9px] text-amber-400/70 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {reason}
                </p>
              ))}
            </div>
          )}
          
          {/* Confidence badge and method load */}
          <div className="flex items-center gap-2">
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
            {target.isFirstPlacementOnDay ? (
              <span className="text-[9px] text-emerald-400/70 flex items-center gap-1">
                <Check className="w-3 h-3" />
                First method on day
              </span>
            ) : (
              <span className="text-[9px] text-amber-400/70">
                Stacked ({target.dayMethodLoad} existing)
              </span>
            )}
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
  /** [MASTER-8C.15.1B] Whether this method is native/generated (affects UI labeling) */
  isNativeMaterialized?: boolean
}

/**
 * [MASTER-8C.12.1A / MASTER-8C.15.1B] Method-specific frequency controls inside method detail view.
 * This allows users to select frequency and preview targets for a single selected method.
 * Replaces the need to use the standalone frequency list for row-level methods.
 * [MASTER-8C.15.1B] Now supports native methods - shows additive controls with proper labeling.
 */
function MethodDetailFrequencyControls({
  program,
  methodKey,
  methodLabel,
  onApplyFrequencyPlacement,
  isNativeMaterialized = false,
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
  
  // [MASTER-8C.13] Superset uses structural preview, not row-level frequency
  if (methodKey === 'superset') {
    return (
      <SupersetStructuralControls
        program={program}
        onApplyFrequencyPlacement={onApplyFrequencyPlacement}
      />
    )
  }
  
  // If method is blocked, show compact message
  if (isBlocked) {
    const isStructuralMethod = ['circuit', 'density_block'].includes(methodKey)
    
    // [MASTER-8C.12.1E] Method-specific messaging for structural methods
    const getStructuralMessage = () => {
      if (methodKey === 'circuit') {
        return `Circuits use the structural Method Planner apply flow above, not row-level frequency placement.`
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
        <span className="text-[10px] font-medium text-[#E6E9EF]">
          {isNativeMaterialized ? 'Add Extra Frequency' : 'Add Weekly Frequency'}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {isNativeMaterialized ? 'Additive' : 'Row-level'}
        </span>
      </div>
      
      {/* [MASTER-8C.15.1B] Native method note */}
      {isNativeMaterialized && (
        <p className="text-[9px] text-[#6A6A7A] mb-3 leading-relaxed">
          Native method is protected. Extra additions are removable; the base method will remain.
        </p>
      )}
      
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
          {/* [MASTER-8C.14F] User-applied only note */}
          <p className="text-[9px] text-[#6A6A7A] px-2 py-1 rounded bg-[#0F0F12] border border-[#2A2A35]/50">
            User-applied additions only. Native generated methods are preserved and not listed here.
          </p>
          
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
                    {/* [MASTER-8C.14F] Provenance label */}
                    {placement.isGrouped ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Grouped
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        Row
                      </span>
                    )}
                    <span className="text-[9px] text-[#6A6A7A]">User Applied</span>
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
  
  // [MASTER-8C.18.1] Prehab/Rehab/Tendon Safeguard Read-Only Analysis
  // Builds input from program sessions and calls the deterministic analyzer
  const safeguardAnalysisResult = useMemo<PrehabRehabTendonSafeguardReadonlyModel | null>(() => {
    try {
      if (!program?.sessions?.length) return null
      
      // Resolve adaptive foundation model to get existing safeguard intelligence
      const { model: adaptiveFoundationModel } = resolveVisibleAdaptiveFoundation(program)
      
      // Build analyzer input from current program sessions
      const analyzerInput: PrehabRehabTendonSafeguardReadonlyInput = {
        programId: program.id,
        programName: program.goalLabel, // AdaptiveProgram uses goalLabel, not name
        sessions: program.sessions.map(session => ({
          dayLabel: session.dayLabel || `Day ${session.dayNumber}`,
          dayNumber: session.dayNumber,
          dayRole: session.focus || session.focusLabel, // AdaptiveSession uses focus/focusLabel
          exercises: session.exercises?.map(ex => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.repsOrTime, // AdaptiveExercise uses repsOrTime, not reps
            hold: undefined, // Hold is included in repsOrTime for isometric exercises
            targetRPE: ex.targetRPE,
            restSeconds: ex.restSeconds,
            role: ex.category,
            category: ex.category,
            methodContext: ex.method, // AdaptiveExercise uses method, not methodGrouping
          })) || [],
        })),
        selectedSkills: selectedSkillRepresentations.map(r => r.skill), // Uses skill, not skillId
        existingSafeguardIntelligence: adaptiveFoundationModel?.safeguardIntelligence,
      }
      
      return resolvePrehabRehabTendonSafeguardReadonly(analyzerInput)
    } catch (error) {
      // Safe fallback - never crash the hub
      console.error('[v0] Safeguard analysis error:', error)
      return null
    }
  }, [program, selectedSkillRepresentations])
  
  // [MASTER-8C.19] Recovery / Readiness Read-Only Analysis
  // Builds input from program sessions, adaptive foundation, and program balance
  const recoveryReadinessResult = useMemo<RecoveryReadinessReadonlyModel | null>(() => {
    try {
      if (!program?.sessions?.length) return null
      
      // Resolve adaptive foundation model for recovery signals
      const { model: adaptiveFoundationModel } = resolveVisibleAdaptiveFoundation(program)
      
      // Build session inputs with recovery-relevant metrics
      const sessionInputs: RecoveryReadinessSessionInput[] = program.sessions.map(session => {
        const exercises = session.exercises || []
        const totalSets = exercises.reduce((sum: number, ex) => sum + (ex.sets || 0), 0)
        
        const hasHighSkill = exercises.some(ex => {
          const name = (ex.name || '').toLowerCase()
          return ['planche', 'lever', 'handstand', 'muscle up', 'muscle-up',
            'iron cross', 'maltese', 'victorian', 'one arm', 'one-arm',
            'flag', 'l-sit', 'v-sit', 'manna'].some(kw => name.includes(kw))
        })
        
        const hasTendonHeavy = exercises.some(ex => {
          const name = (ex.name || '').toLowerCase()
          return ['planche', 'lever', 'maltese', 'iron cross', 'victorian',
            'straight arm', 'cross pull', 'pelican', 'ring'].some(kw => name.includes(kw))
        })
        
        // Collect method strings, filtering out undefined and standard
        const methodStrings: string[] = []
        for (const ex of exercises) {
          if (ex.method) {
            const methodStr = String(ex.method)
            if (methodStr !== 'standard') {
              methodStrings.push(methodStr)
            }
          }
        }
        
        return {
          dayLabel: session.dayLabel || `Day ${session.dayNumber}`,
          dayNumber: session.dayNumber,
          dayRole: session.focus || session.focusLabel,
          exerciseCount: exercises.length,
          totalSets,
          hasHighSkillExercises: hasHighSkill,
          hasTendonHeavyExercises: hasTendonHeavy,
          methodsApplied: methodStrings,
        }
      })
      
      // Build adaptive foundation source status from boolean flags
      const sourceStatusArray = adaptiveFoundationModel?.sourceStatus
        ? [
            { key: 'profile_truth', label: 'Profile truth', status: adaptiveFoundationModel.sourceStatus.hasProfileTruth ? 'active' : 'missing', detail: '' },
            { key: 'selected_skills', label: 'Selected skills', status: adaptiveFoundationModel.sourceStatus.hasSelectedSkills ? 'active' : 'missing', detail: '' },
            { key: 'workout_evidence', label: 'Workout evidence', status: adaptiveFoundationModel.sourceStatus.hasWorkoutEvidence ? 'active' : 'missing', detail: '' },
            { key: 'readiness_recovery', label: 'Readiness/recovery', status: adaptiveFoundationModel.sourceStatus.hasReadinessEvidence ? 'active' : 'missing', detail: '' },
            { key: 'constraint_evidence', label: 'Constraint evidence', status: adaptiveFoundationModel.sourceStatus.hasConstraintEvidence ? 'active' : 'missing', detail: '' },
          ]
        : undefined
      
      // Extract constraint data (AdaptiveConstraintSummary uses explanation, not detail)
      const constraints = adaptiveFoundationModel?.constraints?.map(c => ({
        code: c.code || '',
        label: c.label || '',
        severity: String(c.severity || 'unknown'),
        category: String(c.category || ''),
        detail: c.explanation || '',
      }))
      
      // Get safeguard risk level from the safeguard analysis
      const safeguardRisk = safeguardAnalysisResult?.riskLevel
      
      // Get tissue signals from program balance findings (ProgramBalanceFinding has title/type, not area/category)
      const tissueSignals = programBalanceResult?.findings
        ?.filter(f => f.title)
        .slice(0, 5)
        .map(f => ({
          area: f.title || f.type || 'unknown',
          riskLevel: f.severity === 'high' ? 'high' : f.severity === 'moderate' ? 'elevated' : 'low',
        }))
      
      // Check if completed workout evidence exists in evidence snapshot
      const hasCompletedEvidence = !!(
        adaptiveFoundationModel?.evidenceSnapshot?.completedWorkoutEvidence?.completedSessionCount &&
        adaptiveFoundationModel.evidenceSnapshot.completedWorkoutEvidence.completedSessionCount > 0
      )
      
      return resolveRecoveryReadinessReadonly({
        programId: program.id,
        programName: program.goalLabel,
        sessions: sessionInputs,
        adaptiveFoundationSourceStatus: sourceStatusArray,
        constraints,
        dominantLimiters: adaptiveFoundationModel?.dominantLimiters,
        readinessStatus: null,
        programBalanceTissueSignals: tissueSignals,
        hasCompletedWorkoutEvidence: hasCompletedEvidence,
        hasWorkoutHistory: adaptiveFoundationModel?.sourceStatus?.hasWorkoutEvidence ?? false,
        hasReadinessCheckIn: adaptiveFoundationModel?.sourceStatus?.hasReadinessEvidence ?? false,
        safeguardRiskLevel: safeguardRisk,
      })
    } catch (error) {
      console.error('[v0] Recovery readiness analysis error:', error)
      return null
    }
  }, [program, safeguardAnalysisResult, programBalanceResult, selectedSkillRepresentations])
  
  // [MASTER-8C.20] Exercise Knowledge Coverage Read-Only Analysis
  // Builds deduplicated exercise list from program sessions and resolves coverage
  const exerciseKnowledgeCoverageResult = useMemo<ExerciseKnowledgeCoverageReadonlyModel | null>(() => {
    try {
      if (!program?.sessions?.length) return null
      
      // Extract and deduplicate exercises from all sessions
      const seenIds = new Set<string>()
      const uniqueExercises: { id: string; name: string }[] = []
      
      for (const session of program.sessions) {
        for (const exercise of (session.exercises || [])) {
          const exId = exercise.id || exercise.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || ''
          if (exId && !seenIds.has(exId)) {
            seenIds.add(exId)
            uniqueExercises.push({ id: exId, name: exercise.name || exId })
          }
        }
      }
      
      if (uniqueExercises.length === 0) return null
      
      return resolveExerciseKnowledgeCoverage({ exercises: uniqueExercises })
    } catch (error) {
      console.error('[v0] Exercise knowledge coverage error:', error)
      return null
    }
  }, [program])
  
  // [MASTER-8C.21] Progression / Periodization Read-Only Analysis
  // Combines all existing branch results into a progression posture assessment
  const progressionPeriodizationResult = useMemo<ProgressionPeriodizationReadonlyModel | null>(() => {
    try {
      if (!program?.sessions?.length) return null
      
      const { model: adaptiveFoundationModel } = resolveVisibleAdaptiveFoundation(program)
      
      const hasCompletedEvidence = !!(
        adaptiveFoundationModel?.evidenceSnapshot?.completedWorkoutEvidence?.completedSessionCount &&
        adaptiveFoundationModel.evidenceSnapshot.completedWorkoutEvidence.completedSessionCount > 0
      )
      
      return resolveProgressionPeriodization({
        sessions: program.sessions.map(s => ({
          dayNumber: s.dayNumber,
          dayLabel: s.dayLabel,
          focus: s.focus,
          focusLabel: s.focusLabel,
          isProtectedRecoveryWeek: s.recoveryCost === 'VERY_HIGH' || s.stressLevel === 'LOW',
          exercises: (s.exercises || []).map(ex => ({
            name: ex.name,
            id: ex.id,
            sets: ex.sets,
            method: ex.method,
            prescriptionUnit: ex.repsOrTime?.includes('s') ? 'seconds' : 'reps',
          })),
        })),
        weekNumber: program.weekNumber,
        goalLabel: program.goalLabel,
        recoveryModel: recoveryReadinessResult ? {
          readinessLevel: recoveryReadinessResult.readinessLevel,
          confidence: recoveryReadinessResult.confidence,
          signals: recoveryReadinessResult.signals,
        } : null,
        safeguardModel: safeguardAnalysisResult ? {
          riskLevel: safeguardAnalysisResult.riskLevel,
          confidence: safeguardAnalysisResult.confidence,
        } : null,
        exerciseKnowledgeModel: exerciseKnowledgeCoverageResult ? {
          coverageRatio: exerciseKnowledgeCoverageResult.coverageRatio,
          totalExerciseCount: exerciseKnowledgeCoverageResult.totalExerciseCount,
          fullScienceKnownCount: exerciseKnowledgeCoverageResult.fullScienceKnownCount,
          trulyUnknownCount: exerciseKnowledgeCoverageResult.trulyUnknownCount,
        } : null,
        balanceModel: programBalanceResult ? {
          status: programBalanceResult.status,
          findings: programBalanceResult.findings,
        } : null,
        hasCompletedWorkoutEvidence: hasCompletedEvidence,
        hasWorkoutHistory: adaptiveFoundationModel?.sourceStatus?.hasWorkoutEvidence ?? false,
      })
    } catch (error) {
      console.error('[v0] Progression periodization analysis error:', error)
      return null
    }
  }, [program, recoveryReadinessResult, safeguardAnalysisResult, exerciseKnowledgeCoverageResult, programBalanceResult])
  
  // [MASTER-8C.22] Coach Recommendation Candidate Read-Only Analysis
  // [MASTER-8C.24] Enhanced with structured workout evidence bridge
  // [MASTER-8C.28] Evidence summary lifted to separate memo for trend readiness reuse
  // Combines all existing source branch results + local workout evidence into recommendation candidates
  
  // [MASTER-8C.28] Lift workout evidence summary so trend readiness can reuse it without duplicate reads
  const workoutEvidenceSummary = useMemo(() => {
    try {
      const recentLogs = getRecentWorkoutLogsForGenerationRequest()
      return resolveCoachRecsWorkoutEvidenceSummary(recentLogs)
    } catch {
      return null
    }
  }, [program])
  
  const coachRecommendationCandidateResult = useMemo<CoachRecommendationCandidateReadonlyModel | null>(() => {
    try {
      if (!program?.sessions?.length) return null
      
      const { model: adaptiveFoundationModel } = resolveVisibleAdaptiveFoundation(program)
      
      const hasCompletedEvidence = !!(
        adaptiveFoundationModel?.evidenceSnapshot?.completedWorkoutEvidence?.completedSessionCount &&
        adaptiveFoundationModel.evidenceSnapshot.completedWorkoutEvidence.completedSessionCount > 0
      )
      
      // [MASTER-8C.24] Build structured evidence summary from local trusted workout logs
      // [MASTER-8C.28] Now uses lifted workoutEvidenceSummary memo (no duplicate reads)
      
      return resolveCoachRecommendationCandidates({
        recoveryModel: recoveryReadinessResult ? {
          readinessLevel: recoveryReadinessResult.readinessLevel,
          confidence: recoveryReadinessResult.confidence,
          signals: recoveryReadinessResult.signals,
        } : null,
        safeguardModel: safeguardAnalysisResult ? {
          riskLevel: safeguardAnalysisResult.riskLevel,
          confidence: safeguardAnalysisResult.confidence,
          signals: safeguardAnalysisResult.detectedSignals,
        } : null,
        exerciseKnowledgeModel: exerciseKnowledgeCoverageResult ? {
          coverageRatio: exerciseKnowledgeCoverageResult.coverageRatio,
          totalExerciseCount: exerciseKnowledgeCoverageResult.totalExerciseCount,
          fullScienceKnownCount: exerciseKnowledgeCoverageResult.fullScienceKnownCount,
          trulyUnknownCount: exerciseKnowledgeCoverageResult.trulyUnknownCount,
        } : null,
        progressionModel: progressionPeriodizationResult ? {
          posture: progressionPeriodizationResult.posture,
          progressionDirection: progressionPeriodizationResult.progressionDirection,
          confidence: progressionPeriodizationResult.confidence,
          signals: progressionPeriodizationResult.signals,
        } : null,
        balanceModel: programBalanceResult ? {
          status: programBalanceResult.status,
          findings: programBalanceResult.findings,
        } : null,
        hasCompletedWorkoutEvidence: hasCompletedEvidence,
        hasWorkoutHistory: adaptiveFoundationModel?.sourceStatus?.hasWorkoutEvidence ?? false,
        sessionCount: program.sessions.length,
        workoutEvidenceSummary,
      })
    } catch (error) {
      console.error('[v0] Coach recommendation candidate error:', error)
      return null
    }
  }, [program, recoveryReadinessResult, safeguardAnalysisResult, exerciseKnowledgeCoverageResult, progressionPeriodizationResult, programBalanceResult, workoutEvidenceSummary])
  
  // [MASTER-8C.27] Plan Evidence Read-Only Hook �� translates Coach Recs evidence into Plan Logic-visible proof
  const planEvidenceHookModel = useMemo<PlanEvidenceReadonlyHookModel>(() => {
    return resolvePlanEvidenceReadonlyHook({
      coachRecommendationCandidateModel: coachRecommendationCandidateResult,
    })
  }, [coachRecommendationCandidateResult])
  
  // [MASTER-8C.28] Evidence Trend Classification / Plan-Level Readiness Scoring
  const planEvidenceTrendReadinessModel = useMemo<PlanEvidenceTrendReadinessModel>(() => {
    return resolvePlanEvidenceTrendReadiness({
      planEvidenceHookModel,
      workoutEvidenceSummary,
    })
  }, [planEvidenceHookModel, workoutEvidenceSummary])
  
  // [MASTER-8C.29] Mutation-Readiness Review Gate
  const mutationReadinessReviewGateModel = useMemo<MutationReadinessReviewGateModel>(() => {
    return resolveMutationReadinessReviewGate({
      coachRecommendationCandidateModel: coachRecommendationCandidateResult,
      planEvidenceHookModel,
      planEvidenceTrendReadinessModel,
    })
  }, [coachRecommendationCandidateResult, planEvidenceHookModel, planEvidenceTrendReadinessModel])
  
  // [MASTER-8C.30] Mutation Pathway Readiness Map
  const mutationPathwayReadinessMapModel = useMemo<MutationPathwayReadinessMapModel>(() => {
    return resolveMutationPathwayReadinessMap({
      mutationReadinessReviewGateModel,
    })
  }, [mutationReadinessReviewGateModel])
  
  // [MASTER-8C.32] Workout Log Session Identity Resolution
  // Reuses the same recentLogs already loaded for workoutEvidenceSummary
  // (no duplicate localStorage read). Resolves completed day numbers from
  // generatedWorkoutId field in trusted workout logs.
  // [MASTER-8C.44] Now scoped to current program id to prevent stale/foreign logs
  // from falsely marking current program's days completed.
  const sessionIdentityModel = useMemo(() => {
    try {
      const recentLogs = getRecentWorkoutLogsForGenerationRequest()
      const programSessions = program?.sessions ?? []
      // [MASTER-8C.44] Pass current program id for scoping
      const currentProgramId = typeof program?.id === 'string' ? program.id : null
      return resolveWorkoutLogSessionIdentity({
        logs: recentLogs,
        programSessions,
        currentProgramId,
        requireProgramScope: true,
      })
    } catch {
      return null
    }
  }, [program])
  
  // [MASTER-8C.31/32] Target Session Resolution Preview
  const targetSessionResolutionInput = useMemo(() => {
    if (!program?.sessions) return null
    // [MASTER-8C.44.1] Target resolution MUST consume accepted current-program completed
    // days only. completedDayNumbers now represents ONLY program-scoped accepted days.
    // Raw/legacy log matches are diagnostic and must NOT protect current sessions.
    // The identity bridge ensures completedDayNumbers excludes stale/foreign logs
    // when programScopeAvailable && requireProgramScope.
    const completedDays = new Set<number>(
      sessionIdentityModel?.completedDayNumbers ?? []
    )
    return buildTargetResolutionProgramInput(program.sessions, completedDays)
  }, [program, sessionIdentityModel])
  
  const mutationTargetSessionResolutionPreviewModel = useMemo<MutationTargetSessionResolutionPreviewModel>(() => {
    return resolveMutationTargetSessionResolutionPreview({
      programSessions: targetSessionResolutionInput,
      mutationReadinessReviewGateModel,
      mutationPathwayReadinessMapModel,
      sessionIdentityModel,
    })
  }, [targetSessionResolutionInput, mutationReadinessReviewGateModel, mutationPathwayReadinessMapModel, sessionIdentityModel])
  
  // [MASTER-8C.33] Confirmation Contract Preview
  const mutationConfirmationContractPreviewModel = useMemo<MutationConfirmationContractPreviewModel>(() => {
    return resolveMutationConfirmationContractPreview({
      mutationTargetSessionResolutionPreviewModel,
      mutationReadinessReviewGateModel,
      mutationPathwayReadinessMapModel,
    })
  }, [mutationTargetSessionResolutionPreviewModel, mutationReadinessReviewGateModel, mutationPathwayReadinessMapModel])
  
  // [MASTER-8C.34] Caution Clearance Gate
  const mutationCautionClearanceGateModel = useMemo<MutationCautionClearanceGateModel>(() => {
    return resolveMutationCautionClearanceGate({
      planEvidenceTrendReadinessModel,
      mutationReadinessReviewGateModel,
      mutationPathwayReadinessMapModel,
      mutationTargetSessionResolutionPreviewModel,
      mutationConfirmationContractPreviewModel,
    })
  }, [planEvidenceTrendReadinessModel, mutationReadinessReviewGateModel, mutationPathwayReadinessMapModel, mutationTargetSessionResolutionPreviewModel, mutationConfirmationContractPreviewModel])
  
  // [MASTER-8C.35] Structural Mutation Preview Contract
  const structuralMutationPreviewContractModel = useMemo<StructuralMutationPreviewContractModel>(() => {
    return resolveStructuralMutationPreviewContract({
      planEvidenceTrendReadinessModel,
      mutationReadinessReviewGateModel,
      mutationPathwayReadinessMapModel,
      mutationTargetSessionResolutionPreviewModel,
      mutationConfirmationContractPreviewModel,
      mutationCautionClearanceGateModel,
    })
  }, [planEvidenceTrendReadinessModel, mutationReadinessReviewGateModel, mutationPathwayReadinessMapModel, mutationTargetSessionResolutionPreviewModel, mutationConfirmationContractPreviewModel, mutationCautionClearanceGateModel])
  
  // [MASTER-8C.36] User Confirmation / Marker Permission Preview Gate
  const userConfirmationMarkerPermissionPreviewGateModel = useMemo<UserConfirmationMarkerPermissionPreviewGateModel>(() => {
    return resolveUserConfirmationMarkerPermissionPreviewGate({
      planEvidenceTrendReadinessModel,
      mutationReadinessReviewGateModel,
      mutationPathwayReadinessMapModel,
      mutationTargetSessionResolutionPreviewModel,
      mutationConfirmationContractPreviewModel,
      mutationCautionClearanceGateModel,
      structuralMutationPreviewContractModel,
    })
  }, [planEvidenceTrendReadinessModel, mutationReadinessReviewGateModel, mutationPathwayReadinessMapModel, mutationTargetSessionResolutionPreviewModel, mutationConfirmationContractPreviewModel, mutationCautionClearanceGateModel, structuralMutationPreviewContractModel])
  
  // [MASTER-8C.37] Future-session Mutation Writer Readiness Boundary
  const futureSessionMutationWriterReadinessBoundaryModel = useMemo<FutureSessionMutationWriterReadinessBoundaryModel>(() => {
    return resolveFutureSessionMutationWriterReadinessBoundary({
      planEvidenceTrendReadinessModel,
      mutationReadinessReviewGateModel,
      mutationPathwayReadinessMapModel,
      mutationTargetSessionResolutionPreviewModel,
      mutationConfirmationContractPreviewModel,
      mutationCautionClearanceGateModel,
      structuralMutationPreviewContractModel,
      userConfirmationMarkerPermissionPreviewGateModel,
    })
  }, [planEvidenceTrendReadinessModel, mutationReadinessReviewGateModel, mutationPathwayReadinessMapModel, mutationTargetSessionResolutionPreviewModel, mutationConfirmationContractPreviewModel, mutationCautionClearanceGateModel, structuralMutationPreviewContractModel, userConfirmationMarkerPermissionPreviewGateModel])
  
  // [MASTER-8C.38] Pre-Mutation Lock / Bundle Closure
  const preMutationLockBundleClosureModel = useMemo<PreMutationLockBundleClosureModel>(() => {
    return resolvePreMutationLockBundleClosure({
      planEvidenceTrendReadinessModel,
      mutationReadinessReviewGateModel,
      mutationPathwayReadinessMapModel,
      mutationTargetSessionResolutionPreviewModel,
      mutationConfirmationContractPreviewModel,
      mutationCautionClearanceGateModel,
      structuralMutationPreviewContractModel,
      userConfirmationMarkerPermissionPreviewGateModel,
      futureSessionMutationWriterReadinessBoundaryModel,
    })
  }, [planEvidenceTrendReadinessModel, mutationReadinessReviewGateModel, mutationPathwayReadinessMapModel, mutationTargetSessionResolutionPreviewModel, mutationConfirmationContractPreviewModel, mutationCautionClearanceGateModel, structuralMutationPreviewContractModel, userConfirmationMarkerPermissionPreviewGateModel, futureSessionMutationWriterReadinessBoundaryModel])
  
  // [MASTER-8C.39] Controlled Future-Session Mutation Writer Dry-Run
  const controlledFutureSessionMutationWriterDryRunModel = useMemo<ControlledFutureSessionMutationDryRunEnvelope>(() => {
    return resolveControlledFutureSessionMutationWriterDryRun({
      preMutationLockBundleClosureModel,
      futureSessionMutationWriterReadinessBoundaryModel,
      structuralMutationPreviewContractModel,
      mutationTargetSessionResolutionPreviewModel,
      mutationCautionClearanceGateModel,
      userConfirmationMarkerPermissionPreviewGateModel,
    })
  }, [preMutationLockBundleClosureModel, futureSessionMutationWriterReadinessBoundaryModel, structuralMutationPreviewContractModel, mutationTargetSessionResolutionPreviewModel, mutationCautionClearanceGateModel, userConfirmationMarkerPermissionPreviewGateModel])
  
  // [MASTER-8C.40] Bounded Mutation Apply Eligibility Gate
  const boundedMutationApplyEligibilityGateModel = useMemo<BoundedMutationApplyEligibilityGateModel>(() => {
    return resolveBoundedMutationApplyEligibilityGate({
      controlledFutureSessionMutationWriterDryRunModel,
      userConfirmationMarkerPermissionPreviewGateModel,
      preMutationLockBundleClosureModel,
      mutationCautionClearanceGateModel,
      mutationTargetSessionResolutionPreviewModel,
    })
  }, [controlledFutureSessionMutationWriterDryRunModel, userConfirmationMarkerPermissionPreviewGateModel, preMutationLockBundleClosureModel, mutationCautionClearanceGateModel, mutationTargetSessionResolutionPreviewModel])
  
  // [MASTER-8C.41] Marker-Only Confirmation Boundary Preview
  const markerOnlyConfirmationBoundaryModel = useMemo<MarkerOnlyConfirmationBoundaryModel>(() => {
    return resolveMarkerOnlyConfirmationBoundaryPreview({
      boundedMutationApplyEligibilityGateModel,
      controlledFutureSessionMutationWriterDryRunModel,
      userConfirmationMarkerPermissionPreviewGateModel,
      preMutationLockBundleClosureModel,
      mutationCautionClearanceGateModel,
      mutationTargetSessionResolutionPreviewModel,
    })
  }, [boundedMutationApplyEligibilityGateModel, controlledFutureSessionMutationWriterDryRunModel, userConfirmationMarkerPermissionPreviewGateModel, preMutationLockBundleClosureModel, mutationCautionClearanceGateModel, mutationTargetSessionResolutionPreviewModel])
  
  // [Prompt 20] Local-only marker-save authorization preview state
  // This state is ephemeral and resets on refresh — it does NOT persist or save anything
  // Must be declared before markerSaveAuthorizationPreflightBoundaryModel which depends on it
  const [markerSaveAuthorizationPreviewAccepted, setMarkerSaveAuthorizationPreviewAccepted] = useState(false)
  
  // [P38] Local-only saved marker artifact state
  // This is purely local UI state - resets on refresh, no persistence
  // Contains proof fields only, no actual program/workout mutation
  interface SavedMarkerArtifact {
    markerId: string
    savedAtMs: number
    savedAtLabel: string
    targetSessionCount: number
    completedProtectedCount: number
    authorizationAccepted: true
    noProgramChangesApplied: true
    noWorkoutChangesApplied: true
    noProgramCardsChanged: true
    noStartWorkoutChanged: true
    noLiveWorkoutChanged: true
    completedSessionsProtected: true
  }
  const [savedMarkerArtifact, setSavedMarkerArtifact] = useState<SavedMarkerArtifact | null>(null)
  const markerSavedCount = savedMarkerArtifact ? 1 : 0
  
  // [Prompt 20] Determine if authorization preview is blocked
  // [P30] Tightened guard: blocked when marker-only boundary is not preview-ready
  // Uses helper-derived semantic hard blocker count from marker-only boundary
  const markerOnlyBoundaryPreviewReadyForLocalAuthorization = 
    markerOnlyConfirmationBoundaryModel &&
    markerOnlyConfirmationBoundaryModel.canRenderMarkerConfirmationPreview === true &&
    (markerOnlyConfirmationBoundaryModel.hardBlockingRootCandidateCount ?? 0) === 0 &&
    (markerOnlyConfirmationBoundaryModel.rootCandidateNeedsEvidenceCount ?? 0) === 0 &&
    markerOnlyConfirmationBoundaryModel.targetSessionCount > 0 &&
    markerOnlyConfirmationBoundaryModel.noMarkerSaved === true &&
    markerOnlyConfirmationBoundaryModel.noMarkerWriteAttempted === true &&
    markerOnlyConfirmationBoundaryModel.noProgramChangesApplied === true &&
    markerOnlyConfirmationBoundaryModel.noWorkoutChangesApplied === true
  
  const authPreviewBlocked = !markerOnlyBoundaryPreviewReadyForLocalAuthorization

  // [MASTER-8C.42] Marker-Save Authorization Preflight Boundary
  // [Prompt 20] Now wired to local-only authorization preview state
  const markerSaveAuthorizationPreflightBoundaryModel = useMemo<MarkerSaveAuthorizationPreflightBoundaryModel>(() => {
    return resolveMarkerSaveAuthorizationPreflightBoundary({
      markerOnlyConfirmationBoundaryModel,
      explicitUserAuthorization: markerSaveAuthorizationPreviewAccepted, // local-only preview, not persisted
    })
  }, [markerOnlyConfirmationBoundaryModel, markerSaveAuthorizationPreviewAccepted])
  
  // [MASTER-8C.43] Controlled Marker-Save Action Boundary
  // [Prompt 20] Now wired to local-only authorization preview state
  const controlledMarkerSaveActionBoundaryModel = useMemo<ControlledMarkerSaveActionBoundaryModel>(() => {
    return resolveControlledMarkerSaveActionBoundary({
      markerSaveAuthorizationPreflightBoundaryModel,
      explicitUserAuthorization: markerSaveAuthorizationPreviewAccepted, // local-only preview, not persisted
      markerSavedCount, // [P38] Now dynamic based on savedMarkerArtifact
    })
  }, [markerSaveAuthorizationPreflightBoundaryModel, markerSaveAuthorizationPreviewAccepted, markerSavedCount])
  
  // [Prompt 21] Marker-save artifact preview model
  // Pure read-only preview of what marker artifact would be saved later
  const markerSaveArtifactPreviewModel = useMemo<MarkerSaveArtifactPreviewModel>(() => {
    return resolveMarkerSaveArtifactPreview({
      markerOnlyConfirmationBoundaryModel,
      markerSaveAuthorizationPreflightBoundaryModel,
      controlledMarkerSaveActionBoundaryModel,
      authorizationPreviewAccepted: markerSaveAuthorizationPreviewAccepted,
      markerSavedCount, // [P39] Pass local marker saved count
    })
  }, [markerOnlyConfirmationBoundaryModel, markerSaveAuthorizationPreflightBoundaryModel, controlledMarkerSaveActionBoundaryModel, markerSaveAuthorizationPreviewAccepted, markerSavedCount])
  
  // [Prompt 22] Marker write readiness ledger model
  // Pure read-only ledger summarizing all pre-writer conditions
  const markerWriteReadinessLedgerModel = useMemo<MarkerWriteReadinessLedgerModel>(() => {
    return resolveMarkerWriteReadinessLedger({
      markerOnlyConfirmationBoundaryModel,
      markerSaveAuthorizationPreflightBoundaryModel,
      controlledMarkerSaveActionBoundaryModel,
      markerSaveArtifactPreviewModel,
      authorizationPreviewAccepted: markerSaveAuthorizationPreviewAccepted,
      markerSavedCount, // [P39] Pass local marker saved count
    })
  }, [markerOnlyConfirmationBoundaryModel, markerSaveAuthorizationPreflightBoundaryModel, controlledMarkerSaveActionBoundaryModel, markerSaveArtifactPreviewModel, markerSaveAuthorizationPreviewAccepted, markerSavedCount])
  
  // [Prompt 41] Durable marker receipt readiness model
  // Pure read-only evaluation of whether local marker proof is eligible for future durable receipt
  const durableMarkerReceiptReadinessModel = useMemo<DurableMarkerReceiptReadinessModel>(() => {
    return resolveDurableMarkerReceiptReadiness({
      markerOnlyConfirmationBoundaryModel,
      markerSaveAuthorizationPreflightBoundaryModel,
      controlledMarkerSaveActionBoundaryModel,
      markerSaveArtifactPreviewModel,
      markerWriteReadinessLedgerModel,
    })
  }, [markerOnlyConfirmationBoundaryModel, markerSaveAuthorizationPreflightBoundaryModel, controlledMarkerSaveActionBoundaryModel, markerSaveArtifactPreviewModel, markerWriteReadinessLedgerModel])
  
  // [Prompt 42] Controlled durable marker receipt writer preview model
  // Pure read-only preview of future durable receipt writer contract - no persistence or write enabled
  const controlledDurableMarkerReceiptWriterPreviewModel = useMemo<ControlledDurableMarkerReceiptWriterPreviewModel>(() => {
    return resolveControlledDurableMarkerReceiptWriterPreview({
      durableMarkerReceiptReadinessModel,
    })
  }, [durableMarkerReceiptReadinessModel])
  
  // [Prompt 43] Persistence writer activation lock gate model
  // Pure read-only explicit persistence activation lock gate - no persistence or write enabled
  const persistenceWriterActivationLockGateModel = useMemo<PersistenceWriterActivationLockGateModel>(() => {
    return resolvePersistenceWriterActivationLockGate({
      controlledDurableMarkerReceiptWriterPreviewModel,
    })
  }, [controlledDurableMarkerReceiptWriterPreviewModel])
  
  // [Prompt 44] Controlled durable marker receipt writer no-write harness model
  // Pure read-only no-write harness / persistence-disabled dry-run gate
  const controlledDurableMarkerReceiptWriterNoWriteHarnessModel = useMemo<ControlledDurableMarkerReceiptWriterNoWriteHarnessModel>(() => {
    return resolveControlledDurableMarkerReceiptWriterNoWriteHarness({
      persistenceWriterActivationLockGateModel,
    })
  }, [persistenceWriterActivationLockGateModel])
  
  // [Prompt 45] Durable receipt writer eligibility ledger model
  // Pure read-only eligibility ledger for future durable receipt writer activation review
  const durableReceiptWriterEligibilityLedgerModel = useMemo<DurableReceiptWriterEligibilityLedgerModel>(() => {
    return resolveDurableReceiptWriterEligibilityLedger({
      noWriteHarnessModel: controlledDurableMarkerReceiptWriterNoWriteHarnessModel,
    })
  }, [controlledDurableMarkerReceiptWriterNoWriteHarnessModel])
  
  // [Prompt 46] Durable receipt writer activation preconditions review model
  // Pure read-only activation preconditions review for explicit activation request preview
  const durableReceiptWriterActivationPreconditionsReviewModel = useMemo<DurableReceiptWriterActivationPreconditionsReviewModel>(() => {
    return resolveDurableReceiptWriterActivationPreconditionsReview({
      eligibilityLedgerModel: durableReceiptWriterEligibilityLedgerModel,
    })
  }, [durableReceiptWriterEligibilityLedgerModel])
  
  // [Prompt 47] Explicit persistence activation request preview model
  // Pure read-only request preview - no activation requested, no authorization granted
  const explicitPersistenceActivationRequestPreviewModel = useMemo<ExplicitPersistenceActivationRequestPreviewModel>(() => {
    return resolveExplicitPersistenceActivationRequestPreview({
      activationPreconditionsReviewModel: durableReceiptWriterActivationPreconditionsReviewModel,
    })
  }, [durableReceiptWriterActivationPreconditionsReviewModel])
  
  // [Prompt 48] Activation request authorization lock model
  // Pure read-only authorization lock - preview verified but no activation/authorization granted
  const activationRequestAuthorizationLockModel = useMemo<ActivationRequestAuthorizationLockModel>(() => {
    return resolveActivationRequestAuthorizationLock({
      explicitPersistenceActivationRequestPreviewModel,
    })
  }, [explicitPersistenceActivationRequestPreviewModel])
  
  // [Prompt 49] Explicit activation request intent capture preview model
  // Pure read-only intent capture preview - authorization lock verified but no user intent captured
  const explicitActivationRequestIntentCapturePreviewModel = useMemo<ExplicitActivationRequestIntentCapturePreviewModel>(() => {
    return resolveExplicitActivationRequestIntentCapturePreview({
      activationRequestAuthorizationLockModel,
    })
  }, [activationRequestAuthorizationLockModel])
  
  // [Prompt 50] Explicit activation authorization review preview model
  // Pure read-only authorization review preview - intent capture verified but no authorization reviewed
  const explicitActivationAuthorizationReviewPreviewModel = useMemo<ExplicitActivationAuthorizationReviewPreviewModel>(() => {
    return resolveExplicitActivationAuthorizationReviewPreview({
      explicitActivationRequestIntentCapturePreviewModel,
    })
  }, [explicitActivationRequestIntentCapturePreviewModel])
  
  // [Prompt 51] Controlled activation permission boundary preview model
  // Pure read-only permission boundary preview - auth review verified but no permission granted
  const controlledActivationPermissionBoundaryPreviewModel = useMemo<ControlledActivationPermissionBoundaryPreviewModel>(() => {
    return resolveControlledActivationPermissionBoundaryPreview({
      explicitActivationAuthorizationReviewPreviewModel,
    })
  }, [explicitActivationAuthorizationReviewPreviewModel])
  
  // [Prompt 52] Explicit persistence activation consent preview model
  // Pure read-only consent preview - permission boundary verified but no consent captured
  const explicitPersistenceActivationConsentPreviewModel = useMemo<ExplicitPersistenceActivationConsentPreviewModel>(() => {
    return resolveExplicitPersistenceActivationConsentPreview({
      controlledActivationPermissionBoundaryPreviewModel,
    })
  }, [controlledActivationPermissionBoundaryPreviewModel])
  
  // [Prompt 53] Consent authorization lock preview model
  // Pure read-only consent authorization lock - consent preview verified but authorization locked
  const consentAuthorizationLockPreviewModel = useMemo<ConsentAuthorizationLockPreviewModel>(() => {
    return resolveConsentAuthorizationLockPreview({
      explicitPersistenceActivationConsentPreviewModel,
    })
  }, [explicitPersistenceActivationConsentPreviewModel])
  
  // [Prompt 54] Consent decision state preview model
  // Pure read-only consent decision state preview - previews future grant/deny/undecided states
  const consentDecisionStatePreviewModel = useMemo<ConsentDecisionStatePreviewModel>(() => {
    return resolveConsentDecisionStatePreview({
      consentAuthorizationLockPreviewModel,
    })
  }, [consentAuthorizationLockPreviewModel])
  
  // [Prompt 55] Consent decision review lock preview model
  // Pure read-only consent decision review lock - review is required but not performed
  const consentDecisionReviewLockPreviewModel = useMemo<ConsentDecisionReviewLockPreviewModel>(() => {
    return resolveConsentDecisionReviewLockPreview({
      consentDecisionStatePreviewModel,
    })
  }, [consentDecisionStatePreviewModel])
  
  // [Prompt 56] Consent permission boundary preview model
  // Pure read-only consent permission boundary - permission not granted
  const consentPermissionBoundaryPreviewModel = useMemo<ConsentPermissionBoundaryPreviewModel>(() => {
    return resolveConsentPermissionBoundaryPreview({
      consentDecisionReviewLockPreviewModel,
    })
  }, [consentDecisionReviewLockPreviewModel])
  
  // [Prompt 57] Persistence permission review preview model
  // Pure read-only persistence permission review - permission not granted
  const persistencePermissionReviewPreviewModel = useMemo<PersistencePermissionReviewPreviewModel>(() => {
    return resolvePersistencePermissionReviewPreview({
      consentPermissionBoundaryPreviewModel,
    })
  }, [consentPermissionBoundaryPreviewModel])
  
  // [Prompt 58] Persistence write preflight preview model
  // Pure read-only write preflight preview - write preflight blocked
  const persistenceWritePreflightPreviewModel = useMemo<PersistenceWritePreflightPreviewModel>(() => {
    return resolvePersistenceWritePreflightPreview({
      persistencePermissionReviewPreviewModel,
    })
  }, [persistencePermissionReviewPreviewModel])
  
  // [Prompt 59] Persistence writer activation review preview model
  // Pure read-only writer activation review - activation reviewed but not allowed
  const persistenceWriterActivationReviewPreviewModel = useMemo<PersistenceWriterActivationReviewPreviewModel>(() => {
    return resolvePersistenceWriterActivationReviewPreview({
      persistenceWritePreflightPreviewModel,
    })
  }, [persistenceWritePreflightPreviewModel])
  
  // [Prompt 60] Persistence boundary review preview model
  // Pure read-only boundary review - boundary reviewed but writer boundary not opened
  const persistenceBoundaryReviewPreviewModel = useMemo<PersistenceBoundaryReviewPreviewModel>(() => {
    return resolvePersistenceBoundaryReviewPreview({
      persistenceWriterActivationReviewPreviewModel,
    })
  }, [persistenceWriterActivationReviewPreviewModel])
  
  // [Prompt 61] Persistence writer gate preview model
  // Pure read-only writer gate preview - gate reviewed but NOT opened
  const persistenceWriterGatePreviewModel = useMemo<PersistenceWriterGatePreviewModel>(() => {
    return resolvePersistenceWriterGatePreview({
      persistenceBoundaryReviewPreviewModel,
    })
  }, [persistenceBoundaryReviewPreviewModel])
  
  // [Prompt 62] Persistence writer boundary step preview model
  // Pure read-only boundary step preview - step reviewed but writer NOT opened
  const persistenceWriterBoundaryStepPreviewModel = useMemo<PersistenceWriterBoundaryStepPreviewModel>(() => {
    return resolvePersistenceWriterBoundaryStepPreview({
      persistenceWriterGatePreviewModel,
    })
  }, [persistenceWriterGatePreviewModel])
  
  // [Prompt 63] Persistence writer boundary continuity preview model
  // Pure read-only boundary continuity preview - continuity reviewed but writer NOT opened
  const persistenceWriterBoundaryContinuityPreviewModel = useMemo<PersistenceWriterBoundaryContinuityPreviewModel>(() => {
    return resolvePersistenceWriterBoundaryContinuityPreview({
      persistenceWriterBoundaryStepPreviewModel,
    })
  }, [persistenceWriterBoundaryStepPreviewModel])
  
  // [Prompt 64] Mutation unlock roadmap decision gate model
  // DECISION GATE that stops redundant closed-boundary cards and answers:
  // Are we ready for writer-open preview next, or what exact blocker remains?
  const mutationUnlockRoadmapDecisionGateModel = useMemo<MutationUnlockRoadmapDecisionGateModel>(() => {
    return resolveMutationUnlockRoadmapDecisionGate({
      persistenceWriterBoundaryContinuityPreviewModel,
    })
  }, [persistenceWriterBoundaryContinuityPreviewModel])
  
  // [Prompt 23] Root/candidate clearance evidence detail model
  // Pure read-only detail of each root/candidate clearance item with evidence
  const rootCandidateClearanceEvidenceDetailModel = useMemo<RootCandidateClearanceEvidenceDetailModel>(() => {
    return resolveRootCandidateClearanceEvidenceDetail({
      mutationCautionClearanceGateModel,
      markerSaveArtifactPreviewModel,
      markerWriteReadinessLedgerModel,
      targetSessionCount: mutationTargetSessionResolutionPreviewModel?.futureSessionCount ?? 0,
      completedSessionCount: mutationTargetSessionResolutionPreviewModel?.completedSessionCount ?? 0,
    })
  }, [mutationCautionClearanceGateModel, markerSaveArtifactPreviewModel, markerWriteReadinessLedgerModel, mutationTargetSessionResolutionPreviewModel])
  
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
  
  // [Prompt 20] Reset authorization preview if upstream blockers exist
  // Prevents authorization acceptance when corridor is not ready
  useEffect(() => {
    if (authPreviewBlocked && markerSaveAuthorizationPreviewAccepted) {
      setMarkerSaveAuthorizationPreviewAccepted(false)
    }
  }, [authPreviewBlocked, markerSaveAuthorizationPreviewAccepted])
  
  // [P38] Local marker save handler - event handler only, never runs during render
  // Saves exactly one marker artifact locally, does NOT mutate program/workout/sessions
  const handleLocalMarkerSave = useCallback(() => {
    // Guard: already saved
    if (savedMarkerArtifact !== null) {
      console.log('[v0] Local marker already saved, blocking duplicate')
      return
    }
    // Guard: authorization not accepted
    if (!markerSaveAuthorizationPreviewAccepted) {
      console.log('[v0] Authorization not accepted, blocking marker save')
      return
    }
    // Guard: auth preview blocked
    if (authPreviewBlocked) {
      console.log('[v0] Auth preview blocked, blocking marker save')
      return
    }
    // Guard: action boundary not ready for marker save
    if (!controlledMarkerSaveActionBoundaryModel?.canExecuteMarkerSave) {
      console.log('[v0] Action boundary not ready for marker save')
      return
    }
    // Guard: no target sessions
    if ((controlledMarkerSaveActionBoundaryModel?.targetSessionCount ?? 0) <= 0) {
      console.log('[v0] No target sessions, blocking marker save')
      return
    }
    // Guard: hard blockers exist
    if ((controlledMarkerSaveActionBoundaryModel?.hardBlockingRootCandidateCount ?? 0) > 0) {
      console.log('[v0] Hard blockers exist, blocking marker save')
      return
    }
    
    // Create local marker artifact proof
    const now = Date.now()
    const artifact: SavedMarkerArtifact = {
      markerId: `marker-local-${now}`,
      savedAtMs: now,
      savedAtLabel: new Date(now).toLocaleTimeString(),
      targetSessionCount: controlledMarkerSaveActionBoundaryModel?.targetSessionCount ?? 0,
      completedProtectedCount: controlledMarkerSaveActionBoundaryModel?.completedProtectedCount ?? 0,
      authorizationAccepted: true,
      noProgramChangesApplied: true,
      noWorkoutChangesApplied: true,
      noProgramCardsChanged: true,
      noStartWorkoutChanged: true,
      noLiveWorkoutChanged: true,
      completedSessionsProtected: true,
    }
    
    setSavedMarkerArtifact(artifact)
    console.log('[v0] Local marker saved:', artifact.markerId)
  }, [
    savedMarkerArtifact,
    markerSaveAuthorizationPreviewAccepted,
    authPreviewBlocked,
    controlledMarkerSaveActionBoundaryModel,
  ])
  
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
  // [MASTER-8C.22] Check for read-only candidates from source branches
  const hasReadOnlyCoachCandidates = Boolean(coachRecommendationCandidateResult?.topCandidate)

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
          {/* [MASTER-8C.22] Shows Preview badge when read-only candidates exist */}
          <HubButton
            icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            label="Coach Recs"
            badge={hasCoachRecs ? 'Active' : hasReadOnlyCoachCandidates ? 'Preview' : undefined}
            badgeVariant={hasCoachRecs ? 'success' : hasReadOnlyCoachCandidates ? 'info' : 'secondary'}
            summary={hasCoachRecs ? undefined : hasReadOnlyCoachCandidates ? 'Read-only' : 'View'}
            onClick={() => setCoachRecsOpen(true)}
            sourceUnavailable={!hasCoachRecs && !hasReadOnlyCoachCandidates}
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
            ) : coachRecommendationCandidateResult?.topCandidate ? (
              /* [MASTER-8C.22] Read-only recommendation candidates from source branches */
              /* [MASTER-8C.23] Refined with source-quality / evidence-tier proof */
              <div className="space-y-3">
                {/* Header */}
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Read-only preview
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-[#8A8A9A] border border-[#2A2A35]">
                      {coachRecommendationCandidateResult.confidence} confidence
                    </span>
                    {coachRecommendationCandidateResult.appliedRecommendationReadiness === 'needs_logged_evidence' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/8 text-amber-400/80 border border-amber-500/15">
                        Needs logged evidence
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9A9AAA]">
                    {coachRecommendationCandidateResult.candidates.length} source-backed candidate{coachRecommendationCandidateResult.candidates.length > 1 ? 's' : ''} from {coachRecommendationCandidateResult.sourceBasis.length} branch{coachRecommendationCandidateResult.sourceBasis.length > 1 ? 'es' : ''}
                  </p>
                  <p className="text-[10px] text-[#7A7A8A] mt-1">
                    {coachRecommendationCandidateResult.sourceQualitySummary}
                  </p>
                  {/* [MASTER-8C.24] Compact workout evidence proof line */}
                  {coachRecommendationCandidateResult.workoutEvidenceLabel && (
                    <p className="text-[10px] text-emerald-400/70 mt-0.5">
                      {coachRecommendationCandidateResult.workoutEvidenceLabel}
                    </p>
                  )}
                </div>
                
                {/* Candidates */}
                {coachRecommendationCandidateResult.candidates.slice(0, 4).map((candidate) => (
                  <div 
                    key={candidate.id}
                    className="rounded-lg border border-[#2A2A35] bg-[#1A1A1F] p-3"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded border",
                        candidate.priority === 'high'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : candidate.priority === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-[#1A1A2E] text-[#7A7A8A] border-[#2A2A35]'
                      )}>
                        {candidate.priority === 'high' ? 'structural caution' : candidate.priority}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-[#6A6A7A] border border-[#2A2A35]">
                        {candidate.category.replace(/_/g, ' ')}
                      </span>
                      {/* [MASTER-8C.23] Evidence-tier chip */}
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded border",
                        candidate.evidenceTier === 'logged_user_evidence' || candidate.evidenceTier === 'mixed'
                          ? 'bg-emerald-500/8 text-emerald-400/80 border-emerald-500/15'
                          : candidate.evidenceTier === 'missing_evidence'
                          ? 'bg-amber-500/8 text-amber-400/70 border-amber-500/15'
                          : 'bg-[#1A1A2E] text-[#5A5A6A] border-[#2A2A35]'
                      )}>
                        {candidate.sourceQualityLabel}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-[#E6E9EF] mb-1">{candidate.title}</h4>
                    <p className="text-xs text-[#8A8A9A] mb-2 leading-relaxed">{candidate.recommendation}</p>
                    {candidate.why.length > 0 && (
                      <div className="text-[10px] text-[#6A6A7A] mb-1">
                        {candidate.why.join(' | ')}
                      </div>
                    )}
                    {/* [MASTER-8C.23] Source-quality explanation */}
                    <div className="text-[10px] text-[#5A5A6A] mb-1 italic">
                      {candidate.sourceQualityExplanation}
                    </div>
                    <div className="text-[10px] text-[#5A5A6A]">
                      Sources: {candidate.sourceBasis.join(', ')}
                    </div>
                  </div>
                ))}
                
                {/* Missing sources */}
                {coachRecommendationCandidateResult.missingSources.length > 0 && (
                  <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-2.5">
                    <div className="text-[10px] text-amber-400/70">
                      Missing for applied recs: {coachRecommendationCandidateResult.missingSources.join(', ')}
                    </div>
                  </div>
                )}
                
                {/* Mutation lock footer */}
                <div className="text-center py-2">
                  <p className="text-[10px] text-cyan-400/60">
                    Not applied to program. No future sessions changed.
                  </p>
                  {/* [MASTER-8C.29] Review gate summary line */}
                  {mutationReadinessReviewGateModel.status !== 'unavailable' && (
                    <p className="text-[9px] text-rose-400/50 mt-1">
                      {mutationReadinessReviewGateModel.readinessLabel}
                    </p>
                  )}
                </div>
              </div>
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
                  Coach recommendations appear after source branches or logged workout evidence produce a safe candidate.
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
          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)] space-y-4">
            {/* [MASTER-8C.27] Plan Evidence Read-Only Hook compact proof */}
            {planEvidenceHookModel.status !== 'unavailable' && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    planEvidenceHookModel.status === 'read_only_connected'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  )}>
                    {planEvidenceHookModel.status === 'read_only_connected' ? 'Evidence connected' : 'Waiting for evidence'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Read-only evidence hook
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-[#8A8A9A] border border-[#2A2A35]">
                    {planEvidenceHookModel.confidence} confidence
                  </span>
                </div>
                <p className="text-xs text-[#9A9AAA] mb-1 leading-relaxed">{planEvidenceHookModel.headline}</p>
                {planEvidenceHookModel.evidenceLabel && (
                  <p className="text-[10px] text-emerald-400/70 mb-1">{planEvidenceHookModel.evidenceLabel}</p>
                )}
                <p className="text-[10px] text-[#7A7A8A] mb-1">{planEvidenceHookModel.sourceQualityLabel}</p>
                {planEvidenceHookModel.missingEvidence.length > 0 && (
                  <p className="text-[10px] text-amber-400/60 mb-1">
                    Missing: {planEvidenceHookModel.missingEvidence.slice(0, 3).join(', ')}
                  </p>
                )}
                <p className="text-[10px] text-cyan-400/60">
                  No program changes applied. No future sessions changed.
                </p>
              </div>
            )}
            {/* [MASTER-8C.28] Evidence Trend Classification / Readiness Scoring compact proof */}
            {planEvidenceTrendReadinessModel.status !== 'unavailable' && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Evidence trend: read-only
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    planEvidenceTrendReadinessModel.classification === 'caution_pattern_detected'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : planEvidenceTrendReadinessModel.classification === 'recovery_pressure_detected'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : planEvidenceTrendReadinessModel.classification === 'progression_signal_detected'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : planEvidenceTrendReadinessModel.classification === 'ready_for_review_not_mutation'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      : planEvidenceTrendReadinessModel.classification === 'monitoring_pattern'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-[#1A1A2E] text-[#8A8A9A] border-[#2A2A35]'
                  )}>
                    {getClassificationLabel(planEvidenceTrendReadinessModel.classification)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-[#8A8A9A] border border-[#2A2A35]">
                    {planEvidenceTrendReadinessModel.confidence} confidence
                  </span>
                </div>
                <p className="text-xs text-[#9A9AAA] mb-1 leading-relaxed">{planEvidenceTrendReadinessModel.headline}</p>
                <p className="text-[10px] text-[#7A7A8A] mb-1.5 leading-relaxed">{planEvidenceTrendReadinessModel.summary}</p>
                {planEvidenceTrendReadinessModel.evidenceLabel && (
                  <p className="text-[10px] text-emerald-400/70 mb-1">{planEvidenceTrendReadinessModel.evidenceLabel}</p>
                )}
                {planEvidenceTrendReadinessModel.trendSignals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {planEvidenceTrendReadinessModel.trendSignals.slice(0, 4).map((signal, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1A2E]/60 text-[#8A8A9A] border border-[#2A2A35]/40">
                        {signal}
                      </span>
                    ))}
                  </div>
                )}
                {planEvidenceTrendReadinessModel.readinessReasons.length > 0 && (
                  <p className="text-[10px] text-violet-400/60 mb-1">
                    Posture: {getPostureLabel(planEvidenceTrendReadinessModel.readinessPosture)} — {planEvidenceTrendReadinessModel.readinessReasons[0]}
                  </p>
                )}
                <p className="text-[10px] text-cyan-400/60">
                  No program changes applied. No future sessions changed.
                </p>
              </div>
            )}
            {/* [MASTER-8C.29] Mutation-Readiness Review Gate compact proof */}
            {mutationReadinessReviewGateModel.status !== 'unavailable' && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Mutation-readiness review: read-only
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    mutationReadinessReviewGateModel.status === 'blocked_by_caution'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : mutationReadinessReviewGateModel.status === 'review_candidates_read_only'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      : mutationReadinessReviewGateModel.status === 'collect_evidence'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-[#1A1A2E] text-[#8A8A9A] border-[#2A2A35]'
                  )}>
                    {getGateStatusLabel(mutationReadinessReviewGateModel.status)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-[#8A8A9A] border border-[#2A2A35]">
                    {mutationReadinessReviewGateModel.confidence} confidence
                  </span>
                </div>
                <p className="text-xs text-[#9A9AAA] mb-1 leading-relaxed">{mutationReadinessReviewGateModel.headline}</p>
                <p className="text-[10px] text-[#7A7A8A] mb-1.5 leading-relaxed">{mutationReadinessReviewGateModel.summary}</p>
                {/* Candidate resolution counts */}
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {mutationReadinessReviewGateModel.reviewCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {mutationReadinessReviewGateModel.reviewCandidateCount} review
                    </span>
                  )}
                  {mutationReadinessReviewGateModel.blockedCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {mutationReadinessReviewGateModel.blockedCandidateCount} caution-blocked
                    </span>
                  )}
                  {mutationReadinessReviewGateModel.collectEvidenceCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {mutationReadinessReviewGateModel.collectEvidenceCandidateCount} collect evidence
                    </span>
                  )}
                  {mutationReadinessReviewGateModel.monitorCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-[#8A8A9A] border border-[#2A2A35]">
                      {mutationReadinessReviewGateModel.monitorCandidateCount} monitor
                    </span>
                  )}
                </div>
                {/* Top review candidate or top blocker */}
                {mutationReadinessReviewGateModel.topReviewCandidate && (
                  <div className="text-[10px] text-cyan-400/70 mb-1">
                    Top review: {mutationReadinessReviewGateModel.topReviewCandidate.title}
                    {mutationReadinessReviewGateModel.topReviewCandidate.reviewReasons.length > 0 && (
                      <span className="text-[#7A7A8A]"> — {mutationReadinessReviewGateModel.topReviewCandidate.reviewReasons[0]}</span>
                    )}
                  </div>
                )}
                {mutationReadinessReviewGateModel.globalBlockers.length > 0 && (
                  <div className="text-[10px] text-red-400/60 mb-1">
                    {mutationReadinessReviewGateModel.globalBlockers[0]}
                  </div>
                )}
                <p className="text-[10px] text-cyan-400/60">
                  Mutation locked. No program changes applied. No future sessions changed.
                </p>
              </div>
            )}
            {/* [MASTER-8C.30] Mutation Pathway Readiness Map compact proof */}
            {mutationPathwayReadinessMapModel.status !== 'unavailable' && (
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Mutation pathway map: read-only
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    mutationPathwayReadinessMapModel.status === 'blocked_by_caution'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : mutationPathwayReadinessMapModel.status === 'collect_more_evidence'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : mutationPathwayReadinessMapModel.status === 'future_writer_locked'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  )}>
                    {getPathwayMapStatusLabel(mutationPathwayReadinessMapModel.status)}
                  </span>
                </div>
                <p className="text-xs text-[#9A9AAA] mb-1 leading-relaxed">{mutationPathwayReadinessMapModel.headline}</p>
                <p className="text-[10px] text-[#7A7A8A] mb-1.5 leading-relaxed">{mutationPathwayReadinessMapModel.summary}</p>
                {/* Gate counts */}
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {mutationPathwayReadinessMapModel.readyGateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {mutationPathwayReadinessMapModel.readyGateCount} ready
                    </span>
                  )}
                  {mutationPathwayReadinessMapModel.blockedGateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {mutationPathwayReadinessMapModel.blockedGateCount} blocked
                    </span>
                  )}
                  {mutationPathwayReadinessMapModel.reviewRequiredGateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {mutationPathwayReadinessMapModel.reviewRequiredGateCount} review
                    </span>
                  )}
                  {mutationPathwayReadinessMapModel.collectEvidenceGateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {mutationPathwayReadinessMapModel.collectEvidenceGateCount} collect
                    </span>
                  )}
                  {mutationPathwayReadinessMapModel.futureLockedGateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-[#6A6A7A] border border-[#2A2A35]">
                      {mutationPathwayReadinessMapModel.futureLockedGateCount} future locked
                    </span>
                  )}
                </div>
                {/* Compact gate rows — first 5 active gates */}
                <div className="space-y-0.5 mb-1.5">
                  {mutationPathwayReadinessMapModel.gates.slice(0, 5).map((gate) => {
                    const color = getGateStatusColor(gate.status)
                    return (
                      <div key={gate.id} className="flex items-center gap-1.5">
                        <span className={cn("text-[9px] w-[52px] shrink-0 text-center px-1 py-0.5 rounded border", color.bg, color.text, color.border)}>
                          {getPathwayGateStatusLabel(gate.status)}
                        </span>
                        <span className="text-[9px] text-[#8A8A9A] truncate">{gate.label}</span>
                      </div>
                    )
                  })}
                  {mutationPathwayReadinessMapModel.gates.length > 5 && (
                    <div className="text-[9px] text-[#5A5A6A] pl-[58px]">
                      +{mutationPathwayReadinessMapModel.gates.length - 5} future gates locked
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-[#7A7A8A] mb-1">
                  Next: {mutationPathwayReadinessMapModel.nextSafeGate}
                </div>
                <p className="text-[10px] text-cyan-400/60">
                  Controlled mutation remains locked. No program changes applied. No future sessions changed.
                </p>
              </div>
            )}
            {/* [MASTER-8C.31] Target Session Resolution Preview compact proof */}
            {mutationTargetSessionResolutionPreviewModel.status !== 'unavailable' && (
              <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    Target resolution preview: read-only
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    mutationTargetSessionResolutionPreviewModel.status === 'blocked_by_caution'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : mutationTargetSessionResolutionPreviewModel.status === 'no_future_targets'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : mutationTargetSessionResolutionPreviewModel.status === 'targets_resolved_read_only'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-[#1A1A2E] text-[#8A8A9A] border-[#2A2A35]'
                  )}>
                    {getTargetResolutionStatusLabel(mutationTargetSessionResolutionPreviewModel.status)}
                  </span>
                </div>
                <p className="text-xs text-[#9A9AAA] mb-1 leading-relaxed">{mutationTargetSessionResolutionPreviewModel.headline}</p>
                <p className="text-[10px] text-[#7A7A8A] mb-1.5 leading-relaxed">{mutationTargetSessionResolutionPreviewModel.summary}</p>
                {/* Session counts */}
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1A2E] text-[#8A8A9A] border border-[#2A2A35]">
                    {mutationTargetSessionResolutionPreviewModel.completedSessionCount} completed
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    {mutationTargetSessionResolutionPreviewModel.futureSessionCount} future
                  </span>
                  {mutationTargetSessionResolutionPreviewModel.blockedCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {mutationTargetSessionResolutionPreviewModel.blockedCandidateCount} blocked
                    </span>
                  )}
                  {mutationTargetSessionResolutionPreviewModel.unresolvedCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {mutationTargetSessionResolutionPreviewModel.unresolvedCandidateCount} unresolved
                    </span>
                  )}
                </div>
                {/* [MASTER-8C.32] Session identity proof line */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const identityColor = getSessionIdentityStatusColor(
                      mutationTargetSessionResolutionPreviewModel.completedSessionIdentityStatus
                    )
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", identityColor.bg, identityColor.text, identityColor.border)}>
                        Session identity: {getSessionIdentityStatusLabel(mutationTargetSessionResolutionPreviewModel.completedSessionIdentityStatus)}
                      </span>
                    )
                  })()}
                  {mutationTargetSessionResolutionPreviewModel.completedSessionCount > 0 && (
                    <span className="text-[9px] text-emerald-400/70">
                      Completed sessions protected
                    </span>
                  )}
                  {mutationTargetSessionResolutionPreviewModel.unresolvedCompletedEvidenceCount > 0 && (
                    <span className="text-[9px] text-amber-400/70">
                      {mutationTargetSessionResolutionPreviewModel.unresolvedCompletedEvidenceCount} unmapped log(s)
                    </span>
                  )}
                </div>
                {/* Compact candidate target rows (max 4) */}
                {mutationTargetSessionResolutionPreviewModel.candidateResolutions.length > 0 && (
                  <div className="space-y-0.5 mb-1.5">
                    {mutationTargetSessionResolutionPreviewModel.candidateResolutions.slice(0, 4).map((cr) => {
                      const color = getTargetCandidateStatusColor(cr.status)
                      return (
                        <div key={cr.sourceCandidateId} className="flex items-center gap-1.5">
                          <span className={cn("text-[9px] w-[56px] shrink-0 text-center px-1 py-0.5 rounded border", color.bg, color.text, color.border)}>
                            {getTargetCandidateStatusLabel(cr.status)}
                          </span>
                          <span className="text-[9px] text-[#8A8A9A] truncate">{cr.title}</span>
                          {cr.targetDayNumbers.length > 0 && (
                            <span className="text-[9px] text-[#5A5A6A] shrink-0">
                              D{cr.targetDayNumbers.slice(0, 3).join(',')}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {mutationTargetSessionResolutionPreviewModel.candidateResolutions.length > 4 && (
                      <div className="text-[9px] text-[#5A5A6A] pl-[62px]">
                        +{mutationTargetSessionResolutionPreviewModel.candidateResolutions.length - 4} more candidate(s)
                      </div>
                    )}
                  </div>
                )}
                {/* Missing proof */}
                {mutationTargetSessionResolutionPreviewModel.missingProof.length > 0 && (
                  <div className="text-[9px] text-[#6A6A7A] mb-1">
                    Missing: {mutationTargetSessionResolutionPreviewModel.missingProof.slice(0, 3).join(' · ')}
                    {mutationTargetSessionResolutionPreviewModel.missingProof.length > 3 && ` (+${mutationTargetSessionResolutionPreviewModel.missingProof.length - 3})`}
                  </div>
                )}
                <p className="text-[10px] text-cyan-400/60">
                  No confirmed plan created. No marker saved. No program changes applied. No future sessions changed.
                </p>
              </div>
            )}
            {/* [MASTER-8C.33] Confirmation Contract Preview card */}
            {mutationConfirmationContractPreviewModel && (
              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium text-violet-300">
                    Confirmation Contract Preview
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    read-only
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    marker locked
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no workout changes
                  </span>
                </div>
                {/* Status and headline */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const ccColor = getConfirmationContractStatusColor(mutationConfirmationContractPreviewModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", ccColor.bg, ccColor.text, ccColor.border)}>
                        {getConfirmationContractStatusLabel(mutationConfirmationContractPreviewModel.status)}
                      </span>
                    )
                  })()}
                </div>
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {mutationConfirmationContractPreviewModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {mutationConfirmationContractPreviewModel.summary}
                </p>
                {/* Counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {mutationConfirmationContractPreviewModel.completedProtectedCount} completed
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {mutationConfirmationContractPreviewModel.futureTargetCount} future
                  </span>
                  {mutationConfirmationContractPreviewModel.eligibleMarkerPreviewCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                      {mutationConfirmationContractPreviewModel.eligibleMarkerPreviewCount} preview eligible
                    </span>
                  )}
                </div>
                {/* Safety notes */}
                {mutationConfirmationContractPreviewModel.completedProtectedCount > 0 && (
                  <p className="text-[9px] text-emerald-400/60 mb-1">
                    Completed sessions protected
                  </p>
                )}
                <p className="text-[10px] text-violet-400/60">
                  No marker saved. No program changes applied. No confirmation UI yet.
                </p>
              </div>
            )}
            {/* [MASTER-8C.34] Caution Clearance Gate card */}
            {mutationCautionClearanceGateModel && (
              <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium text-amber-300">
                    Caution Clearance Gate
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    read-only
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    mutation locked
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no workout changes
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const ccColor = getMutationCautionClearanceStatusColor(mutationCautionClearanceGateModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", ccColor.bg, ccColor.text, ccColor.border)}>
                        {getMutationCautionClearanceStatusLabel(mutationCautionClearanceGateModel.status)}
                      </span>
                    )
                  })()}
                  {mutationCautionClearanceGateModel.activeCautionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {mutationCautionClearanceGateModel.activeCautionCount} caution signal{mutationCautionClearanceGateModel.activeCautionCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {mutationCautionClearanceGateModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {mutationCautionClearanceGateModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {mutationCautionClearanceGateModel.completedSessionCount} completed
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {mutationCautionClearanceGateModel.futureSessionCount} future
                  </span>
                  {mutationCautionClearanceGateModel.clearedConditionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                      {mutationCautionClearanceGateModel.clearedConditionCount} cleared
                    </span>
                  )}
                </div>
                {/* Top caution signals (max 3) */}
                {mutationCautionClearanceGateModel.cautionSignals.length > 0 && (
                  <div className="mb-1.5">
                    {mutationCautionClearanceGateModel.cautionSignals.slice(0, 3).map((sig, i) => (
                      <div key={i} className="text-[9px] text-amber-400/60 mb-0.5">
                        {sig.severity === 'blocked' ? '⊘' : sig.severity === 'caution' ? '⚠' : '◉'} {sig.label}
                      </div>
                    ))}
                    {mutationCautionClearanceGateModel.cautionSignals.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A]">
                        +{mutationCautionClearanceGateModel.cautionSignals.length - 3} more signal(s)
                      </div>
                    )}
                  </div>
                )}
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {mutationCautionClearanceGateModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-amber-400/60">
                  No marker saved. No program changes applied. No future sessions changed.
                </p>
              </div>
            )}
            {/* [MASTER-8C.35] Structural Mutation Preview Contract card */}
            {structuralMutationPreviewContractModel && (
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-medium text-cyan-300">
                    Structural Mutation Preview Contract
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    read-only
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    preview contract
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    mutation locked
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no workout changes
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const scColor = getStructuralPreviewContractStatusColor(structuralMutationPreviewContractModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", scColor.bg, scColor.text, scColor.border)}>
                        {getStructuralPreviewContractStatusLabel(structuralMutationPreviewContractModel.status)}
                      </span>
                    )
                  })()}
                  {structuralMutationPreviewContractModel.candidatePreviewCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                      {structuralMutationPreviewContractModel.candidatePreviewCount} preview candidate(s)
                    </span>
                  )}
                  {structuralMutationPreviewContractModel.activeCautionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {structuralMutationPreviewContractModel.activeCautionCount} caution
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {structuralMutationPreviewContractModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {structuralMutationPreviewContractModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {structuralMutationPreviewContractModel.completedProtectedCount} completed
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {structuralMutationPreviewContractModel.futureTargetCount} future
                  </span>
                  {structuralMutationPreviewContractModel.blockedPreviewCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                      {structuralMutationPreviewContractModel.blockedPreviewCount} blocked
                    </span>
                  )}
                </div>
                {/* Top blocked reasons (max 3) */}
                {structuralMutationPreviewContractModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {structuralMutationPreviewContractModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {structuralMutationPreviewContractModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-cyan-400/60">
                  No marker saved. No program changes applied. No Program Cards changed. No Live Workout changes.
                </p>
              </div>
            )}
            {/* [MASTER-8C.36] User Confirmation / Marker Permission Preview Gate card */}
            {userConfirmationMarkerPermissionPreviewGateModel && (
              <div className="rounded-lg border border-indigo-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-indigo-300">
                    User Confirmation / Marker Permission Preview Gate
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    read-only
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    marker locked
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no confirmation UI
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no workout changes
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const permColor = getUserConfirmationMarkerPermissionStatusColor(userConfirmationMarkerPermissionPreviewGateModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", permColor.bg, permColor.text, permColor.border)}>
                        {getUserConfirmationMarkerPermissionStatusLabel(userConfirmationMarkerPermissionPreviewGateModel.status)}
                      </span>
                    )
                  })()}
                  {userConfirmationMarkerPermissionPreviewGateModel.structuralPreviewCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                      {userConfirmationMarkerPermissionPreviewGateModel.structuralPreviewCandidateCount} structural candidate(s)
                    </span>
                  )}
                  {userConfirmationMarkerPermissionPreviewGateModel.activeCautionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {userConfirmationMarkerPermissionPreviewGateModel.activeCautionCount} caution
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {userConfirmationMarkerPermissionPreviewGateModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {userConfirmationMarkerPermissionPreviewGateModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {userConfirmationMarkerPermissionPreviewGateModel.completedProtectedCount} completed
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {userConfirmationMarkerPermissionPreviewGateModel.futureTargetCount} future
                  </span>
                </div>
                {/* Top blocked reasons (max 3) */}
                {userConfirmationMarkerPermissionPreviewGateModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {userConfirmationMarkerPermissionPreviewGateModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {userConfirmationMarkerPermissionPreviewGateModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-indigo-400/60">
                  No confirmation UI rendered. No marker saved. No program changes applied. No Program Cards changed. No Start Workout or Live Workout changes.
                </p>
              </div>
            )}
            {/* [MASTER-8C.37] Future-session Mutation Writer Readiness Boundary card */}
            {futureSessionMutationWriterReadinessBoundaryModel && (
              <div className="rounded-lg border border-rose-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-rose-300">
                    Future-session Mutation Writer Readiness Boundary
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    read-only
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    writer locked
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no session writes
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no workout changes
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const writerColor = getFutureSessionMutationWriterReadinessStatusColor(futureSessionMutationWriterReadinessBoundaryModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", writerColor.bg, writerColor.text, writerColor.border)}>
                        {getFutureSessionMutationWriterReadinessStatusLabel(futureSessionMutationWriterReadinessBoundaryModel.status)}
                      </span>
                    )
                  })()}
                  {futureSessionMutationWriterReadinessBoundaryModel.structuralPreviewCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                      {futureSessionMutationWriterReadinessBoundaryModel.structuralPreviewCandidateCount} structural candidate(s)
                    </span>
                  )}
                  {futureSessionMutationWriterReadinessBoundaryModel.activeCautionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {futureSessionMutationWriterReadinessBoundaryModel.activeCautionCount} caution
                    </span>
                  )}
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    permission: {futureSessionMutationWriterReadinessBoundaryModel.confirmationPermissionState}
                  </span>
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {futureSessionMutationWriterReadinessBoundaryModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {futureSessionMutationWriterReadinessBoundaryModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {futureSessionMutationWriterReadinessBoundaryModel.completedProtectedCount} completed (protected)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {futureSessionMutationWriterReadinessBoundaryModel.futureTargetCount} future
                  </span>
                </div>
                {/* Top blocked reasons (max 3) */}
                {futureSessionMutationWriterReadinessBoundaryModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {futureSessionMutationWriterReadinessBoundaryModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Protected invariants (show first 3) */}
                {futureSessionMutationWriterReadinessBoundaryModel.protectedInvariants.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-emerald-400/60 mb-0.5">Protected invariants:</div>
                    {futureSessionMutationWriterReadinessBoundaryModel.protectedInvariants.slice(0, 3).map((inv, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        {inv.protected ? '✓' : '✗'} {inv.invariant}
                      </div>
                    ))}
                    {futureSessionMutationWriterReadinessBoundaryModel.protectedInvariants.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{futureSessionMutationWriterReadinessBoundaryModel.protectedInvariants.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {futureSessionMutationWriterReadinessBoundaryModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-rose-400/60">
                  No writer instantiated. No future sessions written. No marker saved. No Program Cards changed. No Start Workout or Live Workout changes.
                </p>
              </div>
            )}
            {/* [MASTER-8C.38] Pre-Mutation Lock / Bundle Closure card */}
            {preMutationLockBundleClosureModel && (
              <div className="rounded-lg border border-fuchsia-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-fuchsia-300">
                    Pre-Mutation Lock / Bundle Closure
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-fuchsia-500/10 text-fuchsia-400/70 border-fuchsia-500/20">
                    read-only
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    pre-mutation lock
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no marker saved
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no workout changes
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const closureColor = getPreMutationLockBundleClosureStatusColor(preMutationLockBundleClosureModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", closureColor.bg, closureColor.text, closureColor.border)}>
                        {getPreMutationLockBundleClosureStatusLabel(preMutationLockBundleClosureModel.status)}
                      </span>
                    )
                  })()}
                  {preMutationLockBundleClosureModel.activeCautionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {preMutationLockBundleClosureModel.activeCautionCount} caution
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {preMutationLockBundleClosureModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {preMutationLockBundleClosureModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {preMutationLockBundleClosureModel.completedProtectedCount} completed (protected)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {preMutationLockBundleClosureModel.futureTargetCount} future (locked)
                  </span>
                </div>
                {/* Top blocked reasons (max 3) */}
                {preMutationLockBundleClosureModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {preMutationLockBundleClosureModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Gate summary (max 4) */}
                {preMutationLockBundleClosureModel.gateSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-fuchsia-400/60 mb-0.5">Gate summary:</div>
                    {preMutationLockBundleClosureModel.gateSummary.slice(0, 4).map((gate, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        {gate.locked ? '⊘' : '✓'} {gate.gate}: {gate.reason}
                      </div>
                    ))}
                    {preMutationLockBundleClosureModel.gateSummary.length > 4 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{preMutationLockBundleClosureModel.gateSummary.length - 4} more
                      </div>
                    )}
                  </div>
                )}
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {preMutationLockBundleClosureModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-fuchsia-400/60">
                  No mutation executed. No marker saved. No Program Cards changed. No Start Workout or Live Workout changes.
                </p>
              </div>
            )}
            {/* [MASTER-8C.39] Controlled Mutation Writer — Dry Run card */}
            {controlledFutureSessionMutationWriterDryRunModel && (
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-cyan-300">
                    Controlled Mutation Writer — Dry Run
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    dry-run only
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no program writes
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no marker saved
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no workout changes
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const dryRunColor = getControlledFutureSessionMutationWriterDryRunStatusColor(controlledFutureSessionMutationWriterDryRunModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", dryRunColor.bg, dryRunColor.text, dryRunColor.border)}>
                        {getControlledFutureSessionMutationWriterDryRunStatusLabel(controlledFutureSessionMutationWriterDryRunModel.status)}
                      </span>
                    )
                  })()}
                  {controlledFutureSessionMutationWriterDryRunModel.activeCautionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {controlledFutureSessionMutationWriterDryRunModel.activeCautionCount} caution
                    </span>
                  )}
                  {controlledFutureSessionMutationWriterDryRunModel.operationCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                      {controlledFutureSessionMutationWriterDryRunModel.operationCount} operation(s)
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {controlledFutureSessionMutationWriterDryRunModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {controlledFutureSessionMutationWriterDryRunModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {controlledFutureSessionMutationWriterDryRunModel.completedProtectedCount} completed (protected)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {controlledFutureSessionMutationWriterDryRunModel.targetSessionCount} target session(s)
                  </span>
                </div>
                {/* Top dry-run operations (max 3) */}
                {controlledFutureSessionMutationWriterDryRunModel.operations.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-cyan-400/60 mb-0.5">Dry-run operations:</div>
                    {controlledFutureSessionMutationWriterDryRunModel.operations.slice(0, 3).map((op, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        ○ {op.title} ({op.operationKind}) — {op.reason}
                      </div>
                    ))}
                    {controlledFutureSessionMutationWriterDryRunModel.operations.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{controlledFutureSessionMutationWriterDryRunModel.operations.length - 3} more operation(s)
                      </div>
                    )}
                  </div>
                )}
                {/* Top blocked reasons (max 3) */}
                {controlledFutureSessionMutationWriterDryRunModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {controlledFutureSessionMutationWriterDryRunModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Safety notes (max 3) */}
                {controlledFutureSessionMutationWriterDryRunModel.safetyNotes.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-emerald-400/60 mb-0.5">Safety notes:</div>
                    {controlledFutureSessionMutationWriterDryRunModel.safetyNotes.slice(0, 3).map((note, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        ✓ {note}
                      </div>
                    ))}
                    {controlledFutureSessionMutationWriterDryRunModel.safetyNotes.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{controlledFutureSessionMutationWriterDryRunModel.safetyNotes.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {controlledFutureSessionMutationWriterDryRunModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-cyan-400/60">
                  Dry run only. No sessions written. No marker saved. No Program Cards, Start Workout, or Live Workout changes.
                </p>
              </div>
            )}
            {/* [MASTER-8C.40] Bounded Mutation Apply Gate card */}
            {boundedMutationApplyEligibilityGateModel && (
              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-violet-300">
                    Bounded Mutation Apply Gate
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    confirmation locked
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    apply disabled
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no writes
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    future targets required
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const applyGateColor = getBoundedMutationApplyEligibilityStatusColor(boundedMutationApplyEligibilityGateModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", applyGateColor.bg, applyGateColor.text, applyGateColor.border)}>
                        {getBoundedMutationApplyEligibilityStatusLabel(boundedMutationApplyEligibilityGateModel.status)}
                      </span>
                    )
                  })()}
                  {boundedMutationApplyEligibilityGateModel.activeCautionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {boundedMutationApplyEligibilityGateModel.activeCautionCount} caution
                    </span>
                  )}
                  {boundedMutationApplyEligibilityGateModel.dryRunOperationCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                      {boundedMutationApplyEligibilityGateModel.dryRunOperationCount} dry-run op(s)
                    </span>
                  )}
                  {boundedMutationApplyEligibilityGateModel.eligibleOperationCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                      {boundedMutationApplyEligibilityGateModel.eligibleOperationCount} eligible
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {boundedMutationApplyEligibilityGateModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {boundedMutationApplyEligibilityGateModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {boundedMutationApplyEligibilityGateModel.completedProtectedCount} completed (protected)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {boundedMutationApplyEligibilityGateModel.targetSessionCount} target session(s)
                  </span>
                </div>
                {/* Top blocked reasons (max 3) */}
                {boundedMutationApplyEligibilityGateModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {boundedMutationApplyEligibilityGateModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Safety notes (max 3) */}
                {boundedMutationApplyEligibilityGateModel.safetyNotes.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-emerald-400/60 mb-0.5">Safety notes:</div>
                    {boundedMutationApplyEligibilityGateModel.safetyNotes.slice(0, 3).map((note, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        ✓ {note}
                      </div>
                    ))}
                    {boundedMutationApplyEligibilityGateModel.safetyNotes.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{boundedMutationApplyEligibilityGateModel.safetyNotes.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {boundedMutationApplyEligibilityGateModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-violet-400/60">
                  Apply gate only. No confirmation UI rendered. No marker saved. No Program Cards, Start Workout, or Live Workout changes.
                </p>
              </div>
            )}
            {/* [MASTER-8C.41] Marker-Only Confirmation Boundary card */}
            {markerOnlyConfirmationBoundaryModel && (
              <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-orange-300">
                    Marker-Only Confirmation Boundary
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    marker preview
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    confirmation locked
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no marker saved
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no writes
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const markerColor = getMarkerOnlyConfirmationBoundaryStatusColor(markerOnlyConfirmationBoundaryModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", markerColor.bg, markerColor.text, markerColor.border)}>
                        {getMarkerOnlyConfirmationBoundaryStatusLabel(markerOnlyConfirmationBoundaryModel.status)}
                      </span>
                    )
                  })()}
                  {/* [MASTER-8C.47] Show root/candidate clearance counts instead of raw activeCautionCount */}
                  {(markerOnlyConfirmationBoundaryModel.rootCandidateNeedsEvidenceCount ?? markerOnlyConfirmationBoundaryModel.activeCautionCount) > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {markerOnlyConfirmationBoundaryModel.rootCandidateNeedsEvidenceCount ?? markerOnlyConfirmationBoundaryModel.activeCautionCount} root/candidate
                    </span>
                  )}
                  {(markerOnlyConfirmationBoundaryModel.cascadeEchoCount ?? 0) > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {markerOnlyConfirmationBoundaryModel.cascadeEchoCount} cascade (diagnostic)
                    </span>
                  )}
                  {markerOnlyConfirmationBoundaryModel.dryRunOperationCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                      {markerOnlyConfirmationBoundaryModel.dryRunOperationCount} dry-run op(s)
                    </span>
                  )}
                  {markerOnlyConfirmationBoundaryModel.markerCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                      {markerOnlyConfirmationBoundaryModel.markerCandidateCount} marker candidate(s)
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {markerOnlyConfirmationBoundaryModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {markerOnlyConfirmationBoundaryModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {markerOnlyConfirmationBoundaryModel.completedProtectedCount} completed (protected)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {markerOnlyConfirmationBoundaryModel.targetSessionCount} target session(s)
                  </span>
                </div>
                {/* Top blocked reasons (max 3) */}
                {markerOnlyConfirmationBoundaryModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {markerOnlyConfirmationBoundaryModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Safety notes (max 3) */}
                {markerOnlyConfirmationBoundaryModel.safetyNotes.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-emerald-400/60 mb-0.5">Safety notes:</div>
                    {markerOnlyConfirmationBoundaryModel.safetyNotes.slice(0, 3).map((note, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        ✓ {note}
                      </div>
                    ))}
                    {markerOnlyConfirmationBoundaryModel.safetyNotes.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{markerOnlyConfirmationBoundaryModel.safetyNotes.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {/* Locked marker save pill */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[9px] px-2 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20 cursor-not-allowed">
                    marker save locked
                  </span>
                </div>
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {markerOnlyConfirmationBoundaryModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-orange-400/60">
                  Marker boundary only. No confirmation control enabled. No marker saved. No Program Cards, Start Workout, or Live Workout changes.
                </p>
              </div>
            )}
            {/* [MASTER-8C.42] Marker Save Authorization Preflight card */}
            {markerSaveAuthorizationPreflightBoundaryModel && (
              <div className="rounded-lg border border-pink-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-pink-300">
                    Marker Save Authorization Preflight
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-pink-500/10 text-pink-400/70 border-pink-500/20">
                    save preflight
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    authorization required
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no marker saved
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no writes
                  </span>
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const saveColor = getMarkerSaveAuthorizationPreflightStatusColor(markerSaveAuthorizationPreflightBoundaryModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", saveColor.bg, saveColor.text, saveColor.border)}>
                        {getMarkerSaveAuthorizationPreflightStatusLabel(markerSaveAuthorizationPreflightBoundaryModel.status)}
                      </span>
                    )
                  })()}
                  {/* [MASTER-8C.47] Show root/candidate clearance counts instead of raw activeCautionCount */}
                  {(markerSaveAuthorizationPreflightBoundaryModel.rootCandidateNeedsEvidenceCount ?? markerSaveAuthorizationPreflightBoundaryModel.activeCautionCount) > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {markerSaveAuthorizationPreflightBoundaryModel.rootCandidateNeedsEvidenceCount ?? markerSaveAuthorizationPreflightBoundaryModel.activeCautionCount} root/candidate
                    </span>
                  )}
                  {(markerSaveAuthorizationPreflightBoundaryModel.cascadeEchoCount ?? 0) > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {markerSaveAuthorizationPreflightBoundaryModel.cascadeEchoCount} cascade (diagnostic)
                    </span>
                  )}
                  {markerSaveAuthorizationPreflightBoundaryModel.markerCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                      {markerSaveAuthorizationPreflightBoundaryModel.markerCandidateCount} marker candidate(s)
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {markerSaveAuthorizationPreflightBoundaryModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {markerSaveAuthorizationPreflightBoundaryModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {markerSaveAuthorizationPreflightBoundaryModel.completedProtectedCount} completed (protected)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {markerSaveAuthorizationPreflightBoundaryModel.targetSessionCount} target session(s)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    0 marker saved
                  </span>
                </div>
                {/* Top blocked reasons (max 3) */}
                {markerSaveAuthorizationPreflightBoundaryModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {markerSaveAuthorizationPreflightBoundaryModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Safety notes (max 3) */}
                {markerSaveAuthorizationPreflightBoundaryModel.safetyNotes.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-emerald-400/60 mb-0.5">Safety notes:</div>
                    {markerSaveAuthorizationPreflightBoundaryModel.safetyNotes.slice(0, 3).map((note, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        ✓ {note}
                      </div>
                    ))}
                    {markerSaveAuthorizationPreflightBoundaryModel.safetyNotes.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{markerSaveAuthorizationPreflightBoundaryModel.safetyNotes.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {/* [Prompt 20] Local-only authorization preview control */}
                <div className="mb-2 p-2 rounded border border-[#2A2A35]/60 bg-[#12121A]/60">
                  <div className="text-[9px] text-pink-400/60 mb-1.5">Authorization Preview (local-only)</div>
                  {authPreviewBlocked ? (
                    <div className="text-[9px] text-slate-400/70">
                      Authorization locked until marker confirmation boundary is ready, cautions are cleared, and future targets exist.
                    </div>
                  ) : (
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markerSaveAuthorizationPreviewAccepted}
                        onChange={(e) => setMarkerSaveAuthorizationPreviewAccepted(e.target.checked)}
                        className="mt-0.5 h-3 w-3 rounded border-pink-500/30 bg-[#1A1A2E] text-pink-500 focus:ring-pink-500/30"
                      />
                      <span className="text-[9px] text-[#8A8A9A]">
                        I understand this is marker-only preview; no workout will change.
                      </span>
                    </label>
                  )}
                  <div className="text-[8px] text-[#6A6A7A] mt-1">
                    Local preview only. No marker saved. Resets on refresh.
                  </div>
                </div>
                {/* Locked marker save pill */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={cn(
                    "text-[9px] px-2 py-0.5 rounded border cursor-not-allowed",
                    markerSaveAuthorizationPreviewAccepted && !authPreviewBlocked
                      ? "bg-pink-500/10 text-pink-400/70 border-pink-500/20"
                      : "bg-slate-500/10 text-slate-400/70 border-slate-500/20"
                  )}>
                    {markerSaveAuthorizationPreviewAccepted && !authPreviewBlocked 
                      ? 'preview authorized (local)' 
                      : 'marker save locked'}
                  </span>
                </div>
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {markerSaveAuthorizationPreflightBoundaryModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-pink-400/60">
                  {markerSaveAuthorizationPreviewAccepted && !authPreviewBlocked 
                    ? 'Local preview authorization accepted. No marker saved. No writes. No Program Cards, Start Workout, or Live Workout changes.'
                    : 'Marker-save preflight only. No authorization control enabled. No marker saved. No Program Cards, Start Workout, or Live Workout changes.'}
                </p>
              </div>
            )}
            {/* [MASTER-8C.43] Controlled Marker Save Action Boundary card
                This is the FINAL action boundary before marker-only save.
                It intentionally remains locked while semantic root/candidate evidence blockers or no future targets exist.
                Structural workout mutation is NOT enabled in this step. */}
            {controlledMarkerSaveActionBoundaryModel && (
              <div className="rounded-lg border border-rose-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-rose-300">
                    Controlled Marker Save Action Boundary
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    action boundary
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    marker-only
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    no structural mutation
                  </span>
                  {!controlledMarkerSaveActionBoundaryModel.canWriteMarker && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      no writes
                    </span>
                  )}
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {(() => {
                    const actionColor = getControlledMarkerSaveActionStatusColor(controlledMarkerSaveActionBoundaryModel.status)
                    return (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", actionColor.bg, actionColor.text, actionColor.border)}>
                        {getControlledMarkerSaveActionStatusLabel(controlledMarkerSaveActionBoundaryModel.status)}
                      </span>
                    )
                  })()}
                  {controlledMarkerSaveActionBoundaryModel.activeCautionCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {controlledMarkerSaveActionBoundaryModel.activeCautionCount} caution
                    </span>
                  )}
                </div>
                {/* Headline and summary */}
                <p className="text-[10px] text-[#E6E9EF]/90 mb-1.5 font-medium">
                  {controlledMarkerSaveActionBoundaryModel.headline}
                </p>
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {controlledMarkerSaveActionBoundaryModel.summary}
                </p>
                {/* Session counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {controlledMarkerSaveActionBoundaryModel.completedProtectedCount} completed (protected)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {controlledMarkerSaveActionBoundaryModel.targetSessionCount} target session(s)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {controlledMarkerSaveActionBoundaryModel.markerSavedCount} marker saved
                  </span>
                </div>
                {/* Top blocked reasons (max 3) */}
                {controlledMarkerSaveActionBoundaryModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    {controlledMarkerSaveActionBoundaryModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-slate-400/60 mb-0.5">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Safety notes (max 3) */}
                {controlledMarkerSaveActionBoundaryModel.safetyNotes.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-emerald-400/60 mb-0.5">Safety notes:</div>
                    {controlledMarkerSaveActionBoundaryModel.safetyNotes.slice(0, 3).map((note, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        ✓ {note}
                      </div>
                    ))}
                    {controlledMarkerSaveActionBoundaryModel.safetyNotes.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{controlledMarkerSaveActionBoundaryModel.safetyNotes.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {/* [P38] Local marker save button - event handler controlled */}
                {controlledMarkerSaveActionBoundaryModel.canExecuteMarkerSave ? (
                  <div className="mb-2">
                    <button
                      onClick={handleLocalMarkerSave}
                      className="text-[9px] px-3 py-1 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                    >
                      Save marker locally
                    </button>
                    <p className="text-[8px] text-emerald-400/60 mt-1">
                      Click to save one local marker proof. No program/workout changes.
                    </p>
                  </div>
                ) : savedMarkerArtifact ? (
                  <div className="mb-2 p-2 rounded border border-emerald-500/30 bg-emerald-500/5">
                    <div className="text-[9px] text-emerald-400 font-medium mb-1">
                      1 marker saved locally
                    </div>
                    <div className="text-[8px] text-[#8A8A9A] space-y-0.5">
                      <div>ID: {savedMarkerArtifact.markerId}</div>
                      <div>Saved at: {savedMarkerArtifact.savedAtLabel}</div>
                      <div>Targets: {savedMarkerArtifact.targetSessionCount} session(s)</div>
                      <div>Protected: {savedMarkerArtifact.completedProtectedCount} completed</div>
                    </div>
                    <div className="text-[8px] text-emerald-400/60 mt-1 space-y-0.5">
                      <div>No Program Cards changed</div>
                      <div>No Start Workout changed</div>
                      <div>No Live Workout changed</div>
                      <div>Local proof only - resets on refresh</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20 cursor-not-allowed">
                      marker action locked
                    </span>
                  </div>
                )}
                {/* [Prompt 20] Local authorization preview state chip */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded border",
                    markerSaveAuthorizationPreviewAccepted && !authPreviewBlocked
                      ? "bg-pink-500/10 text-pink-400/70 border-pink-500/20"
                      : "bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40"
                  )}>
                    {markerSaveAuthorizationPreviewAccepted && !authPreviewBlocked 
                      ? 'local auth: accepted' 
                      : 'local auth: not accepted'}
                  </span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded border",
                    savedMarkerArtifact
                      ? "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20"
                      : controlledMarkerSaveActionBoundaryModel.canExecuteMarkerSave
                        ? "bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20"
                        : "bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40"
                  )}>
                    {savedMarkerArtifact
                      ? 'local marker: saved'
                      : controlledMarkerSaveActionBoundaryModel.canExecuteMarkerSave
                        ? 'local marker: ready'
                        : 'local marker: locked'}
                  </span>
                </div>
                {/* Next safe gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {controlledMarkerSaveActionBoundaryModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-rose-400/60">
                  {markerSaveAuthorizationPreviewAccepted && !authPreviewBlocked
                    ? 'Local preview authorization accepted. Marker writer not available. No marker saved. No writes.'
                    : 'Marker action boundary only. No marker saved. No Program Cards, Start Workout, or Live Workout changes.'}
                </p>
              </div>
            )}
            {/* [Prompt 21] Marker Save Artifact Preview card
                Pure read-only preview of what marker artifact would be saved.
                Shows exactly what would be saved later without saving anything. */}
            {markerSaveArtifactPreviewModel && (
              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">
                    Marker Save Artifact Preview
                  </span>
                </div>
                {/* Status chip */}
                {(() => {
                  const statusColor = getMarkerSaveArtifactPreviewStatusColor(markerSaveArtifactPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getMarkerSaveArtifactPreviewStatusLabel(markerSaveArtifactPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        mode: {markerSaveArtifactPreviewModel.markerMode}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        saved: {markerSaveArtifactPreviewModel.markerSavedCount}
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-violet-300/90 font-medium mb-1">
                  {markerSaveArtifactPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {markerSaveArtifactPreviewModel.summary}
                </p>
                {/* Preview ID if available */}
                {markerSaveArtifactPreviewModel.markerArtifactPreviewId && (
                  <div className="mb-2 p-1.5 rounded bg-[#12121A]/60 border border-violet-500/10">
                    <div className="text-[8px] text-violet-400/60 mb-0.5">Artifact Preview ID:</div>
                    <code className="text-[8px] text-violet-300/80 break-all">
                      {markerSaveArtifactPreviewModel.markerArtifactPreviewId}
                    </code>
                  </div>
                )}
                {/* Preview fields grid */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
                  {markerSaveArtifactPreviewModel.previewFields.slice(0, 8).map((field, i) => (
                    <div key={i} className="flex justify-between text-[8px]">
                      <span className="text-[#6A6A7A]">{field.label}:</span>
                      <span className="text-[#9A9AA9]">{field.value}</span>
                    </div>
                  ))}
                </div>
                {/* Source models used */}
                {markerSaveArtifactPreviewModel.sourceModelsUsed.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-violet-400/60 mb-0.5">Source models:</div>
                    <div className="flex flex-wrap gap-1">
                      {markerSaveArtifactPreviewModel.sourceModelsUsed.map((src, i) => (
                        <span key={i} className="text-[8px] px-1 py-0.5 rounded bg-violet-500/10 text-violet-300/70 border border-violet-500/20">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Blocked reasons if any */}
                {markerSaveArtifactPreviewModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocked reasons:</div>
                    {markerSaveArtifactPreviewModel.blockedReasons.slice(0, 3).map((reason, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        ⊘ {reason}
                      </div>
                    ))}
                  </div>
                )}
                {/* Safety notes */}
                {markerSaveArtifactPreviewModel.safetyNotes.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-emerald-400/60 mb-0.5">Safety notes:</div>
                    {markerSaveArtifactPreviewModel.safetyNotes.slice(0, 3).map((note, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        ✓ {note}
                      </div>
                    ))}
                    {markerSaveArtifactPreviewModel.safetyNotes.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{markerSaveArtifactPreviewModel.safetyNotes.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {/* Capability flags */}
                <div className="flex flex-wrap gap-1 mb-1.5">
                  <span className={cn(
                    "text-[8px] px-1 py-0.5 rounded border",
                    markerSaveArtifactPreviewModel.canPreviewMarkerArtifact
                      ? "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-400/70 border-slate-500/20"
                  )}>
                    preview: {markerSaveArtifactPreviewModel.canPreviewMarkerArtifact ? 'ready' : 'blocked'}
                  </span>
                  <span className="text-[8px] px-1 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    save: locked
                  </span>
                  <span className="text-[8px] px-1 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write: locked
                  </span>
                  <span className="text-[8px] px-1 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persist: locked
                  </span>
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-violet-400/60">
                  Preview only. No marker saved. No writes. No Program Cards, Start Workout, or Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 22] Marker Write Readiness Ledger card
                Pure read-only ledger summarizing all pre-writer conditions.
                Shows whether the system has every required condition for a future marker-only writer. */}
            {markerWriteReadinessLedgerModel && (
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">
                    Marker Write Readiness Ledger
                  </span>
                </div>
                {/* Status chip and mode */}
                {(() => {
                  const statusColor = getMarkerWriteReadinessLedgerStatusColor(markerWriteReadinessLedgerModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getMarkerWriteReadinessLedgerStatusLabel(markerWriteReadinessLedgerModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        mode: {markerWriteReadinessLedgerModel.ledgerMode.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        saved: {markerWriteReadinessLedgerModel.markerSavedCount}
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-cyan-300/90 font-medium mb-1">
                  {markerWriteReadinessLedgerModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {markerWriteReadinessLedgerModel.summary}
                </p>
                {/* Ready/blocked counts */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    ready: {markerWriteReadinessLedgerModel.readyCount}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    blocked: {markerWriteReadinessLedgerModel.blockedCount}
                  </span>
                </div>
                {/* Ledger items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                  <div className="text-[8px] text-cyan-400/60 mb-1.5">Pre-Writer Checklist:</div>
                  <div className="space-y-1">
                    {markerWriteReadinessLedgerModel.items.map((item) => {
                      const itemColor = getMarkerWriteReadinessItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn("text-[8px] px-1 py-0.5 rounded shrink-0", itemColor.bg, itemColor.text)}>
                            {item.status}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            <div className="text-[7px] text-[#6A6A7A] truncate">{item.reason}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Source models used */}
                {markerWriteReadinessLedgerModel.sourceModelsUsed.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-cyan-400/60 mb-0.5">Source models:</div>
                    <div className="flex flex-wrap gap-1">
                      {markerWriteReadinessLedgerModel.sourceModelsUsed.map((src, i) => (
                        <span key={i} className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-300/70 border border-cyan-500/20">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Blocker summary if any */}
                {markerWriteReadinessLedgerModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {markerWriteReadinessLedgerModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-cyan-400/60">Next: </span>
                  {markerWriteReadinessLedgerModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-cyan-400/60">
                  Read-only ledger. No marker saved. No writes. No Program Cards, Start Workout, or Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 41] Durable Marker Receipt Readiness card
                Pure read-only evaluation of whether local marker proof is eligible for future durable receipt.
                No persistence or workout mutation - candidate readiness evaluation only. */}
            {durableMarkerReceiptReadinessModel && (
              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">
                    Durable Marker Receipt Readiness
                  </span>
                </div>
                {/* Status chip and mode */}
                {(() => {
                  const statusColor = getDurableMarkerReceiptReadinessStatusColor(durableMarkerReceiptReadinessModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getDurableMarkerReceiptReadinessStatusLabel(durableMarkerReceiptReadinessModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        mode: {durableMarkerReceiptReadinessModel.receiptMode.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        receipt candidates: {durableMarkerReceiptReadinessModel.receiptCandidateCount}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: locked
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-violet-300/90 font-medium mb-1">
                  {durableMarkerReceiptReadinessModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {durableMarkerReceiptReadinessModel.summary}
                </p>
                {/* Ready/blocked counts */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    ready: {durableMarkerReceiptReadinessModel.readyCount}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    blocked: {durableMarkerReceiptReadinessModel.blockedCount}
                  </span>
                </div>
                {/* Receipt fields */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-violet-500/10">
                  <div className="text-[8px] text-violet-400/60 mb-1.5">Receipt Candidate Fields:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {durableMarkerReceiptReadinessModel.receiptFields.slice(0, 6).map((field) => (
                      <div key={field.label} className="flex items-center gap-1">
                        <span className="text-[8px] text-[#6A6A7A]">{field.label}:</span>
                        <span className="text-[8px] text-violet-300/70">{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Readiness items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-violet-500/10">
                  <div className="text-[8px] text-violet-400/60 mb-1.5">Readiness Checklist:</div>
                  <div className="space-y-1">
                    {durableMarkerReceiptReadinessModel.items.map((item) => (
                      <div key={item.key} className="flex items-start gap-2">
                        <span className={cn(
                          "text-[8px] px-1 py-0.5 rounded shrink-0",
                          item.status === 'ready' 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-amber-500/10 text-amber-400"
                        )}>
                          {item.status}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                          <div className="text-[7px] text-[#6A6A7A] truncate">{item.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {durableMarkerReceiptReadinessModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {durableMarkerReceiptReadinessModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-violet-400/60">Next: </span>
                  {durableMarkerReceiptReadinessModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-violet-400/60">
                  Read-only receipt candidate. No persistence. No Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 42] Controlled Durable Receipt Writer Preview card
                Pure read-only preview of future durable receipt writer contract.
                No persistence, receipt write, or workout mutation - contract preview only. */}
            {controlledDurableMarkerReceiptWriterPreviewModel && (
              <div className="rounded-lg border border-fuchsia-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-sm font-medium text-fuchsia-300">
                    Controlled Durable Receipt Writer Preview
                  </span>
                </div>
                {/* Status chip and mode */}
                {(() => {
                  const statusColor = getControlledDurableMarkerReceiptWriterPreviewStatusColor(controlledDurableMarkerReceiptWriterPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getControlledDurableMarkerReceiptWriterPreviewStatusLabel(controlledDurableMarkerReceiptWriterPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        mode: {controlledDurableMarkerReceiptWriterPreviewModel.mode.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        writer preview: {controlledDurableMarkerReceiptWriterPreviewModel.writerPreviewCandidateCount}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-fuchsia-300/90 font-medium mb-1">
                  {controlledDurableMarkerReceiptWriterPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {controlledDurableMarkerReceiptWriterPreviewModel.summary}
                </p>
                {/* Ready/blocked counts */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    ready: {controlledDurableMarkerReceiptWriterPreviewModel.readyCount}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    blocked: {controlledDurableMarkerReceiptWriterPreviewModel.blockedCount}
                  </span>
                </div>
                {/* Contract fields */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-fuchsia-500/10">
                  <div className="text-[8px] text-fuchsia-400/60 mb-1.5">Writer Contract Fields:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {controlledDurableMarkerReceiptWriterPreviewModel.contractFields.slice(0, 8).map((field) => (
                      <div key={field.key} className="flex items-center gap-1">
                        <span className="text-[8px] text-[#6A6A7A]">{field.label}:</span>
                        <span className="text-[8px] text-fuchsia-300/70">{field.value}</span>
                        {field.requiredForFutureWrite && (
                          <span className="text-[7px] text-amber-400/50">*</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Safety checklist */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-fuchsia-500/10">
                  <div className="text-[8px] text-fuchsia-400/60 mb-1.5">Safety Checklist:</div>
                  <div className="space-y-1">
                    {controlledDurableMarkerReceiptWriterPreviewModel.safetyItems.map((item) => (
                      <div key={item.key} className="flex items-start gap-2">
                        <span className={cn(
                          "text-[8px] px-1 py-0.5 rounded shrink-0",
                          item.status === 'ready' 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-amber-500/10 text-amber-400"
                        )}>
                          {item.status}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                          <div className="text-[7px] text-[#6A6A7A] truncate">{item.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {controlledDurableMarkerReceiptWriterPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {controlledDurableMarkerReceiptWriterPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-fuchsia-400/60">Next: </span>
                  {controlledDurableMarkerReceiptWriterPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-fuchsia-400/60">
                  Read-only writer contract preview. No persistence, no receipt write, no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 43] Persistence Activation Lock Gate card
                Explicit persistence activation lock gate. All persistence/write/API/DB/storage locked.
                No Program Cards / Start Workout / Live Workout changes. */}
            {persistenceWriterActivationLockGateModel && (
              <div className="rounded-lg border border-rose-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-rose-400" />
                  <span className="text-sm font-medium text-rose-300">
                    Persistence Activation Lock Gate
                  </span>
                </div>
                {/* Status chip and mode */}
                {(() => {
                  const statusColor = getPersistenceWriterActivationLockGateStatusColor(persistenceWriterActivationLockGateModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getPersistenceWriterActivationLockGateStatusLabel(persistenceWriterActivationLockGateModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        mode: {persistenceWriterActivationLockGateModel.mode.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        activation candidates: {persistenceWriterActivationLockGateModel.activationCandidateCount}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-rose-300/90 font-medium mb-1">
                  {persistenceWriterActivationLockGateModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {persistenceWriterActivationLockGateModel.summary}
                </p>
                {/* Satisfied/unsatisfied counts */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    satisfied: {persistenceWriterActivationLockGateModel.satisfiedRequirementCount}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    unsatisfied: {persistenceWriterActivationLockGateModel.unsatisfiedRequirementCount}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    locks: {persistenceWriterActivationLockGateModel.lockItemCount}
                  </span>
                </div>
                {/* Lock items checklist */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-rose-500/10">
                  <div className="text-[8px] text-rose-400/60 mb-1.5">Lock Items:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {persistenceWriterActivationLockGateModel.lockItems.slice(0, 12).map((item) => (
                      <div key={item.key} className="flex items-center gap-1">
                        <span className={cn(
                          "text-[7px] px-1 py-0.5 rounded",
                          item.status === 'locked' ? "bg-slate-500/10 text-slate-400" :
                          item.status === 'ready' ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-amber-500/10 text-amber-400"
                        )}>
                          {item.status}
                        </span>
                        <span className="text-[8px] text-[#8A8A9A] truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Activation requirements */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-rose-500/10">
                  <div className="text-[8px] text-rose-400/60 mb-1.5">Activation Requirements:</div>
                  <div className="space-y-1">
                    {persistenceWriterActivationLockGateModel.activationRequirements.slice(0, 10).map((req) => (
                      <div key={req.key} className="flex items-start gap-2">
                        <span className={cn(
                          "text-[7px] px-1 py-0.5 rounded shrink-0",
                          req.satisfiedNow ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        )}>
                          {req.satisfiedNow ? 'satisfied' : 'pending'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] text-[#9A9AA9]">{req.label}</span>
                          {req.requiredBeforeFutureWrite && (
                            <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {persistenceWriterActivationLockGateModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {persistenceWriterActivationLockGateModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-rose-400/60">Next: </span>
                  {persistenceWriterActivationLockGateModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-rose-400/60">
                  Explicit persistence lock gate. No receipt written. No DB/API/storage. No Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 44] Controlled Durable Receipt Writer No-Write Harness card
                Pure read-only no-write harness / persistence-disabled dry-run gate.
                No write attempt, receipt, API/DB/storage, or workout mutation. */}
            {controlledDurableMarkerReceiptWriterNoWriteHarnessModel && (
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">
                    Controlled Durable Receipt Writer No-Write Harness
                  </span>
                </div>
                {/* Status chip and mode */}
                {(() => {
                  const statusColor = getControlledDurableMarkerReceiptWriterNoWriteHarnessStatusColor(controlledDurableMarkerReceiptWriterNoWriteHarnessModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getControlledDurableMarkerReceiptWriterNoWriteHarnessStatusLabel(controlledDurableMarkerReceiptWriterNoWriteHarnessModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        dry-run candidates: {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.dryRunCandidateCount}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write attempted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-cyan-300/90 font-medium mb-1">
                  {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.summary}
                </p>
                {/* Safety counts */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    ready: {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.readySafetyCount}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    locked: {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.lockedSafetyCount}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    blocked: {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.blockedSafetyCount}
                  </span>
                </div>
                {/* Payload fields */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                  <div className="text-[8px] text-cyan-400/60 mb-1.5">Dry-Run Payload Fields:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.payloadFields.slice(0, 12).map((field) => (
                      <div key={field.key} className="flex items-center gap-1">
                        <span className="text-[8px] text-[#6A6A7A]">{field.label}:</span>
                        <span className="text-[8px] text-cyan-300/70">{field.value}</span>
                        {field.wouldBeWrittenLater && (
                          <span className="text-[7px] text-amber-400/50">*</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Safety items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                  <div className="text-[8px] text-cyan-400/60 mb-1.5">Safety Checklist:</div>
                  <div className="grid grid-cols-2 gap-1">
                    {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.safetyItems.slice(0, 14).map((item) => (
                      <div key={item.key} className="flex items-center gap-1">
                        <span className={cn(
                          "text-[7px] px-1 py-0.5 rounded",
                          item.status === 'ready' ? "bg-emerald-500/10 text-emerald-400" :
                          item.status === 'locked' ? "bg-slate-500/10 text-slate-400" :
                          "bg-amber-500/10 text-amber-400"
                        )}>
                          {item.status}
                        </span>
                        <span className="text-[8px] text-[#8A8A9A] truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-cyan-400/60">Next: </span>
                  {controlledDurableMarkerReceiptWriterNoWriteHarnessModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-cyan-400/60">
                  No-write harness only. No receipt written. No write attempted. No DB/API/storage. No Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 45] Durable Receipt Writer Eligibility Ledger card
                Pure read-only eligibility ledger for future durable receipt writer activation review.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {durableReceiptWriterEligibilityLedgerModel && (
              <div className="rounded-lg border border-lime-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-lime-400" />
                  <span className="text-sm font-medium text-lime-300">
                    Durable Receipt Writer Eligibility Ledger
                  </span>
                </div>
                {/* Status chip and mode */}
                {(() => {
                  const statusColor = getDurableReceiptWriterEligibilityLedgerStatusColor(durableReceiptWriterEligibilityLedgerModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getDurableReceiptWriterEligibilityLedgerStatusLabel(durableReceiptWriterEligibilityLedgerModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                        satisfied: {durableReceiptWriterEligibilityLedgerModel.eligibilitySummary.satisfiedItems}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        locked by design: {durableReceiptWriterEligibilityLedgerModel.eligibilitySummary.lockedByDesignItems}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        eligible for review: {durableReceiptWriterEligibilityLedgerModel.canProceedToFutureActivationReview ? 'yes' : 'no'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-lime-300/90 font-medium mb-1">
                  {durableReceiptWriterEligibilityLedgerModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {durableReceiptWriterEligibilityLedgerModel.summary}
                </p>
                {/* Compact summary row */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {durableReceiptWriterEligibilityLedgerModel.eligibilitySummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    satisfied: {durableReceiptWriterEligibilityLedgerModel.eligibilitySummary.satisfiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    locked: {durableReceiptWriterEligibilityLedgerModel.eligibilitySummary.lockedByDesignItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    blocked: {durableReceiptWriterEligibilityLedgerModel.eligibilitySummary.blockedItems}
                  </span>
                </div>
                {/* Eligibility items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-lime-500/10">
                  <div className="text-[8px] text-lime-400/60 mb-1.5">Eligibility Items:</div>
                  <div className="space-y-1">
                    {durableReceiptWriterEligibilityLedgerModel.eligibilityItems.slice(0, 14).map((item) => {
                      const itemColor = getDurableReceiptWriterEligibilityItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getDurableReceiptWriterEligibilityItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.requiredBeforeActivation && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {durableReceiptWriterEligibilityLedgerModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {durableReceiptWriterEligibilityLedgerModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-lime-400/60">Next: </span>
                  {durableReceiptWriterEligibilityLedgerModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-lime-400/60">
                  Eligibility ledger only. Persistence still disabled. No receipt written. No write attempted. No API/DB/storage/schema. No Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 46] Durable Receipt Writer Activation Preconditions Review card
                Pure read-only activation preconditions review.
                Real activation is NOT allowed. All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {durableReceiptWriterActivationPreconditionsReviewModel && (
              <div className="rounded-lg border border-teal-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-teal-300">
                    Durable Receipt Writer Activation Preconditions Review
                  </span>
                </div>
                {/* Status chip and mode */}
                {(() => {
                  const statusColor = getDurableReceiptWriterActivationPreconditionsReviewStatusColor(durableReceiptWriterActivationPreconditionsReviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getDurableReceiptWriterActivationPreconditionsReviewStatusLabel(durableReceiptWriterActivationPreconditionsReviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                        satisfied: {durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.satisfiedPreconditions}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        locked until activation: {durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.lockedUntilExplicitActivation}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                        future step: {durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.futureStepRequiredPreconditions}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        review ready: {durableReceiptWriterActivationPreconditionsReviewModel.readyForExplicitActivationRequestReview ? 'yes' : 'no'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        real activation: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-teal-300/90 font-medium mb-1">
                  {durableReceiptWriterActivationPreconditionsReviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {durableReceiptWriterActivationPreconditionsReviewModel.summary}
                </p>
                {/* Compact summary row */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.totalPreconditions}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    satisfied: {durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.satisfiedPreconditions}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    locked: {durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.lockedUntilExplicitActivation}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    future: {durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.futureStepRequiredPreconditions}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    blocked: {durableReceiptWriterActivationPreconditionsReviewModel.preconditionsSummary.blockedPreconditions}
                  </span>
                </div>
                {/* Preconditions */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                  <div className="text-[8px] text-teal-400/60 mb-1.5">Activation Preconditions:</div>
                  <div className="space-y-1">
                    {durableReceiptWriterActivationPreconditionsReviewModel.preconditions.slice(0, 14).map((precondition) => {
                      const preconditionColor = getDurableReceiptWriterActivationPreconditionStatusColor(precondition.status)
                      return (
                        <div key={precondition.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            preconditionColor.bg, preconditionColor.text
                          )}>
                            {getDurableReceiptWriterActivationPreconditionStatusLabel(precondition.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{precondition.label}</span>
                            {precondition.requiredBeforeRealActivation && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {durableReceiptWriterActivationPreconditionsReviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {durableReceiptWriterActivationPreconditionsReviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-teal-400/60">Next: </span>
                  {durableReceiptWriterActivationPreconditionsReviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-teal-400/60">
                  Preconditions review only. Persistence still disabled. Real activation is not allowed. No receipt written. No write attempted. No API/DB/storage/schema. No Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 47] Explicit Persistence Activation Request Preview card
                Pure read-only request preview - no activation requested, no authorization granted.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {explicitPersistenceActivationRequestPreviewModel && (
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">
                    Explicit Persistence Activation Request Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getExplicitPersistenceActivationRequestPreviewStatusColor(explicitPersistenceActivationRequestPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getExplicitPersistenceActivationRequestPreviewStatusLabel(explicitPersistenceActivationRequestPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        preview ready: {explicitPersistenceActivationRequestPreviewModel.canPreviewExplicitPersistenceActivationRequest ? 'yes' : 'no'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        real activation: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-cyan-300/90 font-medium mb-1">
                  {explicitPersistenceActivationRequestPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {explicitPersistenceActivationRequestPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {explicitPersistenceActivationRequestPreviewModel.requestSummary.totalRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    preview: {explicitPersistenceActivationRequestPreviewModel.requestSummary.previewAvailableRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    user action: {explicitPersistenceActivationRequestPreviewModel.requestSummary.futureExplicitUserActionRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    server: {explicitPersistenceActivationRequestPreviewModel.requestSummary.futureServerContractRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    storage: {explicitPersistenceActivationRequestPreviewModel.requestSummary.futureStorageContractRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    reload: {explicitPersistenceActivationRequestPreviewModel.requestSummary.futureReloadProofRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    locked: {explicitPersistenceActivationRequestPreviewModel.requestSummary.lockedByDesignRequirements}
                  </span>
                </div>
                {/* Request Preview Payload */}
                {explicitPersistenceActivationRequestPreviewModel.requestPreviewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                    <div className="text-[8px] text-cyan-400/60 mb-1.5">Request Preview Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">kind:</span> {explicitPersistenceActivationRequestPreviewModel.requestPreviewPayload.requestKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">capability:</span> {explicitPersistenceActivationRequestPreviewModel.requestPreviewPayload.requestedCapability}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">mode:</span> {explicitPersistenceActivationRequestPreviewModel.requestPreviewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">real activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">receipt written:</span> no
                      </div>
                    </div>
                  </div>
                )}
                {/* Requirements */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                  <div className="text-[8px] text-cyan-400/60 mb-1.5">Activation Request Requirements:</div>
                  <div className="space-y-1">
                    {explicitPersistenceActivationRequestPreviewModel.requirements.slice(0, 12).map((req) => {
                      const reqColor = getExplicitPersistenceActivationRequestRequirementStatusColor(req.status)
                      return (
                        <div key={req.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            reqColor.bg, reqColor.text
                          )}>
                            {getExplicitPersistenceActivationRequestRequirementStatusLabel(req.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{req.label}</span>
                            {req.requiredBeforeRealActivation && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {explicitPersistenceActivationRequestPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {explicitPersistenceActivationRequestPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-cyan-400/60">Next: </span>
                  {explicitPersistenceActivationRequestPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-cyan-400/60">
                  Request preview only. No explicit activation requested. Authorization locked. Persistence disabled. No writer, no receipt, no API/DB/storage/schema, no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 48] Activation Request Authorization Lock card
                Pure read-only authorization lock - preview verified but no activation/authorization granted.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {activationRequestAuthorizationLockModel && (
              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">
                    Activation Request Authorization Lock
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getActivationRequestAuthorizationLockStatusColor(activationRequestAuthorizationLockModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getActivationRequestAuthorizationLockStatusLabel(activationRequestAuthorizationLockModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        preview verified: {activationRequestAuthorizationLockModel.requestPreviewVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", activationRequestAuthorizationLockModel.authorizationLockEngaged ? "bg-violet-500/10 text-violet-400/70 border-violet-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        authorization lock: {activationRequestAuthorizationLockModel.authorizationLockEngaged ? 'engaged' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        future intent preview: {activationRequestAuthorizationLockModel.readyForFutureIntentCapturePreview ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit activation requested: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-violet-300/90 font-medium mb-1">
                  {activationRequestAuthorizationLockModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {activationRequestAuthorizationLockModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {activationRequestAuthorizationLockModel.lockSummary.totalRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    lock: {activationRequestAuthorizationLockModel.lockSummary.lockEngagedRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    preview: {activationRequestAuthorizationLockModel.lockSummary.previewVerifiedRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    user auth: {activationRequestAuthorizationLockModel.lockSummary.futureExplicitUserAuthorizationRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    server auth: {activationRequestAuthorizationLockModel.lockSummary.futureServerAuthorizationRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    persistence: {activationRequestAuthorizationLockModel.lockSummary.futurePersistenceContractRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    blocked: {activationRequestAuthorizationLockModel.lockSummary.blockedByDesignRequirements}
                  </span>
                </div>
                {/* Lock Payload */}
                {activationRequestAuthorizationLockModel.lockPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-violet-500/10">
                    <div className="text-[8px] text-violet-400/60 mb-1.5">Lock Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">kind:</span> {activationRequestAuthorizationLockModel.lockPayload.lockKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">capability:</span> {activationRequestAuthorizationLockModel.lockPayload.lockedCapability}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">mode:</span> {activationRequestAuthorizationLockModel.lockPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">authorization lock engaged:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">explicit activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">real activation allowed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">receipt written:</span> no
                      </div>
                    </div>
                  </div>
                )}
                {/* Requirements */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-violet-500/10">
                  <div className="text-[8px] text-violet-400/60 mb-1.5">Authorization Lock Requirements:</div>
                  <div className="space-y-1">
                    {activationRequestAuthorizationLockModel.requirements.slice(0, 12).map((req) => {
                      const reqColor = getActivationRequestAuthorizationLockRequirementStatusColor(req.status)
                      return (
                        <div key={req.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            reqColor.bg, reqColor.text
                          )}>
                            {getActivationRequestAuthorizationLockRequirementStatusLabel(req.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{req.label}</span>
                            {req.requiredBeforeRealActivation && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {activationRequestAuthorizationLockModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {activationRequestAuthorizationLockModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-violet-400/60">Next: </span>
                  {activationRequestAuthorizationLockModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-violet-400/60">
                  Authorization lock only. Request preview verified, but no activation requested or granted. Persistence disabled. No writer, no receipt, no API/DB/storage/schema, no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 49] Explicit Activation Request Intent Capture Preview card
                Pure read-only intent capture preview - authorization lock verified but no user intent captured.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {explicitActivationRequestIntentCapturePreviewModel && (
              <div className="rounded-lg border border-teal-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-teal-300">
                    Explicit Activation Request Intent Capture Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getExplicitActivationRequestIntentCapturePreviewStatusColor(explicitActivationRequestIntentCapturePreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getExplicitActivationRequestIntentCapturePreviewStatusLabel(explicitActivationRequestIntentCapturePreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        authorization lock verified: {explicitActivationRequestIntentCapturePreviewModel.authorizationLockVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", explicitActivationRequestIntentCapturePreviewModel.intentCapturePreviewReady ? "bg-teal-500/10 text-teal-400/70 border-teal-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        intent capture preview: {explicitActivationRequestIntentCapturePreviewModel.intentCapturePreviewReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        future auth review: {explicitActivationRequestIntentCapturePreviewModel.readyForFutureAuthorizationReviewPreview ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user intent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit activation requested: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-teal-300/90 font-medium mb-1">
                  {explicitActivationRequestIntentCapturePreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {explicitActivationRequestIntentCapturePreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {explicitActivationRequestIntentCapturePreviewModel.previewSummary.totalRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    lock verified: {explicitActivationRequestIntentCapturePreviewModel.previewSummary.sourceLockVerifiedRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    user intent: {explicitActivationRequestIntentCapturePreviewModel.previewSummary.futureUserIntentRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    confirmation: {explicitActivationRequestIntentCapturePreviewModel.previewSummary.futureConfirmationRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    scope review: {explicitActivationRequestIntentCapturePreviewModel.previewSummary.futureScopeReviewRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    reversal review: {explicitActivationRequestIntentCapturePreviewModel.previewSummary.futureReversalReviewRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    blocked: {explicitActivationRequestIntentCapturePreviewModel.previewSummary.blockedByDesignRequirements}
                  </span>
                </div>
                {/* Preview Payload */}
                {explicitActivationRequestIntentCapturePreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                    <div className="text-[8px] text-teal-400/60 mb-1.5">Preview Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">kind:</span> {explicitActivationRequestIntentCapturePreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">source auth lock:</span> {explicitActivationRequestIntentCapturePreviewModel.previewPayload.sourceAuthorizationLockStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">mode:</span> {explicitActivationRequestIntentCapturePreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">authorization lock verified:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">intent capture preview ready:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">explicit user intent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">explicit activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">real activation allowed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">intended future capability:</span> {explicitActivationRequestIntentCapturePreviewModel.previewPayload.intendedFutureCapability}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">future intent must be user visible:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">future intent must be program scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">future intent must preserve completed sessions:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Requirements */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                  <div className="text-[8px] text-teal-400/60 mb-1.5">Intent Capture Preview Requirements:</div>
                  <div className="space-y-1">
                    {explicitActivationRequestIntentCapturePreviewModel.requirements.slice(0, 12).map((req) => {
                      const reqColor = getExplicitActivationRequestIntentCaptureRequirementStatusColor(req.status)
                      return (
                        <div key={req.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            reqColor.bg, reqColor.text
                          )}>
                            {getExplicitActivationRequestIntentCaptureRequirementStatusLabel(req.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{req.label}</span>
                            {req.requiredBeforeRealActivation && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {explicitActivationRequestIntentCapturePreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {explicitActivationRequestIntentCapturePreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-teal-400/60">Next: </span>
                  {explicitActivationRequestIntentCapturePreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-teal-400/60">
                  Intent capture preview only. Authorization lock verified, but no user intent captured, no activation requested, no authorization granted. Persistence disabled. No writer, no receipt, no API/DB/storage/schema, no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 50] Explicit Activation Authorization Review Preview card
                Pure read-only authorization review preview - intent capture verified but no authorization reviewed.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {explicitActivationAuthorizationReviewPreviewModel && (
              <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">
                    Explicit Activation Authorization Review Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getExplicitActivationAuthorizationReviewPreviewStatusColor(explicitActivationAuthorizationReviewPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getExplicitActivationAuthorizationReviewPreviewStatusLabel(explicitActivationAuthorizationReviewPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        intent capture verified: {explicitActivationAuthorizationReviewPreviewModel.intentCapturePreviewVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", explicitActivationAuthorizationReviewPreviewModel.authorizationReviewPreviewReady ? "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        authorization review preview: {explicitActivationAuthorizationReviewPreviewModel.authorizationReviewPreviewReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        future permission boundary: {explicitActivationAuthorizationReviewPreviewModel.readyForFuturePermissionBoundaryPreview ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user intent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit activation requested: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization reviewed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        real activation allowed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-emerald-300/90 font-medium mb-1">
                  {explicitActivationAuthorizationReviewPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {explicitActivationAuthorizationReviewPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {explicitActivationAuthorizationReviewPreviewModel.previewSummary.totalRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    intent verified: {explicitActivationAuthorizationReviewPreviewModel.previewSummary.sourceIntentPreviewVerifiedRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    scope: {explicitActivationAuthorizationReviewPreviewModel.previewSummary.futureScopeRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    grant boundary: {explicitActivationAuthorizationReviewPreviewModel.previewSummary.futureGrantBoundaryRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    denial path: {explicitActivationAuthorizationReviewPreviewModel.previewSummary.futureDenialPathRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    revocation: {explicitActivationAuthorizationReviewPreviewModel.previewSummary.futureRevocationReviewRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    audit/receipt: {explicitActivationAuthorizationReviewPreviewModel.previewSummary.futureAuditReceiptReviewRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    blocked: {explicitActivationAuthorizationReviewPreviewModel.previewSummary.blockedByDesignRequirements}
                  </span>
                </div>
                {/* Preview Payload */}
                {explicitActivationAuthorizationReviewPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-emerald-500/10">
                    <div className="text-[8px] text-emerald-400/60 mb-1.5">Preview Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">kind:</span> {explicitActivationAuthorizationReviewPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">source intent preview:</span> {explicitActivationAuthorizationReviewPreviewModel.previewPayload.sourceIntentCapturePreviewStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">mode:</span> {explicitActivationAuthorizationReviewPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">intent capture preview verified:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">authorization review preview ready:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">explicit user intent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">explicit activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">authorization reviewed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">authorization denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">real activation allowed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">intended future capability:</span> {explicitActivationAuthorizationReviewPreviewModel.previewPayload.intendedFutureCapability}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">future auth must be user scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">future auth must be program scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">future auth must be explicit and revocable:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-emerald-400/50">future auth must preserve completed sessions:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Requirements */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-emerald-500/10">
                  <div className="text-[8px] text-emerald-400/60 mb-1.5">Authorization Review Preview Requirements:</div>
                  <div className="space-y-1">
                    {explicitActivationAuthorizationReviewPreviewModel.requirements.slice(0, 12).map((req) => {
                      const reqColor = getExplicitActivationAuthorizationReviewRequirementStatusColor(req.status)
                      return (
                        <div key={req.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            reqColor.bg, reqColor.text
                          )}>
                            {getExplicitActivationAuthorizationReviewRequirementStatusLabel(req.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{req.label}</span>
                            {req.requiredBeforeRealAuthorization && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {explicitActivationAuthorizationReviewPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {explicitActivationAuthorizationReviewPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-emerald-400/60">Next: </span>
                  {explicitActivationAuthorizationReviewPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-emerald-400/60">
                  Authorization review preview only. Intent preview verified, but no user intent captured, no activation requested, no authorization reviewed or granted. Persistence disabled. No writer, no receipt, no API/DB/storage/schema, no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 51] Controlled Activation Permission Boundary Preview card
                Pure read-only permission boundary preview - auth review verified but no permission granted.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {controlledActivationPermissionBoundaryPreviewModel && (
              <div className="rounded-lg border border-lime-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-lime-400" />
                  <span className="text-sm font-medium text-lime-300">
                    Controlled Activation Permission Boundary Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getControlledActivationPermissionBoundaryPreviewStatusColor(controlledActivationPermissionBoundaryPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getControlledActivationPermissionBoundaryPreviewStatusLabel(controlledActivationPermissionBoundaryPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        auth review verified: {controlledActivationPermissionBoundaryPreviewModel.authorizationReviewPreviewVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", controlledActivationPermissionBoundaryPreviewModel.permissionBoundaryPreviewReady ? "bg-lime-500/10 text-lime-400/70 border-lime-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        permission boundary preview: {controlledActivationPermissionBoundaryPreviewModel.permissionBoundaryPreviewReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        future explicit consent: {controlledActivationPermissionBoundaryPreviewModel.readyForFutureExplicitConsentPreview ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user intent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit activation requested: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization reviewed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        real activation allowed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-lime-300/90 font-medium mb-1">
                  {controlledActivationPermissionBoundaryPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {controlledActivationPermissionBoundaryPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.totalBoundaries}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    auth verified: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.sourceAuthorizationReviewVerifiedBoundaries}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    scope: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.futureScopeBoundaries}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    grant: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.futureGrantBoundaries}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    denial: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.futureDenialBoundaries}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                    activation: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.futureActivationAllowedBoundaries}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    writer: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.futureWriterBoundaries}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    receipt: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.futureReceiptBoundaries}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    blocked: {controlledActivationPermissionBoundaryPreviewModel.previewSummary.blockedByDesignBoundaries}
                  </span>
                </div>
                {/* Preview Payload */}
                {controlledActivationPermissionBoundaryPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-lime-500/10">
                    <div className="text-[8px] text-lime-400/60 mb-1.5">Preview Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">kind:</span> {controlledActivationPermissionBoundaryPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">source auth review:</span> {controlledActivationPermissionBoundaryPreviewModel.previewPayload.sourceAuthorizationReviewPreviewStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">mode:</span> {controlledActivationPermissionBoundaryPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">auth review preview verified:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">permission boundary preview ready:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">explicit user intent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">explicit activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">authorization reviewed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">permission denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">real activation allowed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">intended future capability:</span> {controlledActivationPermissionBoundaryPreviewModel.previewPayload.intendedFutureCapability}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">future permission must be user scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">future permission must be program scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">future permission must be marker scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">future permission must be explicit and revocable:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">future permission must have denied state:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-lime-400/50">future permission must preserve completed sessions:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Boundaries */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-lime-500/10">
                  <div className="text-[8px] text-lime-400/60 mb-1.5">Permission Boundary Preview:</div>
                  <div className="space-y-1">
                    {controlledActivationPermissionBoundaryPreviewModel.boundaries.slice(0, 12).map((b) => {
                      const bColor = getControlledActivationPermissionBoundaryStatusColor(b.status)
                      return (
                        <div key={b.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            bColor.bg, bColor.text
                          )}>
                            {getControlledActivationPermissionBoundaryStatusLabel(b.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{b.label}</span>
                            {b.requiredBeforeRealPermission && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {controlledActivationPermissionBoundaryPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {controlledActivationPermissionBoundaryPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-lime-400/60">Next: </span>
                  {controlledActivationPermissionBoundaryPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-lime-400/60">
                  Permission boundary preview only. Authorization review preview verified, but no user intent captured, no activation requested, no authorization reviewed or granted, no permission granted or denied. Persistence disabled. No writer, no receipt, no API/DB/storage/schema, no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 52] Explicit Persistence Activation Consent Preview card
                Pure read-only consent preview - permission boundary verified but no consent captured.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {explicitPersistenceActivationConsentPreviewModel && (
              <div className="rounded-lg border border-green-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">
                    Explicit Persistence Activation Consent Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getExplicitPersistenceActivationConsentPreviewStatusColor(explicitPersistenceActivationConsentPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getExplicitPersistenceActivationConsentPreviewStatusLabel(explicitPersistenceActivationConsentPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        permission boundary verified: {explicitPersistenceActivationConsentPreviewModel.permissionBoundaryPreviewVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", explicitPersistenceActivationConsentPreviewModel.consentPreviewReady ? "bg-green-500/10 text-green-400/70 border-green-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        consent preview: {explicitPersistenceActivationConsentPreviewModel.consentPreviewReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        future consent auth lock: {explicitPersistenceActivationConsentPreviewModel.readyForFutureConsentAuthorizationLock ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user consent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user intent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit activation requested: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization reviewed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        real activation allowed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-green-300/90 font-medium mb-1">
                  {explicitPersistenceActivationConsentPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {explicitPersistenceActivationConsentPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {explicitPersistenceActivationConsentPreviewModel.previewSummary.totalRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    boundary verified: {explicitPersistenceActivationConsentPreviewModel.previewSummary.sourcePermissionBoundaryVerifiedRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    explicit consent: {explicitPersistenceActivationConsentPreviewModel.previewSummary.futureExplicitConsentRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    consent scope: {explicitPersistenceActivationConsentPreviewModel.previewSummary.futureConsentScopeRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    revocation: {explicitPersistenceActivationConsentPreviewModel.previewSummary.futureConsentRevocationRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                    denial: {explicitPersistenceActivationConsentPreviewModel.previewSummary.futureConsentDenialRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    activation: {explicitPersistenceActivationConsentPreviewModel.previewSummary.futureActivationRequestRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    writer: {explicitPersistenceActivationConsentPreviewModel.previewSummary.futurePersistenceWriterRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    receipt: {explicitPersistenceActivationConsentPreviewModel.previewSummary.futureDurableReceiptRequirements}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    blocked: {explicitPersistenceActivationConsentPreviewModel.previewSummary.blockedByDesignRequirements}
                  </span>
                </div>
                {/* Preview Payload */}
                {explicitPersistenceActivationConsentPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-green-500/10">
                    <div className="text-[8px] text-green-400/60 mb-1.5">Preview Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">kind:</span> {explicitPersistenceActivationConsentPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">source permission boundary:</span> {explicitPersistenceActivationConsentPreviewModel.previewPayload.sourcePermissionBoundaryPreviewStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">mode:</span> {explicitPersistenceActivationConsentPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">permission boundary preview verified:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">consent preview ready:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">explicit user consent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">explicit user intent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">explicit activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">authorization reviewed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">permission denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">real activation allowed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">intended future capability:</span> {explicitPersistenceActivationConsentPreviewModel.previewPayload.intendedFutureCapability}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">future consent must be explicit:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">future consent must be user scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">future consent must be program scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">future consent must be marker scoped:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">future consent must be revocable:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">future consent must have denied state:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-green-400/50">future consent must preserve completed sessions:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Requirements */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-green-500/10">
                  <div className="text-[8px] text-green-400/60 mb-1.5">Consent Requirements Preview:</div>
                  <div className="space-y-1">
                    {explicitPersistenceActivationConsentPreviewModel.requirements.slice(0, 12).map((r) => {
                      const rColor = getExplicitPersistenceActivationConsentRequirementStatusColor(r.status)
                      return (
                        <div key={r.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            rColor.bg, rColor.text
                          )}>
                            {getExplicitPersistenceActivationConsentRequirementStatusLabel(r.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{r.label}</span>
                            {r.requiredBeforeRealConsent && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*required</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {explicitPersistenceActivationConsentPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {explicitPersistenceActivationConsentPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-green-400/60">Next: </span>
                  {explicitPersistenceActivationConsentPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-green-400/60">
                  Consent preview only. Permission boundary preview verified, but no consent captured, no user intent captured, no activation requested, no authorization reviewed or granted, no permission granted or denied. Persistence disabled. No writer, no receipt, no API/DB/storage/schema, no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 53] Consent Authorization Lock Preview card
                Pure read-only consent authorization lock - consent preview verified but authorization locked.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {consentAuthorizationLockPreviewModel && (
              <div className="rounded-lg border border-teal-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-teal-300">
                    Consent Authorization Lock Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getConsentAuthorizationLockPreviewStatusColor(consentAuthorizationLockPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getConsentAuthorizationLockPreviewStatusLabel(consentAuthorizationLockPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        consent preview verified: {consentAuthorizationLockPreviewModel.consentPreviewVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", consentAuthorizationLockPreviewModel.consentAuthorizationLockReady ? "bg-teal-500/10 text-teal-400/70 border-teal-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        consent auth lock: {consentAuthorizationLockPreviewModel.consentAuthorizationLockReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        future consent decision: {consentAuthorizationLockPreviewModel.readyForFutureConsentDecisionStatePreview ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user consent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user intent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit activation requested: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization reviewed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        real activation allowed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                        completed sessions: protected
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-teal-300/90 font-medium mb-1">
                  {consentAuthorizationLockPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {consentAuthorizationLockPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {consentAuthorizationLockPreviewModel.lockSummary.totalLockItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    consent verified: {consentAuthorizationLockPreviewModel.lockSummary.sourceConsentPreviewVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    auth locked: {consentAuthorizationLockPreviewModel.lockSummary.authorizationLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    consent missing: {consentAuthorizationLockPreviewModel.lockSummary.missingConsentCaptureItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    review missing: {consentAuthorizationLockPreviewModel.lockSummary.missingAuthorizationReviewItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    grant locked: {consentAuthorizationLockPreviewModel.lockSummary.grantPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    deny locked: {consentAuthorizationLockPreviewModel.lockSummary.denyPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    permission locked: {consentAuthorizationLockPreviewModel.lockSummary.permissionPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                    activation locked: {consentAuthorizationLockPreviewModel.lockSummary.activationPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence locked: {consentAuthorizationLockPreviewModel.lockSummary.persistencePathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-zinc-500/10 text-zinc-400/70 border-zinc-500/20">
                    receipt locked: {consentAuthorizationLockPreviewModel.lockSummary.receiptPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-neutral-500/10 text-neutral-400/70 border-neutral-500/20">
                    runtime locked: {consentAuthorizationLockPreviewModel.lockSummary.programRuntimeMutationLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed protected: {consentAuthorizationLockPreviewModel.lockSummary.completedSessionsProtectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {consentAuthorizationLockPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                    <div className="text-[8px] text-teal-400/60 mb-1.5">Lock Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">kind:</span> {consentAuthorizationLockPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">source consent preview:</span> {consentAuthorizationLockPreviewModel.previewPayload.sourceConsentPreviewStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">mode:</span> {consentAuthorizationLockPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">consent preview verified:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">consent authorization lock ready:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">explicit user consent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">explicit user intent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">explicit activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">authorization reviewed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">authorization denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">permission denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">real activation allowed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">future auth must require real consent:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">future auth must have grant path:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">future auth must have deny path:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">future auth must prevent fallthrough:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">future auth must preserve completed:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Lock Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                  <div className="text-[8px] text-teal-400/60 mb-1.5">Authorization Lock Items:</div>
                  <div className="space-y-1">
                    {consentAuthorizationLockPreviewModel.lockItems.slice(0, 12).map((item) => {
                      const itemColor = getConsentAuthorizationLockItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getConsentAuthorizationLockItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.lockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*locked</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {consentAuthorizationLockPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {consentAuthorizationLockPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-teal-400/60">Next: </span>
                  {consentAuthorizationLockPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-teal-400/60">
                  Consent authorization lock only. Consent preview verified, but no consent captured, no user intent captured, no activation requested, no authorization reviewed/granted/denied, no permission granted/denied. Persistence disabled. No writer, no receipt, no API/DB/storage/schema, no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 54] Consent Decision State Preview card
                Pure read-only consent decision-state preview - previews future grant/deny/undecided states.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {consentDecisionStatePreviewModel && (
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">
                    Consent Decision State Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getConsentDecisionStatePreviewStatusColor(consentDecisionStatePreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getConsentDecisionStatePreviewStatusLabel(consentDecisionStatePreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        consent auth lock verified: {consentDecisionStatePreviewModel.consentAuthorizationLockVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", consentDecisionStatePreviewModel.consentDecisionStatePreviewReady ? "bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        decision-state preview: {consentDecisionStatePreviewModel.consentDecisionStatePreviewReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        future review lock: {consentDecisionStatePreviewModel.readyForFutureConsentDecisionReviewLock ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                        current decision: {consentDecisionStatePreviewModel.currentConsentDecision === 'no_decision_collected' ? 'no decision collected' : consentDecisionStatePreviewModel.currentConsentDecision}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        consent decision collected: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        consent decision granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        consent decision denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                        consent undecided: yes
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user consent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user intent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit activation requested: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization reviewed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        real activation allowed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                        completed sessions: protected
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-cyan-300/90 font-medium mb-1">
                  {consentDecisionStatePreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {consentDecisionStatePreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {consentDecisionStatePreviewModel.decisionSummary.totalBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    no-decision blocking: {consentDecisionStatePreviewModel.decisionSummary.currentNoDecisionBlockingBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    grant locked: {consentDecisionStatePreviewModel.decisionSummary.futureGrantPathLockedBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    deny locked: {consentDecisionStatePreviewModel.decisionSummary.futureDenyPathLockedBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-yellow-500/10 text-yellow-400/70 border-yellow-500/20">
                    undecided locked: {consentDecisionStatePreviewModel.decisionSummary.futureUndecidedPathLockedBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400/70 border-red-500/20">
                    fallthrough blocked: {consentDecisionStatePreviewModel.decisionSummary.fallthroughBlockedBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence disabled: {consentDecisionStatePreviewModel.decisionSummary.persistenceDisabledBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-zinc-500/10 text-zinc-400/70 border-zinc-500/20">
                    receipt disabled: {consentDecisionStatePreviewModel.decisionSummary.receiptDisabledBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-neutral-500/10 text-neutral-400/70 border-neutral-500/20">
                    runtime disabled: {consentDecisionStatePreviewModel.decisionSummary.programRuntimeMutationDisabledBranches}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed protected: {consentDecisionStatePreviewModel.decisionSummary.completedSessionsProtectedBranches}
                  </span>
                </div>
                {/* Preview Payload */}
                {consentDecisionStatePreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                    <div className="text-[8px] text-cyan-400/60 mb-1.5">Decision State Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">kind:</span> {consentDecisionStatePreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">source consent auth lock:</span> {consentDecisionStatePreviewModel.previewPayload.sourceConsentAuthorizationLockStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">mode:</span> {consentDecisionStatePreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">current consent decision:</span> {consentDecisionStatePreviewModel.previewPayload.currentConsentDecision}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">consent auth lock verified:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">decision-state preview ready:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">consent decision collected:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">consent decision granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">consent decision denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">consent undecided:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">explicit user consent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">explicit user intent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">explicit activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">authorization reviewed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">authorization denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">permission denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">real activation allowed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">future decision must require explicit consent:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">future decision must separate grant and deny:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">future decision must block undecided state:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">future decision must prevent fallthrough authorization:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">future decision must preserve completed sessions:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Decision Branches */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                  <div className="text-[8px] text-cyan-400/60 mb-1.5">Decision Branches:</div>
                  <div className="space-y-1">
                    {consentDecisionStatePreviewModel.decisionBranches.slice(0, 9).map((branch) => {
                      const branchColor = getConsentDecisionStatePreviewBranchStatusColor(branch.status)
                      return (
                        <div key={branch.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            branchColor.bg, branchColor.text
                          )}>
                            {getConsentDecisionStatePreviewBranchStatusLabel(branch.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{branch.label}</span>
                            {branch.lockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*locked</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {consentDecisionStatePreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {consentDecisionStatePreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-cyan-400/60">Next: </span>
                  {consentDecisionStatePreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-cyan-400/60">
                  Consent decision-state preview only. No consent decision collected, no grant, no denial, no authorization review, no permission, no activation, no persistence, no writer, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 55] Consent Decision Review Lock card
                Pure read-only consent decision review lock - review is required but not performed.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {consentDecisionReviewLockPreviewModel && (
              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">
                    Consent Decision Review Lock
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getConsentDecisionReviewLockPreviewStatusColor(consentDecisionReviewLockPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getConsentDecisionReviewLockPreviewStatusLabel(consentDecisionReviewLockPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        decision-state preview verified: {consentDecisionReviewLockPreviewModel.consentDecisionStatePreviewVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", consentDecisionReviewLockPreviewModel.consentDecisionReviewLockReady ? "bg-violet-500/10 text-violet-400/70 border-violet-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        review lock: {consentDecisionReviewLockPreviewModel.consentDecisionReviewLockReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        future permission boundary: {consentDecisionReviewLockPreviewModel.readyForFutureConsentPermissionBoundaryPreview ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                        current review state: {consentDecisionReviewLockPreviewModel.currentReviewState === 'review_not_performed' ? 'review not performed' : consentDecisionReviewLockPreviewModel.currentReviewState}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        consent decision collected: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        consent decision granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        consent decision denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                        consent undecided: yes
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        review performed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        grant review approved: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        deny review approved: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user consent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit user intent captured: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        explicit activation requested: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization reviewed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        real activation allowed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API/DB/storage: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema: locked
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        workout mutation: disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                        completed sessions: protected
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-violet-300/90 font-medium mb-1">
                  {consentDecisionReviewLockPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {consentDecisionReviewLockPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {consentDecisionReviewLockPreviewModel.reviewLockSummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    source verified: {consentDecisionReviewLockPreviewModel.reviewLockSummary.sourceVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    review required: {consentDecisionReviewLockPreviewModel.reviewLockSummary.reviewRequiredNotPerformedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    grant review locked: {consentDecisionReviewLockPreviewModel.reviewLockSummary.grantReviewLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    deny review locked: {consentDecisionReviewLockPreviewModel.reviewLockSummary.denyReviewLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-yellow-500/10 text-yellow-400/70 border-yellow-500/20">
                    undecided review locked: {consentDecisionReviewLockPreviewModel.reviewLockSummary.undecidedReviewLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400/70 border-red-500/20">
                    fallthrough blocked: {consentDecisionReviewLockPreviewModel.reviewLockSummary.fallthroughBlockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-pink-500/10 text-pink-400/70 border-pink-500/20">
                    authorization locked: {consentDecisionReviewLockPreviewModel.reviewLockSummary.authorizationLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-fuchsia-500/10 text-fuchsia-400/70 border-fuchsia-500/20">
                    permission locked: {consentDecisionReviewLockPreviewModel.reviewLockSummary.permissionLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence disabled: {consentDecisionReviewLockPreviewModel.reviewLockSummary.persistenceDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-zinc-500/10 text-zinc-400/70 border-zinc-500/20">
                    receipt disabled: {consentDecisionReviewLockPreviewModel.reviewLockSummary.receiptDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-neutral-500/10 text-neutral-400/70 border-neutral-500/20">
                    runtime disabled: {consentDecisionReviewLockPreviewModel.reviewLockSummary.programRuntimeMutationDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed protected: {consentDecisionReviewLockPreviewModel.reviewLockSummary.completedSessionsProtectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {consentDecisionReviewLockPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-violet-500/10">
                    <div className="text-[8px] text-violet-400/60 mb-1.5">Review Lock Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">kind:</span> {consentDecisionReviewLockPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">source decision-state preview:</span> {consentDecisionReviewLockPreviewModel.previewPayload.sourceConsentDecisionStatePreviewStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">mode:</span> {consentDecisionReviewLockPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">current review state:</span> {consentDecisionReviewLockPreviewModel.previewPayload.currentReviewState}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">decision-state preview verified:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">review lock ready:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">consent decision collected:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">consent decision granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">consent decision denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">consent undecided:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">review performed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">grant review approved:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">deny review approved:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">explicit user consent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">explicit user intent captured:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">explicit activation requested:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">authorization reviewed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">authorization denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">permission denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">real activation allowed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">future review must require explicit consent decision:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">future review must separate grant and deny review:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">future review must block undecided state:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">future review must prevent fallthrough authorization:</span> yes
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-violet-400/50">future review must preserve completed sessions:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Review Lock Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-violet-500/10">
                  <div className="text-[8px] text-violet-400/60 mb-1.5">Review Lock Items:</div>
                  <div className="space-y-1">
                    {consentDecisionReviewLockPreviewModel.reviewLockItems.slice(0, 12).map((item) => {
                      const itemColor = getConsentDecisionReviewLockItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getConsentDecisionReviewLockItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.lockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*locked</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {consentDecisionReviewLockPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {consentDecisionReviewLockPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-violet-400/60">Next: </span>
                  {consentDecisionReviewLockPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-violet-400/60">
                  Consent decision review lock only. No consent decision review performed, no grant review approved, no deny review approved, no authorization, no permission, no activation, no persistence, no writer, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 56] Consent Permission Boundary Preview card
                Pure read-only consent permission boundary - permission not granted.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {consentPermissionBoundaryPreviewModel && (
              <div className="rounded-lg border border-indigo-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-300">
                    Consent Permission Boundary Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getConsentPermissionBoundaryPreviewStatusColor(consentPermissionBoundaryPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getConsentPermissionBoundaryPreviewStatusLabel(consentPermissionBoundaryPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        review lock verified: {consentPermissionBoundaryPreviewModel.consentDecisionReviewLockVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", consentPermissionBoundaryPreviewModel.consentPermissionBoundaryReady ? "bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        permission boundary: {consentPermissionBoundaryPreviewModel.consentPermissionBoundaryReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                        current permission state: {consentPermissionBoundaryPreviewModel.currentPermissionState === 'permission_not_granted' ? 'permission not granted' : consentPermissionBoundaryPreviewModel.currentPermissionState}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        consent decision collected: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        review performed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        permission denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence enabled: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write attempted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                        completed sessions: protected
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        future mutation enabled: no
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-indigo-300/90 font-medium mb-1">
                  {consentPermissionBoundaryPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {consentPermissionBoundaryPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    source verified: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.sourceVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    permission required: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.permissionRequiredNotGrantedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    grant locked: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.permissionGrantPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    deny locked: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.permissionDenyPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-yellow-500/10 text-yellow-400/70 border-yellow-500/20">
                    undecided locked: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.undecidedPermissionPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-pink-500/10 text-pink-400/70 border-pink-500/20">
                    authorization blocked: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.authorizationBlockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence disabled: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.persistenceDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-zinc-500/10 text-zinc-400/70 border-zinc-500/20">
                    write disabled: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.writeDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-neutral-500/10 text-neutral-400/70 border-neutral-500/20">
                    receipt disabled: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.receiptDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-gray-500/10 text-gray-400/70 border-gray-500/20">
                    runtime disabled: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.programRuntimeMutationDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed protected: {consentPermissionBoundaryPreviewModel.permissionBoundarySummary.completedSessionsProtectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {consentPermissionBoundaryPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-indigo-500/10">
                    <div className="text-[8px] text-indigo-400/60 mb-1.5">Permission Boundary Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">kind:</span> {consentPermissionBoundaryPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">source review lock:</span> {consentPermissionBoundaryPreviewModel.previewPayload.sourceConsentDecisionReviewLockStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">mode:</span> {consentPermissionBoundaryPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">current permission state:</span> {consentPermissionBoundaryPreviewModel.previewPayload.currentPermissionState}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">permission denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">write attempted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">program cards changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">start workout changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">live workout changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">completed sessions protected:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Permission Boundary Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-indigo-500/10">
                  <div className="text-[8px] text-indigo-400/60 mb-1.5">Permission Boundary Items:</div>
                  <div className="space-y-1">
                    {consentPermissionBoundaryPreviewModel.permissionBoundaryItems.slice(0, 11).map((item) => {
                      const itemColor = getConsentPermissionBoundaryItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getConsentPermissionBoundaryItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.lockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*locked</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {consentPermissionBoundaryPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {consentPermissionBoundaryPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-indigo-400/60">Next: </span>
                  {consentPermissionBoundaryPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-indigo-400/60">
                  Consent permission boundary preview only. Review lock is verified, but no permission has been granted or denied. No persistence, no writer, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 57] Persistence Permission Review Preview card
                Pure read-only persistence permission review - permission not granted.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {persistencePermissionReviewPreviewModel && (
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">
                    Persistence Permission Review Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getPersistencePermissionReviewPreviewStatusColor(persistencePermissionReviewPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getPersistencePermissionReviewPreviewStatusLabel(persistencePermissionReviewPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        consent boundary verified: {persistencePermissionReviewPreviewModel.consentPermissionBoundaryVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistencePermissionReviewPreviewModel.persistencePermissionReviewReady ? "bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        persistence review: {persistencePermissionReviewPreviewModel.persistencePermissionReviewReady ? 'ready' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                        current persistence permission state: {persistencePermissionReviewPreviewModel.currentPersistencePermissionState === 'persistence_permission_not_granted' ? 'persistence permission not granted' : persistencePermissionReviewPreviewModel.currentPersistencePermissionState}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        consent permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence permission denied: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence enabled: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write attempted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API route called: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        DB/storage used: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema touched: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                        completed sessions: protected
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        future mutation enabled: no
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-cyan-300/90 font-medium mb-1">
                  {persistencePermissionReviewPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {persistencePermissionReviewPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    boundary verified: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.consentBoundaryVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    permission required: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.persistencePermissionRequiredItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    grant locked: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.persistenceGrantPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    deny locked: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.persistenceDenyPathLockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-pink-500/10 text-pink-400/70 border-pink-500/20">
                    write blocked: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.writeAuthorizationBlockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    receipt disabled: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.durableReceiptDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-zinc-500/10 text-zinc-400/70 border-zinc-500/20">
                    API disabled: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.apiRouteDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-neutral-500/10 text-neutral-400/70 border-neutral-500/20">
                    DB disabled: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.dbStorageDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed protected: {persistencePermissionReviewPreviewModel.persistencePermissionReviewSummary.completedSessionsProtectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {persistencePermissionReviewPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                    <div className="text-[8px] text-cyan-400/60 mb-1.5">Persistence Permission Review Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">kind:</span> {persistencePermissionReviewPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">source consent permission boundary:</span> {persistencePermissionReviewPreviewModel.previewPayload.sourceConsentPermissionBoundaryStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">mode:</span> {persistencePermissionReviewPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">current persistence permission state:</span> {persistencePermissionReviewPreviewModel.previewPayload.currentPersistencePermissionState}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">consent permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">persistence permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">persistence permission denied:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">write attempted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">program cards changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">start workout changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">live workout changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">completed sessions protected:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Persistence Permission Review Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                  <div className="text-[8px] text-cyan-400/60 mb-1.5">Persistence Permission Review Items:</div>
                  <div className="space-y-1">
                    {persistencePermissionReviewPreviewModel.persistencePermissionReviewItems.slice(0, 14).map((item) => {
                      const itemColor = getPersistencePermissionReviewItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getPersistencePermissionReviewItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.lockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*locked</span>
                            )}
                            {item.disabledNow && (
                              <span className="text-[7px] text-slate-400/50 ml-1">*disabled</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {persistencePermissionReviewPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {persistencePermissionReviewPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-cyan-400/60">Next: </span>
                  {persistencePermissionReviewPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-cyan-400/60">
                  Persistence permission review preview only. Consent permission boundary is verified, but persistence permission has not been granted or denied. No persistence, no writer, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 58] Persistence Write Preflight Preview card
                Pure read-only write preflight preview - write preflight blocked.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {persistenceWritePreflightPreviewModel && (
              <div className="rounded-lg border border-teal-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-teal-300">
                    Persistence Write Preflight Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getPersistenceWritePreflightPreviewStatusColor(persistenceWritePreflightPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getPersistenceWritePreflightPreviewStatusLabel(persistenceWritePreflightPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        permission review verified: {persistenceWritePreflightPreviewModel.persistencePermissionReviewVerified ? 'yes' : 'no'}
                      </span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceWritePreflightPreviewModel.persistenceWritePreflightReady ? "bg-teal-500/10 text-teal-400/70 border-teal-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                        write preflight: {persistenceWritePreflightPreviewModel.persistenceWritePreflightReady ? 'blocked' : 'not ready'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                        current write preflight state: {persistenceWritePreflightPreviewModel.currentPersistenceWritePreflightState === 'write_preflight_blocked_permission_not_granted' ? 'blocked — permission not granted' : persistenceWritePreflightPreviewModel.currentPersistenceWritePreflightState || 'n/a'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence permission granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write authorization granted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        writer activation allowed: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        writer factory enabled: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence enabled: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write enabled: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        write attempted: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        receipt written: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        API route called: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        DB/storage used: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        schema touched: no
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                        completed sessions: protected
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        future mutation enabled: no
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-teal-300/90 font-medium mb-1">
                  {persistenceWritePreflightPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {persistenceWritePreflightPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                    review verified: {persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.permissionReviewVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    permission not granted: {persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.persistencePermissionNotGrantedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    preflight blocked: {persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.writePreflightBlockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    auth not granted: {persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.writeAuthorizationNotGrantedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-pink-500/10 text-pink-400/70 border-pink-500/20">
                    factory disabled: {persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.writerFactoryDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    receipt disabled: {persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.durableReceiptDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed protected: {persistenceWritePreflightPreviewModel.persistenceWritePreflightSummary.completedSessionsProtectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {persistenceWritePreflightPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                    <div className="text-[8px] text-teal-400/60 mb-1.5">Persistence Write Preflight Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">kind:</span> {persistenceWritePreflightPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">source persistence permission review:</span> {persistenceWritePreflightPreviewModel.previewPayload.sourcePersistencePermissionReviewStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">mode:</span> {persistenceWritePreflightPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">current write preflight state:</span> {persistenceWritePreflightPreviewModel.previewPayload.currentPersistenceWritePreflightState}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">persistence permission granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">write authorization granted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">writer factory enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">write enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">write attempted:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">receipt written:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">program cards changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">start workout changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">live workout changed:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">completed sessions protected:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Persistence Write Preflight Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                  <div className="text-[8px] text-teal-400/60 mb-1.5">Persistence Write Preflight Items:</div>
                  <div className="space-y-1">
                    {persistenceWritePreflightPreviewModel.persistenceWritePreflightItems.slice(0, 14).map((item) => {
                      const itemColor = getPersistenceWritePreflightItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getPersistenceWritePreflightItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.blockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*blocked</span>
                            )}
                            {item.disabledNow && (
                              <span className="text-[7px] text-slate-400/50 ml-1">*disabled</span>
                            )}
                            {item.protectedNow && (
                              <span className="text-[7px] text-emerald-400/50 ml-1">*protected</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {persistenceWritePreflightPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {persistenceWritePreflightPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-teal-400/60">Next: </span>
                  {persistenceWritePreflightPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-teal-400/60">
                  Persistence write preflight preview only. Permission review is verified, but persistence permission is not granted and write preflight remains blocked. No writer, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 59] Persistence Writer Activation Review Preview card
                Pure read-only activation review preview - activation reviewed but not allowed.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {persistenceWriterActivationReviewPreviewModel && (
              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-violet-400" />
                  <span className="text-sm font-medium text-violet-300">
                    Persistence Writer Activation Review Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getPersistenceWriterActivationReviewPreviewStatusColor(persistenceWriterActivationReviewPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getPersistenceWriterActivationReviewPreviewStatusLabel(persistenceWriterActivationReviewPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                        activation review
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        writer disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no write
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no receipt
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                        read-only
                      </span>
                    </div>
                  )
                })()}
                {/* Visible fields */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    preflight verified: {persistenceWriterActivationReviewPreviewModel.persistenceWritePreflightVerified ? 'yes' : 'no'}
                  </span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceWriterActivationReviewPreviewModel.writerActivationReviewed ? "bg-violet-500/10 text-violet-400/70 border-violet-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    writer activation reviewed: {persistenceWriterActivationReviewPreviewModel.writerActivationReviewed ? 'yes' : 'no'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    writer activation allowed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    writer factory enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write attempted: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    receipt written: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    API/DB/storage touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    schema touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    program cards changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    start workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    live workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    future session mutation enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed sessions protected: yes
                  </span>
                </div>
                {/* Headline */}
                <p className="text-[10px] text-violet-300/90 font-medium mb-1">
                  {persistenceWriterActivationReviewPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {persistenceWriterActivationReviewPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {persistenceWriterActivationReviewPreviewModel.writerActivationReviewSummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    reviewed: {persistenceWriterActivationReviewPreviewModel.writerActivationReviewSummary.writerActivationReviewedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    not allowed: {persistenceWriterActivationReviewPreviewModel.writerActivationReviewSummary.writerActivationNotAllowedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed protected: {persistenceWriterActivationReviewPreviewModel.writerActivationReviewSummary.completedSessionsProtectedItems}
                  </span>
                </div>
                {/* Writer Activation Review Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-violet-500/10">
                  <div className="text-[8px] text-violet-400/60 mb-1.5">Writer Activation Review Items:</div>
                  <div className="space-y-1">
                    {persistenceWriterActivationReviewPreviewModel.writerActivationReviewItems.slice(0, 14).map((item) => {
                      const itemColor = getPersistenceWriterActivationReviewItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getPersistenceWriterActivationReviewItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.reviewedNow && (
                              <span className="text-[7px] text-violet-400/50 ml-1">*reviewed</span>
                            )}
                            {item.blockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*blocked</span>
                            )}
                            {item.disabledNow && (
                              <span className="text-[7px] text-slate-400/50 ml-1">*disabled</span>
                            )}
                            {item.protectedNow && (
                              <span className="text-[7px] text-emerald-400/50 ml-1">*protected</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {persistenceWriterActivationReviewPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {persistenceWriterActivationReviewPreviewModel.blockerSummary.slice(0, 4).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-violet-400/60">Next: </span>
                  {persistenceWriterActivationReviewPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-violet-400/60">
                  Writer activation review preview only. Preflight review does not grant activation. No writer, no persistence, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 60] Persistence Boundary Review Preview card
                Pure read-only boundary review - boundary reviewed but writer boundary not opened.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {persistenceBoundaryReviewPreviewModel && (
              <div className="rounded-lg border border-indigo-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-300">
                    Persistence Boundary Review Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getPersistenceBoundaryReviewPreviewStatusColor(persistenceBoundaryReviewPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getPersistenceBoundaryReviewPreviewStatusLabel(persistenceBoundaryReviewPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                        boundary review
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        writer disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no write
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no receipt
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                        read-only
                      </span>
                    </div>
                  )
                })()}
                {/* Visible fields */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceBoundaryReviewPreviewModel.previousWriterActivationReviewVerified ? "bg-violet-500/10 text-violet-400/70 border-violet-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    previous writer activation review verified: {persistenceBoundaryReviewPreviewModel.previousWriterActivationReviewVerified ? 'yes' : 'no'}
                  </span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceBoundaryReviewPreviewModel.boundaryReviewed ? "bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    persistence boundary reviewed: {persistenceBoundaryReviewPreviewModel.boundaryReviewed ? 'yes' : 'no'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    real writer boundary opened: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    writer factory enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write attempted: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    receipt written: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    API/DB/storage touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    schema touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    program cards changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    start workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    live workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    future session mutation enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed sessions protected: yes
                  </span>
                </div>
                {/* Headline */}
                <p className="text-[10px] text-indigo-300/90 font-medium mb-1">
                  {persistenceBoundaryReviewPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {persistenceBoundaryReviewPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {persistenceBoundaryReviewPreviewModel.boundaryReviewSummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    activation verified: {persistenceBoundaryReviewPreviewModel.boundaryReviewSummary.activationReviewVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    boundary reviewed: {persistenceBoundaryReviewPreviewModel.boundaryReviewSummary.boundaryReviewedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    not opened: {persistenceBoundaryReviewPreviewModel.boundaryReviewSummary.boundaryNotOpenedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    disabled: {persistenceBoundaryReviewPreviewModel.boundaryReviewSummary.writerDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    protected: {persistenceBoundaryReviewPreviewModel.boundaryReviewSummary.completedSessionsProtectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {persistenceBoundaryReviewPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-indigo-500/10">
                    <div className="text-[8px] text-indigo-400/60 mb-1.5">Boundary Review Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">kind:</span> {persistenceBoundaryReviewPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">source activation review status:</span> {persistenceBoundaryReviewPreviewModel.previewPayload.sourceWriterActivationReviewStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">mode:</span> {persistenceBoundaryReviewPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">review state:</span> {persistenceBoundaryReviewPreviewModel.previewPayload.currentBoundaryReviewState}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">real writer boundary opened:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">writer factory enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-indigo-400/50">completed sessions protected:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Boundary Review Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-indigo-500/10">
                  <div className="text-[8px] text-indigo-400/60 mb-1.5">Boundary Review Items:</div>
                  <div className="space-y-1">
                    {persistenceBoundaryReviewPreviewModel.boundaryReviewItems.slice(0, 15).map((item) => {
                      const itemColor = getPersistenceBoundaryReviewItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getPersistenceBoundaryReviewItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.activationReviewVerifiedNow && (
                              <span className="text-[7px] text-violet-400/50 ml-1">*verified</span>
                            )}
                            {item.boundaryReviewedNow && (
                              <span className="text-[7px] text-indigo-400/50 ml-1">*reviewed</span>
                            )}
                            {item.blockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*blocked</span>
                            )}
                            {item.disabledNow && (
                              <span className="text-[7px] text-slate-400/50 ml-1">*disabled</span>
                            )}
                            {item.protectedNow && (
                              <span className="text-[7px] text-emerald-400/50 ml-1">*protected</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {persistenceBoundaryReviewPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {persistenceBoundaryReviewPreviewModel.blockerSummary.slice(0, 5).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-indigo-400/60">Next: </span>
                  {persistenceBoundaryReviewPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-indigo-400/60">
                  Persistence boundary review preview only. Writer activation review does not open the real writer boundary. No persistence, no write, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 61] Persistence Writer Gate Preview card
                Pure read-only writer gate preview - gate reviewed but NOT opened.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {persistenceWriterGatePreviewModel && (
              <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">
                    Persistence Writer Gate Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getPersistenceWriterGatePreviewStatusColor(persistenceWriterGatePreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getPersistenceWriterGatePreviewStatusLabel(persistenceWriterGatePreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                        writer gate preview
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        writer disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no write
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no receipt
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                        read-only
                      </span>
                    </div>
                  )
                })()}
                {/* Visible fields */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceWriterGatePreviewModel.previousBoundaryReviewVerified ? "bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    previous boundary review verified: {persistenceWriterGatePreviewModel.previousBoundaryReviewVerified ? 'yes' : 'no'}
                  </span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceWriterGatePreviewModel.writerGateReviewed ? "bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    writer gate reviewed: {persistenceWriterGatePreviewModel.writerGateReviewed ? 'yes' : 'no'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    writer gate opened: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    writer factory enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write attempted: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    receipt written: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    API/DB/storage touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    schema touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    program cards changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    start workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    live workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    future session mutation enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed sessions protected: yes
                  </span>
                </div>
                {/* Headline */}
                <p className="text-[10px] text-cyan-300/90 font-medium mb-1">
                  {persistenceWriterGatePreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {persistenceWriterGatePreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {persistenceWriterGatePreviewModel.writerGateSummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400/70 border-indigo-500/20">
                    boundary verified: {persistenceWriterGatePreviewModel.writerGateSummary.boundaryReviewVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    gate reviewed: {persistenceWriterGatePreviewModel.writerGateSummary.writerGateReviewedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    not opened: {persistenceWriterGatePreviewModel.writerGateSummary.writerGateNotOpenedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    disabled: {persistenceWriterGatePreviewModel.writerGateSummary.writerDisabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    protected: {persistenceWriterGatePreviewModel.writerGateSummary.completedSessionsProtectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {persistenceWriterGatePreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                    <div className="text-[8px] text-cyan-400/60 mb-1.5">Writer Gate Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">kind:</span> {persistenceWriterGatePreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">source boundary review status:</span> {persistenceWriterGatePreviewModel.previewPayload.sourceBoundaryReviewStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">mode:</span> {persistenceWriterGatePreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">gate state:</span> {persistenceWriterGatePreviewModel.previewPayload.currentWriterGateState}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">real writer gate opened:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">writer factory enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-cyan-400/50">completed sessions protected:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Writer Gate Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-cyan-500/10">
                  <div className="text-[8px] text-cyan-400/60 mb-1.5">Writer Gate Items:</div>
                  <div className="space-y-1">
                    {persistenceWriterGatePreviewModel.writerGateItems.slice(0, 16).map((item) => {
                      const itemColor = getPersistenceWriterGateItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getPersistenceWriterGateItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.boundaryReviewVerifiedNow && (
                              <span className="text-[7px] text-indigo-400/50 ml-1">*verified</span>
                            )}
                            {item.writerGateReviewedNow && (
                              <span className="text-[7px] text-cyan-400/50 ml-1">*reviewed</span>
                            )}
                            {item.blockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*blocked</span>
                            )}
                            {item.disabledNow && (
                              <span className="text-[7px] text-slate-400/50 ml-1">*disabled</span>
                            )}
                            {item.protectedNow && (
                              <span className="text-[7px] text-emerald-400/50 ml-1">*protected</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {persistenceWriterGatePreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {persistenceWriterGatePreviewModel.blockerSummary.slice(0, 5).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-cyan-400/60">Next: </span>
                  {persistenceWriterGatePreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-cyan-400/60">
                  Persistence writer gate preview only. Boundary review does not open the real writer gate. No persistence, no write, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 62] Persistence Writer Boundary Step Preview card
                Pure read-only boundary step preview - step reviewed but writer NOT opened.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {persistenceWriterBoundaryStepPreviewModel && (
              <div className="rounded-lg border border-teal-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-teal-300">
                    Persistence Writer Boundary Step Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getPersistenceWriterBoundaryStepPreviewStatusColor(persistenceWriterBoundaryStepPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getPersistenceWriterBoundaryStepPreviewStatusLabel(persistenceWriterBoundaryStepPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                        boundary step preview
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        writer closed
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no write
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no receipt
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                        read-only
                      </span>
                    </div>
                  )
                })()}
                {/* Visible fields */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceWriterBoundaryStepPreviewModel.previousWriterGateVerified ? "bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    previous writer gate verified: {persistenceWriterBoundaryStepPreviewModel.previousWriterGateVerified ? 'yes' : 'no'}
                  </span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceWriterBoundaryStepPreviewModel.currentBoundaryStepReviewed ? "bg-teal-500/10 text-teal-400/70 border-teal-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    current boundary step reviewed: {persistenceWriterBoundaryStepPreviewModel.currentBoundaryStepReviewed ? 'yes' : 'no'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    writer opened: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write attempted: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    receipt written: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    API/DB/storage touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    schema touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    program cards changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    start workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    live workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    future session mutation enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed sessions protected: yes
                  </span>
                </div>
                {/* Headline */}
                <p className="text-[10px] text-teal-300/90 font-medium mb-1">
                  {persistenceWriterBoundaryStepPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {persistenceWriterBoundaryStepPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {persistenceWriterBoundaryStepPreviewModel.boundaryStepSummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    gate verified: {persistenceWriterBoundaryStepPreviewModel.boundaryStepSummary.writerGateVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                    step reviewed: {persistenceWriterBoundaryStepPreviewModel.boundaryStepSummary.boundaryStepReviewedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    disabled: {persistenceWriterBoundaryStepPreviewModel.boundaryStepSummary.disabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    protected: {persistenceWriterBoundaryStepPreviewModel.boundaryStepSummary.protectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {persistenceWriterBoundaryStepPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                    <div className="text-[8px] text-teal-400/60 mb-1.5">Boundary Step Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">kind:</span> {persistenceWriterBoundaryStepPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">source writer gate status:</span> {persistenceWriterBoundaryStepPreviewModel.previewPayload.sourceWriterGateStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">mode:</span> {persistenceWriterBoundaryStepPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">step state:</span> {persistenceWriterBoundaryStepPreviewModel.previewPayload.currentBoundaryStepState}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">real writer opened:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">writer factory enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-teal-400/50">completed sessions protected:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Boundary Step Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-teal-500/10">
                  <div className="text-[8px] text-teal-400/60 mb-1.5">Boundary Step Items:</div>
                  <div className="space-y-1">
                    {persistenceWriterBoundaryStepPreviewModel.boundaryStepItems.slice(0, 14).map((item) => {
                      const itemColor = getPersistenceWriterBoundaryStepItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getPersistenceWriterBoundaryStepItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.writerGateVerifiedNow && (
                              <span className="text-[7px] text-cyan-400/50 ml-1">*gate</span>
                            )}
                            {item.boundaryStepReviewedNow && (
                              <span className="text-[7px] text-teal-400/50 ml-1">*step</span>
                            )}
                            {item.disabledNow && (
                              <span className="text-[7px] text-slate-400/50 ml-1">*disabled</span>
                            )}
                            {item.protectedNow && (
                              <span className="text-[7px] text-emerald-400/50 ml-1">*protected</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {persistenceWriterBoundaryStepPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {persistenceWriterBoundaryStepPreviewModel.blockerSummary.slice(0, 5).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-teal-400/60">Next: </span>
                  {persistenceWriterBoundaryStepPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-teal-400/60">
                  Persistence writer boundary step preview only. Writer gate review does not open the real writer. No persistence, no write, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 63] Persistence Writer Boundary Continuity Preview card
                Pure read-only boundary continuity preview - continuity reviewed but writer NOT opened.
                All persistence/write/API/DB/storage/schema/program/workout mutation disabled. */}
            {persistenceWriterBoundaryContinuityPreviewModel && (
              <div className="rounded-lg border border-sky-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-sky-400" />
                  <span className="text-sm font-medium text-sky-300">
                    Persistence Writer Boundary Continuity Preview
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getPersistenceWriterBoundaryContinuityPreviewStatusColor(persistenceWriterBoundaryContinuityPreviewModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getPersistenceWriterBoundaryContinuityPreviewStatusLabel(persistenceWriterBoundaryContinuityPreviewModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                        boundary continuity preview
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        persistence disabled
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        writer closed
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no write
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        no receipt
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                        read-only
                      </span>
                    </div>
                  )
                })()}
                {/* Visible fields */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceWriterBoundaryContinuityPreviewModel.previousBoundaryStepVerified ? "bg-teal-500/10 text-teal-400/70 border-teal-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    previous boundary step verified: {persistenceWriterBoundaryContinuityPreviewModel.previousBoundaryStepVerified ? 'yes' : 'no'}
                  </span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", persistenceWriterBoundaryContinuityPreviewModel.currentContinuityReviewComplete ? "bg-sky-500/10 text-sky-400/70 border-sky-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    current continuity review complete: {persistenceWriterBoundaryContinuityPreviewModel.currentContinuityReviewComplete ? 'yes' : 'no'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                    writer opened: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write attempted: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    receipt written: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    API/DB/storage touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    schema touched: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    program cards changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    start workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    live workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    future session mutation enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed sessions protected: yes
                  </span>
                </div>
                {/* Headline */}
                <p className="text-[10px] text-sky-300/90 font-medium mb-1">
                  {persistenceWriterBoundaryContinuityPreviewModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {persistenceWriterBoundaryContinuityPreviewModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {persistenceWriterBoundaryContinuityPreviewModel.continuitySummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                    step verified: {persistenceWriterBoundaryContinuityPreviewModel.continuitySummary.boundaryStepVerifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                    continuity reviewed: {persistenceWriterBoundaryContinuityPreviewModel.continuitySummary.continuityReviewedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    disabled: {persistenceWriterBoundaryContinuityPreviewModel.continuitySummary.disabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    blocked: {persistenceWriterBoundaryContinuityPreviewModel.continuitySummary.blockedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    protected: {persistenceWriterBoundaryContinuityPreviewModel.continuitySummary.protectedItems}
                  </span>
                </div>
                {/* Preview Payload */}
                {persistenceWriterBoundaryContinuityPreviewModel.previewPayload && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-sky-500/10">
                    <div className="text-[8px] text-sky-400/60 mb-1.5">Boundary Continuity Payload:</div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-sky-400/50">kind:</span> {persistenceWriterBoundaryContinuityPreviewModel.previewPayload.previewKind}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-sky-400/50">source boundary step status:</span> {persistenceWriterBoundaryContinuityPreviewModel.previewPayload.sourceBoundaryStepStatus}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-sky-400/50">mode:</span> {persistenceWriterBoundaryContinuityPreviewModel.previewPayload.currentMode}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-sky-400/50">continuity state:</span> {persistenceWriterBoundaryContinuityPreviewModel.previewPayload.currentContinuityState}
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-sky-400/50">real writer opened:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-sky-400/50">writer factory enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-sky-400/50">persistence enabled:</span> no
                      </div>
                      <div className="text-[8px] text-[#9A9AA9]">
                        <span className="text-sky-400/50">completed sessions protected:</span> yes
                      </div>
                    </div>
                  </div>
                )}
                {/* Continuity Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-sky-500/10">
                  <div className="text-[8px] text-sky-400/60 mb-1.5">Continuity Items:</div>
                  <div className="space-y-1">
                    {persistenceWriterBoundaryContinuityPreviewModel.continuityItems.slice(0, 12).map((item) => {
                      const itemColor = getPersistenceWriterBoundaryContinuityItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getPersistenceWriterBoundaryContinuityItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                            {item.boundaryStepVerifiedNow && (
                              <span className="text-[7px] text-teal-400/50 ml-1">*step</span>
                            )}
                            {item.continuityReviewedNow && (
                              <span className="text-[7px] text-sky-400/50 ml-1">*continuity</span>
                            )}
                            {item.disabledNow && (
                              <span className="text-[7px] text-slate-400/50 ml-1">*disabled</span>
                            )}
                            {item.blockedNow && (
                              <span className="text-[7px] text-amber-400/50 ml-1">*blocked</span>
                            )}
                            {item.protectedNow && (
                              <span className="text-[7px] text-emerald-400/50 ml-1">*protected</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {persistenceWriterBoundaryContinuityPreviewModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Blocker summary:</div>
                    {persistenceWriterBoundaryContinuityPreviewModel.blockerSummary.slice(0, 5).map((b, i) => (
                      <div key={i} className="text-[9px] text-amber-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-sky-400/60">Next: </span>
                  {persistenceWriterBoundaryContinuityPreviewModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-sky-400/60">
                  Persistence writer boundary continuity preview only. Boundary step review does not open the real writer. No persistence, no write, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 64] Mutation Unlock Roadmap Decision Gate card
                DECISION GATE - NOT another redundant closed-boundary card.
                Answers: Are we ready for writer-open preview next? */}
            {mutationUnlockRoadmapDecisionGateModel && (
              <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-300">
                    Mutation Unlock Roadmap Decision Gate
                  </span>
                </div>
                {/* Status chips */}
                {(() => {
                  const statusColor = getMutationUnlockDecisionStatusColor(mutationUnlockRoadmapDecisionGateModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getMutationUnlockDecisionStatusLabel(mutationUnlockRoadmapDecisionGateModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                        decision gate
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                        not a redundant card
                      </span>
                    </div>
                  )
                })()}
                {/* Key decision fields */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", mutationUnlockRoadmapDecisionGateModel.redundantClosedBoundaryCardsShouldStop ? "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20" : "bg-slate-500/10 text-slate-400/70 border-slate-500/20")}>
                    redundant closed-boundary cards should stop: {mutationUnlockRoadmapDecisionGateModel.redundantClosedBoundaryCardsShouldStop ? 'yes' : 'no'}
                  </span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", mutationUnlockRoadmapDecisionGateModel.readyForWriterOpenPreviewNext ? "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20" : "bg-rose-500/10 text-rose-400/70 border-rose-500/20")}>
                    ready for writer-open preview next: {mutationUnlockRoadmapDecisionGateModel.readyForWriterOpenPreviewNext ? 'yes' : 'no'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    known remaining read-only steps: {mutationUnlockRoadmapDecisionGateModel.knownRemainingReadOnlySteps ?? 'not found in repo'}
                  </span>
                </div>
                {/* Safety fields */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    persistence enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    writer opened: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    write attempted: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    receipt written: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    program cards changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    start workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    live workout changed: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    future session mutation enabled: no
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    completed sessions protected: yes
                  </span>
                </div>
                {/* Headline */}
                <p className="text-[10px] text-amber-300/90 font-medium mb-1">
                  {mutationUnlockRoadmapDecisionGateModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {mutationUnlockRoadmapDecisionGateModel.summary}
                </p>
                {/* Compact counts */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    total: {mutationUnlockRoadmapDecisionGateModel.decisionSummary.totalItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    verified: {mutationUnlockRoadmapDecisionGateModel.decisionSummary.verifiedItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    ready: {mutationUnlockRoadmapDecisionGateModel.decisionSummary.readyItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                    disabled: {mutationUnlockRoadmapDecisionGateModel.decisionSummary.disabledItems}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-violet-500/10 text-violet-400/70 border-violet-500/20">
                    protected: {mutationUnlockRoadmapDecisionGateModel.decisionSummary.protectedItems}
                  </span>
                  {mutationUnlockRoadmapDecisionGateModel.decisionSummary.blockedItems > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                      blocked: {mutationUnlockRoadmapDecisionGateModel.decisionSummary.blockedItems}
                    </span>
                  )}
                </div>
                {/* Decision Items */}
                <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-amber-500/10">
                  <div className="text-[8px] text-amber-400/60 mb-1.5">Decision Items:</div>
                  <div className="space-y-1">
                    {mutationUnlockRoadmapDecisionGateModel.decisionItems.slice(0, 11).map((item) => {
                      const itemColor = getMutationUnlockDecisionItemStatusColor(item.status)
                      return (
                        <div key={item.key} className="flex items-start gap-2">
                          <span className={cn(
                            "text-[7px] px-1 py-0.5 rounded shrink-0",
                            itemColor.bg, itemColor.text
                          )}>
                            {getMutationUnlockDecisionItemStatusLabel(item.status)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] text-[#9A9AA9]">{item.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Blocker summary if any */}
                {mutationUnlockRoadmapDecisionGateModel.blockedReasons.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-rose-400/60 mb-0.5">Blockers:</div>
                    {mutationUnlockRoadmapDecisionGateModel.blockedReasons.slice(0, 5).map((b, i) => (
                      <div key={i} className="text-[9px] text-rose-300/70 mb-0.5 pl-2">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[9px] text-emerald-400/80 font-medium">
                    Next required step:
                  </div>
                  <div className="text-[9px] text-emerald-300/90 mt-0.5">
                    {mutationUnlockRoadmapDecisionGateModel.nextRequiredStep}
                  </div>
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-amber-400/60">
                  This is a DECISION GATE, not another redundant closed-boundary card. No Program Cards changed. No Start Workout changed. No Live Workout changed. This is not real mutation yet.
                </p>
              </div>
            )}
            {/* [MASTER-8C.44] Current Program Target Scope proof card */}
            {sessionIdentityModel && (
              <div className="rounded-lg border border-indigo-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-indigo-300">
                    Current Program Target Scope
                  </span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded border",
                    sessionIdentityModel.programScopeAvailable
                      ? "bg-violet-500/10 text-violet-400/70 border-violet-500/20"
                      : "bg-amber-500/10 text-amber-400/70 border-amber-500/20"
                  )}>
                    {sessionIdentityModel.programScopeAvailable ? 'scoped' : 'legacy/unscoped'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    identity proof
                  </span>
                </div>
                {/* Counts row */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                    {sessionIdentityModel.programScopedCompletedDayNumbers.length} current-program completed
                  </span>
                  {sessionIdentityModel.ignoredLogCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                      {sessionIdentityModel.ignoredLogCount} stale logs ignored
                    </span>
                  )}
                  {mutationTargetSessionResolutionPreviewModel && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                      {mutationTargetSessionResolutionPreviewModel.futureSessionCount} future target(s)
                    </span>
                  )}
                </div>
                {/* Scope details */}
                {sessionIdentityModel.programScopeAvailable && sessionIdentityModel.currentProgramId && (
                  <p className="text-[9px] text-[#8A8A9A] mb-1 truncate">
                    Program: {sessionIdentityModel.currentProgramId.slice(0, 24)}...
                  </p>
                )}
                {sessionIdentityModel.programScopedCompletedDayNumbers.length > 0 && (
                  <p className="text-[9px] text-[#8A8A9A] mb-1">
                    Completed days: {sessionIdentityModel.programScopedCompletedDayNumbers.join(', ')}
                  </p>
                )}
                {/* Scope safety notes */}
                {sessionIdentityModel.scopeSafetyNotes.length > 0 && (
                  <div className="mb-1.5">
                    {sessionIdentityModel.scopeSafetyNotes.slice(0, 3).map((note, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5">
                        {sessionIdentityModel.programScopeAvailable ? '✓' : '⚠'} {note}
                      </div>
                    ))}
                  </div>
                )}
                {/* Safety line */}
                <p className="text-[10px] text-indigo-400/60">
                  {sessionIdentityModel.programScopeAvailable
                    ? 'Only logs matching this program can mark days completed. Stale logs are ignored.'
                    : 'Program identity unavailable. Legacy day-number matching is in use. No mutation allowed from unscoped proof.'}
                </p>
              </div>
            )}
            {/* [MASTER-8C.45] Caution Provenance proof card */}
            {mutationCautionClearanceGateModel && (
              <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-amber-300">
                    Caution Provenance
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    provenance
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    deduped
                  </span>
                </div>
                {/* Provenance counts row */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded border",
                    mutationCautionClearanceGateModel.rootActiveCautionCount > 0
                      ? "bg-rose-500/10 text-rose-400/70 border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20"
                  )}>
                    {mutationCautionClearanceGateModel.rootActiveCautionCount} root
                  </span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded border",
                    mutationCautionClearanceGateModel.candidateSpecificCautionCount > 0
                      ? "bg-amber-500/10 text-amber-400/70 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20"
                  )}>
                    {mutationCautionClearanceGateModel.candidateSpecificCautionCount} candidate
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {mutationCautionClearanceGateModel.derivedCascadeCautionCount} cascade
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                    {mutationCautionClearanceGateModel.allRawCautionSignalCount} raw
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    {mutationCautionClearanceGateModel.futureSessionCount} future target(s)
                  </span>
                </div>
                {/* Provenance summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {mutationCautionClearanceGateModel.cautionProvenanceSummary}
                </p>
                {/* Top root/candidate caution signals (max 3) */}
                {mutationCautionClearanceGateModel.dedupedActiveCautionSignals.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-amber-400/60 mb-0.5">Root/candidate evidence blockers:</div>
                    {mutationCautionClearanceGateModel.dedupedActiveCautionSignals.slice(0, 3).map((signal, i) => (
                      <div key={i} className="text-[9px] text-[#8A8A9A] mb-0.5 pl-2">
                        {signal.provenance === 'root' ? '!' : '*'} {signal.label}
                      </div>
                    ))}
                    {mutationCautionClearanceGateModel.dedupedActiveCautionSignals.length > 3 && (
                      <div className="text-[9px] text-[#8A8A9A] pl-2">
                        +{mutationCautionClearanceGateModel.dedupedActiveCautionSignals.length - 3} more
                      </div>
                    )}
                  </div>
                )}
                {/* Cascade explanation */}
                {mutationCautionClearanceGateModel.derivedCascadeCautionCount > 0 && (
                  <p className="text-[9px] text-slate-400/60 mb-1">
                    Downstream gate echoes are diagnostic and do not multiply the root blocker.
                  </p>
                )}
                {/* Next gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {mutationCautionClearanceGateModel.nextSafeGate}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-amber-400/60">
                  {mutationCautionClearanceGateModel.activeCautionCount > 0
                    ? 'Hard/waiting/unknown root-candidate evidence must resolve before marker preview can proceed. Cascade echoes are diagnostic only.'
                    : 'No hard root-candidate evidence blockers. Derived cascade signals are diagnostic only.'}
                </p>
              </div>
            )}
            {/* [MASTER-8C.46] Root/Candidate Clearance card */}
            {mutationCautionClearanceGateModel && mutationCautionClearanceGateModel.rootCandidateClearanceItems.length > 0 && (
              <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-orange-300">
                    Root/Candidate Clearance
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400/70 border-orange-500/20">
                    clearance
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400/70 border-cyan-500/20">
                    {mutationCautionClearanceGateModel.futureSessionCount} future target(s)
                  </span>
                </div>
                {/* Clearance status counts */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {mutationCautionClearanceGateModel.blockingRootCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400/70 border-rose-500/20">
                      {mutationCautionClearanceGateModel.blockingRootCandidateCount} blocking
                    </span>
                  )}
                  {mutationCautionClearanceGateModel.clearableRootCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400/70 border-emerald-500/20">
                      {mutationCautionClearanceGateModel.clearableRootCandidateCount} clearable
                    </span>
                  )}
                  {mutationCautionClearanceGateModel.waitingRootCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400/70 border-sky-500/20">
                      {mutationCautionClearanceGateModel.waitingRootCandidateCount} waiting
                    </span>
                  )}
                  {mutationCautionClearanceGateModel.monitorOnlyRootCandidateCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                      {mutationCautionClearanceGateModel.monitorOnlyRootCandidateCount} monitor-only
                    </span>
                  )}
                  {mutationCautionClearanceGateModel.staleOrMisclassifiedCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-slate-500/10 text-slate-400/70 border-slate-500/20">
                      {mutationCautionClearanceGateModel.staleOrMisclassifiedCount} stale
                    </span>
                  )}
                </div>
                {/* Clearance summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-1.5">
                  {mutationCautionClearanceGateModel.rootCandidateClearanceSummary}
                </p>
                {/* Top clearance items (max 3) */}
                <div className="mb-1.5">
                  <div className="text-[9px] text-orange-400/60 mb-0.5">Clearance items:</div>
                  {mutationCautionClearanceGateModel.rootCandidateClearanceItems.slice(0, 3).map((item, i) => (
                    <div key={i} className="text-[9px] text-[#8A8A9A] mb-1 pl-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={cn(
                          "px-1 py-0.5 rounded text-[8px]",
                          item.status === 'blocking' ? "bg-rose-500/20 text-rose-400" :
                          item.status === 'waiting_for_more_evidence' ? "bg-sky-500/20 text-sky-400" :
                          item.status === 'monitor_only' ? "bg-slate-500/20 text-slate-400" :
                          item.status === 'clearable_by_current_evidence' ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-[#2A2A35] text-[#8A8A9A]"
                        )}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[#8A8A9A] truncate max-w-[160px]">{item.label}</span>
                      </div>
                      <div className="text-[8px] text-[#6A6A7A] mt-0.5 pl-1">
                        {item.requirement.replace(/_/g, ' ')}: {item.clearanceExplanation.slice(0, 80)}
                      </div>
                    </div>
                  ))}
                  {mutationCautionClearanceGateModel.rootCandidateClearanceItems.length > 3 && (
                    <div className="text-[9px] text-[#8A8A9A] pl-2">
                      +{mutationCautionClearanceGateModel.rootCandidateClearanceItems.length - 3} more
                    </div>
                  )}
                </div>
                {/* Next gate */}
                <p className="text-[9px] text-[#8A8A9A] mb-1">
                  Next: {mutationCautionClearanceGateModel.blockingRootCandidateCount > 0 
                    ? 'Clear blocking root/candidate evidence before marker preview'
                    : mutationCautionClearanceGateModel.waitingRootCandidateCount > 0
                    ? 'Collect/confirm evidence before marker preview'
                    : 'Marker-only preview/authorization readiness'}
                </p>
                {/* Safety line */}
                <p className="text-[10px] text-orange-400/60">
                  Read-only clearance proof. No marker saved. No Program Cards, Start Workout, or Live Workout changes.
                </p>
              </div>
            )}
            {/* [Prompt 23] Root/Candidate Clearance Evidence Detail card
                Pure read-only explanation of each root/candidate item with source evidence. */}
            {rootCandidateClearanceEvidenceDetailModel && (
              <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-[#1A1A2E]/80 to-[#12121A]/90 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileSearch className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-orange-300">
                    Root/Candidate Evidence Detail
                  </span>
                </div>
                {/* Status chip and mode */}
                {(() => {
                  const statusColor = getRootCandidateClearanceEvidenceDetailStatusColor(rootCandidateClearanceEvidenceDetailModel.status)
                  return (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded border", statusColor.bg, statusColor.text, statusColor.border)}>
                        {getRootCandidateClearanceEvidenceDetailStatusLabel(rootCandidateClearanceEvidenceDetailModel.status)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#1A1A2E]/60 text-[#8A8A9A] border-[#2A2A35]/40">
                        mode: {rootCandidateClearanceEvidenceDetailModel.mode.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )
                })()}
                {/* Headline */}
                <p className="text-[10px] text-orange-300/90 font-medium mb-1">
                  {rootCandidateClearanceEvidenceDetailModel.headline}
                </p>
                {/* Summary */}
                <p className="text-[9px] text-[#8A8A9A] mb-2">
                  {rootCandidateClearanceEvidenceDetailModel.summary}
                </p>
                {/* Counts row */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[8px] px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400/70 border-red-500/20">
                    blocking: {rootCandidateClearanceEvidenceDetailModel.blockingCount}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded border bg-teal-500/10 text-teal-400/70 border-teal-500/20">
                    clearable RO: {rootCandidateClearanceEvidenceDetailModel.clearableReadOnlyCount}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-400/70 border-blue-500/20">
                    diagnostic: {rootCandidateClearanceEvidenceDetailModel.diagnosticOnlyCount}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400/70 border-amber-500/20">
                    missing evidence: {rootCandidateClearanceEvidenceDetailModel.missingEvidenceCount}
                  </span>
                </div>
                {/* Item details */}
                {rootCandidateClearanceEvidenceDetailModel.items.length > 0 && (
                  <div className="mb-2 p-2 rounded bg-[#12121A]/60 border border-orange-500/10">
                    <div className="text-[8px] text-orange-400/60 mb-1.5">Evidence Items:</div>
                    <div className="space-y-1.5">
                      {rootCandidateClearanceEvidenceDetailModel.items.slice(0, 5).map((item) => {
                        const itemColor = getRootCandidateEvidenceItemStatusColor(item.status)
                        return (
                          <div key={item.id} className="p-1.5 rounded bg-[#1A1A2E]/40 border border-[#2A2A35]/30">
                            <div className="flex items-start gap-2 mb-1">
                              <span className={cn("text-[7px] px-1 py-0.5 rounded shrink-0", itemColor.bg, itemColor.text)}>
                                {getRootCandidateEvidenceItemStatusLabel(item.status)}
                              </span>
                              <span className="text-[8px] px-1 py-0.5 rounded bg-slate-500/10 text-slate-400 shrink-0">
                                {item.category}
                              </span>
                              {item.blocksMarkerReadiness && (
                                <span className="text-[7px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 shrink-0">
                                  blocks marker
                                </span>
                              )}
                            </div>
                            <div className="text-[8px] text-[#9A9AA9] font-medium mb-0.5">{item.label}</div>
                            <div className="text-[7px] text-[#7A7A8A] mb-0.5">Source: {item.evidenceSource}</div>
                            <div className="text-[7px] text-[#6A6A7A] truncate">{item.evidenceSummary}</div>
                            {item.missingEvidence.length > 0 && (
                              <div className="text-[7px] text-amber-400/60 mt-0.5">
                                Missing: {item.missingEvidence.join(', ')}
                              </div>
                            )}
                            <div className="text-[7px] text-[#8A8A9A] mt-0.5">
                              Next: {item.nextRequiredAction}
                            </div>
                          </div>
                        )
                      })}
                      {rootCandidateClearanceEvidenceDetailModel.items.length > 5 && (
                        <div className="text-[8px] text-[#6A6A7A]">
                          +{rootCandidateClearanceEvidenceDetailModel.items.length - 5} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Blocker summary if any */}
                {rootCandidateClearanceEvidenceDetailModel.blockerSummary.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-red-400/60 mb-0.5">Blocker summary:</div>
                    {rootCandidateClearanceEvidenceDetailModel.blockerSummary.slice(0, 3).map((b, i) => (
                      <div key={i} className="text-[8px] text-red-300/70 mb-0.5 pl-2 truncate">
                        - {b}
                      </div>
                    ))}
                  </div>
                )}
                {/* Source models */}
                {rootCandidateClearanceEvidenceDetailModel.sourceModelsUsed.length > 0 && (
                  <div className="mb-1.5">
                    <div className="text-[9px] text-orange-400/60 mb-0.5">Source models:</div>
                    <div className="flex flex-wrap gap-1">
                      {rootCandidateClearanceEvidenceDetailModel.sourceModelsUsed.map((src, i) => (
                        <span key={i} className="text-[7px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-300/70 border border-orange-500/20">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Next required step */}
                <div className="mb-1.5 text-[9px] text-[#8A8A9A]">
                  <span className="text-orange-400/60">Next: </span>
                  {rootCandidateClearanceEvidenceDetailModel.nextRequiredStep}
                </div>
                {/* Safety line */}
                <p className="text-[10px] text-orange-400/60">
                  Read-only evidence detail. No evidence items were cleared or changed. No marker saved. No writes. No Program Cards, Start Workout, or Live Workout changes.
                </p>
              </div>
            )}
            {truthExplanation ? (
              <ProgramTruthSummary
                truthExplanation={truthExplanation}
                rulePopulationLedger={rulePopulationLedger ?? null}
                goalFamilyBalanceAudit={goalFamilyBalanceAudit ?? null}
              />
            ) : (
              /* [P26-HYGIENE] Conditional fallback: only show "unavailable" if no source-backed Plan Logic models exist */
              (() => {
                const hasSourceBackedPlanLogic = !!(
                  markerWriteReadinessLedgerModel ||
                  mutationTargetSessionResolutionPreviewModel ||
                  mutationCautionClearanceGateModel ||
                  rootCandidateClearanceEvidenceDetailModel ||
                  mutationReadinessReviewGateModel ||
                  mutationPathwayReadinessMapModel ||
                  mutationConfirmationContractPreviewModel ||
                  structuralMutationPreviewContractModel ||
                  userConfirmationMarkerPermissionPreviewGateModel ||
                  futureSessionMutationWriterReadinessBoundaryModel ||
                  preMutationLockBundleClosureModel ||
                  controlledFutureSessionMutationWriterDryRunModel ||
                  boundedMutationApplyEligibilityGateModel ||
                  markerOnlyConfirmationBoundaryModel ||
                  markerSaveAuthorizationPreflightBoundaryModel ||
                  controlledMarkerSaveActionBoundaryModel ||
                  markerSaveArtifactPreviewModel
                )
                
                if (hasSourceBackedPlanLogic) {
                  return (
                    <div className="rounded-lg border border-[#2A2A35]/50 bg-[#1A1A1F]/50 p-3 text-center">
                      <p className="text-[10px] text-[#7A7A8A]">
                        Legacy construction summary unavailable; source-backed Plan Logic gates are shown above.
                      </p>
                    </div>
                  )
                }
                
                return (
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
                )
              })()
            )}
            
            {/* [MASTER-8C.16] AI Intelligence Foundation Map */}
            {/* [MASTER-8C.18.1] Now passes safeguard model for dynamic proof */}
            <AIIntelligenceFoundationMap safeguardModel={safeguardAnalysisResult} recoveryReadinessModel={recoveryReadinessResult} exerciseKnowledgeCoverageModel={exerciseKnowledgeCoverageResult} progressionPeriodizationModel={progressionPeriodizationResult} coachRecommendationCandidateModel={coachRecommendationCandidateResult} planEvidenceHookModel={planEvidenceHookModel} planEvidenceTrendReadinessModel={planEvidenceTrendReadinessModel} mutationReadinessReviewGateModel={mutationReadinessReviewGateModel} mutationPathwayReadinessMapModel={mutationPathwayReadinessMapModel} mutationTargetSessionResolutionPreviewModel={mutationTargetSessionResolutionPreviewModel} mutationConfirmationContractPreviewModel={mutationConfirmationContractPreviewModel} mutationCautionClearanceGateModel={mutationCautionClearanceGateModel} structuralMutationPreviewContractModel={structuralMutationPreviewContractModel} userConfirmationMarkerPermissionPreviewGateModel={userConfirmationMarkerPermissionPreviewGateModel} futureSessionMutationWriterReadinessBoundaryModel={futureSessionMutationWriterReadinessBoundaryModel} preMutationLockBundleClosureModel={preMutationLockBundleClosureModel} controlledFutureSessionMutationWriterDryRunModel={controlledFutureSessionMutationWriterDryRunModel} boundedMutationApplyEligibilityGateModel={boundedMutationApplyEligibilityGateModel} markerOnlyConfirmationBoundaryModel={markerOnlyConfirmationBoundaryModel} markerSaveAuthorizationPreflightBoundaryModel={markerSaveAuthorizationPreflightBoundaryModel} controlledMarkerSaveActionBoundaryModel={controlledMarkerSaveActionBoundaryModel} markerSaveArtifactPreviewModel={markerSaveArtifactPreviewModel} markerWriteReadinessLedgerModel={markerWriteReadinessLedgerModel} durableMarkerReceiptReadinessModel={durableMarkerReceiptReadinessModel} controlledDurableMarkerReceiptWriterPreviewModel={controlledDurableMarkerReceiptWriterPreviewModel} persistenceWriterActivationLockGateModel={persistenceWriterActivationLockGateModel} controlledDurableMarkerReceiptWriterNoWriteHarnessModel={controlledDurableMarkerReceiptWriterNoWriteHarnessModel} durableReceiptWriterEligibilityLedgerModel={durableReceiptWriterEligibilityLedgerModel} durableReceiptWriterActivationPreconditionsReviewModel={durableReceiptWriterActivationPreconditionsReviewModel} explicitPersistenceActivationRequestPreviewModel={explicitPersistenceActivationRequestPreviewModel} activationRequestAuthorizationLockModel={activationRequestAuthorizationLockModel} explicitActivationRequestIntentCapturePreviewModel={explicitActivationRequestIntentCapturePreviewModel} explicitActivationAuthorizationReviewPreviewModel={explicitActivationAuthorizationReviewPreviewModel} controlledActivationPermissionBoundaryPreviewModel={controlledActivationPermissionBoundaryPreviewModel} explicitPersistenceActivationConsentPreviewModel={explicitPersistenceActivationConsentPreviewModel} consentAuthorizationLockPreviewModel={consentAuthorizationLockPreviewModel} consentDecisionStatePreviewModel={consentDecisionStatePreviewModel} consentDecisionReviewLockPreviewModel={consentDecisionReviewLockPreviewModel} consentPermissionBoundaryPreviewModel={consentPermissionBoundaryPreviewModel} persistencePermissionReviewPreviewModel={persistencePermissionReviewPreviewModel} persistenceWritePreflightPreviewModel={persistenceWritePreflightPreviewModel} />
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
