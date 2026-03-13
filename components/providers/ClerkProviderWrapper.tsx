'use client'

/**
 * ClerkProviderWrapper - Strict preview isolation for Clerk
 * 
 * Architecture:
 * 1. Check domain SYNCHRONOUSLY before any effect runs
 * 2. If not on production domain, never attempt to load Clerk
 * 3. Use runtime import technique to hide module from bundler
 * 4. Provide context for child components to check auth availability
 */

import { ReactNode, createContext, useContext, useState, useEffect, useRef } from 'react'
import { shouldInitializeClerk, getAuthMode, type AuthMode } from '@/lib/auth-environment'

// ============================================================================
// CONTEXT
// ============================================================================

interface ClerkAvailabilityContextValue {
  /**
   * True only when Clerk is loaded and ready on a production domain
   */
  isClerkAvailable: boolean
  /**
   * True when we're in preview mode (non-production domain with prod keys)
   */
  isPreviewMode: boolean
  /**
   * True while determining auth availability
   */
  isLoading: boolean
  /**
   * Current auth mode
   */
  authMode: AuthMode
}

const defaultContextValue: ClerkAvailabilityContextValue = {
  isClerkAvailable: false,
  isPreviewMode: true,
  isLoading: true,
  authMode: 'preview',
}

const ClerkAvailabilityContext = createContext<ClerkAvailabilityContextValue>(defaultContextValue)

/**
 * Hook to check Clerk availability status
 */
export function useClerkAvailability() {
  return useContext(ClerkAvailabilityContext)
}

// ============================================================================
// RUNTIME CLERK LOADER
// ============================================================================

/**
 * Load Clerk module at runtime.
 * Uses string concatenation to hide from Webpack's static analysis.
 */
async function loadClerkRuntime(): Promise<{
  ClerkProvider: React.ComponentType<{
    children: ReactNode
    appearance?: Record<string, unknown>
    signInUrl?: string
    signUpUrl?: string
    signInFallbackRedirectUrl?: string
    signUpFallbackRedirectUrl?: string
  }>
} | null> {
  try {
    // Build module name at runtime - Webpack can't trace this
    const moduleName = ['@', 'clerk', '/', 'nextjs'].join('')
    // Use Function constructor for truly dynamic import
    const loader = new Function('m', 'return import(m)')
    return await loader(moduleName)
  } catch (error) {
    console.error('[ClerkProviderWrapper] Failed to load Clerk:', error)
    return null
  }
}

// ============================================================================
// CLERK APPEARANCE
// ============================================================================

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

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface Props {
  children: ReactNode
}

export function ClerkProviderWrapper({ children }: Props) {
  // CRITICAL: Check if we should initialize Clerk SYNCHRONOUSLY on first render
  // This happens before any useEffect, so we never even attempt to load Clerk on preview
  const shouldInit = useRef<boolean>(false)
  const authMode = useRef<AuthMode>('preview')
  
  // These refs are set synchronously during render (not in useEffect)
  if (typeof window !== 'undefined') {
    shouldInit.current = shouldInitializeClerk()
    authMode.current = getAuthMode()
  }
  
  const [state, setState] = useState<ClerkAvailabilityContextValue>(() => ({
    isClerkAvailable: false,
    isPreviewMode: !shouldInit.current,
    isLoading: shouldInit.current, // Only loading if we need to load Clerk
    authMode: authMode.current,
  }))
  
  const [ClerkProvider, setClerkProvider] = useState<React.ComponentType<{
    children: ReactNode
    appearance?: Record<string, unknown>
    signInUrl?: string
    signUpUrl?: string
    signInFallbackRedirectUrl?: string
    signUpFallbackRedirectUrl?: string
  }> | null>(null)

  useEffect(() => {
    // CRITICAL: Don't attempt to load Clerk if we shouldn't initialize it
    if (!shouldInit.current) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    let cancelled = false

    loadClerkRuntime().then(mod => {
      if (cancelled) return
      
      if (mod?.ClerkProvider) {
        setClerkProvider(() => mod.ClerkProvider)
        setState({
          isClerkAvailable: true,
          isPreviewMode: false,
          isLoading: false,
          authMode: 'production',
        })
      } else {
        setState({
          isClerkAvailable: false,
          isPreviewMode: true,
          isLoading: false,
          authMode: 'preview',
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Preview mode - render children without Clerk
  if (!shouldInit.current || !ClerkProvider) {
    return (
      <ClerkAvailabilityContext.Provider value={state}>
        {children}
      </ClerkAvailabilityContext.Provider>
    )
  }

  // Production mode with Clerk loaded
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
