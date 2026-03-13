'use client'

// ClerkComponents - Simple wrappers for Clerk auth UI components
// ClerkProvider is now in the root layout, so these work everywhere
// Note: @clerk/nextjs@7 does not export SignedIn, SignedOut, or UserButton directly
// so we provide our own implementations using the available hooks

import { ReactNode, useState, useEffect } from 'react'
import { useAuth, useUser, useClerk } from '@clerk/nextjs'

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedIn - renders children only when user is signed in
 * Uses Clerk's useAuth hook for reliable auth state
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [authState, setAuthState] = useState({ isLoaded: false, isSignedIn: false })

  // Wrap hook in try-catch for error resilience
  let isLoaded = false
  let isSignedIn = false
  try {
    const auth = useAuth()
    isLoaded = auth.isLoaded
    isSignedIn = auth.isSignedIn ?? false
  } catch {
    // Clerk failed to initialize - treat as not signed in
    isLoaded = true
    isSignedIn = false
  }

  useEffect(() => {
    setMounted(true)
    setAuthState({ isLoaded, isSignedIn })
  }, [isLoaded, isSignedIn])

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) return null

  // Wait for auth to load
  if (!authState.isLoaded) return null

  // Only render when signed in
  return authState.isSignedIn ? <>{children}</> : null
}

/**
 * SignedOut - renders children only when user is signed out
 * Uses Clerk's useAuth hook for reliable auth state
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [authState, setAuthState] = useState({ isLoaded: false, isSignedIn: false })

  // Wrap hook in try-catch for error resilience
  let isLoaded = false
  let isSignedIn = false
  try {
    const auth = useAuth()
    isLoaded = auth.isLoaded
    isSignedIn = auth.isSignedIn ?? false
  } catch {
    // Clerk failed to initialize - treat as signed out (show sign-out UI)
    isLoaded = true
    isSignedIn = false
  }

  useEffect(() => {
    setMounted(true)
    setAuthState({ isLoaded, isSignedIn })
  }, [isLoaded, isSignedIn])

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) return null

  // Wait for auth to load
  if (!authState.isLoaded) return null

  // Only render when signed out
  return authState.isSignedIn ? null : <>{children}</>
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
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  // Wrap hooks in try-catch for error resilience
  let user = null
  let signOutFn: ((opts?: { redirectUrl?: string }) => Promise<void>) | null = null
  try {
    const userData = useUser()
    const clerk = useClerk()
    user = userData.user
    signOutFn = clerk.signOut
  } catch {
    // Clerk failed to initialize
    return null
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !user) return null

  const initial = (user.firstName?.[0] ?? user.primaryEmailAddress?.emailAddress?.[0] ?? 'A').toUpperCase()

  const handleSignOut = async () => {
    setShowMenu(false)
    if (signOutFn) {
      await signOutFn({ redirectUrl: afterSignOutUrl })
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
 * Re-export useAuth and useUser from Clerk for convenience
 */
export { useAuth, useUser }
