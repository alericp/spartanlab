import { ClerkProvider } from '@clerk/nextjs'

/**
 * Sign-Up Layout - Provides ClerkProvider for Clerk Sign-Up component
 * 
 * This layout MUST wrap the sign-up page because:
 * 1. The page uses Clerk's SignUp component
 * 2. SignUp requires ClerkProvider context
 * 3. Root layout is auth-free for public page prerendering
 * 
 * Without this layout, SignUp would crash during prerender
 * because there's no ClerkProvider in the root layout.
 */
export default function SignUpLayout({
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
