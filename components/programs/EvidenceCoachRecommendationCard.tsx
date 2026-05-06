'use client'

// =============================================================================
// [AB13-1] EVIDENCE COACH RECOMMENDATION CARD — RENDERER ONLY
// =============================================================================
//
// Compact Program-page surface that displays the
// `EvidenceCoachRecommendationBundle` produced by
// `lib/program/evidence-derived-coach-recommendations.ts`.
//
// CONTRACTS:
//   - Renderer-only. Every visible string comes from the bundle.
//   - Hides itself silently when `bundle.primary === null` (inactive /
//     nothing to show). Never shows a placeholder card.
//   - Never invents chips, severity, confidence, or "applied" claims.
//   - Reuses the same Card / Badge primitives the FeedbackLoopProofCard
//     uses, so it sits visually consistent next to the AB11-5 / AB12-2
//     proof surface.
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
  EvidenceCoachRecommendation,
  EvidenceCoachRecommendationBundle,
  EvidenceCoachRecommendationStatus,
  EvidenceCoachRecommendationSeverity,
  EvidenceCoachRecommendationConfidence,
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
      data-ab13-1-status={primary.status}
      data-ab13-1-applied={String(primary.appliedToProgram)}
      data-ab13-1-derived-from={derivedFrom}
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

        {primary.suppressedReason && (
          <p className="text-[11px] leading-relaxed text-muted-foreground text-pretty">
            <span className="font-medium">Why not applied:</span>{' '}
            {primary.suppressedReason}
          </p>
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
      data-ab13-1-supporting-status={note.status}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusIcon status={note.status} small />
        <p className="text-xs font-medium text-foreground text-pretty">
          {note.title}
        </p>
        <StatusBadge status={note.status} severity={note.severity} />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
        {note.summary}
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
      {note.suppressedReason && (
        <p className="text-[11px] leading-relaxed text-muted-foreground/90 text-pretty">
          {note.suppressedReason}
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

const STATUS_LABEL: Record<EvidenceCoachRecommendationStatus, string> = {
  active: 'Active',
  observe: 'Observing',
  suppressed: 'Adjustment suppressed',
  waiting: 'Waiting for evidence',
  degraded: 'Safe baseline',
}
