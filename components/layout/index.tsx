/**
 * SpartanLab Layout System
 * 
 * Premium, disciplined layout components following the design specification.
 * Consistent spacing grid: 4, 8, 16, 24, 32, 48px
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * =============================
 * This file contains PageContainer which imports auth-aware Navigation.
 * Therefore, these components are ONLY safe for use in pages under app/(app)/
 * which have ClerkProvider from app/(app)/layout.tsx.
 * 
 * DO NOT use PageContainer in:
 * - app/(public)/* pages (will break prerender - no ClerkProvider)
 * - Root-level app/* pages (no ClerkProvider unless explicitly added)
 * 
 * For public/SEO pages, use:
 * - SeoPageLayout from @/components/seo/SeoPageLayout
 * - MarketingHeader from @/components/marketing/MarketingHeader
 * - MarketingFooter from @/components/marketing/MarketingFooter
 * 
 * Hierarchy:
 * 1. PageContainer - Root container with auth-aware Navigation (app/(app) only!)
 * 2. Section - Major content blocks (48px gap between)
 * 3. SectionHeader - Section title with optional action
 * 4. CardGrid - Grid layouts (2-col, 4-col responsive)
 * 5. MetricCard - Consistent card structure
 * 
 * STABILITY NOTE:
 * Navigation is wrapped in its own error boundary, but we add a secondary
 * fallback here in case the import itself fails.
 */

import { ReactNode, Component } from 'react'
import { Card } from '@/components/ui/card'
import { Navigation } from '@/components/shared/Navigation'
import { LucideIcon } from 'lucide-react'

// =============================================================================
// PAGE CONTAINER ERROR BOUNDARY (secondary fallback)
// =============================================================================

class PageContainerNavBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error) {
    console.error('[v0] PageContainer Navigation boundary caught error:', error.message)
  }
  
  render() {
    if (this.state.hasError) {
      // Minimal header fallback
      return (
        <header className="border-b border-[#2B313A] bg-[#0F1115] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <span className="text-xl font-bold">SpartanLab</span>
            </div>
          </div>
        </header>
      )
    }
    return this.props.children
  }
}

// =============================================================================
// SPACING CONSTANTS
// =============================================================================

export const SPACING = {
  xs: 4,    // 1
  sm: 8,    // 2
  md: 16,   // 4
  lg: 24,   // 6
  xl: 32,   // 8
  '2xl': 48, // 12
} as const

// =============================================================================
// PAGE CONTAINER
// =============================================================================

interface PageContainerProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '6xl'
  className?: string
}

export function PageContainer({ 
  children, 
  maxWidth = '6xl',
  className = '' 
}: PageContainerProps) {
  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '6xl': 'max-w-6xl',
  }[maxWidth]

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <PageContainerNavBoundary>
        <Navigation />
      </PageContainerNavBoundary>
      <main className={`${maxWidthClass} mx-auto px-4 sm:px-6 py-8 sm:py-12 ${className}`}>
        {children}
      </main>
    </div>
  )
}

// =============================================================================
// SECTION
// =============================================================================

interface SectionProps {
  children: ReactNode
  id?: string
  className?: string
  priority?: 'primary' | 'secondary' | 'tertiary'
}

export function Section({ 
  children, 
  id, 
  className = '',
  priority = 'secondary'
}: SectionProps) {
  return (
    <section id={id} className={`${className}`}>
      {children}
    </section>
  )
}

// =============================================================================
// SECTION STACK
// =============================================================================

interface SectionStackProps {
  children: ReactNode
  gap?: 'md' | 'lg' | 'xl'
  className?: string
}

export function SectionStack({ 
  children, 
  gap = 'xl',
  className = '' 
}: SectionStackProps) {
  const gapClass = {
    md: 'space-y-6',
    lg: 'space-y-8',
    xl: 'space-y-12',
  }[gap]

  return (
    <div className={`${gapClass} ${className}`}>
      {children}
    </div>
  )
}

// =============================================================================
// SECTION HEADER
// =============================================================================

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
  className?: string
}

export function SectionHeader({ 
  title, 
  description, 
  action,
  icon: Icon,
  className = '' 
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-[#1A1F26] border border-[#2B313A] mt-0.5">
            <Icon className="w-5 h-5 text-[#C1121F]" />
          </div>
        )}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#E6E9EF]">{title}</h2>
          {description && (
            <p className="text-sm text-[#A4ACB8] mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// =============================================================================
// CARD GRID
// =============================================================================

interface CardGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function CardGrid({ 
  children, 
  columns = 2,
  className = '' 
}: CardGridProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <div className={`grid ${colClass} gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  )
}

// =============================================================================
// METRIC CARD
// =============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  badge?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  children?: ReactNode
}

export function MetricCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  iconColor = '#C1121F',
  badge,
  trend,
  className = '',
  children,
}: MetricCardProps) {
  return (
    <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 sm:p-6 ${className}`}>
      {/* Header with icon and badge */}
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[#0F1115] border border-[#2B313A] flex items-center justify-center">
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}
        {badge}
      </div>
      
      {/* Title */}
      <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">
        {title}
      </p>
      
      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-bold text-[#E6E9EF]">
          {value}
        </span>
        {subtitle && (
          <span className="text-sm text-[#A4ACB8]">{subtitle}</span>
        )}
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-[#A4ACB8] mt-2">{description}</p>
      )}
      
      {/* Additional content */}
      {children}
    </Card>
  )
}

// =============================================================================
// STAT CARD (Compact version)
// =============================================================================

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon?: LucideIcon
  iconColor?: string
  className?: string
}

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconColor = '#C1121F',
  className = '',
}: StatCardProps) {
  return (
    <Card className={`bg-[#1A1F26] border-[#2B313A] p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#0F1115] flex items-center justify-center">
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
        )}
      </div>
      <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold text-[#E6E9EF]">{value}</p>
      {sublabel && (
        <p className="text-xs text-[#A4ACB8] mt-1">{sublabel}</p>
      )}
    </Card>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`bg-[#1A1F26] border-[#2B313A] p-8 sm:p-12 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 mx-auto rounded-full bg-[#0F1115] border border-[#2B313A] flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#6B7280]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2">{title}</h3>
      <p className="text-sm text-[#A4ACB8] max-w-md mx-auto mb-6">{description}</p>
      {action}
    </Card>
  )
}

// =============================================================================
// DIVIDER
// =============================================================================

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-[#2B313A] ${className}`} />
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

interface SkeletonCardProps {
  className?: string
  height?: string
}

export function SkeletonCard({ className = '', height = 'h-32' }: SkeletonCardProps) {
  return (
    <div className={`${height} bg-[#1A1F26] rounded-lg animate-pulse ${className}`} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <SkeletonCard height="h-48" />
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard height="h-28" />
        <SkeletonCard height="h-28" />
        <SkeletonCard height="h-28" />
        <SkeletonCard height="h-28" />
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard height="h-40" />
        <SkeletonCard height="h-40" />
      </div>
    </div>
  )
}
