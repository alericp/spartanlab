'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, LayoutDashboard, User } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { isAuthenticated } from '@/lib/auth-service-client'
import { isPreviewMode } from '@/lib/app-mode'

const NAV_LINKS = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/features', label: 'Features' },
  { href: '/tools', label: 'Free Tools' },
  { href: '/guides', label: 'Guides' },
  { href: '/pricing', label: 'Pricing' },
]

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Check auth state on mount
    // In preview mode, check if user has started using the app (has data)
    if (isPreviewMode()) {
      const hasProfile = localStorage.getItem('athlete_profile')
      const hasWorkouts = localStorage.getItem('workouts')
      const hasPrograms = localStorage.getItem('saved_programs')
      setIsLoggedIn(Boolean(hasProfile || hasWorkouts || hasPrograms))
    } else {
      setIsLoggedIn(isAuthenticated())
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F1115]/90 backdrop-blur-md border-b border-[#2B313A]">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isLoggedIn ? "/dashboard" : "/landing"} className="flex items-center gap-2.5">
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

          {/* Desktop CTA - Auth-aware */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF]">
                    <User className="w-4 h-4 mr-2" />
                    My Account
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
                    Login
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                    Start Training
                  </Button>
                </Link>
              </>
            )}
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
              {isLoggedIn ? (
                <>
                  {/* Logged-in mobile menu: App-focused navigation */}
                  <Link
                    href="/dashboard"
                    className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/guides"
                    className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Guides
                  </Link>
                  <Link
                    href="/tools"
                    className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Free Tools
                  </Link>
                </>
              ) : (
                <>
                  {/* Logged-out mobile menu: Marketing navigation */}
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
                </>
              )}
              <div className="flex flex-col gap-2 pt-4 border-t border-[#2B313A]">
                {isLoggedIn ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-[#C1121F] hover:bg-[#A30F1A]">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full border-[#2B313A] text-[#A4ACB8]">
                        Login
                      </Button>
                    </Link>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-[#C1121F] hover:bg-[#A30F1A]">
                        Start Training
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
