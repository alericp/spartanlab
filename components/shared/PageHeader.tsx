'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/**
 * Consistent page header with optional back navigation.
 * Used across major pages to provide context and easy navigation.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      {/* Back Navigation */}
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{backLabel || 'Back'}</span>
        </Link>
      )}

      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center text-[#C1121F]">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#E6E9EF]">{title}</h1>
            {description && (
              <p className="text-sm text-[#A4ACB8] mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Back routing configuration for smart navigation.
 * Maps page paths to their logical parent destinations.
 */
export const BACK_ROUTES: Record<string, { href: string; label: string }> = {
  '/program': { href: '/dashboard', label: 'Back to Dashboard' },
  '/programs': { href: '/dashboard', label: 'Back to Dashboard' },
  '/skills': { href: '/dashboard', label: 'Back to Dashboard' },
  '/strength': { href: '/dashboard', label: 'Back to Dashboard' },
  '/recovery': { href: '/dashboard', label: 'Back to Dashboard' },
  '/goals': { href: '/dashboard', label: 'Back to Dashboard' },
  '/performance': { href: '/dashboard', label: 'Back to Dashboard' },
  '/workouts': { href: '/dashboard', label: 'Back to Dashboard' },
  '/settings': { href: '/dashboard', label: 'Back to Dashboard' },
  '/database': { href: '/dashboard', label: 'Back to Dashboard' },
  '/today': { href: '/program', label: 'Back to Program' },
  '/week': { href: '/program', label: 'Back to Program' },
}

/**
 * Get back route for a given path.
 * Handles dynamic routes like /tools/[toolname] and /guides/[slug].
 */
export function getBackRoute(pathname: string): { href: string; label: string } | null {
  // Check exact match first
  if (BACK_ROUTES[pathname]) {
    return BACK_ROUTES[pathname]
  }

  // Handle dynamic tool pages
  if (pathname.startsWith('/tools/') && pathname !== '/tools') {
    return { href: '/tools', label: 'Back to Tools' }
  }

  // Handle dynamic guide pages
  if (pathname.startsWith('/guides/') && pathname !== '/guides') {
    return { href: '/guides', label: 'Back to Guides' }
  }

  return null
}
