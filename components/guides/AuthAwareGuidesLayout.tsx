'use client'

import { useAuth } from '@clerk/nextjs'
import { Navigation } from '@/components/shared/Navigation'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

interface AuthAwareGuidesLayoutProps {
  children: React.ReactNode
}

/**
 * Auth-aware layout for guides pages.
 * 
 * - Authenticated users: See the full app Navigation header (so guides feel like part of the app)
 * - Public users: See the marketing header/footer (for SEO and public browsing)
 * 
 * This preserves SEO value while keeping authenticated users in the app shell.
 */
export function AuthAwareGuidesLayout({ children }: AuthAwareGuidesLayoutProps) {
  const { isSignedIn, isLoaded } = useAuth()

  // Loading state - show minimal shell
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col">
        <div className="h-16 border-b border-[#2B313A] bg-[#0F1115]" />
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  // Authenticated: Show app navigation (no marketing footer - feels like app)
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col">
        <Navigation />
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  // Public: Show marketing header and footer
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
