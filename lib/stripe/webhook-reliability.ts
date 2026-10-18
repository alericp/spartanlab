/**
 * Stripe webhook admission, event idempotency, and account selection.
 *
 * Durable idempotency is deferred. A schema change would add:
 *
 *   CREATE TABLE stripe_webhook_events (
 *     event_id TEXT PRIMARY KEY,
 *     event_type TEXT NOT NULL,
 *     processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *
 * That table is not created here. The in-process store settles an event id only
 * after processing succeeds. A failed attempt releases the id so Stripe can
 * retry. Another instance, a restart, or an id evicted after the cap can still
 * repeat a write or an email. Those cases need the deferred table.
 */

export type WebhookGate =
  | { ok: true }
  | { ok: false; status: 400 | 500; error: string }

export function gateStripeWebhookRequest(input: {
  secretConfigured: boolean
  signature: string | null
}): WebhookGate {
  if (!input.secretConfigured) {
    return { ok: false, status: 500, error: 'Webhook secret not configured' }
  }
  if (!input.signature) {
    return { ok: false, status: 400, error: 'Missing signature' }
  }
  return { ok: true }
}

export function gateStripeWebhookSignature(signatureValid: boolean): WebhookGate {
  if (!signatureValid) {
    return { ok: false, status: 400, error: 'Invalid signature' }
  }
  return { ok: true }
}

export type ClaimBegin = 'new' | 'duplicate' | 'missing' | 'in_flight'
export type ProcessingOutcome = 'success' | 'failure'

export interface EventClaimStore {
  begin(eventId: string): ClaimBegin
  settle(eventId: string): void
  release(eventId: string): void
}

export function createStripeEventClaimStore(maxEntries = 2000): EventClaimStore {
  const states = new Map<string, 'in_flight' | 'settled'>()
  const settledOrder: string[] = []

  return {
    begin(eventId: string) {
      if (!eventId) return 'missing'
      const current = states.get(eventId)
      if (current === 'settled') return 'duplicate'
      if (current === 'in_flight') return 'in_flight'
      states.set(eventId, 'in_flight')
      return 'new'
    },
    settle(eventId: string) {
      if (!eventId || states.get(eventId) === 'settled') return
      states.set(eventId, 'settled')
      settledOrder.push(eventId)
      while (settledOrder.length > maxEntries) {
        const oldest = settledOrder.shift()
        if (oldest) states.delete(oldest)
      }
    },
    release(eventId: string) {
      if (states.get(eventId) === 'in_flight') states.delete(eventId)
    },
  }
}

export function responseForClaimBegin(begin: ClaimBegin):
  | { stop: true; status: 200 | 500; body: { received: true; duplicate: true } | { error: string } }
  | { stop: false } {
  if (begin === 'duplicate') {
    return { stop: true, status: 200, body: { received: true, duplicate: true } }
  }
  if (begin === 'in_flight') {
    return { stop: true, status: 500, body: { error: 'Webhook processing failed' } }
  }
  return { stop: false }
}

/** Settle a successful attempt. Release a failed attempt so the same event id can be retried. */
export function finishWebhookAttempt(
  store: EventClaimStore,
  eventId: string,
  outcome: ProcessingOutcome,
): { status: 200 | 500; body: { received: true } | { error: string } } {
  if (outcome === 'failure') {
    store.release(eventId)
    return { status: 500, body: { error: 'Webhook processing failed' } }
  }
  store.settle(eventId)
  return { status: 200, body: { received: true } }
}

/** A lookup error must be retried. A missing row is a completed lookup. */
export function lookupBlocksProcessing(status: 'found' | 'not_found' | 'failed'): boolean {
  return status === 'failed'
}

/** An intended subscription write succeeds only when a row is updated. */
export function mutationOutcome(status: 'updated' | 'not_found' | 'failed'): ProcessingOutcome {
  return status === 'updated' ? 'success' : 'failure'
}

export function shouldSendBillingEmail(alreadySent: boolean, recipientPresent: boolean): boolean {
  return recipientPresent && !alreadySent
}

/** Mark an email only after the provider accepts it. A real send failure stays retryable. */
export function classifyEmailResult(result: 'sent' | 'failed' | 'not_configured'): {
  markSent: boolean
  outcome: ProcessingOutcome
} {
  if (result === 'sent') return { markSent: true, outcome: 'success' }
  if (result === 'not_configured') return { markSent: false, outcome: 'success' }
  return { markSent: false, outcome: 'failure' }
}

export interface BillingEmailLedger {
  wasSent(key: string): boolean
  markSent(key: string): void
}

export function createBillingEmailLedger(ttlMs = 60 * 60 * 1000): BillingEmailLedger {
  const sent = new Set<string>()
  return {
    wasSent(key: string) {
      return sent.has(key)
    },
    markSent(key: string) {
      if (!key || sent.has(key)) return
      sent.add(key)
      const timer = setTimeout(() => sent.delete(key), ttlMs)
      timer.unref?.()
    },
  }
}

export const billingEmailLedger = createBillingEmailLedger()

export const stripeEventClaims = createStripeEventClaimStore()

export interface BillingAccount {
  id: string
  email: string
  username: string
  stripeCustomerId: string | null
}

/**
 * Checkout stores the authenticated Clerk id in metadata.userId.
 * That account wins. Email is only a fallback when checkout metadata is absent.
 * A metadata id that does not match a row must not be replaced by a different email match.
 */
export function selectCheckoutAccount(input: {
  metadataUserId: string | null
  accountByClerkId: BillingAccount | null
  accountByEmail: BillingAccount | null
}): BillingAccount | null {
  if (input.metadataUserId) {
    return input.accountByClerkId
  }
  return input.accountByEmail
}

export interface SubscriptionWrite {
  customerId: string
  subscriptionId: string
  email: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  currentPeriodEnd: string
}

/**
 * Do not replace a stored Stripe customer with a different customer id.
 * The same customer may refresh subscription status.
 */
export function planSubscriptionWrite(input: {
  existingCustomerId: string | null
  incoming: SubscriptionWrite
}): { write: SubscriptionWrite | null; preservedExistingCustomer: boolean } {
  if (input.existingCustomerId && input.existingCustomerId !== input.incoming.customerId) {
    return { write: null, preservedExistingCustomer: true }
  }
  return { write: input.incoming, preservedExistingCustomer: false }
}

/** Reuse a stored Stripe customer. A missing record starts checkout without one. */
export function checkoutCustomerFields(
  existingCustomerId: string | null | undefined,
): { customer?: string } {
  if (!existingCustomerId) return {}
  return { customer: existingCustomerId }
}
