'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode, useEffect, useState, createContext, useContext } from 'react'
import { isAllowedClerkOrigin, shouldRenderPreviewFallback, getHostname } from '@/lib/environment-guard'

// Context to share Clerk availability state with child components
interface ClerkAvailabilityContextValue {
  isClerkAvailable: boolean
  isPreviewMode: boolean
  isLoading: boolean
}

const ClerkAvailabilityContext = createContext<ClerkAvailabilityContextValue>({
  isClerkAvailable: false,
  isPreviewMode: false,
  isLoading: true,
})

export function useClerkAvailability() {
  return useContext(ClerkAvailabilityContext)
}

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
 * 
 * Uses the centralized environment-guard utility for domain detection.
 * Provides ClerkAvailabilityContext so child components know auth state.
 */
export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const [state, setState] = useState<ClerkAvailabilityContextValue>({
    isClerkAvailable: false,
    isPreviewMode: false,
    isLoading: true,
  })

  useEffect(() => {
    // Use centralized environment detection
    const canUseClerk = isAllowedClerkOrigin()
    const needsPreviewFallback = shouldRenderPreviewFallback()
    
    setState({
      isClerkAvailable: canUseClerk,
      isPreviewMode: needsPreviewFallback,
      isLoading: false,
    })
  }, [])

  // During loading, render children without Clerk to avoid flash
  if (state.isLoading) {
    return (
      <ClerkAvailabilityContext.Provider value={state}>
        {children}
      </ClerkAvailabilityContext.Provider>
    )
  }

  // Skip Clerk in preview mode (production keys on non-production domain)
  if (!state.isClerkAvailable) {
    return (
      <ClerkAvailabilityContext.Provider value={state}>
        {children}
      </ClerkAvailabilityContext.Provider>
    )
  }

  // Normal flow: use ClerkProvider with error boundary
  return (
    <ClerkAvailabilityContext.Provider value={state}>
      <ClerkProvider
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/onboarding"
      >
        {children}
      </ClerkProvider>
    </ClerkAvailabilityContext.Provider>
  )
}
