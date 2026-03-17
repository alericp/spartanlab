# SpartanLab Subscription Architecture

## Overview

This document describes the new unified subscription architecture that makes the **DATABASE the single source of truth** for all entitlement decisions.

## Problem Solved

Previously, SpartanLab had a **dual-source-of-truth problem**:
- Client-side localStorage was acting as the authoritative subscription state
- Database subscription status existed but was not consistently used
- Protected API endpoints had no server-side enforcement
- Free and Pro status could drift or become stale

This architecture fix eliminates that problem.

## Architecture

### Layers

```
┌─────────────────────────────────────────┐
│  PROTECTED PAGES & API ROUTES           │
│  (use server-side checks)               │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  SERVER ENFORCEMENT                     │
│  lib/server/require-pro.ts              │
│  (reads from DATABASE)                  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  ENTITLEMENT API                        │
│  /api/entitlement (GET)                 │
│  (canonical server endpoint)            │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  CLIENT HYDRATION                       │
│  useEntitlement() hook (SWR)            │
│  (database-backed cache)                │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│  DATABASE (SOURCE OF TRUTH)             │
│  users.subscription_plan                │
│  users.subscription_status              │
│  users.trial_ends_at                    │
└─────────────────────────────────────────┘
```

### Database Schema

```sql
-- users table now includes subscription state columns:

users.subscription_plan         -- 'free' or 'pro'
users.subscription_status       -- 'active' | 'trialing' | 'canceled' | 'none'
users.trial_ends_at             -- Timestamp when trial ends (if trialing)

-- Related Stripe columns (already existed):
users.stripe_customer_id        -- Stripe customer ID
users.stripe_subscription_id    -- Stripe subscription ID
```

### Webhook Flow

```
Stripe Event
    ↓
/api/stripe/webhook
    ↓
syncStripeSubscriptionToUser()
    ↓
UPDATE users SET
  subscription_status = $1    -- 'active'|'trialing'|'canceled'
  trial_ends_at = $2           -- For trials: current_period_end
    ↓
Database Updated (Source of Truth)
```

### Client-Side Flow

```
Page Load / User Action
    ↓
useEntitlement() Hook
    ↓
fetch /api/entitlement (SWR cached)
    ↓
Server reads from DATABASE
    ↓
Return EntitlementResponse
    ↓
Apply Owner Simulation (if owner)
    ↓
Component Renders (with correct access)
```

### Server-Side API Protection Flow

```
Free User requests /api/constraints
    ↓
Route calls requireProAccess()
    ↓
Server queries DATABASE for subscription status
    ↓
Plan is 'free' → DENY (403)
    ↓
Response: { error: "Pro subscription required" }
```

## Key Components

### 1. Database Query Layer
**File:** `lib/subscription-service.ts`

Functions:
- `getUserSubscription(clerkId)` - Query database for subscription status
- `hasProSubscription(clerkId)` - Boolean check
- `updateUserSubscription()` - Update from webhook
- `cancelUserSubscription()` - Downgrade to free

### 2. Webhook Sync Layer
**File:** `lib/subscription-sync.ts`

Functions:
- `syncStripeSubscriptionToUser()` - Update from Stripe webhook
- `downgradeUserSubscription()` - Handle cancellations
- `findUserByStripeCustomerId()` - Lookup by Stripe
- `findUserByEmail()` - Lookup by email

### 3. Server Enforcement Layer
**File:** `lib/server/require-pro.ts`

Functions:
- `checkProAccess()` - Detailed access check with reason
- `hasServerProAccess()` - Simple boolean
- `requireProAccess()` - Middleware for API routes (returns Response or null)

### 4. Entitlement API
**File:** `app/api/entitlement/route.ts`

- `GET /api/entitlement` - Returns user's subscription state from database
- Response includes: `isSignedIn`, `plan`, `isPro`, `isTrialing`, `isOwner`, `hasProAccess`, `accessSource`
- Applies owner override (owner always has access)
- Fails closed (returns free tier on error)

### 5. Client Hook
**File:** `hooks/useEntitlement.ts`

- `useEntitlement()` - Main hook, SWR-backed
- `useHasProAccess()` - Simple boolean
- `useIsTrialing()` - Check if trial
- `setSimulationMode()` - Set owner simulation (owner-only)

### 6. Owner Simulation
**File:** `components/billing/OwnerSimulationToggle.tsx`

- Owner-only UI toggle in settings
- Sets sessionStorage `spartanlab_owner_sim` to 'off', 'free', or 'pro'
- Applies overlay in `useEntitlement()` for client-side testing
- Does NOT affect server-side checks (server always uses database truth)

## Access Determination Logic

### Server-Side (Authoritative)

```typescript
// lib/server/require-pro.ts
// This is what actually protects API routes and pages

1. Check if user is owner (OWNER_EMAIL match) → Grant access
2. Query database: users.subscription_plan
3. If plan === 'pro' AND (status === 'active' OR status === 'trialing') → Grant access
4. Otherwise → Deny access
```

### Client-Side (Cached, with Testing Overlay)

```typescript
// hooks/useEntitlement.ts
// Fetches server truth and applies simulation for testing

1. If unauthenticated → Free tier
2. Fetch /api/entitlement (get server truth)
3. Apply owner simulation overlay (if owner set one)
   - 'off' → use server truth
   - 'free' → override to free (for testing)
   - 'pro' → override to pro (for testing)
4. Return final state to components
```

## Important Principles

### 1. Database is Always Authoritative
- Server enforcement (API routes, pages) reads DATABASE only
- localStorage is never used for protection decisions
- Client state is DERIVED from server, not authoritative

### 2. Trial Users are Treated as Pro
- `subscription_status === 'trialing'` grants Pro access
- Trial status is checked alongside active status
- Trial expiration is automatically handled (trial_ends_at < now → no access)

### 3. Owner Bypass Works Correctly
- Owner (email matches NEXT_PUBLIC_OWNER_EMAIL) always has access
- Owner simulation (for testing) is CLIENT-ONLY
- Server never simulates - always checks real database

### 4. Fail-Closed Behavior
- Protected APIs return 403 if subscription cannot be determined
- Pages redirect to /upgrade if unauthorized
- Client defaults to Free if /api/entitlement fails

### 5. Webhook Sync is Reliable
- Stripe webhook updates subscription_status AND trial_ends_at
- Next API call or page load sees new status immediately
- No stale state issues

## Migration Path

### From Old System

Old localStorage-based checks are DEPRECATED but still exist for backward compatibility:

```typescript
// OLD (deprecated)
import { hasProAccess } from '@/lib/feature-access'
const isPro = hasProAccess() // reads localStorage

// NEW (use this)
import { useEntitlement } from '@/hooks/useEntitlement'
const { hasProAccess } = useEntitlement() // reads database
```

### Component Migration Example

```typescript
// OLD (localStorage-based)
export function MyComponent() {
  const isPro = hasProAccess()
  return isPro ? <ProFeature /> : <UpgradePrompt />
}

// NEW (database-backed)
export function MyComponent() {
  const { hasProAccess, isLoading } = useEntitlement()
  if (isLoading) return <Skeleton />
  return hasProAccess ? <ProFeature /> : <UpgradePrompt />
}
```

## Testing Owner Simulation

Owner can test Free vs Pro behavior using the simulation toggle:

1. Navigate to /settings
2. Look for "Simulation Mode" toggle (owner-only)
3. Select "Free" to test free tier experience
4. Select "Pro" to test pro tier experience
5. Select "Off" to use real subscription status

Simulation affects ONLY:
- Client-side UI rendering
- Client-side routing
- Client-side feature gating

Simulation does NOT affect:
- Server-side API protection
- Protected page access
- Billing system

## Validation Checklist

- [x] Database has `subscription_status` and `trial_ends_at` columns
- [x] Stripe webhook updates both columns
- [x] `getUserSubscription()` reads and checks both columns
- [x] `/api/entitlement` returns database-backed state
- [x] `useEntitlement()` hook fetches from `/api/entitlement`
- [x] Protected API routes use `requireProAccess()`
- [x] Protected pages use `requireProPage()`
- [x] Both server protections use database as source of truth
- [x] Owner simulation only affects client state
- [x] Free users cannot access Pro APIs directly
- [x] Pro/trial users work normally
- [x] Owner/dev toggle still works
- [x] No regressions in checkout flow
- [x] No regressions in public pages

## Next Steps

1. Monitor webhook sync for any drift issues
2. Add metrics/alerts for subscription status mismatches
3. Migrate remaining components from `hasProAccess()` to `useEntitlement()`
4. Consider cleaning up legacy localStorage handling after migration period
5. Add audit logging for subscription changes

## Debugging

### Check User's Entitlement

```bash
# As owner, navigate to /settings
# Look for "Simulation Mode" section which shows:
# - Real subscription status from database
# - Current simulation mode (if any)
# - Actual access granted
```

### Check Subscription in Database

```sql
SELECT 
  id, email, subscription_plan, subscription_status, trial_ends_at
FROM users 
WHERE email = 'user@example.com'
```

### Check API Route Protection

```bash
# Test that free user gets 403
curl -H "Authorization: Bearer <token>" \
  https://spartanlab.app/api/constraints
# Should return: { "error": "Pro subscription required" }
```
