/**
 * Application Mode Detection - Simplified
 * 
 * Checks environment configuration for database availability.
 * Auth is now handled entirely by native Clerk - no custom auth gating here.
 */

// ============================================================================
// DATABASE DETECTION
// ============================================================================

/**
 * Check if database URL is configured
 */
export function isDatabaseConfigured(): boolean {
  if (typeof window !== 'undefined') {
    // Client-side: use public env var
    return process.env.NEXT_PUBLIC_DATABASE_ENABLED === 'true'
  }
  // Server-side: check actual database URL
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL)
}

/**
 * Check if we're in preview mode (no database configured)
 * This is used by data repositories to return mock data when DB isn't available.
 */
export function isPreviewMode(): boolean {
  return !isDatabaseConfigured()
}

/**
 * Check if running with full services (database available)
 */
export function isProductionMode(): boolean {
  return isDatabaseConfigured()
}

// ============================================================================
// LEGACY COMPATIBILITY - These will be removed in future cleanup
// ============================================================================

/**
 * @deprecated Use isDatabaseConfigured() instead
 */
export function isAuthEnabled(): boolean {
  return true // Auth is always enabled via native Clerk
}

/**
 * @deprecated Auth is now handled by native Clerk
 */
export function isClerkEnabled(): boolean {
  return true
}

/**
 * @deprecated No longer needed
 */
export function isClerkKeyConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
}
