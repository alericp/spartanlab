import Link from 'next/link'
import { ArrowRight, Target, BookOpen, Wrench } from 'lucide-react'
import type { RelatedLink, SkillCluster } from '@/lib/seo/skill-clusters'

interface RelatedContentProps {
  cluster: SkillCluster
  /** Optional: limit items per section */
  maxItems?: number
  /** Optional: show descriptions */
  showDescriptions?: boolean
  /** Optional: custom title */
  title?: string
}

/**
 * RelatedContent component for SEO internal linking
 * Displays related skills, guides, and tools in a clean format
 */
export function RelatedContent({ 
  cluster, 
  maxItems = 4, 
  showDescriptions = true,
  title = 'Related Content'
}: RelatedContentProps) {
  const hasSkills = cluster.relatedSkills.length > 0
  const hasGuides = cluster.relatedGuides.length > 0
  const hasTools = cluster.relatedTools.length > 0

  if (!hasSkills && !hasGuides && !hasTools) {
    return null
  }

  return (
    <section className="py-12 px-4 sm:px-6 border-t border-[#2A2A2A]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-8 text-center">{title}</h2>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Related Skills */}
          {hasSkills && (
            <RelatedSection
              icon={Target}
              title="Related Skills"
              links={cluster.relatedSkills.slice(0, maxItems)}
              showDescriptions={showDescriptions}
            />
          )}

          {/* Related Guides */}
          {hasGuides && (
            <RelatedSection
              icon={BookOpen}
              title="Related Guides"
              links={cluster.relatedGuides.slice(0, maxItems)}
              showDescriptions={showDescriptions}
            />
          )}

          {/* Related Tools */}
          {hasTools && (
            <RelatedSection
              icon={Wrench}
              title="Related Tools"
              links={cluster.relatedTools.slice(0, maxItems)}
              showDescriptions={showDescriptions}
            />
          )}
        </div>
      </div>
    </section>
  )
}

interface RelatedSectionProps {
  icon: typeof Target
  title: string
  links: RelatedLink[]
  showDescriptions: boolean
}

function RelatedSection({ icon: Icon, title, links, showDescriptions }: RelatedSectionProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-5 border border-[#2A2A2A]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#E63946]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#E63946]" />
        </div>
        <h3 className="font-semibold text-sm uppercase tracking-wide text-[#A5A5A5]">
          {title}
        </h3>
      </div>
      
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link 
              href={link.href}
              className="group flex items-start gap-2 hover:text-[#E63946] transition-colors"
            >
              <ArrowRight className="w-4 h-4 mt-0.5 text-[#A5A5A5] group-hover:text-[#E63946] transition-colors flex-shrink-0" />
              <div>
                <span className="text-sm font-medium">{link.title}</span>
                {showDescriptions && link.description && (
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{link.description}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Compact version for inline use
 */
interface RelatedLinksInlineProps {
  links: RelatedLink[]
  label?: string
}

export function RelatedLinksInline({ links, label = 'Related' }: RelatedLinksInlineProps) {
  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-[#6B6B6B]">{label}:</span>
      {links.map((link, index) => (
        <span key={link.href}>
          <Link 
            href={link.href}
            className="text-[#A5A5A5] hover:text-[#E63946] transition-colors"
          >
            {link.title}
          </Link>
          {index < links.length - 1 && <span className="text-[#4A4A4A] ml-2">/</span>}
        </span>
      ))}
    </div>
  )
}

/**
 * Next Steps component for tool pages
 */
interface NextStepsProps {
  cluster: SkillCluster
  title?: string
}

export function NextSteps({ cluster, title = 'Train With This Data' }: NextStepsProps) {
  const allLinks = [
    ...cluster.relatedSkills.slice(0, 2),
    ...cluster.relatedGuides.slice(0, 2),
  ]

  if (allLinks.length === 0) return null

  return (
    <section className="py-10 px-4 sm:px-6 bg-[#1A1A1A] border-t border-[#2A2A2A]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-lg sm:text-xl font-bold mb-6">{title}</h2>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center justify-between p-4 bg-[#0F1115] rounded-lg border border-[#2A2A2A] hover:border-[#E63946]/50 transition-colors"
            >
              <div className="text-left">
                <span className="text-sm font-medium group-hover:text-[#E63946] transition-colors">
                  {link.title}
                </span>
                {link.description && (
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{link.description}</p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#E63946] transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
