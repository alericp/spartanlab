/**
 * Auth Environment Utilities - Simplified
 * 
 * Auth is now handled entirely by native Clerk.
 * This file only contains utility functions for JSON parsing and safe fetch.
 */

// ============================================================================
// CLERK CONFIGURATION CHECK (for server-side code)
// ============================================================================

/**
 * Check if Clerk is configured (has a publishable key)
 */
export function isClerkConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
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
