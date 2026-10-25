import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import {
  syncStripeSubscriptionToUser,
  downgradeUserSubscription,
  findUserByStripeCustomerId,
  findUserByEmail,
  findUserByClerkId,
  type StripeSubscriptionData,
} from '@/lib/subscription-sync'
import {
  checkoutRecipientEmail,
  classifyEmailResult,
  durableAdmissionResponse,
  gateStripeWebhookRequest,
  gateStripeWebhookSignature,
  missingRecordDisposition,
  mutationOutcome,
  objectIdForStripeEvent,
  planSubscriptionWrite,
  selectCheckoutAccount,
  shouldSendBillingEmail,
  type BillingAccount,
  type ProcessingOutcome,
  type StripeDurabilityStore,
} from '@/lib/stripe/webhook-reliability'
import { createPostgresStripeDurabilityStore } from '@/lib/stripe/webhook-durability-db'
import {
  sendProUpgradeEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email-service'

// Stripe webhook signature verification
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const durability = createPostgresStripeDurabilityStore()

interface StripeEvent {
  id: string
  type: string
  created?: number
  data: {
    object: {
      id: string
      object: string
      customer?: string
      email?: string
      status?: string
      current_period_end?: number
      subscription?: string
      [key: string]: any
    }
  }
}

type EmailSendResult = { success: boolean; error?: string }

function eventCreated(event: StripeEvent): number {
  return typeof event.created === 'number' ? event.created : 0
}

/**
 * Send a billing email after the subscription write.
 * The durable ledger records a send only when the provider accepts it.
 * A failed send releases the key so Stripe can retry. An unconfigured provider
 * releases the key and still completes the attempt.
 */
async function deliverBillingEmail(
  store: StripeDurabilityStore,
  key: string,
  recipient: string | null | undefined,
  send: () => Promise<EmailSendResult>,
): Promise<ProcessingOutcome> {
  if (!shouldSendBillingEmail(false, Boolean(recipient))) {
    return 'success'
  }

  const claim = await store.claimEmail(key)
  if (claim === 'already_sent') return 'success'
  if (claim === 'in_flight') return 'failure'

  try {
    const result = await send()
    const classified = classifyEmailResult(
      result.success
        ? 'sent'
        : result.error === 'Email service not configured'
          ? 'not_configured'
          : 'failed',
    )
    if (classified.outcome === 'failure') {
      await store.releaseEmail(key)
      console.error(`[Stripe Webhook] Billing email failed for ${key}`)
      return 'failure'
    }
    if (classified.markSent) {
      await store.markEmailSent(key)
    } else {
      await store.releaseEmail(key)
    }
    return 'success'
  } catch (error) {
    console.error(`[Stripe Webhook] Billing email failed for ${key}:`, error)
    await store.releaseEmail(key)
    return 'failure'
  }
}

/**
 * Claim the subscription version, then write. An older event skips the write.
 * A failed write releases the version so the same event can retry.
 */
async function applyCurrentSubscriptionWrite(
  store: StripeDurabilityStore,
  objectId: string,
  stripeCreated: number,
  eventId: string,
  write: () => Promise<ProcessingOutcome>,
): Promise<'applied' | 'skip_stale' | 'failure'> {
  const turn = await store.claimSubscriptionVersion(objectId, stripeCreated, eventId)
  if (turn === 'skip_stale') {
    console.log(`[Stripe Webhook] Skipping stale ${eventId} for ${objectId}`)
    return 'skip_stale'
  }

  try {
    const outcome = await write()
    if (outcome === 'failure') {
      await store.releaseSubscriptionVersion(objectId, eventId)
      return 'failure'
    }
    return 'applied'
  } catch (error) {
    await store.releaseSubscriptionVersion(objectId, eventId)
    throw error
  }
}

/**
 * Handle checkout.session.completed event
 * Called when user completes payment - this is the trustworthy moment to send upgrade email
 */
async function handleCheckoutSessionCompleted(
  event: StripeEvent,
  stripe: ReturnType<typeof getStripe>,
  store: StripeDurabilityStore,
): Promise<ProcessingOutcome> {
  const session = event.data.object
  const customerId = typeof session.customer === 'string' ? session.customer : ''
  const email = checkoutRecipientEmail({
    customer_email: session.customer_email as string | null,
    email: session.email as string | null,
    customer_details: session.customer_details as { email?: string | null } | null,
  })

  console.log(`[Stripe Webhook] Checkout completed for customer: ${customerId}, email: ${email}`)

  if (!customerId || !email) {
    console.warn('[Stripe Webhook] Missing customerId or email in checkout session')
    return 'failure'
  }

  try {
    const metadataUserId = typeof session.metadata?.userId === 'string' && session.metadata.userId
      ? session.metadata.userId
      : null

    let subscriptionId = typeof session.subscription === 'string' ? session.subscription : ''
    let subscriptionStatus: StripeSubscriptionData['status'] = 'active'
    let currentPeriodEnd = Math.floor(Date.now() / 1000)

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      subscriptionId = subscription.id
      subscriptionStatus = (subscription.status as StripeSubscriptionData['status']) || 'active'
      currentPeriodEnd = subscription.current_period_end
    } else {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      })
      if (subscriptions.data.length === 0) {
        console.warn('[Stripe Webhook] No subscription found for customer', customerId)
        return 'failure'
      }
      const subscription = subscriptions.data[0]
      subscriptionId = subscription.id
      subscriptionStatus = (subscription.status as StripeSubscriptionData['status']) || 'active'
      currentPeriodEnd = subscription.current_period_end
    }

    await store.setObjectId(event.id, subscriptionId)

    let accountByClerkId: BillingAccount | null = null
    let accountByEmail: BillingAccount | null = null
    if (metadataUserId) {
      const lookup = await findUserByClerkId(metadataUserId)
      if (lookup.status === 'failed') return 'failure'
      accountByClerkId = lookup.status === 'found' ? lookup.account : null
    } else {
      const lookup = await findUserByEmail(email)
      if (lookup.status === 'failed') return 'failure'
      accountByEmail = lookup.status === 'found' ? lookup.account : null
    }

    const user = selectCheckoutAccount({
      metadataUserId,
      accountByClerkId,
      accountByEmail,
    })

    if (!user) {
      console.warn('[Stripe Webhook] Checkout account not found for completed session')
      return missingRecordDisposition(false) === 'continue' ? 'success' : 'failure'
    }

    const subscriptionData: StripeSubscriptionData = {
      customerId,
      subscriptionId,
      email,
      status: subscriptionStatus,
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
    }
    const planned = planSubscriptionWrite({
      existingCustomerId: user.stripeCustomerId,
      incoming: subscriptionData,
    })

    if (!planned.write) {
      console.warn(`[Stripe Webhook] Preserved existing Stripe customer for user ${user.id}`)
      return 'success'
    }

    const turn = await applyCurrentSubscriptionWrite(
      store,
      subscriptionId,
      eventCreated(event),
      event.id,
      async () => {
        const written = await syncStripeSubscriptionToUser(user.id, planned.write!)
        if (mutationOutcome(written.status) === 'failure') {
          console.error(`[Stripe Webhook] Subscription update failed for user ${user.id}`)
          return 'failure'
        }
        console.log(`[Stripe Webhook] Successfully updated user ${user.id} subscription`)
        return 'success'
      },
    )
    if (turn !== 'applied') return turn === 'failure' ? 'failure' : 'success'

    const customerName = session.customer_details?.name || user.username
    return deliverBillingEmail(store, `pro_upgrade:${subscriptionId}`, email, () => sendProUpgradeEmail({
      email,
      name: customerName || undefined,
    }))
  } catch (error) {
    console.error('[Stripe Webhook] Error handling checkout.session.completed:', error)
    return 'failure'
  }
}

/**
 * Handle customer.subscription.updated event
 * Called when subscription status changes (trial -> active, payment issues, etc.)
 */
async function handleSubscriptionUpdated(
  event: StripeEvent,
  _stripe: ReturnType<typeof getStripe>,
  store: StripeDurabilityStore,
): Promise<ProcessingOutcome> {
  const subscription = event.data.object
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id as string
  const status = subscription.status as string
  const currentPeriodEnd = subscription.current_period_end as number

  console.log(`[Stripe Webhook] Subscription updated: ${subscriptionId}, status: ${status}`)

  try {
    const lookup = await findUserByStripeCustomerId(customerId)
    if (lookup.status !== 'found') {
      if (lookup.status === 'not_found') {
        console.warn(`[Stripe Webhook] No user found for customer: ${customerId}`)
      }
      return missingRecordDisposition(false) === 'continue' ? 'success' : 'failure'
    }

    const user = lookup.account
    const subscriptionData: StripeSubscriptionData = {
      customerId,
      subscriptionId,
      email: user.email,
      status: status as StripeSubscriptionData['status'],
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
    }
    const planned = planSubscriptionWrite({
      existingCustomerId: user.stripeCustomerId,
      incoming: subscriptionData,
    })

    if (!planned.write) {
      console.warn(`[Stripe Webhook] Preserved existing Stripe customer for user ${user.id}`)
      return 'success'
    }

    const turn = await applyCurrentSubscriptionWrite(
      store,
      subscriptionId,
      eventCreated(event),
      event.id,
      async () => {
        const written = await syncStripeSubscriptionToUser(user.id, planned.write!)
        if (mutationOutcome(written.status) === 'failure') {
          console.error(`[Stripe Webhook] Subscription update failed for user ${user.id}`)
          return 'failure'
        }
        console.log(`[Stripe Webhook] Successfully synced subscription update for user ${user.id}`)
        return 'success'
      },
    )
    return turn === 'failure' ? 'failure' : 'success'
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.updated:', error)
    return 'failure'
  }
}

/**
 * Handle customer.subscription.deleted event
 * Called when subscription is canceled - send cancellation email
 */
async function handleSubscriptionDeleted(
  event: StripeEvent,
  stripe: ReturnType<typeof getStripe>,
  store: StripeDurabilityStore,
): Promise<ProcessingOutcome> {
  const subscription = event.data.object
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id as string

  console.log(`[Stripe Webhook] Subscription deleted: ${subscriptionId}`)

  try {
    const lookup = await findUserByStripeCustomerId(customerId)
    if (lookup.status !== 'found') {
      if (lookup.status === 'not_found') {
        console.warn(`[Stripe Webhook] No user found for customer: ${customerId}`)
      }
      return missingRecordDisposition(false) === 'continue' ? 'success' : 'failure'
    }

    let customerEmail: string | null = null
    let customerName: string | undefined
    try {
      const customer = await stripe.customers.retrieve(customerId) as { email?: string; name?: string; deleted?: boolean }
      if (!customer.deleted) {
        customerEmail = customer.email || null
        customerName = customer.name || undefined
      }
    } catch (e) {
      console.warn(`[Stripe Webhook] Could not retrieve customer ${customerId}:`, e)
    }

    const turn = await applyCurrentSubscriptionWrite(
      store,
      subscriptionId,
      eventCreated(event),
      event.id,
      async () => {
        const written = await downgradeUserSubscription(lookup.account.id)
        if (mutationOutcome(written.status) === 'failure') {
          console.error(`[Stripe Webhook] Subscription downgrade failed for user ${lookup.account.id}`)
          return 'failure'
        }
        console.log(`[Stripe Webhook] Successfully downgraded user ${lookup.account.id} to free plan`)
        return 'success'
      },
    )
    if (turn !== 'applied') return turn === 'failure' ? 'failure' : 'success'

    customerEmail = customerEmail || lookup.account.email
    customerName = customerName || lookup.account.username
    return deliverBillingEmail(
      store,
      `subscription_cancelled:${subscriptionId}`,
      customerEmail,
      () => sendSubscriptionCancelledEmail({
        email: customerEmail || '',
        name: customerName,
      }),
    )
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.deleted:', error)
    return 'failure'
  }
}

/**
 * Handle invoice.payment_succeeded event.
 * This handler does not write subscription state. A retrieve error stays a log
 * so Stripe is not asked to retry a read that cannot change the account.
 */
async function handleInvoicePaymentSucceeded(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<ProcessingOutcome> {
  const invoice = event.data.object
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string

  console.log(`[Stripe Webhook] Invoice payment succeeded for customer: ${customerId}`)

  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      console.log(`[Stripe Webhook] Subscription ${subscriptionId} status: ${subscription.status}`)
    } catch (error) {
      console.error('[Stripe Webhook] Error retrieving subscription:', error)
    }
  }
  return 'success'
}

/**
 * Handle invoice.payment_failed event
 * Called when invoice payment fails - send payment failed email
 */
async function handleInvoicePaymentFailed(
  event: StripeEvent,
  stripe: ReturnType<typeof getStripe>,
  store: StripeDurabilityStore,
): Promise<ProcessingOutcome> {
  const invoice = event.data.object
  const customerId = invoice.customer as string
  const invoiceId = invoice.id as string

  console.log(`[Stripe Webhook] Invoice payment failed for customer: ${customerId}`)

  try {
    let customerEmail: string | null = (invoice.customer_email as string) || null
    let customerName: string | undefined

    if (!customerEmail) {
      try {
        const customer = await stripe.customers.retrieve(customerId) as { email?: string; name?: string; deleted?: boolean }
        if (!customer.deleted) {
          customerEmail = customer.email || null
          customerName = customer.name || undefined
        }
      } catch (e) {
        console.warn(`[Stripe Webhook] Could not retrieve customer ${customerId}:`, e)
        return 'failure'
      }
    }

    return deliverBillingEmail(store, `payment_failed:${invoiceId}`, customerEmail, () => sendPaymentFailedEmail({
      email: customerEmail || '',
      name: customerName,
    }))
  } catch (error) {
    console.error('[Stripe Webhook] Error handling invoice.payment_failed:', error)
    return 'failure'
  }
}

async function dispatchStripeEvent(
  event: StripeEvent,
  stripe: ReturnType<typeof getStripe>,
  store: StripeDurabilityStore,
): Promise<ProcessingOutcome> {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutSessionCompleted(event, stripe, store)
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event, stripe, store)
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event, stripe, store)
    case 'invoice.payment_succeeded':
      return handleInvoicePaymentSucceeded(event, stripe)
    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event, stripe, store)
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      return 'success'
  }
}

/**
 * Main webhook handler
 */
export async function POST(request: Request) {
  const headerPayload = await headers()
  const signature = headerPayload.get('stripe-signature')
  const admission = gateStripeWebhookRequest({
    secretConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
    signature,
  })

  if (!admission.ok) {
    console.error(`[Stripe Webhook] ${admission.error}`)
    return NextResponse.json(
      { error: admission.error },
      { status: admission.status }
    )
  }

  let stripe: ReturnType<typeof getStripe>
  let event: StripeEvent
  try {
    stripe = getStripe()
    const body = await request.text()
    try {
      event = stripe.webhooks.constructEvent(body, signature as string, STRIPE_WEBHOOK_SECRET as string) as StripeEvent
    } catch (error) {
      console.error('[Stripe Webhook] Signature verification failed:', error)
      const rejected = gateStripeWebhookSignature(false)
      if (!rejected.ok) {
        return NextResponse.json(
          { error: rejected.error },
          { status: rejected.status }
        )
      }
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }

  if (!event.id) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }

  let outcome: ProcessingOutcome = 'failure'
  try {
    const claim = await durability.claim({
      eventId: event.id,
      eventType: event.type,
      stripeCreated: eventCreated(event),
      objectId: objectIdForStripeEvent(event),
    })
    const early = durableAdmissionResponse(claim)
    if (early.stop) {
      if (claim.result === 'duplicate') console.log(`[Stripe Webhook] Duplicate event ${event.id}`)
      return NextResponse.json(early.body, { status: early.status })
    }

    console.log(`[Stripe Webhook] Processing event: ${event.type}`)
    try {
      outcome = await dispatchStripeEvent(event, stripe, durability)
    } catch (error) {
      console.error('[Stripe Webhook] Error processing webhook:', error)
      outcome = 'failure'
    }

    if (outcome === 'success') await durability.markProcessed(event.id)
    else await durability.markFailed(event.id)
  } catch (error) {
    console.error('[Stripe Webhook] Durable webhook record failed:', error)
    try {
      await durability.markFailed(event.id)
    } catch {
      // The claim table may be missing. Stripe still needs a retryable response.
    }
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }

  if (outcome === 'success') {
    return NextResponse.json({ received: true }, { status: 200 })
  }
  return NextResponse.json(
    { error: 'Webhook processing failed' },
    { status: 500 }
  )
}
