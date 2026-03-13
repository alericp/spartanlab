'use client'

/**
 * ClerkComponentsInner - Production-only Clerk components
 * 
 * IMPORTANT: This file is ONLY imported dynamically from ClerkComponents.tsx
 * when the app is running on a production domain (spartanlab.app).
 * 
 * By isolating all @clerk/nextjs imports here, we ensure that preview
 * environments never load the Clerk bundle.
 */

import { ReactNode, useState } from 'react'
import { useAuth, useUser, useClerk } from '@clerk/nextjs'

interface AuthComponentProps {
  children: ReactNode
}

/**
 * SignedInInner - Uses Clerk's useAuth hook
 * Only loaded on production domains
 */
export function SignedInInner({ children }: AuthComponentProps) {
  const { isLoaded, isSignedIn } = useAuth()
  
  if (!isLoaded) return null
  return isSignedIn ? <>{children}</> : null
}

/**
 * SignedOutInner - Uses Clerk's useAuth hook  
 * Only loaded on production domains
 */
export function SignedOutInner({ children }: AuthComponentProps) {
  const { isLoaded, isSignedIn } = useAuth()
  
  if (!isLoaded) return null
  return isSignedIn ? null : <>{children}</>
}

/**
 * UserButtonInner - User avatar with sign-out menu
 * Only loaded on production domains
 */
export function UserButtonInner({ afterSignOutUrl }: { afterSignOutUrl: string }) {
  const [showMenu, setShowMenu] = useState(false)
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  
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

/**
 * useAuthInner - Direct useAuth hook access
 * Only used on production domains
 */
export function useAuthInner() {
  return useAuth()
}

/**
 * useUserInner - Direct useUser hook access
 * Only used on production domains
 */
export function useUserInner() {
  return useUser()
}

/**
 * OwnerOnlyInner - Renders children only for the platform owner
 * Only loaded on production domains
 */
export function OwnerOnlyInner({ children }: AuthComponentProps) {
  const { user, isLoaded, isSignedIn } = useUser()
  
  if (!isLoaded || !isSignedIn || !user) return null
  
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
  if (!ownerEmail) return null
  
  const userEmail = user.primaryEmailAddress?.emailAddress
  const isOwner = userEmail?.toLowerCase() === ownerEmail.toLowerCase()
  
  return isOwner ? <>{children}</> : null
}
