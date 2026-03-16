import { Metadata } from 'next'
import { generateFAQSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Muscle-Up Readiness Calculator | Check Your Transition Strength | SpartanLab',
  description: 'Calculate your muscle-up readiness based on pull-up strength, dip strength, and explosive power. Find your limiting factors and get personalized training recommendations.',
  keywords: [
    'muscle-up calculator',
    'muscle-up readiness',
    'muscle-up requirements',
    'am I ready for muscle-up',
    'muscle-up test',
    'how many pull-ups for muscle-up',
    'muscle-up prerequisites',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/muscle-up-readiness-calculator`,
  },
  openGraph: {
    title: 'Muscle-Up Readiness Calculator | SpartanLab',
    description: 'Calculate your muscle-up readiness and find out exactly what to train next.',
    url: `${SITE_CONFIG.url}/muscle-up-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muscle-Up Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for muscle-up training with this free calculator.',
  },
}

const faqData = [
  {
    question: 'How many pull-ups do I need for a muscle-up?',
    answer: 'Most athletes need 10-15 strict pull-ups and the ability to do chest-to-bar pull-ups before achieving their first muscle-up. However, explosive power and proper technique matter more than raw pull-up numbers.',
  },
  {
    question: 'Are dips important for muscle-ups?',
    answer: 'Yes, strong dips are essential. You need at least 10-15 straight bar dips to complete the pressing portion of the muscle-up. Weak dips are a common limiting factor for athletes who can pull high but struggle with the transition.',
  },
  {
    question: 'Should I learn bar or ring muscle-ups first?',
    answer: 'Bar muscle-ups are generally easier to learn first because the bar provides a stable reference point. Ring muscle-ups require additional stabilization strength and stricter technique.',
  },
  {
    question: 'How long does it take to learn a muscle-up?',
    answer: 'With adequate pulling and pushing strength, most athletes can achieve their first muscle-up in 2-6 months of dedicated practice. The key is developing explosive high pulls and drilling the transition.',
  },
]

const breadcrumbData = [
  { name: 'Home', url: '/' },
  { name: 'Skills', url: '/skills' },
  { name: 'Muscle Up', url: '/skills/muscle-up' },
  { name: 'Readiness Calculator', url: '/muscle-up-readiness-calculator' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const faqSchema = generateFAQSchema(faqData)
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbData)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  )
}
