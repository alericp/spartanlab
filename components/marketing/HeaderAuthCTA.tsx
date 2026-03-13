'use client'

import Link from 'next/link'
import { useAuth, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'

// Default logged-out buttons shown when Clerk is unavailable or loading
function DefaultAuthButtons() {
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
  // Wrap Clerk hooks in try-catch to handle domain mismatch errors gracefully
  let isLoaded = false
  let isSignedIn = false
  let user = null
  
  try {
    const auth = useAuth()
    const userData = useUser()
    isLoaded = auth.isLoaded
    isSignedIn = auth.isSignedIn ?? false
    user = userData.user
  } catch {
    // Clerk failed to initialize (e.g., domain mismatch in preview)
    // Fall back to showing logged-out state
    return <DefaultAuthButtons />
  }

  // Still loading Clerk - show placeholder
  if (!isLoaded) {
    return <DefaultAuthButtons />
  }

  if (isSignedIn) {
    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        {/* Simple avatar fallback since UserButton is not exported in @clerk/nextjs@7 */}
        <div
          className="w-8 h-8 rounded-full bg-[#C1121F] flex items-center justify-center text-xs font-bold text-white cursor-pointer select-none"
          title={user?.primaryEmailAddress?.emailAddress ?? 'Account'}
        >
          {(user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? 'A').toUpperCase()}
        </div>
      </>
    )
  }

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

// Default mobile buttons shown when Clerk is unavailable or loading
function DefaultMobileAuthButtons({ onNavigate }: { onNavigate?: () => void }) {
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
  // Wrap Clerk hooks in try-catch to handle domain mismatch errors gracefully
  let isLoaded = false
  let isSignedIn = false
  
  try {
    const auth = useAuth()
    isLoaded = auth.isLoaded
    isSignedIn = auth.isSignedIn ?? false
  } catch {
    // Clerk failed to initialize (e.g., domain mismatch in preview)
    return <DefaultMobileAuthButtons onNavigate={onNavigate} />
  }

  // Still loading Clerk
  if (!isLoaded) {
    return <DefaultMobileAuthButtons onNavigate={onNavigate} />
  }

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
