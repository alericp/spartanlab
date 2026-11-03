-- B13 Stripe webhook durability.
-- Additive only. This script does not alter users, subscription plans, or existing customer ids.
-- The application does not execute it. Apply it manually before deploying the webhook code
-- that reads these tables. If the tables are absent, the webhook returns 500 so Stripe retries.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  stripe_created BIGINT NOT NULL,
  object_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'processed', 'failed')),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_object_created
  ON stripe_webhook_events (object_id, stripe_created DESC)
  WHERE status = 'processed';

CREATE TABLE IF NOT EXISTS stripe_billing_emails (
  dedupe_key TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('sending', 'sent')),
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Atomic ordering gate. object_id is either a Stripe subscription id or a Stripe customer id.
-- A newer stripe_created wins. The user update runs only while this event still owns the row.
CREATE TABLE IF NOT EXISTS stripe_subscription_versions (
  object_id TEXT PRIMARY KEY,
  stripe_created BIGINT NOT NULL,
  event_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
