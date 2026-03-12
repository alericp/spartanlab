# SpartanLab Production Setup Guide

## Overview

SpartanLab now supports a safe dual-mode architecture:

- **Preview Mode**: Fully functional with mock user and localStorage persistence (no external services required)
- **Production Mode**: Real authentication (Clerk) and database persistence (Neon/Postgres)

The app automatically detects available services and enables them safely.

## Environment Variables

### Required for Production Mode

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
CLERK_SECRET_KEY=sk_live_your_key_here

# Neon/Postgres Database
DATABASE_URL=postgresql://user:password@host/database
```

### Optional

If these variables are absent, the app automatically runs in preview-safe mode.

## Setup Steps

### 1. Clerk Setup (Authentication)

1. Go to [clerk.com](https://clerk.com) and create an app
2. Copy your publishable and secret keys
3. Add to your environment variables (Vercel Settings → Environment Variables)

**Important**: If these keys are absent, the app continues to work with mock preview user.

### 2. Neon Setup (Database)

1. Go to [neon.tech](https://neon.tech) and create a database
2. Copy the connection string
3. Add `DATABASE_URL` to environment variables

**Important**: If `DATABASE_URL` is absent, the app continues to work with localStorage.

### 3. Deploy

```bash
# Add environment variables to Vercel
vercel env add

# Deploy
vercel deploy --prod
```

## Architecture

### Mode Detection

The app determines mode at runtime in `/lib/app-mode.ts`:

```typescript
isPreviewMode() → true if production env vars are absent
isAuthEnabled() → true if Clerk keys are present
isDatabaseEnabled() → true if DATABASE_URL is present
```

### Auth Service (`/lib/auth-service.ts`)

- **Preview**: Returns mock user `{ id: 'preview-user', ... }`
- **Production**: Fetches Clerk user, gracefully falls back to preview if Clerk unavailable

### Database (`/lib/db.ts`)

- **Preview**: No database operations (returns empty)
- **Production**: Uses Neon SQL client, safely handles connection failures

### Repositories (`/lib/repositories/`)

Each repository (profile, skills, etc.) supports dual backends:

- **Preview**: localStorage implementation
- **Production**: Neon/SQL implementation with fallback to localStorage

### Plan Source (`/lib/plan-source.ts`)

- **Preview**: localStorage plan switching
- **Production**: Database-backed plans, Stripe webhook integration ready

## Features by Mode

### Preview Mode (no env vars)

✅ All SpartanLab tools work  
✅ Full feature access  
✅ Plan switching available  
✅ Data persists in localStorage  
✅ No external dependencies  

### Production Mode (with env vars)

✅ Real user authentication via Clerk  
✅ Real data persistence in Neon/Postgres  
✅ User-specific data isolation  
✅ Stripe subscription ready  
✅ Graceful fallback to localStorage if services unavailable  

## Testing

### In Preview Mode

1. Visit app → No login required
2. All tools work normally
3. Data stored in browser localStorage
4. Plan switcher available (top right corner in admin mode)

### Testing Production Services Locally

```bash
# Add test environment variables to .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://test_user:test_password@localhost/test_db
```

Then restart the dev server:

```bash
npm run dev
```

The app will automatically switch to production mode.

## Safety Features

1. **No Required External Services**: App works with NO env vars
2. **Graceful Degradation**: If Clerk/DB fails, app uses preview mode
3. **No Auth Redirect Loops**: Preview mode always accessible
4. **No Data Loss**: localStorage fallback prevents crashes
5. **No Build-Time Dependencies**: Clerk/DB clients loaded only when needed

## Future: Stripe Integration

Stripe checkout is prepared in the pricing page:

```typescript
// /app/pricing/page.tsx
// Buttons call /api/create-checkout-session
// On success, plan syncs via syncPlanFromStripe()
```

To enable:

1. Add Stripe API keys to env vars
2. Create Stripe webhook handler
3. Update plan sync logic

## Troubleshooting

### "App not working" → Check environment variables

```bash
# Vercel
vercel env ls

# Local
cat .env.local
```

### "User data not saving" → Check database connection

```bash
# Test connection string
psql $DATABASE_URL -c "SELECT 1"
```

### "Auth not working" → Check Clerk keys

```bash
# Clerk Dashboard → API Keys
# Verify NEXT_PUBLIC_ key is public
# Verify SK key is secret
```

## Rollback to Preview Mode

Simply remove production env vars, and the app reverts to preview mode automatically.

No code changes required.
