'use client'

import { ReactNode, useEffect, useState, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'

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
 * This check runs at module load time to prevent Clerk from initializing
 */
function getIsV0Preview(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check for v0 environment indicators
    // The hostname check won't work server-side, so we use env vars
    return process.env.VERCEL_ENV !== 'production' || 
           process.env.NEXT_PUBLIC_VERCEL_URL?.includes('vusercontent.net') ||
           process.env.NEXT_PUBLIC_VERCEL_URL?.includes('v0.dev') ||
           !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')
  }
  const hostname = window.location.hostname
  return hostname.includes('vusercontent.net') || 
         hostname.includes('v0.dev') || 
         hostname === 'localhost'
}

/**
 * Check if Clerk should be enabled - must be checked before importing Clerk
 */
function shouldEnableClerk(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) return false
  
  const isProductionKey = publishableKey.startsWith('pk_live_')
  const isPreview = getIsV0Preview()
  
  // Don't use production keys in v0 preview
  if (isPreview && isProductionKey) {
    return false
  }
  
  return true
}

// Determine at module load time if we should use Clerk
const CLERK_ENABLED = shouldEnableClerk()

interface ClerkProviderWrapperProps {
  children: ReactNode
}

// Only create the Clerk wrapper component if Clerk is enabled
// This prevents the @clerk/nextjs module from loading at all in preview
const ClerkProviderLazy = CLERK_ENABLED 
  ? dynamic(
      () => import('@clerk/nextjs').then(mod => {
        const { ClerkProvider } = mod
        return function ClerkWrapper({ children }: { children: ReactNode }) {
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
      }),
      { ssr: false }
    )
  : null

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  // If Clerk is disabled (v0 preview with production keys), just render children
  if (!CLERK_ENABLED || !ClerkProviderLazy) {
    return <>{children}</>
  }

  // Normal flow: use dynamically loaded ClerkProvider
  return <ClerkProviderLazy>{children}</ClerkProviderLazy>
}
