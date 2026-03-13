'use client'

/**
 * ClerkComponents - Preview-safe auth components
 * 
 * Uses runtime dynamic imports to hide module names from Webpack.
 * On preview domains, these components render static fallbacks.
 * On production domains, they load Clerk hooks at runtime.
 */

import { ReactNode, useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'

interface AuthComponentProps {
  children: ReactNode
}

/**
 * Runtime module loader - hides from Webpack's static analysis
 */
async function loadClerkHooks() {
  const parts = ['@', 'clerk', '/', 'nextjs']
  const moduleName = parts.join('')
  const dynamicImport = new Function('m', 'return import(m)')
  return dynamicImport(moduleName)
}

/**
 * SignedIn - renders children only when user is signed in
 * Preview: renders nothing
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isClerkAvailable || isLoading || !mounted) return

    loadClerkHooks()
      .then((mod: { useAuth: () => { isLoaded: boolean; isSignedIn: boolean } }) => {
        // We can't use hooks here, so we need a different approach
        // The hook needs to be called in a component
      })
      .catch(() => setIsSignedIn(false))
  }, [isClerkAvailable, isLoading, mounted])

  if (!mounted || isLoading) return null
  if (!isClerkAvailable) return null

  // On production, use the inner component
  return <SignedInInner>{children}</SignedInInner>
}

function SignedInInner({ children }: AuthComponentProps) {
  const { isClerkAvailable } = useClerkAvailability()
  const [authState, setAuthState] = useState<{ isLoaded: boolean; isSignedIn: boolean } | null>(null)
  const [hookLoaded, setHookLoaded] = useState(false)

  useEffect(() => {
    if (!isClerkAvailable) {
      setAuthState({ isLoaded: true, isSignedIn: false })
      return
    }

    // Load hooks and poll for auth state
    loadClerkHooks()
      .then((mod) => {
        setHookLoaded(true)
        // Create a polling mechanism since we can't use hooks directly
        const checkAuth = () => {
          try {
            // Access Clerk's client-side state
            const clerk = (window as unknown as { Clerk?: { user?: unknown } }).Clerk
            if (clerk) {
              setAuthState({ isLoaded: true, isSignedIn: !!clerk.user })
            }
          } catch {
            setAuthState({ isLoaded: true, isSignedIn: false })
          }
        }
        checkAuth()
        const interval = setInterval(checkAuth, 500)
        setTimeout(() => clearInterval(interval), 5000) // Stop after 5s
      })
      .catch(() => setAuthState({ isLoaded: true, isSignedIn: false }))
  }, [isClerkAvailable])

  if (!authState || !authState.isLoaded) return null
  return authState.isSignedIn ? <>{children}</> : null
}

/**
 * SignedOut - renders children when user is NOT signed in
 * Preview: always renders children
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) return null
  if (!isClerkAvailable) return <>{children}</>

  return <SignedOutInner>{children}</SignedOutInner>
}

function SignedOutInner({ children }: AuthComponentProps) {
  const { isClerkAvailable } = useClerkAvailability()
  const [authState, setAuthState] = useState<{ isLoaded: boolean; isSignedIn: boolean } | null>(null)

  useEffect(() => {
    if (!isClerkAvailable) {
      setAuthState({ isLoaded: true, isSignedIn: false })
      return
    }

    loadClerkHooks()
      .then(() => {
        const checkAuth = () => {
          try {
            const clerk = (window as unknown as { Clerk?: { user?: unknown } }).Clerk
            if (clerk) {
              setAuthState({ isLoaded: true, isSignedIn: !!clerk.user })
            }
          } catch {
            setAuthState({ isLoaded: true, isSignedIn: false })
          }
        }
        checkAuth()
        const interval = setInterval(checkAuth, 500)
        setTimeout(() => clearInterval(interval), 5000)
      })
      .catch(() => setAuthState({ isLoaded: true, isSignedIn: false }))
  }, [isClerkAvailable])

  if (!authState || !authState.isLoaded) return <>{children}</>
  return authState.isSignedIn ? null : <>{children}</>
}

interface UserButtonProps {
  afterSignOutUrl?: string
}

/**
 * UserButton - user avatar with sign-out menu
 * Preview: renders nothing
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [showMenu, setShowMenu] = useState(false)
  const [user, setUser] = useState<{ firstName?: string; email?: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isClerkAvailable || isLoading || !mounted) return

    const checkUser = () => {
      try {
        const clerk = (window as unknown as { 
          Clerk?: { 
            user?: { 
              firstName?: string
              primaryEmailAddress?: { emailAddress: string }
            } 
          } 
        }).Clerk
        if (clerk?.user) {
          setUser({
            firstName: clerk.user.firstName,
            email: clerk.user.primaryEmailAddress?.emailAddress,
          })
        }
      } catch {
        // Ignore
      }
    }
    checkUser()
    const interval = setInterval(checkUser, 500)
    setTimeout(() => clearInterval(interval), 5000)
    return () => clearInterval(interval)
  }, [isClerkAvailable, isLoading, mounted])

  if (!mounted || isLoading || !isClerkAvailable || !user) return null

  const initial = (user.firstName?.[0] ?? user.email?.[0] ?? 'A').toUpperCase()

  const handleSignOut = async () => {
    setShowMenu(false)
    try {
      const clerk = (window as unknown as { Clerk?: { signOut?: (opts: { redirectUrl: string }) => Promise<void> } }).Clerk
      if (clerk?.signOut) {
        await clerk.signOut({ redirectUrl: afterSignOutUrl })
      } else {
        window.location.href = afterSignOutUrl
      }
    } catch {
      window.location.href = afterSignOutUrl
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 rounded-full bg-[#C1121F] flex items-center justify-center text-xs font-bold text-white cursor-pointer select-none hover:bg-[#A30F1A] transition-colors"
        title={user.email ?? 'Account'}
      >
        {initial}
      </button>
      
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1F26] border border-[#2B313A] rounded-lg shadow-xl z-50 py-1">
            <div className="px-3 py-2 border-b border-[#2B313A]">
              <div className="text-sm font-medium text-[#E6E9EF] truncate">
                {user.firstName || 'User'}
              </div>
              <div className="text-xs text-[#A4ACB8] truncate">
                {user.email}
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
 * useSafeAuth - Preview-safe hook for auth state
 */
export function useSafeAuth() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  
  return {
    isLoaded: !isLoading,
    isSignedIn: false,
    userId: null as string | null,
    signOut: async () => {},
  }
}

/**
 * useSafeUser - Preview-safe hook for user data
 */
export function useSafeUser() {
  return {
    user: null,
    isLoaded: true,
    isSignedIn: false,
  }
}
