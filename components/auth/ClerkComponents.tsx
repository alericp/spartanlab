'use client'

// Custom auth components that work with both Clerk (production) and preview mode
// Uses useAuth hook instead of SignedIn/SignedOut components to avoid Clerk v7 build issues

import { ReactNode, useState, useEffect } from 'react'
import { useAuth as useClerkAuth, useUser, UserButton as ClerkUserButton } from '@clerk/nextjs'
import { isPreviewMode } from '@/lib/app-mode'

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedIn - renders children only when user is signed in
 * Uses useAuth hook instead of Clerk's SignedIn component
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  
  // Always call hooks, but use preview fallback values when in preview mode
  const clerkAuth = useClerkAuth()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) return null
  
  if (preview) {
    // In preview mode, check if user has app data (simulates signed in)
    const hasData = typeof window !== 'undefined' && (
      localStorage.getItem('athlete_profile') ||
      localStorage.getItem('workouts') ||
      localStorage.getItem('saved_programs')
    )
    return hasData ? <>{children}</> : null
  }
  
  // Production: wait for Clerk to load, then check auth
  if (!clerkAuth.isLoaded) return null
  return clerkAuth.isSignedIn ? <>{children}</> : null
}

/**
 * SignedOut - renders children only when user is signed out
 * Uses useAuth hook instead of Clerk's SignedOut component
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  
  // Always call hooks
  const clerkAuth = useClerkAuth()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render until mounted
  if (!mounted) return null
  
  if (preview) {
    // In preview mode, check if user has NO app data (simulates signed out)
    const hasData = typeof window !== 'undefined' && (
      localStorage.getItem('athlete_profile') ||
      localStorage.getItem('workouts') ||
      localStorage.getItem('saved_programs')
    )
    return hasData ? null : <>{children}</>
  }
  
  // Production: wait for Clerk to load, then check auth
  if (!clerkAuth.isLoaded) return <>{children}</> // Show signed-out content while loading
  return clerkAuth.isSignedIn ? null : <>{children}</>
}

interface UserButtonProps {
  afterSignOutUrl?: string
  appearance?: {
    elements?: Record<string, string>
  }
}

/**
 * UserButton wrapper - renders Clerk's UserButton or a preview fallback
 */
export function UserButton({ afterSignOutUrl = '/', appearance }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  if (preview) {
    // In preview mode, show a simple avatar placeholder
    return (
      <div className="w-8 h-8 rounded-full bg-[#C1121F] flex items-center justify-center text-sm font-bold text-white">
        A
      </div>
    )
  }
  
  // Production: use actual Clerk UserButton
  return (
    <ClerkUserButton 
      afterSignOutUrl={afterSignOutUrl}
      appearance={appearance}
    />
  )
}

/**
 * useAuth hook wrapper - returns auth state for both preview and production
 */
export function useAuth(): { isSignedIn: boolean | undefined; isLoaded: boolean; userId: string | null } {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  
  // Always call Clerk's hook
  const clerkAuth = useClerkAuth()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (preview) {
    // In preview mode, check localStorage for user data
    if (!mounted) {
      return { isSignedIn: undefined, isLoaded: false, userId: null }
    }
    const hasData = typeof window !== 'undefined' && (
      localStorage.getItem('athlete_profile') ||
      localStorage.getItem('workouts') ||
      localStorage.getItem('saved_programs')
    )
    return { 
      isSignedIn: Boolean(hasData), 
      isLoaded: true, 
      userId: hasData ? 'preview-user' : null 
    }
  }
  
  // Production: return Clerk's auth state
  return {
    isSignedIn: clerkAuth.isSignedIn,
    isLoaded: clerkAuth.isLoaded,
    userId: clerkAuth.userId ?? null,
  }
}

/**
 * useCurrentUser hook wrapper - returns user data for both preview and production
 */
export function useCurrentUser() {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  
  // Always call Clerk's hook
  const clerkUser = useUser()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (preview) {
    if (!mounted) {
      return { user: null, isLoaded: false }
    }
    // Return mock user in preview mode
    return {
      user: {
        id: 'preview-user',
        primaryEmailAddress: { emailAddress: 'athlete@preview.local' },
        firstName: 'Athlete',
        lastName: 'Preview',
      },
      isLoaded: true,
    }
  }
  
  return {
    user: clerkUser.user,
    isLoaded: clerkUser.isLoaded,
  }
}
