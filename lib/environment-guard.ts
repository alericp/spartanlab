/**
 * Environment Guard - Central utility for runtime environment detection
 * 
 * Determines if we're running on a production-allowed domain or a preview domain.
 * Used to prevent Clerk production keys from crashing the app on preview domains.
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

// Production-allowed domains for Clerk
const PRODUCTION_ALLOWED_DOMAINS = [
  'spartanlab.app',
  'www.spartanlab.app',
]

// Known preview domain patterns
const PREVIEW_DOMAIN_PATTERNS = [
  '.vusercontent.net',
  '.v0.dev',
  '.vercel.app', // Generic Vercel preview deployments
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
 * Check if the current domain is a production-allowed domain
 */
export function isProductionDomain(): boolean {
  const hostname = getHostname()
  if (!hostname) return false
  return PRODUCTION_ALLOWED_DOMAINS.some(
    domain => hostname === domain || hostname.endsWith('.' + domain)
  )
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
 * Check if Clerk should be initialized on this origin
 * 
 * Clerk with production keys only works on production-allowed domains.
 * On preview domains with production keys, Clerk will throw origin errors.
 */
export function isAllowedClerkOrigin(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isProductionKey = publishableKey?.startsWith('pk_live_') ?? false
  
  // No key = no Clerk
  if (!publishableKey) return false
  
  // Test keys work everywhere
  if (!isProductionKey) return true
  
  // Production keys only work on production domains
  return isProductionDomain()
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
