'use client'

// AuthGuard - Safe wrapper for protected pages
// Handles auth loading states gracefully and redirects unauthenticated users
// Handles preview mode gracefully by showing a preview notice instead of crashing

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { useSafeAuth, useSafeUser } from '@/components/auth/ClerkComponents'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

/**
 * Preview fallback component for protected routes
 * Shows when Clerk isn't available in preview mode
 */
function PreviewAuthFallback() {
  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-[#A4ACB8]" />
        </div>
        <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
          Preview Mode
        </h2>
        <p className="text-sm text-[#A4ACB8] mb-6">
          Authentication is limited in preview environments. 
          Use the production domain to test authenticated features.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="border-[#2B313A] text-[#A4ACB8]">
              Return Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
              Continue to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * AuthGuard wraps protected page content
 * - Shows loading state while auth resolves
 * - Redirects to sign-in if not authenticated
 * - Renders children when authenticated
 * - Shows preview fallback when Clerk isn't available
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  const router = useRouter()
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()
  const { isLoaded, isSignedIn } = useSafeAuth()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Wait for Clerk availability check
    if (isClerkLoading) return
    
    // In preview mode, allow dashboard access without auth
    if (!isClerkAvailable) {
      setShouldRender(true)
      return
    }
    
    // Normal auth flow
    if (!isLoaded) return

    if (!isSignedIn) {
      router.replace(redirectTo)
    } else {
      setShouldRender(true)
    }
  }, [isClerkLoading, isClerkAvailable, isLoaded, isSignedIn, router, redirectTo])

  // Show loading state while checking auth
  if (isClerkLoading || (!shouldRender && isClerkAvailable)) {
    return fallback ?? (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

/**
 * OwnerOnly - Only renders content for the platform owner
 * Uses NEXT_PUBLIC_OWNER_EMAIL to determine owner status
 * Returns nothing in preview mode (no auth available)
 */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()
  const { isLoaded, isSignedIn } = useSafeAuth()
  const { user } = useSafeUser()
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    // In preview mode, never show owner content
    if (!isClerkAvailable) {
      setIsOwner(false)
      return
    }
    
    if (!isLoaded || !isSignedIn || !user) {
      setIsOwner(false)
      return
    }

    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
    if (!ownerEmail) {
      setIsOwner(false)
      return
    }

    const userEmail = user.primaryEmailAddress?.emailAddress
    setIsOwner(userEmail?.toLowerCase() === ownerEmail.toLowerCase())
  }, [isClerkAvailable, isLoaded, isSignedIn, user])

  // Never render during loading, in preview, or for non-owners
  if (isClerkLoading || !isClerkAvailable || !isLoaded || !isSignedIn || !isOwner) {
    return null
  }

  return <>{children}</>
}

/**
 * useOwnerStatus - Hook to check if current user is the owner
 * Returns isOwner: false in preview mode
 */
export function useOwnerStatus(): { isOwner: boolean; isLoaded: boolean } {
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()
  const { isLoaded, isSignedIn } = useSafeAuth()
  const { user } = useSafeUser()
  const [status, setStatus] = useState({ isOwner: false, isLoaded: false })

  useEffect(() => {
    // In preview mode, user is not owner
    if (!isClerkAvailable && !isClerkLoading) {
      setStatus({ isOwner: false, isLoaded: true })
      return
    }
    
    if (isClerkLoading || !isLoaded) {
      setStatus({ isOwner: false, isLoaded: false })
      return
    }

    if (!isSignedIn || !user) {
      setStatus({ isOwner: false, isLoaded: true })
      return
    }

    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
    if (!ownerEmail) {
      setStatus({ isOwner: false, isLoaded: true })
      return
    }

    const userEmail = user.primaryEmailAddress?.emailAddress
    const isOwner = userEmail?.toLowerCase() === ownerEmail.toLowerCase()
    setStatus({ isOwner, isLoaded: true })
  }, [isClerkAvailable, isClerkLoading, isLoaded, isSignedIn, user])

  return status
}
