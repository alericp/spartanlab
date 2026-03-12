/**
 * Owner Access System
 * 
 * Allows the platform owner to bypass Pro subscription checks.
 * The owner email is configured via the OWNER_EMAIL environment variable.
 */

// =============================================================================
// OWNER EMAIL CONFIGURATION
// =============================================================================

/**
 * Get the configured owner email from environment or localStorage (for demo)
 */
function getOwnerEmail(): string | null {
  // Check environment variable first (production)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OWNER_EMAIL) {
    return process.env.NEXT_PUBLIC_OWNER_EMAIL
  }
  
  // Fallback to localStorage for demo mode
  if (typeof window !== 'undefined') {
    return localStorage.getItem('spartanlab_owner_email')
  }
  
  return null
}

/**
 * Set owner email (for demo/testing purposes)
 */
export function setOwnerEmail(email: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('spartanlab_owner_email', email)
}

/**
 * Clear owner email (for demo/testing purposes)
 */
export function clearOwnerEmail(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('spartanlab_owner_email')
}

// =============================================================================
// CURRENT USER EMAIL
// =============================================================================

const CURRENT_USER_KEY = 'spartanlab_current_user_email'

/**
 * Get the current user's email
 * In production, this would come from your auth system (Clerk, Auth.js, etc.)
 */
export function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CURRENT_USER_KEY)
}

/**
 * Set the current user's email (for demo purposes)
 * In production, this would be set by your auth system
 */
export function setCurrentUserEmail(email: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENT_USER_KEY, email)
}

/**
 * Clear the current user's email (logout)
 */
export function clearCurrentUserEmail(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CURRENT_USER_KEY)
}

// =============================================================================
// OWNER CHECK
// =============================================================================

/**
 * Check if the current user is the platform owner
 * Returns true if the user's email matches the configured OWNER_EMAIL
 */
export function isOwner(): boolean {
  const ownerEmail = getOwnerEmail()
  const currentEmail = getCurrentUserEmail()
  
  // No owner email configured - owner mode not enabled
  if (!ownerEmail) return false
  
  // No current user - not logged in
  if (!currentEmail) return false
  
  // Case-insensitive comparison
  return ownerEmail.toLowerCase() === currentEmail.toLowerCase()
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
export function getOwnerStatus(): {
  isOwner: boolean
  ownerEmail: string | null
  currentEmail: string | null
  ownerModeConfigured: boolean
} {
  const ownerEmail = getOwnerEmail()
  const currentEmail = getCurrentUserEmail()
  
  return {
    isOwner: isOwner(),
    ownerEmail: ownerEmail,
    currentEmail: currentEmail,
    ownerModeConfigured: ownerEmail !== null,
  }
}
