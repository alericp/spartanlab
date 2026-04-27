// =============================================================================
// [PHASE-S] TRUST DISPLAY CONTRACT
// -----------------------------------------------------------------------------
// PURE PRESENTATION HELPER. Phase S is a UI cleanup phase, not a doctrine,
// builder, or runtime phase. This module owns ONE thing: deterministic
// mappings from the raw causal-trace states stamped by Phase Q
// (`doctrineUtilizationTrace`) and the verdict states stamped by Phase R
// (`sessionLengthTruth`) to short, user-friendly labels and severity tones.
//
// Hard rules (so this file cannot be misused):
//   - It NEVER reads a session's exercises[] or variants[] body.
//   - It NEVER mutates anything.
//   - It NEVER recomputes trust — it only maps existing stamped truth to
//     short coach-facing labels and tone tokens for the card UI.
//   - It NEVER hides causal weakness; ACKNOWLEDGED_ONLY and POST_HOC_ONLY
//     get truthful "Considered" / "Explained only" labels — never "Applied".
//
// What this module replaces in the card UI:
//   - The four stacked proof IIFEs in the session-card header (Phase J/K
//     stress chip, Phase P quality chip, Phase Q doctrine summary line,
//     Phase R session-length summary line). Phase S compresses those into
//     ONE always-visible coaching summary plus a single "Why this plan?"
//     dropdown that contains every original line preserved verbatim with
//     all `data-phase-*` data attributes intact for screenshot verification.
//
// What this module does NOT change:
//   - The underlying `session.doctrineUtilizationTrace`, `session.sessionLengthTruth`,
//     `session.qualityAudit`, `session.stressDistributionProof`, and
//     `session.methodDecision` fields are read-only inputs.
//   - The raw `dominantState` / `verdict` / `corrections` strings remain on
//     the session and remain on the rendered DOM via `data-*` attributes
//     so dev probes, screenshots, and tests still verify the truth.
//
// Phase preservation note: Phase J/K/L/M/N/O/P/Q/R logic is untouched.
// =============================================================================

// -----------------------------------------------------------------------------
// Raw causal-trace state literal — kept identical to the union written by
// Phase Q so this file has zero risk of drifting from doctrine truth.
// -----------------------------------------------------------------------------
export type DoctrineUtilizationState =
  | 'ELIGIBLE_AND_APPLIED'
  | 'ELIGIBLE_BUT_SUPPRESSED'
  | 'NOT_ELIGIBLE'
  | 'BLOCKED_BY_UNSUPPORTED_RUNTIME'
  | 'ACKNOWLEDGED_ONLY'
  | 'POST_HOC_ONLY'

// -----------------------------------------------------------------------------
// Severity tone tokens — design system safe. Map straight to Tailwind class
// strings the card already uses elsewhere so Phase S adds zero new colors.
// -----------------------------------------------------------------------------
export type TrustTone =
  | 'positive' // applied, protected, healthy adaptation
  | 'caution' // suppressed, recovery caution
  | 'blocked' // runtime blocked / cannot execute
  | 'neutral' // considered / not eligible / informational
  | 'muted' // explained-only, post-hoc

export interface TrustToneClasses {
  /** classes for an inline pill / badge */
  pill: string
  /** classes for a row label sentence */
  text: string
}

const TONE_CLASSES: Record<TrustTone, TrustToneClasses> = {
  positive: {
    pill: 'border border-teal-500/30 bg-teal-500/10 text-teal-300',
    text: 'text-teal-300',
  },
  caution: {
    pill: 'border border-amber-500/30 bg-amber-500/5 text-amber-300',
    text: 'text-amber-300',
  },
  blocked: {
    pill: 'border border-[#3A3A3A] bg-[#1F1F1F] text-[#9A9A9A]',
    text: 'text-[#9A9A9A]',
  },
  neutral: {
    pill: 'border border-[#2B313A] bg-[#161A21] text-[#E6E9EF]',
    text: 'text-[#A1A8B2]',
  },
  muted: {
    pill: 'border border-[#2A2A2A] bg-[#161A21] text-[#6F757D]',
    text: 'text-[#6F757D] italic',
  },
}

export function trustToneClasses(tone: TrustTone): TrustToneClasses {
  return TONE_CLASSES[tone]
}

// -----------------------------------------------------------------------------
// Raw doctrine-trace state → user-friendly coach label.
// These mirror the Phase S spec EXACTLY — do not adjust without updating the
// blueprint. Acknowledged / explained-only states stay honestly muted so the
// UI never claims a non-causal signal as causal.
// -----------------------------------------------------------------------------
export interface DoctrineStateLabel {
  /** short coach-facing label e.g. "Applied" */
  label: string
  /** longer "what this actually means for this session" line */
  meaning: string
  /** severity tone for the pill / row */
  tone: TrustTone
}

const DOCTRINE_STATE_LABELS: Record<DoctrineUtilizationState, DoctrineStateLabel> = {
  ELIGIBLE_AND_APPLIED: {
    label: 'Applied',
    meaning: 'This rule shaped today\u2019s session.',
    tone: 'positive',
  },
  ELIGIBLE_BUT_SUPPRESSED: {
    label: 'Suppressed',
    meaning:
      'Eligible today, but skipped for safety, recovery, priority, time, or runtime compatibility.',
    tone: 'caution',
  },
  NOT_ELIGIBLE: {
    label: 'Not needed today',
    meaning: 'This rule does not apply to today\u2019s session.',
    tone: 'neutral',
  },
  BLOCKED_BY_UNSUPPORTED_RUNTIME: {
    label: 'Blocked by workout runtime',
    meaning:
      'The rule is recognized, but the live workout cannot safely execute it yet. Held back honestly instead of forced.',
    tone: 'blocked',
  },
  ACKNOWLEDGED_ONLY: {
    label: 'Considered',
    meaning:
      'Your preference or this rule was considered, but did not directly change today\u2019s session.',
    tone: 'muted',
  },
  POST_HOC_ONLY: {
    label: 'Explained only',
    meaning:
      'Surfaced as context after the session was already shaped — not a causal driver today.',
    tone: 'muted',
  },
}

export function doctrineStateLabel(
  state: DoctrineUtilizationState | string | null | undefined,
): DoctrineStateLabel {
  if (state && Object.prototype.hasOwnProperty.call(DOCTRINE_STATE_LABELS, state)) {
    return DOCTRINE_STATE_LABELS[state as DoctrineUtilizationState]
  }
  // Defensive default for unknown future states — never claim causality we
  // cannot verify.
  return {
    label: 'Considered',
    meaning: 'No detailed trace available for this rule on this session.',
    tone: 'muted',
  }
}

// -----------------------------------------------------------------------------
// Phase R session-length verdict mapping. The Phase R contract emits one of
// four verdicts per session — Phase S maps each to a short label + tone for
// the always-visible header summary and the "Why this plan?" detail panel.
// -----------------------------------------------------------------------------
export type SessionLengthVerdict =
  | 'STRUCTURALLY_REAL'
  | 'SHORTS_AT_LABEL_PARITY'
  | 'NO_LAUNCHABLE_SHORTS'
  | 'LEGACY_NO_VARIANTS'

export interface SessionLengthLabel {
  label: string
  tone: TrustTone
  /**
   * If true the verdict is informational only and Phase S suppresses it from
   * the always-visible card header to keep the surface clean (it remains in
   * the "Why this plan?" details panel for screenshot verification).
   */
  hideOnHeader: boolean
}

const SESSION_LENGTH_LABELS: Record<SessionLengthVerdict, SessionLengthLabel> = {
  STRUCTURALLY_REAL: {
    label: 'Mode resolved',
    tone: 'positive',
    hideOnHeader: false,
  },
  SHORTS_AT_LABEL_PARITY: {
    label: 'Shorts at label parity',
    tone: 'caution',
    hideOnHeader: false,
  },
  NO_LAUNCHABLE_SHORTS: {
    label: 'Full only',
    tone: 'neutral',
    hideOnHeader: true,
  },
  LEGACY_NO_VARIANTS: {
    label: 'Legacy program',
    tone: 'muted',
    hideOnHeader: true,
  },
}

export function sessionLengthLabel(
  verdict: SessionLengthVerdict | string | null | undefined,
): SessionLengthLabel {
  if (verdict && Object.prototype.hasOwnProperty.call(SESSION_LENGTH_LABELS, verdict)) {
    return SESSION_LENGTH_LABELS[verdict as SessionLengthVerdict]
  }
  return SESSION_LENGTH_LABELS.LEGACY_NO_VARIANTS
}

// -----------------------------------------------------------------------------
// Phase P quality-audit corrections → short user-facing severity label.
// Returns null when the audit slice has no notable session-level finding so
// the card can suppress an empty chip instead of showing a meaningless
// "audit" tag.
// -----------------------------------------------------------------------------
export interface QualityAuditHeadline {
  label: string
  tone: TrustTone
}

export function qualityAuditHeadline(
  corrections: readonly string[] | null | undefined,
): QualityAuditHeadline | null {
  if (!Array.isArray(corrections) || corrections.length === 0) return null
  if (corrections.includes('straight_arm_overlap_warning_attached')) {
    return { label: 'Overlap watch', tone: 'caution' }
  }
  if (corrections.includes('session_length_warning_attached')) {
    return { label: 'Time realism', tone: 'caution' }
  }
  return null
}

// -----------------------------------------------------------------------------
// "Why this plan?" detail-section contract. The card builds a list of these
// sections and renders them inside the collapsible. Each section already
// carries everything it needs (icon name as a string the card maps to a
// lucide icon, label, and the lines to render). The card NEVER recomputes
// trust here; this contract is purely a presentation grouping.
// -----------------------------------------------------------------------------
export interface TrustDetailLine {
  /** primary line of text (coaching language, not debug log) */
  text: string
  /** optional supporting muted line of text */
  detail?: string
  /** optional state token for an inline pill on this line */
  state?: DoctrineUtilizationState
  /** optional tone override when state is not a doctrine-utilization state */
  tone?: TrustTone
}

export interface TrustDetailGroup {
  id:
    | 'session_length'
    | 'doctrine_application'
    | 'quality_safety'
    | 'weekly_stress'
    | 'method_decisions'
  /** short heading shown at the top of the group */
  heading: string
  /** ordered lines inside the group */
  lines: TrustDetailLine[]
}

// -----------------------------------------------------------------------------
// Compact headline summary builder. Composes ONE coach-facing sentence the
// card surfaces always-visible above the variant pills. Reads stamped truth
// only — never invents claims. Returns null when there is nothing
// trustworthy to say (e.g. a fully legacy program with no traces).
// -----------------------------------------------------------------------------
export interface TrustHeadlineInputs {
  doctrineDominantState?: string | null
  doctrineSummary?: string | null
  sessionLengthVerdict?: string | null
  sessionLengthSummary?: string | null
  qualityCorrections?: readonly string[] | null
  hasStressLabel?: boolean
}

export interface TrustHeadline {
  /** one short coach sentence; never empty when returned */
  sentence: string
  /** dominant tone for the row */
  tone: TrustTone
}

export function buildTrustHeadline(
  inputs: TrustHeadlineInputs,
): TrustHeadline | null {
  // Severity always wins. A real safety/realism warning gets the headline.
  const audit = qualityAuditHeadline(inputs.qualityCorrections ?? null)
  if (audit) {
    return {
      sentence:
        audit.label === 'Overlap watch'
          ? 'Heads up: tendon overlap with adjacent session.'
          : 'Heads up: target time may be tight today.',
      tone: 'caution',
    }
  }

  // If Phase R says shorts are real, lead with that — it is the most
  // user-visible structural truth (Full / 45 / 30 actually compress).
  if (inputs.sessionLengthVerdict === 'STRUCTURALLY_REAL' && inputs.sessionLengthSummary) {
    return {
      sentence: inputs.sessionLengthSummary,
      tone: 'positive',
    }
  }

  // Otherwise let Phase Q's roll-up speak — it is already concise.
  if (inputs.doctrineSummary && inputs.doctrineDominantState) {
    const stateInfo = doctrineStateLabel(inputs.doctrineDominantState)
    return {
      sentence: inputs.doctrineSummary,
      tone: stateInfo.tone,
    }
  }

  // Stress label alone is not a complete headline — let the existing chip
  // speak for itself. Returning null here lets the card render its calm
  // default without inventing trust copy.
  return null
}
