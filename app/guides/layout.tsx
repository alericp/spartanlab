import { ClerkProvider } from '@clerk/nextjs'

/**
 * Guides Layout - Provides ClerkProvider for potentially auth-aware guide pages
 * 
 * Some guides pages may use auth hooks. Root layout is auth-free for public
 * page prerendering, so this layout provides Clerk context.
 */
export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}
