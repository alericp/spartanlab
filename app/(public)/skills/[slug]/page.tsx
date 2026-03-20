import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSkillConfig, getAllSkillSlugs, SKILL_CONFIGS } from '@/lib/skills/skill-page-config'
import { SkillLandingPage } from '@/components/skills/SkillLandingPage'
import { SITE_CONFIG } from '@/lib/seo'

// =============================================================================
// STATIC PARAMS - Generate all skill pages at build time
// =============================================================================

export async function generateStaticParams() {
  // Get all configured skills from the config system
  const configuredSlugs = getAllSkillSlugs()
  
  // Also include the skills that have dedicated page files
  // (planche, front-lever, muscle-up, handstand-push-up have custom pages)
  // This dynamic route handles: weighted-pull-up, weighted-dip, one-arm-pull-up, back-lever
  
  return configuredSlugs.map((slug) => ({ slug }))
}

// =============================================================================
// METADATA - SEO per skill
// =============================================================================

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const config = getSkillConfig(slug)
  
  if (!config) {
    return {
      title: 'Skill Not Found | SpartanLab',
    }
  }
  
  return {
    title: config.seoTitle,
    description: config.seoDescription,
    keywords: config.keywords,
    alternates: {
      canonical: `${SITE_CONFIG.url}/skills/${slug}`,
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: `${SITE_CONFIG.url}/skills/${slug}`,
      siteName: SITE_CONFIG.name,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.seoTitle,
      description: config.seoDescription,
    },
  }
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function SkillPage({ params }: PageProps) {
  const { slug } = await params
  const config = getSkillConfig(slug)
  
  // If no config found, this slug might have a dedicated page file
  // (planche, front-lever, etc.) - let Next.js handle routing to those
  // For truly unknown slugs, return 404
  if (!config) {
    // Check if it's one of the skills with dedicated pages
    const dedicatedPages = ['planche', 'front-lever', 'muscle-up', 'handstand-push-up']
    if (dedicatedPages.includes(slug)) {
      // This shouldn't happen since those have their own page.tsx files
      // but just in case, redirect would be handled by Next.js routing
      notFound()
    }
    notFound()
  }
  
  return <SkillLandingPage config={config} />
}
