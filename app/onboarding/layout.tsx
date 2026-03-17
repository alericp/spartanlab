import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'

/**
 * Onboarding Layout - Provides ClerkProvider for auth-aware onboarding pages
 * 
 * Pages in /onboarding/* may use useAuth hooks and require ClerkProvider context.
 * Root layout is auth-free for public page prerendering, so this layout
 * provides the necessary Clerk context.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      {children}
      <Toaster />
    </ClerkProvider>
  )
}
