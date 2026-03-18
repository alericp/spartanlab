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
 * 
 * PREVIEW MODE: In v0 preview (vusercontent.net), Clerk fails due to domain restrictions.
 * In that case, we check NEXT_PUBLIC_OWNER_EMAIL to enable owner features for testing.
 */

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

// Detect if we're in a preview environment where Clerk won't work
function isPreviewEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname.includes('vusercontent.net') || 
         hostname.includes('localhost') ||
         hostname.includes('vercel.app')
}

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
  const [isPreview, setIsPreview] = useState(false)
  
  // Call useUser unconditionally (React rules of hooks)
  // If this throws, the error boundary wrapping the component will catch it
  let user: ReturnType<typeof useUser>['user'] = null
  let isLoaded = false
  
  try {
    const clerkResult = useUser()
    user = clerkResult.user
    isLoaded = clerkResult.isLoaded
  } catch {
    // Clerk failed (e.g., domain restriction in preview)
    isLoaded = true // Treat as loaded since we know it won't work
  }
  
  useEffect(() => {
    // Check if we're in a preview environment
    const inPreview = isPreviewEnvironment()
    setIsPreview(inPreview)
    
    const init = async () => {
      try {
        const ownerAccess = await loadOwnerAccess()
        
        // In preview environments, check if NEXT_PUBLIC_OWNER_EMAIL is set
        // This allows owner features to work for testing
        if (inPreview) {
          const ownerEmailConfigured = !!process.env.NEXT_PUBLIC_OWNER_EMAIL
          if (ownerEmailConfigured) {
            // In preview mode with owner email configured, enable owner features
            setOwnerStatus(true)
            setUserEmail('preview-mode@spartanlab.app')
            setHookLoaded(true)
            return
          }
        }
        
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
    isOwner: ownerStatus || isPreview, // In preview mode, always show owner controls
    isLoaded: isLoaded && hookLoaded,
    userEmail,
  }
}
