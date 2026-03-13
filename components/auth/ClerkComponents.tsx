'use client'

// ClerkComponents - Simple wrappers for Clerk auth UI components
// ClerkProvider is now in the root layout, so these work everywhere

import { ReactNode, useState, useEffect } from 'react'
import { useAuth, useUser, UserButton as ClerkUserButton } from '@clerk/nextjs'

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedIn - renders children only when user is signed in
 * Uses Clerk's useAuth hook for reliable auth state
 */
export function SignedIn({ children }: AuthComponentProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) return null

  // Wait for auth to load
  if (!isLoaded) return null

  // Only render when signed in
  return isSignedIn ? <>{children}</> : null
}

/**
 * SignedOut - renders children only when user is signed out
 * Uses Clerk's useAuth hook for reliable auth state
 */
export function SignedOut({ children }: AuthComponentProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) return null

  // Wait for auth to load
  if (!isLoaded) return null

  // Only render when signed out
  return isSignedIn ? null : <>{children}</>
}

interface UserButtonProps {
  afterSignOutUrl?: string
  appearance?: {
    elements?: Record<string, string>
  }
}

/**
 * UserButton wrapper with safe mounting
 */
export function UserButton({ afterSignOutUrl = '/', appearance }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return <ClerkUserButton afterSignOutUrl={afterSignOutUrl} appearance={appearance} />
}

/**
 * Re-export useAuth and useUser from Clerk for convenience
 */
export { useAuth, useUser }
