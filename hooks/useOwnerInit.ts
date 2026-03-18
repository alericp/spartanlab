'use client'

/**
 * Owner Initialization Hook
 * 
 * Initializes the owner detection system by setting the current user's email
 * from Clerk auth. This enables owner detection throughout the app.
 * 
 * Usage: Call this hook in a high-level client component (like Navigation or layout wrapper)
 * 
 * CRITICAL: This hook is fail-soft. If Clerk's useUser throws or returns
 * unexpected data, we return safe defaults rather than crashing.
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
 * This hook never throws - it returns safe defaults on any error.
 */
export function useOwnerInit(): { isOwner: boolean; isLoaded: boolean; userEmail: string | null } {
  const [ownerStatus, setOwnerStatus] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hookLoaded, setHookLoaded] = useState(false)
  
  // Safe access to useUser - wrapped in try-catch
  let user: ReturnType<typeof useUser>['user'] = null
  let isLoaded = false
  
  try {
    const userHook = useUser()
    user = userHook.user
    isLoaded = userHook.isLoaded
  } catch (e) {
    console.error('[v0] useOwnerInit: useUser threw:', e)
    isLoaded = true // Pretend loaded to avoid infinite loading
  }
  
  useEffect(() => {
    const init = async () => {
      try {
        const ownerAccess = await loadOwnerAccess()
        
        if (isLoaded) {
          if (user) {
            // Set the user's primary email for owner detection
            const email = user.emailAddresses?.[0]?.emailAddress || null
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
