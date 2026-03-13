'use client'

import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'

const NAV_LINKS = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/features', label: 'Features' },
  { href: '/tools', label: 'Free Tools' },
  { href: '/guides', label: 'Guides' },
  { href: '/pricing', label: 'Pricing' },
]

// Placeholder shown during SSR and while auth loads - static content only
function AuthPlaceholder({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  if (variant === 'mobile') {
    return (
      <>
        <Link href="/sign-in">
          <Button variant="outline" size="sm" className="w-full border-[#2B313A] text-[#A4ACB8]">
            Login
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button size="sm" className="w-full bg-[#C1121F] hover:bg-[#A30F1A]">
            Start Training
          </Button>
        </Link>
      </>
    )
  }
  return (
    <>
      <Link href="/sign-in">
        <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
          Login
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A]">
          Start Training
        </Button>
      </Link>
    </>
  )
}

// Client-only auth CTA - dynamically imported with ssr: false
const HeaderAuthCTAClient = dynamic(
  () => import('./HeaderAuthCTA').then((mod) => mod.HeaderAuthCTA),
  { 
    ssr: false, 
    loading: () => <AuthPlaceholder variant="desktop" />
  }
)

const MobileAuthCTAClient = dynamic(
  () => import('./HeaderAuthCTA').then((mod) => mod.MobileAuthCTA),
  { 
    ssr: false, 
    loading: () => <AuthPlaceholder variant="mobile" />
  }
)

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F1115]/90 backdrop-blur-md border-b border-[#2B313A]">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <SpartanIcon size={30} />
            <span className="text-lg font-bold tracking-tight text-[#E6E9EF]">SpartanLab</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <HeaderAuthCTAClient />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#A4ACB8] hover:text-[#E6E9EF]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#2B313A]">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="flex flex-col gap-2 pt-4 border-t border-[#2B313A]">
                <MobileAuthCTAClient onNavigate={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
