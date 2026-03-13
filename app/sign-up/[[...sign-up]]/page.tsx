'use client'

/**
 * Sign-Up Page - Preview-safe implementation
 * 
 * NO @clerk/nextjs imports in this file.
 * The SignUpInner component is loaded dynamically only on production.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useClerkAvailability } from '@/components/providers/ClerkProviderWrapper'
import { useEffect, useState } from 'react'

/**
 * Preview fallback - shown on non-production domains
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
          Account creation is available on the production domain.
          In preview, you can explore the app without signing up.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="border-[#2B313A] text-[#A4ACB8] gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
              Start Onboarding
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading state
 */
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115]">
      <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false)
  const { isClerkAvailable, isLoading } = useClerkAvailability()
  const [SignUpComponent, setSignUpComponent] = useState<React.ComponentType | null>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Load SignUpInner only on production
  useEffect(() => {
    if (mounted && !isLoading && isClerkAvailable) {
      import('@/components/auth/SignUpInner')
        .then(mod => setSignUpComponent(() => mod.SignUpInner))
        .catch(() => {})
    }
  }, [mounted, isLoading, isClerkAvailable])
  
  // SSR
  if (!mounted) return <LoadingState />
  
  // Checking environment
  if (isLoading) return <LoadingState />
  
  // Preview: show fallback
  if (!isClerkAvailable) return <PreviewFallback />
  
  // Production: show Clerk (or loading if not ready)
  if (SignUpComponent) {
    return <SignUpComponent />
  }
  
  return <LoadingState />
}
