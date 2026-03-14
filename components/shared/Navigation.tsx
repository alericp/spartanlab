// AUTH_TRUTH_PASS_V5
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Target, Dumbbell, Calendar, ClipboardList, TrendingUp, Activity, Settings, Menu, X, Wrench, BookOpen, LogIn } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { useState } from 'react'
import { cn } from '@/lib/utils'

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
  { href: '/recovery', label: 'Recovery', icon: Activity },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/workouts', label: 'History', icon: ClipboardList },
  { href: '/performance', label: 'Analytics', icon: TrendingUp },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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

          {/* Right side - Static links only (no Clerk) */}
          <div className="flex items-center gap-2">
            <Link href="/settings" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            
            {/* Static auth links - no Clerk hooks */}
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="text-[#A4ACB8] hover:text-[#E6E9EF] hidden sm:flex">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Open App
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="sm" variant="ghost" className="text-[#A4ACB8] hover:text-[#E6E9EF]">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
            
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
