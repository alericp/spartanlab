import Link from 'next/link'
import { ArrowRight, Calculator, BookOpen, Target, Calendar, Dumbbell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SKILL_HUBS, type SkillSlug, type PageIntent } from '@/lib/seo/seo-funnel-config'

interface SkillInternalLinksProps {
  skill: SkillSlug
  currentPage: PageIntent
  variant?: 'cards' | 'inline' | 'sidebar'
  showConversionCTA?: boolean
}

const intentIcons: Record<PageIntent, React.ElementType> = {
  hub: Target,
  calculator: Calculator,
  progression: BookOpen,
  training: Dumbbell,
  program: Calendar,
  exercises: Dumbbell,
  standards: Target,
  comparison: Target,
}

const intentLabels: Record<PageIntent, string> = {
  hub: 'Skill Hub',
  calculator: 'Readiness Calculator',
  progression: 'Progression Guide',
  training: 'Training Guide',
  program: 'Training Program',
  exercises: 'Exercises',
  standards: 'Strength Standards',
  comparison: 'Comparison',
}

export function SkillInternalLinks({ 
  skill, 
  currentPage,
  variant = 'cards',
  showConversionCTA = true 
}: SkillInternalLinksProps) {
  const hub = SKILL_HUBS[skill]
  if (!hub) return null
  
  const links = [
    { intent: 'hub' as PageIntent, href: hub.hubPath, label: `${hub.displayName} Hub` },
    { intent: 'calculator' as PageIntent, href: hub.pages.calculator, label: `${hub.displayName} Calculator` },
    { intent: 'progression' as PageIntent, href: hub.pages.progression, label: `${hub.displayName} Progressions` },
    { intent: 'training' as PageIntent, href: hub.pages.training, label: 'Training Guide' },
    { intent: 'program' as PageIntent, href: hub.pages.program, label: 'Training Program' },
  ].filter(link => link.intent !== currentPage)
  
  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1F26] border border-[#2B313A] text-sm text-[#A4ACB8] hover:text-[#E6E9EF] hover:border-[#3D454F] transition-colors"
          >
            {link.label}
            <ArrowRight className="w-3 h-3" />
          </Link>
        ))}
        {showConversionCTA && (
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/30 text-sm text-[#C1121F] hover:bg-[#C1121F]/20 transition-colors"
          >
            Generate Program
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    )
  }
  
  if (variant === 'sidebar') {
    return (
      <nav className="space-y-2">
        <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
          {hub.displayName} Resources
        </h3>
        {links.map(link => {
          const Icon = intentIcons[link.intent]
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#1A1F26] transition-colors"
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          )
        })}
        {showConversionCTA && (
          <Link
            href="/onboarding"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#C1121F] hover:bg-[#C1121F]/10 transition-colors mt-4"
          >
            <Target className="w-4 h-4" />
            Generate Your Program
          </Link>
        )}
      </nav>
    )
  }
  
  // Cards variant (default)
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[#E6E9EF]">
        Continue Your {hub.displayName} Journey
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.slice(0, 4).map(link => {
          const Icon = intentIcons[link.intent]
          return (
            <Link key={link.href} href={link.href}>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#3D454F] transition-colors h-full">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2B313A] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#A4ACB8]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] mb-1">{link.label}</h3>
                    <p className="text-xs text-[#6B7280]">{intentLabels[link.intent]}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
      
      {showConversionCTA && (
        <Card className="bg-gradient-to-r from-[#C1121F]/10 to-[#C1121F]/5 border-[#C1121F]/20 p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[#E6E9EF] mb-1">
                Ready for a Personalized Program?
              </h3>
              <p className="text-sm text-[#A4ACB8]">
                SpartanLab generates adaptive training programs based on your readiness and goals.
              </p>
            </div>
            <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] text-white flex-shrink-0">
              <Link href="/onboarding">
                Start Training
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </section>
  )
}

/**
 * Calculator-specific CTA that appears after results
 */
export function CalculatorConversionCTA({ 
  skill,
  readinessScore,
  limitingFactor 
}: { 
  skill: SkillSlug
  readinessScore?: number
  limitingFactor?: string 
}) {
  const hub = SKILL_HUBS[skill]
  if (!hub) return null
  
  const isReady = readinessScore && readinessScore >= 70
  
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
      <h3 className="font-semibold text-[#E6E9EF] mb-2">
        {isReady 
          ? `You're Ready to Start ${hub.displayName} Training`
          : `Build Your ${hub.displayName} Foundation`
        }
      </h3>
      
      {limitingFactor && (
        <p className="text-sm text-[#A4ACB8] mb-4">
          {isReady 
            ? `Your ${limitingFactor} is strong. Time to begin skill-specific work.`
            : `Focus on improving your ${limitingFactor} to accelerate progress.`
          }
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] text-white">
          <Link href="/onboarding">
            Generate Personalized Program
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF]">
          <Link href={hub.pages.training}>
            View Training Guide
          </Link>
        </Button>
      </div>
      
      <p className="text-xs text-[#6B7280] mt-4">
        SpartanLab creates adaptive programs that target your specific limiting factors.
      </p>
    </Card>
  )
}

/**
 * Breadcrumb component for SEO pages
 */
export function SkillBreadcrumb({ 
  skill, 
  currentPage,
  currentPageLabel 
}: { 
  skill: SkillSlug
  currentPage: PageIntent
  currentPageLabel: string
}) {
  const hub = SKILL_HUBS[skill]
  if (!hub) return null
  
  return (
    <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6 flex-wrap">
      <Link href="/" className="hover:text-[#E6E9EF] transition-colors">Home</Link>
      <span>/</span>
      <Link href="/skills" className="hover:text-[#E6E9EF] transition-colors">Skills</Link>
      <span>/</span>
      <Link href={hub.hubPath} className="hover:text-[#E6E9EF] transition-colors">{hub.displayName}</Link>
      <span>/</span>
      <span className="text-[#E6E9EF]">{currentPageLabel}</span>
    </nav>
  )
}
