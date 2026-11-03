/**
 * Owner Access System
 *
 * The platform owner bypasses Pro subscription checks. The server prefers
 * OWNER_EMAIL and falls back to NEXT_PUBLIC_OWNER_EMAIL. A cached email or
 * client flag never grants owner access.
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
 * Cache the signed-in email for display. This does not grant owner access.
 */
export function setCurrentUserEmail(email: string | null): void {
  cachedCurrentUserEmail = email
  serverVerifiedOwner = false
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
  serverVerifiedOwner = false
}

// =============================================================================
// OWNER CHECK
// =============================================================================

/**
 * Check if the given email is the platform owner.
 * Applies trim and case-insensitive comparison.
 * A missing argument does not fall back to the client cache.
 */
export function isOwner(currentEmail?: string | null): boolean {
  return emailMatchesOwner(getOwnerEmail(), currentEmail)
}

export function emailMatchesOwner(
  configuredOwnerEmail: string | null | undefined,
  email: string | null | undefined,
): boolean {
  if (!configuredOwnerEmail || !email) return false
  return configuredOwnerEmail.trim().toLowerCase() === email.trim().toLowerCase()
}

export interface ClerkEmailRecord {
  id?: string | null
  emailAddress?: string | null
  verification?: { status?: string | null } | null
}

/** Primary address, plus any other address Clerk has already verified. */
export function clerkEmailsEligibleForOwnerMatch(
  primaryEmailAddressId: string | null | undefined,
  emailAddresses: readonly ClerkEmailRecord[] | null | undefined,
): string[] {
  const eligible: string[] = []
  for (const email of emailAddresses ?? []) {
    const value = email.emailAddress?.trim()
    if (!value) continue
    const verified = email.verification?.status === 'verified'
    const primary = Boolean(primaryEmailAddressId) && email.id === primaryEmailAddressId
    if (verified || primary) eligible.push(value)
  }
  return eligible
}

/** Eligible address that matches the configured owner, if Clerk returned one. */
export function matchingOwnerEmail(
  configuredOwnerEmail: string | null | undefined,
  primaryEmailAddressId: string | null | undefined,
  emailAddresses: readonly ClerkEmailRecord[] | null | undefined,
): string | null {
  for (const email of clerkEmailsEligibleForOwnerMatch(primaryEmailAddressId, emailAddresses)) {
    if (emailMatchesOwner(configuredOwnerEmail, email)) return email
  }
  return null
}

export interface OwnerEntitlementInput {
  authenticatedUserId: string | null | undefined
  configuredOwnerEmail: string | null | undefined
  verifiedEmails: readonly string[]
  subscriptionPlan?: 'free' | 'pro' | null
  subscriptionStatus?: string | null
  clientSuppliedEmail?: string | null
  clientClaimsOwner?: boolean
}

export interface OwnerEntitlementDecision {
  isOwner: boolean
  hasProAccess: boolean
  reason: 'owner' | 'pro' | 'trial' | 'free' | 'unauthenticated'
}

/**
 * Owner access follows the authenticated Clerk user. A client-supplied
 * email or owner flag is ignored.
 */
export function resolveOwnerEntitlement(input: OwnerEntitlementInput): OwnerEntitlementDecision {
  if (!input.authenticatedUserId) {
    return { isOwner: false, hasProAccess: false, reason: 'unauthenticated' }
  }
  const isOwnerAccount = input.verifiedEmails.some((email) =>
    emailMatchesOwner(input.configuredOwnerEmail, email),
  )
  if (isOwnerAccount) {
    return { isOwner: true, hasProAccess: true, reason: 'owner' }
  }
  const plan = input.subscriptionPlan
  const status = input.subscriptionStatus
  if (plan === 'pro' && (status === 'active' || status === 'trialing')) {
    return {
      isOwner: false,
      hasProAccess: true,
      reason: status === 'trialing' ? 'trial' : 'pro',
    }
  }
  return { isOwner: false, hasProAccess: false, reason: 'free' }
}

let serverVerifiedOwner = false

/** Set only from the authenticated owner-status response. */
export function setServerVerifiedOwner(isOwnerAccount: boolean): void {
  serverVerifiedOwner = isOwnerAccount === true
}

/**
 * True only after the server has confirmed this signed-in user.
 * Setting the cached email does not grant this.
 */
export function isCurrentUserOwner(): boolean {
  return serverVerifiedOwner
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
