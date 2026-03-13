'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { useSafeAuth, useSafeUser } from '@/components/auth/ClerkComponents'

/**
 * Default CTA buttons shown when auth is loading or unavailable
 */
function DefaultAuthCTA() {
  return (
    <>
      <Link href="/sign-in">
        <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
          Login
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A]">
          Start Training
        </Button>
      </Link>
    </>
  )
}

export function HeaderAuthCTA() {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()
  const { isLoaded, isSignedIn } = useSafeAuth()
  const { user } = useSafeUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render auth-specific content during SSR
  if (!mounted) return <DefaultAuthCTA />
  
  // Show default while checking Clerk availability
  if (isClerkLoading) return <DefaultAuthCTA />
  
  // In preview mode without Clerk, show default CTA
  if (!isClerkAvailable) return <DefaultAuthCTA />
  
  // Wait for auth to load
  if (!isLoaded) return <DefaultAuthCTA />

  if (isSignedIn && user) {
    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        {/* Simple avatar fallback */}
        <div
          className="w-8 h-8 rounded-full bg-[#C1121F] flex items-center justify-center text-xs font-bold text-white cursor-pointer select-none"
          title={user?.primaryEmailAddress?.emailAddress ?? 'Account'}
        >
          {(user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? 'A').toUpperCase()}
        </div>
      </>
    )
  }

  return <DefaultAuthCTA />
}

/**
 * Default mobile CTA buttons
 */
function DefaultMobileCTA({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <Link href="/sign-in" onClick={onNavigate}>
        <Button variant="outline" size="sm" className="w-full border-[#2B313A] text-[#A4ACB8]">
          Login
        </Button>
      </Link>
      <Link href="/sign-up" onClick={onNavigate}>
        <Button size="sm" className="w-full bg-[#C1121F] hover:bg-[#A30F1A]">
          Start Training
        </Button>
      </Link>
    </>
  )
}

export function MobileAuthCTA({ onNavigate }: { onNavigate: () => void }) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()
  const { isLoaded, isSignedIn } = useSafeAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render auth-specific content during SSR
  if (!mounted) return <DefaultMobileCTA onNavigate={onNavigate} />
  
  // Show default while checking Clerk availability
  if (isClerkLoading) return <DefaultMobileCTA onNavigate={onNavigate} />
  
  // In preview mode without Clerk, show default CTA
  if (!isClerkAvailable) return <DefaultMobileCTA onNavigate={onNavigate} />
  
  // Wait for auth to load
  if (!isLoaded) return <DefaultMobileCTA onNavigate={onNavigate} />

  if (isSignedIn) {
    return (
      <Link href="/dashboard" onClick={onNavigate}>
        <Button size="sm" className="w-full bg-[#C1121F] hover:bg-[#A30F1A]">
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      </Link>
    )
  }

  return <DefaultMobileCTA onNavigate={onNavigate} />
}
