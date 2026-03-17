import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'

/**
 * Challenges Layout - Provides ClerkProvider for auth-aware challenges pages
 */
export default function ChallengesLayout({
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
