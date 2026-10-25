import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { CLERK_PUBLIC_ROUTE_PATTERNS } from '../routes/public-routes.ts'
import {
  checkoutCustomerFields,
  checkoutRecipientEmail,
  classifyEmailResult,
  createBillingEmailLedger,
  createMemoryStripeDurabilityStore,
  createStripeEventClaimStore,
  durableAdmissionResponse,
  finishWebhookAttempt,
  gateStripeWebhookRequest,
  gateStripeWebhookSignature,
  lookupBlocksProcessing,
  missingRecordDisposition,
  mutationOutcome,
  objectIdForStripeEvent,
  planSubscriptionWrite,
  responseForClaimBegin,
  selectCheckoutAccount,
  shouldApplySubscriptionEvent,
  shouldSendBillingEmail,
} from './webhook-reliability.ts'

const clerkAccount = {
  id: 'user_clerk_owner',
  email: 'owner@example.test',
  username: 'owner',
  stripeCustomerId: 'cus_existing',
}
const otherAccount = {
  id: 'user_other',
  email: 'owner@example.test',
  username: 'other',
  stripeCustomerId: 'cus_other',
}

describe('Stripe webhook can be verified without a Clerk session', () => {
  it('lists only the webhook path as public and keeps checkout and portal authenticated', () => {
    assert.ok(CLERK_PUBLIC_ROUTE_PATTERNS.includes('/api/stripe/webhook'))
    assert.equal(
      CLERK_PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.startsWith('/api/stripe(')),
      false,
    )
    assert.equal(CLERK_PUBLIC_ROUTE_PATTERNS.includes('/api/stripe/create-checkout-session'), false)
    assert.equal(CLERK_PUBLIC_ROUTE_PATTERNS.includes('/api/stripe/create-portal-session'), false)
  })

  it('rejects a missing secret, a missing signature, and an invalid signature', () => {
    assert.deepEqual(gateStripeWebhookRequest({ secretConfigured: false, signature: 'sig' }), {
      ok: false,
      status: 500,
      error: 'Webhook secret not configured',
    })
    assert.deepEqual(gateStripeWebhookRequest({ secretConfigured: true, signature: null }), {
      ok: false,
      status: 400,
      error: 'Missing signature',
    })
    assert.deepEqual(gateStripeWebhookSignature(false), {
      ok: false,
      status: 400,
      error: 'Invalid signature',
    })
    assert.deepEqual(gateStripeWebhookRequest({ secretConfigured: true, signature: 'sig' }), {
      ok: true,
    })
    assert.deepEqual(gateStripeWebhookSignature(true), { ok: true })
  })
})

describe('webhook processing outcomes', () => {
  it('acknowledges a successful event and treats a later delivery as a duplicate', () => {
    const claims = createStripeEventClaimStore()
    assert.equal(claims.begin('evt_success'), 'new')
    const finished = finishWebhookAttempt(claims, 'evt_success', 'success')
    assert.equal(finished.status, 200)
    assert.deepEqual(finished.body, { received: true })
    assert.equal(claims.begin('evt_success'), 'duplicate')
    assert.deepEqual(responseForClaimBegin('duplicate'), {
      stop: true,
      status: 200,
      body: { received: true, duplicate: true },
    })
    assert.equal(claims.begin(''), 'missing')
  })

  it('rejects an invalid signature before an event id is reserved', () => {
    const source = readFileSync('app/api/stripe/webhook/route.ts', 'utf8')
    const signatureAt = source.indexOf('gateStripeWebhookSignature(false)')
    const beginAt = source.indexOf('durability.claim(')
    assert.ok(signatureAt > 0)
    assert.ok(beginAt > signatureAt)
    assert.deepEqual(gateStripeWebhookSignature(false), {
      ok: false,
      status: 400,
      error: 'Invalid signature',
    })
  })

  it('returns a retryable response for a database failure and allows the same event to succeed later', () => {
    const claims = createStripeEventClaimStore()
    assert.equal(claims.begin('evt_db_failure'), 'new')
    assert.equal(mutationOutcome('failed'), 'failure')
    assert.equal(mutationOutcome('not_found'), 'failure')
    assert.equal(lookupBlocksProcessing('failed'), true)
    assert.equal(lookupBlocksProcessing('not_found'), false)
    assert.equal(lookupBlocksProcessing('found'), false)
    const failed = finishWebhookAttempt(claims, 'evt_db_failure', 'failure')
    assert.equal(failed.status, 500)
    assert.deepEqual(failed.body, { error: 'Webhook processing failed' })
    assert.equal(claims.begin('evt_db_failure'), 'new')

    assert.equal(mutationOutcome('updated'), 'success')
    const retried = finishWebhookAttempt(claims, 'evt_db_failure', 'success')
    assert.equal(retried.status, 200)
    assert.equal(claims.begin('evt_db_failure'), 'duplicate')
  })

  it('does not acknowledge a second delivery that overlaps an unfinished attempt', () => {
    const claims = createStripeEventClaimStore()
    assert.equal(claims.begin('evt_open'), 'new')
    assert.equal(claims.begin('evt_open'), 'in_flight')
    assert.deepEqual(responseForClaimBegin('in_flight'), {
      stop: true,
      status: 500,
      body: { error: 'Webhook processing failed' },
    })
    const finished = finishWebhookAttempt(claims, 'evt_open', 'success')
    assert.equal(finished.status, 200)
    assert.equal(claims.begin('evt_open'), 'duplicate')
  })

  it('drops the oldest settled event id after the in-process cap', () => {
    const claims = createStripeEventClaimStore(2)
    assert.equal(claims.begin('evt_a'), 'new')
    claims.settle('evt_a')
    assert.equal(claims.begin('evt_b'), 'new')
    claims.settle('evt_b')
    assert.equal(claims.begin('evt_c'), 'new')
    claims.settle('evt_c')
    assert.equal(claims.begin('evt_b'), 'duplicate')
    assert.equal(claims.begin('evt_a'), 'new')
  })

  it('sends a billing email once and retries a failed send without marking it', () => {
    const ledger = createBillingEmailLedger()
    const key = 'pro_upgrade:sub_synthetic'
    assert.equal(shouldSendBillingEmail(ledger.wasSent(key), true), true)
    const failed = classifyEmailResult('failed')
    assert.equal(failed.markSent, false)
    assert.equal(failed.outcome, 'failure')
    assert.equal(ledger.wasSent(key), false)

    const sent = classifyEmailResult('sent')
    if (sent.markSent) ledger.markSent(key)
    assert.equal(shouldSendBillingEmail(ledger.wasSent(key), true), false)
    assert.equal(classifyEmailResult('not_configured').outcome, 'success')
    assert.equal(classifyEmailResult('not_configured').markSent, false)
    assert.equal(shouldSendBillingEmail(false, false), false)
  })

  it('writes the subscription before the email and settles only after the handler returns', () => {
    const source = readFileSync('app/api/stripe/webhook/route.ts', 'utf8')
    const claimAt = source.indexOf('durability.claim(')
    const dispatchAt = source.indexOf('dispatchStripeEvent(event, stripe, durability)')
    const processedAt = source.indexOf('durability.markProcessed(event.id)')
    const failedAt = source.indexOf('durability.markFailed(event.id)')
    assert.ok(claimAt > 0)
    assert.ok(dispatchAt > claimAt)
    assert.ok(processedAt > dispatchAt)
    assert.ok(failedAt > processedAt)
    assert.match(source, /createPostgresStripeDurabilityStore/)
    assert.doesNotMatch(source, /stripeEventClaims/)
    assert.doesNotMatch(source, /billingEmailLedger/)
    assert.doesNotMatch(source, /createMemoryStripeDurabilityStore/)
    assert.match(source, /Durable webhook record failed/)

    const checkout = source.slice(
      source.indexOf('async function handleCheckoutSessionCompleted'),
      source.indexOf('async function handleSubscriptionUpdated'),
    )
    assert.ok(checkout.indexOf('checkoutRecipientEmail') < checkout.indexOf('Missing customerId or email'))
    assert.ok(checkout.indexOf('Missing customerId or email') < checkout.indexOf("return 'failure'"))
    assert.ok(checkout.indexOf('missingRecordDisposition') < checkout.indexOf('syncStripeSubscriptionToUser'))
    assert.ok(checkout.indexOf('applyCurrentSubscriptionWrite') < checkout.indexOf('syncStripeSubscriptionToUser'))
    assert.ok(checkout.indexOf('syncStripeSubscriptionToUser') < checkout.indexOf('sendProUpgradeEmail'))
    assert.match(checkout, /mutationOutcome\(written\.status\) === 'failure'/)
    assert.match(checkout, /return 'failure'/)

    const apply = source.slice(
      source.indexOf('async function applyCurrentSubscriptionWrite'),
      source.indexOf('async function handleCheckoutSessionCompleted'),
    )
    assert.ok(apply.indexOf('claimSubscriptionVersion') < apply.indexOf('await write()'))
    assert.match(apply, /releaseSubscriptionVersion/)

    const updated = source.slice(
      source.indexOf('async function handleSubscriptionUpdated'),
      source.indexOf('async function handleSubscriptionDeleted'),
    )
    assert.ok(updated.indexOf('missingRecordDisposition') < updated.indexOf('applyCurrentSubscriptionWrite'))
    assert.ok(updated.indexOf('applyCurrentSubscriptionWrite') < updated.indexOf('syncStripeSubscriptionToUser'))

    const removed = source.slice(
      source.indexOf('async function handleSubscriptionDeleted'),
      source.indexOf('async function handleInvoicePaymentSucceeded'),
    )
    assert.ok(removed.indexOf('missingRecordDisposition') < removed.indexOf('downgradeUserSubscription'))
    assert.ok(removed.indexOf('applyCurrentSubscriptionWrite') < removed.indexOf('downgradeUserSubscription'))
    assert.ok(removed.indexOf('downgradeUserSubscription') < removed.indexOf('sendSubscriptionCancelledEmail'))
    assert.match(source, /sendPaymentFailedEmail/)
    assert.match(source, /releaseEmail/)
  })
})

describe('durable webhook claims survive replay and reordering', () => {
  const event = {
    eventId: 'evt_synthetic',
    eventType: 'customer.subscription.updated',
    stripeCreated: 1_700_000_000,
    objectId: 'sub_synthetic',
  }

  it('acks a processed event and retries one that is still in flight', async () => {
    const store = createMemoryStripeDurabilityStore()
    assert.deepEqual(durableAdmissionResponse(await store.claim(event)), { stop: false })
    assert.deepEqual(durableAdmissionResponse(await store.claim(event)), {
      stop: true,
      status: 500,
      body: { error: 'Webhook processing failed' },
    })
    await store.markProcessed(event.eventId)
    const duplicate = durableAdmissionResponse(await store.claim(event))
    assert.equal(duplicate.stop, true)
    if (duplicate.stop) assert.equal(duplicate.status, 200)
  })

  it('reclaims a failed attempt and an abandoned processing lease', async () => {
    let clock = 10_000
    const store = createMemoryStripeDurabilityStore({ now: () => clock, leaseMs: 50 })
    assert.equal((await store.claim(event)).result, 'claimed')
    await store.markFailed(event.eventId)
    assert.equal((await store.claim(event)).result, 'claimed')

    clock += 10
    assert.equal((await store.claim(event)).result, 'in_flight')
    clock += 50
    assert.equal((await store.claim(event)).result, 'claimed')
  })

  it('keeps every processed event id', async () => {
    const store = createMemoryStripeDurabilityStore()
    for (let index = 0; index < 5; index += 1) {
      const eventId = `evt_${index}`
      assert.equal((await store.claim({ ...event, eventId })).result, 'claimed')
      await store.markProcessed(eventId)
    }
    for (let index = 0; index < 5; index += 1) {
      assert.equal((await store.claim({ ...event, eventId: `evt_${index}` })).result, 'duplicate')
    }
  })

  it('skips an older subscription write after a newer one is claimed', async () => {
    const store = createMemoryStripeDurabilityStore()
    assert.equal(await store.claimSubscriptionVersion('sub_synthetic', 200, 'evt_new'), 'apply')
    assert.equal(await store.claimSubscriptionVersion('sub_synthetic', 100, 'evt_old'), 'skip_stale')
    assert.equal(await store.claimSubscriptionVersion('sub_synthetic', 200, 'evt_same_second'), 'apply')
    assert.equal(await store.claimSubscriptionVersion('sub_synthetic', 300, 'evt_newer'), 'apply')
    await store.releaseSubscriptionVersion('sub_synthetic', 'evt_same_second')
    assert.equal(await store.claimSubscriptionVersion('sub_synthetic', 250, 'evt_between'), 'skip_stale')
    await store.releaseSubscriptionVersion('sub_synthetic', 'evt_newer')
    assert.equal(await store.claimSubscriptionVersion('sub_synthetic', 100, 'evt_old'), 'apply')

    await store.claim({ ...event, eventId: 'evt_recorded', stripeCreated: 300 })
    await store.setObjectId('evt_recorded', 'sub_synthetic')
    await store.markProcessed('evt_recorded')
    const newest = await store.newestProcessedCreated('sub_synthetic', 'evt_old')
    assert.equal(shouldApplySubscriptionEvent({ incomingCreated: 200, newestProcessedCreated: newest }), false)
    assert.equal(shouldApplySubscriptionEvent({ incomingCreated: 300, newestProcessedCreated: newest }), true)
    assert.equal(shouldApplySubscriptionEvent({ incomingCreated: 400, newestProcessedCreated: null }), true)
  })

  it('records a billing email once and releases it when the send fails', async () => {
    let clock = 1_000
    const store = createMemoryStripeDurabilityStore({ now: () => clock, leaseMs: 50 })
    const key = 'pro_upgrade:sub_synthetic'
    assert.equal(await store.claimEmail(key), 'claimed')
    assert.equal(await store.claimEmail(key), 'in_flight')
    await store.releaseEmail(key)
    assert.equal(await store.claimEmail(key), 'claimed')
    await store.markEmailSent(key)
    assert.equal(await store.claimEmail(key), 'already_sent')
    clock += 50
    assert.equal(await store.claimEmail(key), 'already_sent')
  })

  it('retries a missing account and reads the checkout email from customer details', () => {
    assert.equal(missingRecordDisposition(false), 'failure')
    assert.equal(missingRecordDisposition(true), 'continue')
    assert.equal(checkoutRecipientEmail({
      customer_email: null,
      email: null,
      customer_details: { email: 'owner@example.test' },
    }), 'owner@example.test')
    assert.equal(checkoutRecipientEmail({
      customer_email: 'session@example.test',
      customer_details: { email: 'other@example.test' },
    }), 'session@example.test')
    assert.equal(objectIdForStripeEvent({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_synthetic', subscription: 'sub_synthetic' } },
    }), 'sub_synthetic')
    assert.equal(objectIdForStripeEvent({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_synthetic' } },
    }), 'sub_synthetic')
  })

  it('prepares the additive tables and queries them strictly', () => {
    const migration = readFileSync('scripts/036-stripe-webhook-events.sql', 'utf8')
    assert.match(migration, /CREATE TABLE IF NOT EXISTS stripe_webhook_events/)
    assert.match(migration, /CREATE TABLE IF NOT EXISTS stripe_billing_emails/)
    assert.match(migration, /CREATE TABLE IF NOT EXISTS stripe_subscription_versions/)
    assert.match(migration, /does not execute it/)
    assert.doesNotMatch(migration, /DROP TABLE/)
    assert.doesNotMatch(migration, /ALTER TABLE users/)
    assert.doesNotMatch(migration, /subscription_plan/)

    const database = readFileSync('lib/stripe/webhook-durability-db.ts', 'utf8')
    assert.match(database, /queryStrict/)
    assert.match(database, /ON CONFLICT \(event_id\) DO NOTHING/)
    assert.match(database, /ON CONFLICT \(dedupe_key\) DO NOTHING/)
    assert.match(database, /stripe_subscription_versions.stripe_created <= EXCLUDED.stripe_created/)
    assert.match(database, /no in-memory fallback/i)
    assert.doesNotMatch(database, /queryOne\(/)
    assert.doesNotMatch(database, /createMemoryStripeDurabilityStore/)
    assert.doesNotMatch(database, /createStripeEventClaimStore/)
  })
})

describe('subscription updates stay on the authenticated account', () => {
  it('uses the Clerk id from checkout metadata instead of a shared email', () => {
    const selected = selectCheckoutAccount({
      metadataUserId: 'user_2synthetic',
      accountByClerkId: clerkAccount,
      accountByEmail: otherAccount,
    })
    assert.equal(selected?.id, clerkAccount.id)
  })

  it('does not fall through to email when the checkout account is missing', () => {
    const selected = selectCheckoutAccount({
      metadataUserId: 'user_2synthetic',
      accountByClerkId: null,
      accountByEmail: otherAccount,
    })
    assert.equal(selected, null)
  })

  it('keeps email fallback only when checkout has no account metadata', () => {
    const selected = selectCheckoutAccount({
      metadataUserId: null,
      accountByClerkId: null,
      accountByEmail: otherAccount,
    })
    assert.equal(selected?.id, otherAccount.id)
  })

  it('preserves an existing Stripe customer when a different customer arrives', () => {
    const blocked = planSubscriptionWrite({
      existingCustomerId: 'cus_existing',
      incoming: {
        customerId: 'cus_new',
        subscriptionId: 'sub_new',
        email: 'owner@example.test',
        status: 'active',
        currentPeriodEnd: '2026-11-01T00:00:00.000Z',
      },
    })
    const sameCustomer = planSubscriptionWrite({
      existingCustomerId: 'cus_existing',
      incoming: {
        customerId: 'cus_existing',
        subscriptionId: 'sub_renewed',
        email: 'owner@example.test',
        status: 'active',
        currentPeriodEnd: '2026-12-01T00:00:00.000Z',
      },
    })
    const firstCustomer = planSubscriptionWrite({
      existingCustomerId: null,
      incoming: {
        customerId: 'cus_first',
        subscriptionId: 'sub_first',
        email: 'owner@example.test',
        status: 'trialing',
        currentPeriodEnd: '2026-10-25T00:00:00.000Z',
      },
    })

    assert.equal(blocked.write, null)
    assert.equal(blocked.preservedExistingCustomer, true)
    assert.equal(sameCustomer.write?.subscriptionId, 'sub_renewed')
    assert.equal(firstCustomer.write?.customerId, 'cus_first')
  })

  it('reuses a stored customer and starts a first checkout without one', () => {
    assert.deepEqual(checkoutCustomerFields('cus_existing'), { customer: 'cus_existing' })
    assert.deepEqual(checkoutCustomerFields(null), {})
    assert.deepEqual(checkoutCustomerFields(undefined), {})
  })

  it('cancellation SQL keeps the stored Stripe customer id', () => {
    const source = readFileSync('lib/subscription-sync.ts', 'utf8')
    const downgrade = source.slice(
      source.indexOf('export async function downgradeUserSubscription'),
      source.indexOf('export async function findUserByStripeCustomerId'),
    )
    const setClause = downgrade.slice(downgrade.indexOf('SET'), downgrade.indexOf('WHERE'))
    assert.match(setClause, /subscription_plan = 'free'/)
    assert.match(setClause, /stripe_subscription_id = NULL/)
    assert.doesNotMatch(setClause, /stripe_customer_id/)
    assert.match(source, /export async function findUserByClerkId/)
    assert.match(source, /WHERE clerk_id = \$1/)
    assert.match(source, /queryStrict/)
    assert.match(source, /status: 'failed'/)
    assert.match(source, /status: 'updated'/)
    assert.match(source, /status: 'not_found'/)
  })

  it('checkout keeps the configured price and the authenticated account metadata', () => {
    const source = readFileSync('app/api/stripe/create-checkout-session/route.ts', 'utf8')
    assert.match(source, /checkoutCustomerFields\(existing\?\.stripe_customer_id\)/)
    assert.match(source, /process\.env\.STRIPE_PRO_PRICE_ID/)
    assert.match(source, /trial_period_days: PRICING\.pro\.trialDays/)
    assert.match(source, /WHERE clerk_id = \$1/)
    assert.match(source, /queryStrict/)
    assert.doesNotMatch(source, /queryOne\(/)
    assert.ok(source.indexOf('queryStrict') < source.indexOf('checkout.sessions.create'))
    assert.match(source, /Could not read the existing Stripe customer/)
    assert.doesNotMatch(source, /customer_email/)
    assert.equal(source.includes('userId'), true)

    const sync = readFileSync('lib/subscription-sync.ts', 'utf8')
    assert.match(sync, /subscriptionData\.status === 'active' \|\| subscriptionData\.status === 'trialing'/)
  })
})
