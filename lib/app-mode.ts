// Application mode detection for dual-mode architecture
// Allows SpartanLab to run in preview mode or production mode

export type AppMode = 'preview' | 'production'

// Check if all required production env vars are present
function hasProductionAuth(): boolean {
  // Clerk env vars - these would be required for production auth
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const clerkSecretKey = process.env.CLERK_SECRET_KEY
  return Boolean(clerkPublishableKey && clerkSecretKey)
}

function hasProductionDatabase(): boolean {
  // Check for Neon/Postgres connection
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  return Boolean(databaseUrl)
}

/**
 * Determine the current application mode
 * Preview mode: No external services required, uses localStorage
 * Production mode: Clerk auth + Neon/Postgres persistence
 */
export function getAppMode(): AppMode {
  // Production mode requires both auth AND database
  if (hasProductionAuth() && hasProductionDatabase()) {
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
 * Check if running in production mode (full external services)
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
 * Check if production database is available (Neon)
 */
export function isDatabaseEnabled(): boolean {
  return hasProductionDatabase()
}

/**
 * Check if full production services are enabled (both auth AND database)
 */
export function isProductionServicesEnabled(): boolean {
  return hasProductionAuth() && hasProductionDatabase()
}

/**
 * Get mode display info for debugging/UI indicators
 */
export function getModeInfo(): {
  mode: AppMode
  authEnabled: boolean
  dbEnabled: boolean
  displayName: string
} {
  return {
    mode: getAppMode(),
    authEnabled: hasProductionAuth(),
    dbEnabled: hasProductionDatabase(),
    displayName: isPreviewMode() ? 'Preview Mode' : 'Production',
  }
}
