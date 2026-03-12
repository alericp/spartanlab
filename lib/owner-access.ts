/**
 * Owner Access System
 * 
 * Allows the platform owner to bypass Pro subscription checks.
 * The owner email is configured via the NEXT_PUBLIC_OWNER_EMAIL environment variable.
 * 
 * In production mode with Clerk, the current user email comes from Clerk's session.
 * In preview mode, it uses localStorage for testing.
 */

import { isPreviewMode } from './app-mode'

// =============================================================================
// OWNER EMAIL CONFIGURATION
// =============================================================================

/**
 * Get the configured owner email from environment
 */
export function getOwnerEmail(): string | null {
  // Check environment variable (works in both client and server)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OWNER_EMAIL) {
    return process.env.NEXT_PUBLIC_OWNER_EMAIL
  }
  
  return null
}

// =============================================================================
// CURRENT USER EMAIL (for preview mode testing)
// =============================================================================

const CURRENT_USER_KEY = 'spartanlab_current_user_email'

/**
 * Get the current user's email from localStorage (preview mode only)
 * In production, use the useCurrentUserEmail hook from useClerkAuth
 */
export function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  
  // In preview mode, use localStorage
  if (isPreviewMode()) {
    return localStorage.getItem(CURRENT_USER_KEY) || 'preview@spartanlab.local'
  }
  
  // In production, this function is only for server-side compatibility
  // Client components should use the useCurrentUserEmail hook
  return null
}

/**
 * Set the current user's email (for preview mode testing)
 */
export function setCurrentUserEmail(email: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENT_USER_KEY, email)
}

/**
 * Clear the current user's email (logout in preview mode)
 */
export function clearCurrentUserEmail(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CURRENT_USER_KEY)
}

// =============================================================================
// OWNER CHECK
// =============================================================================

/**
 * Check if the current user is the platform owner (synchronous, for non-hook contexts)
 * 
 * IMPORTANT: In client components with Clerk, use useIsOwner() hook instead.
 * This function is primarily for:
 * - Preview mode
 * - Server-side checks where email is passed explicitly
 */
export function isOwner(currentEmail?: string): boolean {
  const ownerEmail = getOwnerEmail()
  
  // No owner email configured - owner mode not enabled
  if (!ownerEmail) {
    // In preview mode, default to true for testing
    return isPreviewMode()
  }
  
  // Use provided email or get from localStorage (preview mode)
  const email = currentEmail || getCurrentUserEmail()
  
  // No current user - not logged in
  if (!email) return false
  
  // Case-insensitive comparison
  return ownerEmail.toLowerCase() === email.toLowerCase()
}

/**
 * Check if owner mode is configured (even if not currently active)
 */
export function isOwnerModeConfigured(): boolean {
  return getOwnerEmail() !== null
}

/**
 * Get owner status details
 */
export function getOwnerStatus(currentEmail?: string): {
  isOwner: boolean
  ownerEmail: string | null
  currentEmail: string | null
  ownerModeConfigured: boolean
} {
  const ownerEmail = getOwnerEmail()
  const email = currentEmail || getCurrentUserEmail()
  
  return {
    isOwner: isOwner(currentEmail),
    ownerEmail: ownerEmail,
    currentEmail: email,
    ownerModeConfigured: ownerEmail !== null,
  }
}

/**
 * Check owner status with explicit email (for server components/API routes)
 */
export function checkOwnerByEmail(email: string | null | undefined): boolean {
  if (!email) return false
  
  const ownerEmail = getOwnerEmail()
  if (!ownerEmail) return false
  
  return ownerEmail.toLowerCase() === email.toLowerCase()
}
