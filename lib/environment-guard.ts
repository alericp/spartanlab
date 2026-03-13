/**
 * Environment Guard - Central utility for runtime environment detection
 * 
 * STRICT ALLOWLIST APPROACH:
 * Only explicitly listed production domains can run Clerk production auth.
 * ALL other domains are treated as preview-unsafe for Clerk.
 * 
 * This prevents Clerk from initializing on any domain not explicitly allowed,
 * eliminating origin errors in v0 preview and other non-production environments.
 * 
 * IMPORTANT: This is a CLIENT-ONLY utility since it depends on window.location.
 */

export interface EnvironmentInfo {
  isProductionDomain: boolean
  isPreviewDomain: boolean
  isAllowedClerkOrigin: boolean
  shouldInitializeClerk: boolean
  hostname: string
}

/**
 * STRICT ALLOWLIST - Only these exact domains can use Clerk production auth.
 * Everything else is blocked. No wildcards, no patterns - explicit matches only.
 */
const PRODUCTION_AUTH_ALLOWLIST: readonly string[] = [
  'spartanlab.app',
  'www.spartanlab.app',
] as const

// Known preview domain patterns (for informational purposes only - we use allowlist, not blocklist)
const PREVIEW_DOMAIN_PATTERNS = [
  '.vusercontent.net',
  '.v0.dev',
  '.vercel.app',
  'localhost',
  '127.0.0.1',
]

/**
 * Check if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Get the current hostname safely
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
 * STRICT CHECK: Is the current hostname in the production allowlist?
 * Uses exact match only - no wildcards, no pattern matching.
 * If not explicitly allowed, returns false.
 */
export function isProductionDomain(): boolean {
  const hostname = getHostname()
  if (!hostname) return false
  
  // STRICT: Exact match only against allowlist
  return PRODUCTION_AUTH_ALLOWLIST.includes(hostname)
}

/**
 * Hard gate for production auth runtime.
 * Returns true ONLY for explicitly allowed production domains.
 * This is the primary gate used to block Clerk initialization.
 */
export function allowProductionAuthRuntime(): boolean {
  return isProductionDomain()
}

/**
 * Check if the current domain is a preview/development domain
 */
export function isPreviewDomain(): boolean {
  const hostname = getHostname()
  if (!hostname) return true // Assume preview if can't determine
  return PREVIEW_DOMAIN_PATTERNS.some(
    pattern => hostname.includes(pattern) || hostname === pattern
  )
}

/**
 * STRICT CHECK: Should Clerk be initialized on this origin?
 * 
 * This is a HARD GATE. Returns true only when:
 * 1. A Clerk key exists AND
 * 2. Either it's a test key OR we're on an explicitly allowed production domain
 * 
 * If this returns false, Clerk code should NOT be imported or initialized at all.
 */
export function isAllowedClerkOrigin(): boolean {
  // Check if we're on an allowed domain FIRST (before checking keys)
  const isAllowedDomain = allowProductionAuthRuntime()
  
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isProductionKey = publishableKey?.startsWith('pk_live_') ?? false
  
  // No key = no Clerk
  if (!publishableKey) return false
  
  // Test keys work everywhere (development mode)
  if (!isProductionKey) return true
  
  // Production keys ONLY work on explicitly allowed domains
  // This is the strict gate that blocks Clerk on preview
  return isAllowedDomain
}

/**
 * Check if we should render preview-safe auth fallbacks
 * True when we have production keys but aren't on a production domain
 */
export function shouldRenderPreviewFallback(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isProductionKey = publishableKey?.startsWith('pk_live_') ?? false
  
  // If no key or test key, no need for fallback
  if (!publishableKey || !isProductionKey) return false
  
  // Preview fallback needed when production key is used on non-production domain
  return !isProductionDomain()
}

/**
 * Get complete environment information
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const hostname = getHostname()
  const isProd = isProductionDomain()
  const isPreview = isPreviewDomain()
  const isAllowed = isAllowedClerkOrigin()
  
  return {
    isProductionDomain: isProd,
    isPreviewDomain: isPreview,
    isAllowedClerkOrigin: isAllowed,
    shouldInitializeClerk: isAllowed,
    hostname,
  }
}

/**
 * Safe JSON parsing that won't throw on invalid input
 * Returns null for any parse error or empty content
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
 * Returns null for network errors, non-OK responses, or invalid JSON
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
        error: `HTTP ${response.status}: ${response.statusText}`,
        ok: false,
      }
    }
    
    // Check for empty response
    const text = await response.text()
    if (!text || text.trim() === '') {
      return {
        data: null,
        error: 'Empty response',
        ok: false,
      }
    }
    
    const data = safeJsonParse<T>(text)
    if (data === null) {
      return {
        data: null,
        error: 'Invalid JSON response',
        ok: false,
      }
    }
    
    return { data, error: null, ok: true }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      ok: false,
    }
  }
}
