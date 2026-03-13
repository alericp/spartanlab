'use client'

import Link from 'next/link'
import { useAuth, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'

export function HeaderAuthCTA() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  // Still loading Clerk - show placeholder
  if (!isLoaded) {
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

export function MobileAuthCTA({ onNavigate }: { onNavigate: () => void }) {
  const { isLoaded, isSignedIn } = useAuth()

  // Still loading Clerk
  if (!isLoaded) {
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
