/**
 * Auth Gate - Server-safe runtime check for allowed auth domains
 * 
 * This utility provides a SYNCHRONOUS check that can be used before
 * any Clerk code is even considered for loading. The key insight is
 * that we need to check the environment BEFORE React renders, not after.
 * 
 * For client-side, we check window.location.hostname.
 * For server-side, we return false (server can't check origin).
 */

/**
 * STRICT ALLOWLIST - Only these exact domains can use Clerk production auth.
 * This must match the allowlist in environment-guard.ts
 */
const PRODUCTION_AUTH_ALLOWLIST = [
  'spartanlab.app',
  'www.spartanlab.app',
]

/**
 * Check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * SYNCHRONOUS check: Is the current hostname allowed for production auth?
 * 
 * Returns true ONLY for explicitly allowed domains.
 * Returns false for:
 * - Server-side rendering (can't check hostname)
 * - Any domain not in the allowlist
 * - Any preview domain (*.vusercontent.net, localhost, etc.)
 */
export function isAllowedAuthDomain(): boolean {
  // Server-side: assume not allowed (conservative default)
  if (!isBrowser()) {
    return false
  }
  
  try {
    const hostname = window.location.hostname
    // STRICT: Exact match only
    return PRODUCTION_AUTH_ALLOWLIST.includes(hostname)
  } catch {
    return false
  }
}

/**
 * Check if we have Clerk production keys configured
 */
export function hasProductionClerkKey(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return Boolean(key?.startsWith('pk_live_'))
}

/**
 * SYNCHRONOUS gate: Should we load/initialize Clerk?
 * 
 * This is the PRIMARY gate used to prevent Clerk from loading.
 * Returns true only when:
 * 1. We're on a production-allowed domain AND
 * 2. We have a Clerk key (production or test)
 * 
 * OR when we have a test key (which works on any domain)
 */
export function shouldLoadClerk(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  // No key = no Clerk
  if (!key) return false
  
  // Test keys work everywhere (development mode)
  if (key.startsWith('pk_test_')) return true
  
  // Production keys only work on allowed domains
  if (key.startsWith('pk_live_')) {
    return isAllowedAuthDomain()
  }
  
  return false
}

/**
 * Get a user-friendly message about why auth isn't available
 */
export function getAuthUnavailableReason(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  if (!key) {
    return 'Authentication is not configured.'
  }
  
  if (!isBrowser()) {
    return 'Authentication status is being determined.'
  }
  
  const hostname = window.location.hostname
  if (!PRODUCTION_AUTH_ALLOWLIST.includes(hostname)) {
    return `Authentication is available on the production domain (spartanlab.app).`
  }
  
  return 'Authentication is unavailable.'
}
