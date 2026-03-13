'use client'

/**
 * ClerkProviderWrapper - Complete preview isolation using runtime import
 * 
 * THE PROBLEM:
 * Webpack statically analyzes import() statements and bundles them.
 * Even dynamic imports like import('@clerk/nextjs') get pre-bundled.
 * When the chunk loads, Clerk's module-level code runs and checks the domain.
 * 
 * THE SOLUTION:
 * We use a technique to hide the import from Webpack's static analysis:
 * - Build the module name at runtime using string concatenation
 * - Use a wrapper function that Webpack can't trace
 * This prevents Webpack from knowing what module to bundle.
 * 
 * The module is loaded via a truly dynamic runtime import.
 */

import { ReactNode, createContext, useContext, useState, useEffect, useRef } from 'react'

// Context for auth availability
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

// Allowed production domains
const ALLOWED_DOMAINS = ['spartanlab.app', 'www.spartanlab.app']

/**
 * SYNCHRONOUS domain check
 */
function isAllowedDomain(): boolean {
  if (typeof window === 'undefined') return false
  return ALLOWED_DOMAINS.includes(window.location.hostname)
}

/**
 * Check if we should attempt to use Clerk
 */
function shouldAttemptClerk(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!key) return false
  if (key.startsWith('pk_test_')) return true
  return isAllowedDomain()
}

/**
 * Runtime module loader that hides the module name from Webpack.
 * Uses string building to construct '@clerk/nextjs' at runtime.
 */
async function loadClerkModule() {
  // Build the module name at runtime - Webpack can't statically analyze this
  const parts = ['@', 'clerk', '/', 'nextjs']
  const moduleName = parts.join('')
  
  // Use Function constructor to create a truly dynamic import
  // This is the only way to prevent Webpack from bundling the module
  const dynamicImport = new Function('moduleName', 'return import(moduleName)')
  return dynamicImport(moduleName)
}

interface Props {
  children: ReactNode
}

export function ClerkProviderWrapper({ children }: Props) {
  // Check domain synchronously on first render
  const canUseClerk = useRef(shouldAttemptClerk())
  
  const [state, setState] = useState<ClerkAvailabilityContextValue>(() => ({
    isClerkAvailable: canUseClerk.current,
    isPreviewMode: !canUseClerk.current,
    isLoading: canUseClerk.current,
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
    // Only load Clerk on allowed domains
    if (!canUseClerk.current) {
      return
    }

    // Load Clerk using runtime dynamic import
    loadClerkModule()
      .then((mod: { ClerkProvider: typeof ClerkProvider }) => {
        setClerkProvider(() => mod.ClerkProvider)
        setState(prev => ({ ...prev, isLoading: false }))
      })
      .catch((err: Error) => {
        console.error('[v0] Failed to load Clerk:', err)
        setState({
          isClerkAvailable: false,
          isPreviewMode: true,
          isLoading: false,
        })
      })
  }, [])

  // Preview mode - render children without Clerk
  if (!canUseClerk.current) {
    return (
      <ClerkAvailabilityContext.Provider value={state}>
        {children}
      </ClerkAvailabilityContext.Provider>
    )
  }

  // Production mode but Clerk not loaded yet
  if (!ClerkProvider) {
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
        appearance={{
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
        }}
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
