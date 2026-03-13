/**
 * Auth Environment - SINGLE SOURCE OF TRUTH
 * 
 * This module provides all auth environment detection for both server and client.
 * ALL other files should import from here instead of implementing their own logic.
 * 
 * Key design principles:
 * 1. ALLOWLIST only - only explicitly listed domains can use production auth
 * 2. Simple, synchronous checks where possible
 * 3. No Clerk imports - this module has zero dependencies on Clerk
 */

// ============================================================================
// CONSTANTS - The single source of truth for allowed domains
// ============================================================================

/**
 * Production domains where Clerk auth is allowed.
 * Only exact matches - no wildcards or patterns.
 */
export const PRODUCTION_AUTH_DOMAINS = [
  'spartanlab.app',
  'www.spartanlab.app',
] as const

/**
 * Type for production domains
 */
export type ProductionDomain = typeof PRODUCTION_AUTH_DOMAINS[number]

// ============================================================================
// ENVIRONMENT DETECTION - Works on both client and server
// ============================================================================

/**
 * Check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Get current hostname (client-side only, returns empty string on server)
 */
export function getHostname(): string {
  if (!isBrowser()) return ''
  try {
    return window.location.hostname
  } catch {
    return ''
  }
}

/**
 * Check if the current hostname is in the production allowlist.
 * Returns false on server (conservative default).
 */
export function isProductionAuthDomain(): boolean {
  if (!isBrowser()) return false
  const hostname = getHostname()
  return PRODUCTION_AUTH_DOMAINS.includes(hostname as ProductionDomain)
}

/**
 * Check if we're on a preview/non-production domain.
 * This is the inverse of isProductionAuthDomain for client-side.
 * On server, defaults to true (conservative).
 */
export function isPreviewEnvironment(): boolean {
  if (!isBrowser()) return true // Server defaults to preview-safe
  return !isProductionAuthDomain()
}

// ============================================================================
// CLERK KEY DETECTION
// ============================================================================

/**
 * Get the Clerk publishable key from environment
 */
export function getClerkPublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}

/**
 * Check if Clerk is configured (has a publishable key)
 */
export function isClerkConfigured(): boolean {
  return Boolean(getClerkPublishableKey())
}

/**
 * Check if the Clerk key is a production key
 */
export function isProductionClerkKey(): boolean {
  const key = getClerkPublishableKey()
  return Boolean(key?.startsWith('pk_live_'))
}

/**
 * Check if the Clerk key is a test key
 */
export function isTestClerkKey(): boolean {
  const key = getClerkPublishableKey()
  return Boolean(key?.startsWith('pk_test_'))
}

// ============================================================================
// MAIN AUTH GATE - The primary decision function
// ============================================================================

/**
 * Should we load and initialize Clerk?
 * 
 * This is THE function that gates all Clerk initialization.
 * Returns true only when:
 * 1. Clerk is configured AND
 * 2. Either we have a test key OR we're on a production domain with prod key
 * 
 * CRITICAL: If this returns false, NO Clerk code should be loaded or executed.
 */
export function shouldInitializeClerk(): boolean {
  const configured = isClerkConfigured()
  const isTest = isTestClerkKey()
  const isProd = isProductionClerkKey()
  const isProdDomain = isProductionAuthDomain()
  const hostname = getHostname()
  
  // Debug logging for production troubleshooting
  if (isBrowser()) {
    console.log('[SpartanLab Auth] shouldInitializeClerk check:', {
      hostname,
      configured,
      isTestKey: isTest,
      isProdKey: isProd,
      isProdDomain,
      keyPrefix: getClerkPublishableKey()?.substring(0, 10) + '...',
    })
  }
  
  // No key = no Clerk
  if (!configured) {
    console.log('[SpartanLab Auth] Not configured - no Clerk key')
    return false
  }
  
  // Test keys work everywhere (development mode)
  if (isTest) {
    console.log('[SpartanLab Auth] Test key detected - initializing Clerk')
    return true
  }
  
  // Production keys only work on production domains
  if (isProd) {
    const shouldInit = isProdDomain
    console.log('[SpartanLab Auth] Production key on domain:', hostname, '- shouldInit:', shouldInit)
    return shouldInit
  }
  
  // Unknown key format - don't initialize
  console.log('[SpartanLab Auth] Unknown key format - not initializing')
  return false
}

/**
 * Get auth mode for the current environment
 */
export type AuthMode = 'production' | 'preview' | 'disabled'

export function getAuthMode(): AuthMode {
  if (!isClerkConfigured()) return 'disabled'
  if (shouldInitializeClerk()) return 'production'
  return 'preview'
}

/**
 * Check if we should render preview-safe fallbacks
 */
export function shouldUsePreviewFallback(): boolean {
  return getAuthMode() === 'preview'
}

// ============================================================================
// SERVER-SIDE UTILITIES
// ============================================================================

/**
 * Check if a hostname (from request) is a production domain.
 * For use in middleware/server components.
 */
export function isProductionDomainFromHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false
  // Strip port if present
  const domain = hostname.split(':')[0]
  return PRODUCTION_AUTH_DOMAINS.includes(domain as ProductionDomain)
}

// ============================================================================
// SAFE JSON UTILITIES
// ============================================================================

/**
 * Safe JSON parse that returns null instead of throwing
 */
export function safeJsonParse<T>(input: string | null | undefined): T | null {
  if (!input || typeof input !== 'string' || input.trim() === '') {
    return null
  }
  try {
    return JSON.parse(input) as T
  } catch {
    return null
  }
}

/**
 * Safe fetch with JSON parsing that handles errors gracefully
 */
export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; ok: boolean }> {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      return {
        data: null,
        error: `HTTP ${response.status}`,
        ok: false,
      }
    }
    
    const text = await response.text()
    if (!text || text.trim() === '') {
      return { data: null, error: 'Empty response', ok: false }
    }
    
    const data = safeJsonParse<T>(text)
    return data !== null 
      ? { data, error: null, ok: true }
      : { data: null, error: 'Invalid JSON', ok: false }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      ok: false,
    }
  }
}
