/**
 * Stripe webhook admission, account selection, and durable delivery decisions.
 *
 * Production claims live in Postgres (`scripts/036-stripe-webhook-events.sql`).
 * The application does not run that migration. Until the tables exist, the
 * webhook route fails the delivery so Stripe retries. The in-process stores
 * below cover the previous single-instance behavior in tests. A restart, a
 * second instance, or the settled-id cap cannot be the production claim path.
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

/** A lookup error must be retried. A missing row is a completed lookup for callers that still treat it that way. */
export function lookupBlocksProcessing(status: 'found' | 'not_found' | 'failed'): boolean {
  return status === 'failed'
}

/**
 * Entitlement writes retry when the account row is missing or the lookup failed.
 * A found row continues.
 */
export function missingRecordDisposition(found: boolean): 'continue' | 'failure' {
  return found ? 'continue' : 'failure'
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

/**
 * A cancel or a non-Pro update for a different subscription must not touch the
 * subscription currently stored on the account. A Pro-granting event may replace
 * it, and the customer version row then rejects an older replacement.
 */
export function decideSubscriptionMutation(input: {
  storedSubscriptionId: string | null
  incomingSubscriptionId: string
  grantsEntitlement: boolean
}): 'apply' | 'skip_other_subscription' {
  if (!input.storedSubscriptionId) return 'apply'
  if (input.storedSubscriptionId === input.incomingSubscriptionId) return 'apply'
  if (input.grantsEntitlement) return 'apply'
  return 'skip_other_subscription'
}

/** A guarded write either landed, lost the version race, or must be retried. */
export function guardedMutationDisposition(
  status: 'updated' | 'not_found' | 'failed' | 'stale' | 'skipped',
): 'applied' | 'skip' | 'failure' {
  if (status === 'updated') return 'applied'
  if (status === 'stale' || status === 'skipped') return 'skip'
  return 'failure'
}

/** Reuse a stored Stripe customer. A missing record starts checkout without one. */
export function checkoutCustomerFields(
  existingCustomerId: string | null | undefined,
): { customer?: string } {
  if (!existingCustomerId) return {}
  return { customer: existingCustomerId }
}

/** Five minutes. A live Vercel invocation finishes inside this window; a crashed one can be reclaimed. */
export const STRIPE_EVENT_LEASE_MS = 5 * 60 * 1000

export type DurableClaimResult =
  | { result: 'claimed' }
  | { result: 'duplicate' }
  | { result: 'in_flight' }

export type EmailClaimResult = 'claimed' | 'already_sent' | 'in_flight'
export type SubscriptionTurn = 'apply' | 'skip_stale'

export interface DurableStripeEvent {
  eventId: string
  eventType: string
  stripeCreated: number
  objectId: string | null
}

export interface StripeDurabilityStore {
  claim(event: DurableStripeEvent): Promise<DurableClaimResult>
  markProcessed(eventId: string): Promise<void>
  markFailed(eventId: string): Promise<void>
  setObjectId(eventId: string, objectId: string): Promise<void>
  newestProcessedCreated(objectId: string, exceptEventId: string): Promise<number | null>
  claimSubscriptionVersion(objectId: string, stripeCreated: number, eventId: string): Promise<SubscriptionTurn>
  releaseSubscriptionVersion(objectId: string, eventId: string): Promise<void>
  claimEmail(dedupeKey: string): Promise<EmailClaimResult>
  markEmailSent(dedupeKey: string): Promise<void>
  releaseEmail(dedupeKey: string): Promise<void>
}

export function durableAdmissionResponse(result: DurableClaimResult):
  | { stop: true; status: 200 | 500; body: { received: true; duplicate: true } | { error: string } }
  | { stop: false } {
  if (result.result === 'duplicate') {
    return { stop: true, status: 200, body: { received: true, duplicate: true } }
  }
  if (result.result === 'in_flight') {
    return { stop: true, status: 500, body: { error: 'Webhook processing failed' } }
  }
  return { stop: false }
}

/** Apply when no newer processed timestamp exists. The same second still applies. */
export function shouldApplySubscriptionEvent(input: {
  incomingCreated: number
  newestProcessedCreated: number | null
}): boolean {
  if (input.newestProcessedCreated == null) return true
  return input.incomingCreated >= input.newestProcessedCreated
}

export function checkoutRecipientEmail(session: {
  customer_email?: string | null
  email?: string | null
  customer_details?: { email?: string | null } | null
}): string {
  return session.customer_email || session.email || session.customer_details?.email || ''
}

export function objectIdForStripeEvent(event: {
  type: string
  data: { object: { id?: string; subscription?: unknown } }
}): string | null {
  const object = event.data.object
  if (event.type === 'checkout.session.completed') {
    return typeof object.subscription === 'string' && object.subscription
      ? object.subscription
      : object.id || null
  }
  return object.id || null
}

interface MemoryEventRow {
  eventType: string
  stripeCreated: number
  objectId: string | null
  status: 'processing' | 'processed' | 'failed'
  claimedAt: number
}

/**
 * In-memory stand-in for the Postgres durability tables.
 * Tests use it to exercise claim, lease, ordering, and email semantics.
 * The webhook route uses the Postgres store instead.
 */
export function createMemoryStripeDurabilityStore(options?: {
  now?: () => number
  leaseMs?: number
}): StripeDurabilityStore {
  const now = options?.now ?? (() => Date.now())
  const leaseMs = options?.leaseMs ?? STRIPE_EVENT_LEASE_MS
  const events = new Map<string, MemoryEventRow>()
  const emails = new Map<string, { status: 'sending' | 'sent'; claimedAt: number }>()
  const versions = new Map<string, { stripeCreated: number; eventId: string }>()

  return {
    async claim(event) {
      const current = events.get(event.eventId)
      if (!current) {
        events.set(event.eventId, {
          eventType: event.eventType,
          stripeCreated: event.stripeCreated,
          objectId: event.objectId,
          status: 'processing',
          claimedAt: now(),
        })
        return { result: 'claimed' }
      }
      if (current.status === 'processed') return { result: 'duplicate' }
      const abandoned = current.status === 'failed' || now() - current.claimedAt >= leaseMs
      if (!abandoned) return { result: 'in_flight' }
      current.status = 'processing'
      current.claimedAt = now()
      current.eventType = event.eventType
      current.stripeCreated = event.stripeCreated
      if (event.objectId) current.objectId = event.objectId
      return { result: 'claimed' }
    },
    async markProcessed(eventId) {
      const row = events.get(eventId)
      if (row) row.status = 'processed'
    },
    async markFailed(eventId) {
      const row = events.get(eventId)
      if (row?.status === 'processing') row.status = 'failed'
    },
    async setObjectId(eventId, objectId) {
      const row = events.get(eventId)
      if (row) row.objectId = objectId
    },
    async newestProcessedCreated(objectId, exceptEventId) {
      let newest: number | null = null
      for (const [id, row] of events) {
        if (id === exceptEventId || row.objectId !== objectId || row.status !== 'processed') continue
        if (newest == null || row.stripeCreated > newest) newest = row.stripeCreated
      }
      return newest
    },
    async claimSubscriptionVersion(objectId, stripeCreated, eventId) {
      const current = versions.get(objectId)
      if (current && current.stripeCreated > stripeCreated) return 'skip_stale'
      versions.set(objectId, { stripeCreated, eventId })
      return 'apply'
    },
    async releaseSubscriptionVersion(objectId, eventId) {
      const current = versions.get(objectId)
      if (current?.eventId === eventId) versions.delete(objectId)
    },
    async claimEmail(dedupeKey) {
      const current = emails.get(dedupeKey)
      if (!current) {
        emails.set(dedupeKey, { status: 'sending', claimedAt: now() })
        return 'claimed'
      }
      if (current.status === 'sent') return 'already_sent'
      if (now() - current.claimedAt < leaseMs) return 'in_flight'
      current.status = 'sending'
      current.claimedAt = now()
      return 'claimed'
    },
    async markEmailSent(dedupeKey) {
      const row = emails.get(dedupeKey)
      if (row) row.status = 'sent'
    },
    async releaseEmail(dedupeKey) {
      const row = emails.get(dedupeKey)
      if (row?.status === 'sending') emails.delete(dedupeKey)
    },
  }
}
