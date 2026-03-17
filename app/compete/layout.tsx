import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'

/**
 * Compete Layout - Provides ClerkProvider for auth-aware compete pages
 */
export default function CompeteLayout({
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
