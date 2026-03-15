/**
 * Owner Access System
 * 
 * Allows the platform owner to bypass Pro subscription checks.
 * The owner email is configured via the NEXT_PUBLIC_OWNER_EMAIL environment variable.
 * 
 * Client-side: Use setCurrentUserEmail() after Clerk auth loads to enable owner detection.
 */

// =============================================================================
// OWNER EMAIL CONFIGURATION
// =============================================================================

// Client-side cache for the current user's email (set from Clerk useUser)
let cachedCurrentUserEmail: string | null = null

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
// CURRENT USER EMAIL (Client-side)
// =============================================================================

/**
 * Set the current user's email (call this from components with Clerk useUser)
 * This enables owner detection on the client side.
 */
export function setCurrentUserEmail(email: string | null): void {
  cachedCurrentUserEmail = email
}

/**
 * Get the current user's email (client-side cached value)
 */
export function getCurrentUserEmail(): string | null {
  return cachedCurrentUserEmail
}

/**
 * Clear the cached user email (call on sign out)
 */
export function clearCurrentUserEmail(): void {
  cachedCurrentUserEmail = null
}

// =============================================================================
// OWNER CHECK
// =============================================================================

/**
 * Check if the given email is the platform owner
 */
export function isOwner(currentEmail?: string | null): boolean {
  const ownerEmail = getOwnerEmail()
  const emailToCheck = currentEmail ?? cachedCurrentUserEmail
  
  if (!ownerEmail || !emailToCheck) {
    return false
  }
  
  return ownerEmail.toLowerCase() === emailToCheck.toLowerCase()
}

/**
 * Check if current cached user is the owner (client-side convenience)
 * Use this after setCurrentUserEmail() has been called.
 */
export function isCurrentUserOwner(): boolean {
  return isOwner(cachedCurrentUserEmail)
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
