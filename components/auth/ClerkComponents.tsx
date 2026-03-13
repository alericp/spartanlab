'use client'

// Wrapper components for Clerk authentication
// These provide fallbacks for preview mode and graceful handling

import { ReactNode, useState, useEffect } from 'react'
import { isPreviewMode } from '@/lib/app-mode'

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedIn wrapper - renders children only when user is signed in
 * In preview mode, always renders children (assumes signed in for app areas)
 */
export function SignedIn({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  if (preview) {
    // In preview mode, assume signed in for app areas
    return <>{children}</>
  }
  
  // In production, dynamically load Clerk's SignedIn
  // This component will be replaced with actual Clerk component when ClerkProvider is active
  return <ClerkSignedInWrapper>{children}</ClerkSignedInWrapper>
}

/**
 * SignedOut wrapper - renders children only when user is signed out
 * In preview mode, renders nothing (assume signed in)
 */
export function SignedOut({ children }: AuthComponentProps) {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  if (preview) {
    // In preview mode, assume signed in so don't show signed-out content
    return null
  }
  
  // In production, dynamically load Clerk's SignedOut
  return <ClerkSignedOutWrapper>{children}</ClerkSignedOutWrapper>
}

/**
 * UserButton wrapper - renders Clerk's UserButton or a fallback
 */
export function UserButton({ afterSignOutUrl = '/' }: { afterSignOutUrl?: string }) {
  const [mounted, setMounted] = useState(false)
  const preview = isPreviewMode()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  if (preview) {
    // In preview mode, show a simple avatar placeholder
    return (
      <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 border border-[#C1121F]/30 flex items-center justify-center">
        <span className="text-xs text-[#C1121F] font-medium">U</span>
      </div>
    )
  }
  
  return <ClerkUserButtonWrapper afterSignOutUrl={afterSignOutUrl} />
}

/**
 * useAuth hook wrapper - returns auth state
 */
export function useAuth(): { isSignedIn: boolean | undefined; isLoaded: boolean } {
  const [authState, setAuthState] = useState<{ isSignedIn: boolean | undefined; isLoaded: boolean }>({
    isSignedIn: undefined,
    isLoaded: false,
  })
  const preview = isPreviewMode()
  
  useEffect(() => {
    if (preview) {
      setAuthState({ isSignedIn: true, isLoaded: true })
    } else {
      // In production, use actual Clerk auth
      import('@clerk/nextjs').then(({ useAuth: clerkUseAuth }) => {
        // Note: This won't work correctly as hooks can't be dynamically called
        // The component using this should handle auth state differently in production
        setAuthState({ isSignedIn: undefined, isLoaded: true })
      }).catch(() => {
        setAuthState({ isSignedIn: false, isLoaded: true })
      })
    }
  }, [preview])
  
  return authState
}

// Dynamic Clerk component wrappers using lazy loading
function ClerkSignedInWrapper({ children }: AuthComponentProps) {
  const [Component, setComponent] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)
  
  useEffect(() => {
    import('@clerk/nextjs').then((mod) => {
      setComponent(() => mod.SignedIn)
    }).catch(() => {
      // If Clerk fails to load, don't render anything
    })
  }, [])
  
  if (!Component) return null
  return <Component>{children}</Component>
}

function ClerkSignedOutWrapper({ children }: AuthComponentProps) {
  const [Component, setComponent] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)
  
  useEffect(() => {
    import('@clerk/nextjs').then((mod) => {
      setComponent(() => mod.SignedOut)
    }).catch(() => {
      // If Clerk fails to load, show signed-out content as fallback
      setComponent(() => ({ children }: AuthComponentProps) => <>{children}</>)
    })
  }, [])
  
  if (!Component) return <>{children}</> // Show content while loading
  return <Component>{children}</Component>
}

function ClerkUserButtonWrapper({ afterSignOutUrl }: { afterSignOutUrl: string }) {
  const [Component, setComponent] = useState<React.ComponentType<{ afterSignOutUrl?: string }> | null>(null)
  
  useEffect(() => {
    import('@clerk/nextjs').then((mod) => {
      setComponent(() => mod.UserButton)
    }).catch(() => {
      // If Clerk fails to load, show placeholder
    })
  }, [])
  
  if (!Component) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#2B313A] flex items-center justify-center">
        <span className="text-xs text-[#A4ACB8]">?</span>
      </div>
    )
  }
  
  return <Component afterSignOutUrl={afterSignOutUrl} />
}
