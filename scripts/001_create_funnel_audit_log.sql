-- [TEMP-INSTRUMENTATION] Funnel audit log table.
-- Persists the SINGLE per-card funnel-audit payload emitted by the probe in
-- components/programs/AdaptiveSessionCard.tsx, so the v0 agent can read the
-- first-failing-stage verdict directly from the database on the next turn
-- without relying on server/client console log collection.
--
-- Remove this table (DROP TABLE public.funnel_audit_log;) in the same cleanup
-- turn as /app/api/_funnel-audit/route.ts and the client-side POST block.

CREATE TABLE IF NOT EXISTS public.funnel_audit_log (
  id             text PRIMARY KEY,
  created_at     timestamptz NOT NULL DEFAULT now(),
  day_number     integer,
  selected_variant text,
  verdict        text,
  payload        jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS funnel_audit_log_created_at_idx
  ON public.funnel_audit_log (created_at DESC);
