import { AuthAwareGuidesLayout } from '@/components/guides/AuthAwareGuidesLayout'

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthAwareGuidesLayout>{children}</AuthAwareGuidesLayout>
}
