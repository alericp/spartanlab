'use client'

// AppProviders - Safe provider composition for dual-mode architecture
// Wraps the app with necessary providers based on available services

import { ReactNode, Suspense } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { isPreviewMode, isAuthEnabled } from '@/lib/app-mode'
import { PWAProvider } from './PWAProvider'

interface AppProvidersProps {
  children: ReactNode
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

/**
 * AppProviders wraps the application with necessary context providers
 * 
 * In preview mode:
 * - No external auth provider needed
 * - All data flows through localStorage
 * 
 * In production mode:
 * - Wraps with ClerkProvider for authentication
 * - Real user sessions
 */
export function AppProviders({ children }: AppProvidersProps) {
  // Preview mode: minimal providers, no Clerk
  if (isPreviewMode()) {
    return (
      <PWAProvider>
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </PWAProvider>
    )
  }

  // Production mode: use Clerk for authentication
  if (isAuthEnabled()) {
    return (
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/onboarding"
      >
        <PWAProvider>
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </PWAProvider>
      </ClerkProvider>
    )
  }

  // Fallback: no auth provider
  return (
    <PWAProvider>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </PWAProvider>
  )
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
