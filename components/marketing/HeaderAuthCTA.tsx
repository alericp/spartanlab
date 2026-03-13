'use client'

/**
 * HeaderAuthCTA - Preview-safe auth buttons for marketing header
 * 
 * Architecture:
 * - Preview mode: Always shows login/signup buttons (neutral CTA)
 * - Production mode: Uses SignedIn/SignedOut for real auth state
 * 
 * NO POLLING. Simple conditional rendering.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { SignedIn, SignedOut, UserButton } from '@/components/auth/ClerkComponents'

// ============================================================================
// NEUTRAL CTA (shown in preview or before auth loads)
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
// SIGNED-IN CTA (production only)
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
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR: show neutral CTA
  if (!mounted) return <NeutralCTA />
  
  // Loading: show neutral CTA
  if (isLoading) return <NeutralCTA />
  
  // Preview mode: show neutral CTA (no auth available)
  if (!isClerkAvailable) return <NeutralCTA />

  // Production mode: use real auth components
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
  const { isClerkAvailable, isLoading } = useClerkAvailability()

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR or Loading or Preview: show neutral CTA
  if (!mounted || isLoading || !isClerkAvailable) {
    return <NeutralMobileCTA onNavigate={onNavigate} />
  }

  // Production mode: use real auth components
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
