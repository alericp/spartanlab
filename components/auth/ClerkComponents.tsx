'use client'

/**
 * ClerkComponents - Preview-safe auth components
 * 
 * ARCHITECTURE:
 * These components use the useClerkAvailability hook to determine if Clerk
 * is available. The hook's state is set by ClerkProviderWrapper, which
 * uses a synchronous check to determine if we're on a production domain.
 * 
 * On preview domains:
 * - SignedIn: renders nothing
 * - SignedOut: always renders children
 * - UserButton: renders nothing
 * 
 * On production domains:
 * - All components delegate to dynamically imported Clerk components
 */

import { ReactNode, useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedIn - renders children only when user is signed in
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR or initial mount
  if (!mounted || isLoading) return null
  
  // Preview mode: never signed in
  if (!isClerkAvailable) return null

  // Production: use inner component with hooks
  return <SignedInInner>{children}</SignedInInner>
}

function SignedInInner({ children }: AuthComponentProps) {
  const [authResult, setAuthResult] = useState<{ isLoaded: boolean; isSignedIn: boolean }>({
    isLoaded: false,
    isSignedIn: false,
  })
  
  useEffect(() => {
    let mounted = true
    
    import('@clerk/nextjs').then(({ useAuth }) => {
      // Can't use hooks in useEffect - need component approach
      if (mounted) {
        setAuthResult(prev => ({ ...prev }))
      }
    }).catch(() => {
      if (mounted) {
        setAuthResult({ isLoaded: true, isSignedIn: false })
      }
    })
    
    return () => { mounted = false }
  }, [])

  // Render component that can use hooks
  return <SignedInHookWrapper>{children}</SignedInHookWrapper>
}

function SignedInHookWrapper({ children }: AuthComponentProps) {
  const [HookComponent, setHookComponent] = useState<React.ComponentType<AuthComponentProps> | null>(null)
  
  useEffect(() => {
    import('@clerk/nextjs').then(({ useAuth }) => {
      const Component = ({ children }: AuthComponentProps) => {
        const { isLoaded, isSignedIn } = useAuth()
        if (!isLoaded) return null
        return isSignedIn ? <>{children}</> : null
      }
      setHookComponent(() => Component)
    }).catch(() => {})
  }, [])
  
  if (!HookComponent) return null
  return <HookComponent>{children}</HookComponent>
}

/**
 * SignedOut - renders children when user is NOT signed in
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR or initial mount
  if (!mounted || isLoading) return null
  
  // Preview mode: always signed out
  if (!isClerkAvailable) return <>{children}</>

  // Production: use inner component
  return <SignedOutInner>{children}</SignedOutInner>
}

function SignedOutInner({ children }: AuthComponentProps) {
  const [HookComponent, setHookComponent] = useState<React.ComponentType<AuthComponentProps> | null>(null)
  
  useEffect(() => {
    import('@clerk/nextjs').then(({ useAuth }) => {
      const Component = ({ children }: AuthComponentProps) => {
        const { isLoaded, isSignedIn } = useAuth()
        if (!isLoaded) return null
        return isSignedIn ? null : <>{children}</>
      }
      setHookComponent(() => Component)
    }).catch(() => {
      // On error, show children (assume signed out)
      setHookComponent(() => ({ children }: AuthComponentProps) => <>{children}</>)
    })
  }, [])
  
  if (!HookComponent) return null
  return <HookComponent>{children}</HookComponent>
}

interface UserButtonProps {
  afterSignOutUrl?: string
}

/**
 * UserButton - user avatar with sign-out menu
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR or initial mount
  if (!mounted || isLoading) return null
  
  // Preview mode: no user button
  if (!isClerkAvailable) return null

  // Production: render actual button
  return <UserButtonInner afterSignOutUrl={afterSignOutUrl} />
}

function UserButtonInner({ afterSignOutUrl }: { afterSignOutUrl: string }) {
  const [HookComponent, setHookComponent] = useState<React.ComponentType<{ afterSignOutUrl: string }> | null>(null)
  
  useEffect(() => {
    import('@clerk/nextjs').then(({ useUser, useClerk }) => {
      const Component = ({ afterSignOutUrl }: { afterSignOutUrl: string }) => {
        const { user, isLoaded } = useUser()
        const { signOut } = useClerk()
        const [showMenu, setShowMenu] = useState(false)
        
        if (!isLoaded || !user) return null
        
        const initial = (user.firstName?.[0] ?? user.primaryEmailAddress?.emailAddress?.[0] ?? 'A').toUpperCase()
        
        const handleSignOut = async () => {
          setShowMenu(false)
          try {
            await signOut({ redirectUrl: afterSignOutUrl })
          } catch {
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
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
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
      setHookComponent(() => Component)
    }).catch(() => {})
  }, [])
  
  if (!HookComponent) return null
  return <HookComponent afterSignOutUrl={afterSignOutUrl} />
}

/**
 * useSafeAuth - Preview-safe hook for auth state
 * Returns defaults in preview mode
 */
export function useSafeAuth() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  
  // Default state for preview/loading
  const defaultState = {
    isLoaded: !isLoading,
    isSignedIn: false,
    userId: null as string | null,
    signOut: async () => {},
  }
  
  // Preview mode or loading: return defaults
  if (!isClerkAvailable || isLoading) {
    return defaultState
  }
  
  // Production: the actual state comes from Clerk context
  // Components should use SignedIn/SignedOut for rendering logic
  return defaultState
}

/**
 * useSafeUser - Preview-safe hook for user data
 * Returns null user in preview mode
 */
export function useSafeUser() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  
  const defaultState = {
    user: null as {
      id: string
      firstName?: string | null
      primaryEmailAddress?: { emailAddress: string } | null
      emailAddresses?: Array<{ emailAddress: string }>
      createdAt: number
      username?: string | null
    } | null,
    isLoaded: !isLoading,
    isSignedIn: false,
  }
  
  if (!isClerkAvailable || isLoading) {
    return defaultState
  }
  
  return defaultState
}
