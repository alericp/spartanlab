import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

interface SeoPageLayoutProps {
  children: React.ReactNode
}

export function SeoPageLayout({ children }: SeoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <MarketingHeader />
      <main className="pt-16">
        {children}
      </main>
      <MarketingFooter />
    </div>
  )
}
