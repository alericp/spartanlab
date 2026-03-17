import { ClerkProvider } from '@clerk/nextjs'

/**
 * Sign-In Layout - Provides ClerkProvider for Clerk Sign-In component
 * 
 * This layout MUST wrap the sign-in page because:
 * 1. The page uses Clerk's SignIn component
 * 2. SignIn requires ClerkProvider context
 * 3. Root layout is auth-free for public page prerendering
 * 
 * Without this layout, SignIn would crash during prerender
 * because there's no ClerkProvider in the root layout.
 */
export default function SignInLayout({
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
