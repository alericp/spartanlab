/**
 * Application mode detection for dual-mode architecture
 * 
 * This file provides application-level mode detection.
 * For auth-specific checks, use auth-environment.ts
 * 
 * IMPORTANT: Uses only NEXT_PUBLIC_* env vars to ensure consistent
 * behavior on both server and client.
 */

import { isClerkConfigured, getAuthMode as getAuthModeFromEnv } from './auth-environment'

// ============================================================================
// TYPES
// ============================================================================

export type AppMode = 'preview' | 'production'

// ============================================================================
// MODE DETECTION
// ============================================================================

/**
 * Check if database is configured (for client-safe detection)
 */
function hasProductionDatabase(): boolean {
  const dbEnabled = process.env.NEXT_PUBLIC_DATABASE_ENABLED
  return dbEnabled === 'true' || dbEnabled === '1'
}

/**
 * Determine the current application mode
 * Production mode: Clerk auth is configured
 * Preview mode: No Clerk auth configured
 */
export function getAppMode(): AppMode {
  if (isClerkConfigured()) {
    return 'production'
  }
  return 'preview'
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
 * Check if auth services are configured (Clerk key exists)
 */
export function isAuthEnabled(): boolean {
  return isClerkConfigured()
}

/**
 * Alias for isAuthEnabled
 */
export function isClerkEnabled(): boolean {
  return isClerkConfigured()
}

/**
 * Get detailed mode information
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
    authEnabled: isClerkConfigured(),
    dbEnabled: hasProductionDatabase(),
  }
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

/**
 * Check if full production services are enabled (both auth AND database)
 */
export function isProductionServicesEnabled(): boolean {
  return isClerkConfigured() && isDatabaseEnabled()
}
