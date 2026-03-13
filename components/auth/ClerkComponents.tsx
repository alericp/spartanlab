'use client'

// Custom auth components that work with both Clerk (production) and preview mode
// Uses useAuth hook instead of SignedIn/SignedOut components to avoid Clerk v7 build issues
// Safely handles cases where Clerk isn't fully initialized

import { ReactNode, useState, useEffect } from 'react'
import { isPreviewMode } from '@/lib/app-mode'

// Dynamic import approach to avoid build-time static analysis issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clerkModule: any = null

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedIn - renders children only when user is signed in
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined)
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
    
    if (preview) {
      // In preview mode, check localStorage for user data
      const hasData = 
        localStorage.getItem('athlete_profile') ||
        localStorage.getItem('workouts') ||
        localStorage.getItem('saved_programs')
      setIsSignedIn(Boolean(hasData))
    } else {
      // In production, dynamically import and use Clerk
      import('@clerk/nextjs').then((mod) => {
        clerkModule = mod
      }).catch(() => {
        setIsSignedIn(false)
      })
    }
  }, [preview])
  
  // Use a separate effect to listen to Clerk auth state in production
  useEffect(() => {
    if (preview || !mounted) return
    
    // Poll for Clerk auth state (simple approach that works with dynamic imports)
    const checkAuth = async () => {
      try {
        if (clerkModule) {
          // Access auth state through Clerk's client-side API
          // @ts-expect-error - accessing Clerk global
          const clerk = window.Clerk
          if (clerk && clerk.user) {
            setIsSignedIn(true)
          } else if (clerk) {
            setIsSignedIn(false)
          }
        }
      } catch {
        // Silent fail
      }
    }
    
    checkAuth()
    const interval = setInterval(checkAuth, 500)
    return () => clearInterval(interval)
  }, [preview, mounted])
  
  // Don't render until mounted
  if (!mounted) return null
  
  // In preview mode, render based on localStorage state
  if (preview) {
    return isSignedIn ? <>{children}</> : null
  }
  
  // In production, render based on Clerk state
  return isSignedIn ? <>{children}</> : null
}

/**
 * SignedOut - renders children only when user is signed out
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(undefined)
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
    
    if (preview) {
      const hasData = 
        localStorage.getItem('athlete_profile') ||
        localStorage.getItem('workouts') ||
        localStorage.getItem('saved_programs')
      setIsSignedIn(Boolean(hasData))
    } else {
      import('@clerk/nextjs').then((mod) => {
        clerkModule = mod
      }).catch(() => {
        setIsSignedIn(false)
      })
    }
  }, [preview])
  
  useEffect(() => {
    if (preview || !mounted) return
    
    const checkAuth = async () => {
      try {
        // @ts-expect-error - accessing Clerk global
        const clerk = window.Clerk
        if (clerk && clerk.user) {
          setIsSignedIn(true)
        } else if (clerk) {
          setIsSignedIn(false)
        }
      } catch {
        // Silent fail
      }
    }
    
    checkAuth()
    const interval = setInterval(checkAuth, 500)
    return () => clearInterval(interval)
  }, [preview, mounted])
  
  // Don't render until mounted
  if (!mounted) return null
  
  // Show signed-out content by default while loading
  if (isSignedIn === undefined) {
    return <>{children}</>
  }
  
  return isSignedIn ? null : <>{children}</>
}

interface UserButtonProps {
  afterSignOutUrl?: string
  appearance?: {
    elements?: Record<string, string>
  }
}

/**
 * UserButton wrapper
 */
export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const [mounted, setMounted] = useState(false)
  const [ClerkUserButton, setClerkUserButton] = useState<React.ComponentType<UserButtonProps> | null>(null)
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
    
    if (!preview) {
      import('@clerk/nextjs').then((mod) => {
        setClerkUserButton(() => mod.UserButton)
      }).catch(() => {
        // Silent fail
      })
    }
  }, [preview])
  
  if (!mounted) return null
  
  if (preview) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#C1121F] flex items-center justify-center text-sm font-bold text-white">
        A
      </div>
    )
  }
  
  if (ClerkUserButton) {
    return <ClerkUserButton afterSignOutUrl={afterSignOutUrl} />
  }
  
  return null
}

/**
 * useAuth hook wrapper
 */
export function useAuth(): { isSignedIn: boolean | undefined; isLoaded: boolean; userId: string | null } {
  const [mounted, setMounted] = useState(false)
  const [authState, setAuthState] = useState<{ isSignedIn: boolean | undefined; isLoaded: boolean; userId: string | null }>({
    isSignedIn: undefined,
    isLoaded: false,
    userId: null
  })
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
    
    if (preview) {
      const hasData = 
        localStorage.getItem('athlete_profile') ||
        localStorage.getItem('workouts') ||
        localStorage.getItem('saved_programs')
      setAuthState({
        isSignedIn: Boolean(hasData),
        isLoaded: true,
        userId: hasData ? 'preview-user' : null
      })
    }
  }, [preview])
  
  useEffect(() => {
    if (preview || !mounted) return
    
    const checkAuth = () => {
      try {
        // @ts-expect-error - accessing Clerk global
        const clerk = window.Clerk
        if (clerk) {
          setAuthState({
            isSignedIn: Boolean(clerk.user),
            isLoaded: true,
            userId: clerk.user?.id ?? null
          })
        }
      } catch {
        setAuthState({
          isSignedIn: false,
          isLoaded: true,
          userId: null
        })
      }
    }
    
    checkAuth()
    const interval = setInterval(checkAuth, 500)
    return () => clearInterval(interval)
  }, [preview, mounted])
  
  return authState
}

/**
 * useCurrentUser hook wrapper
 */
export function useCurrentUser() {
  const [mounted, setMounted] = useState(false)
  const [userState, setUserState] = useState<{ user: unknown; isLoaded: boolean }>({
    user: null,
    isLoaded: false
  })
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
    
    if (preview) {
      setUserState({
        user: {
          id: 'preview-user',
          primaryEmailAddress: { emailAddress: 'athlete@preview.local' },
          firstName: 'Athlete',
          lastName: 'Preview',
        },
        isLoaded: true,
      })
    }
  }, [preview])
  
  useEffect(() => {
    if (preview || !mounted) return
    
    const checkUser = () => {
      try {
        // @ts-expect-error - accessing Clerk global
        const clerk = window.Clerk
        if (clerk) {
          setUserState({
            user: clerk.user,
            isLoaded: true,
          })
        }
      } catch {
        setUserState({
          user: null,
          isLoaded: true,
        })
      }
    }
    
    checkUser()
    const interval = setInterval(checkUser, 500)
    return () => clearInterval(interval)
  }, [preview, mounted])
  
  return userState
}
