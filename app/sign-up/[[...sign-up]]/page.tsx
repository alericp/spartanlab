'use client'

/**
 * Sign-Up Page
 * 
 * ARCHITECTURE:
 * - Preview mode: Static informational fallback
 * - Production mode: Uses Clerk SignUp from provider context
 * 
 * CRITICAL: Does NOT import @clerk/nextjs directly.
 * Uses ClerkProviderWrapper context as single source of truth.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { useEffect, useState } from 'react'

// ============================================================================
// CLERK APPEARANCE (page-specific overrides)
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
// PREVIEW FALLBACK
// ============================================================================

function PreviewFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] p-4">
      <div className="max-w-md w-full">
        <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#2B313A] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-[#A4ACB8]" />
          </div>
          <h1 className="text-xl font-semibold text-[#E6E9EF] mb-2">
            Preview Mode
          </h1>
          <p className="text-sm text-[#A4ACB8] mb-6 leading-relaxed">
            Account creation is available on the production domain. 
            You can explore the app without signing up.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/onboarding">
              <Button className="w-full bg-[#C1121F] hover:bg-[#A30F1A]">
                Start Onboarding
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-[#2B313A] text-[#A4ACB8]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-[#2B313A]">
            <a 
              href="https://spartanlab.app/sign-up"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              Create account on production
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Auth Diagnostic Box for debugging
function AuthDiagnosticBox({ isClerkAvailable, isLoading }: { isClerkAvailable: boolean, isLoading: boolean }) {
  const [info, setInfo] = useState<{hostname: string, pathname: string} | null>(null)
  
  useEffect(() => {
    setInfo({
      hostname: window.location.hostname,
      pathname: window.location.pathname,
    })
  }, [])
  
  if (!info) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#1A1D23] border border-[#2A2F38] rounded-lg p-3 text-xs font-mono max-w-xs shadow-lg">
      <div className="text-[#6B7280] mb-1">Auth Diagnostic</div>
      <div className="space-y-0.5 text-[#A4ACB8]">
        <div>host: {info.hostname}</div>
        <div>path: {info.pathname}</div>
        <div>clerkAvailable: {String(isClerkAvailable)}</div>
        <div>loading: {String(isLoading)}</div>
      </div>
    </div>
  )
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading, components } = useClerkAvailability()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // SSR - show loading
  if (!mounted) return <LoadingState />
  
  // Still determining auth mode
  if (isLoading) return <LoadingState />
  
  // Preview mode or no Clerk available - show fallback
  if (!isClerkAvailable) return <PreviewFallback />
  
  // Production mode - get SignUp from provider context
  const SignUp = components.SignUp
  
  // SignUp component not available
  if (!SignUp) return <PreviewFallback />
  
  // Render Clerk SignUp
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <SignUp
        appearance={clerkAppearance}
        fallbackRedirectUrl="/onboarding"
        signInUrl="/sign-in"
      />
      <AuthDiagnosticBox isClerkAvailable={isClerkAvailable} isLoading={isLoading} />
    </div>
  )
}
