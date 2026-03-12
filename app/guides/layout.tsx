import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      <MarketingHeader />
      <main className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  )
}
