// AUTH_TRUTH_PASS_V5
'use client'

/**
 * HeaderAuthCTA - Static auth buttons for marketing header
 * No Clerk hooks or components - static links only
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'

// ============================================================================
// HEADER AUTH CTA (static only)
// ============================================================================

export function HeaderAuthCTA() {
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
// MOBILE AUTH CTA (static only)
// ============================================================================

export function MobileAuthCTA({ onNavigate }: { onNavigate: () => void }) {
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
