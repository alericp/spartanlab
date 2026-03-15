import { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

/**
 * Robots.txt configuration for SpartanLab
 * Controls search engine crawling behavior
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/guides/',
          '/tools/',
          '/front-lever-progression',
          '/planche-progression',
          '/body-fat-calculator',
          '/weighted-pull-up-calculator',
          '/muscle-up-readiness',
          '/calisthenics-program-builder',
          '/about',
          '/features',
          '/how-it-works',
          '/pricing',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/app',
          '/app/',
          '/onboarding',
          '/onboarding/',
          '/settings',
          '/settings/',
          '/sign-in',
          '/sign-in/',
          '/sign-up',
          '/sign-up/',
          '/api/',
          '/workout/',
          '/program',
          '/today',
          '/week',
          '/workouts',
          '/goals',
          '/skills',
          '/strength',
          '/recovery',
          '/performance',
          '/upgrade',
          '/results',
          '/database',
          '/landing',
          '/guides/testing',
          '/guides/testing/',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  }
}
