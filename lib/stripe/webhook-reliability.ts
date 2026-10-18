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
 * That table is not created here. The in-process claim store stops the same
 * event id from repeating billing writes inside one server process.
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

export interface EventClaimStore {
  claim(eventId: string): 'new' | 'duplicate' | 'missing'
}

export function createStripeEventClaimStore(maxEntries = 2000): EventClaimStore {
  const seen = new Set<string>()
  const order: string[] = []

  return {
    claim(eventId: string) {
      if (!eventId) return 'missing'
      if (seen.has(eventId)) return 'duplicate'
      seen.add(eventId)
      order.push(eventId)
      while (order.length > maxEntries) {
        const oldest = order.shift()
        if (oldest) seen.delete(oldest)
      }
      return 'new'
    },
  }
}

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
