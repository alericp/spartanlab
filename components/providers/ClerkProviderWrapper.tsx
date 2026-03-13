'use client'

/**
 * ClerkProviderWrapper - STRICT auth isolation for preview environments
 * 
 * CRITICAL ARCHITECTURE:
 * This wrapper uses a SYNCHRONOUS check at render time to determine
 * if Clerk should load. This is essential because:
 * 
 * 1. useEffect-based checks run AFTER initial render
 * 2. Even lazy components get bundled if they're in the render path
 * 3. We need to check the domain BEFORE React considers the Clerk path
 * 
 * The solution is to check synchronously using window.location (client)
 * and only conditionally include the lazy import in the render tree.
 */

import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { shouldLoadClerk, isAllowedAuthDomain, isBrowser } from '@/lib/auth-gate'

// Context to share Clerk availability state with child components
interface ClerkAvailabilityContextValue {
  isClerkAvailable: boolean
  isPreviewMode: boolean
  isLoading: boolean
}

const ClerkAvailabilityContext = createContext<ClerkAvailabilityContextValue>({
  isClerkAvailable: false,
  isPreviewMode: true,
  isLoading: true,
})

export function useClerkAvailability() {
  return useContext(ClerkAvailabilityContext)
}

interface ClerkProviderWrapperProps {
  children: ReactNode
}

/**
 * Wrapper that COMPLETELY BLOCKS Clerk on non-production domains.
 * 
 * The key insight: we do a SYNCHRONOUS check during render to determine
 * if we should even consider loading Clerk. This prevents the lazy import
 * from being triggered on preview domains.
 */
export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  // SYNCHRONOUS check - runs during render, not in useEffect
  const canLoadClerkSync = isBrowser() ? shouldLoadClerk() : false
  
  const [state, setState] = useState<ClerkAvailabilityContextValue>(() => ({
    isClerkAvailable: canLoadClerkSync,
    isPreviewMode: !canLoadClerkSync,
    isLoading: !isBrowser(), // Only loading if we haven't checked yet (SSR)
  }))

  // Update state after mount for SSR hydration
  useEffect(() => {
    const canLoad = shouldLoadClerk()
    setState({
      isClerkAvailable: canLoad,
      isPreviewMode: !canLoad,
      isLoading: false,
    })
  }, [])

  // HARD GATE: On preview/non-production domains, render WITHOUT ANY Clerk code
  if (!state.isClerkAvailable) {
    return (
      <ClerkAvailabilityContext.Provider value={state}>
        {children}
      </ClerkAvailabilityContext.Provider>
    )
  }

  // Production domain: render with ClerkProviderClient
  // This is a separate component to isolate the Clerk import
  return (
    <ClerkAvailabilityContext.Provider value={state}>
      <ClerkProviderClient>{children}</ClerkProviderClient>
    </ClerkAvailabilityContext.Provider>
  )
}

/**
 * Client component that loads Clerk - ONLY rendered on production domains
 * This component is in the same file but separated to make the code path clear.
 * The Clerk import only happens when this component is rendered.
 */
function ClerkProviderClient({ children }: { children: ReactNode }) {
  const [ClerkProviderComponent, setClerkProviderComponent] = useState<React.ComponentType<{
    children: ReactNode
    appearance: object
    signInUrl: string
    signUpUrl: string
    signInFallbackRedirectUrl: string
    signUpFallbackRedirectUrl: string
  }> | null>(null)
  
  useEffect(() => {
    // This import only executes on production domains
    // because this component is only rendered there
    import('@clerk/nextjs').then(mod => {
      setClerkProviderComponent(() => mod.ClerkProvider)
    }).catch(() => {
      // If import fails, don't crash - children will render without auth
    })
  }, [])
  
  // While loading Clerk, render children without it
  if (!ClerkProviderComponent) {
    return <>{children}</>
  }
  
  // Clerk loaded - wrap children with provider
  return (
    <ClerkProviderComponent
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {children}
    </ClerkProviderComponent>
  )
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
