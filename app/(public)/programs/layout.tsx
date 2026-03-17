/**
 * Public Programs Layout - Pure pass-through for SEO pages
 * 
 * This layout wraps public program-related SEO pages that must be prerenderable.
 * The actual app-level program builder is at app/(app)/programs/page.tsx
 */
export default function ProgramsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
