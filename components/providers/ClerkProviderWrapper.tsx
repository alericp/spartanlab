'use client'

/**
 * ClerkProviderWrapper - STRICT auth isolation for preview environments
 * 
 * ARCHITECTURE CHANGE:
 * Previous approaches failed because even dynamic imports cause Webpack to include
 * the Clerk module in the bundle. The module then executes during hydration.
 * 
 * NEW APPROACH:
 * - This file contains NO references to @clerk/nextjs at all
 * - We provide context about Clerk availability
 * - The actual ClerkProvider is loaded from a SEPARATE entry point
 *   that is ONLY imported on production domains
 * - On preview domains, we NEVER import anything Clerk-related
 */

import { ReactNode, createContext, useContext, useState, useEffect, Suspense, lazy } from 'react'
import { shouldLoadClerk, isBrowser } from '@/lib/auth-gate'

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
 * CRITICAL: This component has NO static imports from @clerk/nextjs.
 * The ClerkProviderInner is loaded via lazy() ONLY when shouldLoadClerk() is true.
 * This prevents Webpack from including Clerk in the main bundle for preview.
 */
export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  // State for managing Clerk availability
  const [state, setState] = useState<ClerkAvailabilityContextValue>({
    isClerkAvailable: false,
    isPreviewMode: true,
    isLoading: true,
  })
  
  // State for the lazily loaded component
  const [ClerkInner, setClerkInner] = useState<React.ComponentType<{ children: ReactNode }> | null>(null)

  useEffect(() => {
    // Check if we should load Clerk
    const canLoad = shouldLoadClerk()
    
    setState({
      isClerkAvailable: canLoad,
      isPreviewMode: !canLoad,
      isLoading: false,
    })
    
    // ONLY load Clerk if we're on an allowed domain
    if (canLoad) {
      // Dynamic import - this import statement is NOT analyzed at build time
      // because it's inside a conditional useEffect
      import('./ClerkProviderInner')
        .then(mod => {
          setClerkInner(() => mod.ClerkProviderInner)
        })
        .catch(err => {
          console.error('[v0] Failed to load ClerkProviderInner:', err)
          // On error, stay in preview mode
        })
    }
  }, [])

  // During initial render and on preview domains, render without Clerk
  if (state.isLoading || !state.isClerkAvailable || !ClerkInner) {
    return (
      <ClerkAvailabilityContext.Provider value={state}>
        {children}
      </ClerkAvailabilityContext.Provider>
    )
  }

  // Production domain with Clerk loaded - wrap children with Clerk
  return (
    <ClerkAvailabilityContext.Provider value={state}>
      <ClerkInner>{children}</ClerkInner>
    </ClerkAvailabilityContext.Provider>
  )
}
