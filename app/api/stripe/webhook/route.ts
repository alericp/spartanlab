import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import {
  syncStripeSubscriptionToUser,
  downgradeUserSubscription,
  findUserByStripeCustomerId,
  findUserByEmail,
  type StripeSubscriptionData,
} from '@/lib/subscription-sync'
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
async function handleCheckoutSessionCompleted(event: StripeEvent): Promise<void> {
  const session = event.data.object
  const customerId = session.customer as string
  const email = session.customer_email as string || session.email as string

  console.log(`[Stripe Webhook] Checkout completed for customer: ${customerId}, email: ${email}`)

  if (!customerId || !email) {
    console.warn('[Stripe Webhook] Missing customerId or email in checkout session')
    return
  }

  try {
    // Get the subscription from the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      console.warn('[Stripe Webhook] No subscription found for customer', customerId)
      return
    }

    const subscription = subscriptions.data[0]

    // Find user by email
    const user = await findUserByEmail(email)
    if (!user) {
      console.warn(`[Stripe Webhook] User not found for email: ${email}`)
      // Still send email even if user not in DB yet (they just signed up)
    }

    // Sync subscription to user if found
    if (user) {
      const subscriptionData: StripeSubscriptionData = {
        customerId,
        subscriptionId: subscription.id,
        email,
        status: (subscription.status as any) || 'active',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      }

      await syncStripeSubscriptionToUser(user.id, subscriptionData)
      console.log(`[Stripe Webhook] Successfully updated user ${user.id} subscription`)
    }

    // Send Pro upgrade confirmation email (idempotent)
    // Use subscription ID as resource ID to prevent duplicate emails
    if (!wasEmailAlreadySent('pro_upgrade', subscription.id)) {
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
async function handleSubscriptionUpdated(event: StripeEvent): Promise<void> {
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

    // Sync subscription data
    const subscriptionData: StripeSubscriptionData = {
      customerId,
      subscriptionId,
      email: user.email,
      status: status as StripeSubscriptionData['status'],
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
    }

    await syncStripeSubscriptionToUser(user.id, subscriptionData)
    console.log(`[Stripe Webhook] Successfully synced subscription update for user ${user.id}`)
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.updated:', error)
  }
}

/**
 * Handle customer.subscription.deleted event
 * Called when subscription is canceled - send cancellation email
 */
async function handleSubscriptionDeleted(event: StripeEvent): Promise<void> {
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
async function handleInvoicePaymentSucceeded(event: StripeEvent): Promise<void> {
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
async function handleInvoicePaymentFailed(event: StripeEvent): Promise<void> {
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
  // Verify webhook secret is configured
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  try {
    // Get raw body for signature verification
    const body = await request.text()
    const headerPayload = await headers()
    const signature = headerPayload.get('stripe-signature')

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: StripeEvent
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET) as StripeEvent
    } catch (error) {
      console.error('[Stripe Webhook] Signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`[Stripe Webhook] Processing event: ${event.type}`)

    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event)
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
