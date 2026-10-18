import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { CLERK_PUBLIC_ROUTE_PATTERNS } from '../routes/public-routes.ts'
import {
  checkoutCustomerFields,
  createStripeEventClaimStore,
  gateStripeWebhookRequest,
  gateStripeWebhookSignature,
  planSubscriptionWrite,
  selectCheckoutAccount,
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

describe('duplicate Stripe events do not repeat billing writes', () => {
  it('claims an event id once and reports a later delivery as a duplicate', () => {
    const claims = createStripeEventClaimStore()
    assert.equal(claims.claim('evt_synthetic_1'), 'new')
    assert.equal(claims.claim('evt_synthetic_1'), 'duplicate')
    assert.equal(claims.claim('evt_synthetic_2'), 'new')
    assert.equal(claims.claim(''), 'missing')
  })

  it('drops the oldest event id after the in-process cap', () => {
    const claims = createStripeEventClaimStore(2)
    assert.equal(claims.claim('evt_a'), 'new')
    assert.equal(claims.claim('evt_b'), 'new')
    assert.equal(claims.claim('evt_c'), 'new')
    assert.equal(claims.claim('evt_b'), 'duplicate')
    assert.equal(claims.claim('evt_a'), 'new')
  })

  it('claims a verified event before handlers and acknowledges a duplicate', () => {
    const source = readFileSync('app/api/stripe/webhook/route.ts', 'utf8')
    const claimAt = source.indexOf('stripeEventClaims.claim(event.id)')
    const duplicateAt = source.indexOf('duplicate: true')
    const switchAt = source.indexOf('switch (event.type)')
    assert.ok(claimAt > 0)
    assert.ok(duplicateAt > claimAt)
    assert.ok(switchAt > duplicateAt)
    assert.match(source, /gateStripeWebhookSignature\(false\)/)
    assert.match(source, /findUserByClerkId/)
    assert.match(source, /selectCheckoutAccount/)
    assert.match(source, /planSubscriptionWrite/)
    assert.match(source, /downgradeUserSubscription/)
    assert.match(source, /sendSubscriptionCancelledEmail/)
    assert.match(source, /sendPaymentFailedEmail/)
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
  })

  it('checkout keeps the configured price and the authenticated account metadata', () => {
    const source = readFileSync('app/api/stripe/create-checkout-session/route.ts', 'utf8')
    assert.match(source, /checkoutCustomerFields\(existing\?\.stripe_customer_id\)/)
    assert.match(source, /process\.env\.STRIPE_PRO_PRICE_ID/)
    assert.match(source, /trial_period_days: PRICING\.pro\.trialDays/)
    assert.match(source, /WHERE clerk_id = \$1/)
    assert.doesNotMatch(source, /customer_email/)
    assert.equal(source.includes('userId'), true)
  })
})
