// Application mode detection for dual-mode architecture
// Allows SpartanLab to run in preview mode or production mode

export type AppMode = 'preview' | 'production'

// Check if Clerk auth is configured (works on both client and server)
function hasProductionAuth(): boolean {
  // Only check the public key - CLERK_SECRET_KEY is not available in browser
  // This prevents auth from appearing disabled on the client when Clerk is configured
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return Boolean(clerkPublishableKey)
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


