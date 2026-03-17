import { Metadata } from 'next'
import { generateFAQSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Planche Lean Calculator | Test Your Lean Strength | SpartanLab',
  description: 'Measure your planche lean strength and see how close you are to harder planche progressions. Enter your lean hold data, distance, and supporting stats to get your result.',
  keywords: [
    'planche lean calculator',
    'planche lean standards',
    'planche lean test',
    'how much should I lean for planche',
    'planche lean progression',
    'planche lean hold',
    'planche lean distance',
    'planche wrist preparation',
    'planche shoulder angle',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/planche-lean-calculator`,
  },
  openGraph: {
    title: 'Planche Lean Calculator | SpartanLab',
    description: 'Test your planche lean capacity and find out how close you are to tuck planche.',
    url: `${SITE_CONFIG.url}/planche-lean-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planche Lean Calculator | SpartanLab',
    description: 'Test your planche lean strength with this free calculator.',
  },
}

const faqData = [
  {
    question: 'How far should I lean for planche?',
    answer: 'A quality planche lean has shoulders significantly past wrists - typically 4-8 inches (10-20cm). Beginners start with 2-4 inches. Advanced practitioners can hold 8-12 inches of lean with control.',
  },
  {
    question: 'How long should I hold a planche lean?',
    answer: 'Start with 10-15 second holds. Progress to 30-60 seconds at moderate lean before increasing distance. Quality lean with 30+ seconds indicates readiness for tuck planche work.',
  },
  {
    question: 'Why do my wrists hurt during planche leans?',
    answer: 'Wrist pain is common with insufficient wrist conditioning. Always warm up wrists thoroughly. Use parallettes to reduce wrist extension. Build lean capacity gradually over weeks/months.',
  },
  {
    question: 'Is planche lean enough to build a planche?',
    answer: 'Planche leans are foundational but not sufficient alone. You also need pseudo planche push-ups, straight-arm strength, and eventually tuck planche holds. Leans develop wrist tolerance and shoulder angle awareness.',
  },
]

const breadcrumbData = [
  { name: 'Home', url: '/' },
  { name: 'Skills', url: '/skills' },
  { name: 'Planche', url: '/skills/planche' },
  { name: 'Lean Calculator', url: '/planche-lean-calculator' },
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
