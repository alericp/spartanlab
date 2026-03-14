// AUTH_PROD_UNBLOCK_V1
'use client'

/**
 * HeaderAuthCTA - Auth-aware buttons for marketing header
 * Uses Clerk useAuth to show appropriate sign in/out state
 */

import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogOut } from 'lucide-react'

// ============================================================================
// HEADER AUTH CTA
// ============================================================================

export function HeaderAuthCTA() {
  const { userId, signOut, isLoaded } = useAuth()

  if (!isLoaded) {
    // Show placeholder while loading to prevent layout shift
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-16 bg-[#1A1F26] rounded animate-pulse" />
        <div className="h-9 w-28 bg-[#1A1F26] rounded animate-pulse" />
      </div>
    )
  }

  if (userId) {
    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <Button 
          size="sm" 
          variant="outline"
          className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF]"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
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

// ============================================================================
// MOBILE AUTH CTA
// ============================================================================

export function MobileAuthCTA({ onNavigate }: { onNavigate: () => void }) {
  const { userId, signOut, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <div className="h-9 w-full bg-[#1A1F26] rounded animate-pulse" />
        <div className="h-9 w-full bg-[#1A1F26] rounded animate-pulse" />
      </div>
    )
  }

  if (userId) {
    return (
      <>
        <Link href="/dashboard" onClick={onNavigate}>
          <Button variant="outline" size="sm" className="w-full border-[#2B313A] text-[#A4ACB8]">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <Button 
          size="sm" 
          variant="outline"
          className="w-full border-[#2B313A] text-[#A4ACB8]"
          onClick={() => {
            signOut()
            onNavigate()
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </>
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
