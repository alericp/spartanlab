import { Metadata } from 'next'
import { generateFAQSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Iron Cross Readiness Calculator | Test Your Ring Strength | SpartanLab',
  description: 'Test if you have the strength required to begin Iron Cross training. Enter your ring support, dip strength, and shoulder stability to see your readiness score and what to train next.',
  keywords: [
    'iron cross calculator',
    'iron cross readiness',
    'iron cross requirements',
    'iron cross strength test',
    'am I ready for iron cross',
    'how strong for iron cross',
    'iron cross prerequisites',
    'iron cross benchmark',
    'ring strength requirements',
    'iron cross rings training',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/iron-cross-readiness-calculator`,
  },
  openGraph: {
    title: 'Iron Cross Readiness Calculator | SpartanLab',
    description: 'Calculate your Iron Cross readiness and find out exactly what to train next.',
    url: `${SITE_CONFIG.url}/iron-cross-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Iron Cross Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for Iron Cross training with this free calculator.',
  },
}

const faqData = [
  {
    question: 'How strong do I need to be for Iron Cross?',
    answer: 'The Iron Cross requires exceptional ring support strength (60+ second RTO hold), advanced straight-arm pressing strength, and years of tendon conditioning. Most athletes need weighted dips of +50-70% bodyweight and mastery of skills like RTO dips and support holds before attempting Cross work.',
  },
  {
    question: 'Why is tendon tolerance important for Iron Cross?',
    answer: 'The Iron Cross places extreme stress on the biceps tendons and shoulder joints. Unlike muscle strength which can develop quickly, tendon strength adapts slowly over years. Rushing into Cross training without adequate tendon preparation is a common cause of serious injury.',
  },
  {
    question: 'What is RTO support and why does it matter?',
    answer: 'RTO (Rings Turned Out) support means holding a support position on rings with your palms facing forward. This position requires significantly more shoulder stability and strength than neutral ring support, and directly prepares the joint angles used in the Cross.',
  },
  {
    question: 'How accurate is this Iron Cross calculator?',
    answer: 'This calculator uses rule-based thresholds derived from common training benchmarks for advanced ring work. It provides a useful estimate, but the Iron Cross is highly individual - factors like limb length, body composition, and training history significantly affect actual readiness.',
  },
]

const breadcrumbData = [
  { name: 'Home', url: '/' },
  { name: 'Skills', url: '/skills' },
  { name: 'Iron Cross', url: '/skills/iron-cross' },
  { name: 'Readiness Calculator', url: '/iron-cross-readiness-calculator' },
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
