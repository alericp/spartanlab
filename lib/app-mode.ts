// Application mode detection for dual-mode architecture
// Allows SpartanLab to run in preview mode or production mode
//
// IMPORTANT: All mode checks must use NEXT_PUBLIC_* env vars only
// to ensure consistent behavior on both server and client.
// Server-only env vars (DATABASE_URL, CLERK_SECRET_KEY) cause hydration mismatches.
//
// For runtime domain detection (client-side only), see lib/environment-guard.ts

export type AppMode = 'preview' | 'production'

/**
 * Check if Clerk auth is configured (works on both client and server)
 * Uses only NEXT_PUBLIC_* env vars to avoid server/client mismatch
 * 
 * NOTE: This only checks if a key exists, not if it's valid for the current domain.
 * Use isAllowedClerkOrigin() from environment-guard.ts for runtime domain checks.
 */
function hasProductionAuth(): boolean {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return Boolean(clerkPublishableKey)
}

/**
 * Check if database is configured (for client-safe detection)
 * Uses NEXT_PUBLIC_DATABASE_ENABLED flag instead of DATABASE_URL
 * since DATABASE_URL is server-only and causes hydration mismatch
 */
function hasProductionDatabase(): boolean {
  // Use a public flag that can be set in Vercel env vars
  // This allows consistent server/client detection
  const dbEnabled = process.env.NEXT_PUBLIC_DATABASE_ENABLED
  return dbEnabled === 'true' || dbEnabled === '1'
}

/**
 * Determine the current application mode
 * Production mode: Clerk auth is configured
 * Preview mode: No Clerk auth configured (local dev without services)
 * 
 * NOTE: We now base mode primarily on auth, not database,
 * to ensure consistent SSR/client rendering.
 */
export function getAppMode(): AppMode {
  // Production mode when Clerk is configured
  if (hasProductionAuth()) {
    return 'production'
  }
  return 'preview'
}

/**
 * Check if running in preview mode (no external services)
 */
export function isPreviewMode(): boolean {
  return getAppMode() === 'preview'
}

/**
 * Check if running in production mode (auth enabled)
 */
export function isProductionMode(): boolean {
  return getAppMode() === 'production'
}

/**
 * Check if production auth services are available (Clerk)
 */
export function isAuthEnabled(): boolean {
  return hasProductionAuth()
}

/**
 * Alias for isAuthEnabled - checks if Clerk is configured
 */
export function isClerkEnabled(): boolean {
  return hasProductionAuth()
}

/**
 * Get detailed mode information for debugging
 */
export function getModeInfo(): {
  mode: AppMode
  displayName: string
  authEnabled: boolean
  dbEnabled: boolean
} {
  return {
    mode: getAppMode(),
    displayName: isPreviewMode() ? 'Preview Mode' : 'Production',
    authEnabled: hasProductionAuth(),
    dbEnabled: hasProductionDatabase(),
  }
}

/**
 * Check if production database is available
 * SERVER-ONLY: Use this only in server components or API routes
 */
export function isDatabaseEnabled(): boolean {
  // For server-side, check actual DATABASE_URL
  if (typeof window === 'undefined') {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
    return Boolean(databaseUrl)
  }
  // For client-side, use the public flag
  return hasProductionDatabase()
}

/**
 * Check if full production services are enabled (both auth AND database)
 */
export function isProductionServicesEnabled(): boolean {
  return hasProductionAuth() && isDatabaseEnabled()
}


