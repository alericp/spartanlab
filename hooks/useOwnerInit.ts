'use client'

/**
 * Owner Initialization Hook
 * 
 * [PHASE 14D] LEGACY HOOK - DEPRECATED FOR UI COMPONENTS
 * 
 * This hook is now LEGACY. UI components should use:
 * - useOwnerBootstrap() from @/components/providers/OwnerBootstrapProvider
 * - useEntitlement() from @/hooks/useEntitlement
 * 
 * This hook remains available for backward compatibility but creates a SPLIT
 * owner source that can cause drift. All critical UI surfaces have been migrated.
 * 
 * REMAINING USAGE: None (all migrated to canonical sources)
 * 
 * Old description:
 * Initializes the owner detection system by setting the current user's email
 * from Clerk auth. This enables owner detection throughout the app.
 * 
 * A preview hostname does not make the visitor the owner. Owner status comes
 * from the authenticated owner-status response.
 * 
 * [PHASE 14D] Audit marker:
 * [phase14d-owner-ui-caller-sweep-audit] - This hook is now LEGACY
 * [phase14d-critical-owner-drift-sources-removed-verdict] - All UI callers migrated
 */

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

// Safe imports with fallbacks
let ownerAccessModule: {
  setCurrentUserEmail: (email: string | null) => void
  clearCurrentUserEmail: () => void
  isCurrentUserOwner: () => boolean
} | null = null

async function loadOwnerAccess() {
  if (!ownerAccessModule) {
    try {
      ownerAccessModule = await import('@/lib/owner-access')
    } catch (e) {
      console.error('[v0] useOwnerInit: Failed to load owner-access module:', e)
      ownerAccessModule = {
        setCurrentUserEmail: () => {},
        clearCurrentUserEmail: () => {},
        isCurrentUserOwner: () => false,
      }
    }
  }
  return ownerAccessModule
}

/**
 * Initialize owner detection with the current Clerk user's email.
 * Returns whether the current user is the owner.
 * 
 * NOTE: This hook calls useUser unconditionally per React rules.
 * Components using this hook should be wrapped in an error boundary.
 */
export function useOwnerInit(): { isOwner: boolean; isLoaded: boolean; userEmail: string | null } {
  const [ownerStatus, setOwnerStatus] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hookLoaded, setHookLoaded] = useState(false)
  
  // Call useUser unconditionally (React rules of hooks)
  // In preview mode, Clerk will log errors but the hook still returns safely
  const { user, isLoaded } = useUser()
  
  useEffect(() => {
    // Check if we're in a preview environment (must be in useEffect for SSR safety)
    const init = async () => {
      try {
        const ownerAccess = await loadOwnerAccess()
        
        if (isLoaded) {
          if (user) {
            // Safe property access with optional chaining
            const rawEmail = user?.emailAddresses?.[0]?.emailAddress
            const email = rawEmail ? rawEmail.trim() : null
            ownerAccess.setCurrentUserEmail(email)
            setUserEmail(email)
            setOwnerStatus(ownerAccess.isCurrentUserOwner())
          } else {
            ownerAccess.clearCurrentUserEmail()
            setUserEmail(null)
            setOwnerStatus(false)
          }
        }
      } catch {
        // Silently fail - owner features will be disabled
        setOwnerStatus(false)
        setUserEmail(null)
      }
      
      setHookLoaded(true)
    }
    
    init()
  }, [user, isLoaded])
  
  return {
    isOwner: ownerStatus,
    isLoaded: isLoaded && hookLoaded,
    userEmail,
  }
}
