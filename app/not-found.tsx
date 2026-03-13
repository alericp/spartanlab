import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F1115] text-[#E6E9EF]">
      <MarketingHeader />
      
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-8xl font-bold text-[#C1121F] mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-[#A4ACB8] mb-8">
            The page you are looking for does not exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-[#2B313A] gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <MarketingFooter />
    </div>
  )
}
