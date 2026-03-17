import { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

/**
 * Robots.txt configuration for SpartanLab
 * Controls search engine crawling behavior
 * 
 * PUBLIC SEO PAGES (allowed):
 * - Homepage, marketing pages (pricing, about, features, how-it-works)
 * - Guides, exercises, programs (educational content)
 * - Skill hub pages (/skills/front-lever, /skills/planche, etc.)
 * - Calculators (/calculators/*, readiness calculators)
 * - Progression pages, strength standards
 * 
 * PRIVATE APP PAGES (blocked):
 * - Dashboard, settings, onboarding
 * - Auth pages (sign-in, sign-up)
 * - User-specific data pages (results, workout sessions)
 * - API routes
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          // Marketing pages
          '/about',
          '/features',
          '/how-it-works',
          '/pricing',
          '/terms',
          '/privacy',
          // Educational content
          '/guides/',
          '/exercises/',
          '/programs/',
          // Skill hubs (public educational pages)
          '/skills/front-lever',
          '/skills/planche',
          '/skills/muscle-up',
          '/skills/handstand-push-up',
          // Progression pages
          '/front-lever-progression',
          '/planche-progression',
          '/calisthenics-strength-standards',
          // Calculators hub and pages
          '/calculators/',
          '/calculators/pull-up-strength-score',
          '/calculators/bodyweight-strength-ratio',
          '/calculators/calisthenics-strength-score',
          '/calculators/skill-readiness-score',
          // Readiness calculators
          '/front-lever-readiness-calculator',
          '/planche-readiness-calculator',
          '/muscle-up-readiness-calculator',
          // Tools and calculators
          '/body-fat-calculator',
          '/weighted-pull-up-calculator',
          '/calisthenics-program-builder',
          '/tools/',
          // Training hub and program pages
          '/training/',
          '/training-systems',
          // Strength standards pages
          '/weighted-pull-up-strength-standards',
          '/weighted-dip-strength-standards',
          '/pull-up-strength-standards',
          '/dip-strength-standards',
          '/push-up-strength-standards',
          // Additional readiness calculators
          '/hspu-readiness-calculator',
          '/iron-cross-readiness-calculator',
          // Protocols (joint health content)
          '/protocols/',
          // Strength requirements pages (high-intent skill prerequisites)
          '/planche-strength-requirements',
          '/front-lever-strength-requirements',
          '/muscle-up-strength-requirements',
          '/hspu-strength-requirements',
        ],
        disallow: [
          // App/private pages - user-specific content
          '/dashboard',
          '/dashboard/',
          '/onboarding',
          '/onboarding/',
          '/settings',
          '/settings/',
          '/upgrade',
          '/upgrade/',
          // Auth pages
          '/sign-in',
          '/sign-in/',
          '/sign-up',
          '/sign-up/',
          // User workflow pages
          '/workout/',
          '/program',
          '/today',
          '/week',
          '/workouts',
          '/goals',
          '/strength',
          '/recovery',
          '/performance',
          '/results',
          // Private skills tracker (different from /skills/*)
          '/skills$',
          // API and system routes
          '/api/',
          '/database',
          '/landing',
          // Testing pages
          '/guides/testing',
          '/guides/testing/',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  }
}
