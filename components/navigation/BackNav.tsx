import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Wrench, BookOpen, Dumbbell, Activity } from 'lucide-react'

type BackNavTarget = 
  | 'dashboard'
  | 'tools'
  | 'guides'
  | 'workout'
  | 'skills'
  | 'strength'
  | 'custom'

const NAV_CONFIG: Record<Exclude<BackNavTarget, 'custom'>, { href: string; label: string; icon: typeof ArrowLeft }> = {
  dashboard: { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  tools: { href: '/tools', label: 'All Tools', icon: Wrench },
  guides: { href: '/guides', label: 'All Guides', icon: BookOpen },
  workout: { href: '/dashboard', label: 'Dashboard', icon: Activity },
  skills: { href: '/skills', label: 'Skills', icon: Activity },
  strength: { href: '/strength', label: 'Strength', icon: Dumbbell },
}

interface BackNavProps {
  /** Predefined navigation target */
  to?: BackNavTarget
  /** Custom href (required if to='custom') */
  href?: string
  /** Custom label (required if to='custom') */
  label?: string
  /** Additional className for styling */
  className?: string
}

/**
 * Consistent back navigation component for SpartanLab pages.
 * Provides clear escape paths so users never feel stuck.
 */
export function BackNav({ 
  to = 'dashboard', 
  href: customHref, 
  label: customLabel,
  className = ''
}: BackNavProps) {
  const config = to === 'custom' 
    ? { href: customHref || '/dashboard', label: customLabel || 'Back', icon: ArrowLeft }
    : NAV_CONFIG[to]
  
  const Icon = config.icon
  
  return (
    <Link 
      href={config.href}
      className={`inline-flex items-center gap-2 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors group ${className}`}
    >
      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{config.label}</span>
    </Link>
  )
}

/**
 * Sticky header variant with back navigation.
 * Use for pages that need persistent back navigation while scrolling.
 */
export function BackNavHeader({ 
  to = 'dashboard',
  href,
  label,
  children,
  className = ''
}: BackNavProps & { children?: React.ReactNode }) {
  return (
    <div className={`border-b border-[#2B313A]/50 bg-[#0F1115]/95 backdrop-blur-sm sticky top-0 z-40 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <BackNav to={to} href={href} label={label} />
        {children}
      </div>
    </div>
  )
}
