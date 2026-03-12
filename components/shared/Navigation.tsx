'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Target, Dumbbell, Calendar, ClipboardList, TrendingUp, Activity, Crosshair, Settings, Menu, X, Database, Wrench, BookOpen, LogIn } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { isPreviewMode } from '@/lib/app-mode'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/programs', label: 'Programs', icon: Calendar },
  { href: '/skills', label: 'Skills', icon: Target },
  { href: '/strength', label: 'Strength', icon: Dumbbell },
  { href: '/recovery', label: 'Recovery', icon: Activity },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/guides', label: 'Guides', icon: BookOpen },
]

const SECONDARY_NAV_ITEMS = [
  { href: '/workouts', label: 'Workouts', icon: ClipboardList },
  { href: '/goals', label: 'Goals', icon: Crosshair },
  { href: '/performance', label: 'Performance', icon: TrendingUp },
  { href: '/database', label: 'Database', icon: Database },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const preview = isPreviewMode()

  return (
    <header className="border-b border-[#2B313A] bg-[#0F1115] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Links to dashboard for app users */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <SpartanIcon size={28} />
            <span className="text-xl font-bold hidden sm:inline">SpartanLab</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              // Match exact path or nested paths (e.g., /tools/front-lever-calculator)
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'gap-2 text-sm',
                      isActive && 'bg-[#1A1F26] text-[#C1121F]'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Right side - User area */}
          <div className="flex items-center gap-2">
            <Link href="/settings" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* User Button - Clerk in production, avatar in preview */}
            {preview ? (
              // Preview mode: show simple avatar
              <div className="w-8 h-8 rounded-full bg-[#C1121F] flex items-center justify-center text-sm font-bold">
                A
              </div>
            ) : (
              // Production mode: use Clerk components
              <>
                <SignedIn>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-8 h-8',
                        userButtonPopoverCard: 'bg-[#1A1F26] border border-[#2B313A]',
                        userButtonPopoverActionButton: 'text-[#E6E9EF] hover:bg-[#2B313A]',
                        userButtonPopoverActionButtonText: 'text-[#E6E9EF]',
                        userButtonPopoverActionButtonIcon: 'text-[#A4ACB8]',
                        userButtonPopoverFooter: 'hidden',
                        userPreviewMainIdentifier: 'text-[#E6E9EF]',
                        userPreviewSecondaryIdentifier: 'text-[#A4ACB8]',
                      },
                    }}
                  />
                </SignedIn>
                <SignedOut>
                  <Link href="/sign-in">
                    <Button size="sm" variant="ghost" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                </SignedOut>
              </>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 border-t border-[#2B313A] pt-4 space-y-1">
            {/* Primary Nav Items */}
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3',
                      isActive && 'bg-[#1A1F26] text-[#C1121F]'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            
            {/* Divider */}
            <div className="border-t border-[#2B313A] my-2" />
            
            {/* Secondary Nav Items */}
            <p className="text-xs text-[#6B7280] px-3 py-1">More</p>
            {SECONDARY_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 text-[#A4ACB8]',
                      isActive && 'bg-[#1A1F26] text-[#C1121F]'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            
            <Link href="/settings" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-[#A4ACB8]">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
