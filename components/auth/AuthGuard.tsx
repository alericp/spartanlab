'use client'

// AuthGuard - Safe wrapper for protected pages
// Handles auth loading states gracefully and redirects unauthenticated users

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

/**
 * AuthGuard wraps protected page content
 * - Shows loading state while auth resolves
 * - Redirects to sign-in if not authenticated
 * - Renders children when authenticated
 */
export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.replace(redirectTo)
    } else {
      setShouldRender(true)
    }
  }, [isLoaded, isSignedIn, router, redirectTo])

  // Show loading state while checking auth
  if (!isLoaded || !shouldRender) {
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
 */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
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
  }, [isLoaded, isSignedIn, user])

  // Never render during loading or for non-owners
  if (!isLoaded || !isSignedIn || !isOwner) {
    return null
  }

  return <>{children}</>
}

/**
 * useOwnerStatus - Hook to check if current user is the owner
 */
export function useOwnerStatus(): { isOwner: boolean; isLoaded: boolean } {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [status, setStatus] = useState({ isOwner: false, isLoaded: false })

  useEffect(() => {
    if (!isLoaded) {
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
  }, [isLoaded, isSignedIn, user])

  return status
}
