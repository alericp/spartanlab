'use client'

// AppProviders - Safe provider composition for dual-mode architecture
// Wraps the app with necessary providers based on available services

import { ReactNode, Suspense, useState, useEffect } from 'react'
import { isPreviewMode, isAuthEnabled } from '@/lib/app-mode'
import { PWAProvider } from './PWAProvider'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * AppProviders wraps the application with necessary context providers
 * 
 * In preview mode:
 * - No external auth provider
 * - All data flows through localStorage
 * - No database operations
 * 
 * In production mode:
 * - Optionally wraps with ClerkProvider (if Clerk keys available)
 * - Database client available for repositories
 * - Real user authentication
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Avoid hydration issues - render minimal on server
  if (!mounted) {
    return <>{children}</>
  }
  
  // Preview mode: minimal providers
  if (isPreviewMode()) {
    return (
      <PWAProvider>
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </PWAProvider>
    )
  }

  // Production mode: try to enable Clerk
  if (isAuthEnabled()) {
    return (
      <PWAProvider>
        <ClerkProviderWrapper>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </ClerkProviderWrapper>
      </PWAProvider>
    )
  }

  // Production env vars exist but Clerk not configured
  return (
    <PWAProvider>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </PWAProvider>
  )
}

/**
 * Wrapper component that safely loads Clerk
 */
function ClerkProviderWrapper({ children }: { children: ReactNode }) {
  // Dynamically require Clerk to avoid breaking preview mode
  try {
    // This will fail if Clerk is not installed, but that's OK
    // The app will still work in preview mode
    const { ClerkProvider } = require('@clerk/nextjs')

    if (!ClerkProvider) {
      return <>{children}</>
    }

    return (
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: 'dark',
          elements: {
            card: 'bg-[#1A1A1A] border border-[#333]',
            headerTitle: 'text-white',
            headerSubtitle: 'text-[#999]',
            socialButtonsBlockButton: 'bg-[#E63946] hover:bg-[#D62828] text-white',
            footerActionLink: 'text-[#E63946] hover:text-[#D62828]',
          },
        }}
      >
        {children}
      </ClerkProvider>
    )
  } catch (error) {
    // Clerk not available, render without it
    console.warn('[SpartanLab] Clerk provider not available:', error instanceof Error ? error.message : 'Unknown')
    return <>{children}</>
  }
}

/**
 * Safe wrapper that only renders children if auth is available
 * Useful for auth-protected UI elements
 */
export function AuthRequired({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  // In preview mode, always render children (mock auth)
  if (isPreviewMode()) {
    return <>{children}</>
  }

  // In production, check if auth is configured
  if (!isAuthEnabled()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Wrapper that renders different content based on mode
 */
export function ModeAware({
  preview,
  production,
}: {
  preview: ReactNode
  production: ReactNode
}) {
  if (isPreviewMode()) {
    return <>{preview}</>
  }

  return <>{production}</>
}

