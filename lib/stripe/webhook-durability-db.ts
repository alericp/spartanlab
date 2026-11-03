import { queryStrict } from '@/lib/db'
import {
  STRIPE_EVENT_LEASE_MS,
  type DurableClaimResult,
  type DurableStripeEvent,
  type EmailClaimResult,
  type StripeDurabilityStore,
  type SubscriptionTurn,
} from '@/lib/stripe/webhook-reliability'

function asUnixSeconds(value: unknown): number | null {
  if (value == null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Postgres backing for webhook idempotency, billing emails, and subscription ordering.
 * A missing table or a failed query throws. The route turns that into a retryable 500.
 * There is no in-memory fallback.
 */
export function createPostgresStripeDurabilityStore(
  leaseMs = STRIPE_EVENT_LEASE_MS,
): StripeDurabilityStore {
  return {
    async claim(event: DurableStripeEvent): Promise<DurableClaimResult> {
      const inserted = await queryStrict<{ event_id: string }>(
        `INSERT INTO stripe_webhook_events (
           event_id, event_type, stripe_created, object_id, status, claimed_at
         ) VALUES ($1, $2, $3, $4, 'processing', NOW())
         ON CONFLICT (event_id) DO NOTHING
         RETURNING event_id`,
        [event.eventId, event.eventType, event.stripeCreated, event.objectId],
      )
      if (inserted.length > 0) return { result: 'claimed' }

      const reclaimed = await queryStrict<{ event_id: string }>(
        `UPDATE stripe_webhook_events
         SET status = 'processing',
             claimed_at = NOW(),
             event_type = $2,
             stripe_created = $3,
             object_id = COALESCE($4, object_id)
         WHERE event_id = $1
           AND (
             status = 'failed'
             OR (status = 'processing' AND claimed_at < NOW() - ($5::int * INTERVAL '1 millisecond'))
           )
         RETURNING event_id`,
        [event.eventId, event.eventType, event.stripeCreated, event.objectId, leaseMs],
      )
      if (reclaimed.length > 0) return { result: 'claimed' }

      const existing = await queryStrict<{ status: string }>(
        `SELECT status FROM stripe_webhook_events WHERE event_id = $1`,
        [event.eventId],
      )
      if (existing[0]?.status === 'processed') return { result: 'duplicate' }
      if (!existing[0]) throw new Error('Stripe webhook event claim did not persist')
      return { result: 'in_flight' }
    },

    async markProcessed(eventId: string) {
      const rows = await queryStrict<{ event_id: string }>(
        `UPDATE stripe_webhook_events
         SET status = 'processed', processed_at = NOW()
         WHERE event_id = $1
         RETURNING event_id`,
        [eventId],
      )
      if (rows.length === 0) throw new Error('Stripe webhook event could not be marked processed')
    },

    async markFailed(eventId: string) {
      await queryStrict(
        `UPDATE stripe_webhook_events
         SET status = 'failed'
         WHERE event_id = $1 AND status = 'processing'`,
        [eventId],
      )
    },

    async setObjectId(eventId: string, objectId: string) {
      await queryStrict(
        `UPDATE stripe_webhook_events
         SET object_id = $2
         WHERE event_id = $1`,
        [eventId, objectId],
      )
    },

    async newestProcessedCreated(objectId: string, exceptEventId: string) {
      const rows = await queryStrict<{ newest: unknown }>(
        `SELECT MAX(stripe_created) AS newest
         FROM stripe_webhook_events
         WHERE object_id = $1 AND status = 'processed' AND event_id <> $2`,
        [objectId, exceptEventId],
      )
      return asUnixSeconds(rows[0]?.newest)
    },

    async claimSubscriptionVersion(objectId, stripeCreated, eventId): Promise<SubscriptionTurn> {
      const rows = await queryStrict<{ object_id: string }>(
        `INSERT INTO stripe_subscription_versions (object_id, stripe_created, event_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (object_id) DO UPDATE
         SET stripe_created = EXCLUDED.stripe_created,
             event_id = EXCLUDED.event_id,
             updated_at = NOW()
         WHERE stripe_subscription_versions.stripe_created <= EXCLUDED.stripe_created
         RETURNING object_id`,
        [objectId, stripeCreated, eventId],
      )
      return rows.length > 0 ? 'apply' : 'skip_stale'
    },

    async releaseSubscriptionVersion(objectId, eventId) {
      await queryStrict(
        `DELETE FROM stripe_subscription_versions
         WHERE object_id = $1 AND event_id = $2`,
        [objectId, eventId],
      )
    },

    async claimEmail(dedupeKey: string): Promise<EmailClaimResult> {
      const inserted = await queryStrict<{ dedupe_key: string }>(
        `INSERT INTO stripe_billing_emails (dedupe_key, status, claimed_at)
         VALUES ($1, 'sending', NOW())
         ON CONFLICT (dedupe_key) DO NOTHING
         RETURNING dedupe_key`,
        [dedupeKey],
      )
      if (inserted.length > 0) return 'claimed'

      const reclaimed = await queryStrict<{ dedupe_key: string }>(
        `UPDATE stripe_billing_emails
         SET status = 'sending', claimed_at = NOW()
         WHERE dedupe_key = $1
           AND status = 'sending'
           AND claimed_at < NOW() - ($2::int * INTERVAL '1 millisecond')
         RETURNING dedupe_key`,
        [dedupeKey, leaseMs],
      )
      if (reclaimed.length > 0) return 'claimed'

      const existing = await queryStrict<{ status: string }>(
        `SELECT status FROM stripe_billing_emails WHERE dedupe_key = $1`,
        [dedupeKey],
      )
      if (existing[0]?.status === 'sent') return 'already_sent'
      if (!existing[0]) throw new Error('Stripe billing email claim did not persist')
      return 'in_flight'
    },

    async markEmailSent(dedupeKey: string) {
      const rows = await queryStrict<{ dedupe_key: string }>(
        `UPDATE stripe_billing_emails
         SET status = 'sent', sent_at = NOW()
         WHERE dedupe_key = $1
         RETURNING dedupe_key`,
        [dedupeKey],
      )
      if (rows.length === 0) throw new Error('Stripe billing email could not be marked sent')
    },

    async releaseEmail(dedupeKey: string) {
      await queryStrict(
        `DELETE FROM stripe_billing_emails
         WHERE dedupe_key = $1 AND status = 'sending'`,
        [dedupeKey],
      )
    },
  }
}
