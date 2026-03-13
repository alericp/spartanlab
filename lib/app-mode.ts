/**
 * Application Mode Detection
 * 
 * IMPORTANT: This file derives from auth-environment.ts - the single source of truth.
 * 
 * App mode is based on whether Clerk CAN initialize on the current domain,
 * NOT just whether a Clerk key exists.
 */

import { 
  shouldInitializeClerk, 
  isClerkConfigured, 
  getAuthMode as getAuthModeFromEnv,
  isPreviewEnvironment
} from './auth-environment'

// ============================================================================
// TYPES
// ============================================================================

export type AppMode = 'preview' | 'production'

// ============================================================================
// MODE DETECTION - Derived from auth-environment
// ============================================================================

/**
 * Determine the current application mode.
 * 
 * CRITICAL: Uses shouldInitializeClerk() which checks DOMAIN + KEY,
 * not just whether a key exists.
 * 
 * Production mode: Clerk CAN initialize (correct domain + valid key)
 * Preview mode: Clerk CANNOT initialize (wrong domain or no key)
 */
export function getAppMode(): AppMode {
  // Use the auth environment source of truth
  return shouldInitializeClerk() ? 'production' : 'preview'
}

/**
 * Check if running in preview mode
 */
export function isPreviewMode(): boolean {
  return getAppMode() === 'preview'
}

/**
 * Check if running in production mode
 */
export function isProductionMode(): boolean {
  return getAppMode() === 'production'
}

/**
 * Check if auth services are enabled and usable
 * This means Clerk CAN initialize, not just that a key exists
 */
export function isAuthEnabled(): boolean {
  return shouldInitializeClerk()
}

/**
 * Alias for isAuthEnabled - checks if Clerk can actually be used
 */
export function isClerkEnabled(): boolean {
  return shouldInitializeClerk()
}

/**
 * Check if Clerk is configured (key exists) - may not be usable on current domain
 */
export function isClerkKeyConfigured(): boolean {
  return isClerkConfigured()
}

// ============================================================================
// DATABASE DETECTION
// ============================================================================

/**
 * Check if database is configured (for client-safe detection)
 */
function hasProductionDatabase(): boolean {
  const dbEnabled = process.env.NEXT_PUBLIC_DATABASE_ENABLED
  return dbEnabled === 'true' || dbEnabled === '1'
}

/**
 * Check if production database is available
 * SERVER-ONLY: Use this only in server components or API routes
 */
export function isDatabaseEnabled(): boolean {
  if (typeof window === 'undefined') {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
    return Boolean(databaseUrl)
  }
  return hasProductionDatabase()
}

// ============================================================================
// MODE INFO
// ============================================================================

/**
 * Get detailed mode information
 */
export function getModeInfo(): {
  mode: AppMode
  displayName: string
  authEnabled: boolean
  dbEnabled: boolean
  isPreview: boolean
} {
  const mode = getAppMode()
  return {
    mode,
    displayName: mode === 'preview' ? 'Preview Mode' : 'Production',
    authEnabled: shouldInitializeClerk(),
    dbEnabled: hasProductionDatabase(),
    isPreview: mode === 'preview',
  }
}

/**
 * Check if full production services are enabled (both auth AND database usable)
 */
export function isProductionServicesEnabled(): boolean {
  return shouldInitializeClerk() && isDatabaseEnabled()
}
