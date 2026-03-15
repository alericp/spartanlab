import { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

/**
 * Dynamic sitemap generation for SpartanLab
 * Includes all public pages for search engine indexing
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url
  const currentDate = new Date().toISOString()

  // Static pages with priorities
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage - highest priority
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    
    // High-value skill progression pages
    {
      url: `${baseUrl}/front-lever-progression`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/planche-progression`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    
    // Program builder - key conversion page
    {
      url: `${baseUrl}/calisthenics-program-builder`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // Tools and calculators
    {
      url: `${baseUrl}/body-fat-calculator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/weighted-pull-up-calculator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/muscle-up-readiness`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/front-lever-calculator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/front-lever-strength-test`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/planche-strength-calculator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/pull-up-strength-calculator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    
    // Skill hubs - central educational hubs
    {
      url: `${baseUrl}/skills/front-lever`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/skills/planche`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/skills/muscle-up`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/skills/handstand-push-up`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    
    // Calculators hub and pages
    {
      url: `${baseUrl}/calculators`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/calculators/pull-up-strength-score`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calculators/bodyweight-strength-ratio`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calculators/calisthenics-strength-score`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calculators/skill-readiness-score`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Readiness calculators - interactive SEO pages
    {
      url: `${baseUrl}/front-lever-readiness-calculator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/planche-readiness-calculator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/muscle-up-readiness-calculator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Strength standards - authoritative reference
    {
      url: `${baseUrl}/calisthenics-strength-standards`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    
    // Guides index
    {
      url: `${baseUrl}/guides`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Program template pages - educational workout programs
  const programPages: MetadataRoute.Sitemap = [
    'front-lever-program',
    'planche-program',
    'muscle-up-program',
    'handstand-push-up-program',
    'calisthenics-beginner-program',
  ].map(slug => ({
    url: `${baseUrl}/programs/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  // Exercise pages - individual exercise guides
  const exercisePages: MetadataRoute.Sitemap = [
    'pull-up',
    'dip',
    'front-lever-row',
    'hollow-body-hold',
    'l-sit',
    'arch-hang',
    'pseudo-planche-push-up',
  ].map(slug => ({
    url: `${baseUrl}/exercises/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Guide pages - comprehensive training guides
  const guidePages: MetadataRoute.Sitemap = [
    'front-lever-training',
    'planche-progression',
    'muscle-up-training',
    'handstand-training',
    'handstand-push-up-progression',
    'back-lever-training',
    'iron-cross-training',
    'one-arm-pull-up-training',
    'weighted-pull-up-training',
    'weighted-dip-training',
    'pull-up-endurance-training',
    'skill-cycles-guide',
    'training-phases-guide',
    'military-fitness-prep',
    'marine-pft-prep',
    'six-pack-abs-training',
    'flexibility-vs-mobility',
    'front-splits-flexibility',
    'side-splits-flexibility',
    'pancake-flexibility',
    'pancake-mobility',
    'splits-mobility',
    'toe-touch-flexibility',
  ].map(slug => ({
    url: `${baseUrl}/guides/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Marketing and info pages
  const infoPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  return [...staticPages, ...programPages, ...exercisePages, ...guidePages, ...infoPages]
}
