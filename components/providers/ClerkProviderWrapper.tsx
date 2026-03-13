'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode, useEffect, useState } from 'react'

// Clerk appearance configuration matching SpartanLab theme
const clerkAppearance = {
  elements: {
    rootBox: 'font-sans',
    card: 'bg-[#1A1F26] border border-[#2B313A] shadow-xl',
    headerTitle: 'text-[#E6E9EF]',
    headerSubtitle: 'text-[#A4ACB8]',
    socialButtonsBlockButton: 'bg-[#2B313A] border-[#3A3A3A] text-[#E6E9EF] hover:bg-[#3A3A3A]',
    socialButtonsBlockButtonText: 'text-[#E6E9EF]',
    dividerLine: 'bg-[#2B313A]',
    dividerText: 'text-[#A4ACB8]',
    formFieldLabel: 'text-[#A4ACB8]',
    formFieldInput: 'bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] focus:border-[#C1121F] focus:ring-[#C1121F]/20',
    formButtonPrimary: 'bg-[#C1121F] hover:bg-[#A30F1A] text-white',
    footerActionLink: 'text-[#C1121F] hover:text-[#A30F1A]',
    identityPreviewText: 'text-[#E6E9EF]',
    identityPreviewEditButton: 'text-[#C1121F]',
    userButtonPopoverCard: 'bg-[#1A1F26] border border-[#2B313A]',
    userButtonPopoverActionButton: 'text-[#E6E9EF] hover:bg-[#2B313A]',
    userButtonPopoverActionButtonText: 'text-[#E6E9EF]',
    userButtonPopoverActionButtonIcon: 'text-[#A4ACB8]',
    userButtonPopoverFooter: 'hidden',
    userPreviewMainIdentifier: 'text-[#E6E9EF]',
    userPreviewSecondaryIdentifier: 'text-[#A4ACB8]',
  },
}

/**
 * Check if we're in v0 preview environment where production Clerk keys won't work
 */
function isV0Preview(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname.includes('vusercontent.net') || hostname.includes('v0.dev')
}

/**
 * Check if Clerk should be enabled
 * Skip Clerk in v0 preview when using production keys
 */
function shouldEnableClerk(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) return false
  
  // Production keys start with pk_live_, test keys with pk_test_
  const isProductionKey = publishableKey.startsWith('pk_live_')
  
  // Don't use production keys in v0 preview
  if (isV0Preview() && isProductionKey) {
    return false
  }
  
  return true
}

interface ClerkProviderWrapperProps {
  children: ReactNode
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [clerkEnabled, setClerkEnabled] = useState(true)

  useEffect(() => {
    setMounted(true)
    setClerkEnabled(shouldEnableClerk())
  }, [])

  // During SSR and initial mount, render without Clerk to avoid hydration issues
  // Then on client, conditionally wrap with ClerkProvider
  if (!mounted) {
    // SSR: render children directly to avoid Clerk loading
    return <>{children}</>
  }

  // Client-side: skip Clerk in v0 preview with production keys
  if (!clerkEnabled) {
    return <>{children}</>
  }

  // Normal flow: use ClerkProvider
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {children}
    </ClerkProvider>
  )
}
