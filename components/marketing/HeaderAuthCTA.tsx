'use client'

/**
 * HeaderAuthCTA - Auth buttons for marketing header using Clerk
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs'

// ============================================================================
// NEUTRAL CTA (preview mode or before auth loads)
// ============================================================================

function NeutralCTA() {
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

// ============================================================================
// AUTHENTICATED CTA (production only, when signed in)
// ============================================================================

function AuthenticatedCTA() {
  return (
    <>
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
      </Link>
      <UserButton afterSignOutUrl="/" />
    </>
  )
}

// ============================================================================
// HEADER AUTH CTA
// ============================================================================

export function HeaderAuthCTA() {
  const [mounted, setMounted] = useState(false)
  const { isLoaded } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR or Loading: show neutral CTA
  if (!mounted || !isLoaded) {
    return <NeutralCTA />
  }

  // Use Clerk's native SignedIn/SignedOut components
  return (
    <>
      <SignedIn>
        <AuthenticatedCTA />
      </SignedIn>
      <SignedOut>
        <NeutralCTA />
      </SignedOut>
    </>
  )
}

// ============================================================================
// MOBILE AUTH CTA
// ============================================================================

function NeutralMobileCTA({ onNavigate }: { onNavigate: () => void }) {
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

function AuthenticatedMobileCTA({ onNavigate }: { onNavigate: () => void }) {
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
  const { isLoaded } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR or Loading: show neutral CTA
  if (!mounted || !isLoaded) {
    return <NeutralMobileCTA onNavigate={onNavigate} />
  }

  // Use Clerk's native SignedIn/SignedOut components
  return (
    <>
      <SignedIn>
        <AuthenticatedMobileCTA onNavigate={onNavigate} />
      </SignedIn>
      <SignedOut>
        <NeutralMobileCTA onNavigate={onNavigate} />
      </SignedOut>
    </>
  )
}
