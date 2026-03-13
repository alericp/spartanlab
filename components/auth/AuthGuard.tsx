'use client'

/**
 * AuthGuard - Preview-safe wrapper for protected pages
 * 
 * On preview: Allows access without authentication (for testing UI)
 * On production: Requires authentication, redirects to sign-in if needed
 */

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { SignedIn, SignedOut } from '@/components/auth/ClerkComponents'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/**
 * AuthGuard wraps protected page content
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isClerkLoading) {
    return fallback ?? <LoadingState />
  }

  // Preview mode: allow access without auth
  if (!isClerkAvailable) {
    return <>{children}</>
  }

  // Production: use auth-aware rendering
  return (
    <AuthGuardProduction redirectTo={redirectTo} fallback={fallback}>
      {children}
    </AuthGuardProduction>
  )
}

function AuthGuardProduction({ children, fallback, redirectTo }: AuthGuardProps) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <AuthRedirect redirectTo={redirectTo ?? '/sign-in'} fallback={fallback} />
      </SignedOut>
    </>
  )
}

function AuthRedirect({ redirectTo, fallback }: { redirectTo: string; fallback?: ReactNode }) {
  const router = useRouter()
  
  useEffect(() => {
    router.replace(redirectTo)
  }, [router, redirectTo])
  
  return fallback ?? <LoadingState />
}

/**
 * OwnerOnly - Only renders content for the platform owner
 * Uses runtime import to check owner status
 */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading || !isClerkAvailable) return

    // Check owner status via Clerk global
    const checkOwner = () => {
      try {
        const clerk = (window as unknown as { 
          Clerk?: { 
            user?: { 
              primaryEmailAddress?: { emailAddress: string }
            } 
          } 
        }).Clerk
        
        if (clerk?.user) {
          const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
          const userEmail = clerk.user.primaryEmailAddress?.emailAddress
          setIsOwner(userEmail?.toLowerCase() === ownerEmail?.toLowerCase())
        }
      } catch {
        setIsOwner(false)
      }
    }
    
    checkOwner()
    const interval = setInterval(checkOwner, 500)
    setTimeout(() => clearInterval(interval), 5000)
    return () => clearInterval(interval)
  }, [mounted, isLoading, isClerkAvailable])

  if (!mounted || isLoading || !isClerkAvailable || !isOwner) {
    return null
  }

  return <>{children}</>
}

/**
 * useOwnerStatus - Returns isOwner: false in preview
 */
export function useOwnerStatus(): { isOwner: boolean; isLoaded: boolean } {
  const { isLoading } = useClerkAvailability()
  return { isOwner: false, isLoaded: !isLoading }
}
