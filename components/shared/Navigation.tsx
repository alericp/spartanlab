// AUTH_PROD_UNBLOCK_V1
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Target, Dumbbell, Calendar, ClipboardList, TrendingUp, Activity, Settings, Menu, X, Wrench, BookOpen, LogIn, LogOut, Trophy, Swords, Archive } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SubscriptionBadge, useSubscriptionDisplay } from '@/components/billing/SubscriptionBadge'
import { useOwnerInit } from '@/hooks/useOwnerInit'

// Primary navigation - essential daily actions
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/programs', label: 'Program', icon: Calendar },
  { href: '/skills', label: 'Skills', icon: Target },
  { href: '/strength', label: 'Strength', icon: Dumbbell },
  { href: '/guides', label: 'Guides', icon: BookOpen },
]

// Secondary navigation - deeper features (shown in mobile menu and settings)
const SECONDARY_NAV_ITEMS = [
  { href: '/history', label: 'History', icon: Archive },
  { href: '/challenges', label: 'Challenges', icon: Target },
  { href: '/compete', label: 'Compete', icon: Swords },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/recovery', label: 'Recovery', icon: Activity },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/performance', label: 'Analytics', icon: TrendingUp },
]

// Page title mapping for all known routes
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/programs': 'Program',
  '/skills': 'Skills',
  '/strength': 'Strength',
  '/guides': 'Guides',
  '/history': 'History',
  '/history/prs': 'PR Archive',
  '/history/workouts': 'Workout History',
  '/history/programs': 'Program History',
  '/history/session': 'Session Details',
  '/history/program': 'Program Details',
  '/challenges': 'Challenges',
  '/compete': 'Compete',
  '/leaderboard': 'Leaderboard',
  '/recovery': 'Recovery',
  '/tools': 'Tools',
  '/workouts': 'Workout Log',
  '/prs': 'PR Archive',
  '/performance': 'Analytics',
  '/settings': 'Settings',
  '/upgrade': 'Upgrade',
  '/pricing': 'Pricing',
  '/onboarding': 'Onboarding',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // Match by prefix for nested routes (e.g. /tools/front-lever-calculator → "Tools")
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title
  }
  return ''
}

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { userId, signOut, isLoaded } = useAuth()
  const subscriptionInfo = useSubscriptionDisplay()
  
  // Initialize owner detection from Clerk auth - this enables owner simulation throughout the app
  useOwnerInit()

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleSignOut = async () => {
    await signOut()
    setMobileOpen(false)
  }

  const pageTitle = getPageTitle(pathname)

  return (
    <header className="border-b border-[#2B313A] bg-[#0F1115] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo - Links to dashboard for app users */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2">
              <SpartanIcon size={28} />
              <span className="text-xl font-bold hidden sm:inline">SpartanLab</span>
            </Link>
            {/* Pro/Trial badge - only on desktop */}
            {subscriptionInfo.isPaid && (
              <div className="hidden sm:block">
                <SubscriptionBadge size="sm" showTrialDays={false} />
              </div>
            )}
          </div>

          {/* Page title - centered, visible on mobile only (desktop shows full nav) */}
          {pageTitle && (
            <span className="md:hidden absolute left-1/2 -translate-x-1/2 text-[16px] font-semibold text-[#E6E9EF]/90 truncate max-w-[40vw] text-center pointer-events-none">
              {pageTitle}
            </span>
          )}

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

          {/* Right side - Auth-aware */}
          <div className="flex items-center gap-2">
            <Link href="/settings" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* Auth buttons - show based on auth state */}
            {isLoaded && userId ? (
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-[#A4ACB8] hover:text-[#E6E9EF] hidden sm:flex"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Link href="/sign-in">
                <Button size="sm" variant="ghost" className="text-[#A4ACB8] hover:text-[#E6E9EF] hidden sm:flex">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
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
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Nav Sidebar */}
      {mobileOpen && (
        <nav className="fixed top-16 left-0 right-0 bottom-0 bg-[#0F1115] z-50 md:hidden overflow-y-auto">
          <div className="p-4 space-y-1">
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

            {/* Divider */}
            <div className="border-t border-[#2B313A] my-2" />

            {/* Auth button in mobile menu */}
            {isLoaded && userId ? (
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-[#A4ACB8]"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-[#A4ACB8]">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
