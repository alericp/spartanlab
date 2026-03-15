/**
 * SpartanLab SEO Infrastructure
 * Centralized metadata generation for consistent SEO across all pages
 */

import type { Metadata } from 'next'

// =============================================================================
// SITE CONFIGURATION
// =============================================================================

export const SITE_CONFIG = {
  name: 'SpartanLab',
  tagline: 'Calisthenics Training Intelligence System',
  description: 'Stop guessing your calisthenics training. SpartanLab analyzes your progress, finds your limiters, and tells you exactly what to train next.',
  url: 'https://spartanlab.app',
  defaultImage: '/og-default.png',
  twitterHandle: '@spartanlabapp',
  author: 'SpartanLab',
} as const

// =============================================================================
// METADATA GENERATION TYPES
// =============================================================================

export interface SEOMetadataParams {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  keywords?: string[]
  noIndex?: boolean
}

export interface ArticleMetadataParams extends SEOMetadataParams {
  type: 'article'
  publishedTime: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

export interface SkillPageMetadataParams {
  skillName: string
  skillSlug: string
  description: string
  keywords?: string[]
}

export interface GuideMetadataParams {
  title: string
  slug: string
  description: string
  category?: string
  publishedDate?: string
  keywords?: string[]
}

export interface ToolMetadataParams {
  toolName: string
  toolSlug: string
  description: string
  keywords?: string[]
}

// =============================================================================
// CORE METADATA GENERATORS
// =============================================================================

/**
 * Generate standardized metadata for any page
 */
export function generateSEOMetadata(params: SEOMetadataParams): Metadata {
  const {
    title,
    description,
    path = '',
    image = SITE_CONFIG.defaultImage,
    type = 'website',
    publishedTime,
    modifiedTime,
    keywords = [],
    noIndex = false,
  } = params

  const canonicalUrl = `${SITE_CONFIG.url}${path}`
  const fullTitle = title.includes('SpartanLab') ? title : `${title} | ${SITE_CONFIG.name}`
  const imageUrl = image.startsWith('http') ? image : `${SITE_CONFIG.url}${image}`

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: [{ name: SITE_CONFIG.author }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
    
    // OpenGraph
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: type === 'article' ? 'article' : 'website',
      ...(type === 'article' && publishedTime && {
        publishedTime,
        modifiedTime: modifiedTime || publishedTime,
        authors: [SITE_CONFIG.author],
      }),
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: SITE_CONFIG.twitterHandle,
      site: SITE_CONFIG.twitterHandle,
    },
    
    // Robots
    robots: noIndex 
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }

  return metadata
}

/**
 * Generate metadata for skill progression pages (Front Lever, Planche, etc.)
 */
export function generateSkillPageMetadata(params: SkillPageMetadataParams): Metadata {
  const { skillName, skillSlug, description, keywords = [] } = params
  
  const defaultKeywords = [
    skillName.toLowerCase(),
    `${skillName.toLowerCase()} progression`,
    `${skillName.toLowerCase()} training`,
    `${skillName.toLowerCase()} tutorial`,
    'calisthenics',
    'bodyweight training',
    'street workout',
  ]

  return generateSEOMetadata({
    title: `${skillName} Progression Guide`,
    description,
    path: `/${skillSlug}`,
    keywords: [...defaultKeywords, ...keywords],
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  })
}

/**
 * Generate metadata for guide pages
 */
export function generateGuideMetadata(params: GuideMetadataParams): Metadata {
  const { title, slug, description, category, publishedDate, keywords = [] } = params
  
  const defaultKeywords = [
    'calisthenics guide',
    'training guide',
    'workout guide',
    category?.toLowerCase() || 'fitness',
  ]

  return generateSEOMetadata({
    title,
    description,
    path: `/guides/${slug}`,
    keywords: [...defaultKeywords, ...keywords],
    type: 'article',
    publishedTime: publishedDate || '2024-01-01T00:00:00Z',
  })
}

/**
 * Generate metadata for tool/calculator pages
 */
export function generateToolMetadata(params: ToolMetadataParams): Metadata {
  const { toolName, toolSlug, description, keywords = [] } = params
  
  const defaultKeywords = [
    toolName.toLowerCase(),
    'calculator',
    'fitness calculator',
    'calisthenics tool',
    'free tool',
  ]

  return generateSEOMetadata({
    title: toolName,
    description,
    path: `/${toolSlug}`,
    keywords: [...defaultKeywords, ...keywords],
  })
}

// =============================================================================
// JSON-LD STRUCTURED DATA GENERATORS
// =============================================================================

export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    description: SITE_CONFIG.description,
    sameAs: [
      `https://twitter.com/${SITE_CONFIG.twitterHandle.replace('@', '')}`,
    ],
  }
}

/**
 * Generate WebSite JSON-LD schema
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Generate Article JSON-LD schema for guide pages
 */
export function generateArticleSchema(params: {
  title: string
  description: string
  url: string
  image?: string
  publishedDate: string
  modifiedDate?: string
  author?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    image: params.image || `${SITE_CONFIG.url}${SITE_CONFIG.defaultImage}`,
    url: params.url,
    datePublished: params.publishedDate,
    dateModified: params.modifiedDate || params.publishedDate,
    author: {
      '@type': 'Organization',
      name: params.author || SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
  }
}

/**
 * Generate HowTo JSON-LD schema for progression guides
 */
export function generateHowToSchema(params: {
  name: string
  description: string
  url: string
  steps: { name: string; description: string }[]
  totalTime?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: params.name,
    description: params.description,
    url: params.url,
    ...(params.totalTime && { totalTime: params.totalTime }),
    step: params.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.description,
    })),
  }
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  }
}

/**
 * Generate FAQ JSON-LD schema
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate SoftwareApplication JSON-LD schema for the app
 */
export function generateSoftwareSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }
}

// =============================================================================
// PAGE-SPECIFIC METADATA PRESETS
// =============================================================================

export const PAGE_METADATA = {
  home: generateSEOMetadata({
    title: 'SpartanLab - Calisthenics Training Decision Engine',
    description: 'Stop guessing your calisthenics training. SpartanLab analyzes your progress, finds your limiters, and tells you exactly what to train next. Like having a coach analyzing your training 24/7.',
    path: '/',
  }),
  
  programBuilder: generateSEOMetadata({
    title: 'Calisthenics Program Builder',
    description: 'Build your personalized calisthenics training program. Get adaptive workouts based on your skill level, goals, and available equipment. Free program generator.',
    path: '/calisthenics-program-builder',
    keywords: ['calisthenics program', 'workout generator', 'training program', 'bodyweight workout'],
  }),
  
  frontLever: generateSkillPageMetadata({
    skillName: 'Front Lever',
    skillSlug: 'front-lever-progression',
    description: 'Master the front lever with this complete progression guide. From tuck to full front lever, understand each stage and what determines readiness.',
  }),
  
  planche: generateSkillPageMetadata({
    skillName: 'Planche',
    skillSlug: 'planche-progression',
    description: 'Complete planche progression guide. Learn the path from planche lean to full planche with proper form, prerequisites, and training methodology.',
  }),
  
  bodyFatCalculator: generateToolMetadata({
    toolName: 'Body Fat Calculator (U.S. Navy Method)',
    toolSlug: 'body-fat-calculator',
    description: 'Calculate your body fat percentage using the accurate U.S. Navy circumference method. Free body fat calculator with measurement instructions for men and women.',
    keywords: ['body fat calculator', 'navy body fat formula', 'body fat percentage'],
  }),
  
  guides: generateSEOMetadata({
    title: 'Calisthenics Training Guides',
    description: 'Comprehensive guides for calisthenics skills, progressions, and training methodology. From beginner to advanced, find structured paths to your goals.',
    path: '/guides',
    keywords: ['calisthenics guides', 'training guides', 'skill progressions', 'workout guides'],
  }),
  
  tools: generateSEOMetadata({
    title: 'Free Calisthenics Tools & Calculators',
    description: 'Free fitness calculators and tools for calisthenics athletes. Body fat calculator, strength tests, skill readiness assessments, and more.',
    path: '/tools',
    keywords: ['fitness calculator', 'calisthenics tools', 'strength calculator', 'workout tools'],
  }),
  
  pricing: generateSEOMetadata({
    title: 'Pricing - SpartanLab Pro',
    description: 'Upgrade to SpartanLab Pro for advanced analytics, personalized coaching insights, and unlimited program customization. Start your 7-day free trial - cancel anytime.',
    path: '/pricing',
    noIndex: false,
  }),
  
  about: generateSEOMetadata({
    title: 'About SpartanLab',
    description: 'Learn about SpartanLab - the calisthenics training intelligence system built by athletes, for athletes. Our mission is to make expert-level training accessible to everyone.',
    path: '/about',
  }),
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format page title with site name
 */
export function formatPageTitle(title: string): string {
  if (title.includes(SITE_CONFIG.name)) {
    return title
  }
  return `${title} | ${SITE_CONFIG.name}`
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_CONFIG.url}${cleanPath}`
}

/**
 * Truncate description to optimal SEO length
 */
export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3).trim() + '...'
}
