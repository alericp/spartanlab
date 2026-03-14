'use client'

/**
 * Sign-Up Page - Stable render-only page
 * 
 * ARCHITECTURE:
 * - Uses Clerk SignUp component directly for stable rendering
 * - No manual redirects - Clerk handles post-auth navigation
 * - No remount logic - single stable render path
 * - Middleware handles route protection
 */

import { SignUp } from '@clerk/nextjs'
import { AUTH_BUILD_STAMP } from '@/lib/build-stamp'

// ============================================================================
// CLERK APPEARANCE
// ============================================================================

const clerkAppearance = {
  elements: {
    rootBox: 'mx-auto',
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
    formFieldInputShowPasswordButton: 'text-[#A4ACB8]',
  },
}

// ============================================================================
// PAGE COMPONENT - Stable render-only, no redirects
// ============================================================================

export default function SignUpPage() {
  console.log(`[SpartanLab] Build: ${AUTH_BUILD_STAMP} (sign-up-render)`)
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <SignUp
        appearance={clerkAppearance}
        fallbackRedirectUrl="/onboarding"
        signInUrl="/sign-in"
      />
    </div>
  )
}
