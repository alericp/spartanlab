/**
 * Public Programs Layout - Pure pass-through for SEO pages
 * 
 * =============================================================================
 * REGRESSION GUARD: SEO PAGES - MUST REMAIN PRERENDERABLE
 * =============================================================================
 * 
 * This layout wraps public program-related SEO pages that must be prerenderable.
 * The actual app-level program builder is at app/(app)/program/page.tsx
 * 
 * DO NOT add to this layout or any child pages in /programs/*:
 * - useAuth, useUser, useClerk hooks
 * - ClerkProvider
 * - Any component that requires authentication context
 * 
 * These pages are for SEO and must build without auth context.
 */
export default function ProgramsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
