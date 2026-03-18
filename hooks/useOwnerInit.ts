'use client'

/**
 * Owner Initialization Hook
 * 
 * Initializes the owner detection system by setting the current user's email
 * from Clerk auth. This enables owner detection throughout the app.
 * 
 * Usage: Call this hook in a high-level client component (like Navigation or layout wrapper)
 * 
 * CRITICAL: This hook is called unconditionally (React rules of hooks).
 * Error handling happens in the useEffect and property access, not around the hook call.
 * The component using this hook MUST be wrapped in an error boundary.
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
  // If this throws, the error boundary wrapping the component will catch it
  const { user, isLoaded } = useUser()
  
  useEffect(() => {
    const init = async () => {
      try {
        const ownerAccess = await loadOwnerAccess()
        
        if (isLoaded) {
          if (user) {
            // Safe property access with optional chaining
            // Trim whitespace to ensure consistent comparison
            const rawEmail = user?.emailAddresses?.[0]?.emailAddress
            const email = rawEmail ? rawEmail.trim() : null
            ownerAccess.setCurrentUserEmail(email)
            setUserEmail(email)
            // Check owner status after setting email
            setOwnerStatus(ownerAccess.isCurrentUserOwner())
          } else {
            // User signed out - clear the cached email
            ownerAccess.clearCurrentUserEmail()
            setUserEmail(null)
            setOwnerStatus(false)
          }
        }
      } catch (e) {
        console.error('[v0] useOwnerInit: init failed:', e)
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
