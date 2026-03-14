# Stripe Webhook Integration Guide

## Overview

The Stripe webhook integration syncs subscription events with SpartanLab user data. The implementation is production-ready but requires database integration for user updates.

## Files Created

### 1. `lib/stripe.ts`
- Stripe SDK initialization
- Exports reusable `stripe` instance

### 2. `app/api/stripe/webhook/route.ts`
- Main webhook endpoint at `/api/stripe/webhook`
- Signature verification using `STRIPE_WEBHOOK_SECRET`
- Event handlers for:
  - `checkout.session.completed` - User completes payment
  - `customer.subscription.updated` - Subscription status changes
  - `customer.subscription.deleted` - Subscription canceled
  - `invoice.payment_succeeded` - Payment succeeds
  - `invoice.payment_failed` - Payment fails

### 3. `lib/subscription-sync.ts`
- Reusable subscription sync utilities
- Functions for user lookup and subscription updates
- Standardized interface for subscription data

## Database Integration Steps

To connect the webhook to your database, implement these functions in `lib/subscription-sync.ts`:

### 1. `findUserByEmail(email: string)`
```typescript
export async function findUserByEmail(email: string): Promise<User | null> {
  // Query your database for user with matching email
  // Example with Prisma:
  const user = await db.user.findUnique({ where: { email } })
  return user
}
```

### 2. `findUserByStripeCustomerId(customerId: string)`
```typescript
export async function findUserByStripeCustomerId(customerId: string): Promise<User | null> {
  // Query your database for user with matching stripeCustomerId
  // Example with Prisma:
  const user = await db.user.findUnique({ where: { stripeCustomerId } })
  return user
}
```

### 3. `syncStripeSubscriptionToUser(userId, subscriptionData)`
```typescript
export async function syncStripeSubscriptionToUser(
  userId: string,
  subscriptionData: StripeSubscriptionData
): Promise<User | null> {
  // Update user in database with Stripe subscription data
  // Example with Prisma:
  const user = await db.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: subscriptionData.customerId,
      stripeSubscriptionId: subscriptionData.subscriptionId,
      subscriptionStatus: subscriptionData.status,
      subscriptionTier: subscriptionData.status === 'active' ? 'pro' : 'free',
      subscriptionCurrentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
    },
  })
  return user
}
```

### 4. `downgradeUserSubscription(userId)`
```typescript
export async function downgradeUserSubscription(userId: string): Promise<User | null> {
  // Downgrade user to free plan
  // Example with Prisma:
  const user = await db.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      subscriptionPlan: 'free',
    },
  })
  return user
}
```

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Webhook Configuration in Stripe Dashboard

1. Go to Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret and add to `STRIPE_WEBHOOK_SECRET`

## Testing Webhook Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

## User Model Updates

Add these fields to your User schema:

```typescript
// Stripe subscription fields
stripeCustomerId?: string
stripeSubscriptionId?: string
subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
subscriptionTier?: 'free' | 'pro' | 'elite'
subscriptionCurrentPeriodEnd?: string
```

## Event Flow

### 1. Checkout Completed
```
User pays → Stripe creates Subscription → webhook: checkout.session.completed
→ Find user by email → Sync subscription data → User has Pro access
```

### 2. Subscription Renewed
```
Stripe charges customer → webhook: invoice.payment_succeeded
→ Find user by customer ID → Confirm active status
```

### 3. Subscription Canceled
```
User cancels → Stripe removes subscription → webhook: customer.subscription.deleted
→ Find user by customer ID → Downgrade to Free plan
```

## Logging

All webhook events log to the server console with `[Stripe Webhook]` prefix:

```
[Stripe Webhook] Processing event: checkout.session.completed
[Stripe Webhook] Checkout completed for customer: cus_123, email: user@example.com
[Stripe Webhook] Successfully updated user abc123 subscription
```

## Safety Guarantees

- Webhook signature verified on every request
- Invalid signatures rejected with 400
- Unknown events ignored safely
- All events return HTTP 200 to prevent Stripe retries
- Graceful error handling for missing users
- Server-only processing (no client exposure)
