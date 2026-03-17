import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/toaster'

/**
 * History Layout - Provides ClerkProvider for auth-aware history pages
 * 
 * Pages in /history/* use useAuth hooks and require ClerkProvider context.
 * Root layout is auth-free for public page prerendering, so this layout
 * provides the necessary Clerk context.
 */
export default function HistoryLayout({
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
