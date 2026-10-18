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
  billingEmailLedger,
  classifyEmailResult,
  finishWebhookAttempt,
  gateStripeWebhookRequest,
  gateStripeWebhookSignature,
  lookupBlocksProcessing,
  mutationOutcome,
  planSubscriptionWrite,
  responseForClaimBegin,
  selectCheckoutAccount,
  shouldSendBillingEmail,
  stripeEventClaims,
  type BillingAccount,
  type ProcessingOutcome,
} from '@/lib/stripe/webhook-reliability'
import {
  sendProUpgradeEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email-service'

// Stripe webhook signature verification
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

interface StripeEvent {
  id: string
  type: string
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

/**
 * Send a billing email after the subscription write.
 * The ledger records a send only when the provider accepts it, so a failed send can be retried.
 * An unconfigured email service stays a completed attempt, matching the previous skip behavior.
 */
async function deliverBillingEmail(
  key: string,
  recipient: string | null | undefined,
  send: () => Promise<EmailSendResult>,
): Promise<ProcessingOutcome> {
  if (!shouldSendBillingEmail(billingEmailLedger.wasSent(key), Boolean(recipient))) {
    return 'success'
  }

  try {
    const result = await send()
    const classified = classifyEmailResult(
      result.success
        ? 'sent'
        : result.error === 'Email service not configured'
          ? 'not_configured'
          : 'failed',
    )
    if (classified.markSent) billingEmailLedger.markSent(key)
    if (classified.outcome === 'failure') {
      console.error(`[Stripe Webhook] Billing email failed for ${key}`)
    }
    return classified.outcome
  } catch (error) {
    console.error(`[Stripe Webhook] Billing email failed for ${key}:`, error)
    return 'failure'
  }
}

/**
 * Handle checkout.session.completed event
 * Called when user completes payment - this is the trustworthy moment to send upgrade email
 */
async function handleCheckoutSessionCompleted(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<ProcessingOutcome> {
  const session = event.data.object
  const customerId = typeof session.customer === 'string' ? session.customer : ''
  const email = (session.customer_email as string) || (session.email as string) || ''

  console.log(`[Stripe Webhook] Checkout completed for customer: ${customerId}, email: ${email}`)

  if (!customerId || !email) {
    console.warn('[Stripe Webhook] Missing customerId or email in checkout session')
    return 'success'
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

    let accountByClerkId: BillingAccount | null = null
    let accountByEmail: BillingAccount | null = null
    if (metadataUserId) {
      const lookup = await findUserByClerkId(metadataUserId)
      if (lookupBlocksProcessing(lookup.status)) return 'failure'
      accountByClerkId = lookup.status === 'found' ? lookup.account : null
    } else {
      const lookup = await findUserByEmail(email)
      if (lookupBlocksProcessing(lookup.status)) return 'failure'
      accountByEmail = lookup.status === 'found' ? lookup.account : null
    }

    const user = selectCheckoutAccount({
      metadataUserId,
      accountByClerkId,
      accountByEmail,
    })

    if (!user) {
      console.warn('[Stripe Webhook] Checkout account not found for completed session')
    } else {
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

      const written = await syncStripeSubscriptionToUser(user.id, planned.write)
      if (mutationOutcome(written.status) === 'failure') {
        console.error(`[Stripe Webhook] Subscription update failed for user ${user.id}`)
        return 'failure'
      }
      console.log(`[Stripe Webhook] Successfully updated user ${user.id} subscription`)
    }

    const customerName = session.customer_details?.name || user?.username
    return deliverBillingEmail(`pro_upgrade:${subscriptionId}`, email, () => sendProUpgradeEmail({
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
async function handleSubscriptionUpdated(event: StripeEvent, _stripe: ReturnType<typeof getStripe>): Promise<ProcessingOutcome> {
  const subscription = event.data.object
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id as string
  const status = subscription.status as string
  const currentPeriodEnd = subscription.current_period_end as number

  console.log(`[Stripe Webhook] Subscription updated: ${subscriptionId}, status: ${status}`)

  try {
    const lookup = await findUserByStripeCustomerId(customerId)
    if (lookupBlocksProcessing(lookup.status)) return 'failure'
    if (lookup.status !== 'found') {
      console.warn(`[Stripe Webhook] No user found for customer: ${customerId}`)
      return 'success'
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

    const written = await syncStripeSubscriptionToUser(user.id, planned.write)
    if (mutationOutcome(written.status) === 'failure') {
      console.error(`[Stripe Webhook] Subscription update failed for user ${user.id}`)
      return 'failure'
    }
    console.log(`[Stripe Webhook] Successfully synced subscription update for user ${user.id}`)
    return 'success'
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.updated:', error)
    return 'failure'
  }
}

/**
 * Handle customer.subscription.deleted event
 * Called when subscription is canceled - send cancellation email
 */
async function handleSubscriptionDeleted(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<ProcessingOutcome> {
  const subscription = event.data.object
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id as string

  console.log(`[Stripe Webhook] Subscription deleted: ${subscriptionId}`)

  try {
    const lookup = await findUserByStripeCustomerId(customerId)
    if (lookupBlocksProcessing(lookup.status)) return 'failure'

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

    if (lookup.status === 'found') {
      const written = await downgradeUserSubscription(lookup.account.id)
      if (mutationOutcome(written.status) === 'failure') {
        console.error(`[Stripe Webhook] Subscription downgrade failed for user ${lookup.account.id}`)
        return 'failure'
      }
      console.log(`[Stripe Webhook] Successfully downgraded user ${lookup.account.id} to free plan`)
      customerEmail = customerEmail || lookup.account.email
      customerName = customerName || lookup.account.username
    }

    return deliverBillingEmail(
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
async function handleInvoicePaymentFailed(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<ProcessingOutcome> {
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

    return deliverBillingEmail(`payment_failed:${invoiceId}`, customerEmail, () => sendPaymentFailedEmail({
      email: customerEmail || '',
      name: customerName,
    }))
  } catch (error) {
    console.error('[Stripe Webhook] Error handling invoice.payment_failed:', error)
    return 'failure'
  }
}

async function dispatchStripeEvent(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<ProcessingOutcome> {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutSessionCompleted(event, stripe)
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event, stripe)
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event, stripe)
    case 'invoice.payment_succeeded':
      return handleInvoicePaymentSucceeded(event, stripe)
    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event, stripe)
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

  const begin = stripeEventClaims.begin(event.id)
  const early = responseForClaimBegin(begin)
  if (early.stop) {
    if (begin === 'duplicate') console.log(`[Stripe Webhook] Duplicate event ${event.id}`)
    return NextResponse.json(early.body, { status: early.status })
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type}`)

  let outcome: ProcessingOutcome = 'failure'
  try {
    outcome = await dispatchStripeEvent(event, stripe)
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error)
    outcome = 'failure'
  }

  const finished = finishWebhookAttempt(stripeEventClaims, event.id, outcome)
  return NextResponse.json(finished.body, { status: finished.status })
}
