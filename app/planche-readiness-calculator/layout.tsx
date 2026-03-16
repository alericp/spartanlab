import { Metadata } from 'next'
import { generateFAQSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Planche Readiness Calculator | Check Your Pushing Strength | SpartanLab',
  description: 'Calculate your planche readiness based on pushing strength, dip strength, and planche lean ability. Find your limiting factors and get personalized training recommendations.',
  keywords: [
    'planche calculator',
    'planche readiness',
    'planche requirements',
    'am I ready for planche',
    'planche test',
    'planche prerequisites',
    'how strong for planche',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/planche-readiness-calculator`,
  },
  openGraph: {
    title: 'Planche Readiness Calculator | SpartanLab',
    description: 'Calculate your planche readiness and find out exactly what to train next.',
    url: `${SITE_CONFIG.url}/planche-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planche Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for planche training with this free calculator.',
  },
}

const faqData = [
  {
    question: 'How long does it take to learn a planche?',
    answer: 'A full planche typically takes 2-5 years of dedicated training. Tuck planche can be achieved in 1-2 years for most athletes. Body weight, limb length, and training consistency significantly affect the timeline.',
  },
  {
    question: 'Do push-ups help planche training?',
    answer: 'Standard push-ups have limited carryover to planche. Pseudo planche push-ups (PPPU) with significant forward lean are much more effective as they train the specific shoulder angle required.',
  },
  {
    question: 'Is planche harder than front lever?',
    answer: 'Yes, for most athletes planche is significantly harder. The straight-arm pushing strength required takes much longer to develop. Most coaches estimate planche takes 2-4x longer than front lever to achieve.',
  },
  {
    question: 'Can I train planche as a beginner?',
    answer: 'You can start planche lean work once you have 20+ push-ups and 10+ dips. Focus on wrist conditioning first - planche puts extreme stress on the wrists. Start with modest leans and progress slowly.',
  },
]

const breadcrumbData = [
  { name: 'Home', url: '/' },
  { name: 'Skills', url: '/skills' },
  { name: 'Planche', url: '/skills/planche' },
  { name: 'Readiness Calculator', url: '/planche-readiness-calculator' },
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
