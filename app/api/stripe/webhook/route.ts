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

/**
 * Handle checkout.session.completed event
 * Called when user completes payment
 */
async function handleCheckoutSessionCompleted(event: StripeEvent): Promise<void> {
  const session = event.data.object
  const customerId = session.customer as string
  const email = session.email as string

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
      return
    }

    // Sync subscription to user
    const subscriptionData: StripeSubscriptionData = {
      customerId,
      subscriptionId: subscription.id,
      email,
      status: (subscription.status as any) || 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    }

    await syncStripeSubscriptionToUser(user.id, subscriptionData)
    console.log(`[Stripe Webhook] Successfully updated user ${user.id} subscription`)
  } catch (error) {
    console.error('[Stripe Webhook] Error handling checkout.session.completed:', error)
  }
}

/**
 * Handle customer.subscription.updated event
 * Called when subscription is updated (e.g., renewing, changing plan)
 */
async function handleSubscriptionUpdated(event: StripeEvent): Promise<void> {
  const subscription = event.data.object
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id as string
  const status = subscription.status as string
  const currentPeriodEnd = subscription.current_period_end as number

  console.log(`[Stripe Webhook] Subscription updated: ${subscriptionId}, status: ${status}`)

  // In production: find user by stripeCustomerId and update
  // For now, just log
  console.log(`[Stripe Webhook] Would update customer ${customerId}:`, {
    subscriptionStatus: status,
    subscriptionCurrentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
  })
}

/**
 * Handle customer.subscription.deleted event
 * Called when subscription is canceled
 */
async function handleSubscriptionDeleted(event: StripeEvent): Promise<void> {
  const subscription = event.data.object
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id as string

  console.log(`[Stripe Webhook] Subscription deleted: ${subscriptionId}`)

  try {
    // Find user by Stripe customer ID and downgrade
    const user = await findUserByStripeCustomerId(customerId)
    if (!user) {
      console.warn(`[Stripe Webhook] User not found for Stripe customer: ${customerId}`)
      return
    }

    await downgradeUserSubscription(user.id)
    console.log(`[Stripe Webhook] Successfully downgraded user ${user.id} to free plan`)
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
 * Called when invoice payment fails
 */
async function handleInvoicePaymentFailed(event: StripeEvent): Promise<void> {
  const invoice = event.data.object
  const customerId = invoice.customer as string

  console.log(`[Stripe Webhook] Invoice payment failed for customer: ${customerId}`)

  // In production: mark subscription as past_due or update status
  console.log(`[Stripe Webhook] Would update customer ${customerId} payment status to failed`)
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
