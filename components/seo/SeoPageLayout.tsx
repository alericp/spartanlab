import Link from 'next/link'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

/*
  [PRE-AB6 BUILD GREEN GATE / SEO LAYOUT CONTRACT SWEEP]
  SeoPageLayout was originally a thin shell accepting only `children`.
  Four diagnosis pages (why-you-cant-front-lever, why-you-cant-muscle-up,
  why-you-cant-planche, why-your-hspu-is-stuck) call it with an extended
  prop set: title / subtitle / description / breadcrumbs. Every other
  caller (14 pages) uses the bare `<SeoPageLayout>{children}</SeoPageLayout>`
  shape and renders its own SeoHero / hero section internally.

  Lowest-risk fix: expand SeoPageLayoutProps to make the four extra props
  OPTIONAL. The built-in breadcrumb row + hero header only renders when
  any of these props are provided, so all 14 existing bare callers retain
  identical output. No `as any`, no TS suppressions, no broad widening.
*/

export interface SeoPageLayoutBreadcrumb {
  label: string
  href?: string
}

interface SeoPageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  description?: string
  breadcrumbs?: SeoPageLayoutBreadcrumb[]
}

export function SeoPageLayout({
  children,
  title,
  subtitle,
  description,
  breadcrumbs,
}: SeoPageLayoutProps) {
  const hasHeader = Boolean(title || subtitle || description || (breadcrumbs && breadcrumbs.length > 0))

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <MarketingHeader />
      <main className="pt-16">
        {hasHeader && (
          <header className="border-b border-[#2B313A]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-6">
                  <ol className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
                    {breadcrumbs.map((crumb, index) => {
                      const isLast = index === breadcrumbs.length - 1
                      return (
                        <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                          {crumb.href && !isLast ? (
                            <Link href={crumb.href} className="hover:text-[#E6E9EF] transition-colors">
                              {crumb.label}
                            </Link>
                          ) : (
                            <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'text-[#E6E9EF]' : ''}>
                              {crumb.label}
                            </span>
                          )}
                          {!isLast && <span aria-hidden="true">/</span>}
                        </li>
                      )
                    })}
                  </ol>
                </nav>
              )}
              {title && (
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-3 text-lg sm:text-xl text-[#9CA3AF] text-pretty">
                  {subtitle}
                </p>
              )}
              {description && (
                <p className="mt-6 text-base sm:text-lg text-[#E6E9EF]/80 leading-relaxed text-pretty max-w-3xl">
                  {description}
                </p>
              )}
            </div>
          </header>
        )}
        {children}
      </main>
      <MarketingFooter />
    </div>
  )
}
