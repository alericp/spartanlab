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

interface ClerkProviderWrapperProps {
  children: ReactNode
}

/**
 * Wrapper that conditionally enables Clerk based on environment.
 * In v0 preview with production keys, Clerk is disabled to avoid domain errors.
 */
export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const [shouldUseClerk, setShouldUseClerk] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if we're in v0 preview environment
    const hostname = window.location.hostname
    const isV0Preview = hostname.includes('vusercontent.net') || 
                        hostname.includes('v0.dev') || 
                        hostname === 'localhost'
    
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    const hasKey = !!publishableKey
    const isProductionKey = publishableKey?.startsWith('pk_live_') ?? false
    
    // Enable Clerk only if:
    // 1. We have a key AND
    // 2. Either we're not in preview OR we're using test keys
    const enableClerk = hasKey && (!isV0Preview || !isProductionKey)
    
    setShouldUseClerk(enableClerk)
    setIsReady(true)
  }, [])

  // Show nothing during initial check to avoid hydration issues
  if (!isReady) {
    return <>{children}</>
  }

  // Skip Clerk in v0 preview with production keys
  if (!shouldUseClerk) {
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
