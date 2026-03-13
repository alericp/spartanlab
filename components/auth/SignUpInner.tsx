'use client'

/**
 * SignUpInner - Production-only SignUp component
 * 
 * IMPORTANT: This file is ONLY imported dynamically from the sign-up page
 * when the app is running on a production domain.
 */

import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'

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
    otpCodeFieldInput: 'bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]',
  },
}

export function SignUpInner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0F1115] px-4">
      <SignUp 
        appearance={clerkAppearance}
        fallbackRedirectUrl="/onboarding"
        signInUrl="/sign-in"
      />
      <p className="text-xs text-[#6B7280] text-center max-w-xs leading-relaxed">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors underline underline-offset-2">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
