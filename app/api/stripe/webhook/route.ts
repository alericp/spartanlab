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
  gateStripeWebhookRequest,
  gateStripeWebhookSignature,
  planSubscriptionWrite,
  selectCheckoutAccount,
  stripeEventClaims,
} from '@/lib/stripe/webhook-reliability'
import {
  sendProUpgradeEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email-service'

// Stripe webhook signature verification
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// =============================================================================
// IDEMPOTENCY TRACKING
// =============================================================================

// In-memory tracking for processed email events (production: use Redis/DB)
// Key format: `${eventType}:${resourceId}` - prevents duplicate emails for same event
const processedEmailEvents = new Set<string>()

/**
 * Check if email was already sent for this event (idempotency)
 * Returns true if already processed, false if new
 */
function wasEmailAlreadySent(eventType: string, resourceId: string): boolean {
  const key = `${eventType}:${resourceId}`
  if (processedEmailEvents.has(key)) {
    console.log(`[Stripe Webhook] Skipping duplicate email for ${key}`)
    return true
  }
  processedEmailEvents.add(key)
  // Clean up old entries after 1 hour to prevent memory bloat
  setTimeout(() => processedEmailEvents.delete(key), 60 * 60 * 1000)
  return false
}

// =============================================================================
// STRIPE EVENT TYPES
// =============================================================================

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

/**
 * Handle checkout.session.completed event
 * Called when user completes payment - this is the trustworthy moment to send upgrade email
 */
async function handleCheckoutSessionCompleted(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<void> {
  const session = event.data.object
  const customerId = session.customer as string
  const email = session.customer_email as string || session.email as string

  console.log(`[Stripe Webhook] Checkout completed for customer: ${customerId}, email: ${email}`)

  if (!customerId || !email) {
    console.warn('[Stripe Webhook] Missing customerId or email in checkout session')
    return
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
        return
      }
      const subscription = subscriptions.data[0]
      subscriptionId = subscription.id
      subscriptionStatus = (subscription.status as StripeSubscriptionData['status']) || 'active'
      currentPeriodEnd = subscription.current_period_end
    }

    const accountByClerkId = metadataUserId ? await findUserByClerkId(metadataUserId) : null
    const accountByEmail = metadataUserId ? null : await findUserByEmail(email)
    const user = selectCheckoutAccount({
      metadataUserId,
      accountByClerkId,
      accountByEmail,
    })

    if (!user) {
      console.warn('[Stripe Webhook] Checkout account not found for completed session')
    }

    let applied = !user
    if (user) {
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
        applied = false
        console.warn(`[Stripe Webhook] Preserved existing Stripe customer for user ${user.id}`)
      } else {
        await syncStripeSubscriptionToUser(user.id, planned.write)
        applied = true
        console.log(`[Stripe Webhook] Successfully updated user ${user.id} subscription`)
      }
    }

    // Send Pro upgrade confirmation email (idempotent)
    // Use subscription ID as resource ID to prevent duplicate emails
    if (applied && !wasEmailAlreadySent('pro_upgrade', subscriptionId)) {
      const customerName = session.customer_details?.name || user?.username
      await sendProUpgradeEmail({
        email,
        name: customerName || undefined,
      })
      console.log(`[Stripe Webhook] Pro upgrade email sent to ${email}`)
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error handling checkout.session.completed:', error)
  }
}

/**
 * Handle customer.subscription.updated event
 * Called when subscription status changes (trial -> active, payment issues, etc.)
 */
async function handleSubscriptionUpdated(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<void> {
  const subscription = event.data.object
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id as string
  const status = subscription.status as string
  const currentPeriodEnd = subscription.current_period_end as number

  console.log(`[Stripe Webhook] Subscription updated: ${subscriptionId}, status: ${status}`)

  try {
    // Find user by Stripe customer ID
    const user = await findUserByStripeCustomerId(customerId)
    
    if (!user) {
      console.warn(`[Stripe Webhook] No user found for customer: ${customerId}`)
      return
    }

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
      return
    }

    await syncStripeSubscriptionToUser(user.id, planned.write)
    console.log(`[Stripe Webhook] Successfully synced subscription update for user ${user.id}`)
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.updated:', error)
  }
}

/**
 * Handle customer.subscription.deleted event
 * Called when subscription is canceled - send cancellation email
 */
async function handleSubscriptionDeleted(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<void> {
  const subscription = event.data.object
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id as string

  console.log(`[Stripe Webhook] Subscription deleted: ${subscriptionId}`)

  try {
    // Find user by Stripe customer ID and downgrade
    const user = await findUserByStripeCustomerId(customerId)
    
    // Also try to get customer email from Stripe for email sending
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

    // Downgrade user if found
    if (user) {
      await downgradeUserSubscription(user.id)
      console.log(`[Stripe Webhook] Successfully downgraded user ${user.id} to free plan`)
      customerEmail = customerEmail || user.email
      customerName = customerName || user.username
    }

    // Send cancellation email (idempotent)
    if (customerEmail && !wasEmailAlreadySent('subscription_cancelled', subscriptionId)) {
      await sendSubscriptionCancelledEmail({
        email: customerEmail,
        name: customerName,
      })
      console.log(`[Stripe Webhook] Cancellation email sent to ${customerEmail}`)
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.deleted:', error)
  }
}

/**
 * Handle invoice.payment_succeeded event
 * Called when invoice payment succeeds
 */
async function handleInvoicePaymentSucceeded(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<void> {
  const invoice = event.data.object
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string

  console.log(`[Stripe Webhook] Invoice payment succeeded for customer: ${customerId}`)

  // In production: ensure subscription status is 'active'
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
      console.log(`[Stripe Webhook] Subscription ${subscriptionId} status: ${subscription.status}`)
    } catch (error) {
      console.error('[Stripe Webhook] Error retrieving subscription:', error)
    }
  }
}

/**
 * Handle invoice.payment_failed event
 * Called when invoice payment fails - send payment failed email
 */
async function handleInvoicePaymentFailed(event: StripeEvent, stripe: ReturnType<typeof getStripe>): Promise<void> {
  const invoice = event.data.object
  const customerId = invoice.customer as string
  const invoiceId = invoice.id as string

  console.log(`[Stripe Webhook] Invoice payment failed for customer: ${customerId}`)

  try {
    // Get customer email from Stripe
    let customerEmail: string | null = invoice.customer_email as string || null
    let customerName: string | undefined

    // If no email in invoice, fetch from customer
    if (!customerEmail) {
      try {
        const customer = await stripe.customers.retrieve(customerId) as { email?: string; name?: string; deleted?: boolean }
        if (!customer.deleted) {
          customerEmail = customer.email || null
          customerName = customer.name || undefined
        }
      } catch (e) {
        console.warn(`[Stripe Webhook] Could not retrieve customer ${customerId}:`, e)
      }
    }

    // Send payment failed email (idempotent - use invoice ID to prevent duplicates)
    if (customerEmail && !wasEmailAlreadySent('payment_failed', invoiceId)) {
      await sendPaymentFailedEmail({
        email: customerEmail,
        name: customerName,
      })
      console.log(`[Stripe Webhook] Payment failed email sent to ${customerEmail}`)
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error handling invoice.payment_failed:', error)
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

  try {
    // Get Stripe client (request-time safe)
    const stripe = getStripe()
    const body = await request.text()

    let event: StripeEvent
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

    const claim = stripeEventClaims.claim(event.id)
    if (claim === 'duplicate') {
      console.log(`[Stripe Webhook] Duplicate event ${event.id}`)
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    console.log(`[Stripe Webhook] Processing event: ${event.type}`)

    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event, stripe)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event, stripe)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, stripe)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event, stripe)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event, stripe)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
        break
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
