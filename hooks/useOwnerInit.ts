'use client'

/**
 * Owner Initialization Hook
 * 
 * Initializes the owner detection system by setting the current user's email
 * from Clerk auth. This enables owner detection throughout the app.
 * 
 * Usage: Call this hook in a high-level client component (like Navigation or layout wrapper)
 */

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { setCurrentUserEmail, clearCurrentUserEmail, isCurrentUserOwner } from '@/lib/owner-access'

/**
 * Initialize owner detection with the current Clerk user's email.
 * Returns whether the current user is the owner.
 */
export function useOwnerInit(): { isOwner: boolean; isLoaded: boolean; userEmail: string | null } {
  const { user, isLoaded } = useUser()
  const [ownerStatus, setOwnerStatus] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Set the user's primary email for owner detection
        const email = user.emailAddresses?.[0]?.emailAddress || null
        setCurrentUserEmail(email)
        setUserEmail(email)
        // Check owner status after setting email
        setOwnerStatus(isCurrentUserOwner())
      } else {
        // User signed out - clear the cached email
        clearCurrentUserEmail()
        setUserEmail(null)
        setOwnerStatus(false)
      }
    }
  }, [user, isLoaded])
  
  return {
    isOwner: ownerStatus,
    isLoaded,
    userEmail,
  }
}
