'use client'

import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'

/**
 * Preview fallback when Clerk isn't available
 */
function PreviewFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] p-4">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-[#A4ACB8]" />
        </div>
        <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">
          Preview Mode
        </h2>
        <p className="text-sm text-[#A4ACB8] mb-6">
          Sign in is available on the production domain.
          In preview, you can explore the app without authentication.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="border-[#2B313A] text-[#A4ACB8] gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
              Explore Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
        <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  // Show preview fallback if Clerk isn't available
  if (!isClerkAvailable) {
    return <PreviewFallback />
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <SignIn 
        appearance={{
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
        }}
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  )
}
