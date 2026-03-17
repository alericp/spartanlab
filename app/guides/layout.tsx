import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

/**
 * Guides Layout - Uses static SEO layout for prerendering safety.
 * 
 * All /guides/* pages are public SEO pages that must be prerenderable.
 * Using the static SeoPageLayout ensures no auth dependencies during build.
 */
export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SeoPageLayout>{children}</SeoPageLayout>
}
