import { Metadata } from 'next'
import { generateFAQSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Front Lever Readiness Calculator | Check Your Strength | SpartanLab',
  description: 'Calculate your front lever readiness based on pull-up strength, weighted pull-ups, and core compression. Find your limiting factors and get personalized training recommendations.',
  keywords: [
    'front lever calculator',
    'front lever readiness',
    'front lever requirements',
    'am I ready for front lever',
    'front lever test',
    'how many pull-ups for front lever',
    'front lever strength requirements',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/front-lever-readiness-calculator`,
  },
  openGraph: {
    title: 'Front Lever Readiness Calculator | SpartanLab',
    description: 'Calculate your front lever readiness and find out exactly what to train next.',
    url: `${SITE_CONFIG.url}/front-lever-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Front Lever Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for front lever training with this free calculator.',
  },
}

const faqData = [
  {
    question: 'How many pull-ups do I need for front lever?',
    answer: 'Most athletes achieve their first tuck front lever with 8-12 strict pull-ups. For advanced progressions like straddle or full front lever, you typically need 15-20 pull-ups AND weighted pull-ups with +50lb or more.',
  },
  {
    question: 'Why does weighted pull-up strength matter for front lever?',
    answer: 'Weighted pull-ups build the specific strength needed to hold your body horizontal against gravity. The correlation between weighted pull-up strength (+50-70lb added) and front lever achievement is very strong.',
  },
  {
    question: 'Can I train front lever as a beginner?',
    answer: 'You can start tuck front lever once you have 8+ strict pull-ups and a 30+ second hollow hold. The tuck variation is accessible and builds specific strength toward harder progressions.',
  },
  {
    question: 'How accurate is the front lever readiness calculator?',
    answer: 'This calculator uses rule-based thresholds derived from common training benchmarks. It provides a useful estimate, but individual factors like body composition, limb length, and training history affect actual readiness.',
  },
]

const breadcrumbData = [
  { name: 'Home', url: '/' },
  { name: 'Skills', url: '/skills' },
  { name: 'Front Lever', url: '/skills/front-lever' },
  { name: 'Readiness Calculator', url: '/front-lever-readiness-calculator' },
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
