'use client'

// ClerkComponents - Simple wrappers for Clerk auth UI components
// ClerkProvider is now in the root layout, so these work everywhere
// Note: @clerk/nextjs@7 does not export SignedIn, SignedOut, or UserButton directly
// so we provide our own implementations using the available hooks
//
// IMPORTANT: These components handle preview mode gracefully by checking
// ClerkAvailabilityContext before attempting to use Clerk hooks.

import { ReactNode, useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'

// We need to import Clerk hooks conditionally to avoid crashes in preview
let useAuthHook: () => { isLoaded: boolean; isSignedIn: boolean | undefined; signOut: (opts?: { redirectUrl?: string }) => Promise<void> }
let useUserHook: () => { user: unknown; isLoaded: boolean; isSignedIn?: boolean }
let useClerkHook: () => { signOut: (opts?: { redirectUrl?: string }) => Promise<void> }

// Safe hook wrappers that return default values when Clerk isn't available
function useSafeAuth() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [clerkState, setClerkState] = useState<{ isLoaded: boolean; isSignedIn: boolean | undefined }>({ 
    isLoaded: false, 
    isSignedIn: undefined 
  })
  
  useEffect(() => {
    if (!isClerkAvailable || isLoading) {
      setClerkState({ isLoaded: true, isSignedIn: false })
      return
    }
    
    // Dynamically import and use Clerk hooks only when available
    import('@clerk/nextjs').then(({ useAuth }) => {
      // This is a workaround - we can't call hooks inside useEffect
      // So we'll use the component-level hook instead
    }).catch(() => {
      setClerkState({ isLoaded: true, isSignedIn: false })
    })
  }, [isClerkAvailable, isLoading])
  
  return clerkState
}

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedIn - renders children only when user is signed in
 * Handles preview mode gracefully by not rendering anything
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()
  const [authState, setAuthState] = useState<{ isLoaded: boolean; isSignedIn: boolean }>({
    isLoaded: false,
    isSignedIn: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isClerkLoading) return
    
    // If Clerk isn't available, user is definitely not signed in
    if (!isClerkAvailable) {
      setAuthState({ isLoaded: true, isSignedIn: false })
      return
    }
    
    // Clerk is available, use the actual hook
    // We need to get auth state from the Clerk context
    const checkAuth = async () => {
      try {
        const { useAuth } = await import('@clerk/nextjs')
        // Note: We can't call hooks here, so we'll need a different approach
        // For now, assume auth is available and let the hook handle it
      } catch {
        setAuthState({ isLoaded: true, isSignedIn: false })
      }
    }
    checkAuth()
  }, [mounted, isClerkAvailable, isClerkLoading])

  // Don't render during SSR or loading
  if (!mounted || isClerkLoading) return null
  
  // In preview mode, never show signed-in content
  if (!isClerkAvailable) return null

  // Delegate to actual Clerk component when available
  return <SignedInInner>{children}</SignedInInner>
}

// Inner component that can safely use Clerk hooks
function SignedInInner({ children }: AuthComponentProps) {
  // Safe to use Clerk hooks here because parent verified Clerk is available
  const { useAuth } = require('@clerk/nextjs')
  const { isLoaded, isSignedIn } = useAuth()
  
  if (!isLoaded) return null
  return isSignedIn ? <>{children}</> : null
}

/**
 * SignedOut - renders children only when user is signed out
 * Handles preview mode by treating user as signed out
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR or loading
  if (!mounted || isClerkLoading) return null
  
  // In preview mode, always show signed-out content
  if (!isClerkAvailable) return <>{children}</>

  // Delegate to actual Clerk component when available
  return <SignedOutInner>{children}</SignedOutInner>
}

// Inner component that can safely use Clerk hooks
function SignedOutInner({ children }: AuthComponentProps) {
  // Safe to use Clerk hooks here because parent verified Clerk is available
  const { useAuth } = require('@clerk/nextjs')
  const { isLoaded, isSignedIn } = useAuth()
  
  if (!isLoaded) return null
  return isSignedIn ? null : <>{children}</>
}

interface UserButtonProps {
  afterSignOutUrl?: string
  appearance?: {
    elements?: Record<string, string>
  }
}

/**
 * UserButton - custom implementation since @clerk/nextjs@7 doesn't export UserButton
 * Shows user avatar with sign-out functionality
 * Handles preview mode gracefully by not rendering
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR or loading
  if (!mounted || isClerkLoading) return null
  
  // In preview mode, don't render user button
  if (!isClerkAvailable) return null

  // Delegate to inner component that can use Clerk hooks
  return <UserButtonInner afterSignOutUrl={afterSignOutUrl} />
}

// Inner component that can safely use Clerk hooks
function UserButtonInner({ afterSignOutUrl }: { afterSignOutUrl: string }) {
  const [showMenu, setShowMenu] = useState(false)
  
  // Safe to use Clerk hooks here because parent verified Clerk is available
  const { useUser, useClerk } = require('@clerk/nextjs')
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  // Don't render while loading or if no user
  if (!isLoaded || !user) return null

  const initial = (user.firstName?.[0] ?? user.primaryEmailAddress?.emailAddress?.[0] ?? 'A').toUpperCase()

  const handleSignOut = async () => {
    setShowMenu(false)
    try {
      await signOut({ redirectUrl: afterSignOutUrl })
    } catch {
      // Ignore sign-out errors in preview/edge cases
      window.location.href = afterSignOutUrl
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 rounded-full bg-[#C1121F] flex items-center justify-center text-xs font-bold text-white cursor-pointer select-none hover:bg-[#A30F1A] transition-colors"
        title={user.primaryEmailAddress?.emailAddress ?? 'Account'}
      >
        {initial}
      </button>
      
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1F26] border border-[#2B313A] rounded-lg shadow-xl z-50 py-1">
            <div className="px-3 py-2 border-b border-[#2B313A]">
              <div className="text-sm font-medium text-[#E6E9EF] truncate">
                {user.firstName || 'User'}
              </div>
              <div className="text-xs text-[#A4ACB8] truncate">
                {user.primaryEmailAddress?.emailAddress}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-sm text-[#E6E9EF] hover:bg-[#2B313A] transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Safe wrapper for useAuth - returns defaults when Clerk isn't available
 */
export function useSafeAuth() {
  const { isClerkAvailable } = useClerkAvailability()
  
  if (!isClerkAvailable) {
    return {
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      signOut: async () => {},
    }
  }
  
  // Clerk is available, use the actual hook
  const { useAuth } = require('@clerk/nextjs')
  return useAuth()
}

/**
 * Safe wrapper for useUser - returns defaults when Clerk isn't available
 */
export function useSafeUser() {
  const { isClerkAvailable } = useClerkAvailability()
  
  if (!isClerkAvailable) {
    return {
      user: null,
      isLoaded: true,
      isSignedIn: false,
    }
  }
  
  // Clerk is available, use the actual hook
  const { useUser } = require('@clerk/nextjs')
  return useUser()
}

/**
 * IMPORTANT: Do NOT use useAuth or useUser directly from '@clerk/nextjs' in components
 * that may render in preview mode. Always use useSafeAuth and useSafeUser instead.
 * 
 * These safe wrappers handle:
 * - Preview mode (returns defaults when Clerk isn't available)
 * - Loading states
 * - Error handling
 */
