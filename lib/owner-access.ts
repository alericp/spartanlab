/**
 * Owner Access System
 * 
 * Allows the platform owner to bypass Pro subscription checks.
 * The owner email is configured via the NEXT_PUBLIC_OWNER_EMAIL environment variable.
 */

// =============================================================================
// OWNER EMAIL CONFIGURATION
// =============================================================================

/**
 * Get the configured owner email from environment
 */
export function getOwnerEmail(): string | null {
  // Server-side: prefer OWNER_EMAIL (more secure, not exposed to client)
  if (typeof window === 'undefined' && process.env?.OWNER_EMAIL) {
    return process.env.OWNER_EMAIL
  }
  
  // Client-side or fallback: use public version
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OWNER_EMAIL) {
    return process.env.NEXT_PUBLIC_OWNER_EMAIL
  }
  
  return null
}

// =============================================================================
// OWNER CHECK
// =============================================================================

/**
 * Check if the given email is the platform owner
 */
export function isOwner(currentEmail?: string | null): boolean {
  const ownerEmail = getOwnerEmail()
  
  if (!ownerEmail || !currentEmail) {
    return false
  }
  
  return ownerEmail.toLowerCase() === currentEmail.toLowerCase()
}

/**
 * Check if owner mode is configured
 */
export function isOwnerModeConfigured(): boolean {
  return getOwnerEmail() !== null
}

/**
 * Check owner status with explicit email (for server components/API routes)
 */
export function checkOwnerByEmail(email: string | null | undefined): boolean {
  return isOwner(email)
}
