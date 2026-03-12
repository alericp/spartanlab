'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Play,
  type LucideIcon 
} from 'lucide-react'

// =============================================================================
// GUIDE LAYOUT
// =============================================================================

interface GuideLayoutProps {
  children: React.ReactNode
  className?: string
}

export function GuideLayout({ children, className }: GuideLayoutProps) {
  return (
    <div className={cn("px-4 py-12 sm:py-16", className)}>
      <article className="max-w-3xl mx-auto">
        {children}
      </article>
    </div>
  )
}

// =============================================================================
// GUIDE BREADCRUMB
// =============================================================================

interface GuideBreadcrumbProps {
  guideTitle: string
}

export function GuideBreadcrumb({ guideTitle }: GuideBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-8">
      <Link href="/landing" className="hover:text-[#A4ACB8]">Home</Link>
      <span>/</span>
      <Link href="/guides" className="hover:text-[#A4ACB8]">Guides</Link>
      <span>/</span>
      <span className="text-[#A4ACB8]">{guideTitle}</span>
    </nav>
  )
}

// =============================================================================
// GUIDE HEADER
// =============================================================================

interface GuideHeaderProps {
  title: string
  intro: string
  category: string
  icon: LucideIcon
  readTime?: string
}

export function GuideHeader({ title, intro, category, icon: Icon, readTime }: GuideHeaderProps) {
  return (
    <header className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#C1121F]" />
          </div>
          <span className="text-sm text-[#C1121F] font-medium">{category}</span>
        </div>
        {readTime && (
          <span className="text-xs text-[#6B7280]">{readTime}</span>
        )}
      </div>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E6E9EF] mb-6 text-balance">
        {title}
      </h1>
      <p className="text-lg text-[#A4ACB8] leading-relaxed">
        {intro}
      </p>
    </header>
  )
}

// =============================================================================
// GUIDE SECTION
// =============================================================================

interface GuideSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function GuideSection({ title, children, className }: GuideSectionProps) {
  return (
    <section className={cn("", className)}>
      <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}

// =============================================================================
// GUIDE PARAGRAPH
// =============================================================================

interface GuideParagraphProps {
  children: React.ReactNode
  className?: string
}

export function GuideParagraph({ children, className }: GuideParagraphProps) {
  return (
    <p className={cn("text-[#A4ACB8] leading-relaxed mb-4", className)}>
      {children}
    </p>
  )
}

// =============================================================================
// GUIDE LIST
// =============================================================================

interface GuideListProps {
  items: string[]
  variant?: 'check' | 'bullet' | 'number'
  className?: string
}

export function GuideList({ items, variant = 'check', className }: GuideListProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[#A4ACB8]">
          {variant === 'check' && (
            <CheckCircle2 className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
          )}
          {variant === 'bullet' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C1121F] flex-shrink-0 mt-2" />
          )}
          {variant === 'number' && (
            <span className="w-6 h-6 rounded-full bg-[#C1121F]/10 text-[#C1121F] text-xs font-medium flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// =============================================================================
// PROGRESSION TABLE
// =============================================================================

interface ProgressionTableRow {
  level: string
  benchmark: string
  notes: string
}

interface ProgressionTableProps {
  rows: ProgressionTableRow[]
  headers?: { level: string; benchmark: string; notes: string }
  className?: string
}

export function ProgressionTable({ 
  rows, 
  headers = { level: 'Level', benchmark: 'Benchmark', notes: 'Notes' },
  className 
}: ProgressionTableProps) {
  return (
    <div className={cn("overflow-x-auto mb-4", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2B313A]">
            <th className="text-left py-3 pr-4 text-[#E6E9EF] font-semibold">{headers.level}</th>
            <th className="text-left py-3 pr-4 text-[#E6E9EF] font-semibold">{headers.benchmark}</th>
            <th className="text-left py-3 text-[#E6E9EF] font-semibold">{headers.notes}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#2B313A]/50">
              <td className="py-3 pr-4 text-[#E6E9EF]">{row.level}</td>
              <td className="py-3 pr-4 text-[#C1121F] font-medium">{row.benchmark}</td>
              <td className="py-3 text-[#6B7280]">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// =============================================================================
// EXERCISE CARD
// =============================================================================

interface ExerciseCardProps {
  name: string
  description: string
  image?: string
  cues?: string[]
  sets?: string
  reps?: string
  className?: string
}

export function ExerciseCard({ 
  name, 
  description, 
  image, 
  cues, 
  sets, 
  reps,
  className 
}: ExerciseCardProps) {
  return (
    <Card className={cn("bg-[#1A1F26] border-[#2B313A] overflow-hidden", className)}>
      {image && (
        <div className="relative aspect-video bg-[#0F1115]">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-semibold text-[#E6E9EF] mb-2">{name}</h4>
        <p className="text-sm text-[#A4ACB8] mb-3">{description}</p>
        
        {(sets || reps) && (
          <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3">
            {sets && <span>Sets: <span className="text-[#E6E9EF]">{sets}</span></span>}
            {reps && <span>Reps: <span className="text-[#E6E9EF]">{reps}</span></span>}
          </div>
        )}
        
        {cues && cues.length > 0 && (
          <div className="pt-3 border-t border-[#2B313A]/50">
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">Cues</p>
            <ul className="space-y-1">
              {cues.map((cue, i) => (
                <li key={i} className="text-xs text-[#A4ACB8] flex items-start gap-2">
                  <span className="text-[#C1121F]">•</span>
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}

// =============================================================================
// EXERCISE GRID
// =============================================================================

interface ExerciseGridProps {
  children: React.ReactNode
  columns?: 2 | 3
  className?: string
}

export function ExerciseGrid({ children, columns = 2, className }: ExerciseGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {children}
    </div>
  )
}

// =============================================================================
// GUIDE IMAGE
// =============================================================================

interface GuideImageProps {
  src: string
  alt: string
  caption?: string
  className?: string
}

export function GuideImage({ src, alt, caption, className }: GuideImageProps) {
  return (
    <figure className={cn("my-6", className)}>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1A1F26] border border-[#2B313A]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="text-xs text-[#6B7280] text-center mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

// =============================================================================
// CALLOUT / TIP BOX
// =============================================================================

interface GuideCalloutProps {
  type?: 'tip' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
  className?: string
}

export function GuideCallout({ type = 'tip', title, children, className }: GuideCalloutProps) {
  const styles = {
    tip: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-400',
    },
    info: {
      bg: 'bg-[#4F6D8A]/10',
      border: 'border-[#4F6D8A]/20',
      icon: Info,
      iconColor: 'text-[#4F6D8A]',
      titleColor: 'text-[#4F6D8A]',
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div className={cn(
      "rounded-lg p-4 my-4",
      style.bg,
      `border ${style.border}`,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", style.iconColor)} />
        <div>
          {title && (
            <p className={cn("font-medium mb-1", style.titleColor)}>{title}</p>
          )}
          <div className="text-sm text-[#A4ACB8]">{children}</div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// TOOL CTA
// =============================================================================

interface GuideToolCTAProps {
  toolSlug: string
  toolName: string
  message?: string
  className?: string
}

export function GuideToolCTA({ toolSlug, toolName, message, className }: GuideToolCTAProps) {
  return (
    <Card className={cn("bg-[#1A1F26] border-[#2B313A] p-6", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[#E6E9EF] mb-1">Track Your Progress</h3>
          <p className="text-sm text-[#A4ACB8]">
            {message || `Use the free SpartanLab sensor to analyze your current level and get recommendations.`}
          </p>
        </div>
        <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
          <Link href={`/tools/${toolSlug}`}>
            Open {toolName.split(' ')[0]} Tool
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

// =============================================================================
// PLATFORM FUNNEL CTA
// =============================================================================

interface GuidePlatformCTAProps {
  title?: string
  description?: string
  buttonText?: string
  buttonHref?: string
  className?: string
}

export function GuidePlatformCTA({ 
  title = "Want a Personalized Training Plan?",
  description = "SpartanLab can automatically generate a training program based on your current levels, goals, and identified limiters.",
  buttonText = "Generate Adaptive Training Plan",
  buttonHref = "/programs",
  className 
}: GuidePlatformCTAProps) {
  return (
    <Card className={cn(
      "bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8",
      className
    )}>
      <div className="text-center">
        <h3 className="text-xl font-bold text-[#E6E9EF] mb-2">
          {title}
        </h3>
        <p className="text-[#A4ACB8] mb-6 max-w-md mx-auto">
          {description}
        </p>
        <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
          <Link href={buttonHref}>
            {buttonText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <p className="text-xs text-[#6B7280] mt-4">
          Free analysis. Pro unlocks full adaptive programming.
        </p>
      </div>
    </Card>
  )
}

// =============================================================================
// RELATED GUIDES
// =============================================================================

interface RelatedGuide {
  slug: string
  title: string
  category: string
  icon: LucideIcon
}

interface GuideRelatedProps {
  guides: RelatedGuide[]
  className?: string
}

export function GuideRelated({ guides, className }: GuideRelatedProps) {
  if (guides.length === 0) return null
  
  return (
    <div className={cn("mt-16", className)}>
      <h3 className="text-lg font-semibold text-[#E6E9EF] mb-6">Related Guides</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {guides.map((guide) => {
          const Icon = guide.icon
          return (
            <Link key={guide.slug} href={`/guides/${guide.slug}`}>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/40 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                      {guide.title}
                    </h4>
                    <p className="text-xs text-[#6B7280]">{guide.category}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// GUIDE BACK LINK
// =============================================================================

interface GuideBackLinkProps {
  href?: string
  text?: string
  className?: string
}

export function GuideBackLink({ 
  href = "/guides", 
  text = "View all guides",
  className 
}: GuideBackLinkProps) {
  return (
    <div className={cn("mt-12", className)}>
      <Link 
        href={href} 
        className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {text}
      </Link>
    </div>
  )
}

// =============================================================================
// VIDEO EMBED
// =============================================================================

interface GuideVideoProps {
  title: string
  description?: string
  placeholder?: boolean
  className?: string
}

export function GuideVideo({ title, description, placeholder = true, className }: GuideVideoProps) {
  return (
    <div className={cn("my-6", className)}>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1A1F26] border border-[#2B313A]">
        {placeholder ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#C1121F]/20 flex items-center justify-center mb-4">
              <Play className="w-8 h-8 text-[#C1121F]" />
            </div>
            <p className="text-sm text-[#A4ACB8]">{title}</p>
            {description && (
              <p className="text-xs text-[#6B7280] mt-1">{description}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
