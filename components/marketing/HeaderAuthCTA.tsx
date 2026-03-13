'use client'

/**
 * HeaderAuthCTA - Preview-safe auth buttons for marketing header
 * 
 * On preview: Always shows login/signup buttons
 * On production: Shows dashboard link when signed in
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { SignedIn, SignedOut } from '@/components/auth/ClerkComponents'

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

/**
 * Signed-in state CTA
 */
function SignedInCTA() {
  return (
    <>
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
      </Link>
      <Link href="/dashboard">
        <div className="w-8 h-8 rounded-full bg-[#C1121F] flex items-center justify-center text-xs font-bold text-white cursor-pointer select-none hover:bg-[#A30F1A] transition-colors">
          U
        </div>
      </Link>
    </>
  )
}

export function HeaderAuthCTA() {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render auth-specific content during SSR
  if (!mounted) return <DefaultAuthCTA />
  
  // Show default while checking Clerk availability
  if (isClerkLoading) return <DefaultAuthCTA />
  
  // In preview mode without Clerk, show default CTA
  if (!isClerkAvailable) return <DefaultAuthCTA />

  // Production: use SignedIn/SignedOut components
  return (
    <>
      <SignedIn>
        <SignedInCTA />
      </SignedIn>
      <SignedOut>
        <DefaultAuthCTA />
      </SignedOut>
    </>
  )
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

/**
 * Signed-in mobile CTA
 */
function SignedInMobileCTA({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Link href="/dashboard" onClick={onNavigate}>
      <Button size="sm" className="w-full bg-[#C1121F] hover:bg-[#A30F1A]">
        <LayoutDashboard className="w-4 h-4 mr-2" />
        Go to Dashboard
      </Button>
    </Link>
  )
}

export function MobileAuthCTA({ onNavigate }: { onNavigate: () => void }) {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading: isClerkLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render auth-specific content during SSR
  if (!mounted) return <DefaultMobileCTA onNavigate={onNavigate} />
  
  // Show default while checking Clerk availability
  if (isClerkLoading) return <DefaultMobileCTA onNavigate={onNavigate} />
  
  // In preview mode without Clerk, show default CTA
  if (!isClerkAvailable) return <DefaultMobileCTA onNavigate={onNavigate} />

  // Production: use SignedIn/SignedOut components
  return (
    <>
      <SignedIn>
        <SignedInMobileCTA onNavigate={onNavigate} />
      </SignedIn>
      <SignedOut>
        <DefaultMobileCTA onNavigate={onNavigate} />
      </SignedOut>
    </>
  )
}
