'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdaptiveSession, AdaptiveExercise, TrainingMethodPreference } from '@/lib/adaptive-program-builder'
import { isVariantLaunchable } from '@/lib/session-compression-engine'
// [SELECTED-VARIANT-SESSION-CONTRACT] Single authoritative owner of the
// selected-variant body and its launch fingerprint. The card stamps its
// expected fingerprint immediately before router.push so the live workout
// route can read it back and prove parity against the body it actually
// booted. No parallel card-body vs route-body derivation.
import {
  buildSelectedVariantMain,
  buildSessionFingerprint,
  stampLaunchFingerprint,
} from '@/lib/workout/selected-variant-session-contract'
import { ChevronDown, ChevronUp, Clock, AlertCircle, AlertTriangle, MinusCircle, Zap, RefreshCw, Play, CheckCircle2, SkipForward, Repeat, Layers, Timer, Dumbbell } from 'lucide-react'
import { WorkoutExecutionCard, StartWorkoutButton } from './WorkoutExecutionCard'
import { exerciseSupportsRPE } from '@/lib/rpe-adjustment-engine'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import {
  SessionHeader,
  PausedOverlay,
  FinishConfirmation,
} from '@/components/workout/WorkoutSessionControls'
import { WorkoutSessionSummary } from '@/components/workout/WorkoutSessionSummary'
import { trackWorkoutStarted, trackWorkoutCompleted } from '@/lib/analytics'
import { ExerciseReplacementModal } from './ExerciseReplacementModal'
import { ExerciseActionMenu } from './ExerciseActionMenu'
import { InfoBubble, ExerciseKnowledgeBubble, StructureKnowledgeBubble, ProtocolKnowledgeBubble, MethodInfoBubble } from '@/components/coaching'
// [DOMINANT-CARD-OWNERSHIP-LOCK] Import SessionCardSurface so this dominant
// visible card can read from the SAME strengthened authoritative truth that
// the Program-page wrapper strip already consumes. No parallel re-derivation.
import {
  buildExerciseCardContract,
  buildExerciseRowSurface,
  // [PHASE 4S] Pure helpers for canonical method/doctrine truth pass-through.
  // These let the card consume Phase 4P / 4Q truth without re-deriving anything.
  hasRenderableMethodStructure,
  normalizeDoctrineBlockStatus,
  readMethodStructuresFromSession,
  readDoctrineBlockResolutionFromSession,
  // [PHASE 4T] Canonical method tally + classified-doctrine guard. Used to
  // make `methodStructures` the dominant chip-row source and to demote the
  // legacy `doctrineCausalDisplay` banner behind classified resolution.
  deriveCanonicalMethodTallyFromSurface,
  hasClassifiedDoctrineResolution,
  // [PHASE 4U] Pure resolver that proves whether the visible body's grouped
  // blocks are actually backed by canonical methodStructures (matched by
  // exercise id / normalized name) or fell through to a styled/ungrouped
  // fallback. Run inline on the card after `finalVisibleBodyModel`; the
  // verdict drives the dev probe and the blueprint Phase G evidence.
  resolveCanonicalMethodBodyRender,
  type CanonicalMethodBodyRenderResolution,
  type ExerciseRowSurface,
  type SessionCardSurface,
  type ProgramDisplayProjectionSession,
} from '@/lib/program/program-display-contract'
import type { ProgramExplanationSurface } from '@/lib/coaching-explanation-contract'
// [SINGLE-TRUTH-FIX] Removed: getCompactExerciseExplanation - was source of contradictory text
import { buildSessionAiEvidenceSurface, deduplicateSessionEvidence, alignRowWithSessionEvidence, getCategoryDisplayContract, buildFullSessionRoutineSurface, buildSessionMainPreviewSurface, buildFullVisibleRoutineExercises, type SessionAiEvidenceSurface, type FullSessionRoutineSurface, type SessionMainPreviewSurface, type FullRoutineExercise } from '@/lib/program/program-ai-evidence-bridge'
// [SINGLE-TRUTH-FIX] Removed: getExerciseRowVisibility, shouldShowRowIntelligence, deduplicateRowDisplay, DEFAULT_DENSITY_MODE
// These were used by the ROW 2.5 chip block which was a stale secondary text path
import { hasExerciseKnowledge, getStructureKnowledge } from '@/lib/knowledge-bubble-content'
// [DOCTRINE-METHOD-DECISION-PHASE3B-BRIDGE]
// On-read bridge for legacy programs generated BEFORE the authoritative
// wrapper started stamping `session.methodDecision`. The wrapper remains the
// primary source for newly-generated programs; this engine call is only
// invoked when the field is missing on the input session, so we surface the
// same MethodDecision contract for stored programs without forcing the user
// to regenerate. Read-only, pure function, no side effects.
import {
  deriveMethodDecisionForSession,
  extractProfileContextFromSnapshot,
  METHOD_DECISION_VERSION,
  type MethodDecision as MethodDecisionShape,
  type MethodDecisionSessionInput,
  type MethodDecisionProfileSnapshotLike,
} from '@/lib/program/method-decision-engine'
import { getOnboardingProfile } from '@/lib/athlete-profile'
import { buildGroupedDisplayModel, getGroupedMethodSemantics, type GroupedDisplayModel, type RenderBlock, type RawFallbackBlock, type GroupedSourceUsed, type GroupedFlatReason, type GroupType } from './lib/session-group-display'
import { 
  addOverride, 
  applyOverridesToSession,
  type ExerciseOverride 
} from '@/lib/exercise-override-service'
import { recordReplaceSignal } from '@/lib/override-signal-service'
import type { EquipmentType } from '@/lib/adaptive-exercise-pool'

// ============================================================================
// [GROUPED-BODY-PRIORITY]
// Production rule: whenever the grouped render contract reports grouped
// truth, the grouped body wins priority over COMPLETED_SUMMARY /
// ACTIVE_WORKOUT_CARD. The prior debug-era `FORCE_LAST_VISIBLE_BODY_PROOF`
// / `FORCE_GROUPED_RUNTIME_PROOF` constants and their giant proof panels
// have been removed; grouped display is owned by `MainExercisesRenderer`
// via its real rich / raw-fallback / flat dispatch.
// ============================================================================

// [DOCTRINE-STRENGTHENING] Week character flags for visible differentiation
interface WeekCharacter {
  densityAllowed: boolean
  finishersAllowed: boolean
  skillExposureLevel: 'conservative' | 'moderate' | 'full'
  sessionIntensityCap: number
  phaseLabel: 'acclimation' | 'ramp_up' | 'peak' | 'consolidation'
}

interface AdaptiveSessionCardProps {
  session: AdaptiveSession
  onExerciseReplace?: (exerciseId: string) => void
  onWorkoutComplete?: () => void
  onExerciseOverride?: (override: ExerciseOverride) => void
  // [TASK 4] Program ID for variant state reset when program changes
  programId?: string
  // [EXERCISE-ROW-SURFACE] Primary goal for session-aware purpose lines
  primaryGoal?: string
  // [AI-EVIDENCE-BRIDGE] Secondary goal for row alignment
  secondaryGoal?: string | null
  // [AI-EVIDENCE-BRIDGE] Pre-built session evidence for unified display
  sessionEvidence?: SessionAiEvidenceSurface
  // [UI-CLEANUP-FIX] Control initial expanded state - defaults to false for cleaner list view
  // Today's workout should pass true, all others should pass false or omit
  defaultExpanded?: boolean
  // [COACHING-EXPLANATION-CONTRACT] Authoritative coaching explanation surface
  coachingExplanation?: ProgramExplanationSurface | null
  // [DOCTRINE-STRENGTHENING] Week-specific training character for visible differentiation
  weekCharacter?: WeekCharacter
  // [DOMINANT-CARD-OWNERSHIP-LOCK] Authoritative SessionCardSurface — the SAME
  // strengthened-truth surface the Program-page wrapper consumes. When present,
  // its `weeklyRoleLabel` / `weeklyIntensityClass` / `weeklyProgressionCharacter`
  // / `weeklyBreadthLabel` / `weeklyRoleRationale` OWN the dominant visible
  // identity slot in this card (not a peer to `session.focusLabel`).
  // Optional + null-safe: older callers / saved sessions without role truth
  // continue to render with the legacy focusLabel-driven identity unchanged.
  cardSurface?: SessionCardSurface | null
  // [PREVIEW-VISIBLE-PROBE] Enable visible truth probe via ?programProbe=1 query param
  // This bypasses NODE_ENV checks to show diagnostics in Preview/production
  showProbe?: boolean
  // [ALWAYS-VISIBLE-PROBE] Force probe to render unconditionally
  forceProbe?: boolean
  // [WEEK-AUTHORITY-HANDOFF] Authoritative selected week from the Program page.
  // This is the SAME week the Program card is rendering dosage for, and MUST
  // be carried as a URL param into Start Workout so the live workout runner
  // boots the identical week prescription. Without this, the live runner
  // silently reverts to adaptiveProgram.weekNumber (acclimation) even when
  // the user is viewing Week 2/3/4 on the Program page.
  currentWeekNumber?: number
  // [PHASE 3C] Program-level profile snapshot — the SAME truth that was frozen
  // at generation time and used by the authoritative wrapper to stamp
  // session.methodDecision.profileInfluence. Passed through here so the
  // on-read bridge (used for legacy programs that pre-date Phase 3 stamping)
  // can also produce a profile-aware decision instead of a degraded one.
  // Optional + null-safe: legacy callers without this prop fall back to the
  // pre-3C attribution path with profileSource='legacyFallback'.
  programProfileSnapshot?: MethodDecisionProfileSnapshotLike | null
  // [PHASE 3C] Method-decision version stamped on the parent program. When
  // present this is `phase_3c.profile_aware.v1`; when missing, the saved
  // program predates profile-aware stamping — the card shows a clean
  // "bridged" attribution instead of claiming fresh doctrine application.
  methodDecisionVersion?: string | null
  // [PHASE 4F — DISPLAY PROJECTION OWNERSHIP LOCK] Per-session display projection
  // slice. Built once on the page from `program.doctrineCausalChallenge.sessionDiffs[]`
  // (Phase 4E) and matched to this card by `dayNumber`. When present, the card
  // body renders an honest per-session line that says exactly what doctrine
  // did to THIS session — material change with the post-doctrine top winner,
  // base ranking won, no rules matched, or doctrine did not run. Never claims
  // change without Phase 4E proof. Optional + null-safe: when null/undefined
  // the card renders exactly as before with no Phase 4F line.
  displayProjectionSession?: ProgramDisplayProjectionSession | null
}

// =============================================================================
// [TASK 3] ACTIVE SESSION VIEW MODEL
// Unified view of the session based on selected variant
// All header/body/summary UI should use this instead of mixing base + variant data
// =============================================================================
interface ActiveSessionView {
  exercises: AdaptiveExercise[]
  exerciseCount: number
  estimatedMinutes: number
  variantLabel: string
  isFullSession: boolean
  isVariantSelected: boolean
}

// =============================================================================
// [PHASE 7B] STYLED GROUP TYPES FOR GROUPED RENDERING
// =============================================================================

interface StyledGroup {
  id: string
  groupType: 'straight' | 'superset' | 'circuit' | 'density_block' | 'cluster'
  exercises: Array<{
    id: string
    name: string
    prefix?: string
    trainingMethod: string
    methodRationale: string
  }>
  instruction: string
  restProtocol: string
}

interface SessionStyleMetadata {
  primaryStyle: TrainingMethodPreference
  hasSupersetsApplied: boolean
  hasCircuitsApplied: boolean
  hasDensityApplied: boolean
  structureDescription: string
  appliedMethods: TrainingMethodPreference[]
  styledGroups: StyledGroup[]
}

// [PHASE 3F METHOD SEMANTIC TRUTH LOCK] Pill noun reads from the single
// authoritative GROUPED_METHOD_SEMANTICS table in session-group-display.ts.
// Pre-3F this switch held the literal nouns inline and was free to drift
// from the row-line semantics, body cue, and rest microcopy. Straight has
// no semantic in the table and returns empty string by contract.
function getGroupTypeLabel(groupType: StyledGroup['groupType']): string {
  return getGroupedMethodSemantics(groupType)?.label ?? ''
}

// Helper to get an icon for group type
function getGroupTypeIcon(groupType: StyledGroup['groupType']) {
  switch (groupType) {
    case 'superset': return <Layers className="w-3.5 h-3.5" />
    case 'circuit': return <RefreshCw className="w-3.5 h-3.5" />
    case 'density_block': return <Timer className="w-3.5 h-3.5" />
    case 'cluster': return <Dumbbell className="w-3.5 h-3.5" />
    default: return null
  }
}

// Helper to get color classes for group type
// [GROUPED-VISIBLE-OWNERSHIP] The card body must visibly assert grouped truth
// as the dominant session structure whenever grouped truth exists upstream.
// Earlier palette used `/5` background and `/40` border, which rendered grouped
// blocks almost indistinguishable from flat rows on the dark card background --
// ownership was correct in the contract but lost visually. We now expose two
// background tiers:
//   - `bg`:      the header pill tint (moderate -- `/15`)
//   - `blockBg`: the surrounding block-container tint (subtle but present --
//                `/[0.08]`) so members visibly belong to the group, not the
//                flat list above/below.
// Border goes to `/60` so the left-border accent on members is unmistakable.
// Text colors stay on-brand (superset uses blue-gray palette tone instead of
// a flat muted hex so contrast lifts without adding a new color family).
// =============================================================================
// [GROUPED-MEMBER-FRAME] Local grouped member row presenter.
//
// Scope: renders ONLY inside the grouped branches of MainExercisesRenderer
// (rich_grouped + raw_grouped_fallback). Flat / non-grouped rows never reach
// this component and their visual contract is untouched.
//
// Why this exists: prior to this, grouped members rendered as raw
// <ExerciseRow /> panels inside a thin `pl-4 border-l-2` left line, and the
// only grouped cue per row was `ExerciseRow`'s internal `text-[10px]
// text-[#4A4A4A] font-mono` prefix span -- practically invisible at a
// glance. So a Superset A1/A2 pair visually read as "two normal rows under
// a colored pill" and a 1-member cluster read as "a normal row with
// decoration above it." The grouped truth survived the model but died at
// the row-identity surface.
//
// What this does: paints a method-colored, row-height rail to the left of
// every grouped member row. The rail owns:
//   - the paired prefix (A1/A2, B1/B2, C1/C2/C3) as a first-class badge
//   - OR the 1-based position for grouped blocks without paired prefixes
//     (density rotation members: "1", "2", "3")
//   - OR the method glyph for single-member grouped blocks (most commonly
//     cluster-1: the Repeat icon in method purple makes the block visibly
//     read as a cluster method, not a decorated plain row)
//
// The rail sits as a flex sibling of the row via `items-stretch`, so it
// auto-matches the row height. No double-box: the existing `ExerciseRow`
// panel is preserved byte-for-byte, we just stop asking it to render the
// now-redundant tiny prefix (`prefix={undefined}` at the call sites).
//
// Hydrated rows and minimal fallback text rows both route through this
// frame so the two surfaces speak the same grouped language even when
// hydration is incomplete.
// =============================================================================
// =============================================================================
// [GROUPED-MEMBER-SEMANTIC-LINE] Pure helper that produces a compact,
// method-specific one-liner for each grouped member.
//
// Why it exists: even with the method-colored rail + outer pill header, the
// inner ExerciseRow content (sets / reps / RPE / rest) still reads exactly
// like a flat row. For grouped days specifically, the athlete needs the row
// itself to visibly carry method intent. This helper returns the single
// compact line rendered directly below the row inside GroupedMemberFrame.
//
// Authoritative input only: groupType, prefix, 1-based positionIndex,
// totalMembers, and (for superset) partnerName resolved from the SAME
// grouped truth already consumed by the grouped branch (block.members or
// group.exercises). No new truth source, no parallel eligibility logic, no
// decoration from display text. Returns null when no meaningful line can
// be derived (e.g. groupType === 'straight'), which is the contract the
// caller and the frame both rely on to keep flat rows unchanged.
//
// Copy is terse and method-differentiated:
//   superset       -> paired-with-partner framing
//   circuit        -> "Station N of M — cycle, rest after round"
//   density_block  -> "Rotation N of M — rotate within time cap, quality"
//   cluster        -> "Cluster set — intra-set mini-rests, full rest after"
//                     (1-member cluster explicitly still reads as cluster)
// =============================================================================
function buildGroupedMemberSemanticLine(args: {
  groupType: StyledGroup['groupType']
  prefix?: string
  positionIndex: number
  totalMembers: number
  partnerName?: string
}): string | null {
  // [PHASE 3F METHOD SEMANTIC TRUTH LOCK] Member semantic line reads from
  // the single authoritative GROUPED_METHOD_SEMANTICS table. Pre-3F this
  // switch encoded its own copy of the per-method copy and was free to
  // drift from the pill noun + body cue + rest microcopy. The semantics
  // table's `memberLine` factory takes the same arg shape so the call
  // site is a one-liner with no behavior change.
  const semantics = getGroupedMethodSemantics(args.groupType)
  if (!semantics) return null
  return semantics.memberLine({
    positionIndex: args.positionIndex,
    totalMembers: args.totalMembers,
    partnerName: args.partnerName,
  })
}

function GroupedMemberFrame({
  colors,
  groupType,
  prefix,
  positionIndex,
  totalMembers,
  semanticLine,
  children,
}: {
  colors: { border: string; bg: string; blockBg: string; text: string }
  groupType: StyledGroup['groupType']
  prefix?: string
  positionIndex: number
  totalMembers: number
  // [GROUPED-MEMBER-SEMANTIC-LINE] Optional compact one-liner rendered
  // directly below the row content in the frame's content column. When
  // null/undefined, nothing renders (flat rows + edge cases stay byte-
  // identical). Tinted with the method color family so it visibly belongs
  // to the same method block as the rail badge and the outer pill header.
  semanticLine?: string | null
  children: React.ReactNode
}) {
  // Method glyph used when a single-member grouped block has no prefix, so
  // the rail still carries method semantics instead of a bare "1".
  const GlyphIcon =
    groupType === 'superset'
      ? Layers
      : groupType === 'circuit'
        ? RefreshCw
        : groupType === 'cluster'
          ? Repeat
          : groupType === 'density_block'
            ? Timer
            : Layers

  const railContent = prefix
    ? <span className={`text-xs font-bold font-mono ${colors.text}`}>{prefix}</span>
    : totalMembers === 1
      ? <GlyphIcon className={`w-3.5 h-3.5 ${colors.text}`} />
      : <span className={`text-xs font-bold font-mono ${colors.text}`}>{positionIndex}</span>

  return (
    <div className="flex items-stretch gap-2">
      <div
        className={`shrink-0 w-9 flex items-center justify-center rounded-md border ${colors.border} ${colors.bg}`}
      >
        {railContent}
      </div>
      <div className="flex-1 min-w-0">
        {children}
        {semanticLine && (
          <div className={`mt-1 pl-1 text-[11px] leading-snug ${colors.text}`}>
            {semanticLine}
          </div>
        )}
      </div>
    </div>
  )
}

function getGroupTypeColors(groupType: StyledGroup['groupType']): { border: string; bg: string; blockBg: string; text: string } {
  switch (groupType) {
    case 'superset':
      return { border: 'border-[#4F6D8A]/60', bg: 'bg-[#4F6D8A]/15', blockBg: 'bg-[#4F6D8A]/[0.08]', text: 'text-[#7FA8CC]' }
    case 'circuit':
      return { border: 'border-emerald-500/60', bg: 'bg-emerald-500/15', blockBg: 'bg-emerald-500/[0.08]', text: 'text-emerald-300' }
    case 'density_block':
      return { border: 'border-amber-500/60', bg: 'bg-amber-500/15', blockBg: 'bg-amber-500/[0.08]', text: 'text-amber-300' }
    case 'cluster':
      return { border: 'border-purple-500/60', bg: 'bg-purple-500/15', blockBg: 'bg-purple-500/[0.08]', text: 'text-purple-300' }
    default:
      return { border: 'border-transparent', bg: 'bg-transparent', blockBg: 'bg-transparent', text: 'text-[#A5A5A5]' }
  }
}

/**
 * PHASE 3: Normalize session for safe display
 * Ensures all required properties exist with safe defaults
 */
function normalizeSessionForDisplay(session: AdaptiveSession): AdaptiveSession {
  if (!session || typeof session !== 'object') {
    console.log('[AdaptiveSessionCard] Session is invalid, using empty default')
    return {
      name: 'Session',
      dayNumber: 0,
      dayLabel: 'Day',
      focusLabel: 'Training',
      estimatedMinutes: 60,
      exercises: [],
    } as AdaptiveSession
  }
  
  return {
    ...session,
    name: session.name || 'Training Session',
    dayNumber: session.dayNumber || 0,
    dayLabel: session.dayLabel || `Day ${session.dayNumber || 1}`,
    focusLabel: session.focusLabel || 'General Training',
    estimatedMinutes: session.estimatedMinutes || 60,
    exercises: Array.isArray(session.exercises) ? session.exercises : [],
    warmup: Array.isArray(session.warmup) ? session.warmup : [],
    cooldown: Array.isArray(session.cooldown) ? session.cooldown : [],
  }
}

export function AdaptiveSessionCard({ session: rawSession, onExerciseReplace, onWorkoutComplete, onExerciseOverride, programId, primaryGoal, secondaryGoal, sessionEvidence: providedEvidence, defaultExpanded = false, coachingExplanation, weekCharacter, cardSurface, showProbe: _showProbe = false, forceProbe: _forceProbe = false, currentWeekNumber, programProfileSnapshot, methodDecisionVersion, displayProjectionSession }: AdaptiveSessionCardProps) {
  // [PROBES-HARD-DISABLED] Session truth probes are retired. They caused
  // debug-looking text ("PROBE ACTIVE", instance-id letter fragments, etc.)
  // to leak into production UI when accidentally enabled via query param.
  // The probeActive flag is permanently false here -- probe JSX blocks below
  // are dead code that never renders. showProbe/forceProbe props are kept for
  // interface compatibility but are not honored. To revive probes, wire a
  // new explicitly dev-only gate behind process.env.NODE_ENV checks.
  const cardInstanceId = `card-${rawSession.dayNumber}-${rawSession.name?.slice(0,10) || 'session'}-${Date.now().toString(36).slice(-4)}`
  const probeActive = false as boolean
  // PHASE 3: Normalize session immediately to prevent crashes
  const session = normalizeSessionForDisplay(rawSession)
  
  // ==========================================================================
  // [PHASE 7B TASK 1] STYLE OUTPUT CONTRACT AUDIT
  // Verify what style truth exists in the session from builder
  // ==========================================================================
  const sessionStyleMetadata = (rawSession as AdaptiveSession & { styleMetadata?: SessionStyleMetadata }).styleMetadata
  const builderHasStyledGroups = !!(sessionStyleMetadata?.styledGroups && sessionStyleMetadata.styledGroups.length > 0)
  const hasNonStraightGroups = sessionStyleMetadata?.styledGroups?.some(g => g.groupType !== 'straight') ?? false
  
  // ==========================================================================
  // [AI-EVIDENCE-BRIDGE] Build unified session evidence surface
  // Single source of truth for session-level AI reasoning display
  // ==========================================================================
  const sessionEvidence: SessionAiEvidenceSurface = providedEvidence || (() => {
    const rawEvidence = buildSessionAiEvidenceSurface(
      {
        dayNumber: session.dayNumber,
        name: session.name,
        dayLabel: session.dayLabel,
        focus: session.focus,
        focusLabel: session.focusLabel,
        isPrimary: session.isPrimary,
        rationale: session.rationale,
        prescriptionPropagationAudit: (rawSession as any).prescriptionPropagationAudit,
        compositionMetadata: (rawSession as any).compositionMetadata,
        skillExpressionMetadata: (rawSession as any).skillExpressionMetadata,
        styleMetadata: sessionStyleMetadata,
      },
      {
        primaryGoal: primaryGoal || 'training',
        secondaryGoal: secondaryGoal,
        isFirstWeek: false,
      }
    )
    return deduplicateSessionEvidence(rawEvidence)
  })()
  

  
  const router = useRouter()
  // [UI-CLEANUP-FIX] Use defaultExpanded prop (defaults to false for cleaner list view)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showCooldown, setShowCooldown] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showReplacementModal, setShowReplacementModal] = useState(false)
  const [selectedExerciseForReplace, setSelectedExerciseForReplace] = useState<{id: string, name: string} | null>(null)
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(new Set())
  const [adjustedExercises, setAdjustedExercises] = useState<Map<string, string>>(new Map())
  const [showMethodDecisions, setShowMethodDecisions] = useState(false)
  
  // [TASK 4] Track session identity to reset variant state when session changes
  // Using ref to avoid setting state during render
  const lastSessionIdentityRef = useRef<string>('')
  const currentSessionIdentity = `${programId || 'unknown'}-${session.dayNumber}-${session.name}`
  
  // [TASK 4] Reset variant state when program or session changes
  // This prevents stale Full/45/30 selections from persisting across regenerations
  useEffect(() => {
    if (lastSessionIdentityRef.current !== '' && lastSessionIdentityRef.current !== currentSessionIdentity) {
      console.log('[variant-state-reset] Session identity changed, resetting variant selection', {
        oldIdentity: lastSessionIdentityRef.current,
        newIdentity: currentSessionIdentity,
        wasSelectedVariant: selectedVariant,
      })
      setSelectedVariant(null)
      setSkippedExercises(new Set())
      setAdjustedExercises(new Map())
    }
    lastSessionIdentityRef.current = currentSessionIdentity
  }, [currentSessionIdentity]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Generate unique session ID for tracking overrides
  const sessionId = `${session.name}-${session.dayLabel}-${Date.now().toString(36)}`

  // Session lifecycle hook
  const workoutSession = useWorkoutSession(session)
  const { 
    status, 
    isActive, 
    isPaused, 
    isCompleted,
    stats,
    formattedDuration,
    completedSets,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    finish: finishSession,
    reset: resetSession,
    save: saveSession,
  } = workoutSession

  // Count RPE-enabled exercises - [PHASE 10] Safe access with fallback
  const safeExercises = Array.isArray(session.exercises) ? session.exercises : []
  const rpeExerciseCount = safeExercises.filter((e) => exerciseSupportsRPE(e.name)).length

  // ==========================================================================
  // [SELECTED-SESSION-CONTRACT] SINGLE AUTHORITATIVE SELECTED-VISIBLE-SESSION
  // TRUTH. This is the ONE and ONLY owner of what Full / 45 Min / 30 Min means
  // for this card. Every downstream consumer in this corridor (Program card
  // body, grouped/method status line, Start Workout launch payload, live route,
  // StreamlinedWorkoutSession pre-start shell) derives from this contract --
  // either directly, or by reading the URL params this contract constructs.
  //
  // Canonical variant-index semantics:
  //   - `selectedVariant` state may legally be `null | 0 | 1 | 2`.
  //   - `null` and `0` both mean "Full Session" and MUST resolve to the same
  //     canonical index 0 for every consumer. Previously different consumers
  //     interpreted them independently (body used `selectedVariant !== null`,
  //     launch used `selectedVariant ?? 0`, status used `safeExercises`).
  //     That split is what allowed "visible card looks 45" but "Start Workout
  //     boots full" to coexist without either side being wrong in isolation.
  //
  // Fields (all canonical, all derived here, ALL read downstream):
  //   - selectedVariantIndex   : 0-based canonical index (null resolved to 0)
  //   - selectedVariantLabel   : human label from variants[idx].label
  //   - selectedExecutionMode  : 'full' | '45_min' | '30_min', derived from
  //                              variants[idx].duration (not from raw session)
  //   - selectedEstimatedMinutes: variants[idx].duration ?? session default
  //   - selectedLaunchUrl      : the EXACT URL Start Workout will push, with
  //                              mode + variant + week all locked to the above
  //   - isFullSession          : canonical idx === 0
  //   - isVariantSelected      : canonical idx > 0
  //   - hasMultipleVariants    : variants array has Full + at least one mini
  //
  // ==========================================================================
  const selectedSessionContract = (() => {
    const variantsArr = Array.isArray(session.variants) ? session.variants : []
    // [VARIANT-LAUNCHABILITY-CONTRACT] Requested index is coerced to a SAFE
    // canonical index that points only at a launchable variant. If the user
    // picked 30 Min but that variant failed the validity gate (empty
    // selection.main, missing exercise identity, etc.), we collapse to idx 0
    // (Full) so the launch URL never carries a variant index that cannot
    // materialize a body. The button for a non-launchable variant is also
    // not rendered (see the button map below), so in practice the user
    // never reaches this coercion -- it exists to keep stale persisted
    // selectedVariant state (e.g. from an older program version) honest.
    const requestedIdx = selectedVariant ?? 0
    const requestedLaunchable = isVariantLaunchable(variantsArr[requestedIdx])
    const canonicalIdx = requestedLaunchable ? requestedIdx : 0
    const variantObj = variantsArr[canonicalIdx]
    // Even idx 0 may not be launchable (e.g. fallback/recovery sessions that
    // now emit `variants: undefined`). In that case variantObj is undefined
    // and we render as an honest single-session card with no variant story.
    const variantLabel = variantObj?.label ?? 'Full Session'
    const estimatedMinutes =
      typeof variantObj?.duration === 'number' ? variantObj.duration : session.estimatedMinutes
    let executionMode: '30_min' | '45_min' | 'full' = 'full'
    if (typeof estimatedMinutes === 'number') {
      if (estimatedMinutes <= 35) executionMode = '30_min'
      else if (estimatedMinutes <= 50) executionMode = '45_min'
    }
    const weekParam =
      typeof currentWeekNumber === 'number' && currentWeekNumber >= 1
        ? `&week=${currentWeekNumber}`
        : ''
    const selectedLaunchUrl = `/workout/session?day=${session.dayNumber || 1}&mode=${executionMode}&variant=${canonicalIdx}${weekParam}`
    // hasMultipleVariants now counts ONLY launchable variants, so a session
    // whose only 45/30 entries were rejected by the gate reports "no
    // multiple variants" and the toggle row stays hidden.
    const launchableCount = variantsArr.filter(v => isVariantLaunchable(v)).length
    return {
      selectedVariantIndex: canonicalIdx,
      selectedVariantLabel: variantLabel,
      selectedExecutionMode: executionMode,
      selectedEstimatedMinutes: estimatedMinutes,
      selectedLaunchUrl,
      isFullSession: canonicalIdx === 0,
      isVariantSelected: canonicalIdx > 0,
      hasMultipleVariants: launchableCount > 1,
      // Coercion signal for auditability when stale state points at a
      // variant that has since been invalidated upstream.
      requestedIndexCoerced: requestedIdx !== canonicalIdx,
      requestedIndexOriginal: requestedIdx,
    }
  })()

  // ==========================================================================
  // [SELECTED-DISPLAY-CONTRACT] SINGLE AUTHORITATIVE PROGRAM-CARD DISPLAY OWNER
  //
  // This is the ONE and ONLY final-display adapter the Program card body reads
  // from. It bundles:
  //   - every field of `selectedSessionContract` (canonical idx / label / mode
  //     / estimatedMinutes / launchUrl / isFullSession / isVariantSelected)
  //   - `variantData`: the canonical variant object (or null for full / for
  //     an unusable variant that was coerced to full by the launchability
  //     gate upstream). Prior code re-derived a separate `selectedVariantData`
  //     keyed off raw `selectedVariant` state, which bypassed the launchability
  //     coercion and allowed a non-launchable variant to still feed the visible
  //     body while Start Workout launched Full -- exactly the split this lock
  //     removes.
  //   - `resolvedBody`: the authoritative selected-variant main body, produced
  //     by the SAME `buildSelectedVariantMain` the Start Workout launch
  //     fingerprint stamps. This is the ONE source for per-row method /
  //     methodLabel / blockId / setExecutionMethod carry and for
  //     variant-authoritative sets/reps/RPE/rest. The old inline
  //     `displayExercises` mapper at L775 (which did its own variant-keyed
  //     identity rehydration) is now a pure alias of this body.
  //
  // Downstream rule: NO consumer in this component is allowed to re-derive
  // the selected variant body from raw `selectedVariant` state. Every
  // consumer reads one of:
  //   - selectedDisplayContract.resolvedBody.exercises
  //       (for per-row method carry surfaces + activeSessionView)
  //   - selectedDisplayContract.variantData
  //       (for the canonical variant object used by downstream hydration /
  //        style-metadata variant-pruning)
  //   - fullVisibleExercises
  //       (the card-body render list, computed FROM this contract's
  //        variantData so Full / 45 / 30 visibly and materially differ on
  //        screen whenever they differ in the stored variant body)
  //
  // Start Workout launch corridor is preserved: `handleStartWorkout` now
  // reuses `selectedDisplayContract.resolvedBody` directly instead of
  // re-calling the contract builder, so the card body and the stamped
  // launch fingerprint are guaranteed to come from the SAME body object.
  // ==========================================================================
  const selectedDisplayContract = (() => {
    const canonicalIdx = selectedSessionContract.selectedVariantIndex
    const variantsArr = Array.isArray(session.variants) ? session.variants : []
    const variantData =
      canonicalIdx > 0 ? (variantsArr[canonicalIdx] ?? null) : null
    const resolvedBody = buildSelectedVariantMain(
      session,
      canonicalIdx,
      selectedSessionContract.selectedExecutionMode,
    )
    return {
      ...selectedSessionContract,
      /** Canonical variant object for the launchable selected index, or null. */
      variantData,
      /**
       * Authoritative selected-variant main body.
       * Same builder (`buildSelectedVariantMain`) the Start Workout launch
       * fingerprint uses. Carries full per-row identity (id / blockId /
       * method / methodLabel / setExecutionMethod) plus variant-authoritative
       * dosage (sets / repsOrTime / targetRPE / restSeconds / note).
       */
      resolvedBody,
    }
  })()

  const handleStartWorkout = () => {
    // [workout-route] UNIFIED ENTRY: Route to canonical workout session page
    // This ensures all "Start Workout" paths use the same StreamlinedWorkoutSession experience
    // The embedded WorkoutExecutionCard is no longer used for full workout execution
    //
    // [SELECTED-SESSION-CONTRACT] Launch payload is now read AS-IS from the
    // authoritative selectedSessionContract. No independent re-derivation of
    // executionMode / variant index / week param here. If the contract says
    // 45_min + variant=1, the URL is 45_min + variant=1. Full stop.
    trackWorkoutStarted(session.name)

    // [SELECTED-VARIANT-SESSION-CONTRACT] Stamp the expected selected-variant
    // fingerprint immediately before router.push. This is the card's promise
    // to the route: "given this session + this variantIndex, here is the
    // exact body I expect you to boot." The route reads this payload via
    // readLaunchFingerprint(day, variantIndex) and diffs it against the
    // finalSession it actually built. Any drift (count, identity, order,
    // duration, mode) surfaces as a visible PARITY chip instead of a silent
    // full-session fallback. This closes the last owner split in the
    // Program-card -> Start Workout corridor: the card and route now share
    // ONE variant-body builder (buildSelectedVariantMain) and ONE
    // parity-proof contract.
    // =====================================================================
    // [FINAL-MIRROR-LOCK] Program card visible body is the SINGLE launch
    // owner.
    //
    // Prior code stamped from `selectedDisplayContract.resolvedBody.exercises`
    // under the assumption that it was the "exact same body feeding
    // MainExercisesRenderer". It is NOT. The actual renderer consumes
    // `fullVisibleExercises` (line 2782: `displayExercises={fullVisibleExercises}`),
    // a different authoritative body built by
    // `buildFullVisibleRoutineExercises(fullRoutineSurface, safeExercises,
    // selectedVariantData.selection)`. For variant sessions (45 Min /
    // 30 Min), these two bodies can differ in ORDER even when membership
    // matches -- which is exactly the verified Day 1 / Day 6 failure
    // pattern:
    //   Card visible:  Planche Leans -> Explosive Pull-Ups -> Tuck FL Hold -> Weighted Dips
    //   Shell booted:  Planche Leans -> Tuck FL Hold -> Weighted Dips -> Explosive Pull-Ups
    //
    // The mirror corridor's source of truth for THIS launch is the exact
    // ordered array the user is currently looking at. We therefore derive
    // one explicit `visibleLaunchBody` from `fullVisibleExercises` and
    // route BOTH the fingerprint and the snapshot payload through it.
    // No path stamps from `cardResolvedBody.exercises` anymore.
    //
    // Shape: `FullRoutineExercise` is a structural superset of the fields
    // the fingerprint + route + live machine read (id, name, category,
    // sets, repsOrTime, targetRPE, restSeconds, prescribedLoad, blockId,
    // method, methodLabel, selectionReason, isOverrideable, note). The
    // `AdaptiveSession['exercises']` annotation on the contract is
    // structural, so we cast via `unknown` at the boundary rather than
    // reshaping the rows (any reshape would re-introduce the exact
    // "card shows one thing, launch stamps another" risk this fix is
    // eliminating). Every downstream consumer reads by field name.
    // =====================================================================
    const selectedCanonicalIdx = selectedDisplayContract.selectedVariantIndex
    const cardResolvedBody = selectedDisplayContract.resolvedBody
    // The ONE visible launch body. Shallow-copy each row so the stamped
    // object is serializable and does not hold React-owned references.
    const visibleLaunchBody = fullVisibleExercises.map(ex => ({ ...ex })) as unknown as AdaptiveSession['exercises']
    const cardFingerprint = buildSessionFingerprint({
      variantIndex: selectedCanonicalIdx,
      mode: selectedSessionContract.selectedExecutionMode,
      // [FINAL-MIRROR-LOCK] Fingerprint the VISIBLE body -- not the
      // resolvedBody. This is what guarantees the PARITY chip tracks the
      // actual rendered ordering, not a parallel resolved-body ordering
      // that may or may not equal it.
      exercises: visibleLaunchBody,
      estimatedMinutes: cardResolvedBody.estimatedMinutes,
    })
    // =====================================================================
    // [PROGRAM-TO-LIVE MIRROR CONTRACT] Stamp the FULL visible main-body
    // snapshot -- not just the fingerprint.
    //
    // Prior behavior stamped only a thin fingerprint (ordered ids + counts)
    // and let the live workout route re-call `buildSelectedVariantMain`
    // against `loadAuthoritativeSession` result. Two problems with that:
    //
    //   (a) program-state (card input) vs loadAuthoritativeSession (route
    //       input) read session data through different paths. Any subtle
    //       hydration / week-scaling / normalizer drift between them
    //       produced two different session skeletons into the same shared
    //       builder -- same algorithm, different inputs -> different
    //       bodies -> the fingerprint parity chip flipped to MISMATCH,
    //       but the live workout still booted the re-derived body.
    //   (b) Full-session launches additionally pick up loader-applied
    //       `scaled*` dosage fields on each row, while the card renders
    //       raw (unscaled) dosage for the same session. For non-week-1
    //       Full launches this alone causes a visible row-level drift.
    //
    // The fix is: the card stamps the exact exercise array it resolved
    // (same as what fed `MainExercisesRenderer`), and the route boots
    // from that snapshot directly when valid. If snapshot is absent or
    // structurally invalid, route falls back to the loader+builder
    // re-derivation so nothing regresses.
    // =====================================================================
    stampLaunchFingerprint({
      dayNumber: session.dayNumber || 1,
      variantIndex: selectedCanonicalIdx,
      stampedAt: new Date().toISOString(),
      fingerprint: cardFingerprint,
      resolvedFrom: cardResolvedBody.resolvedFrom,
      launchUrl: selectedSessionContract.selectedLaunchUrl,
      selectedBody: {
        executionMode: selectedSessionContract.selectedExecutionMode,
        // currentWeekNumber is the exact week the Program page selected for
        // dosage display (prop threaded in from app/(app)/program/page.tsx).
        // Null-tolerant: live route will ignore it for snapshot-boot
        // validation and only use it as an audit field.
        weekNumber:
          typeof currentWeekNumber === 'number' ? currentWeekNumber : null,
        variantIndex: selectedCanonicalIdx,
        variantLabel: selectedSessionContract.selectedVariantLabel,
        estimatedMinutes:
          typeof cardResolvedBody.estimatedMinutes === 'number'
            ? cardResolvedBody.estimatedMinutes
            : typeof selectedSessionContract.selectedEstimatedMinutes === 'number'
              ? selectedSessionContract.selectedEstimatedMinutes
              : 60,
        // [FINAL-MIRROR-LOCK] Stamp the VISIBLE body (fullVisibleExercises)
        // -- the exact ordered array `MainExercisesRenderer` is currently
        // rendering on the card. This is the single launch owner; no other
        // body source (resolvedBody, variant.selection.main, loader session)
        // can end up in `selectedBody.exercises` anymore.
        exercises: visibleLaunchBody,
        // [MIRROR-CORRIDOR-LOCKDOWN] Stamp the card's already-pruned
        // styleMetadata. This is what eliminates the "grouped metadata
        // shadow owner" failure where variant snapshot-boot used the
        // full-session styledGroups -- causing the live machine's
        // member-advance path to jump to wrong exercise indexes because
        // the groups referenced members that weren't in the variant body.
        //
        // Semantics (mirrored in SelectedBodySnapshot contract comment):
        //   - object (with styledGroups.length > 0) : pass to route as-is
        //   - object (with styledGroups.length === 0) : pass as null to
        //     explicitly tell the route "no groups in this selected body,
        //     clear finalSession.styleMetadata so executionPlan derives
        //     flat from the snapshot exercises"
        //   - undefined upstream (no metadata at all) : pass null for
        //     the same reason
        styleMetadata:
          variantPrunedStyleMetadata &&
          Array.isArray(variantPrunedStyleMetadata.styledGroups) &&
          variantPrunedStyleMetadata.styledGroups.length > 0
            ? variantPrunedStyleMetadata
            : null,
      },
    })

    console.log('[PROGRAM-TO-LIVE MIRROR CONTRACT] Start Workout launch stamp', {
      dayNumber: session.dayNumber,
      selectedVariantIndex: selectedCanonicalIdx,
      selectedVariantLabel: selectedSessionContract.selectedVariantLabel,
      selectedExecutionMode: selectedSessionContract.selectedExecutionMode,
      selectedEstimatedMinutes: selectedSessionContract.selectedEstimatedMinutes,
      selectedLaunchUrl: selectedSessionContract.selectedLaunchUrl,
      // Parity stamp
      cardResolvedFrom: cardResolvedBody.resolvedFrom,
      cardFingerprint,
      // [FINAL-MIRROR-LOCK] Mirror stamp proof now reports the VISIBLE
      // body (same array MainExercisesRenderer rendered). Also log the
      // prior `resolvedBody` ordering for diagnostic comparison so any
      // future order divergence between the two owners is visible in
      // the console, even though only `visibleLaunchBody` drives boot.
      snapshotStamped: true,
      snapshotSource: 'fullVisibleExercises',
      snapshotExerciseCount: visibleLaunchBody.length,
      snapshotExerciseIds: visibleLaunchBody.map(e => e.id),
      snapshotExerciseNames: visibleLaunchBody.map(e => e.name),
      // Diagnostic only -- NOT used for boot.
      resolvedBodyExerciseIds: cardResolvedBody.exercises.map(e => e.id),
      resolvedBodyExerciseNames: cardResolvedBody.exercises.map(e => e.name),
      orderMatchesResolvedBody:
        visibleLaunchBody.length === cardResolvedBody.exercises.length &&
        visibleLaunchBody.every(
          (ex, i) => ex.id === cardResolvedBody.exercises[i]?.id
        ),
      snapshotWeekNumber:
        typeof currentWeekNumber === 'number' ? currentWeekNumber : null,
    })
    router.push(selectedSessionContract.selectedLaunchUrl)
  }

  const handleWorkoutComplete = () => {
    finishSession()
    trackWorkoutCompleted(session.name, stats.durationMinutes, stats.completedExercises)
    onWorkoutComplete?.()
  }

  const handleWorkoutCancel = () => {
    resetSession()
  }

  const handleFinishRequest = () => {
    setShowFinishConfirm(true)
  }

  const handleFinishConfirm = () => {
    setShowFinishConfirm(false)
    finishSession()
  }

  const handleReturnToDashboard = () => {
    router.push('/dashboard')
  }

  const handleReturnToProgram = () => {
    resetSession()
  }

  const handleExerciseReplace = (exerciseId: string, exerciseName: string) => {
    setSelectedExerciseForReplace({ id: exerciseId, name: exerciseName })
    setShowReplacementModal(true)
  }

  const handleReplacementConfirm = (newExerciseId: string) => {
    if (selectedExerciseForReplace) {
      // Record the override
      const exercise = safeExercises.find(e => e.id === selectedExerciseForReplace.id)
      const newName = newExerciseId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      
      const override: ExerciseOverride = {
        originalExerciseId: selectedExerciseForReplace.id,
        originalExerciseName: selectedExerciseForReplace.name,
        overrideType: 'replaced',
        newExerciseId,
        newExerciseName: newName,
        timestamp: Date.now(),
      }
      
      addOverride(sessionId, override)
      
      // Record signal for adaptive learning
      if (exercise) {
        recordReplaceSignal(
          sessionId,
          selectedExerciseForReplace.id,
          selectedExerciseForReplace.name,
          exercise.category,
          newExerciseId,
          newName
        )
      }
      
      // Notify parent
      onExerciseOverride?.(override)
      onExerciseReplace?.(selectedExerciseForReplace.id)
    }
    setShowReplacementModal(false)
    setSelectedExerciseForReplace(null)
  }

  const handleExerciseSkip = (exerciseId: string, exerciseName: string) => {
    // Add to skipped set for visual feedback
    setSkippedExercises(prev => new Set(prev).add(exerciseId))
    
    // Record the override
    const override: ExerciseOverride = {
      originalExerciseId: exerciseId,
      originalExerciseName: exerciseName,
      overrideType: 'skipped',
      timestamp: Date.now(),
    }
    
    addOverride(sessionId, override)
    onExerciseOverride?.(override)
  }

  const handleProgressionAdjust = (exerciseId: string, newProgression: string, direction: 'up' | 'down') => {
    // Track the adjustment locally
    setAdjustedExercises(prev => new Map(prev).set(exerciseId, newProgression))
    
    // Find original exercise name
    const exercise = safeExercises.find(e => e.id === exerciseId)
    
    // Record the override
    const override: ExerciseOverride = {
      originalExerciseId: exerciseId,
      originalExerciseName: exercise?.name || exerciseId,
      overrideType: 'progression_adjusted',
      newProgression,
      timestamp: Date.now(),
    }
    
    addOverride(sessionId, override)
    onExerciseOverride?.(override)
  }

  // Get equipment from profile for replacement modal
  // Convert profile equipment types to adaptive-exercise-pool types
  const profile = getOnboardingProfile()
  const profileEquipment = profile?.equipment || []
  const equipmentMap: Record<string, EquipmentType> = {
    'pullup_bar': 'pull_bar',
    'dip_bars': 'dip_bars',
    'rings': 'rings',
    'parallettes': 'parallettes',
    'resistance_bands': 'bands',
  }
  const availableEquipment: EquipmentType[] = ['floor', 'wall', ...profileEquipment.map(e => equipmentMap[e] || e).filter((e): e is EquipmentType => !!e)]

  // ==========================================================================
  // [TASK 3] ACTIVE SESSION VIEW MODEL
  // Single source of truth for all session display - header, body, and summary
  // This prevents contradictory displays like "2 exercises in header / 3 in body"
  // ==========================================================================
  
  // [SELECTED-DISPLAY-CONTRACT] `displayExercises` is now a PURE ALIAS of the
  // authoritative selected-variant main body owned by `selectedDisplayContract`.
  //
  // Previously this was a second, independent variant-body mapper that:
  //   (a) keyed off RAW `selectedVariant` state (not the launchability-coerced
  //       canonical idx), so a non-launchable variant could feed the visible
  //       body while Start Workout silently launched Full;
  //   (b) rehydrated per-row identity with a weaker lookup (`find(e => e.id
  //       === s.exercise.id)` only), missing rows that drifted on normalized
  //       name.
  // Both weaknesses are eliminated by routing through the contract's
  // `resolvedBody`, which (1) is keyed off `selectedSessionContract`'s
  // canonical idx and (2) uses id + normalized-name + positional lookup.
  //
  // Per-row grouped/cluster truth carry (`method` / `methodLabel` / `blockId`
  // / `setExecutionMethod`) is preserved by `buildSelectedVariantMain` itself
  // -- that contract builder decorates each variant row by looking up the
  // original session exercise and overlaying variant-specific fields on top.
  const displayExercises = selectedDisplayContract.resolvedBody.exercises
  
  // [SELECTED-DISPLAY-CONTRACT] Labels / flags / minutes MUST come from the
  // single display owner, not from raw `selectedVariant` state. This removes
  // the last path where the header could advertise "45 Min" (raw state) while
  // the launch corridor had coerced to Full (contract), or vice-versa.
  const activeSessionView: ActiveSessionView = {
    exercises: displayExercises,
    exerciseCount: displayExercises.length,
    estimatedMinutes:
      typeof selectedDisplayContract.selectedEstimatedMinutes === 'number'
        ? selectedDisplayContract.selectedEstimatedMinutes
        : (session.estimatedMinutes ?? 60),
    variantLabel: selectedDisplayContract.selectedVariantLabel,
    isFullSession: selectedDisplayContract.isFullSession,
    isVariantSelected: selectedDisplayContract.isVariantSelected,
  }
  
  // ==========================================================================
  // [FULL-SESSION-ROUTINE-SURFACE] Build COMPLETE day routine from ALL families
  // This is the PRIMARY authoritative output for prescription-first display
  // Replaces narrowed displayExercises with full session truth
  // ==========================================================================
  // [SELECTED-DISPLAY-CONTRACT] `selectedVariantData` is a PURE ALIAS of the
  // display owner's canonical variant object. This is the variant that matches
  // the launchable canonical idx (launchability-coerced), NOT raw
  // `selectedVariant` state. Downstream:
  //   - `fullRoutineSurface` receives this for variant-aware routine building
  //   - `fullVisibleExercises` trims + dosage-overwrites off `.selection.main`
  //   - `variantPrunedStyleMetadata` prunes styleMetadata.styledGroups against
  //     this variant's surviving body
  //   - `displayGroupedRendering` reads from the pruned body above
  // Routing all of these through the single owner is what lets Full / 45 / 30
  // visibly and materially differ on screen when the stored variant body
  // differs, while keeping Start Workout on the same selected-session story.
  const selectedVariantData = selectedDisplayContract.variantData
    
  const fullRoutineSurface: FullSessionRoutineSurface = buildFullSessionRoutineSurface(
    {
      dayNumber: session.dayNumber,
      dayLabel: session.dayLabel,
      name: session.name,
      focus: session.focus,
      focusLabel: session.focusLabel,
      isPrimary: session.isPrimary,
      estimatedMinutes: session.estimatedMinutes,
      exercises: safeExercises, // Use FULL exercises, not narrowed displayExercises
      warmup: session.warmup,
      cooldown: session.cooldown,
      finisher: session.finisher,
      finisherIncluded: session.finisherIncluded,
    },
    selectedVariantData, // Pass variant for variant-aware routine building
    sessionEvidence
  )
  
  // ==========================================================================
  // [SESSION-MAIN-PREVIEW] Build display-priority preview (secondary context)
  // This provides warmup/cooldown counts and finisher presence for footer
  // ==========================================================================
  const mainPreview: SessionMainPreviewSurface = buildSessionMainPreviewSurface(fullRoutineSurface)
  
  // ==========================================================================
  // [FULL-VISIBLE-ROUTINE-EXERCISES] Build card body exercises from FULL routine
  // This replaces narrowed displayExercises as the live card body owner
  // Includes ALL non-warmup/non-cooldown exercises (main + secondary + accessory + core + mobility + finisher)
  // ==========================================================================
  const fullVisibleExercises: FullRoutineExercise[] = buildFullVisibleRoutineExercises(
    fullRoutineSurface,
    safeExercises,
    selectedVariantData?.selection || null
  )

  // ==========================================================================
  // [GROUPED-RENDER-CONTRACT] SINGLE AUTHORITATIVE grouped render contract.
  // Computed ONCE per card mount. All three consumers below (FUNNEL-AUDIT probe,
  // method-summary chip row, and MainExercisesRenderer body) read from this
  // exact object.
  //
  // [VARIANT-PRUNE-LOCK] When a variant is selected (45 or 30 mode), the
  // card's visible exercise list is already trimmed to the variant's
  // subset via `fullVisibleExercises`. But `sessionStyleMetadata` is the
  // FULL session's metadata -- its styledGroups may reference exercises
  // that are NO LONGER present in the variant. Feeding the raw metadata
  // to the adapter makes it return "group with 2 members" for a pair
  // whose second member was dropped; the renderer then hydrates one row
  // and text-fallbacks the other, producing a broken-looking group.
  //
  // The fix: prune styledGroups to only members present in
  // `fullVisibleExercises` BEFORE handing to the adapter. Groups that
  // lose too many members to still be that method (e.g. superset below
  // 2 members) are dropped entirely. This keeps the grouped contract
  // and the visible variant body in lockstep, mirroring the same prune
  // already applied in the live workout route at
  // app/(app)/workout/session/page.tsx.
  // ==========================================================================
  const variantPrunedStyleMetadata: SessionStyleMetadata | undefined = (() => {
    if (!sessionStyleMetadata?.styledGroups || sessionStyleMetadata.styledGroups.length === 0) {
      return sessionStyleMetadata
    }
    if (!selectedVariantData) {
      return sessionStyleMetadata
    }
    const normalizeKey = (s: string): string =>
      (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
    const survivingIds = new Set(fullVisibleExercises.map(e => e.id).filter(Boolean))
    const survivingNames = new Set(fullVisibleExercises.map(e => normalizeKey(e.name)).filter(Boolean))
    // [VARIANT-PRUNE-BLOCKID-MATCH] Third surviving signal: blockId. The
    // builder writes `styledGroup.id === blockId` on the group, and the bridge
    // propagates `blockId` onto every `FullRoutineExercise` (see
    // program-ai-evidence-bridge.ts buildFullVisibleRoutineExercises -> item.blockId).
    // Previously the prune only matched members by id or normalized name. When
    // a variant rewrote a member's id AND renamed it (e.g. variant-specific
    // accessory regression), both lookups missed even though the exercise
    // still carried the SAME blockId as its styledGroup -- the member was
    // silently dropped, the group lost its minimum, and the adapter fell
    // through to the flat path. Matching on blockId keeps the grouped pair
    // alive whenever the variant retained at least one exercise under that
    // block. The rich render path then emits visible grouped structure in the
    // body above Method decisions.
    const survivingBlockIds = new Set(
      fullVisibleExercises
        .map(e => (e as unknown as { blockId?: string }).blockId)
        .filter((b): b is string => typeof b === 'string' && b.length > 0)
    )
    const prunedGroups = sessionStyleMetadata.styledGroups
      .map(g => {
        // [VARIANT-PRUNE-BLOCKID-MATCH] If the group's own blockId survives on
        // ANY visible exercise, treat every original member as surviving for
        // this group. Individual member id/name lookups are still consulted
        // first; this blockId-level rescue only applies when the per-member
        // lookups would otherwise strand the group below its method minimum.
        const groupBlockSurvives = g.id && survivingBlockIds.has(g.id)
        const keptMembers = g.exercises.filter(m =>
          survivingIds.has(m.id) ||
          survivingNames.has(normalizeKey(m.name)) ||
          groupBlockSurvives
        )
        return { ...g, exercises: keptMembers }
      })
      .filter(g => {
        // [METHOD-ONLY-VISIBILITY] Method-specific minimums. Superset/circuit
        // are TRUE grouped-block methods (pairing IS the method) and still
        // require >= 2 members after variant prune -- a 1-member "superset"
        // is not a superset and must not survive as a fake group. Cluster
        // and density_block are METHOD-ONLY execution styles that the
        // adaptive builder intentionally applies to a single exercise (see
        // lib/adaptive-program-builder.ts line ~12192 for cluster, and the
        // styledGroups rebuild at ~12326-12354 for method-only density);
        // they MUST survive variant prune even at 1 member, otherwise the
        // variant-pruned styleMetadata silently loses method-only groups
        // and the card falls back to flat when cluster/density were applied.
        if (g.groupType === 'straight') return true
        if (g.groupType === 'superset' || g.groupType === 'circuit') {
          return g.exercises.length >= 2
        }
        return g.exercises.length >= 1
      })
    return {
      ...sessionStyleMetadata,
      styledGroups: prunedGroups,
    }
  })()

  // ==========================================================================
  // [RAW-VS-DISPLAY-TRUTH-SPLIT] Grouped OWNERSHIP is decided from RAW session
  // truth; grouped RENDERING order is derived from the DISPLAY surface. These
  // are two separate concerns and must not share a single input.
  //
  // Why: prior behavior fed `variantPrunedStyleMetadata` + `fullVisibleExercises`
  // (a downstream-prepared display surface) into a single `buildGroupedDisplayModel`
  // call. That meant any weakening of the display pipeline -- a dropped blockId
  // during `buildFullVisibleRoutineExercises`, an aggressive variant prune that
  // stranded a surviving group below its minimum, a RoutineItem that never carried
  // method/methodLabel forward -- silently degraded `hasGroupedTruth` /
  // `hasRichRenderableGroups` for the FINAL visible body decision. The scanner
  // strip, meanwhile, reads raw `session.styleMetadata.styledGroups[].groupType`
  // and `session.exercises[].method` and honestly reports "grouped." The user
  // sees "scanner says grouped, card body still flat."
  //
  // Fix: two independent model builds, then one authoritative merge.
  //
  //   1. `rawGroupedOwnership` -- built from THE RAW SESSION TRUTH
  //      (`sessionStyleMetadata` + `safeExercises` with full blockId/method/
  //      methodLabel fidelity). This is the FIRST-CLASS determinant of whether
  //      the card is grouped at all. Cannot be weakened by any downstream
  //      display weakening.
  //
  //   2. `displayGroupedRendering` -- built from THE DISPLAY SURFACE
  //      (`variantPrunedStyleMetadata` + `fullVisibleExercises`). Used ONLY
  //      to produce a render-block ordering that matches what the card
  //      actually shows on screen (variant-pruned, hydration-aware).
  //
  //   3. `groupedRenderContract` -- the merged model downstream consumers
  //      read. Ownership fields (hasGroupedTruth, hasRichRenderableGroups,
  //      counts) come FROM RAW first; rendering fields (renderBlocks,
  //      rawFallbackBlocks, groups) prefer display when display produced
  //      them, falling back to raw when display lost them. This guarantees
  //      the card cannot silently collapse to flat just because the
  //      downstream display surface weakened the signal, and it also
  //      guarantees the visible rows still match what the variant allows.
  //
  //  `fullVisibleExercises` remains the hydration source for row CONTENT
  //  (sets/reps/RPE/rest) inside `MainExercisesRenderer`; this split does
  //  not change that.
  // ==========================================================================
  const rawGroupedOwnership: GroupedDisplayModel = buildGroupedDisplayModel(
    sessionStyleMetadata,
    safeExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      blockId: (ex as unknown as { blockId?: string }).blockId,
      method: (ex as unknown as { method?: string }).method,
      methodLabel: (ex as unknown as { methodLabel?: string }).methodLabel,
    }))
  )

  const displayGroupedRendering: GroupedDisplayModel = buildGroupedDisplayModel(
    variantPrunedStyleMetadata,
    fullVisibleExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      blockId: (ex as unknown as { blockId?: string }).blockId,
      method: (ex as unknown as { method?: string }).method,
      methodLabel: (ex as unknown as { methodLabel?: string }).methodLabel,
    }))
  )

  // [METHOD-MATERIALIZATION-SUMMARY-LOCK] Primary session-level method verdict.
  // The builder stamps a canonical session-level summary onto styleMetadata
  // at materialization-complete time. When present, this summary OWNS the
  // session-level grouped-vs-flat-vs-method-only decision -- the card
  // cannot disagree with the page parity header or scanner because all
  // three read the same single owner.
  //
  // The variant-narrowed body below (driven by displayGroupedRendering /
  // fullVisibleExercises) still owns the visible row layout because the
  // user may have picked a 30/45 min variant that prunes some grouped
  // members; that variant scope is correct for the body and the summary
  // is intentionally not used to override variant-narrowed render blocks.
  // The summary's role is purely the SESSION-LEVEL truth verdict.
  const sessionMethodMaterializationSummary =
    (sessionStyleMetadata as unknown as {
      methodMaterializationSummary?: {
        groupedStructurePresent?: boolean
        rowLevelMethodCuesPresent?: boolean
        dominantRenderMode?: 'grouped' | 'flat_with_method_cues' | 'flat'
        groupedBlockCount?: number
        primaryPackagingOutcome?: string | null
      } | null
    } | null)?.methodMaterializationSummary || null

  const groupedRenderContract: GroupedDisplayModel = (() => {
    // [RAW-OWNERSHIP-WINS] Grouped-truth detection is owned by RAW source.
    // Display path can only ADD to grouped truth (not subtract) because
    // display is a downstream derivative -- if raw says grouped, the card
    // must honor that even if the display surface cannot rehydrate every
    // member cleanly.
    //
    // [METHOD-MATERIALIZATION-SUMMARY-LOCK] When the canonical summary is
    // present, its `groupedStructurePresent` flag is the FIRST authority on
    // session-level grouped truth. Raw + display readings remain as
    // additive support so the existing variant-aware grouped rendering
    // path still produces visible blocks; we never use the summary to
    // suppress grouped truth that raw or display can prove.
    const summaryGrouped =
      sessionMethodMaterializationSummary?.groupedStructurePresent === true
    const hasGroupedTruth =
      summaryGrouped ||
      rawGroupedOwnership.hasGroupedTruth ||
      displayGroupedRendering.hasGroupedTruth
    const hasRichRenderableGroups =
      displayGroupedRendering.hasRichRenderableGroups ||
      rawGroupedOwnership.hasRichRenderableGroups

    // [DISPLAY-PREFERRED-RENDERING] Rendering fields prefer the display
    // path because the renderer hydrates rows from `fullVisibleExercises`
    // and its canonical walk already matches what the variant exposes.
    // Raw is the fallback -- it owns rendering ONLY when display returned
    // empty (variant pruned too aggressively, downstream weakening erased
    // all rich groups, etc.). This keeps the card honestly grouped
    // instead of collapsing to flat.
    const renderBlocks =
      displayGroupedRendering.renderBlocks.length > 0
        ? displayGroupedRendering.renderBlocks
        : rawGroupedOwnership.renderBlocks
    const rawFallbackBlocks =
      displayGroupedRendering.rawFallbackBlocks.length > 0
        ? displayGroupedRendering.rawFallbackBlocks
        : rawGroupedOwnership.rawFallbackBlocks
    const groups =
      displayGroupedRendering.groups.length > 0
        ? displayGroupedRendering.groups
        : rawGroupedOwnership.groups

    // [COUNTS-TRACK-OWNERSHIP] Method counts track the rendering source
    // that actually produced the blocks (so chips/tally never outrun the
    // body). If display produced rich groups, display counts. Otherwise
    // raw counts -- which matches the block list the renderer will now
    // iterate. When both are empty we report zeros honestly.
    const countsSource = displayGroupedRendering.hasRichRenderableGroups
      ? displayGroupedRendering
      : rawGroupedOwnership.hasRichRenderableGroups
        ? rawGroupedOwnership
        : displayGroupedRendering

    // [SOURCE-USED-ATTRIBUTION] Attribute to whichever model owns the
    // visible rendering. 'none' is only emitted when neither model has
    // grouped truth at all.
    const sourceUsed =
      displayGroupedRendering.sourceUsed !== 'none'
        ? displayGroupedRendering.sourceUsed
        : rawGroupedOwnership.sourceUsed

    // [FLAT-REASON] Only meaningful if neither raw nor display found
    // grouped truth. Otherwise raw owns the truth and flatReason is null.
    const flatReason = hasGroupedTruth
      ? null
      : displayGroupedRendering.flatReason

    return {
      hasGroups: groups.length > 0 || rawGroupedOwnership.hasGroups,
      totalGroupCount: Math.max(
        displayGroupedRendering.totalGroupCount,
        rawGroupedOwnership.totalGroupCount
      ),
      nonStraightGroupCount: countsSource.nonStraightGroupCount,
      supersetCount: countsSource.supersetCount,
      circuitCount: countsSource.circuitCount,
      densityCount: countsSource.densityCount,
      clusterCount: countsSource.clusterCount,
      groups,
      methodSummary:
        displayGroupedRendering.methodSummary ?? rawGroupedOwnership.methodSummary,
      sourceUsed,
      flatReason,
      renderBlocks,
      hasGroupedTruth,
      hasRichRenderableGroups,
      rawFallbackBlocks,
    }
  })()
  // [DISPLAY-FIRST-FALLBACK] Two separate gates, each with a precise meaning:
  //   - hasGroupedTruth:         upstream grouped truth exists (raw signal,
  //                              pre-partial-validity filtering).
  //   - hasRichRenderableGroups: the rich grouped contract is strong enough
  //                              for the preferred grouped renderer.
  //
  // The card renders via this priority:
  //   1. hasRichRenderableGroups === true  -> rich grouped path
  //   2. hasGroupedTruth === true          -> raw grouped fallback path
  //   3. neither                            -> honest flat path
  //
  // `hasRenderableGroups` is preserved as an alias of `hasRichRenderableGroups`
  // for the chip/audit consumers that already read it.
  const hasGroupedTruth = groupedRenderContract.hasGroupedTruth
  const hasRichRenderableGroups = groupedRenderContract.hasRichRenderableGroups
  const hasRenderableGroups = hasRichRenderableGroups

  // [FINAL-VISIBLE-OWNERSHIP-LOCK] METHOD-MATERIALIZATION-SUMMARY render-loop
  // verdict log removed. It fired once per card render with no athlete-facing
  // value; the same verdict is structurally enforced by the grouped render
  // contract that drives the visible body below.

  // ==========================================================================
  // [OUTER-BODY-DECISION] SINGLE AUTHORITATIVE OWNER
  //
  // `chosenOuterBodyMode` is the ONE source of truth for which expanded-body
  // branch is rendered. Both the visible debug panel and the JSX branch chain
  // below consume this same variable, so they can never disagree.
  //
  // `shouldRenderGroupedProgramBody` is the ONE source of truth for whether a
  // card is grouped-eligible. It derives from the authoritative grouped render
  // contract (`hasGroupedTruth`), not from cosmetic/debug booleans. When it is
  // true, grouped display MUST win over the completed/active/paused branches
  // because those branches were silently stealing grouped-eligible Program
  // cards that had stale completion/session flags.
  //
  // Priority order:
  //   1. shouldRenderGroupedProgramBody       -> GROUPED_PROGRAM_BODY
  //   2. isCompleted                          -> COMPLETED_SUMMARY
  //   3. isActive || isPaused                 -> ACTIVE_WORKOUT_CARD
  //   4. (else)                               -> NORMAL_EXPANDED_BODY
  // ==========================================================================
  const shouldRenderGroupedProgramBody = hasGroupedTruth

  type OuterBodyMode =
    | 'GROUPED_PROGRAM_BODY'
    | 'COMPLETED_SUMMARY'
    | 'ACTIVE_WORKOUT_CARD'
    | 'NORMAL_EXPANDED_BODY'
  let chosenOuterBodyMode: OuterBodyMode
  if (shouldRenderGroupedProgramBody) {
    chosenOuterBodyMode = 'GROUPED_PROGRAM_BODY'
  } else if (isCompleted) {
    chosenOuterBodyMode = 'COMPLETED_SUMMARY'
  } else if (isActive || isPaused) {
    chosenOuterBodyMode = 'ACTIVE_WORKOUT_CARD'
  } else {
    chosenOuterBodyMode = 'NORMAL_EXPANDED_BODY'
  }

  // ==========================================================================
  // [FINAL-VISIBLE-BODY-MODEL] THE SINGLE AUTHORITATIVE final visible body
  // object. This replaces the prior parallel-boolean dispatch
  // (`hasRenderableGroups` / `hasGroupedTruth` / `rawFallbackBlocks.length`
  // re-interpreted inside `MainExercisesRenderer`). The renderer is now a
  // pure consumer of `finalVisibleBodyModel.mode` -- it CANNOT select a
  // different visible branch than the one encoded here, and the on-screen
  // probe reads the exact same object so it cannot disagree with the body.
  //
  // Source precedence (grouped wins whenever grouped truth exists):
  //   1. rich_grouped           : hasRichRenderableGroups
  //                               -> render `renderBlocks` (authoritative
  //                                  contract-owned ordering)
  //   2. raw_grouped_fallback   : !rich && hasGroupedTruth && rawFallbackBlocks > 0
  //                               -> render `rawFallbackBlocks` with grouped
  //                                  headers + hydrated/text-fallback rows
  //   3. simple_order_grouped   : !rich && hasGroupedTruth && rawFallbackBlocks == 0
  //                               -> honest ordered list (grouped intent
  //                                  exists but nothing renderable as a group
  //                                  block; we do NOT paint fake headers)
  //   4. flat_category          : !hasGroupedTruth
  //                               -> honest category-sectioned flat layout
  //                                  (SKILL / STRENGTH / ACCESSORY / OTHER)
  //
  // IMPORTANT: a flat-looking legacy source (raw `session.exercises` /
  // narrowed `displayExercises`) can NEVER outrank grouped truth because
  // grouped-mode selection happens before the renderer sees anything, and
  // the renderer's per-branch JSX consumes ONLY the model's block list for
  // grouped modes. The flat legacy list is only touched for flat_category /
  // simple_order_grouped, which are selected here -- not by the renderer.
  // ==========================================================================
  type FinalBodyMode =
    | 'rich_grouped'
    | 'raw_grouped_fallback'
    | 'simple_order_grouped'
    | 'flat_category'
  interface FinalVisibleBodyModel {
    /** Authoritative visible body branch. The renderer dispatches on this. */
    mode: FinalBodyMode
    /** Which upstream source produced grouped truth (or 'none' for flat). */
    sourceUsed: GroupedSourceUsed
    /**
     * When mode is not a rich/raw grouped path, why we fell off the rich path.
     * - flat_category  -> the adapter's own flatReason (never null)
     * - simple_order_grouped -> 'RAW_FALLBACK_EMPTY' (grouped truth existed
     *   but rawFallbackBlocks came back empty, so we render honestly ordered)
     * - rich / raw grouped -> null
     */
    reasonIfNotRich: GroupedFlatReason | 'RAW_FALLBACK_EMPTY' | 'METHOD_ONLY_FLAT' | null
    /** Block list consumed by the rich grouped render path (mode 1). */
    renderBlocks: RenderBlock[]
    /** Block list consumed by the raw grouped fallback path (mode 2). */
    rawFallbackBlocks: RawFallbackBlock[]
    /** Non-straight group count (used by chips/probe attribution). */
    nonStraightGroupCount: number
    supersetCount: number
    circuitCount: number
    densityCount: number
    clusterCount: number
    /** Upstream grouped truth exists at all (pre-filter raw signal). */
    hasGroupedTruth: boolean
    /** Rich path is possible. */
    hasRichRenderableGroups: boolean
    /**
     * [CARD-LOCAL-FAILURE-SURFACE] When grouped truth exists but no grouped
     * block list could be produced by any source (rich path, contract raw
     * fallback, or display synthesis), this codes the exact final losing
     * stage so the simple_order_grouped body can expose ONE precise failure
     * reason on the affected card only. Null for any card whose body paints
     * real grouped blocks -- the surface never appears when grouped rendering
     * succeeded.
     *
     * Stages:
     *   - 'bridge_lost_group_fields'  : raw ownership had grouped truth but
     *                                   fullVisibleExercises lost every
     *                                   blockId/method carry -- the bridge
     *                                   weakened the display surface.
     *   - 'grouped_contract_empty'    : raw AND display both saw grouped
     *                                   truth, but the adapter returned zero
     *                                   renderable groups (member names
     *                                   unusable or all pruned out).
     *   - 'final_mode_flattened'      : grouped truth reached the final
     *                                   dispatcher but no block source
     *                                   produced anything renderable.
     *   - 'hydration_render_loss'     : blocks existed but zero members
     *                                   survived usable-name filtering.
     */
    groupedFailureStage:
      | 'bridge_lost_group_fields'
      | 'grouped_contract_empty'
      | 'final_mode_flattened'
      | 'hydration_render_loss'
      | null
  }
  // ==========================================================================
  // [DISPLAY-SYNTHESIS-RESCUE] Last-mile rawFallbackBlocks synthesis.
  //
  // Problem closed: prior `finalVisibleBodyModel` fell through to
  // `simple_order_grouped` whenever `hasGroupedTruth === true` and the
  // contract's `rawFallbackBlocks` was empty (styledGroups had unusable member
  // names OR the exercise-fallback path couldn't bind). That branch then
  // rendered a visually flat ordered list, producing the exact "grouped truth
  // exists upstream but the body looks flat" regression.
  //
  // Fix: before the mode dispatch, synthesize `RawFallbackBlock[]` DIRECTLY
  // from `fullVisibleExercises[].blockId + .method`. The display surface
  // always carries blockId/method forward (bridge contract), so any session
  // with even one grouped exercise surviving the variant trim lands here with
  // a block to render. If synthesis yields blocks, we flip the mode to
  // `raw_grouped_fallback` (NOT `simple_order_grouped`) so the grouped body
  // path owns the visible render, and the chip tally / banner counts also
  // come from the synthesized per-type counts.
  //
  // Why this is safe vs the adapter path: this runs ONLY when the adapter's
  // rich + rawFallback paths both came back empty. It cannot override the
  // contract; it can only provide a grouped body when the contract's
  // rendering-surface pipeline lost every block. `fullVisibleExercises` is
  // the exact hydration source the grouped branches already consume for
  // member rows, so any synthesized block member also hydrates cleanly.
  // ==========================================================================
  const synthesizedRawFallbackBlocks: RawFallbackBlock[] = (() => {
    if (!hasGroupedTruth) return []
    if (groupedRenderContract.rawFallbackBlocks.length > 0) return []
    // [SYNTHESIS-SOURCE-PAIR] Try display-surface exercises first (so synthesized
    // block members resolve cleanly against the same list the renderer hydrates
    // from). Fall back to raw `safeExercises` when the display surface has lost
    // `blockId`/`method` via variant-prune or hydration drift. This closes the
    // last corridor where `rawGroupedOwnership.hasGroupedTruth === true` could
    // silently route to `flat_category` when the display-side lost grouping.
    type _Ex = { id: string; name: string; blockId?: string; method?: string; methodLabel?: string }
    const buildFromSource = (source: _Ex[]): RawFallbackBlock[] => {
      const blockOrder: string[] = []
      const blockMembers = new Map<string, _Ex[]>()
      const blockType = new Map<string, 'superset' | 'circuit' | 'cluster' | 'density_block'>()
      for (const ex of source) {
        if (!ex.method) continue
        const m = ex.method.toLowerCase()
        let gt: 'superset' | 'circuit' | 'cluster' | 'density_block' | null = null
        if (m === 'superset') gt = 'superset'
        else if (m === 'circuit') gt = 'circuit'
        else if (m === 'cluster') gt = 'cluster'
        else if (m === 'density_block' || m === 'density') gt = 'density_block'
        if (!gt) continue
        // [RENDERABLE-BLOCK-ONLY-SYNTH] A grouped block MUST be backed by a
        // real `blockId` -- that is the builder's authoritative signal that
        // multiple exercises are grouped together for coordinated execution
        // (superset pair, circuit group, multi-member cluster/density).
        //
        // Single-row cluster/density *without* a blockId are METHOD CUES on
        // one exercise, not grouped blocks (see governor prompt section C/E).
        // Previously we synthesized a `method-only-${ex.id}` fake block key
        // so each single-row cluster/density painted its own block header.
        // That conflated "renderable grouped structure" with "row-level
        // method cue" and caused the card body to wrap a single row in a
        // fake "Cluster Set A" header -- misleading when the session should
        // read as flat rows with a simple method chip.
        //
        // New rule: ANY method without a blockId is skipped from synthesis.
        // The row still renders (below) with its row-level method chip, and
        // the card-level status line at the top of the body reports the
        // session as `method_only` so the user understands why the body is
        // flat.
        if (!ex.blockId) continue
        const key = ex.blockId
        if (!blockMembers.has(key)) {
          blockMembers.set(key, [])
          blockOrder.push(key)
          blockType.set(key, gt)
        }
        blockMembers.get(key)!.push(ex)
      }
      const typeIdx: Record<string, number> = { superset: 0, circuit: 0, density_block: 0, cluster: 0 }
      const out: RawFallbackBlock[] = []
      for (const bId of blockOrder) {
        const method = blockType.get(bId)!
        const members = blockMembers.get(bId)!.filter(m => (m.name || '').trim().length >= 2)
        if (members.length === 0) continue
        const idx = typeIdx[method] ?? 0
        typeIdx[method] = idx + 1
        const letter = String.fromCharCode(65 + idx)
        const labelPrefix =
          method === 'superset' ? 'Superset'
            : method === 'circuit' ? 'Circuit'
              : method === 'density_block' ? 'Density Block'
                : 'Cluster Set'
        out.push({
          type: 'group',
          groupId: bId,
          groupType: method,
          label: `${labelPrefix} ${letter}`,
          members: members.map((m, i) => ({
            id: m.id,
            name: m.name,
            prefix: m.methodLabel?.match(/[A-Z]\d?$/)?.[0] || `${letter}${i + 1}`,
          })),
        })
      }
      return out
    }
    const fromDisplay = buildFromSource(fullVisibleExercises as unknown as _Ex[])
    if (fromDisplay.length > 0) return fromDisplay
    // [RAW-SYNTH-BACKSTOP] The display surface couldn't produce a grouped
    // block list (variant prune removed every grouped member, or hydration
    // lost method/blockId on the FullRoutineExercise pass). Synthesize from
    // the raw session exercises -- this is the same input `rawGroupedOwnership`
    // consumed to claim grouped truth in the first place, so it cannot
    // contradict the authoritative ownership signal.
    const fromRaw = buildFromSource(
      safeExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        blockId: (ex as unknown as { blockId?: string }).blockId,
        method: (ex as unknown as { method?: string }).method,
        methodLabel: (ex as unknown as { methodLabel?: string }).methodLabel,
      }))
    )
    return fromRaw
  })()

  const finalVisibleBodyModel: FinalVisibleBodyModel = (() => {
    // Grouped truth wins whenever it exists. Rich first, raw fallback second
    // (either contract-owned OR display-synthesized), flat_category reserved
    // for sessions with NO grouped truth at all.
    //
    // [SIMPLE-ORDER-NEUTRALIZED] `simple_order_grouped` is retained as a type
    // for backwards compat but is NO LONGER a valid dispatch target: any case
    // that would have chosen it now routes to `raw_grouped_fallback` with
    // display-synthesized blocks (see `synthesizedRawFallbackBlocks` above).
    // If synthesis also returns empty (truly no visible grouped rows), the
    // renderer's `simple_order_grouped` branch still renders an honest
    // grouped-method banner above the ordered list so the body cannot
    // silently read as flat.
    if (hasRichRenderableGroups) {
      return {
        mode: 'rich_grouped' as const,
        sourceUsed: groupedRenderContract.sourceUsed,
        reasonIfNotRich: null,
        renderBlocks: groupedRenderContract.renderBlocks,
        rawFallbackBlocks: [],
        nonStraightGroupCount: groupedRenderContract.nonStraightGroupCount,
        supersetCount: groupedRenderContract.supersetCount,
        circuitCount: groupedRenderContract.circuitCount,
        densityCount: groupedRenderContract.densityCount,
        clusterCount: groupedRenderContract.clusterCount,
        hasGroupedTruth: true,
        hasRichRenderableGroups: true,
        groupedFailureStage: null,
      }
    }
    if (hasGroupedTruth && groupedRenderContract.rawFallbackBlocks.length > 0) {
      return {
        mode: 'raw_grouped_fallback' as const,
        sourceUsed: groupedRenderContract.sourceUsed,
        reasonIfNotRich: null,
        renderBlocks: [],
        rawFallbackBlocks: groupedRenderContract.rawFallbackBlocks,
        nonStraightGroupCount: groupedRenderContract.nonStraightGroupCount,
        supersetCount: groupedRenderContract.supersetCount,
        circuitCount: groupedRenderContract.circuitCount,
        densityCount: groupedRenderContract.densityCount,
        clusterCount: groupedRenderContract.clusterCount,
        hasGroupedTruth: true,
        hasRichRenderableGroups: false,
        groupedFailureStage: null,
      }
    }
    if (hasGroupedTruth && synthesizedRawFallbackBlocks.length > 0) {
      // [DISPLAY-SYNTHESIS-RESCUE] Route through raw_grouped_fallback using
      // the synthesized block list. Per-type counts come from synthesis so
      // the chip tally + body banner tell the same story as the block list
      // the renderer will iterate.
      let sSuper = 0, sCirc = 0, sDens = 0, sClust = 0
      for (const b of synthesizedRawFallbackBlocks) {
        if (b.groupType === 'superset') sSuper++
        else if (b.groupType === 'circuit') sCirc++
        else if (b.groupType === 'density_block') sDens++
        else if (b.groupType === 'cluster') sClust++
      }
      return {
        mode: 'raw_grouped_fallback' as const,
        sourceUsed: groupedRenderContract.sourceUsed !== 'none'
          ? groupedRenderContract.sourceUsed
          : 'exerciseFallback',
        reasonIfNotRich: null,
        renderBlocks: [],
        rawFallbackBlocks: synthesizedRawFallbackBlocks,
        nonStraightGroupCount: synthesizedRawFallbackBlocks.length,
        supersetCount: sSuper,
        circuitCount: sCirc,
        densityCount: sDens,
        clusterCount: sClust,
        hasGroupedTruth: true,
        hasRichRenderableGroups: false,
        groupedFailureStage: null,
      }
    }
    // [DISPLAY-CORRIDOR-TERMINAL] Final dispatch arm.
    //
    // Prior behavior collapsed to `flat_category` whenever no block source
    // (rich path, contract rawFallback, display synthesis) produced a
    // renderable block list, EVEN if `hasGroupedTruth === true`. That was
    // the last silent corridor where grouped truth existed upstream but the
    // card body still read as a flat category layout -- the exact visible
    // regression this pass fixes.
    //
    // New rule: `flat_category` is ONLY selected when `hasGroupedTruth ===
    // false`. When grouped truth exists but no block list could be produced,
    // the dispatcher routes to `simple_order_grouped` with:
    //   - a strong "Grouped structure" banner + method chips (via
    //     GroupedBodyHeadline in the renderer)
    //   - per-type counts sourced from the RAW pre-filter styledGroups +
    //     session-exercise method truth (so chips surface claimed grouped
    //     structure even when post-filter usable-member counts would have
    //     been zero)
    //   - a populated `groupedFailureStage` code that the renderer surfaces
    //     inline as the ONE card-local failure reason (section F of the
    //     governor prompt) so the broken card is never silently ambiguous.
    //
    // Cards where grouped rendering succeeded never reach this branch, so
    // the failure surface never fires for healthy cards.
    // [METHOD-ONLY-PRECHECK] Before entering the `simple_order_grouped`
    // failure-attribution branch, determine whether the grouped truth
    // claimed by `hasGroupedTruth` is actually rooted in RENDERABLE grouped
    // block structure -- i.e. something with multi-exercise coordination
    // that would paint a real block frame. The criteria here mirror the
    // scanner's Priority-1/Priority-2 rules:
    //   - any styledGroups entry with a non-straight groupType and >= 2
    //     usable-named members, OR
    //   - any blockId shared by >= 2 exercises with non-straight methods.
    // If NEITHER is true but there ARE non-straight methods on individual
    // rows, the session's only grouped-ish signal is method cues on single
    // rows. That must read as FLAT with row-level method chips per section
    // C/E of the governor prompt, not as a `simple_order_grouped` banner
    // over a list (which implies renderable grouped structure).
    const hasRenderableGroupedBlockStructure = (() => {
      // Priority-1: multi-member styled groups
      for (const g of sessionStyleMetadata?.styledGroups ?? []) {
        if (g.groupType === 'straight') continue
        const members = Array.isArray(g.exercises) ? g.exercises : []
        const usable = members.filter(
          m => typeof m?.name === 'string' && m.name.trim().length >= 2
        )
        if (usable.length >= 2) return true
      }
      // Priority-2: blockId shared by >=2 non-straight-method exercises
      const blockMethodMembers = new Map<string, number>()
      for (const ex of safeExercises) {
        const b = (ex as unknown as { blockId?: string }).blockId
        const m = ((ex as unknown as { method?: string }).method || '').toLowerCase()
        if (!b) continue
        if (!m || m === 'straight' || m === 'straight_sets') continue
        blockMethodMembers.set(b, (blockMethodMembers.get(b) ?? 0) + 1)
      }
      for (const count of blockMethodMembers.values()) {
        if (count >= 2) return true
      }
      return false
    })()

    // [SET-EXECUTION-TRUTH-RESOLVER] Single row-level method family resolver
    // used by the visibility gates + tallies below. Priority:
    //   1. `setExecutionMethod` (authoritative row-level set-execution truth)
    //   2. `method` (legacy; still written by the builder for grouped members)
    // Returns a collapsed family string or null when the row is straight.
    // Only used for row-level method-cue surfaces -- grouped-STRUCTURE
    // detection (`hasGroupedTruth`, synthesis of grouped blocks, blockId+method
    // membership) intentionally still reads `.method` alone because the
    // builder writes grouped identity onto `.method`. That keeps single-row
    // cluster from reactivating fake grouped blocks.
    const resolveRowExecFamily = (ex: unknown): 'superset' | 'circuit' | 'cluster' | 'density' | null => {
      const e = ex as { method?: string; setExecutionMethod?: string }
      const se = (e?.setExecutionMethod || '').toLowerCase().trim()
      const mm = (e?.method || '').toLowerCase().trim()
      const pick = (raw: string): 'superset' | 'circuit' | 'cluster' | 'density' | null => {
        if (!raw || raw === 'straight' || raw === 'straight_sets') return null
        if (raw === 'superset') return 'superset'
        if (raw === 'circuit' || raw === 'circuits') return 'circuit'
        if (raw === 'cluster' || raw === 'cluster_set' || raw === 'cluster_sets') return 'cluster'
        if (raw === 'density' || raw === 'density_block') return 'density'
        return null
      }
      return pick(se) || pick(mm)
    }

    // [SET-EXECUTION-TRUTH-GATE] Detect non-straight methods living on
    // INDIVIDUAL exercise rows (cluster / density / etc.), independent of
    // blockId and independent of `hasGroupedTruth`.
    //
    // Why this is a distinct signal from `hasGroupedTruth`:
    //   After the taxonomy lock at components/programs/lib/session-group-display.ts
    //   (~L820), `hasAnyExerciseMethodTruth` requires a blockId for cluster/
    //   superset/circuit -- correctly excluding single-row cluster from the
    //   GROUPED-STRUCTURE truth signal. The side-effect: when the builder
    //   writes `method:'cluster'` onto a single primary-effort exercise (the
    //   common set-execution case), `hasGroupedTruth` resolves to false, the
    //   card never entered the METHOD_ONLY_FLAT branch, `reasonIfNotRich`
    //   stayed at the generic flatReason, and the prior prompt's visible
    //   surfaces (top chip row + in-body "Set-execution methods" headline)
    //   silently stayed hidden. The only surviving surface was the tiny
    //   8px row-level chip and 10px microcopy -- the exact "basically looks
    //   unchanged" symptom the user reported.
    //
    // This gate re-captures that truth WITHOUT reopening grouped ownership:
    //   - reads straight from `safeExercises[].method`,
    //   - requires NO blockId (set-execution is a per-row concept),
    //   - feeds only the METHOD_ONLY_FLAT dispatch arm (which returns
    //     `hasGroupedTruth: false` / `hasRichRenderableGroups: false` so
    //     nothing in the grouped corridor can be reactivated).
    const hasAnySetExecutionMethodOnRows = safeExercises.some(ex => {
      // [SET-EXECUTION-TRUTH-GATE] Read `setExecutionMethod` FIRST so a
      // single-row cluster (builder writes `.setExecutionMethod='cluster'`
      // but leaves legacy `.method` empty/straight) still activates the
      // METHOD_ONLY_FLAT dispatch and its visible surfaces.
      return resolveRowExecFamily(ex) !== null
    })

    if ((hasGroupedTruth || hasAnySetExecutionMethodOnRows) && !hasRenderableGroupedBlockStructure) {
      // [METHOD-ONLY-FLAT] Session carries non-straight methods on individual
      // rows but NO renderable grouped block structure (no multi-member
      // styled group, no multi-member blockId). Route to flat_category so
      // the body paints a clean flat row list with row-level method chips.
      //
      // [SET-EXECUTION-TRUTH-VISIBILITY] Count per-row set-execution methods
      // directly from `safeExercises` and carry them on the model. This is
      // the authoritative tally of set-execution methods applied to
      // individual rows -- it is NOT a grouped-block count. Downstream:
      //   - `visibleMethodTally` reads these counts so the top-of-body chip
      //     row re-surfaces (prior behavior hid it because all counts were
      //     zeroed here, leaving the taxonomy refactor's set-execution
      //     stamping invisible at session level).
      //   - The `flat_category` renderer reads these counts + the
      //     `METHOD_ONLY_FLAT` reason to paint an honest "Set-execution
      //     methods applied to individual rows" headline at the top of the
      //     body. That headline is NOT a grouped-structure banner; its copy
      //     explicitly says the methods live on single rows.
      // `hasGroupedTruth` stays false so nothing in the grouped render
      // corridor can be reactivated by these counts.
      let meoSuper = 0, meoCirc = 0, meoDens = 0, meoClust = 0
      for (const ex of safeExercises) {
        // [SET-EXECUTION-TRUTH-TALLY] Count per-row set-execution families
        // via the resolver so single-row cluster / density are counted even
        // when only `setExecutionMethod` carries the truth. These feed the
        // top-of-body chip tally + "Set-execution methods applied to
        // individual rows" headline.
        const fam = resolveRowExecFamily(ex)
        if (!fam) continue
        if (fam === 'cluster') meoClust++
        else if (fam === 'density') meoDens++
        else if (fam === 'superset') meoSuper++
        else if (fam === 'circuit') meoCirc++
      }
      return {
        mode: 'flat_category' as const,
        sourceUsed: groupedRenderContract.sourceUsed,
        reasonIfNotRich: 'METHOD_ONLY_FLAT' as const,
        renderBlocks: [],
        rawFallbackBlocks: [],
        // nonStraightGroupCount is GROUPED-BLOCK semantics; stays 0 because
        // no grouped blocks exist. Per-type counts below are SET-EXECUTION
        // semantics (per-row), which is a distinct concept.
        nonStraightGroupCount: 0,
        supersetCount: meoSuper,
        circuitCount: meoCirc,
        densityCount: meoDens,
        clusterCount: meoClust,
        hasGroupedTruth: false,
        hasRichRenderableGroups: false,
        groupedFailureStage: null,
      }
    }

    if (hasGroupedTruth) {
      // [RAW-PRE-FILTER-METHOD-COUNTS] Chip counts for simple_order_grouped
      // come from the RAW upstream signal (styleMetadata.styledGroups types
      // + session.exercises method truth) -- not from post-filter
      // rawGroupedOwnership, which may have zeroed counts when member names
      // were unusable. This is the same signal the FUNNEL-AUDIT uses to
      // claim grouped truth exists at all, so banner chips cannot
      // contradict the grouped ownership verdict.
      let rawSuper = 0, rawCirc = 0, rawDens = 0, rawClust = 0
      for (const g of sessionStyleMetadata?.styledGroups ?? []) {
        if (g.groupType === 'superset') rawSuper++
        else if (g.groupType === 'circuit') rawCirc++
        else if (g.groupType === 'density_block') rawDens++
        else if (g.groupType === 'cluster') rawClust++
      }
      const seenBlockIds = new Set<string>()
      for (const ex of safeExercises) {
        const fam = resolveRowExecFamily(ex)
        const b = (ex as unknown as { blockId?: string }).blockId
        if (b && seenBlockIds.has(b)) continue
        if (b) seenBlockIds.add(b)
        // Only tally method-only cluster/density execution (no blockId);
        // superset/circuit require blockId and were already counted from
        // the styledGroups signal above. Reads authoritative row-level
        // set-execution first so single-row cluster is never silently lost.
        if (!b && fam === 'cluster') rawClust++
        else if (!b && fam === 'density') rawDens++
      }

      // [FAILURE-STAGE-ATTRIBUTION] Pick the ONE final losing stage. Each
      // stage answers a different "why did this card reach simple_order
      // despite grouped truth?" question and is chosen from the governor-
      // prompt enumeration (superset/circuit/density_block/cluster taxonomy
      // only; no top_set/drop_set contamination).
      let failureStage:
        | 'bridge_lost_group_fields'
        | 'grouped_contract_empty'
        | 'final_mode_flattened'
        | 'hydration_render_loss'
      const displayHasAnyCarry = fullVisibleExercises.some(e => {
        const anyE = e as unknown as { blockId?: string; method?: string }
        return !!anyE.blockId || (!!anyE.method && anyE.method !== 'straight' && anyE.method !== 'straight_sets')
      })
      if (rawGroupedOwnership.hasGroupedTruth && !displayHasAnyCarry) {
        // Raw says grouped but the display surface dropped every
        // blockId/method -- the bridge weakened the corridor.
        failureStage = 'bridge_lost_group_fields'
      } else if (
        rawGroupedOwnership.hasGroupedTruth &&
        rawGroupedOwnership.nonStraightGroupCount === 0
      ) {
        // Raw truth exists but the adapter could not form ANY non-straight
        // group (every member's name was unusable or below the method minimum).
        failureStage = 'hydration_render_loss'
      } else if (
        !rawGroupedOwnership.hasRichRenderableGroups &&
        !displayGroupedRendering.hasRichRenderableGroups
      ) {
        // Both independent model builds came back without rich groups.
        failureStage = 'grouped_contract_empty'
      } else {
        // Rich contract existed but was lost between contract merge and
        // final dispatch.
        failureStage = 'final_mode_flattened'
      }

      return {
        mode: 'simple_order_grouped' as const,
        sourceUsed: groupedRenderContract.sourceUsed,
        reasonIfNotRich: 'RAW_FALLBACK_EMPTY' as const,
        renderBlocks: [],
        rawFallbackBlocks: [],
        nonStraightGroupCount:
          rawSuper + rawCirc + rawDens + rawClust || rawGroupedOwnership.nonStraightGroupCount,
        supersetCount: rawSuper || rawGroupedOwnership.supersetCount,
        circuitCount: rawCirc || rawGroupedOwnership.circuitCount,
        densityCount: rawDens || rawGroupedOwnership.densityCount,
        clusterCount: rawClust || rawGroupedOwnership.clusterCount,
        hasGroupedTruth: true,
        hasRichRenderableGroups: false,
        groupedFailureStage: failureStage,
      }
    }

    // Honest flat: NO grouped truth at all reached the card. The flat
    // category layout is the correct outcome for these sessions.
    return {
      mode: 'flat_category' as const,
      sourceUsed: groupedRenderContract.sourceUsed,
      reasonIfNotRich: groupedRenderContract.flatReason,
      renderBlocks: [],
      rawFallbackBlocks: [],
      nonStraightGroupCount: 0,
      supersetCount: 0,
      circuitCount: 0,
      densityCount: 0,
      clusterCount: 0,
      hasGroupedTruth: false,
      hasRichRenderableGroups: false,
      groupedFailureStage: null,
    }
  })()

  // ==========================================================================
  // [PHASE 4U — CANONICAL-METHOD-BODY-RENDER-PROOF]
  //
  // This is the Phase G proof that the visible body's grouped blocks are
  // backed by canonical `methodStructures`, not silently rendered off a
  // parallel/stale source. The pure resolver lives in program-display-contract
  // and never touches state, hooks, or I/O — it just returns a verdict object
  // we can read in dev probes and surface in the blueprint evidence.
  //
  // Inputs we hand it:
  //   1. `cardSurface.methodStructures` — canonical Phase 4P truth carried on
  //      the surface (Phase 4S wired this end-to-end).
  //   2. `safeExercises` (id+name only) — the row list the body actually
  //      iterates. This is the same array the synthesized fallback path and
  //      the rich grouped contract consume, so a successful canonical match
  //      against it implies the body's blocks DID hit canonical-backed rows.
  //   3. The body's already-built render block list (member ids extracted
  //      from `finalVisibleBodyModel.renderBlocks` for rich_grouped, or
  //      `rawFallbackBlocks` for raw_grouped_fallback). The resolver uses
  //      this to compute `bodyBlocksMatchCanonical` — the strongest "the
  //      visible body IS canonical" cross-check.
  //
  // Why this is an inline pass rather than a buildSessionCardSurface field:
  // the rendered block list is only known here, after the dispatcher picked
  // a mode. The resolver is pure so calling it during render is safe.
  //
  // What downstream consumers do with the verdict:
  //   - the dev probe surfaces `canon=...` so the body's actual source is
  //     observable without a new banner;
  //   - the blueprint G.G5 evidence cites status === 'complete' as proof
  //     that canonical truth reaches real rows;
  //   - the body itself is unchanged this phase — on healthy generations
  //     methodStructures, styledGroups, and exercise[].method are sibling
  //     outputs of the same Phase 4P corridor that wrote them, so the
  //     resolver's `bodyBlocksMatchCanonical` should be true and the verdict
  //     should be 'canonical_method_structures'/'complete'. When it is not,
  //     we have an exact attribution code (NO_CANONICAL_METHOD_STRUCTURES /
  //     NO_GROUPED_FAMILY_APPLIED / ALL_CANONICAL_GROUPS_FAILED_TO_BIND) the
  //     blueprint can call out instead of a silent fallback.
  // ==========================================================================
  const canonicalBodyRenderResolution: CanonicalMethodBodyRenderResolution = (() => {
    // Extract member ids from whichever block list the body will actually
    // render. `simple_order_grouped` and `flat_category` paint no grouped
    // blocks, so we pass an empty list and let the resolver compute its
    // canonical-only verdict (no body cross-check possible).
    const renderedBlockMembers: { memberIds: string[]; groupType: string }[] = []
    if (finalVisibleBodyModel.mode === 'rich_grouped') {
      for (const rb of finalVisibleBodyModel.renderBlocks) {
        if (rb.type === 'group') {
          renderedBlockMembers.push({
            memberIds: (rb.group.exercises || [])
              .map(e => e.id)
              .filter((id): id is string => typeof id === 'string' && id.length > 0),
            groupType: rb.group.groupType,
          })
        }
        // type==='exercise' rows are not grouped blocks; skip.
      }
    } else if (finalVisibleBodyModel.mode === 'raw_grouped_fallback') {
      for (const rfb of finalVisibleBodyModel.rawFallbackBlocks) {
        renderedBlockMembers.push({
          memberIds: (rfb.members || [])
            .map(m => m.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
          groupType: rfb.groupType,
        })
      }
    }
    // `safeExercises` is the row list the body iterates — id+name slice is
    // all the resolver needs. Cast to the resolver's minimal row shape.
    const rowsForResolver = (safeExercises as Array<{ id?: unknown; name?: unknown }>).map(
      r => ({
        id: typeof r.id === 'string' ? r.id : '',
        name: typeof r.name === 'string' ? r.name : '',
      }),
    )
    return resolveCanonicalMethodBodyRender(
      cardSurface?.methodStructures ?? null,
      rowsForResolver,
      renderedBlockMembers,
    )
  })()

  // ==========================================================================
  // [FUNNEL-AUDIT-S5] CHECKPOINT E (card input) + CHECKPOINT F (final body mode)
  //
  // Completes the end-to-end grouped-truth funnel audit that already covers:
  //   - STAGE 1/2 : builder output + current program object (logged from
  //                 app/(app)/program/page.tsx FUNNEL-AUDIT-S1S2)
  //   - STAGE 3   : normalizeProgramForDisplay output (logged from same site)
  //   - STAGE 3/4 : normalized -> scaled session (logged from
  //                 AdaptiveProgramDisplay FUNNEL-AUDIT-S3S4)
  //
  // This adds STAGE 5: scaled session -> actual card body mode. If S3/S4 say
  // `hasGroupedTruth: true` but S5 logs `card_input_has_nonstraight_groups:
  // false` OR `final_body_mode: 'flat_category'`, the weakening is inside THIS
  // card (normalizeSessionForDisplay, variantPrune, rawGroupedOwnership/
  // displayGroupedRendering merge, or finalVisibleBodyModel dispatch). If S5
  // says `final_body_mode: 'rich_grouped' | 'raw_grouped_fallback'`, the body
  // WILL paint visible grouped blocks and the user's "Program page still looks
  // flat" complaint narrows to one of:
  //   (a) a stale screenshot / expanded vs collapsed view confusion
  //   (b) a CSS issue in the rendered grouped JSX (unlikely)
  //   (c) the user genuinely has no grouped methods in their program (builder
  //       never applied them - honest flat state)
  //
  // One compact log per card mount per session day. Keyed on session identity
  // so repeated renders (state updates) do not spam; this fires exactly once
  // per day number when the card first paints.
  // ==========================================================================
  // [FINAL-VISIBLE-OWNERSHIP-LOCK] FUNNEL-AUDIT-S5 verdict computation +
  // once-per-mount log removed. The dead computation produced no athlete-
  // facing surface; grouped-vs-flat dispatch is already structurally enforced
  // by `groupedRenderContract` and `finalVisibleBodyModel` below.

  // ==========================================================================
  // [COLLAPSED-HEADER-METHOD-TRUTH] The Program card is collapsed by default.
  // Prior behavior: every grouped-method signal (colored "Cluster Set" /
  // "Density Block" pill header AND the method-summary chip row) lived inside
  // the `{isExpanded && (...)}` gate. So on the exact surface the user is
  // actually looking at -- the collapsed card list on the Program screen --
  // nothing visibly communicated grouped structure, even when the session
  // genuinely rendered a Cluster Set or Density Block in its body once opened.
  //
  // `visibleMethodTally` is a PURE CONSUMER of `finalVisibleBodyModel`. It
  // does NOT introduce parallel grouped truth, it does NOT re-decide
  // grouped-vs-flat, and it cannot overclaim a method the body will not
  // render -- the tally is derived from the EXACT block list the renderer
  // consumes per mode:
  //
  //   mode === 'rich_grouped'           -> carry the model's per-type counts
  //                                        (same counts the rich renderer will
  //                                        paint as "Cluster Set A", etc.)
  //   mode === 'raw_grouped_fallback'   -> tally from rawFallbackBlocks so the
  //                                        collapsed chip matches the grouped
  //                                        headers the raw-fallback branch
  //                                        paints in the body.
  //   mode === 'simple_order_grouped'   -> zero (the body paints no grouped
  //                                        headers, so the chip must not
  //                                        claim any).
  //   mode === 'flat_category'          -> zero (no grouped truth exists).
  //
  // This is the single authoritative tally consumed by BOTH the new collapsed
  // header chip row and the existing expanded chip row, which eliminates the
  // prior gap where the expanded chip row gated on `hasRichRenderableGroups`
  // alone (under-claiming for raw_grouped_fallback sessions whose body did
  // paint grouped headers).
  // ==========================================================================
  const visibleMethodTally: { superset: number; circuit: number; density: number; cluster: number } = (() => {
    if (finalVisibleBodyModel.mode === 'rich_grouped') {
      return {
        superset: finalVisibleBodyModel.supersetCount,
        circuit: finalVisibleBodyModel.circuitCount,
        density: finalVisibleBodyModel.densityCount,
        cluster: finalVisibleBodyModel.clusterCount,
      }
    }
    if (finalVisibleBodyModel.mode === 'raw_grouped_fallback') {
      let superset = 0, circuit = 0, density = 0, cluster = 0
      for (const b of finalVisibleBodyModel.rawFallbackBlocks) {
        if (b.groupType === 'superset') superset++
        else if (b.groupType === 'circuit') circuit++
        else if (b.groupType === 'density_block') density++
        else if (b.groupType === 'cluster') cluster++
      }
      return { superset, circuit, density, cluster }
    }
    // [SIMPLE-ORDER-BANNER-TALLY] Previously zero. But `simple_order_grouped`
    // fires precisely when grouped truth exists but no renderable blocks
    // could be built -- the body now renders a grouped-method banner above
    // the ordered list (see MainExercisesRenderer), so the chip row ABOVE
    // the body must also surface the same method identity or the collapsed
    // card + expanded header would contradict the body's own banner.
    // Counts here come from the contract's raw ownership counts, which
    // remain meaningful even when rendering-side synthesis failed.
    if (finalVisibleBodyModel.mode === 'simple_order_grouped') {
      return {
        superset: finalVisibleBodyModel.supersetCount,
        circuit: finalVisibleBodyModel.circuitCount,
        density: finalVisibleBodyModel.densityCount,
        cluster: finalVisibleBodyModel.clusterCount,
      }
    }
    // [SET-EXECUTION-TRUTH-VISIBILITY] flat_category + METHOD_ONLY_FLAT
    // carries per-row set-execution tallies on the model (see the
    // METHOD_ONLY_FLAT branch of finalVisibleBodyModel). Surface them here
    // so the top-of-body chip row re-appears for cluster/density/etc. rows
    // that live on single exercises. The chip labels remain generic
    // ("Cluster Set", "Density Block") because those are the method names;
    // the NEW headline inside the body makes it explicit they apply to
    // individual rows rather than grouped blocks.
    if (
      finalVisibleBodyModel.mode === 'flat_category' &&
      finalVisibleBodyModel.reasonIfNotRich === 'METHOD_ONLY_FLAT'
    ) {
      return {
        superset: finalVisibleBodyModel.supersetCount,
        circuit: finalVisibleBodyModel.circuitCount,
        density: finalVisibleBodyModel.densityCount,
        cluster: finalVisibleBodyModel.clusterCount,
      }
    }
    return { superset: 0, circuit: 0, density: 0, cluster: 0 }
  })()

  // ==========================================================================
  // [PHASE 4T — METHOD-STRUCTURES-DOMINANCE] Canonical methodStructures wins
  // over the legacy styledGroups-derived `legacyVisibleMethodTally` whenever
  // the canonical surface has anything to say. This is the visible-side half
  // of Phase G: legacy and canonical agree on healthy generations, but on
  // BUG_NORMALIZER_DROPPED_TRUTH / BUG_STALE_SOURCE_WON paths only canonical
  // is reliable, and we must not paint chips that contradict the Phase 4S
  // classified line directly below.
  //
  // Resolution rules (single point):
  //   1. Canonical applied chips exist -> canonical is the dominant tally.
  //   2. Canonical exists but says nothing applied -> suppress all four
  //      chips (canonicalSaysNoneApplied=true). The classified line owns
  //      the doctrine narrative; the chip row must not contradict it.
  //   3. Canonical absent (older saved programs / pre Phase 4P) -> the
  //      legacy styledGroups-derived tally is the fallback so existing
  //      programs keep rendering chips exactly as before.
  //
  // `legacyVisibleMethodTally` is preserved as the second-priority source
  // (the body's `finalVisibleBodyModel` still uses styledGroups for the
  // grouped-block render path, unchanged — fallback only for chip dominance
  // when canonical is absent).
  // ==========================================================================
  const legacyVisibleMethodTally = visibleMethodTally
  const canonicalMethodTally = deriveCanonicalMethodTallyFromSurface(cardSurface)
  const dominantMethodTally: { superset: number; circuit: number; density: number; cluster: number } =
    canonicalMethodTally.hasCanonicalApplied
      ? {
          superset: canonicalMethodTally.superset,
          circuit: canonicalMethodTally.circuit,
          density: canonicalMethodTally.density,
          cluster: canonicalMethodTally.cluster,
        }
      : canonicalMethodTally.canonicalSaysNoneApplied
        ? { superset: 0, circuit: 0, density: 0, cluster: 0 }
        : legacyVisibleMethodTally
  const hasAnyVisibleMethod =
    dominantMethodTally.superset > 0 ||
    dominantMethodTally.circuit > 0 ||
    dominantMethodTally.density > 0 ||
    dominantMethodTally.cluster > 0

  // ==========================================================================
  // [METHOD-ONLY-VISIBILITY-CONTRACT] Card-level label truth.
  //
  // Chip labels must tell the user whether the body will render a grouped
  // block or a method-only row cue. Prior behavior used "Cluster Set" /
  // "Density Block" on BOTH paths -- the collapsed chip said "1 Cluster Set"
  // even when the body had no Cluster Set block to paint (METHOD_ONLY_FLAT),
  // so users expected a grouped block, expanded the card, found none, and
  // concluded cluster "disappeared." The status line and in-body headline
  // already use honest method-only language ("Method cues present: Cluster",
  // "1 Cluster row"); only the two chip sites were out of contract.
  //
  // This is a pure label/vocabulary fix. No counter changes, no gate changes,
  // no dispatch changes. Grouped paths (rich_grouped / raw_grouped_fallback /
  // simple_order_grouped) keep the structural noun ("Cluster Set",
  // "Density Block"). Method-only path (flat_category + METHOD_ONLY_FLAT)
  // uses the row noun ("Cluster row", "Density row"), matching the
  // SetExecutionBodyHeadline inside the body exactly. Superset/Circuit stay
  // unchanged because they require blockId by doctrine and therefore never
  // appear in the method-only path.
  // ==========================================================================
  const methodOnlyFlatActive =
    finalVisibleBodyModel.mode === 'flat_category' &&
    finalVisibleBodyModel.reasonIfNotRich === 'METHOD_ONLY_FLAT'
  const clusterChipLabel = (n: number): string =>
    methodOnlyFlatActive
      ? `${n} Cluster ${n > 1 ? 'rows' : 'row'}`
      : `${n} Cluster Set${n > 1 ? 's' : ''}`
  const densityChipLabel = (n: number): string =>
    methodOnlyFlatActive
      ? `${n} Density ${n > 1 ? 'rows' : 'row'}`
      : `${n} Density Block${n > 1 ? 's' : ''}`

  // ==========================================================================
  // [TASK 5] VARIANT TRUTH AUDIT
  // Log whether 45 and 30 variants are actually different or collapsing together
  // ==========================================================================
  if (session.variants && session.variants.length > 1) {
    const fullVariant = session.variants[0]
    const variant45 = session.variants.find(v => v.label.includes('45') || v.duration === 45)
    const variant30 = session.variants.find(v => v.label.includes('30') || v.duration === 30)
    
    const fullExerciseNames = fullVariant?.selection?.main?.map(s => s.exercise.name) || []
    const variant45Names = variant45?.selection?.main?.map(s => s.exercise.name) || []
    const variant30Names = variant30?.selection?.main?.map(s => s.exercise.name) || []
    
    // Check if 45 and 30 are identical
    const are45And30Identical = variant45 && variant30 && 
      JSON.stringify(variant45Names) === JSON.stringify(variant30Names)
    
    // Check if full and selected are identical
    const selectedNames = activeSessionView.exercises.map(e => e.name)
    const isSelectedIdenticalToFull = JSON.stringify(selectedNames) === JSON.stringify(fullExerciseNames)
    
    // ==========================================================================
    // [TASK 7] DEFAULT SESSION TIME VERDICT
    // Explain why full session may appear shorter than expected
    // ==========================================================================
    const fullDuration = fullVariant?.duration || session.estimatedMinutes
    const isFullShorterThanTarget = fullDuration < 45 // Common "expected" session length
    
    let defaultTimeVerdict = 'full_session_truthful_and_shorter_by_design'
    if (fullExerciseNames.length < 3) {
      defaultTimeVerdict = 'full_session_underbuilt'
    } else if (!variant45 && !variant30 && fullDuration < 40) {
      defaultTimeVerdict = 'full_session_compact_no_variants_needed'
    }
    
    // ==========================================================================
    // [TASK 9] FINAL SESSION-TIME CONSISTENCY AUDIT
    // ==========================================================================
    const baseMatchesFull = session.estimatedMinutes === fullVariant?.duration
    const variantDurations = session.variants?.map(v => v.duration) || []
    
    let sessionTimeFinalVerdict = 'fully_aligned'
    if (!baseMatchesFull) {
      sessionTimeFinalVerdict = 'base_variant_mismatch_remaining'
    } else if (variant45 && fullExerciseNames.length < variant45Names.length) {
      sessionTimeFinalVerdict = 'variant_generation_still_misaligned'
    } else if (fullExerciseNames.length < 3) {
      sessionTimeFinalVerdict = 'session_underbuilt_but_truthful'
    }
    
  }
  
  // [REMOVED] Top-level debug probe computations (computeTopProbeFlatReason,
  // computeTopProbeVerdict, topProbeFlatReason, topProbeVerdict). They fed
  // the now-removed fuchsia SESSION TRUTH PROBE banner and had no production
  // consumer.

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden">
      {/* Header - Collapsible day summary */}
      <div
        className="p-4 cursor-pointer hover:bg-[#333333] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold">{session.dayLabel}</h4>
              {session.isPrimary && (
                <Badge variant="outline" className="text-[#E63946] border-[#E63946]/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
            {/* ====================================================================
                [DOMINANT-CARD-OWNERSHIP-LOCK]
                The dominant visible identity slot now reads from the SAME
                authoritative SessionCardSurface that the Program-page wrapper
                consumes. Hierarchy:
                  1. weeklyRoleLabel    -> primary red sm bold identity line
                                           ("Heavier strength day", "Skill quality
                                            day", etc.) — the per-day role from
                                           the strengthened weekly contract.
                  2. focusLabel         -> demoted to secondary smaller line as
                                           legitimate skill/movement context
                                           ("Pull skill — bar muscle-up").
                When weeklyRoleLabel is absent (legacy / pre-contract sessions),
                focusLabel keeps the dominant slot exactly as before — fully
                backward compatible.
                ==================================================================== */}
            {cardSurface?.weeklyRoleLabel ? (
              <>
                <p className="text-sm text-[#E63946] font-semibold">
                  {cardSurface.weeklyRoleLabel}
                </p>
                {/* Secondary skill/movement context (demoted, not removed) */}
                {((session as any).resolvedSessionIdentity || session.focusLabel) && (
                  <p className="text-xs text-[#9A9A9A] mt-0.5">
                    {(session as any).resolvedSessionIdentity || session.focusLabel}
                  </p>
                )}
              </>
            ) : (
              /* [PHASE 15F] Legacy path: resolved identity if available, else focusLabel */
              <p className="text-sm text-[#E63946]">
                {(session as any).resolvedSessionIdentity || session.focusLabel}
              </p>
            )}
            {/* [DOMINANT-CARD-OWNERSHIP-LOCK] Supporting character line:
                intensity * progression * breadth from authoritative role truth.
                Plain text below the dominant identity — no chip-spam. Absent
                when role truth is absent (legacy sessions unchanged). */}
            {cardSurface?.weeklyRoleLabel && (() => {
              const intensityLabels: Record<string, string> = {
                high: 'High intensity',
                moderate_high: 'Moderate-high intensity',
                moderate: 'Moderate intensity',
                moderate_low: 'Moderate-low intensity',
                low: 'Low intensity',
              }
              const progressionLabels: Record<string, string> = {
                direct_load: 'Direct load',
                banded_support: 'Band-supported',
                conservative_skill: 'Conservative skill',
                mixed_breadth: 'Mixed breadth',
                volume_direct: 'Volume-direct',
                recovery_quality: 'Recovery quality',
              }
              const intensityLabel = cardSurface.weeklyIntensityClass
                ? intensityLabels[cardSurface.weeklyIntensityClass] ?? null
                : null
              const progressionLabel = cardSurface.weeklyProgressionCharacter
                ? progressionLabels[cardSurface.weeklyProgressionCharacter] ?? null
                : null
              const breadthLabel = cardSurface.weeklyBreadthLabel || null
              const parts = [intensityLabel, progressionLabel, breadthLabel].filter(Boolean)
              if (parts.length === 0) return null
              return (
                <p className="text-[11px] text-[#A8A8A8] mt-1 leading-snug">
                  {parts.join(' \u00B7 ')}
                </p>
              )
            })()}
            {/* ============================================================
                [PHASE-K] WEEKLY STRESS DISTRIBUTION PROOF
                ----------------------------------------------------------------
                Compact coach-facing chip + one-line explanation derived from
                the canonical weekly stress plan (computed once in the builder
                by `buildWeeklyStressDistributionPlan` and stamped onto
                `session.stressDistributionProof`). This is the visible proof
                that the week was reasoned about as a whole - not just six
                isolated session labels.
                Render rules:
                  - Only renders when `session.stressDistributionProof` is
                    present (legacy programs without Phase K classification
                    show nothing - we never invent labels).
                  - Label is the coach chip ("High strength day", "Moderate
                    volume day", "Tendon-protective skill day", etc.).
                  - Explanation is the post-governor one-liner
                    ("Hard pull stress; next day softened", etc.) - omitted
                    when the contract had nothing notable to say.
                  - Sized one notch above the intensity meta line so the
                    coach chip reads as the authoritative summary while
                    intensity/progression/breadth above remain context.
                ============================================================ */}
            {session.stressDistributionProof?.label && (
              <div className="mt-1.5 flex flex-col gap-0.5">
                <span className="inline-flex items-center self-start gap-1 rounded-full border border-[#2B313A] bg-[#161A21] px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-[#E6E9EF]">
                  {session.stressDistributionProof.label}
                </span>
                {session.stressDistributionProof.explanation && (
                  <p className="text-[11px] text-[#9CA3AF] leading-snug">
                    {session.stressDistributionProof.explanation}
                  </p>
                )}
              </div>
            )}
            {/* ============================================================
                [PHASE-P] SESSION-LEVEL QUALITY / DOCTRINE AUDIT PROOF
                ----------------------------------------------------------------
                Compact amber chip + one-line explanation derived from the
                Phase P resolver's session-level findings:
                  - cross-session straight-arm overlap warning, OR
                  - session-length realism warning (Phase Q owns the lock).
                Renders nothing when no Phase P session-level finding is
                present (most sessions). Skill-carryover roll-ups stay on the
                exercise-level proof line so the session header doesn't
                clutter when only attribution exists.
                ============================================================ */}
            {(() => {
              const sqa = (session as unknown as {
                qualityAudit?: {
                  shortLabel?: string
                  conciseExplanation?: string
                  corrections?: string[]
                  sessionLengthRealism?: { verdict?: 'within_tolerance' | 'over' | 'under' }
                  straightArmOverlap?: { pattern?: string; explanation?: string }
                }
              }).qualityAudit
              if (!sqa) return null
              const corr = Array.isArray(sqa.corrections) ? sqa.corrections : []
              const hasOverlap = corr.includes('straight_arm_overlap_warning_attached')
              const hasTimeWarn = corr.includes('session_length_warning_attached')
              if (!hasOverlap && !hasTimeWarn) return null
              const label = hasOverlap ? 'OVERLAP WATCH' : 'TIME REALISM'
              const explanation = sqa.conciseExplanation || sqa.straightArmOverlap?.explanation || ''
              return (
                <div className="mt-1 flex flex-col gap-0.5" data-phase-p-session-proof="true">
                  <span className="inline-flex items-center self-start gap-1 rounded-full border border-amber-500/30 bg-amber-500/5 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-amber-300">
                    {label}
                  </span>
                  {explanation && (
                    <p className="text-[11px] text-amber-300/70 italic leading-snug">{explanation}</p>
                  )}
                </div>
              )
            })()}
            {/* Compact meta line - time + exercise count only */}
            <div className="flex items-center gap-3 mt-1 text-xs text-[#6A6A6A]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activeSessionView.estimatedMinutes} min
              </span>
              <span>{fullVisibleExercises.length} exercises</span>
              {activeSessionView.isVariantSelected && (
                <span className="text-[#E63946]/70">({activeSessionView.variantLabel})</span>
              )}
            </div>

            {/* ==================================================================
                [DOCTRINE-METHOD-DECISION-PHASE3]
                Compact, doctrine-attributable method label + rationale for
                this session. Reads ONLY `session.methodDecision` (stamped by
                the authoritative wrapper post-builder via
                `stampMethodDecisionsOnSessions`). Renders nothing for legacy
                sessions that lack the field — zero impact on existing visuals.
                The render is intentionally minimal: one method label badge +
                one short rationale + optional rejected-method line. We do
                NOT claim "fully doctrine-driven programming" here; the badge
                only attributes the materialized method to its doctrine
                source via Batch 10 compatibility matrix + runtime method
                doctrine. See lib/program/method-decision-engine.ts.
                ================================================================== */}
            {(() => {
              // ============================================================
              // [DOCTRINE-MATERIALIZATION-EVIDENCE-PHASE4A]
              //
              // PHASE 3C added an always-visible "Doctrine Decision" panel —
              // it rendered on EVERY session, including pure straight-set
              // sessions where the builder applied no grouping at all. That
              // produced the exact fake-proof failure mode the user called
              // out: "labels claiming density/superset/top set while rows
              // remain plain straight sets."
              //
              // PHASE 4A correction: the panel now ONLY renders when the
              // session has a real, structurally-different materialization
              // — a non-straight grouped block, a per-row set-execution
              // method (cluster / top_set / drop_set / rest_pause), or a
              // cluster sidecar. The structural verdict comes from the
              // builder-locked methodMaterializationSummary (or, on legacy
              // programs, a faithful re-derivation from the same raw fields
              // the builder used). Every line of visible text below cites a
              // concrete count of changed program fields — never an
              // abstract "data-driven" or "profile-driven" claim against an
              // unchanged session.
              //
              // When the session is genuinely flat the panel HIDES, which
              // is honest: a primary skill day with quality straight sets
              // legitimately has no grouped doctrine to visualize, and we
              // do not want to manufacture proof.
              // ============================================================
              const stamped = (session as unknown as { methodDecision?: MethodDecisionShape })
                .methodDecision ?? null

              const bridgeProfileContext = extractProfileContextFromSnapshot(
                programProfileSnapshot ?? null,
                'program.profileSnapshot',
              )

              let md: MethodDecisionShape | null = stamped
              let bridged = false
              if (!md) {
                try {
                  const bridgeInput = session as unknown as MethodDecisionSessionInput
                  md = deriveMethodDecisionForSession({
                    session: bridgeInput,
                    runtimeContract: null,
                    decisionContext: null,
                    trainingGoal: typeof primaryGoal === 'string' ? primaryGoal : null,
                    profileContext: bridgeProfileContext,
                  })
                  bridged = !!md
                } catch {
                  md = null
                }
              }
              if (!md) return null

              // [PHASE 4A] Strict gate: only proceed when the session has at
              // least one real materialized change. Saved programs from
              // before 4A may not have actualMaterialization on the stamp;
              // recompute from the session in that case so this gate still
              // works correctly for legacy programs.
              const am =
                md.actualMaterialization ??
                (() => {
                  try {
                    const recomputed = deriveMethodDecisionForSession({
                      session: session as unknown as MethodDecisionSessionInput,
                      runtimeContract: null,
                      decisionContext: null,
                      trainingGoal: typeof primaryGoal === 'string' ? primaryGoal : null,
                      profileContext: bridgeProfileContext,
                    })
                    return recomputed?.actualMaterialization ?? null
                  } catch {
                    return null
                  }
                })()

              if (!am || !am.hasRealStructuralChange) {
                // Honest hide: no structural change → no doctrine claim.
                return null
              }

              const profileSrc = md.profileInfluence?.source ?? 'legacyFallback'
              const profileAware = profileSrc !== 'legacyFallback'
              const isStaleProgram =
                !!stamped && (!methodDecisionVersion || methodDecisionVersion !== METHOD_DECISION_VERSION)

              // Build the visible label from REAL counts.
              const labelParts: string[] = []
              if (am.groupedMethodCounts.density_block > 0) labelParts.push('Density Block')
              if (am.groupedMethodCounts.superset > 0) labelParts.push('Superset')
              if (am.groupedMethodCounts.circuit > 0) labelParts.push('Circuit')
              if (am.rowExecutionCounts.cluster > 0) labelParts.push('Cluster Set')
              if (am.rowExecutionCounts.top_set > 0) labelParts.push('Top Set + Back-off')
              if (am.rowExecutionCounts.drop_set > 0) labelParts.push('Drop Set')
              if (am.rowExecutionCounts.rest_pause > 0) labelParts.push('Rest-pause')
              const visibleLabel = labelParts.length === 1
                ? labelParts[0]
                : labelParts.length > 1
                  ? `${labelParts.length} method${labelParts.length === 1 ? '' : 's'} applied`
                  : 'Doctrine method'

              const driverLine = md.profileInfluence?.primaryDriverLine
              const avoidedLine = md.prescriptionIntent?.whyNotOtherMethods?.[0] ?? null

              // Tag word — only sources that correspond to ACTUAL structural change.
              let tagText: string | null = null
              let tagClass = 'text-[10px] uppercase tracking-wide font-medium'
              if (bridged && am.evidenceSource === 'derived_from_session') {
                tagText = 'legacy program'
                tagClass += ' text-amber-400/80'
              } else if (isStaleProgram) {
                tagText = 'stale stamp'
                tagClass += ' text-amber-400/80'
              } else if (profileAware) {
                tagText = 'profile-driven'
                tagClass += ' text-emerald-400/90'
              }

              const isLegacyEvidence = am.evidenceSource === 'derived_from_session' && !stamped

              return (
                <div
                  className="mt-3 rounded-lg border border-[#E63946]/25 bg-[#E63946]/5 px-3 py-2.5 flex flex-col gap-1.5"
                  data-doctrine-decision="true"
                  data-method-id={md.methodId}
                  data-profile-source={profileSrc}
                  data-render-mode={am.dominantRenderMode}
                  data-grouped-block-count={am.groupedBlockCount}
                  data-changed-exercise-count={am.changedExerciseCount}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.08em] text-[#E63946]/80 font-semibold">
                      Doctrine Materialization
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-[#E63946]/40 bg-[#E63946]/10 text-[12px] font-semibold text-[#E63946]">
                      {visibleLabel}
                    </span>
                    <span className="text-[10px] text-[#6A6A6A] uppercase tracking-wide">
                      {am.changedExerciseCount} exercise{am.changedExerciseCount === 1 ? '' : 's'} changed
                    </span>
                    {tagText && <span className={tagClass}>{tagText}</span>}
                  </div>

                  {/* Concrete change-set evidence — every line cites a real count. */}
                  {am.structuralChangeDescriptions.slice(0, 3).map((line, i) => (
                    <p key={i} className="text-[12px] text-[#C8C8C8] leading-snug">
                      <span className="text-[#9A9A9A]">Applied:</span> {line}
                    </p>
                  ))}

                  {driverLine && (
                    <p className="text-[12px] text-[#A8A8A8] leading-snug">
                      <span className="text-[#7A7A7A]">Profile driver:</span> {driverLine}
                    </p>
                  )}

                  {avoidedLine && (
                    <p className="text-[12px] text-[#8A8A8A] leading-snug italic">
                      <span className="not-italic text-[#7A7A7A]">Avoided:</span> {avoidedLine}
                    </p>
                  )}

                  {isLegacyEvidence && (
                    <p className="text-[10px] text-amber-300/70 leading-snug">
                      Materialization read from legacy session fields. Regenerate to receive a freshly profile-aware doctrine stamp.
                    </p>
                  )}
                </div>
              )
            })()}

            {/* ====================================================================
                [MATERIAL-COMPOSITION-TRUTH-LOCK]
                Structural per-day programming-difference strip. Renders only
                when authoritative composition / adaptation truth is present
                on the surface — null/empty leaves legacy sessions visually
                unchanged. Three components, each guarded:
                  1. Workload split bar (primary vs support %) — varies day to
                     day based on real composition.workloadDistribution.
                  2. Material adaptation chips — only TRUE reductions actually
                     applied to this day (sets/RPE/secondary/density/finisher).
                  3. Spine expression mini-tag — direct_intensity /
                     technical_focus / strength_support classification.
                Together they make programming difference visibly STRUCTURAL,
                not descriptive. No prose added.
                ==================================================================== */}
            {cardSurface && (() => {
              const hasWorkload =
                typeof cardSurface.workloadPrimaryPercent === 'number' &&
                typeof cardSurface.workloadSupportPercent === 'number' &&
                cardSurface.workloadPrimaryPercent + cardSurface.workloadSupportPercent > 0
              const hasAdaptations = (cardSurface.materialAdaptations?.length ?? 0) > 0
              const spineLabels: Record<string, string> = {
                direct_intensity: 'Direct intensity',
                technical_focus: 'Technical focus',
                strength_support: 'Strength support',
              }
              const spineLabel = cardSurface.spineExpression
                ? spineLabels[cardSurface.spineExpression] ?? null
                : null
              const hasSpine = !!spineLabel
              if (!hasWorkload && !hasAdaptations && !hasSpine) return null
              return (
                <div className="mt-2 space-y-1.5">
                  {/* Workload split bar — structural, not prose */}
                  {hasWorkload && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-[#E63946] transition-all"
                          style={{ width: `${cardSurface.workloadPrimaryPercent}%` }}
                          aria-label={`Primary work ${cardSurface.workloadPrimaryPercent}%`}
                        />
                        <div
                          className="h-full bg-[#5A5A5A] transition-all"
                          style={{ width: `${cardSurface.workloadSupportPercent}%` }}
                          aria-label={`Support work ${cardSurface.workloadSupportPercent}%`}
                        />
                      </div>
                      <span className="text-[10px] text-[#A8A8A8] tabular-nums shrink-0">
                        {cardSurface.workloadPrimaryPercent}
                        <span className="text-[#6A6A6A]">% primary</span>
                      </span>
                    </div>
                  )}
                  {/* Material adaptation chips + spine expression tag */}
                  {(hasAdaptations || hasSpine) && (
                    <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                      {hasSpine && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E63946]/10 text-[#C8C8C8] font-medium">
                          {spineLabel}
                        </span>
                      )}
                      {cardSurface.materialAdaptations!.map((adaptation) => (
                        <span
                          key={`adapt-${adaptation.key}`}
                          className={
                            adaptation.tone === 'reduction'
                              ? 'text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300/90 font-medium'
                              : 'text-[9px] px-1.5 py-0.5 rounded bg-[#3A3A3A] text-[#B8B8B8] font-medium'
                          }
                        >
                          {adaptation.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* [DOMINANT-CARD-OWNERSHIP-LOCK] One-line per-day "why" from the
                authoritative role rationale. Demotes generic compactCoaching
                purpose for non-role-aware sessions to fallback only. */}
            {cardSurface?.weeklyRoleRationale && (
              <p className="text-[11px] text-[#8A8A8A] mt-1 leading-relaxed italic">
                {cardSurface.weeklyRoleRationale}
              </p>
            )}

            {/* =====================================================================
                [PHASE 4S] CANONICAL METHOD/DOCTRINE DELIVERY LINE
                ---------------------------------------------------------------------
                Reads `cardSurface.methodStructures` (Phase 4P) and
                `cardSurface.doctrineBlockResolution` (Phase 4Q) — the
                authoritative typed truth for what doctrine considered/applied
                on this day. Renders ONE compact line classifying the result
                so we never show a generic yellow "blocked" bubble when
                classified entries exist.

                This DOES NOT duplicate the existing visibleMethodTally chip
                row (which is gated on `finalVisibleBodyModel` / styledGroups
                — i.e. what the body will actually render when expanded). The
                Phase 4S line summarizes doctrine-level resolution counts and
                surfaces classified blocked statuses + bug-classifications
                that the chip row could not express.

                Tones (kept inside the existing palette):
                  - applied       → muted green text                    [#7FB287]
                  - blocked safety/audit → amber text                   [text-amber-300/85]
                  - bug-classification  → red diagnostic chip           [text-red-300/90]
                  - neutral classifiers → muted neutral text            [#8A8A8A]

                Suppressed entirely on legacy programs that have no Phase
                4P/4Q arrays — those keep their existing chip path.
                ===================================================================== */}
            {cardSurface && (() => {
              const methodStructures = readMethodStructuresFromSession({
                methodStructures: cardSurface.methodStructures,
              })
              const blockResolution = readDoctrineBlockResolutionFromSession({
                doctrineBlockResolution: cardSurface.doctrineBlockResolution,
              })
              if (methodStructures.length === 0 && blockResolution.length === 0) {
                return null
              }

              // Counts derived purely from the typed Phase 4Q classifier output.
              // We prefer the classifier counts over methodStructures.status
              // because the classifier is what owns the "applied vs blocked
              // for what reason" verdict the user-facing line should reflect.
              let appliedCount = 0
              let trueSafetyCount = 0
              let noTargetCount = 0
              let notRelevantCount = 0
              let needsAuditCount = 0
              const bugEntries: ReturnType<typeof normalizeDoctrineBlockStatus>[] = []
              for (const entry of blockResolution) {
                const norm = normalizeDoctrineBlockStatus(entry?.resolvedStatus)
                if (norm.isBug) {
                  bugEntries.push(norm)
                  continue
                }
                switch (entry?.resolvedStatus) {
                  case 'APPLIED':
                  case 'ALREADY_APPLIED':
                    appliedCount += 1
                    break
                  case 'TRUE_SAFETY_BLOCK':
                    trueSafetyCount += 1
                    break
                  case 'NO_RELEVANT_TARGET':
                    noTargetCount += 1
                    break
                  case 'NOT_RELEVANT_TO_SESSION':
                    notRelevantCount += 1
                    break
                  case 'UNKNOWN_NEEDS_AUDIT':
                    needsAuditCount += 1
                    break
                }
              }

              // If only methodStructures exists (e.g. Phase 4P stamped but
              // Phase 4Q rollup did not run on this saved program), derive
              // applied count from the structure status as a graceful
              // fallback. This keeps older saved programs informative.
              if (blockResolution.length === 0 && methodStructures.length > 0) {
                for (const ms of methodStructures) {
                  if (ms?.status === 'applied' || ms?.status === 'already_applied') {
                    appliedCount += 1
                  }
                }
              }

              const hasRenderableStructure = hasRenderableMethodStructure(cardSurface)
              const totalClassifiedBlocks =
                trueSafetyCount + noTargetCount + notRelevantCount + needsAuditCount
              const hasBugs = bugEntries.length > 0

              // No applied + no blocks + no bugs → nothing meaningful to say.
              // (e.g. an older session with empty arrays.)
              if (appliedCount === 0 && totalClassifiedBlocks === 0 && !hasBugs) {
                return null
              }

              const segments: string[] = []
              if (appliedCount > 0) {
                segments.push(`${appliedCount} doctrine applied`)
              }
              if (trueSafetyCount > 0) {
                segments.push(`${trueSafetyCount} blocked for safety`)
              }
              if (noTargetCount > 0) {
                segments.push(`${noTargetCount} no matching target`)
              }
              if (notRelevantCount > 0) {
                segments.push(`${notRelevantCount} not for this day`)
              }
              if (needsAuditCount > 0) {
                segments.push(`${needsAuditCount} needs audit`)
              }

              return (
                <div
                  className="mt-2 flex flex-col gap-1 text-[11px] leading-snug min-w-0"
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {/* Compact doctrine resolution summary. We deliberately do
                      not duplicate any "Superset / Circuit / Density / Cluster"
                      chip the body will render — those come from styledGroups
                      via visibleMethodTally above. This line is doctrine-level
                      truth: how many methods doctrine considered, and how
                      they classified out. Suppressed when the segments list
                      is empty AND there is no bug to surface. */}
                  {segments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="text-[#8A8A8A]">Doctrine:</span>
                      {appliedCount > 0 && (
                        <span className="text-[#7FB287]">
                          {appliedCount} applied
                        </span>
                      )}
                      {appliedCount > 0 &&
                        (trueSafetyCount > 0 ||
                          noTargetCount > 0 ||
                          notRelevantCount > 0 ||
                          needsAuditCount > 0) && (
                          <span className="text-[#5A5A5A]">·</span>
                        )}
                      {trueSafetyCount > 0 && (
                        <span className="text-amber-300/85">
                          {trueSafetyCount} blocked for safety
                        </span>
                      )}
                      {(trueSafetyCount > 0 &&
                        (noTargetCount > 0 || notRelevantCount > 0 || needsAuditCount > 0)) && (
                        <span className="text-[#5A5A5A]">·</span>
                      )}
                      {noTargetCount > 0 && (
                        <span className="text-[#8A8A8A]">
                          {noTargetCount} no target
                        </span>
                      )}
                      {(noTargetCount > 0 && (notRelevantCount > 0 || needsAuditCount > 0)) && (
                        <span className="text-[#5A5A5A]">·</span>
                      )}
                      {notRelevantCount > 0 && (
                        <span className="text-[#8A8A8A]">
                          {notRelevantCount} not for this day
                        </span>
                      )}
                      {(notRelevantCount > 0 && needsAuditCount > 0) && (
                        <span className="text-[#5A5A5A]">·</span>
                      )}
                      {needsAuditCount > 0 && (
                        <span className="text-amber-300/85">
                          {needsAuditCount} needs audit
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bug-classification surface. We do not silently hide these
                      — if doctrine ran but a connection/runtime/normalizer/
                      stale-source bug prevented its truth from reaching the
                      card, the user has a right to see WHY their session
                      doesn't reflect doctrine. The label text is one short
                      sentence pulled from `normalizeDoctrineBlockStatus`. We
                      cap the displayed list to the first 2 entries to keep
                      mobile cards compact; remaining count is summarized. */}
                  {hasBugs && (
                    <div className="flex flex-wrap items-start gap-x-1.5 gap-y-0.5">
                      <span className="text-red-300/90 font-medium">
                        Doctrine connection issue:
                      </span>
                      <span className="text-red-300/85">
                        {bugEntries
                          .slice(0, 2)
                          .map(b => b.label.replace(/^[A-Z][a-z]+ issue: /, ''))
                          .join(' · ')}
                        {bugEntries.length > 2
                          ? ` · +${bugEntries.length - 2} more`
                          : ''}
                      </span>
                    </div>
                  )}

                  {/* Method-structure existence breadcrumb. ONLY rendered when
                      the canonical Phase 4P arrays exist with at least one
                      applied entry AND the existing styledGroups chip row
                      above did not already cover it. Stays one short line —
                      no exercise lists, no rounds; the body renders the full
                      grouped block when the card is expanded. */}
                  {hasRenderableStructure && appliedCount === 0 && (
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="text-[#8A8A8A]">Method structure present</span>
                    </div>
                  )}
                </div>
              )
            })()}
            {/* [REMOVED] GROUPED_TRUTH s4/s5/s7 breadcrumb chip. Grouped days are
                now visibly recognized through the production method-summary
                chips (Superset/Circuit/Density/Cluster) and the colored grouped
                block headers inside MainExercisesRenderer, not via a debug chip. */}

            {/* [COLLAPSED-HEADER-METHOD-TRUTH] Visible grouped-method chips on
                the collapsed card header. This is the surface the user is
                actually checking on the Program page (cards open collapsed by
                default). Chip counts come from `visibleMethodTally`, which is
                a pure consumer of `finalVisibleBodyModel`; a chip renders if
                and only if the body WILL render a matching grouped header
                block when the card is expanded. If the body will not render
                a method's header (simple_order_grouped / flat_category), no
                chip appears here -- honest non-claim. Palette intentionally
                mirrors the colored block headers inside the body
                (Superset blue, Circuit emerald, Density amber, Cluster purple)
                so the collapsed chip and the in-body pill read as the same
                visual language. */}
            {hasAnyVisibleMethod && (
              // [PHASE 4T] Chip counts now read from `dominantMethodTally`,
              // which prefers canonical `cardSurface.methodStructures` over
              // legacy styledGroups when canonical truth exists. See
              // [METHOD-STRUCTURES-DOMINANCE] block above for the resolution
              // rule. Older saved programs without canonical fields fall
              // through to the legacy tally unchanged.
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {dominantMethodTally.superset > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#4F6D8A]/15 text-[#7FA8CC] border border-[#4F6D8A]/40">
                    <Layers className="w-3 h-3" />
                    {dominantMethodTally.superset} Superset{dominantMethodTally.superset > 1 ? 's' : ''}
                  </span>
                )}
                {dominantMethodTally.circuit > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                    <RefreshCw className="w-3 h-3" />
                    {dominantMethodTally.circuit} Circuit{dominantMethodTally.circuit > 1 ? 's' : ''}
                  </span>
                )}
                {dominantMethodTally.density > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/40">
                    <Timer className="w-3 h-3" />
                    {densityChipLabel(dominantMethodTally.density)}
                  </span>
                )}
                {dominantMethodTally.cluster > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/40">
                    <Dumbbell className="w-3 h-3" />
                    {clusterChipLabel(dominantMethodTally.cluster)}
                  </span>
                )}
              </div>
            )}

            {/* ==========================================================================
                [CARD-LOCAL-GROUPED-MISMATCH-PROBE]
                [FINAL-VISIBLE-OWNERSHIP-LOCK] Diagnostic strip moved off the
                athlete-facing card surface. Gated behind the existing
                `probeActive` flag (hard-disabled in production by the prior
                [PROBES-HARD-DISABLED] phase). The bucket classifier remains
                intact for QA without leaking debug-style amber font-mono
                content into the production card body.
                ========================================================================== */}
            {probeActive &&
              rawGroupedOwnership.hasGroupedTruth &&
              finalVisibleBodyModel.mode === 'flat_category' && (() => {
                const visibleWithBlockId = fullVisibleExercises.filter(
                  ex => typeof (ex as unknown as { blockId?: string }).blockId === 'string' &&
                    !!(ex as unknown as { blockId?: string }).blockId
                ).length
                const visibleWithNonStraightMethod = fullVisibleExercises.filter(ex => {
                  const m = (ex as unknown as { method?: string }).method
                  return typeof m === 'string' && m.length > 0 && m !== 'straight' && m !== 'straight_sets'
                }).length
                const rawWithBlockId = safeExercises.filter(
                  ex => typeof (ex as unknown as { blockId?: string }).blockId === 'string' &&
                    !!(ex as unknown as { blockId?: string }).blockId
                ).length
                const rawWithNonStraightMethod = safeExercises.filter(ex => {
                  const m = (ex as unknown as { method?: string }).method
                  return typeof m === 'string' && m.length > 0 && m !== 'straight' && m !== 'straight_sets'
                }).length
                // ====================================================================
                // [BUCKET-CLASSIFIER] One of six allowed buckets. Strictest-first
                // ordering so the bucket reflects the FIRST stage where truth was
                // lost or bypassed for this exact card instance.
                //   1. LOST_IN_VISIBLE_ROW_SURFACE     -- raw has grouped fields,
                //                                         visible row surface does not
                //   2. LOST_IN_VARIANT_PRUNE           -- visible rows kept method,
                //                                         but variantPrune stripped
                //                                         styledGroups to all-straight
                //   3. LOST_IN_CARD_CONTRACT_MERGE    -- display lost grouped,
                //                                         raw kept it, merge should
                //                                         have rescued but didn't
                //   4. LOST_IN_FINAL_VISIBLE_BODY_DECISION -- contract has grouped
                //                                         truth, but dispatcher
                //                                         still routed to flat
                //   5. PRESENT_BUT_NOT_RENDERED_BY_CARD_UI -- model has blocks,
                //                                         body picked flat anyway
                //   6. NO_REAL_GROUPED_TRUTH_FOR_THIS_SESSION -- raw said grouped
                //                                         but no renderable members
                // ====================================================================
                let bucket: string
                if (rawGroupedOwnership.rawFallbackBlocks.length === 0 &&
                    rawGroupedOwnership.renderBlocks.length === 0) {
                  bucket = 'NO_REAL_GROUPED_TRUTH_FOR_THIS_SESSION'
                } else if (rawWithNonStraightMethod > 0 && visibleWithNonStraightMethod === 0) {
                  bucket = 'LOST_IN_VISIBLE_ROW_SURFACE'
                } else if (
                  (sessionStyleMetadata?.styledGroups?.some(g => g.groupType !== 'straight') ?? false) &&
                  !(variantPrunedStyleMetadata?.styledGroups?.some(g => g.groupType !== 'straight') ?? false)
                ) {
                  bucket = 'LOST_IN_VARIANT_PRUNE'
                } else if (!groupedRenderContract.hasGroupedTruth) {
                  bucket = 'LOST_IN_CARD_CONTRACT_MERGE'
                } else if (groupedRenderContract.rawFallbackBlocks.length === 0 &&
                           synthesizedRawFallbackBlocks.length === 0 &&
                           !groupedRenderContract.hasRichRenderableGroups) {
                  bucket = 'LOST_IN_FINAL_VISIBLE_BODY_DECISION'
                } else {
                  bucket = 'PRESENT_BUT_NOT_RENDERED_BY_CARD_UI'
                }
                return (
                  <div
                    role="note"
                    aria-label="Card grouped-truth mismatch probe"
                    className="mt-2 rounded border border-amber-500/50 bg-amber-500/[0.08] px-2 py-1 font-mono text-[10px] leading-tight text-amber-200"
                  >
                    <div className="font-semibold text-amber-100">
                      CARD_GROUPED_MISMATCH · day {session.dayNumber}
                    </div>
                    <div className="text-amber-200/90">
                      raw_grouped_truth: YES · display_grouped_truth: {displayGroupedRendering.hasGroupedTruth ? 'YES' : 'NO'} · final_body_mode: <span className="text-amber-100">{finalVisibleBodyModel.mode}</span>
                    </div>
                    <div className="text-amber-200/80">
                      raw_exs_with_blockId: {rawWithBlockId} · raw_exs_with_method: {rawWithNonStraightMethod} · visible_exs_with_blockId: {visibleWithBlockId} · visible_exs_with_method: {visibleWithNonStraightMethod}
                    </div>
                    <div className="text-amber-200/80">
                      contract.renderBlocks: {groupedRenderContract.renderBlocks.length} · contract.rawFallbackBlocks: {groupedRenderContract.rawFallbackBlocks.length} · synthesized: {synthesizedRawFallbackBlocks.length}
                    </div>
                    <div className="mt-0.5 text-amber-100 font-semibold">
                      bucket: {bucket}
                    </div>
                  </div>
                )
              })()}

            {/* [DOCTRINE-STRENGTHENING] Week-specific character badges */}
            {weekCharacter && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {/* Intensity cap badge */}
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  weekCharacter.sessionIntensityCap <= 7
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : weekCharacter.sessionIntensityCap >= 9
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  RPE ≤{weekCharacter.sessionIntensityCap}
                </span>
                
                {/* Skill exposure badge */}
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  weekCharacter.skillExposureLevel === 'conservative'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : weekCharacter.skillExposureLevel === 'full'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {weekCharacter.skillExposureLevel === 'conservative' && 'Conservative'}
                  {weekCharacter.skillExposureLevel === 'moderate' && 'Building'}
                  {weekCharacter.skillExposureLevel === 'full' && 'Full Exposure'}
                </span>
                
                {/* Density badge - only show if blocked or explicitly allowed */}
                {!weekCharacter.densityAllowed && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    No Density
                  </span>
                )}
                
                {/* Finishers badge - only show if blocked */}
                {!weekCharacter.finishersAllowed && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                    No Finishers
                  </span>
                )}
                
                {/* Peak week indicator */}
                {weekCharacter.phaseLabel === 'peak' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    <Zap className="w-2.5 h-2.5" />
                    Peak Week
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-[#6A6A6A]">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Session Header - Shows during active workout */}
      {(isActive || isPaused) && (
        <SessionHeader
          status={status}
          formattedDuration={formattedDuration}
          stats={stats}
          onPause={pauseSession}
          onResume={resumeSession}
          onFinish={handleFinishRequest}
        />
      )}

      {/* Paused Overlay */}
      {isPaused && (
        <PausedOverlay
          formattedDuration={formattedDuration}
          stats={stats}
          onResume={resumeSession}
          onFinish={handleFinishRequest}
        />
      )}

      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
        <FinishConfirmation
          stats={stats}
          onConfirm={handleFinishConfirm}
          onCancel={() => setShowFinishConfirm(false)}
        />
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* ==========================================================================
              [OUTER-BODY-DISPATCH] Single consumer of `chosenOuterBodyMode`.
              Priority enforced: GROUPED_PROGRAM_BODY wins over completed / active /
              paused for any card whose contract reports grouped truth. Both
              GROUPED_PROGRAM_BODY and NORMAL_EXPANDED_BODY render the same real
              production body; `MainExercisesRenderer` inside that body performs
              the grouped-vs-flat internal dispatch via its `rawFallbackBlocks`
              path, so grouped-eligible cards visibly render grouped structure.
              ========================================================================== */}
          {chosenOuterBodyMode === 'COMPLETED_SUMMARY' ? (
            <WorkoutSessionSummary
              stats={stats}
              completedSets={completedSets}
              sessionName={session.dayLabel}
              onSave={saveSession}
              onReturnToDashboard={handleReturnToDashboard}
              onReturnToProgram={handleReturnToProgram}
            />
          ) : chosenOuterBodyMode === 'ACTIVE_WORKOUT_CARD' ? (
            /* [workout-route] UNIFIED: Active workouts now route to /workout/session */
            <WorkoutExecutionCard
              session={session}
              onComplete={handleWorkoutComplete}
              onCancel={handleWorkoutCancel}
              sessionState={workoutSession}
            />
          ) : (
            /* =====================================================================
               [SHARED PRODUCTION BODY] Rendered for BOTH `GROUPED_PROGRAM_BODY`
               and `NORMAL_EXPANDED_BODY`. Grouped-vs-flat rendering is delegated
               to `MainExercisesRenderer` (which uses the single authoritative
               grouped render contract). No parallel grouped UI path exists; one
               owner drives the visible body.
               ===================================================================== */
            <>
              {/* [REMOVED] Tiny mode/grouped diagnostic chip. Grouped branch
                  ownership is still enforced by `chosenOuterBodyMode` above
                  (GROUPED_PROGRAM_BODY wins over COMPLETED / ACTIVE whenever
                  grouped truth exists), but the visible chip is no longer
                  needed; grouped days are recognized through real production
                  UI (method chips + colored grouped block headers). */}
              {/* =================================================================
                  [SESSION-PRESCRIPTION-SURFACE] PRESCRIPTION-FIRST COMPACT VIEW
                  Primary display: actual routine. Secondary: AI explanation.
                  ================================================================= */}
              {/* Start Button - Primary Action (above detailed workout) */}
              <div className="mb-4">
                {/* [SELECTED-SESSION-CONTRACT-PROOF] Launch-proof strip.
                    [FINAL-VISIBLE-OWNERSHIP-LOCK] No longer renders in the
                    athlete-facing card surface. The strip is preserved behind
                    the existing `probeActive` flag (hard-disabled in
                    production by the prior [PROBES-HARD-DISABLED] phase) so
                    QA can still verify selected-variant ↔ visible-body parity.
                    Athletes never see the `idx / mode / label / min / raw /
                    vis / trim / body` mono-spaced debug row above the Start
                    Workout button.

                    CORRIDOR token semantics (probe-only):
                      OK / OK_FULL / MISMATCH — see selected-variant contract. */}
                {probeActive && (() => {
                  const idx = selectedSessionContract.selectedVariantIndex
                  const rawCount = safeExercises.length
                  const visCount = fullVisibleExercises.length
                  const trim = Math.max(0, rawCount - visCount)
                  const fullMin = typeof session.estimatedMinutes === 'number'
                    ? session.estimatedMinutes
                    : null
                  const selMin = typeof selectedSessionContract.selectedEstimatedMinutes === 'number'
                    ? selectedSessionContract.selectedEstimatedMinutes
                    : null
                  const durationDiffers = fullMin !== null && selMin !== null && selMin !== fullMin
                  let corridor: 'OK' | 'OK_FULL' | 'MISMATCH' = 'OK_FULL'
                  if (idx > 0) {
                    corridor = (trim > 0 || durationDiffers) ? 'OK' : 'MISMATCH'
                  }
                  return (
                    <div className="mb-2 rounded-md border border-[#4F6D8A]/40 bg-[#12161C] px-2 py-1.5 text-[10px] font-mono text-[#7FA8CC] leading-tight">
                      <div className="text-[#A4ACB8] uppercase tracking-wider text-[9px] mb-0.5 flex items-center gap-2">
                        <span>Launch proof</span>
                        <span
                          className={
                            corridor === 'MISMATCH'
                              ? 'rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1'
                              : 'rounded-sm bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1'
                          }
                        >
                          CORRIDOR:{corridor}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>idx={idx}</span>
                        <span>mode={selectedSessionContract.selectedExecutionMode}</span>
                        <span>label={selectedSessionContract.selectedVariantLabel}</span>
                        <span>min={selectedSessionContract.selectedEstimatedMinutes}</span>
                        <span>raw={rawCount}</span>
                        <span>vis={visCount}</span>
                        <span>trim={trim}</span>
                        <span>body={finalVisibleBodyModel.mode}</span>
                        {/* [PHASE 4U] Canonical body-render proof token. Reads
                            the pure resolver verdict computed above. Format:
                              canon=<source>/<status>[:bodyMatch]
                            Examples:
                              canon=canonical_method_structures/complete:1
                              canon=styled_groups_fallback/fallback
                              canon=ungrouped_fallback/empty
                            When the verdict is canonical/complete with
                            bodyMatch=1 the visible blocks are proven backed
                            by canonical methodStructures. */}
                        <span>
                          canon={canonicalBodyRenderResolution.source}/{canonicalBodyRenderResolution.status}
                          {canonicalBodyRenderResolution.bodyBlocksMatchCanonical !== null
                            ? `:${canonicalBodyRenderResolution.bodyBlocksMatchCanonical ? '1' : '0'}`
                            : ''}
                        </span>
                      </div>
                    </div>
                  )
                })()}
                <Button
                  onClick={handleStartWorkout}
                  className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2 h-10"
                >
                  <Play className="w-4 h-4" />
                  Start Workout
                </Button>
              </div>

          {/* [REMOVED] SESSION TRUTH PROBE (dev only) dump. Debug-era diagnostic
              panel that printed raw style-metadata, variant state, render
              decisions, and verdict strings. No replacement UI is needed; the
              grouped render contract already drives the production method chips
              and grouped block headers below. */}

          {/* [TASK 4] Time Variants - Improved toggle behavior
              - Full Session = null or 0 (explicitly reset to full)
              - 45 Min = idx of 45-minute variant
              - 30 Min = idx of 30-minute variant
              - Clicking Full Session explicitly resets to null for canonical full behavior

              [VARIANT-LAUNCHABILITY-CONTRACT] Buttons render ONLY for variants
              that pass the canonical validity gate (`isVariantLaunchable`). A
              variant whose `selection.main` is empty, missing, or contains
              unusable rows will not render a tab here -- even if the
              variant object itself exists and carries a duration/label. This
              means 45 / 30 controls now match true launchability: if a 45 or
              30 variant cannot be honestly materialized by the live-workout
              route, it simply disappears from the toggle row instead of
              presenting a button that would silently fall back to Full. The
              underlying `selectedVariant` state still indexes the full
              `session.variants` array so the launch URL's `variant=idx`
              param lines up with what the route will read after session
              load (the engine now never emits hollow variants, so indices
              are dense). */}
          {session.variants && session.variants.filter(v => isVariantLaunchable(v)).length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-[#6A6A6A] self-center mr-1">Session length:</span>
              {session.variants.map((variant, idx) => {
                // [VARIANT-LAUNCHABILITY-CONTRACT] Skip non-launchable entries
                // without touching indices -- the idx we emit here must match
                // the idx in `session.variants` so the launch URL and route
                // post-load lookup agree.
                if (!isVariantLaunchable(variant)) {
                  console.warn('[VARIANT-LAUNCHABILITY-CONTRACT] Hiding non-launchable variant button', {
                    sessionDay: session.dayNumber,
                    idx,
                    variantLabel: variant?.label,
                    variantDuration: variant?.duration,
                    mainCount: Array.isArray(variant?.selection?.main) ? variant.selection.main.length : 'not_array',
                  })
                  return null
                }
                // [TASK 4] Determine if this variant is the active selection
                const isActive = selectedVariant === idx || (selectedVariant === null && idx === 0)
                
                return (
                  <Button
                    key={`${variant.duration}-${variant.label}`}
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    className={
                      isActive
                        ? 'bg-[#E63946] hover:bg-[#D62828] text-xs h-7'
                        : 'border-[#3A3A3A] text-xs h-7'
                    }
                    onClick={() => {
                      // [TASK 4] Explicitly handle Full Session as null for canonical reset
                      const newVariant = idx === 0 ? null : idx
                      console.log('[variant-selection]', {
                        sessionDay: session.dayNumber,
                        previousVariant: selectedVariant,
                        newVariant,
                        variantLabel: variant.label,
                        variantDuration: variant.duration,
                      })
                      setSelectedVariant(newVariant)
                    }}
                  >
                    {variant.label}
                  </Button>
                )
              })}
            </div>
          )}

          {/* Warmup Toggle */}
          <div>
            <button
              className="flex items-center gap-2 text-sm text-[#6A6A6A] hover:text-[#A5A5A5] transition-colors"
              onClick={() => setShowWarmup(!showWarmup)}
            >
              {showWarmup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Warm-Up
              <span className="text-xs text-[#4F6D8A]">({session.warmup.length} exercises)</span>
            </button>
            {showWarmup && (
              <div className="mt-2 space-y-2">
                {/* [WARM-UP-STRUCTURE-CONTRACT] Prior intended warm-up surface: the
                    structure-explanation KnowledgeBubble ("Joint protocols appear in
                    warm-up to prepare specific areas for main work.") sits ABOVE the
                    selectionReason italic and the per-exercise rows. Removing it was
                    a regression; this block restores the earlier contract exactly. */}
                <StructureKnowledgeBubble structureType="protocol_warmup" />
                {/* [TRUTH-ENFORCEMENT] selectionReason is authoritative builder output - safe direct access */}
                {session.warmup[0]?.selectionReason && (
                  <p className="text-xs text-[#6A6A6A] italic pl-2 border-l-2 border-[#4F6D8A]/30">
                    {session.warmup[0].selectionReason}
                  </p>
                )}
                {session.warmup.map((exercise, idx) => (
                  <ExerciseRow key={idx} exercise={exercise} isWarmupCooldown />
                ))}
              </div>
            )}
          </div>

{/* =========================================================================
    [CARD-TRUTH-STATUS-LINE] Authoritative card-local display kind status.
    Resolves the session to exactly one of three explicit states so the
    user never has to infer from chips or scanner whether the body is
    supposed to paint grouped structure:
      1. grouped_blocks  -> body will render renderable grouped block(s)
      2. method_only     -> body stays flat with row-level method cues
      3. flat            -> honestly flat, no status line rendered
    Reads `finalVisibleBodyModel.mode` directly (same contract the body
    renderer consumes), so chip row, body, and status line can never
    disagree.
    ========================================================================= */}
{(() => {
  const mode = finalVisibleBodyModel.mode
  // `simple_order_grouped` now only fires from the dispatcher when
  // `hasRenderableGroupedBlockStructure === true` (multi-member styled
  // group OR multi-member blockId methods) AND synthesis produced no
  // block list -- i.e. the grouped-block truth-lost failure case. That
  // still counts as grouped_blocks for the status line because the body
  // will render a grouped banner + failure-stage surface.
  const isGroupedBlocks =
    mode === 'rich_grouped' ||
    mode === 'raw_grouped_fallback' ||
    mode === 'simple_order_grouped'
  // Method cues: any non-straight method on any row, NOT counted as a block.
  // [SET-EXECUTION-TRUTH-STATUS] Read `setExecutionMethod` FIRST then fall back
  // to legacy `.method`. Without this, a session whose only non-straight signal
  // is a single-row `setExecutionMethod='cluster'` would show "No method cues"
  // in the status line even though the builder applied cluster set-execution.
  let hasAnyNonStraightMethod = false
  const methodSet = new Set<string>()
  // [SELECTED-SESSION-CONTRACT] Method cues are now detected from the
  // variant-narrowed visible exercise list (`fullVisibleExercises`), NOT from
  // raw `safeExercises`. Previously this loop iterated raw safeExercises, so
  // when the user selected 45 Min / 30 Min the status line kept reporting the
  // FULL session's method cues even though the body below had been trimmed to
  // the variant's smaller set. That was the exact "status line and body
  // disagree" split the corridor lock is removing. `fullVisibleExercises`
  // carries `method` + `blockId` through `buildFullVisibleRoutineExercises`
  // for every surviving row, so iterating it produces cues that match the
  // variant truth one-for-one.
  for (const ex of fullVisibleExercises) {
    const e = ex as unknown as { method?: string; setExecutionMethod?: string }
    const se = (e.setExecutionMethod || '').toLowerCase()
    const mm = (e.method || '').toLowerCase()
    const raw =
      se && se !== 'straight' && se !== 'straight_sets'
        ? se
        : (mm && mm !== 'straight' && mm !== 'straight_sets' ? mm : '')
    if (!raw) continue
    hasAnyNonStraightMethod = true
    if (raw === 'superset') methodSet.add('superset')
    else if (raw === 'circuit' || raw === 'circuits') methodSet.add('circuit')
    else if (raw === 'cluster' || raw === 'cluster_set' || raw === 'cluster_sets') methodSet.add('cluster')
    else if (raw === 'density' || raw === 'density_block') methodSet.add('density')
    else methodSet.add(raw)
  }
  const isMethodOnly = !isGroupedBlocks && hasAnyNonStraightMethod
  if (!isGroupedBlocks && !isMethodOnly) return null
  if (isGroupedBlocks) {
    // Per-type counts come from the same finalVisibleBodyModel the body
    // paints, so counts match exactly what the user is about to see below.
    const tokens: string[] = []
    const s = finalVisibleBodyModel.supersetCount
    const c = finalVisibleBodyModel.circuitCount
    const d = finalVisibleBodyModel.densityCount
    const cl = finalVisibleBodyModel.clusterCount
    if (s > 0) tokens.push(`${s} Superset${s > 1 ? 's' : ''}`)
    if (c > 0) tokens.push(`${c} Circuit${c > 1 ? 's' : ''}`)
    if (d > 0) tokens.push(`${d} Density Block${d > 1 ? 's' : ''}`)
    if (cl > 0) tokens.push(`${cl} Cluster${cl > 1 ? 's' : ''}`)
    const summary = tokens.length > 0 ? tokens.join(' · ') : 'grouped'
    return (
      <div className="mb-2 flex items-center gap-2 rounded-md border border-[#4F6D8A]/40 bg-[#4F6D8A]/10 px-3 py-1.5 text-xs text-[#7FA8CC]">
        <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Grouped structure:</span> {summary}
        </span>
      </div>
    )
  }
  // Method-only -- body stays flat, tell the user what methods are present.
  // [STATUS-LINE-LABEL-NORMALIZATION] Labels here MUST match the method-only
  // chip wording above (Cluster / Density row) and avoid grouped structural
  // nouns (Cluster Set / Density Block) because the body is flat -- no
  // grouped block is being painted. Keeps the three surfaces (status line,
  // collapsed chip, in-body headline) reading as one honest vocabulary.
  const prettyMethod = (m: string) =>
    m === 'superset' ? 'Superset'
      : m === 'circuit' ? 'Circuit'
        : m === 'density' ? 'Density'
          : m === 'cluster' ? 'Cluster'
            : m.charAt(0).toUpperCase() + m.slice(1).replace(/_/g, ' ')
  const methodList = Array.from(methodSet).map(prettyMethod).join(', ')
  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border border-[#3A3A3A] bg-[#1A1A1A] px-3 py-1.5 text-xs text-[#A5A5A5]">
      <Dumbbell className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        <span className="font-semibold text-[#C5C5C5]">Method cues present:</span> {methodList}
      </span>
    </div>
  )
})()}

{/* =========================================================================
    [GROUPED-METHOD-SUMMARY] Visible session methodology indicator
    Uses the unified display adapter for consistent grouped truth consumption
    ========================================================================= */}
{hasAnyVisibleMethod && (
  // [COLLAPSED-HEADER-METHOD-TRUTH] Expanded chip row now consumes the SAME
  // `visibleMethodTally` as the collapsed header, locked to
  // `finalVisibleBodyModel`. Prior behavior gated on `hasRenderableGroups`
  // alone (rich path only) and used `groupedRenderContract` counts, which
  // under-claimed for `raw_grouped_fallback` sessions whose body DID paint
  // grouped Cluster/Density headers but whose rich counts were zero. Now
  // chip and body are structurally locked: a chip appears iff the body will
  // paint a matching grouped header. Palette mirrors the in-body block
  // headers (Superset blue, Circuit emerald, Density amber, Cluster purple)
  // so chip colors read as the same visual language as the body.
  // [PHASE 4T] Expanded chip row also reads from `dominantMethodTally`. The
  // collapsed chip strip and this expanded row must agree, and both must
  // honor canonical methodStructures over legacy styledGroups when canonical
  // is present. See [METHOD-STRUCTURES-DOMINANCE] for the resolution rule.
  <div className="mb-3 flex flex-wrap items-center gap-2">
    {dominantMethodTally.superset > 0 && (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#4F6D8A]/15 text-[#7FA8CC] border border-[#4F6D8A]/40">
        <Layers className="w-3.5 h-3.5" />
        {dominantMethodTally.superset} Superset{dominantMethodTally.superset > 1 ? 's' : ''}
      </span>
    )}
    {dominantMethodTally.circuit > 0 && (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
        <RefreshCw className="w-3.5 h-3.5" />
        {dominantMethodTally.circuit} Circuit{dominantMethodTally.circuit > 1 ? 's' : ''}
      </span>
    )}
    {dominantMethodTally.density > 0 && (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/40">
        <Timer className="w-3.5 h-3.5" />
        {densityChipLabel(dominantMethodTally.density)}
      </span>
    )}
    {dominantMethodTally.cluster > 0 && (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/40">
        <Dumbbell className="w-3.5 h-3.5" />
        {clusterChipLabel(dominantMethodTally.cluster)}
      </span>
    )}
  </div>
)}

{/* [PHASE 4F — DISPLAY PROJECTION OWNERSHIP LOCK]
    Per-session doctrine causal line, rendered INSIDE the card body (not in
    a wrapper strip) so the user can tell, for THIS specific session,
    whether doctrine actually changed the top exercise pick — answered from
    the page-built read-only projection sourced from
    `program.doctrineCausalChallenge.sessionDiffs[]` (Phase 4E).

    Honest-display contract:
      * Renders nothing when no projection slice is available (older saved
        programs, or sessions for which Phase 4E recorded no audit).
      * Emerald + summary copy when `materialChanged === true`. The summary
        names the post-doctrine top winner (and pre-doctrine alternative
        when known). Never claimed without `topCandidateChanged === true`.
      * Zinc + honest no-change reason when doctrine evaluated this session
        but did not change its top winner. Reason text is mapped from the
        per-session verdict, never derived from rule/source counts.
      * Amber when doctrine did not run or had no rules matching this
        session — signals an upstream condition the user should know about.
    No proof labels. No selected-rule counts. No source counts.

    [PHASE 4T — DOCTRINE-CAUSAL-DEMOTION] When the canonical Phase 4Q
    `doctrineBlockResolution` array exists on this card's surface, the
    classified Phase 4S delivery line directly above this banner already
    owns the doctrine narrative. Showing the legacy "Doctrine not applied
    to this session" / "Doctrine evaluated this session" amber/zinc
    pill on top of a classified line that says "Doctrine: 2 applied" is
    the contradiction Phase 4S surfaced. This guard suppresses the
    legacy banner whenever classified resolution exists. The single
    exception is `materialChanged === true`: that conveys top-pick
    causal evidence (which exercise won) the classified line does not,
    so we keep the emerald summary chip when classified resolution
    confirms doctrine engagement. Older saved programs without
    `doctrineBlockResolution` still see the full legacy banner so we
    do not regress non-Phase-4Q histories. */}
{displayProjectionSession?.doctrineCausalDisplay?.available &&
  // [PHASE 4T] Suppress when canonical classified resolution exists, except
  // for the emerald `materialChanged` chip which carries unique top-pick
  // causal evidence the classified line does not duplicate.
  (!hasClassifiedDoctrineResolution(cardSurface) ||
    !!displayProjectionSession.doctrineCausalDisplay.materialChanged) ? (
  (() => {
    const cd = displayProjectionSession.doctrineCausalDisplay
    if (cd.materialChanged && cd.summary) {
      return (
        <div
          role="status"
          aria-live="polite"
          data-phase4f-causal="changed"
          className="mt-2 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2 max-w-full min-w-0 overflow-hidden"
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400/90" aria-hidden />
          <span className="text-[12px] font-medium text-emerald-200 shrink-0">
            Doctrine changed this session
          </span>
          <span className="text-[12px] text-emerald-200/70 break-words [overflow-wrap:anywhere] min-w-0">
            {cd.summary}
          </span>
        </div>
      )
    }
    if (
      cd.noChangeReason === 'doctrine_no_matching_rules' ||
      cd.noChangeReason === 'doctrine_cache_empty' ||
      cd.noChangeReason === 'doctrine_did_not_run'
    ) {
      return (
        <div
          role="status"
          aria-live="polite"
          data-phase4f-causal="not-applicable"
          className="mt-2 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-amber-500/30 bg-amber-500/[0.05] px-3 py-2 max-w-full min-w-0 overflow-hidden"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400/90" aria-hidden />
          <span className="text-[12px] font-medium text-amber-200 shrink-0">
            Doctrine not applied to this session
          </span>
          <span className="text-[12px] text-amber-200/70 break-words [overflow-wrap:anywhere] min-w-0">
            {cd.summary || 'See top-of-page line for details'}
          </span>
        </div>
      )
    }
    // doctrine_evaluated_base_won OR doctrine_top3_changed_top1_did_not
    return (
      <div
        role="status"
        aria-live="polite"
        data-phase4f-causal="evaluated-no-change"
        className="mt-2 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-zinc-700/40 bg-zinc-900/40 px-3 py-2 max-w-full min-w-0 overflow-hidden"
      >
        <MinusCircle className="w-3.5 h-3.5 shrink-0 text-zinc-400/80" aria-hidden />
        <span className="text-[12px] font-medium text-zinc-300 shrink-0">
          Doctrine evaluated this session
        </span>
        <span className="text-[12px] text-zinc-400/80 break-words [overflow-wrap:anywhere] min-w-0">
          {cd.summary || 'Base ranking already optimal — no exercise change'}
        </span>
      </div>
    )
  })()
) : null}

{/* Main Exercises - [FULL-VISIBLE-ROUTINE] Uses full routine truth, not narrowed displayExercises */}
<MainExercisesRenderer
  session={session}
  displayExercises={fullVisibleExercises}
  sessionId={sessionId}
  skippedExercises={skippedExercises}
  adjustedExercises={adjustedExercises}
  primaryGoal={primaryGoal}
  sessionEvidence={sessionEvidence}
  coachingExplanation={coachingExplanation}
  onReplace={handleExerciseReplace}
  onSkip={handleExerciseSkip}
  onProgressionAdjust={handleProgressionAdjust}
  showProbe={probeActive}
  forceProbe={probeActive}
  cardInstanceId={cardInstanceId}
  // [FINAL-VISIBLE-BODY-MODEL] Pass the SINGLE authoritative visible-body
  // model. The renderer dispatches STRICTLY on `finalVisibleBodyModel.mode`
  // and consumes ONLY the block lists carried by that model for grouped
  // modes; it does not re-derive grouped-vs-flat from parallel booleans.
  // `groupedRenderContract` is still passed for grouped-block hydration
  // (group.exercises metadata, blockId lookups) but it CANNOT change the
  // branch the renderer takes.
  finalVisibleBodyModel={finalVisibleBodyModel}
  groupedRenderContract={groupedRenderContract}
  />

          {/* [METHOD-DECISIONS-DISCLOSURE] Clean athlete-facing explanation of structure choices.
              [SINGLE-BODY-OWNER] Applied methods MUST derive from the SAME authoritative
              pruned grouped contract (`groupedRenderContract`) that owns the card body,
              not from raw `session.styleMetadata.styledGroups`. Prior behavior: the
              disclosure read raw styledGroups unfiltered, so on variant-prune / partial-
              validity / identity-drift cases the body rendered honestly flat via
              `finalVisibleBodyModel.mode === 'flat_category'` while this surface still
              announced "Supersets applied" + "Today's structure: supersets applied to
              accessory work". That was a parallel flat/grouped-overclaim corridor
              visually winning over the body. Now the disclosure consumes the exact same
              pruned grouped truth the body consumes, so chip/summary and body can never
              disagree for the same rendered card instance. */}
          {(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const styleMeta: any = (session as any).styleMetadata
            if (!styleMeta) return null
            const userSelected: string[] = styleMeta.methodIntentContract?.userPreferences || []
            // Only surface grouped-corridor methods; top_set/drop_set are per-exercise, not this corridor
            const groupedCorridor = ['supersets', 'circuits', 'density_blocks', 'cluster_sets']
            const userSelectedGrouped = userSelected.filter((m: string) => groupedCorridor.includes(m))

            // =================================================================
            // [SINGLE-BODY-OWNER] Derive `applied` from the authoritative pruned
            // grouped render contract (same object that drives the production
            // chip row AND `finalVisibleBodyModel` AND MainExercisesRenderer).
            // Not from raw session.styleMetadata.styledGroups, which is the
            // pre-prune, pre-partial-validity list and overclaims grouped
            // structure for variant-pruned / drift-dropped cards whose actual
            // body renders flat_category.
            // =================================================================
            const groupTypeToMethod: Record<string, string> = {
              'superset': 'supersets',
              'circuit': 'circuits',
              'density_block': 'density_blocks',
              'cluster': 'cluster_sets',
            }

            // Build applied array from the SAME pruned grouped truth the body
            // consumes. `groupedRenderContract.groups` is the post-prune,
            // post-partial-validity list (only non-straight groups with enough
            // resolved members to still be meaningful as their method). This is
            // the single body-owner source.
            const applied: string[] = [...new Set(
              groupedRenderContract.groups
                .filter(g => g.groupType !== 'straight')
                .map(g => groupTypeToMethod[g.groupType])
                .filter((m): m is string => !!m && groupedCorridor.includes(m))
            )]
            
            // Build rejected array: methods user selected that did NOT materialize in final groups
            const intentApplied: string[] = (styleMeta.appliedMethods || []).filter((m: string) => groupedCorridor.includes(m))
            const falsePositiveApplied = intentApplied.filter(m => !applied.includes(m))
            
            // Start with explicit rejected methods from builder
            const builderRejected: Array<{ method: string; reason: string }> = (styleMeta.rejectedMethods || [])
              .filter((r: unknown): r is { method: string; reason: string } =>
                !!r && typeof r === 'object' && 'method' in r && 'reason' in r && groupedCorridor.includes((r as { method: string }).method))
              // De-duplicate by method, keeping the first (most specific) reason
              .filter((r, idx, arr) => arr.findIndex((x) => x.method === r.method) === idx)
            
            // [TRUTH-CONTRACT] Add false-positive "applied" methods to rejected with honest reason
            // These are methods that upstream intent marked as applied, but no actual grouped blocks exist
            const falsePositiveRejected: Array<{ method: string; reason: string }> = falsePositiveApplied
              .filter(m => !builderRejected.some(r => r.method === m))
              .map(m => ({
                method: m,
                reason: 'No eligible exercise pairs found for grouping in final session structure.'
              }))
            
            // Combine builder rejected + false-positive rejected
            const rejected = [...builderRejected, ...falsePositiveRejected]

            // Nothing meaningful to say? Don't render the surface.
            if (userSelectedGrouped.length === 0 && applied.length === 0) return null

            const methodLabel = (m: string): string => {
              switch (m) {
                case 'supersets': return 'Supersets'
                case 'circuits': return 'Circuits'
                case 'density_blocks': return 'Density blocks'
                case 'cluster_sets': return 'Cluster sets'
                default: return m
              }
            }

            // [SINGLE-BODY-OWNER] Summary narrative MUST match what the body
            // renders. `applied` already reflects the authoritative pruned
            // grouped contract; `styleMeta.primaryStyle` is pre-prune and is
            // NOT consulted here -- using it would let the narrative claim
            // "Supersets applied to accessory work" for a body that renders
            // honestly flat after variant prune / partial-validity drop.
            let appliedSummary = ''
            if (applied.length === 0) {
              appliedSummary = 'Straight sets today — today\'s composition favors focused quality over grouping.'
            } else if (applied.includes('supersets')) {
              appliedSummary = 'Supersets applied to accessory work to save time without compromising the main quality exposure.'
            } else if (applied.includes('circuits')) {
              appliedSummary = 'Circuits applied to the accessory tail for conditioning density.'
            } else if (applied.includes('cluster_sets')) {
              appliedSummary = 'Cluster sets applied to preserve output on heavy or skill work.'
            } else if (applied.includes('density_blocks')) {
              appliedSummary = 'Density block applied to the accessory tail to build work capacity.'
            }

            return (
              <div className="mt-4 border-t border-[#2A2A2A] pt-3">
                <button
                  className="flex items-center gap-2 text-xs text-[#8A8A8A] hover:text-[#C5C5C5] transition-colors w-full"
                  onClick={() => setShowMethodDecisions(!showMethodDecisions)}
                  aria-expanded={showMethodDecisions}
                >
                  {showMethodDecisions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span className="font-medium">Method decisions</span>
                  <span className="text-[10px] text-[#6A6A6A] ml-auto">
                    {applied.length > 0 ? `${applied.length} applied` : 'Straight sets'}
                    {rejected.length > 0 && ` · ${rejected.length} not used`}
                  </span>
                </button>

                {showMethodDecisions && (
                  <div className="mt-3 space-y-3 text-xs">
                    {/* Applied methods summary */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-[#6A6A6A] mb-1.5">
                        Today&apos;s structure
                      </div>
                      <p className="text-[#C5C5C5] leading-relaxed">
                        {appliedSummary}
                      </p>
                      {applied.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {applied.map(m => (
                            <span
                              key={m}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#2A2A2A] text-[#C5C5C5] border border-[#3A3A3A]"
                            >
                              {methodLabel(m)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* [CLUSTER-DECISION-EVIDENCE] Concrete proof of the cluster
                        choice for this session: target exercise, reason, and
                        method-cue vs grouped-block type. Reads the single
                        authoritative truth the builder persisted on
                        session.styleMetadata.clusterDecision -- no guessed
                        text, no hardcoded fallback copy. Rendered only when
                        cluster was actually applied. */}
                    {(() => {
                      const cd = (session as unknown as {
                        styleMetadata?: {
                          clusterDecision?: {
                            targetExerciseName: string
                            reasonSummary: string
                            type: 'method_cue' | 'grouped_block'
                          }
                        }
                      }).styleMetadata?.clusterDecision
                      if (!cd) return null
                      const typeLabel = cd.type === 'grouped_block' ? 'Grouped block' : 'Method cue'
                      const typeHint = cd.type === 'grouped_block'
                        ? 'Renders as a framed grouped block with shared pacing.'
                        : 'Body stays flat; only the targeted row runs cluster execution.'
                      return (
                        <div className="rounded-md border border-purple-500/30 bg-purple-500/5 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-purple-300/80 mb-1.5">
                            Cluster decision
                          </div>
                          <div className="space-y-1 text-[#C5C5C5] leading-relaxed">
                            <div>
                              <span className="text-[#8A8A8A]">Applied to:</span>{' '}
                              <span className="font-medium text-[#E6E6E6]">{cd.targetExerciseName}</span>
                            </div>
                            <div>
                              <span className="text-[#8A8A8A]">Why:</span>{' '}
                              <span className="text-[#C5C5C5]">{cd.reasonSummary}</span>
                            </div>
                            <div>
                              <span className="text-[#8A8A8A]">Type:</span>{' '}
                              <span className="font-medium text-purple-300">{typeLabel}</span>
                              <span className="text-[#7A7A7A]"> — {typeHint}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Rejected methods (only those the user selected) */}
                    {rejected.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-[#6A6A6A] mb-1.5">
                          Selected styles not used today
                        </div>
                        <ul className="space-y-1.5">
                          {rejected.map((r, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-[#6A6A6A] shrink-0">·</span>
                              <span className="text-[#A5A5A5] leading-relaxed">
                                <span className="text-[#C5C5C5] font-medium">{methodLabel(r.method)}:</span>{' '}
                                {r.reason}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )
          })()}

          {/* Finisher Block */}
          {session.finisher && session.finisherIncluded && (
            <div className="mt-4 p-4 bg-gradient-to-r from-[#E63946]/5 to-[#E63946]/10 rounded-lg border border-[#E63946]/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#E63946]" />
                <h5 className="font-semibold text-[#E63946]">{session.finisher.name}</h5>
                <span className="text-xs text-[#6A6A6A] ml-auto">{session.finisher.durationMinutes} min</span>
              </div>
              <div className="space-y-2 mb-3">
                {session.finisher.exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[#E6E9EF]">{ex.name}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded bg-[#E63946]/10 text-[#E63946]/60">Finisher</span>
                    </div>
                    <span className="text-[#A5A5A5]">{ex.reps}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#6A6A6A] italic">{session.finisher.instruction}</p>
              <p className="text-xs text-[#E63946]/80 mt-2">{session.finisher.failureBudgetNote}</p>
            </div>
          )}

          {/* Cooldown Toggle */}
          <div>
            <button
              className="flex items-center gap-2 text-sm text-[#6A6A6A] hover:text-[#A5A5A5] transition-colors"
              onClick={() => setShowCooldown(!showCooldown)}
            >
              {showCooldown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Cool-Down
              <span className="text-xs text-[#4F6D8A]">({session.cooldown.length} exercises)</span>
            </button>
            {showCooldown && (
              <div className="mt-2 space-y-2">
                {/* [TRUTH-ENFORCEMENT] selectionReason is authoritative builder output - safe direct access */}
                {session.cooldown[0]?.selectionReason && (
                  <p className="text-xs text-[#6A6A6A] italic mb-2 pl-2 border-l-2 border-green-500/30">
                    {session.cooldown[0].selectionReason}
                  </p>
                )}
                {session.cooldown.map((exercise, idx) => (
                  <ExerciseRow key={idx} exercise={exercise} isWarmupCooldown />
                ))}
              </div>
            )}
          </div>
            </>
)}
  </div>
  )}

      {/* Exercise Replacement Modal */}
      {selectedExerciseForReplace && (
        <ExerciseReplacementModal
          open={showReplacementModal}
          onOpenChange={setShowReplacementModal}
          exerciseId={selectedExerciseForReplace.id}
          exerciseName={selectedExerciseForReplace.name}
          availableEquipment={availableEquipment}
          onReplace={handleReplacementConfirm}
        />
      )}
  </Card>
  )
  }

// =============================================================================
// [IN-BODY-GROUPED-BANNER]
// Compact top-of-body headline that unambiguously marks the visible body as
// grouped. Rendered as the FIRST child of every grouped branch so the user's
// eye lands on a clear "this session is grouped" cue BEFORE the actual block
// list. The banner is a pure consumer of the per-type counts on
// `finalVisibleBodyModel` -- it introduces no parallel grouping truth.
//
// Why this exists: the collapsed-header chip row already surfaces grouped
// counts above the card, but once the card is expanded the user's focus
// shifts down to the body. The prior body started immediately with blocks
// (rich) or with a plain flat list (simple_order_grouped), so the visible
// body did not itself assert grouped identity. This banner places that
// assertion inside the body, mirroring the same palette as the block headers
// so the visual language is continuous from banner -> block pill -> member
// rail.
// =============================================================================
// =============================================================================
// [SET-EXECUTION-BODY-HEADLINE]
// Honest session-body surface for METHOD_ONLY_FLAT cards -- where one or more
// rows carry a set-execution method (cluster / density_block / etc.) applied
// at the SINGLE-EXERCISE level, not as a multi-member grouped block. The copy
// explicitly says "applied to individual exercise rows" so the user is never
// misled into thinking the session has grouped structure.
//
// Taxonomy-aligned with lib/workout/execution-unit-contract.ts:
//   - GROUPED STRUCTURE METHOD (multi-exercise)   -> GroupedBodyHeadline below
//   - SET-EXECUTION METHOD     (per-row)          -> THIS component
//   - CONTEXTUAL CUE           (informational)    -> row-level microcopy only
// =============================================================================
function SetExecutionBodyHeadline({
  supersetCount: _supersetCount,
  circuitCount: _circuitCount,
  densityCount,
  clusterCount,
}: {
  // superset/circuit not expected on this surface (they're grouped structures)
  // but the signature is kept symmetric with GroupedBodyHeadline for safety.
  supersetCount: number
  circuitCount: number
  densityCount: number
  clusterCount: number
}) {
  const total = densityCount + clusterCount
  if (total === 0) return null
  const hint =
    total === 1
      ? 'One exercise in this session uses a set-execution method — applied to that single row, not as a grouped block.'
      : 'Some exercises in this session use set-execution methods — applied to individual rows, not as grouped blocks.'
  return (
    <div className="mb-3 rounded-md border border-[#3A3A3A] bg-[#1A1A1A] px-3 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Dumbbell className="w-3.5 h-3.5 text-[#A5A5A5]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C5C5C5]">
          Set-execution methods
        </span>
        {clusterCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/40">
            <Repeat className="w-3 h-3" />
            {clusterCount} Cluster {clusterCount > 1 ? 'rows' : 'row'}
          </span>
        )}
        {densityCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Timer className="w-3 h-3" />
            {densityCount} Density {densityCount > 1 ? 'rows' : 'row'}
          </span>
        )}
      </div>
      <p className="mt-1 text-[10px] text-[#8A8A8A] leading-snug">{hint}</p>
    </div>
  )
}

function GroupedBodyHeadline({
  supersetCount,
  circuitCount,
  densityCount,
  clusterCount,
  mode,
}: {
  supersetCount: number
  circuitCount: number
  densityCount: number
  clusterCount: number
  mode: 'rich_grouped' | 'raw_grouped_fallback' | 'simple_order_grouped'
}) {
  const total = supersetCount + circuitCount + densityCount + clusterCount
  if (total === 0 && mode !== 'simple_order_grouped') return null
  const hint =
    mode === 'simple_order_grouped'
      ? 'Grouped session — individual blocks shown as an ordered list below.'
      : total === 1
        ? 'Grouped session — one method applied to a block below.'
        : 'Grouped session — multiple methods applied to blocks below.'
  return (
    <div className="mb-3 rounded-md border border-[#3A3A3A] bg-[#1A1A1A] px-3 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Layers className="w-3.5 h-3.5 text-[#A5A5A5]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C5C5C5]">
          Grouped structure
        </span>
        {supersetCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#4F6D8A]/15 text-[#7FA8CC] border border-[#4F6D8A]/40">
            <Layers className="w-3 h-3" />
            {supersetCount} Superset{supersetCount > 1 ? 's' : ''}
          </span>
        )}
        {circuitCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
            <RefreshCw className="w-3 h-3" />
            {circuitCount} Circuit{circuitCount > 1 ? 's' : ''}
          </span>
        )}
        {densityCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Timer className="w-3 h-3" />
            {densityCount} Density Block{densityCount > 1 ? 's' : ''}
          </span>
        )}
        {clusterCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/40">
            <Dumbbell className="w-3 h-3" />
            {clusterCount} Cluster Set{clusterCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="mt-1 text-[10px] text-[#8A8A8A] leading-snug">{hint}</p>
    </div>
  )
}

// =============================================================================
// [PHASE 7B] MAIN EXERCISES RENDERER
// Handles both grouped (styled) and flat exercise rendering
// =============================================================================

interface MainExercisesRendererProps {
  session: AdaptiveSession
  // [FULL-VISIBLE-ROUTINE] Now accepts full routine exercises (all non-warmup/cooldown)
  displayExercises: (AdaptiveExercise | FullRoutineExercise)[]
  sessionId: string
  skippedExercises: Set<string>
  adjustedExercises: Map<string, string>
  // [EXERCISE-ROW-SURFACE] Primary goal for session-aware purpose lines
  primaryGoal?: string
  // [AI-EVIDENCE-BRIDGE] Session evidence for row alignment
  sessionEvidence?: SessionAiEvidenceSurface
  // [COACHING-EXPLANATION-CONTRACT] Authoritative coaching explanation surface
  coachingExplanation?: ProgramExplanationSurface | null
  onReplace: (exerciseId: string, exerciseName: string) => void
  onSkip: (exerciseId: string, exerciseName: string) => void
  onProgressionAdjust: (exerciseId: string, newProgression: string, direction: 'up' | 'down') => void
  // [PREVIEW-VISIBLE-PROBE] Enable visible probe via query param
  showProbe?: boolean
  // [ALWAYS-VISIBLE-PROBE] Force probe unconditionally
  forceProbe?: boolean
  // [ALWAYS-VISIBLE-PROBE] Card instance ID for correlation
  cardInstanceId?: string
  // [GROUPED-RENDER-CONTRACT] Still passed for grouped-block HYDRATION only
  // (group.exercises metadata, blockId -> displayExercise maps). It does NOT
  // select which visible branch renders; that is owned by finalVisibleBodyModel.
  groupedRenderContract: GroupedDisplayModel
  // [FINAL-VISIBLE-BODY-MODEL] THE authoritative visible-body model. The
  // renderer's entire branch selection is `switch (finalVisibleBodyModel.mode)`
  // with no parallel boolean re-derivation. Grouped modes consume the block
  // lists carried here; flat/simple modes consume `displayExercises` directly.
  //
  // [IN-BODY-GROUPED-BANNER] Per-type counts are now REQUIRED because the
  // renderer paints a top-of-body grouped-method headline in every grouped
  // branch (rich / raw / simple-order), and that banner's chips are derived
  // from these counts so banner + chip row + block headers cannot disagree.
  finalVisibleBodyModel: {
    mode: 'rich_grouped' | 'raw_grouped_fallback' | 'simple_order_grouped' | 'flat_category'
    renderBlocks: RenderBlock[]
    rawFallbackBlocks: RawFallbackBlock[]
    nonStraightGroupCount: number
    supersetCount: number
    circuitCount: number
    densityCount: number
    clusterCount: number
    // [SET-EXECUTION-TRUTH-VISIBILITY] Required by the flat_category branch
    // so the renderer can distinguish an honestly flat session (no methods
    // anywhere) from a METHOD_ONLY_FLAT session (non-straight methods live
    // on single rows -- no grouped blocks). Only the latter paints the
    // "Set-execution methods applied" in-body headline. Values other than
    // 'METHOD_ONLY_FLAT' leave the flat body unchanged.
    reasonIfNotRich?: GroupedFlatReason | 'RAW_FALLBACK_EMPTY' | 'METHOD_ONLY_FLAT' | null
    // [CARD-LOCAL-FAILURE-SURFACE] Final losing stage for the simple_order
    // grouped body. Renderer surfaces this as a single inline line ONLY on
    // cards where grouped truth existed but no renderable block list could
    // be produced. Null for every successful grouped render path.
    groupedFailureStage?:
      | 'bridge_lost_group_fields'
      | 'grouped_contract_empty'
      | 'final_mode_flattened'
      | 'hydration_render_loss'
      | null
  }
}

function MainExercisesRenderer({
  session,
  displayExercises,
  sessionId,
  skippedExercises,
  adjustedExercises,
  primaryGoal,
  sessionEvidence,
  coachingExplanation,
  onReplace,
  onSkip,
  onProgressionAdjust,
  showProbe: _innerShowProbe = false,
  forceProbe: _innerForceProbe = false,
  cardInstanceId = 'unknown',
  groupedRenderContract,
  finalVisibleBodyModel,
}: MainExercisesRendererProps) {
  // Get style metadata from session if available
  const styleMetadata = (session as AdaptiveSession & { styleMetadata?: SessionStyleMetadata }).styleMetadata

  // ==========================================================================
  // [FINAL-VISIBLE-BODY-MODEL] Renderer is a PURE CONSUMER of the authoritative
  // visible-body model computed in the parent card. The renderer does NOT
  // re-derive grouped-vs-flat from parallel booleans; its entire branch
  // selection is `finalVisibleBodyModel.mode`. This guarantees the body
  // cannot disagree with the probe / chip / audit, because all of them read
  // the exact same model object.
  //
  // `groupedRenderContract` is retained ONLY for HYDRATION inside the grouped
  // branches (group.exercises member metadata, blockId lookups). It can no
  // longer change which branch renders.
  // ==========================================================================
  const groupedDisplayModel = groupedRenderContract
  const bodyMode = finalVisibleBodyModel.mode

  
  // [EXERCISE-ROW-SURFACE] Build session context for exercise row surfaces
  // [EXPLAIN-OWNER-LOCK] Ensure primaryGoal (program's skill) is passed to explanation engine
  const compositionMeta = (session as unknown as { compositionMetadata?: { spineSessionType?: string; sessionIntent?: string } }).compositionMetadata
  const sessionContextForRows = {
    sessionFocus: session.focusLabel || session.focus || '',
    isPrimarySession: session.isPrimary || false,
    // [EXPLAIN-OWNER-LOCK] Use passed primaryGoal (program's skill) - this is the AUTHORITATIVE goal
    primaryGoal: primaryGoal || (session as unknown as { primaryGoal?: string }).primaryGoal || undefined,
    prescriptionPropagationAudit: (session as unknown as { prescriptionPropagationAudit?: { appliedReductions?: { setsReduced?: boolean; rpeReduced?: boolean } } }).prescriptionPropagationAudit,
    styleMetadata: styleMetadata ? {
      primaryStyle: styleMetadata.primaryStyle,
      hasSupersetsApplied: styleMetadata.hasSupersetsApplied,
      hasDensityApplied: styleMetadata.hasDensityApplied,
    } : undefined,
    // [EXPLAIN-OWNER-LOCK] Pass compositionMetadata for full explanation context
    compositionMetadata: compositionMeta ? {
      spineSessionType: compositionMeta.spineSessionType,
      sessionIntent: compositionMeta.sessionIntent,
    } : undefined,
  }
  
  // [REMOVED] DEV-TRUTH-PROBE computations (flatReasonCode, nonStraightGroups,
  // groupedExerciseNamesFromTruth, matchedGroupedNames, missingGroupedNames,
  // overlapScore, doctrineVerdict) and the DevRenderBranchBanner component.
  // These fed the retired debug banners and have no production consumer. The
  // grouped render contract is already the single authoritative source of
  // truth for grouped-vs-flat decisions below.
  
  // ==========================================================================
  // [REMOVED] FORCE_GROUPED_RUNTIME_PROOF temporary dominant override.
  // The yellow "GROUPED RUNTIME PROOF MODE ACTIVE" panel that previously
  // replaced the entire exercise body for grouped-eligible cards has been
  // deleted. Grouped-eligible sessions now fall through to the raw grouped
  // fallback path (display-first, visible grouped structure) or the rich
  // grouped path below, both of which produce the real production grouped
  // card body with colored section headers + hydrated ExerciseRow members.
  // ==========================================================================

  // ==========================================================================
  // [FINAL-VISIBLE-BODY-MODEL] RAW GROUPED FALLBACK PATH
  //
  // Engages when `finalVisibleBodyModel.mode === 'raw_grouped_fallback'`.
  // That mode is selected by the parent card when upstream grouped truth
  // exists (styledGroups had non-straight groups, or exercises had blockId +
  // non-straight method) but the rich path could not produce renderable
  // groups -- typically because partial-validity filters dropped too many
  // members. This renderer NEVER re-decides grouped-vs-flat; if the model
  // says raw_grouped_fallback, this branch renders, period.
  //
  // The branch renders grouped headers + member rows using the contract's
  // rawFallbackBlocks (permissive: >=1 usable member per block, no min-count
  // gate). Rows are hydrated to full ExerciseRow when displayExercises can
  // resolve the member by id/name; otherwise a minimal text row is rendered.
  // Either way, visible grouped structure is guaranteed whenever grouped
  // truth exists upstream.
  // ==========================================================================
  if (bodyMode === 'raw_grouped_fallback') {
    // [FINAL-VISIBLE-BODY-MODEL] Consume the model's block list, NOT the raw
    // contract -- the model is the single authoritative visible-body source.
    const fallbackBlocks = finalVisibleBodyModel.rawFallbackBlocks
    const normalizeKey = (s: string): string =>
      (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
    const hydrateMap = new Map<string, AdaptiveExercise>()
    displayExercises.forEach(e => {
      if (e.id) hydrateMap.set(e.id, e)
      if (e.name) {
        hydrateMap.set(e.name, e)
        hydrateMap.set(e.name.toLowerCase(), e)
        const norm = normalizeKey(e.name)
        if (norm) hydrateMap.set(norm, e)
      }
    })
    let rawIdx = 0
    // [IN-BODY-GROUPED-BANNER] Compute per-type counts directly from the
    // block list the renderer iterates, so banner + block headers cannot
    // disagree for this exact render.
    let hSuper = 0, hCirc = 0, hDens = 0, hClust = 0
    for (const b of fallbackBlocks) {
      if (b.groupType === 'superset') hSuper++
      else if (b.groupType === 'circuit') hCirc++
      else if (b.groupType === 'density_block') hDens++
      else if (b.groupType === 'cluster') hClust++
    }
    return (
      <div className="space-y-4">
        <GroupedBodyHeadline
          supersetCount={hSuper}
          circuitCount={hCirc}
          densityCount={hDens}
          clusterCount={hClust}
          mode="raw_grouped_fallback"
        />
        {fallbackBlocks.map((block, bIdx) => {
          const colors = getGroupTypeColors(block.groupType)
          const icon = getGroupTypeIcon(block.groupType)
          return (
            <div
              key={block.groupId || `raw-${bIdx}`}
              // [GROUPED-VISIBLE-OWNERSHIP] Same dominant container treatment as
              // the rich grouped path so the raw-fallback branch (grouped truth
              // exists upstream but rich hydration incomplete) still visibly
              // wins ownership of the card body instead of looking flat.
              // [GROUPED-BLOCK-FRAME-STRENGTHENED] Added `border-l-4` left
              // accent so the grouped block visibly reads as a framed
              // structural unit even on low-contrast card backgrounds. The
              // accent color is the method color at full opacity (overriding
              // the thin all-sides border for the left edge specifically).
              className={`rounded-lg border border-l-4 ${colors.border} ${colors.blockBg} p-2`}
            >
              <div className={`mb-2 flex items-center gap-2 flex-wrap px-2.5 py-1.5 rounded-md ${colors.bg}`}>
                <span className={colors.text}>{icon}</span>
                <span className={`text-sm font-semibold ${colors.text}`}>{block.label}</span>
                <span className="text-[11px] text-[#8A8A8A]">
                  · {block.members.length} {block.members.length === 1 ? 'exercise' : 'exercises'}
                </span>
              </div>

              {/* [METHOD-BODY-CUE] Same cluster/density in-body cue as the
                  rich branch, rendered here so rich and raw-fallback
                  surfaces paint identical method semantics. Null for every
                  other groupType -- no layout change for superset/circuit
                  fallbacks. */}
              {(() => {
                if (block.groupType !== 'cluster' && block.groupType !== 'density_block') return null
                const cue =
                  block.groupType === 'cluster'
                    ? {
                        Icon: Repeat,
                        primary: 'Intra-set rest',
                        secondary:
                          'Mini-efforts with a short pause, then full rest between clusters.',
                      }
                    : {
                        Icon: Timer,
                        primary: 'Work capacity',
                        secondary:
                          'Rotate movements within the time cap — quality reps, rest as needed.',
                      }
                return (
                  <div className={`mb-2 flex items-start gap-2 px-2.5 py-1.5 rounded-md border ${colors.border} bg-black/20`}>
                    <cue.Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${colors.text}`} />
                    <div className="flex-1 min-w-0 text-[11px] leading-snug">
                      <span className={`${colors.text} font-medium`}>{cue.primary}</span>
                      <span className="text-[#A0A0A0]"> — {cue.secondary}</span>
                    </div>
                  </div>
                )
              })()}

              {/* [GROUPED-MEMBER-FRAME] Replaced the old `pl-4 border-l-2`
                  thin-line wrapper with `space-y-1.5`: grouped identity is
                  now owned per-row by GroupedMemberFrame's method-colored
                  rail, so the outer left line was redundant and visually
                  weak. Each member (hydrated row or minimal fallback row)
                  is wrapped in the frame so grouped ownership survives
                  regardless of hydration. */}
              <div className="space-y-1.5">
                {block.members.map((member, mIdx) => {
                  rawIdx++
                  const hydrated =
                    (member.id ? hydrateMap.get(member.id) : undefined) ||
                    (member.name ? hydrateMap.get(member.name) : undefined) ||
                    (member.name ? hydrateMap.get(member.name.toLowerCase()) : undefined) ||
                    (member.name ? hydrateMap.get(normalizeKey(member.name)) : undefined)
                  // [GROUPED-MEMBER-SEMANTIC-LINE] Resolve partner name for
                  // supersets from the SAME block.members list the block
                  // already consumes. Only surfaces when pair length is 2,
                  // otherwise the helper falls back to its generic paired
                  // copy. Hydrated row name is preferred when the adjacent
                  // member resolves; otherwise we use the raw grouped name.
                  let partnerName: string | undefined
                  if (block.groupType === 'superset' && block.members.length === 2) {
                    const partner = block.members[mIdx === 0 ? 1 : 0]
                    if (partner) {
                      const partnerHydrated =
                        (partner.id ? hydrateMap.get(partner.id) : undefined) ||
                        (partner.name ? hydrateMap.get(partner.name) : undefined) ||
                        (partner.name ? hydrateMap.get(partner.name.toLowerCase()) : undefined) ||
                        (partner.name ? hydrateMap.get(normalizeKey(partner.name)) : undefined)
                      partnerName = (partnerHydrated?.name || partner.name || '').trim() || undefined
                    }
                  }
                  const semanticLine = buildGroupedMemberSemanticLine({
                    groupType: block.groupType,
                    prefix: member.prefix,
                    positionIndex: mIdx + 1,
                    totalMembers: block.members.length,
                    partnerName,
                  })
                  if (hydrated) {
                    return (
                      <GroupedMemberFrame
                        key={hydrated.id}
                        colors={colors}
                        groupType={block.groupType}
                        prefix={member.prefix}
                        positionIndex={mIdx + 1}
                        totalMembers={block.members.length}
                        semanticLine={semanticLine}
                      >
                        <ExerciseRow
                          exercise={hydrated}
                          index={rawIdx}
                          // [GROUPED-MEMBER-FRAME] Suppress the row's
                          // internal tiny 10px mono prefix -- the frame's
                          // rail is now the authoritative prefix surface.
                          prefix={undefined}
                          sessionId={sessionId}
                          isSkipped={skippedExercises.has(hydrated.id)}
                          adjustedName={adjustedExercises.get(hydrated.id)}
                          sessionContext={sessionContextForRows}
                          sessionEvidence={sessionEvidence}
                          coachingExplanation={coachingExplanation}
                          onReplace={onReplace}
                          onSkip={onSkip}
                          onProgressionAdjust={onProgressionAdjust}
                        />
                      </GroupedMemberFrame>
                    )
                  }
                  // Minimal text fallback row. Display-first: name must be
                  // visible even when rich hydration cannot resolve it.
                  // [GROUPED-MEMBER-FRAME] Fallback row is also framed, so
                  // hydration-incomplete members still read as grouped.
                  const safeName = (member.name || '').trim()
                  if (safeName.length < 2) return null
                  return (
                    <GroupedMemberFrame
                      key={member.id || `${block.groupId}-${mIdx}`}
                      colors={colors}
                      groupType={block.groupType}
                      prefix={member.prefix}
                      positionIndex={mIdx + 1}
                      totalMembers={block.members.length}
                      semanticLine={semanticLine}
                    >
                      <div className="flex items-center py-2 px-3 rounded-lg border bg-[#171717] border-[#282828] text-sm text-[#C8C8C8]">
                        <span className="truncate">{safeName}</span>
                      </div>
                    </GroupedMemberFrame>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ==========================================================================
  // [FINAL-VISIBLE-BODY-MODEL] FLAT CATEGORY RENDER PATH
  //
  // Engages ONLY when `finalVisibleBodyModel.mode === 'flat_category'`. That
  // mode is selected by the parent card exclusively for sessions with NO
  // upstream grouped truth. Grouped-intent days (hasGroupedTruth === true)
  // are routed to rich_grouped / raw_grouped_fallback / simple_order_grouped
  // by the model before the renderer is invoked, so this category-sectioned
  // layout can never silently swallow a grouped day. This is the lockout
  // that prevents the prior "grouped truth existed but body looked flat"
  // regression from returning.
  // ==========================================================================
  if (bodyMode === 'flat_category') {
    // ==========================================================================
    // [CANONICAL-ORDER-CONTRACT] Flat render path.
    //
    // Previously this branch bucketed exercises by category (skill / strength /
    // accessory / other) and emitted them in that fixed order. That quietly
    // reordered the numbered workout away from canonical session order, so the
    // Program card could show a different sequence than Start Workout. The
    // renderer now walks displayExercises in canonical order and only emits a
    // category header when the category changes between adjacent rows, so the
    // visual "sections" remain but the exercise sequence matches the order the
    // live workout machine consumes.
    // ==========================================================================
    const normalizeCat = (cat?: string): string => {
      if (!cat) return 'other'
      return ['skill', 'strength', 'accessory'].includes(cat) ? cat : 'other'
    }

    // [SET-EXECUTION-TRUTH-VISIBILITY] Honest in-body headline for sessions
    // where grouped truth does not exist but per-row set-execution methods
    // do. Gated strictly on `reasonIfNotRich === 'METHOD_ONLY_FLAT'` so the
    // headline never fires for genuinely flat sessions (no methods anywhere).
    // Counts come straight off the authoritative `finalVisibleBodyModel`
    // (populated by the METHOD_ONLY_FLAT dispatcher branch) -- same source
    // the top chip row reads -- so banner / chip row / row-level microcopy
    // cannot disagree.
    const showSetExecHeadline =
      finalVisibleBodyModel.reasonIfNotRich === 'METHOD_ONLY_FLAT' &&
      (finalVisibleBodyModel.clusterCount > 0 || finalVisibleBodyModel.densityCount > 0)

    let lastCat: string | null = null
    return (
      <div className="space-y-4">
        {showSetExecHeadline && (
          <SetExecutionBodyHeadline
            supersetCount={finalVisibleBodyModel.supersetCount}
            circuitCount={finalVisibleBodyModel.circuitCount}
            densityCount={finalVisibleBodyModel.densityCount}
            clusterCount={finalVisibleBodyModel.clusterCount}
          />
        )}
        {displayExercises.map((exercise, idx) => {
          const thisCat = normalizeCat(exercise.category)
          const emitHeader = thisCat !== lastCat
          lastCat = thisCat
          const contract = emitHeader ? getCategoryDisplayContract(thisCat, sessionEvidence) : null
          return (
            <div key={exercise.id} className="space-y-2">
              {emitHeader && contract && (
                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${contract.color}`}>
                    {contract.label}
                  </span>
                  {contract.description && (
                    <span className="text-[10px] text-[#6A6A6A]">
                      {contract.description}
                    </span>
                  )}
                  <div className="flex-1 h-px bg-[#2A2A2A]" />
                </div>
              )}
              <ExerciseRow
                exercise={exercise}
                index={idx + 1}
                sessionId={sessionId}
                isSkipped={skippedExercises.has(exercise.id)}
                adjustedName={adjustedExercises.get(exercise.id)}
                sessionContext={sessionContextForRows}
                sessionEvidence={sessionEvidence}
                coachingExplanation={coachingExplanation}
                onReplace={onReplace}
                onSkip={onSkip}
                onProgressionAdjust={onProgressionAdjust}
              />
            </div>
          )
        })}
      </div>
    )
  }

  // ==========================================================================
  // [FINAL-VISIBLE-BODY-MODEL] SIMPLE-ORDER GROUPED FALLBACK
  //
  // Engages when `finalVisibleBodyModel.mode === 'simple_order_grouped'`.
  // That mode is selected by the parent card when grouped intent exists
  // upstream but nothing is renderable as a grouped block (rawFallbackBlocks
  // came back empty because every upstream member failed the usable-name
  // filter). Rather than silently fall through to the category-sectioned
  // flat layout (which would visually hide the fact that grouped truth
  // existed), we render a simple ordered list of the actual exercises --
  // no fake category headers, no fake group headers.
  // ==========================================================================
  if (bodyMode === 'simple_order_grouped') {
    // [IN-BODY-GROUPED-BANNER] `simple_order_grouped` is the last-resort
    // branch where grouped truth exists but no renderable blocks could be
    // built from any source (rich, raw contract, or display-synthesized).
    // Prior behavior rendered a bare ordered list that looked identical to
    // a flat session. Now the body opens with an honest grouped-method
    // banner so the user is never misled into thinking the session was
    // ungrouped. The rows below keep their normal ExerciseRow format --
    // we don't invent fake block containers when there's no renderable
    // block truth to back them.
    //
    // [CARD-LOCAL-FAILURE-SURFACE] When the dispatcher landed here with a
    // groupedFailureStage populated, surface that exact stage inline. This
    // is the tiny, card-local failure surface required by section F: it
    // appears ONLY on cards that reached simple_order_grouped with a code,
    // never on rich/raw grouped cards, and never on honestly flat cards.
    // Copy is derived directly from the enumerated stage codes -- no
    // invented language, no generic counts, no top-page spam.
    const failureStage = finalVisibleBodyModel.groupedFailureStage
    const failureCopy = (() => {
      switch (failureStage) {
        case 'bridge_lost_group_fields':
          return 'Bridge lost group fields — grouped methods exist upstream but blockId/method did not reach this card body.'
        case 'grouped_contract_empty':
          return 'Grouped contract empty — the grouped render model produced no block list for this session.'
        case 'final_mode_flattened':
          return 'Final mode flattened — grouped truth reached the dispatcher but no block source produced renderable groups.'
        case 'hydration_render_loss':
          return 'Hydration render loss — grouped blocks existed but every member failed the usable-name filter.'
        default:
          return null
      }
    })()
    let globalIdx = 0
    return (
      <div className="space-y-2">
        <GroupedBodyHeadline
          supersetCount={finalVisibleBodyModel.supersetCount}
          circuitCount={finalVisibleBodyModel.circuitCount}
          densityCount={finalVisibleBodyModel.densityCount}
          clusterCount={finalVisibleBodyModel.clusterCount}
          mode="simple_order_grouped"
        />
        {/* [FINAL-VISIBLE-OWNERSHIP-LOCK] Grouped-fallback failure banner moved
            off the athlete-facing surface. Both the raw stage token (font-mono
            "HYDRATION_RENDER_LOSS" etc.) and the implementation-leaning failure
            copy were diagnostic content in the production card body. The
            simple_order_grouped path still renders the exercises in canonical
            order via the GroupedBodyHeadline above, so users see a coherent
            session story instead of an amber implementation note. The banner
            is preserved for QA via the inner-renderer probe props (already
            hard-disabled in production by the outer card's `probeActive`). */}
        {(_innerShowProbe || _innerForceProbe) && failureCopy && failureStage && (
          <div
            className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] leading-snug"
            role="status"
            aria-label={`Grouped display fallback: ${failureStage}`}
          >
            <span className="font-mono text-amber-400/90 font-semibold">
              {failureStage}
            </span>
            <span className="text-[#A0A0A0]"> — {failureCopy}</span>
          </div>
        )}
        {displayExercises.map((exercise) => {
          globalIdx++
          return (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              index={globalIdx}
              sessionId={sessionId}
              isSkipped={skippedExercises.has(exercise.id)}
              adjustedName={adjustedExercises.get(exercise.id)}
              sessionContext={sessionContextForRows}
              sessionEvidence={sessionEvidence}
              coachingExplanation={coachingExplanation}
              onReplace={onReplace}
              onSkip={onSkip}
              onProgressionAdjust={onProgressionAdjust}
            />
          )
        })}
      </div>
    )
  }
  
  // ==========================================================================
  // GROUPED RENDER PATH - Styled groups with visual structure
  // ==========================================================================
  
  // [UNIFIED-RENDER-OWNERSHIP] Robust render-surface maps so grouped block
  // members always resolve back to a FULL displayExercise row (with sets,
  // reps, RPE, rest, prescribedLoad). When name/id lookups fail due to
  // variant-rename drift, the blockId map below is authoritative.
  // Four lookup tiers on exerciseDataMap: raw id, raw name, lowercased name,
  // normalized name (punctuation/whitespace collapsed -- matches bridge).
  const exerciseDataMap = new Map<string, AdaptiveExercise>()
  const normalizeExerciseKey = (s: string): string =>
    (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
  // blockId -> list of displayExercises with that blockId, in canonical order.
  // This is the authoritative render-surface member list per group and is the
  // preferred lookup for grouped block rendering.
  const blockIdToDisplayExercises = new Map<string, AdaptiveExercise[]>()
  displayExercises.forEach(e => {
    if (e.id) exerciseDataMap.set(e.id, e)
    if (e.name) {
      exerciseDataMap.set(e.name, e)
      const lowered = e.name.toLowerCase()
      if (!exerciseDataMap.has(lowered)) exerciseDataMap.set(lowered, e)
      const norm = normalizeExerciseKey(e.name)
      if (norm && !exerciseDataMap.has(norm)) exerciseDataMap.set(norm, e)
    }
    const bId = (e as unknown as { blockId?: string }).blockId
    if (bId) {
      if (!blockIdToDisplayExercises.has(bId)) blockIdToDisplayExercises.set(bId, [])
      blockIdToDisplayExercises.get(bId)!.push(e)
    }
  })
  
  // ==========================================================================
  // [GROUPED-RENDER-CONTRACT] SINGLE render source. The adapter now owns the
  // full ordered list of render blocks (groups + interleaved standalone
  // exercises) including canonical ordering and the rescue pass for groups
  // whose members failed id/name/blockId matching. The renderer's prior local
  // canonical-walk (displayBlocks / exerciseToGroupIndex / blockIdToGroupIndex
  // / groupedExerciseIds / groupedExerciseNames / processedExerciseIds /
  // processedGroupIndices / rescue append) has been removed entirely. This
  // removes the split display ownership that previously let "grouped branch =
  // yes" coexist with a flat-looking body.
  // ==========================================================================
  // [FINAL-VISIBLE-BODY-MODEL] Rich path reads the block list directly off the
  // authoritative visible-body model so the final JSX renders ONLY from the
  // model. Previously this read from `groupedDisplayModel.renderBlocks` which
  // happened to be the same array, but routing through the model enforces the
  // single-ownership contract structurally: any divergence between the model
  // selection and the block list consumed here now requires changing the model
  // itself, not a parallel renderer decision.
  const renderBlocks: RenderBlock[] = finalVisibleBodyModel.renderBlocks

  // [GROUPED-TRUTH-TRACE] Failure-only diagnostic. Now that ownership is
  // unified inside the contract, this should never fire -- keep it as a
  // structural defense so any future regression is loud.
  if (typeof window !== 'undefined') {
    const nonStraightInContract = groupedDisplayModel.nonStraightGroupCount
    const renderedNonStraightBlocks = renderBlocks.filter(
      b => b.type === 'group' && b.group.groupType !== 'straight'
    ).length
    if (nonStraightInContract > 0 && renderedNonStraightBlocks < nonStraightInContract) {
      console.log('[v0] [GROUPED-TRUTH-TRACE] CONTRACT_VIOLATION', {
        sessionDay: session.dayNumber,
        focus: session.focus || session.focusLabel,
        nonStraightInContract,
        renderedNonStraightBlocks,
        sourceUsed: groupedDisplayModel.sourceUsed,
        flatReason: groupedDisplayModel.flatReason,
        displayExerciseCount: displayExercises.length,
      })
    }
  }

      let globalExerciseIndex = 0

  // ==========================================================================
  // [METHOD-BODY-CUE] Compact, method-specific semantics strip rendered
  // INSIDE the tinted group container, between the pill header and the
  // member spine. Painted ONLY for groupType === 'cluster' and
  // 'density_block' because those are the methods the pill + ExerciseRow
  // combination cannot express structurally (superset/circuit already
  // communicate via A1/A2/B1/B2 prefixes on their paired member rows and
  // are intentionally left unchanged here).
  //
  // Copy is derived from the canonical method definition in the adapter's
  // authoritative restProtocol strings (cluster = intra-set rest, density
  // = work-capacity rotation within a time cap) -- no invented wording,
  // no invented rule. Returns null for every other groupType so the strip
  // renders nothing (no layout hole) when the method is already self-
  // expressing. A 1-member cluster now gets a body line that explicitly
  // says this is a cluster set, not just "a row with a small label above
  // it."
  // ==========================================================================
  const getMethodBodyCue = (
    groupType: string
  ): { Icon: typeof Timer; primary: string; secondary: string } | null => {
    // [PHASE 3F METHOD SEMANTIC TRUTH LOCK] Body cue reads from the single
    // authoritative GROUPED_METHOD_SEMANTICS table. Only cluster + density
    // have a non-null bodyCue in the table by design (superset/circuit
    // express their semantic structurally via A1/A2/B1/B2 prefixes); the
    // null return for those types preserves the prior contract that the
    // strip is omitted entirely for self-expressing methods. Icon mapping
    // stays local because lucide React components can't be serialised into
    // the data table.
    const semantics = getGroupedMethodSemantics(groupType as GroupType)
    if (!semantics?.bodyCue) return null
    const Icon = groupType === 'cluster' ? Repeat : Timer
    return {
      Icon,
      primary: semantics.bodyCue.primary,
      secondary: semantics.bodyCue.secondary,
    }
  }

  // [IN-BODY-GROUPED-BANNER] Per-type counts come directly from the
  // contract-owned block list the renderer is iterating, so banner +
  // block headers cannot disagree for this exact render.
  let richSuper = 0, richCirc = 0, richDens = 0, richClust = 0
  for (const b of renderBlocks) {
    if (b.type === 'group') {
      const gt = b.group.groupType
      if (gt === 'superset') richSuper++
      else if (gt === 'circuit') richCirc++
      else if (gt === 'density_block') richDens++
      else if (gt === 'cluster') richClust++
    }
  }

  return (
    <div className="space-y-4">
      <GroupedBodyHeadline
        supersetCount={richSuper}
        circuitCount={richCirc}
        densityCount={richDens}
        clusterCount={richClust}
        mode="rich_grouped"
      />
      {renderBlocks.map((block, blockIdx) => {
        // [GROUPED-RENDER-CONTRACT] Handle ungrouped exercise -- hydrate the
        // row from exerciseDataMap (pure enrichment; NOT block ownership).
        // If hydration fails, render a minimal fallback so the contract's
        // choice is still honored.
        if (block.type === 'exercise') {
          globalExerciseIndex++
          const fullExercise =
            (block.exerciseId && exerciseDataMap.get(block.exerciseId)) ||
            (block.exerciseName && exerciseDataMap.get(block.exerciseName)) ||
            (block.exerciseName && exerciseDataMap.get(block.exerciseName.toLowerCase())) ||
            (block.exerciseName && exerciseDataMap.get(normalizeExerciseKey(block.exerciseName)))

          if (!fullExercise) {
            const safeName = (block.exerciseName || '').trim()
            if (!safeName || safeName.length < 2) return null
            return (
              <div
                key={block.exerciseId || `ex-${blockIdx}`}
                className="flex items-baseline gap-2 py-2 px-3 rounded-lg border bg-[#171717] border-[#282828] text-sm text-[#C8C8C8]"
              >
                <span className="text-[10px] text-[#4A4A4A] font-mono shrink-0">{globalExerciseIndex}.</span>
                <span className="truncate">{safeName}</span>
              </div>
            )
          }

          return (
            <ExerciseRow
              key={fullExercise.id}
              exercise={fullExercise}
              index={globalExerciseIndex}
              sessionId={sessionId}
              isSkipped={skippedExercises.has(fullExercise.id)}
              adjustedName={adjustedExercises.get(fullExercise.id)}
              sessionContext={sessionContextForRows}
              sessionEvidence={sessionEvidence}
              coachingExplanation={coachingExplanation}
              onReplace={onReplace}
              onSkip={onSkip}
              onProgressionAdjust={onProgressionAdjust}
            />
          )
        }

        // Handle grouped block (contract-owned; renderer does not decide set/order)
        const { group } = block
        const colors = getGroupTypeColors(group.groupType)
        const label = getGroupTypeLabel(group.groupType)
        const icon = getGroupTypeIcon(group.groupType)
        const isSpecialGroup = group.groupType !== 'straight'
        
        return (
          <div
            key={group.id || `group-${blockIdx}`}
            // [GROUPED-VISIBLE-OWNERSHIP] Wrap the entire grouped block (header +
            // members) in a tinted container so grouped structure is the visually
            // dominant unit in the card body. Previously the header was a small
            // pill and members only carried a thin left border, so a 2-row
            // superset inside a 7-row session read as "mostly flat with a colored
            // pill". With a container tint + padding, the group is unmistakably
            // a distinct structural block.
            // [GROUPED-BLOCK-FRAME-STRENGTHENED] Added `border-l-4` so the
            // grouped block visibly reads as a framed structural unit. Matches
            // the raw-fallback branch so grouped containers look identical
            // across both render paths.
            className={isSpecialGroup ? `rounded-lg border border-l-4 ${colors.border} ${colors.blockBg} p-2` : ''}
          >
            {/* [CLEAN-GROUP-HEADER-RESTORED] Compact but clearly visible header.
                Previous pass made it too quiet (text-xs + opacity-80) which flattened grouped
                truth visually. Restored to text-sm, full opacity, with a subtle tinted background
                pill so grouped blocks are immediately recognizable without debug clutter. */}
            {isSpecialGroup && (
              <div className={`mb-2 flex items-center gap-2 flex-wrap px-2.5 py-1.5 rounded-md ${colors.bg}`}>
                <span className={colors.text}>{icon}</span>
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {(() => {
                    // [UNIFIED-RENDER-OWNERSHIP] Resolve the first member from
                    // the render surface (blockId first, then id/name fallbacks)
                    // so the header category prefix matches what actually renders
                    // inside the block.
                    const firstExercise = group.exercises[0]
                    const renderSurfaceFirst = group.id
                      ? blockIdToDisplayExercises.get(group.id)?.[0]
                      : undefined
                    const fullExercise = renderSurfaceFirst
                      || (firstExercise ? (exerciseDataMap.get(firstExercise.id)
                        || exerciseDataMap.get(firstExercise.name)
                        || exerciseDataMap.get(firstExercise.name.toLowerCase())
                        || exerciseDataMap.get(normalizeExerciseKey(firstExercise.name))) : undefined)
                    const category = fullExercise?.category
                    const purposePrefix = category && category !== 'accessory' 
                      ? `${category.charAt(0).toUpperCase() + category.slice(1)} ` 
                      : category === 'accessory' 
                        ? 'Accessory ' 
                        : ''
                    return `${purposePrefix}${label}`
                  })()}
                </span>
                {/* [PHASE 3F METHOD SEMANTIC TRUTH LOCK] Compact semantic
                    qualifier rendered immediately after the pill noun, in the
                    same color family as the rail. Pre-3F the user had to read
                    the muted-grey rest microcopy ("Rest 30-60s between rounds")
                    or the body cue strip to figure out whether a Density Block
                    was structurally distinct from a Circuit. The tagline puts
                    that distinction directly under the eye on the pill itself
                    ("Density Block · timed work cap" vs "Circuit · rounds &
                    stations"). Reads from the same authoritative semantics
                    source that powers the row line, body cue, and rest
                    microcopy — so the four visible surfaces can never disagree.
                    Hidden when the semantics table has no entry (straight). */}
                {(() => {
                  const tagline = getGroupedMethodSemantics(group.groupType)?.headerTagline
                  if (!tagline) return null
                  return (
                    <span className={`text-[11px] ${colors.text} opacity-80`}>
                      · {tagline}
                    </span>
                  )
                })()}
                <span className="text-[11px] text-[#8A8A8A]">
                  · {group.exercises.length} exercises
                </span>
                {group.restProtocol && (
                  <span className="text-[11px] text-[#8A8A8A]">
                    · Rest {group.restProtocol}
                  </span>
                )}
                <MethodInfoBubble 
                  methodType={group.groupType as 'superset' | 'circuit' | 'cluster' | 'density_block'}
                  context={group.exercises[0]?.methodRationale || group.instruction || undefined}
                />
              </div>
            )}

            {/* [METHOD-BODY-CUE] Cluster / density in-body semantics strip.
                Renders only when the method cannot be expressed by member
                structure alone (cluster = single-member possible; density =
                time-capped rotation without paired prefixes). Placed here so
                the user reads the method's nature BEFORE the member rows,
                which removes the "normal row with decoration" feel on
                1-member cluster blocks. Null-returns for every other
                groupType -- no layout hole for superset / circuit. */}
            {(() => {
              const cue = getMethodBodyCue(group.groupType)
              if (!cue) return null
              return (
                <div className={`mb-2 flex items-start gap-2 px-2.5 py-1.5 rounded-md border ${colors.border} bg-black/20`}>
                  <cue.Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${colors.text}`} />
                  <div className="flex-1 min-w-0 text-[11px] leading-snug">
                    <span className={`${colors.text} font-medium`}>{cue.primary}</span>
                    <span className="text-[#A0A0A0]"> — {cue.secondary}</span>
                  </div>
                </div>
              )
            })()}

            {/* Exercises in this group */}
            {/* [GROUPED-MEMBER-FRAME] Replaced the old `pl-4 border-l-2`
                thin-line wrapper with `space-y-1.5`: grouped identity is
                owned per-row by GroupedMemberFrame. Flat groups (straight)
                keep the plain `space-y-2` they had before. */}
            <div className={isSpecialGroup ? 'space-y-1.5' : 'space-y-2'}>
              {group.exercises.map((groupExercise, exIdx) => {
                globalExerciseIndex++
                
                // [UNIFIED-RENDER-OWNERSHIP] Prefer the RENDER surface as the
                // authoritative member source. Order of preference:
                //   1. blockId + positional index  (most reliable; survives rename)
                //   2. exact id                     (exact identity match)
                //   3. exact raw name
                //   4. lowercased name
                //   5. normalized name              (handles "Pull-Ups" vs "Pull Ups")
                // When all five miss, we fall through to the minimal-row rescue
                // below so the group header still renders honestly.
                const renderSurfaceMembers = group.id
                  ? blockIdToDisplayExercises.get(group.id)
                  : undefined
                const fullExercise =
                  (renderSurfaceMembers && renderSurfaceMembers[exIdx])
                  || exerciseDataMap.get(groupExercise.id)
                  || exerciseDataMap.get(groupExercise.name)
                  || exerciseDataMap.get(groupExercise.name.toLowerCase())
                  || exerciseDataMap.get(normalizeExerciseKey(groupExercise.name))

                // [GROUPED-MEMBER-SEMANTIC-LINE] Resolve partner name for
                // supersets from the SAME group.exercises list. Partner
                // prefers the render-surface hydrated name, then the
                // exerciseDataMap hydrated name, then the raw grouped name,
                // so the line stays meaningful even when one half of the
                // pair is hydration-missed.
                let partnerName: string | undefined
                if (group.groupType === 'superset' && group.exercises.length === 2) {
                  const partnerIdx = exIdx === 0 ? 1 : 0
                  const partner = group.exercises[partnerIdx]
                  if (partner) {
                    const partnerHydrated =
                      (renderSurfaceMembers && renderSurfaceMembers[partnerIdx])
                      || exerciseDataMap.get(partner.id)
                      || exerciseDataMap.get(partner.name)
                      || exerciseDataMap.get(partner.name.toLowerCase())
                      || exerciseDataMap.get(normalizeExerciseKey(partner.name))
                    partnerName = (partnerHydrated?.name || partner.name || '').trim() || undefined
                  }
                }
                const semanticLine = isSpecialGroup
                  ? buildGroupedMemberSemanticLine({
                      groupType: group.groupType,
                      prefix: groupExercise.prefix,
                      positionIndex: exIdx + 1,
                      totalMembers: group.exercises.length,
                      partnerName,
                    })
                  : null

                if (!fullExercise) {
                  // Exercise in styled groups but not in displayExercises.
                  // [GROUPED-TRUTH-RESCUE] Render a minimal row from styledGroups'
                  // authoritative truth so grouped structure stays visible.
                  // [JUNK-TEXT-GUARD] If the grouped truth has no usable name,
                  // drop the row entirely rather than rendering a lone prefix
                  // (e.g. "A1" with no exercise) or a stray letter fragment.
                  const safeName = (groupExercise.name || '').trim()
                  if (!safeName || safeName.length < 2) {
                    return null
                  }
                  // [GROUPED-MEMBER-FRAME] Even the hydration-miss fallback
                  // row is framed for this (special) group type so grouped
                  // identity survives. Flat 'straight' groups never enter
                  // this branch so they are unaffected.
                  if (isSpecialGroup) {
                    return (
                      <GroupedMemberFrame
                        key={groupExercise.id || `${safeName}-${exIdx}`}
                        colors={colors}
                        groupType={group.groupType}
                        prefix={groupExercise.prefix}
                        positionIndex={exIdx + 1}
                        totalMembers={group.exercises.length}
                        semanticLine={semanticLine}
                      >
                        <div className="flex items-center py-2 px-3 rounded-lg border bg-[#171717] border-[#282828] text-sm text-[#C8C8C8]">
                          <span className="truncate">{safeName}</span>
                        </div>
                      </GroupedMemberFrame>
                    )
                  }
                  return (
                    <div
                      key={groupExercise.id || `${safeName}-${exIdx}`}
                      className="flex items-baseline gap-2 py-1.5 text-sm text-[#C8C8C8]"
                    >
                      <span className="truncate">{safeName}</span>
                    </div>
                  )
                }

                // [GROUPED-MEMBER-FRAME] Special (grouped) members sit in a
                // frame that owns prefix/position/method-glyph identity.
                // The inner ExerciseRow receives `prefix={undefined}` so
                // its faint 10px mono prefix no longer competes with the
                // rail. Flat 'straight' groups render ExerciseRow directly
                // to preserve their existing visual contract.
                if (isSpecialGroup) {
                  return (
                    <GroupedMemberFrame
                      key={fullExercise.id}
                      colors={colors}
                      groupType={group.groupType}
                      prefix={groupExercise.prefix}
                      positionIndex={exIdx + 1}
                      totalMembers={group.exercises.length}
                      semanticLine={semanticLine}
                    >
                      <ExerciseRow
                        exercise={fullExercise}
                        index={globalExerciseIndex}
                        prefix={undefined}
                        sessionId={sessionId}
                        isSkipped={skippedExercises.has(fullExercise.id)}
                        adjustedName={adjustedExercises.get(fullExercise.id)}
                        sessionContext={sessionContextForRows}
                        sessionEvidence={sessionEvidence}
                        coachingExplanation={coachingExplanation}
                        onReplace={onReplace}
                        onSkip={onSkip}
                        onProgressionAdjust={onProgressionAdjust}
                      />
                    </GroupedMemberFrame>
                  )
                }

                return (
                  <ExerciseRow
                    key={fullExercise.id}
                    exercise={fullExercise}
                    index={globalExerciseIndex}
                    prefix={groupExercise.prefix}
                    sessionId={sessionId}
                    isSkipped={skippedExercises.has(fullExercise.id)}
                    adjustedName={adjustedExercises.get(fullExercise.id)}
                    sessionContext={sessionContextForRows}
                    sessionEvidence={sessionEvidence}
                    coachingExplanation={coachingExplanation}
                    onReplace={onReplace}
                    onSkip={onSkip}
                    onProgressionAdjust={onProgressionAdjust}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// =============================================================================
// [ROW-METHOD-RESOLVER] Single authoritative resolver for row-level display
// method truth. Consolidates what was previously two separate inline IIFEs
// (Row 1 chip block and Row 2b MethodOwnershipPanel block) that each read
// `exercise.method` alone and each accepted a narrow label set. That split
// was the hidden uncertainty source: if one gating loop accepted a label
// the other rejected, the row would silently show a half-painted method
// state. It was also fragile to the save/load/normalize cycle because
// `.method` is, per `lib/adaptive-program-builder.ts:1176-1190` and
// `lib/workout/execution-unit-contract.ts:130-132`, the LEGACY field that
// carries GROUPED-STRUCTURE membership -- while SET-EXECUTION identity
// (cluster / rest-pause / top-set / drop-set) is authoritatively carried
// on `.setExecutionMethod` on the single-row exercise.
//
// Resolution order (taxonomy-correct):
//   1. If grouped `prefix` is set OR a non-empty `blockId` is present, the
//      row is INSIDE a grouped frame. Return `isGroupedMember: true`. The
//      grouped frame (or the Row 1 `prefix` mono tag in simple_order
//      fallback) owns method identity; the row-level panel stays silent.
//   2. Read `exercise.setExecutionMethod` FIRST. If present and in the
//      taxonomy-approved set-execution set, that is the authoritative
//      per-row set-execution method. This beats a stale legacy `.method`
//      field on save/load roundtrips that may not have re-applied the
//      builder's dual-write.
//   3. Otherwise read `exercise.method`. Accept every documented label
//      spelling: `'cluster' | 'cluster_set' | 'cluster_sets'` collapse to
//      cluster, `'density' | 'density_block'` collapse to density, etc.
//      `'straight' | 'straight_sets'` and empty return no method.
//
// Return shape is the single truth the ExerciseRow paints from. There
// MUST NOT be any other inline reads of `.method` / `.setExecutionMethod`
// anywhere inside ExerciseRow after this refactor -- the two old IIFEs
// call this resolver so the Row 1 chip and Row 2b panel cannot disagree.
// =============================================================================
type RowMethodFamily = 'cluster' | 'density' | 'superset' | 'circuit' | 'rest_pause' | 'top_set' | 'drop_set' | null

interface RowMethodTruth {
  /** Present (raw) method string found on the exercise, lowercased. Null if none. */
  raw: string | null
  /** The raw field we trusted: 'setExecutionMethod' | 'method' | null. */
  source: 'setExecutionMethod' | 'method' | null
  /** Collapsed taxonomy family. Null = render as straight row. */
  family: RowMethodFamily
  /** True when this row sits inside a grouped structure (prefix or blockId). */
  isGroupedMember: boolean
  /**
   * True when the row should paint the flat METHOD OWNERSHIP PANEL below its
   * prescription line. Strictly: family ∈ row-level set-execution set
   * {cluster, density, top_set, drop_set, rest_pause} AND not grouped AND not
   * warm-up. Superset/circuit are grouped-structure by doctrine and
   * intentionally never paint the flat panel; if they leak onto a flat row
   * (builder bug / variant drift), the tiny 8px fallback chip in Row 1 handles
   * them and does NOT promote to a full panel -- promotion would be dishonest
   * because those methods' meaning requires a grouped partner.
   *
   * [PHASE-3E ROW-LEVEL SET-EXECUTION VISIBLE TRUTH LOCK]
   * Previously this was hard-gated to `cluster | density` only. That meant
   * top_set / drop_set / rest_pause truth (which the builder + selector +
   * resolver all preserved) reached the row, was recognised by `family`, and
   * then silently produced zero visible surface -- the user's "drop-set
   * truth implied but invisible" symptom. The panel is the single visible
   * owner of row-level set-execution truth, so all five row-level families
   * paint through it.
   */
  shouldPaintPanel: boolean
  /** Set-execution panel variant when shouldPaintPanel, else null. */
  panelVariant: 'cluster' | 'density' | 'top_set' | 'drop_set' | 'rest_pause' | null
  /** Uppercase-ready label for panel or chip. */
  label: string | null
  /** One-sentence execution-focused description for the panel. */
  execLine: string | null
}

function resolveRowMethodTruth(
  exercise: AdaptiveExercise,
  opts: { prefix?: string; isWarmupCooldown?: boolean }
): RowMethodTruth {
  const prefix = opts.prefix
  const isWarmup = opts.isWarmupCooldown === true

  const rawExercise = exercise as unknown as {
    method?: string
    setExecutionMethod?: string
    blockId?: string
  }
  const blockId = rawExercise.blockId
  const isGroupedMember = !!prefix || !!(blockId && blockId.trim().length > 0)

  // Authoritative per-row set-execution field wins when present.
  const setExec = (rawExercise.setExecutionMethod || '').toLowerCase().trim()
  // Legacy overloaded method field (grouped-structure identity by doctrine,
  // but still dual-written for cluster/density for back-compat).
  const legacy = (rawExercise.method || '').toLowerCase().trim()

  let raw: string | null = null
  let source: 'setExecutionMethod' | 'method' | null = null
  if (setExec && setExec !== 'straight' && setExec !== 'straight_sets') {
    raw = setExec
    source = 'setExecutionMethod'
  } else if (legacy && legacy !== 'straight' && legacy !== 'straight_sets') {
    raw = legacy
    source = 'method'
  }

  let family: RowMethodFamily = null
  if (raw === 'cluster' || raw === 'cluster_set' || raw === 'cluster_sets') family = 'cluster'
  else if (raw === 'density' || raw === 'density_block') family = 'density'
  else if (raw === 'superset') family = 'superset'
  else if (raw === 'circuit' || raw === 'circuits') family = 'circuit'
  else if (raw === 'rest_pause') family = 'rest_pause'
  else if (raw === 'top_set') family = 'top_set'
  else if (raw === 'drop_set') family = 'drop_set'

  // [PHASE-3E ROW-LEVEL SET-EXECUTION VISIBLE TRUTH LOCK]
  // The row-level set-execution family set is taxonomy-locked to these five.
  // Superset/circuit are grouped-structure -- not row-level -- and never
  // paint the flat panel even when they leak onto a flat row.
  const paintableFamily =
    family === 'cluster' ||
    family === 'density' ||
    family === 'top_set' ||
    family === 'drop_set' ||
    family === 'rest_pause'
  const shouldPaintPanel = paintableFamily && !isGroupedMember && !isWarmup

  let label: string | null = null
  let execLine: string | null = null
  let panelVariant: RowMethodTruth['panelVariant'] = null
  if (family === 'cluster') {
    label = 'Cluster Set'
    execLine = 'Brief 10-20s intra-set rests to preserve rep quality, full rest between sets.'
    if (shouldPaintPanel) panelVariant = 'cluster'
  } else if (family === 'density') {
    label = 'Density Block'
    execLine = 'Complete prescribed work within the timed window, short rests between rounds.'
    if (shouldPaintPanel) panelVariant = 'density'
  } else if (family === 'top_set') {
    // Heavy single working set, then back-off volume. The panel is the only
    // visible carrier of this truth -- prior to Phase 3E this row painted
    // identical to a straight set even when the builder wrote top_set.
    label = 'Top Set + Back-Off'
    execLine = 'One heavy working set at target effort, then back-off sets at reduced load to bank volume.'
    if (shouldPaintPanel) panelVariant = 'top_set'
  } else if (family === 'drop_set') {
    // Mechanical / load-drop continuation past first failure. Visible as a
    // distinct panel so users can see drop_set truth on the program surface
    // without entering live runtime.
    label = 'Drop Set'
    execLine = 'Run the prescribed set to target effort, then immediately reduce load and continue with no rest.'
    if (shouldPaintPanel) panelVariant = 'drop_set'
  } else if (family === 'rest_pause') {
    // Short intra-set pauses to extend a working set past first stop. Row-
    // level method, not a grouped block -- panel is the authoritative owner.
    label = 'Rest-Pause'
    execLine = 'Push the working set to target effort, rack-pause 10-20s, then resume for additional reps until cap.'
    if (shouldPaintPanel) panelVariant = 'rest_pause'
  } else if (family === 'superset') {
    label = 'Superset'
  } else if (family === 'circuit') {
    label = 'Circuit'
  }

  return { raw, source, family, isGroupedMember, shouldPaintPanel, panelVariant, label, execLine }
}

// =============================================================================
// EXERCISE ROW
// =============================================================================

interface ExerciseRowProps {
  exercise: AdaptiveExercise
  index?: number
  prefix?: string // [PHASE 7B] Superset/circuit prefix like A1, A2, B1, etc
  isWarmupCooldown?: boolean
  sessionId?: string
  isSkipped?: boolean
  adjustedName?: string
  // [EXERCISE-ROW-SURFACE] Session context for building authoritative row surface
  sessionContext?: {
    sessionFocus?: string
    isPrimarySession?: boolean
    prescriptionPropagationAudit?: {
      appliedReductions?: {
        setsReduced?: boolean
        rpeReduced?: boolean
      }
    }
    styleMetadata?: {
      primaryStyle?: string
      hasSupersetsApplied?: boolean
      hasDensityApplied?: boolean
    }
  }
  // [AI-EVIDENCE-BRIDGE] Session evidence for row alignment
  sessionEvidence?: SessionAiEvidenceSurface
  // [COACHING-EXPLANATION-CONTRACT] Authoritative exercise explanation from coaching surface
  coachingExplanation?: ProgramExplanationSurface | null
  onReplace?: (exerciseId: string, exerciseName: string) => void
  onSkip?: (exerciseId: string, exerciseName: string) => void
  onProgressionAdjust?: (exerciseId: string, newProgression: string, direction: 'up' | 'down') => void
}

function ExerciseRow({ 
  exercise, 
  index, 
  prefix, // [PHASE 7B] For grouped exercises
  isWarmupCooldown, 
  sessionId,
  isSkipped,
  adjustedName,
  sessionContext, // [EXERCISE-ROW-SURFACE] Session context for row surface
  sessionEvidence, // [AI-EVIDENCE-BRIDGE] For row alignment
  coachingExplanation, // [COACHING-EXPLANATION-CONTRACT] Authoritative coaching surface
  onReplace,
  onSkip,
  onProgressionAdjust,
}: ExerciseRowProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  // TASK 3: Safety guard for malformed exercise data
  if (!exercise || typeof exercise !== 'object') {
    console.warn('[ExerciseRow] Received invalid exercise:', exercise)
    return null
  }
  
  // [WEEK-PROGRESSION-TRUTH] Prefer scaled values when available
  // ScaledExercise adds scaledSets, scaledReps, scaledTargetRPE for week-adjusted dosage
  const scaledExercise = exercise as unknown as { 
    scaledSets?: number
    scaledReps?: string
    scaledTargetRPE?: number
    weekScalingApplied?: boolean 
  }
  const effectiveSets = scaledExercise.scaledSets ?? exercise.sets ?? 3
  const effectiveReps = scaledExercise.scaledReps ?? exercise.repsOrTime ?? '8-12'
  const effectiveTargetRPE = scaledExercise.scaledTargetRPE ?? exercise.targetRPE
  const weekScalingApplied = scaledExercise.weekScalingApplied ?? false
  
  // [EXERCISE-CARD-CONTRACT] Build canonical display contract
  // [RICH-EXPLANATION-FIX] Pass sessionContext to enable goal-aware reasoning in purpose/effort builders
  const card = buildExerciseCardContract({
    name: exercise.name || 'Exercise',
    category: exercise.category || 'accessory',
    sets: effectiveSets,
    repsOrTime: effectiveReps,
    selectionReason: exercise.selectionReason,
    targetRPE: effectiveTargetRPE,
    restSeconds: exercise.restSeconds,
    prescribedLoad: exercise.prescribedLoad as Parameters<typeof buildExerciseCardContract>[0]['prescribedLoad'],
    coachingMeta: exercise.coachingMeta as Parameters<typeof buildExerciseCardContract>[0]['coachingMeta'],
  }, sessionContext ? {
    sessionFocus: sessionContext.sessionFocus,
    isPrimarySession: sessionContext.isPrimarySession,
    primaryGoal: sessionContext.primaryGoal,
    compositionMetadata: sessionContext.compositionMetadata
  } : undefined)
  
  // [EXERCISE-ROW-SURFACE] Build authoritative row surface for enhanced display
  // [WEEK-PROGRESSION-TRUTH] Use scaled values for week-appropriate dosage display
  const rowSurface = !isWarmupCooldown ? buildExerciseRowSurface(
    {
      id: exercise.id,
      name: exercise.name || 'Exercise',
      category: exercise.category || 'accessory',
      sets: effectiveSets,
      repsOrTime: effectiveReps,
      targetRPE: effectiveTargetRPE,
      restSeconds: exercise.restSeconds,
      selectionReason: exercise.selectionReason,
      isProtected: (exercise as unknown as { isProtected?: boolean }).isProtected,
      isPrimary: (exercise as unknown as { isPrimary?: boolean }).isPrimary,
      prescribedLoad: exercise.prescribedLoad as Parameters<typeof buildExerciseRowSurface>[0]['prescribedLoad'],
      coachingMeta: exercise.coachingMeta as Parameters<typeof buildExerciseRowSurface>[0]['coachingMeta'],
      constraintApplied: (exercise as unknown as { constraintApplied?: string }).constraintApplied,
      groupId: (exercise as unknown as { groupId?: string }).groupId,
    },
    sessionContext
  ) : null
  
  // [AI-EVIDENCE-BRIDGE] Align row surface with session evidence for consistency
  const alignedRowSurface = rowSurface && sessionEvidence 
    ? alignRowWithSessionEvidence(rowSurface, sessionEvidence)
    : rowSurface

  // [ROW-METHOD-TRUTH] Resolve the single authoritative method truth for this
  // row ONCE per render. Both the Row 1 fallback chip and the Row 2b Method
  // Ownership Panel read from this object -- they cannot go out of sync.
  //
  // [FINAL-VISIBLE-OWNERSHIP-LOCK] The previous render-loop console.log
  // (`[v0] row-method-truth`) emitted one entry per visible exercise per paint
  // of the Program page -- pure dev observability with no athlete-facing
  // surface. Removed; the row's truth is already structurally consumed by the
  // chip + panel below.
  const rowMethodTruth = resolveRowMethodTruth(exercise, { prefix, isWarmupCooldown })

  const hasRPE = !isWarmupCooldown && exerciseSupportsRPE(card.displayTitle)
  const exerciseId = card.displayTitle.toLowerCase().replace(/[\s-]+/g, '_')
  const hasKnowledge = hasExerciseKnowledge(exerciseId)
  
  // Display name - show adjusted name if progression was changed
  const displayName = adjustedName || card.displayTitle

  // Skipped state - compact
  if (isSkipped) {
    return (
      <div className="py-2 px-3 rounded-lg border bg-[#141414] border-[#222] opacity-50">
        <div className="flex items-center gap-2">
          {index && <span className="text-[10px] text-[#4A4A4A] font-mono">{index}.</span>}
          <SkipForward className="w-3 h-3 text-[#4A4A4A]" />
          <span className="text-xs text-[#5A5A5A] line-through">{card.displayTitle}</span>
          <span className="text-[9px] text-[#4A4A4A] ml-auto">skipped</span>
        </div>
      </div>
    )
  }

  // Build unified prescription line - clean, scannable
  const prescriptionParts: string[] = [card.prescriptionLine]
  if (card.loadBadge) prescriptionParts.push(card.loadBadge)
  if (hasRPE && card.intensityBadge) prescriptionParts.push(card.intensityBadge)
  if (card.restGuidance) prescriptionParts.push(card.restGuidance)
  const unifiedPrescription = prescriptionParts.join(' · ')
  
  // Intent determines accent color
  const intentAccent: Record<string, string> = {
    max_strength: 'text-blue-400',
    strength_volume: 'text-blue-300',
    skill_acquisition: 'text-[#E63946]',
    skill_intensity: 'text-[#E63946]',
    explosive_power: 'text-amber-400',
    hypertrophy: 'text-purple-400',
    support_strength: 'text-[#6A6A6A]',
    technical_carryover: 'text-teal-400',
    tissue_prep: 'text-[#6A6A6A]',
    density_conditioning: 'text-orange-400',
  }
  
  // [SINGLE-TRUTH-FIX] showContextCue removed - prescriptionContext was a stale secondary path

  // [WARM-UP-ROW-CONTRACT-RESTORED] Warm-up rows previously had their own
  // richer contract: a green identity accent (left border + WARMUP tag) plus
  // the per-row `selectionReason` italic subtitle so each warm-up exercise
  // showed WHY it was prescribed. A recent regression collapsed warm-up rows
  // into a near-silent gray variant of the main row (name + prescription line
  // only), which is what "plain stripped warm-up" refers to. This block
  // restores the prior warm-up row contract without re-introducing main-row
  // surfaces that were intentionally suppressed for warm-up rows (no intent
  // label, no InfoBubble, no knowledge expansion, no action menu).
  const warmupReason = isWarmupCooldown ? (exercise.selectionReason || '').trim() : ''

  return (
    <div className={`py-2 px-3 rounded-lg border transition-colors ${
      isWarmupCooldown
        // [WARM-UP-STYLE-DEMOTED] Keep the richer row contract (identity tag +
        // per-row reason italic) but strip the heavy emerald-washed background
        // and left-accent border. Rows now sit on the same dark container as
        // main rows (`bg-[#151515] border-[#222]`), with green expressed ONLY
        // through the small `Warm-Up` tag -- cleaner, less saturated, closer
        // to the pre-regression look. Structure and contract unchanged.
        ? 'bg-[#151515] border-[#222]'
        : adjustedName
          ? 'bg-[#171717] border-[#4F6D8A]/20'
          : 'bg-[#171717] border-[#282828] hover:border-[#3A3A3A]'
    }`}>
      {/* ROW 1: Name + Intent + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {(prefix || index) && (
            <span className="text-[10px] text-[#4A4A4A] font-mono shrink-0">{prefix || `${index}.`}</span>
          )}
          <p className="font-medium text-[#E5E5E5] text-[13px] truncate">{displayName}</p>
          {isWarmupCooldown ? (
            // [WARM-UP-STYLE-DEMOTED] Warm-up identity tag remains the sole
            // green accent in the row -- small, restrained, not saturated.
            <span className="text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/80 shrink-0">
              Warm-Up
            </span>
          ) : (
            <span className={`text-[9px] shrink-0 ${intentAccent[card.prescriptionIntent] || 'text-[#5A5A5A]'}`}>
              {card.intentLabel}
            </span>
          )}
          {/*
            [ROW-LEVEL-METHOD-CUE]
            Single-exercise execution methods (cluster, density) sometimes land
            on a row that is NOT wrapped in a grouped block frame -- typically
            when the builder emits the method without a blockId, or when a
            density has only one visible member (density min=2 in the grouped
            adapter). Before this pill existed, those rows rendered as plain
            flat rows while the scanner + method-summary chips were still
            asserting grouped/method truth upstream, producing the "flat-lie"
            symptom.

            This pill is the honest row-level method cue: rendered ONLY when
              (a) the exercise carries a non-straight `method`, AND
              (b) no grouped `prefix` is set (i.e., the row is NOT inside a
                  grouped block frame -- grouped frames already own the
                  method identity via their pill header + colored rail).
            It never appears on warm-up rows. Colors match the grouped
            palette (cluster=purple, density=amber, superset=blue,
            circuit=emerald) so the visual language is continuous across
            flat rows, grouped-body headlines, and block headers.
          */}
          {/*
            [ROW-HEADER-METHOD-CHIP-DELEGATED]
            Cluster / density identity is OWNED by the dedicated Method
            Ownership Panel below the prescription line (Row 2b). This
            Row 1 slot only paints a small fallback chip for flat-row
            superset / circuit leaks, which are grouped-structure by
            doctrine and should almost never appear on a bare flat row.
            All method resolution goes through the single authoritative
            `resolveRowMethodTruth` helper so chip and panel cannot
            disagree or disagree on label casing.
          */}
          {(() => {
            if (isWarmupCooldown) return null
            if (prefix) return null
            if (rowMethodTruth.isGroupedMember) return null
            if (rowMethodTruth.family !== 'superset' && rowMethodTruth.family !== 'circuit') return null
            const chipClass = rowMethodTruth.family === 'superset'
              ? 'bg-[#4F6D8A]/15 text-[#7FA8CC] border border-[#4F6D8A]/40'
              : 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/35'
            return (
              <span
                className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0 ${chipClass}`}
                title={`Execution method: ${rowMethodTruth.label}`}
              >
                {rowMethodTruth.label}
              </span>
            )
          })()}
          {adjustedName && (
            <span className="text-[8px] px-1 rounded bg-[#4F6D8A]/10 text-[#4F6D8A] shrink-0">adj</span>
          )}
        </div>
        {!isWarmupCooldown && exercise.isOverrideable && sessionId && onReplace && onSkip && onProgressionAdjust && (
          <ExerciseActionMenu
            exercise={exercise}
            sessionId={sessionId}
            onReplace={onReplace}
            onSkip={onSkip}
            onProgressionAdjust={onProgressionAdjust}
          />
        )}
      </div>
      
      {/* ROW 2: Unified prescription - SINGLE VISIBLE DOSAGE TRUTH */}
      {/* [CANONICAL-DISPLAY-CONTRACT] All fields from buildExerciseCardContract in program-display-contract.ts */}
      {/* DOSAGE OWNER: prescriptionLine, intensityBadge, restGuidance */}
      {/* EXPLANATION OWNER: prescriptionContext (derived from same prescriptionIntent) */}
      {/* BANNED STALE SOURCES: exercise.note (doctrineFinalNote), alignedRowSurface chips, getBestRowSublabel */}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-[13px] font-medium text-[#CACACA]">{card.prescriptionLine}</span>
        {card.intensityBadge && hasRPE && (
          <span className="text-[11px] text-[#7A7A7A]">{card.intensityBadge}</span>
        )}
        {card.restGuidance && (
          <span className="text-[10px] text-[#5A5A5A]">{card.restGuidance}</span>
        )}
        {/* [PHASE 4Z / PHASE I] NUMERIC PRESCRIPTION MUTATION CHIP.
            Single compact chip that surfaces the per-row numeric mutation
            outcome stamped by lib/program/numeric-prescription-mutation-contract.ts.
            Three honest states:
              - mutated   = "Sets 3 → 4", "Reps 8-12 → 8-10", "Hold 30s → 25s"
                            (visibleLabel from contract; one chip per row)
              - protected = "Protected: skill_priority"   (no fake delta)
              - clamped   = same label as mutated, with a thin amber dot to
                            mark MUTATION_CLAMPED_TO_SAFE_BOUND.
            Contract guarantees this is the SAME truth the live workout
            consumes (preserved via load-authoritative-session.ts and
            normalize-workout-session.ts) -- no Program-only mutation.
            Hidden for warmup/cooldown rows. */}
        {!isWarmupCooldown && (() => {
          const numericDelta = (exercise as unknown as {
            numericPrescriptionDelta?: {
              status?: string
              visibleLabel?: string
              clamped?: boolean
              protectedBy?: string | null
              fieldChanges?: Array<unknown>
            }
          }).numericPrescriptionDelta
          if (!numericDelta) return null
          const status = numericDelta.status
          const label = numericDelta.visibleLabel
          if (!label) return null
          // Only show a chip when there is actual content to render: an
          // applied mutation, a clamped mutation, or a protection that
          // explains why an eligible doctrine signal did NOT mutate the row.
          // Silently skip "no change" / "no doctrine signal" cases to keep
          // the row compact for the common path.
          const isMutated = status === 'mutated'
          const isProtectedWithReason =
            status === 'protected' && !!numericDelta.protectedBy
          if (!isMutated && !isProtectedWithReason) return null
          const chipClass = isMutated
            ? numericDelta.clamped
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            : 'bg-[#3A3A3A]/40 text-[#9A9A9A] border border-[#4A4A4A]/40'
          const titleText = isMutated
            ? numericDelta.clamped
              ? `Doctrine-driven dosage change (clamped to safe bound): ${label}`
              : `Doctrine-driven dosage change: ${label}`
            : `Numeric mutation skipped: ${label}`
          return (
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0 ${chipClass}`}
              title={titleText}
              aria-label={titleText}
            >
              {label}
            </span>
          )
        })()}
        {/* [PHASE-L] POST-WORKOUT PERFORMANCE FEEDBACK PROOF CHIP.
            Single compact chip surfacing the per-row adaptation stamped by
            lib/program/performance-feedback-adaptation-contract.ts after a
            recent workout produced an under-target high-RPE / repeated
            fatigue / tension / pain signal. Three honest variants:
              - protective (held / reduced volume / lowered RPE): teal chip
              - blocked (safety bound prevented apply): muted chip with
                blocked title text so users see honesty rather than a fake
                "adapted" claim
              - skipped: nothing renders.
            The chip's `aria-label` and `title` carry the
            `userVisibleExplanation` string built from actual mutation
            evidence — never invented. Hidden for warmup/cooldown rows.
            Single-line, never wraps the row container. */}
        {!isWarmupCooldown && (() => {
          const adaptation = (exercise as unknown as {
            performanceAdaptation?: {
              applied?: boolean
              status?: string
              mutationType?: string
              userVisibleExplanation?: string
              shortLabel?: string
              reasonCodes?: string[]
              // [PHASE-O] Optional trend / coach slices, present when the
              // resolver detected multi-session trend evidence on this row.
              // Absent on legacy stamps and on rows without repeated evidence.
              trendIntelligence?: {
                trendCodes?: string[]
                movementPattern?: string
                severity?: 'low' | 'moderate' | 'high'
                confidence?: 'low' | 'medium' | 'high'
                conciseExplanation?: string
                setCount?: number
                sessionCount?: number
              }
              coachDecision?: {
                action?: string
                explanation?: string
              }
            }
          }).performanceAdaptation
          if (!adaptation) return null
          const explanation = adaptation.userVisibleExplanation
          const shortLabel = adaptation.shortLabel
          if (!shortLabel || !explanation) return null
          const isApplied = adaptation.applied === true
          const chipClass = isApplied
            ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
            : 'bg-[#3A3A3A]/40 text-[#9A9A9A] border border-[#4A4A4A]/40'
          const titleText = isApplied
            ? `Adjusted from last workout: ${explanation}`
            : `Performance signal blocked by safety bound: ${explanation}`
          return (
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0 ${chipClass}`}
              title={titleText}
              aria-label={titleText}
              data-phase-l-proof="true"
              data-phase-o-trend-codes={adaptation.trendIntelligence?.trendCodes?.join(',') || undefined}
              data-phase-o-coach-action={adaptation.coachDecision?.action || undefined}
            >
              {shortLabel}
            </span>
          )
        })()}
      </div>

      {/* [PHASE-P] Quality / doctrine audit proof line — concise sibling line
          rendered under the chip row, ABOVE the Phase O line, when the Phase P
          resolver attached a `qualityAudit` slice carrying a non-trivial
          finding. Single DOM block to avoid stacking multiple audit surfaces:
            - tendon RPE cap correction → "Doctrine: tendon RPE held to N"
            - skill carryover attribution → "Skill carryover: <skill> via <rationale>"
            - unilateral per-side hint → "Per side"
          Renders nothing on warm-up/cooldown rows and nothing when no Phase P
          finding applies, so the UI never invents quality claims. */}
      {!isWarmupCooldown && (() => {
        const qa = (exercise as unknown as {
          qualityAudit?: {
            applied?: boolean
            corrections?: string[]
            shortLabel?: string
            conciseExplanation?: string
            skillCarryover?: { skill?: string; confidence?: 'low' | 'medium' | 'high'; rationale?: string }
            rpeCap?: { before?: number; after?: number; reason?: string }
            unilateralPerSide?: { addedNote?: string }
          }
        }).qualityAudit
        if (!qa) return null
        const corrections = Array.isArray(qa.corrections) ? qa.corrections : []
        // Insufficient-finding stamps (only ['no_change']) render nothing —
        // matches Phase O policy of "do not invent proof."
        const hasFinding =
          corrections.some((c) => c !== 'no_change') ||
          !!qa.skillCarryover ||
          !!qa.rpeCap ||
          !!qa.unilateralPerSide
        if (!hasFinding) return null
        const dominant: string = (() => {
          if (corrections.includes('tendon_rpe_capped') && qa.rpeCap) {
            const after = typeof qa.rpeCap.after === 'number' ? qa.rpeCap.after : null
            return after !== null ? `Doctrine: tendon RPE held at ${after}` : 'Doctrine: tendon RPE protected'
          }
          if (corrections.includes('skill_carryover_attributed') && qa.skillCarryover?.skill) {
            const niceSkill = qa.skillCarryover.skill.replace(/_/g, ' ')
            const confTail =
              qa.skillCarryover.confidence === 'high'
                ? ''
                : qa.skillCarryover.confidence === 'medium'
                  ? ' (indirect)'
                  : ''
            return `Skill carryover: ${niceSkill}${confTail}`
          }
          if (corrections.includes('unilateral_per_side_note_added')) {
            return 'Per side'
          }
          return ''
        })()
        if (!dominant) return null
        const fullTitle =
          qa.conciseExplanation ||
          qa.skillCarryover?.rationale ||
          qa.rpeCap?.reason ||
          'Quality audit'
        return (
          <p
            className="mt-1 text-[10px] text-amber-300/70 italic leading-snug"
            title={fullTitle}
            aria-label={fullTitle}
            data-phase-p-proof="true"
            data-phase-p-corrections={corrections.join(',') || undefined}
          >
            {dominant}
          </p>
        )
      })()}

      {/* [PHASE-O] Trend / coach proof line — concise second line under
          the existing performanceAdaptation chip when the resolver attached
          a trend slice. Only renders when:
            (a) the row is not a warm-up / cooldown,
            (b) the row carries a performanceAdaptation stamp, AND
            (c) that stamp carries a Phase O trendIntelligence or coachDecision
                slice with a non-empty conciseExplanation / action.
          Renders nothing when the trend layer had insufficient repeated
          evidence so the UI never invents trend claims. The same DOM block
          owns BOTH the trend label AND the coach-decision microcopy so users
          see the reason chain on a single compact line, not two competing
          surfaces. */}
      {!isWarmupCooldown && (() => {
        const adaptation = (exercise as unknown as {
          performanceAdaptation?: {
            applied?: boolean
            trendIntelligence?: {
              trendCodes?: string[]
              movementPattern?: string
              severity?: 'low' | 'moderate' | 'high'
              confidence?: 'low' | 'medium' | 'high'
              conciseExplanation?: string
              setCount?: number
              sessionCount?: number
            }
            coachDecision?: {
              action?: string
              explanation?: string
            }
          }
        }).performanceAdaptation
        if (!adaptation) return null
        const trend = adaptation.trendIntelligence
        const coach = adaptation.coachDecision
        const hasTrend = !!trend && Array.isArray(trend.trendCodes) && trend.trendCodes.length > 0
        const hasCoach = !!coach && typeof coach.action === 'string' && coach.action.length > 0
        if (!hasTrend && !hasCoach) return null
        // Honest "no change" trend on insufficient data is still useful proof,
        // but only when the resolver ALSO produced a chip — otherwise we'd
        // be adding noise to every row. We already gated on `adaptation`
        // existing above, so this is satisfied by construction.
        const trendCodes = trend?.trendCodes ?? []
        // Build a short trend label from the dominant trend code.
        const trendLabel = (() => {
          if (trendCodes.includes('joint_caution_pressure_detected')) return 'caution flag'
          if (trendCodes.includes('skill_tension_limiter_detected')) return 'tension limiter'
          if (trendCodes.includes('overreaching_risk')) return 'overreaching risk'
          if (trendCodes.includes('repeated_under_target') && trendCodes.includes('repeated_high_rpe'))
            return 'repeated high effort under target'
          if (trendCodes.includes('repeated_high_rpe')) return 'repeated high RPE'
          if (trendCodes.includes('repeated_under_target')) return 'repeated under target'
          if (trendCodes.includes('capacity_limiter_detected')) return 'capacity limiter'
          if (trendCodes.includes('progressing_well')) return 'progressing well'
          if (trendCodes.includes('stable_on_target')) return 'stable on target'
          if (trendCodes.includes('high_effort_on_target')) return 'on target at high effort'
          if (trendCodes.includes('insufficient_data')) return null
          return null
        })()
        // Coach action label — short, plain English.
        const coachLabel = (() => {
          switch (coach?.action) {
            case 'hold_progression': return 'hold progression'
            case 'reduce_volume': return 'reduce volume'
            case 'lower_rpe_target': return 'lower RPE target'
            case 'extend_rest': return 'extend rest'
            case 'preserve_current_dose': return 'preserve dose'
            case 'small_progression': return 'small progression'
            case 'maintain_and_monitor': return 'maintain and monitor'
            case 'technique_focus': return 'technique focus'
            case 'deload_candidate': return 'deload candidate'
            case 'insufficient_data_no_change': return 'no change — insufficient data'
            default: return null
          }
        })()
        if (!trendLabel && !coachLabel) return null
        const setCount = trend?.setCount ?? 0
        const sessionCount = trend?.sessionCount ?? 0
        const evidenceTail =
          setCount > 0 && sessionCount > 0
            ? ` · ${setCount} set${setCount === 1 ? '' : 's'} · ${sessionCount} session${sessionCount === 1 ? '' : 's'}`
            : ''
        const fullTitle =
          (trend?.conciseExplanation ? `Trend: ${trend.conciseExplanation}` : '') +
          (coach?.explanation
            ? `${trend?.conciseExplanation ? ' · ' : ''}Coach: ${coach.explanation}`
            : '')
        return (
          <p
            className="mt-1 text-[10px] text-teal-300/70 italic leading-snug"
            title={fullTitle || undefined}
            aria-label={fullTitle || 'Performance trend'}
            data-phase-o-proof="true"
          >
            {trendLabel && <span>Trend: {trendLabel}</span>}
            {trendLabel && coachLabel && <span className="text-[#5A5A5A]"> · </span>}
            {coachLabel && <span>Coach: {coachLabel}</span>}
            {evidenceTail && <span className="text-[#5A5A5A]">{evidenceTail}</span>}
          </p>
        )
      })()}

      {/* ROW 2b: [METHOD-OWNERSHIP-PANEL]
          ONE authoritative visible method surface for flat method-only rows
          (no grouped `prefix`). Replaces the prior weak 8px chip + 10px
          muted italic microcopy that the user reported as "basically still
          looks flat." Design contract:
            - 4px solid colored rail (not a dashed / soft accent): the rail
              is the primary eye-catcher, locks the row as "special" at a
              glance without faking a grouped header.
            - Icon tile (colored background, 20px) carrying the method icon
              (Repeat for cluster, Timer for density): matches the grouped
              body headline and the session-level chip row palette so the
              visual vocabulary is consistent across all method surfaces.
            - Uppercase 11px label ("CLUSTER SET" / "DENSITY BLOCK") --
              noticeably larger and more prominent than the prior 8px chip
              and 10px italic microcopy, using full-opacity brand text.
            - 11px execution sentence on the second line: readable, not
              muted into the grey-on-grey band the prior microcopy used.
            - Compact: ~36px tall total, inside the existing row container.
              No fake grouped frame, no member rails, no extra vertical
              bloat that would over-promise grouped structure.
          Rendered ONLY when:
            (a) not a warm-up/cooldown row,
            (b) no grouped `prefix` is set (grouped frames already own
                method identity via their own header + rail),
            (c) the exercise carries `method: 'cluster' | 'cluster_sets'`
                or `method: 'density' | 'density_block'`.
          Superset/circuit do not paint this panel -- those are grouped-
          structure methods and should only appear inside a real grouped
          frame; if they leak onto a flat row the small fallback chip in
          Row 1 remains. Straight rows render zero method surface. */}
      {rowMethodTruth.shouldPaintPanel && rowMethodTruth.panelVariant && (() => {
        // [PHASE-3E ROW-LEVEL SET-EXECUTION VISIBLE TRUTH LOCK]
        // Per-variant visual treatment for all five row-level set-execution
        // methods. Each variant gets a distinct rail color + icon so the user
        // can visibly tell apart cluster / density / top-set / drop-set /
        // rest-pause rows at a glance, without entering live workout runtime.
        // The structural template (rail + icon tile + label + exec line) is
        // identical across variants -- only color and icon vary -- so the
        // visual vocabulary stays consistent and there's no UI redesign.
        const variant = rowMethodTruth.panelVariant
        // Icon mapping uses already-imported lucide icons:
        //   cluster   -> Repeat   (intra-set bursts then resume)
        //   density   -> Timer    (timed window)
        //   top_set   -> Dumbbell (one heavy working set)
        //   drop_set  -> Layers   (descending load layers)
        //   rest_pause-> Zap      (short pause then continue)
        const Icon =
          variant === 'cluster' ? Repeat
          : variant === 'density' ? Timer
          : variant === 'top_set' ? Dumbbell
          : variant === 'drop_set' ? Layers
          : Zap
        // Color palette: existing cluster=purple / density=amber kept; new
        // row-level variants use rose / orange / teal to stay distinguishable
        // from grouped methods (superset=blue, circuit=emerald) without
        // adding new pages of color tokens.
        const railColor =
          variant === 'cluster' ? 'bg-purple-500'
          : variant === 'density' ? 'bg-amber-500'
          : variant === 'top_set' ? 'bg-rose-500'
          : variant === 'drop_set' ? 'bg-orange-500'
          : 'bg-teal-500'
        const iconTileBg =
          variant === 'cluster' ? 'bg-purple-500/20'
          : variant === 'density' ? 'bg-amber-500/20'
          : variant === 'top_set' ? 'bg-rose-500/20'
          : variant === 'drop_set' ? 'bg-orange-500/20'
          : 'bg-teal-500/20'
        const iconColor =
          variant === 'cluster' ? 'text-purple-300'
          : variant === 'density' ? 'text-amber-300'
          : variant === 'top_set' ? 'text-rose-300'
          : variant === 'drop_set' ? 'text-orange-300'
          : 'text-teal-300'
        const labelColor =
          variant === 'cluster' ? 'text-purple-200'
          : variant === 'density' ? 'text-amber-200'
          : variant === 'top_set' ? 'text-rose-200'
          : variant === 'drop_set' ? 'text-orange-200'
          : 'text-teal-200'
        const execColor =
          variant === 'cluster' ? 'text-purple-300/90'
          : variant === 'density' ? 'text-amber-300/90'
          : variant === 'top_set' ? 'text-rose-300/90'
          : variant === 'drop_set' ? 'text-orange-300/90'
          : 'text-teal-300/90'
        return (
          <div
            className="mt-2 flex items-stretch gap-2 rounded-md bg-[#121212] border border-[#262626] overflow-hidden"
            role="note"
            aria-label={`Execution method: ${rowMethodTruth.label}`}
          >
            <div className={`w-1 shrink-0 ${railColor}`} aria-hidden="true" />
            <div className={`flex items-center justify-center w-7 my-1.5 ${iconTileBg} rounded`} aria-hidden="true">
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
            <div className="flex-1 py-1.5 pr-2 min-w-0">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${labelColor} leading-tight`}>
                {rowMethodTruth.label}
              </div>
              <div className={`text-[11px] ${execColor} leading-snug mt-0.5`}>
                {rowMethodTruth.execLine}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ROW 3a: [WARM-UP-ROW-CONTRACT-RESTORED] Per-row warm-up selectionReason.
          This is the "prior supporting subtitle / intent line behavior" that the
          regression stripped. Main rows have their own whyLine/detailExplanation
          contract below, which remains gated by !isWarmupCooldown.
          [WARM-UP-STYLE-DEMOTED] Uses the same neutral italic treatment as the
          main-row whyLine (`text-[#6A6A6A]`) so warm-up rows no longer feel
          green-washed -- the only green in the row is the small identity tag. */}
      {isWarmupCooldown && warmupReason && (
        <p className="text-[10px] text-[#6A6A6A] italic mt-1">
          {warmupReason}
        </p>
      )}

      {/* ROW 3: Canonical explanation - TWO LEVELS from SAME canonical contract */}
      {/* [SUMMARY-OWNER] whyLine = visible card summary (concise WHY) */}
      {/* [DETAIL-OWNER] detailExplanation = InfoBubble content (richer purpose + effort) */}
      {/* [COMPACT-CUE] prescriptionContext = fallback execution cue */}
      {/* All from buildExerciseCardContract - same canonical source, no contradiction possible */}
      {/* BANNED: exercise.note, alignedRowSurface, getBestRowSublabel, old coaching fallbacks */}
      {!isWarmupCooldown && (card.whyLine || card.prescriptionContext) && (
        <div className="flex items-center gap-1 mt-1">
          <p className="text-[10px] text-[#6A6A6A] italic">
            {/* Summary: prefer whyLine (WHY this exercise) over prescriptionContext (HOW to execute) */}
            {card.whyLine || card.prescriptionContext}
          </p>
          {/* InfoBubble: richer detail from same canonical contract */}
          {card.detailExplanation && card.detailExplanation !== card.whyLine && (
            <InfoBubble content={card.detailExplanation} />
          )}
        </div>
      )}
      
      {/* Constraint note kept - this is safety/equipment info, not prescription wording */}
      {card.constraintNote && (
        <p className="text-[10px] text-amber-400/70 mt-1">{card.constraintNote}</p>
      )}
      
      {/* Knowledge expansion - only for main exercises with knowledge */}
      {!isWarmupCooldown && hasKnowledge && (
        showDetails ? (
          <div className="mt-1.5 pt-1.5 border-t border-[#222]">
            <button className="text-[9px] text-[#5A5A5A] hover:text-[#7A7A7A] mb-1.5" onClick={() => setShowDetails(false)}>
              − hide
            </button>
            <ExerciseKnowledgeBubble exerciseId={exerciseId} showSkillCarryover showSafetyNote />
          </div>
        ) : (
          <button className="mt-1 text-[9px] text-[#3A3A3A] hover:text-[#6A6A6A]" onClick={() => setShowDetails(true)}>
            + info
          </button>
        )
      )}
    </div>
  )
}
