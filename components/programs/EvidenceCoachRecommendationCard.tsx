'use client'

// =============================================================================
// [AB13-1 / AB13-2] EVIDENCE COACH RECOMMENDATION CARD — RENDERER ONLY
// =============================================================================
//
// Compact Program-page surface that displays the
// `EvidenceCoachRecommendationBundle` produced by
// `lib/program/evidence-derived-coach-recommendations.ts`.
//
// AB13-2 upgrade:
//   - Adds a deterministic "What to do now" block (coach action label,
//     coach action detail, user next step, system next step).
//   - Adds compact chips for truth-status, evidence-quality, and
//     actionability — every chip string comes from the bundle.
//   - When `blockedReason` exists, renders a small honest "Why it is
//     not applied yet" note (no scary medical/legal copy).
//   - Renderer-only contract preserved: zero business logic, zero
//     hardcoded "active"/"applied" claims.
//
// CONTRACTS:
//   - Renderer-only. Every visible string comes from the bundle.
//   - Hides itself silently when `bundle.primary === null`.
//   - The renderer NEVER claims `applied` unless
//     `primary.appliedToProgram === true` AND
//     `primary.status === 'active'`. Both are gated upstream.
//   - Reuses the same Card / Badge primitives the FeedbackLoopProofCard
//     uses, so the AB11-5 / AB12-2 / AB13-2 cards sit visually
//     consistent next to each other.
//   - At most 1 primary recommendation + 2 supporting notes.
// =============================================================================

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Sparkles, Eye, Hourglass, AlertTriangle, CircleSlash } from 'lucide-react'
import type {
  EvidenceCoachActionability,
  EvidenceCoachEvidenceQuality,
  EvidenceCoachRecommendation,
  EvidenceCoachRecommendationBundle,
  EvidenceCoachRecommendationStatus,
  EvidenceCoachRecommendationSeverity,
  EvidenceCoachRecommendationConfidence,
  EvidenceCoachShapingProofStatus,
} from '@/lib/program/evidence-derived-coach-recommendations'

interface EvidenceCoachRecommendationCardProps {
  /**
   * Bundle from `deriveEvidenceCoachRecommendations`. When `null` OR
   * `primary === null`, the card renders nothing (no placeholder,
   * no skeleton). This is the honest "inactive" state.
   */
  bundle: EvidenceCoachRecommendationBundle | null
  className?: string
}

export function EvidenceCoachRecommendationCard({
  bundle,
  className,
}: EvidenceCoachRecommendationCardProps) {
  if (!bundle || bundle.primary === null) return null

  const { primary, supporting, derivedFrom } = bundle

  return (
    <Card
      className={cn('border-border bg-card', className)}
      data-ab13-2-status={primary.status}
      data-ab13-2-applied={String(primary.appliedToProgram)}
      data-ab13-2-derived-from={derivedFrom}
      data-ab13-2-actionability={primary.actionability}
      data-ab13-2-evidence-quality={primary.evidenceQualityLabel}
      data-ab13-2-truth-status={primary.truthStatusLabel}
      data-ab13-6-shaping-proof-status={
        primary.programShapingProofStatus ?? 'unavailable'
      }
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <StatusIcon status={primary.status} />
            <span className="text-pretty">{primary.title}</span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={primary.status} severity={primary.severity} />
            <ConfidenceBadge confidence={primary.confidenceLabel} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <TruthStatusBadge label={primary.truthStatusLabel} />
          <EvidenceQualityBadge quality={primary.evidenceQualityLabel} />
          <ActionabilityBadge actionability={primary.actionability} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          {primary.summary}
        </p>

        <div
          className={cn(
            'rounded-md border border-border p-3',
            primary.status === 'active'
              ? 'bg-secondary/40'
              : 'bg-background',
          )}
        >
          <p className="text-sm font-medium leading-relaxed text-foreground text-pretty">
            {primary.recommendation}
          </p>
        </div>

        {/* AB13-2: What to do now */}
        <div className="rounded-md border border-border bg-background p-3">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            What to do now
          </p>
          <p className="text-sm font-medium leading-relaxed text-foreground text-pretty">
            {primary.coachActionLabel}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">
            {primary.coachActionDetail}
          </p>
          <dl className="mt-3 flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Your next step
              </dt>
              <dd className="text-xs leading-relaxed text-foreground text-pretty">
                {primary.userNextStep}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                What SpartanLab will do
              </dt>
              <dd className="text-xs leading-relaxed text-muted-foreground text-pretty">
                {primary.systemNextStep}
              </dd>
            </div>
          </dl>
          {/* AB13-6: subtle program-shaping proof line. Helper-derived,
              renderer-only. Hidden silently when proof is unavailable
              (older program / no AB13-4 stamp). NEVER references raw
              enum names — copy is fully owned by the helper. */}
          <ProgramShapingProofLine
            label={primary.programShapingProofLabel}
            detail={primary.programShapingProofDetail}
            status={primary.programShapingProofStatus}
          />
        </div>

        {primary.why.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Why
            </p>
            <ul
              className="flex flex-col gap-1 text-xs leading-relaxed text-muted-foreground"
              role="list"
            >
              {primary.why.slice(0, 4).map((line, i) => (
                <li key={`${i}-${line}`} className="text-pretty">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {primary.visibleProof.length > 0 && (
          <ul
            className="flex flex-wrap gap-1"
            role="list"
            aria-label="Recommendation proof"
          >
            {primary.visibleProof.slice(0, 5).map((chip, i) => (
              <li key={`${i}-${chip}`}>
                <Badge
                  variant={
                    chip.includes('(suppressed)') ? 'outline' : 'secondary'
                  }
                  className="text-[10px] font-medium normal-case"
                >
                  {chip}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        {primary.blockedReason && (
          <div className="rounded-md border border-border bg-background p-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Why it is not applied yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">
              {primary.blockedReason}
            </p>
          </div>
        )}

        {primary.evidenceSource.length > 0 && (
          <p className="text-[11px] leading-relaxed text-muted-foreground/80 text-pretty">
            Sources: {primary.evidenceSource.join(' • ')}
          </p>
        )}

        {supporting.length > 0 && (
          <div className="mt-1 flex flex-col gap-2 border-t border-border pt-3">
            {supporting.slice(0, 2).map((note) => (
              <SupportingNote key={note.id} note={note} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Sub-renderers — all dumb, all derived from the bundle
// ---------------------------------------------------------------------------

function SupportingNote({ note }: { note: EvidenceCoachRecommendation }) {
  return (
    <div
      className="flex flex-col gap-1.5"
      data-ab13-2-supporting-status={note.status}
      data-ab13-2-supporting-actionability={note.actionability}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusIcon status={note.status} small />
        <p className="text-xs font-medium text-foreground text-pretty">
          {note.title}
        </p>
        <StatusBadge status={note.status} severity={note.severity} />
        <TruthStatusBadge label={note.truthStatusLabel} />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
        {note.summary}
      </p>
      <p className="text-xs leading-relaxed text-foreground text-pretty">
        <span className="font-medium">{note.coachActionLabel}.</span>{' '}
        {note.userNextStep}
      </p>
      {note.visibleProof.length > 0 && (
        <ul className="flex flex-wrap gap-1" role="list">
          {note.visibleProof.slice(0, 4).map((chip, i) => (
            <li key={`${i}-${chip}`}>
              <Badge
                variant="outline"
                className="text-[10px] font-medium normal-case"
              >
                {chip}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {note.blockedReason && (
        <p className="text-[11px] leading-relaxed text-muted-foreground/90 text-pretty">
          {note.blockedReason}
        </p>
      )}
    </div>
  )
}

function StatusIcon({
  status,
  small = false,
}: {
  status: EvidenceCoachRecommendationStatus
  small?: boolean
}) {
  const size = small ? 'h-3.5 w-3.5' : 'h-4 w-4'
  switch (status) {
    case 'active':
      return (
        <Sparkles
          className={cn(size, 'text-foreground')}
          aria-hidden="true"
        />
      )
    case 'observe':
      return (
        <Eye
          className={cn(size, 'text-muted-foreground')}
          aria-hidden="true"
        />
      )
    case 'suppressed':
      return (
        <CircleSlash
          className={cn(size, 'text-muted-foreground')}
          aria-hidden="true"
        />
      )
    case 'waiting':
      return (
        <Hourglass
          className={cn(size, 'text-muted-foreground')}
          aria-hidden="true"
        />
      )
    case 'degraded':
      return (
        <AlertTriangle
          className={cn(size, 'text-muted-foreground')}
          aria-hidden="true"
        />
      )
  }
}

function StatusBadge({
  status,
  severity,
}: {
  status: EvidenceCoachRecommendationStatus
  severity: EvidenceCoachRecommendationSeverity
}) {
  const label = STATUS_LABEL[status]
  const variant: 'default' | 'secondary' | 'outline' =
    status === 'active'
      ? 'default'
      : severity === 'caution'
        ? 'outline'
        : 'secondary'
  return (
    <Badge
      variant={variant}
      className="text-[10px] font-medium uppercase tracking-wide"
    >
      {label}
    </Badge>
  )
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: EvidenceCoachRecommendationConfidence
}) {
  if (confidence === 'insufficient') {
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-medium uppercase tracking-wide"
      >
        Insufficient evidence
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-medium uppercase tracking-wide"
    >
      {confidence} confidence
    </Badge>
  )
}

function TruthStatusBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-medium normal-case"
    >
      {label}
    </Badge>
  )
}

function EvidenceQualityBadge({
  quality,
}: {
  quality: EvidenceCoachEvidenceQuality
}) {
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-medium uppercase tracking-wide"
    >
      {EVIDENCE_QUALITY_LABEL[quality]}
    </Badge>
  )
}

function ActionabilityBadge({
  actionability,
}: {
  actionability: EvidenceCoachActionability
}) {
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-medium uppercase tracking-wide"
    >
      {ACTIONABILITY_LABEL[actionability]}
    </Badge>
  )
}

const STATUS_LABEL: Record<EvidenceCoachRecommendationStatus, string> = {
  active: 'Active',
  observe: 'Observing',
  suppressed: 'Adjustment suppressed',
  waiting: 'Waiting for evidence',
  degraded: 'Safe baseline',
}

const EVIDENCE_QUALITY_LABEL: Record<EvidenceCoachEvidenceQuality, string> = {
  strong: 'Strong evidence',
  moderate: 'Moderate evidence',
  limited: 'Limited evidence',
  insufficient: 'Insufficient evidence',
}

const ACTIONABILITY_LABEL: Record<EvidenceCoachActionability, string> = {
  ready: 'Ready',
  monitor: 'Monitor',
  collect_evidence: 'Collect evidence',
  blocked: 'Blocked',
  degraded: 'Degraded',
}

// ---------------------------------------------------------------------------
// AB13-6: program-shaping proof line — pure renderer
// ---------------------------------------------------------------------------

/**
 * Subtle one-line surface for the helper-derived AB13-6 shaping proof.
 *
 * Renders nothing when `label` and `detail` are undefined (older
 * programs, or shaping proof unavailable). Never invents copy — every
 * visible string comes from the helper.
 */
function ProgramShapingProofLine({
  label,
  detail,
  status,
}: {
  label: string | undefined
  detail: string | undefined
  status: EvidenceCoachShapingProofStatus | undefined
}) {
  if (!label || !detail) return null
  return (
    <div
      className="mt-3 border-t border-border pt-2"
      data-ab13-6-shaping-proof-line={status ?? 'unavailable'}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground text-pretty">
        {detail}
      </p>
    </div>
  )
}
