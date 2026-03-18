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
  
  // Detect preview environment on initial render (client-side only)
  const [inPreview, setInPreview] = useState(false)
  
  // Call useUser unconditionally (React rules of hooks)
  // In preview mode, Clerk will log errors but the hook still returns safely
  const { user, isLoaded } = useUser()
  
  useEffect(() => {
    // Check if we're in a preview environment (must be in useEffect for SSR safety)
    const isPreview = isPreviewEnvironment()
    setInPreview(isPreview)
    
    const init = async () => {
      try {
        const ownerAccess = await loadOwnerAccess()
        
        // In preview environments, enable owner features for testing
        // This allows the Free/Pro toggle to appear even when Clerk auth fails
        if (isPreview) {
          setOwnerStatus(true)
          setUserEmail('preview-mode@spartanlab.app')
          setHookLoaded(true)
          return
        }
        
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
    isOwner: ownerStatus || inPreview, // In preview mode, always show owner controls
    isLoaded: isLoaded && hookLoaded,
    userEmail,
  }
}
