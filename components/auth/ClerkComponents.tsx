'use client'

// Clerk v7 compatible auth components
// In Clerk v7, SignedIn/SignedOut are replaced with <Show when="signed-in/signed-out">

import { ReactNode, useState, useEffect } from 'react'
import { isPreviewMode, isAuthEnabled } from '@/lib/app-mode'

interface AuthComponentProps {
  children: ReactNode
}

interface UserButtonProps {
  afterSignOutUrl?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appearance?: any
}

/**
 * SignedIn wrapper - renders children only when user is signed in
 * Uses Clerk's Show component with when="signed-in" in production
 * In preview mode, checks localStorage for app usage
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const preview = isPreviewMode()
  const authEnabled = isAuthEnabled()
  
  useEffect(() => {
    setMounted(true)
    
    if (preview) {
      // In preview mode, check if user has started using the app
      const hasProfile = localStorage.getItem('athlete_profile')
      const hasWorkouts = localStorage.getItem('workouts')
      const hasPrograms = localStorage.getItem('saved_programs')
      setShowContent(Boolean(hasProfile || hasWorkouts || hasPrograms))
    }
  }, [preview])
  
  // Server-side or not mounted yet - render nothing to avoid hydration mismatch
  if (!mounted) return null
  
  // Preview mode - use localStorage check
  if (preview) {
    return showContent ? <>{children}</> : null
  }
  
  // Production mode with Clerk - use Show component
  if (authEnabled) {
    return <ClerkShowWrapper when="signed-in">{children}</ClerkShowWrapper>
  }
  
  // No auth configured - don't show signed-in content
  return null
}

/**
 * SignedOut wrapper - renders children only when user is signed out
 * Uses Clerk's Show component with when="signed-out" in production
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [showContent, setShowContent] = useState(true)
  const preview = isPreviewMode()
  const authEnabled = isAuthEnabled()
  
  useEffect(() => {
    setMounted(true)
    
    if (preview) {
      // In preview mode, check if user has started using the app
      const hasProfile = localStorage.getItem('athlete_profile')
      const hasWorkouts = localStorage.getItem('workouts')
      const hasPrograms = localStorage.getItem('saved_programs')
      // Show signed-out content only if user hasn't started using the app
      setShowContent(!Boolean(hasProfile || hasWorkouts || hasPrograms))
    }
  }, [preview])
  
  // Server-side or not mounted yet - render fallback for signed-out (safe default)
  if (!mounted) return <>{children}</>
  
  // Preview mode - inverse of SignedIn check
  if (preview) {
    return showContent ? <>{children}</> : null
  }
  
  // Production mode with Clerk - use Show component
  if (authEnabled) {
    return <ClerkShowWrapper when="signed-out">{children}</ClerkShowWrapper>
  }

  // No auth configured - show signed-out content as fallback
  return <>{children}</>
}

/**
 * UserButton wrapper - renders Clerk's UserButton or a fallback
 */
export function UserButton({ afterSignOutUrl = '/', appearance }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  const authEnabled = isAuthEnabled()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  if (preview) {
    // In preview mode, show a simple avatar placeholder
    return (
      <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 border border-[#C1121F]/30 flex items-center justify-center cursor-pointer hover:bg-[#C1121F]/30 transition-colors">
        <span className="text-xs text-[#C1121F] font-medium">U</span>
      </div>
    )
  }
  
  if (authEnabled) {
    return <ClerkUserButtonWrapper afterSignOutUrl={afterSignOutUrl} appearance={appearance} />
  }
  
  return null
}

/**
 * useAuth hook wrapper - returns auth state
 */
export function useAuth(): { isSignedIn: boolean | undefined; isLoaded: boolean; userId: string | null } {
  const [authState, setAuthState] = useState<{ isSignedIn: boolean | undefined; isLoaded: boolean; userId: string | null }>({
    isSignedIn: undefined,
    isLoaded: false,
    userId: null,
  })
  const preview = isPreviewMode()
  const authEnabled = isAuthEnabled()
  
  useEffect(() => {
    if (preview) {
      // In preview mode, check localStorage
      const hasProfile = localStorage.getItem('athlete_profile')
      const hasWorkouts = localStorage.getItem('workouts')
      const hasPrograms = localStorage.getItem('saved_programs')
      const isSignedIn = Boolean(hasProfile || hasWorkouts || hasPrograms)
      setAuthState({ 
        isSignedIn, 
        isLoaded: true, 
        userId: isSignedIn ? 'preview-user' : null 
      })
    } else if (authEnabled) {
      // In production with Clerk, we need to use Clerk's hook
      // This wrapper provides a fallback - actual usage should import from useClerkAuth hook
      setAuthState({ isSignedIn: undefined, isLoaded: true, userId: null })
    } else {
      setAuthState({ isSignedIn: false, isLoaded: true, userId: null })
    }
  }, [preview, authEnabled])
  
  return authState
}

// =============================================================================
// Internal Clerk Wrappers (dynamic loading)
// =============================================================================

function ClerkShowWrapper({ when, children }: { when: 'signed-in' | 'signed-out'; children: ReactNode }) {
  const [ClerkShow, setClerkShow] = useState<React.ComponentType<{ when: string; children: ReactNode }> | null>(null)
  const [error, setError] = useState(false)
  
  useEffect(() => {
    import('@clerk/nextjs')
      .then((mod) => {
        // Clerk v7 uses Show component
        if (mod.Show) {
          setClerkShow(() => mod.Show)
        } else {
          // Fallback for older versions
          console.warn('[v0] Clerk Show component not found')
          setError(true)
        }
      })
      .catch((err) => {
        console.error('[v0] Failed to load Clerk:', err)
        setError(true)
      })
  }, [])
  
  // While loading, don't render anything for signed-in, show content for signed-out
  if (!ClerkShow) {
    return when === 'signed-out' ? <>{children}</> : null
  }
  
  if (error) {
    // Fallback: show signed-out content, hide signed-in content
    return when === 'signed-out' ? <>{children}</> : null
  }
  
  return <ClerkShow when={when}>{children}</ClerkShow>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ClerkUserButtonWrapper({ afterSignOutUrl, appearance }: { afterSignOutUrl: string; appearance?: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ClerkUserButton, setClerkUserButton] = useState<React.ComponentType<any> | null>(null)
  
  useEffect(() => {
    import('@clerk/nextjs')
      .then((mod) => {
        if (mod.UserButton) {
          setClerkUserButton(() => mod.UserButton)
        }
      })
      .catch((err) => {
        console.error('[v0] Failed to load Clerk UserButton:', err)
      })
  }, [])
  
  if (!ClerkUserButton) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#2B313A] flex items-center justify-center animate-pulse">
        <span className="text-xs text-[#A4ACB8]">...</span>
      </div>
    )
  }
  
  return <ClerkUserButton afterSignOutUrl={afterSignOutUrl} appearance={appearance} />
}
