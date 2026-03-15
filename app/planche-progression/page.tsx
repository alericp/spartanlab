import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { SeoHero } from '@/components/seo/SeoHero'
import { ProgressionLadderCard } from '@/components/seo/ProgressionLadderCard'
import { RelatedFeatureCTA } from '@/components/seo/RelatedFeatureCTA'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateHowToSchema, generateBreadcrumbSchema, generateArticleSchema, SITE_CONFIG } from '@/lib/seo'
import { Target, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Planche Progression Guide | SpartanLab',
  description: 'Learn the complete planche progression ladder from tuck to full planche. Understand each stage, common mistakes, and how to track your progress.',
  keywords: ['planche', 'planche progression', 'planche tutorial', 'calisthenics', 'bodyweight training', 'push exercises'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/planche-progression`,
  },
  openGraph: {
    title: 'Planche Progression Guide | SpartanLab',
    description: 'Learn the complete planche progression ladder from tuck to full planche. Understand each stage and common mistakes.',
    url: `${SITE_CONFIG.url}/planche-progression`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planche Progression Guide | SpartanLab',
    description: 'Learn the complete planche progression from tuck to full planche.',
  },
}

const plancheSteps = [
  {
    name: 'Tuck Planche',
    description: 'Knees tucked to chest, back parallel to ground. Build foundational shoulder strength and balance.',
    difficulty: 'beginner' as const,
  },
  {
    name: 'Advanced Tuck Planche',
    description: 'Back becomes more horizontal, hips open slightly. Requires significantly more shoulder protraction strength.',
    difficulty: 'intermediate' as const,
  },
  {
    name: 'Straddle Planche',
    description: 'Legs extend outward in a straddle position. Major leap in difficulty requiring elite shoulder and core strength.',
    difficulty: 'advanced' as const,
  },
  {
    name: 'Full Planche',
    description: 'Legs fully extended together, body completely horizontal. Peak calisthenics achievement requiring years of dedicated training.',
    difficulty: 'elite' as const,
  },
]

const commonMistakes = [
  {
    title: 'Insufficient Lean',
    description: 'Not leaning forward enough to properly load the shoulders.',
  },
  {
    title: 'Bent Arms',
    description: 'Allowing the elbows to bend rather than maintaining straight arm strength.',
  },
  {
    title: 'Rushing Progressions',
    description: 'Moving to harder variations before building adequate hold time at current level.',
  },
  {
    title: 'Ignoring Protraction',
    description: 'Failing to maintain shoulder protraction throughout the hold.',
  },
]

// JSON-LD structured data
const jsonLdSchemas = [
  generateHowToSchema({
    name: 'Planche Progression Guide',
    description: 'Learn the complete planche progression ladder from tuck to full planche.',
    url: `${SITE_CONFIG.url}/planche-progression`,
    steps: [
      { name: 'Tuck Planche', description: 'Knees tucked to chest, back parallel to ground. Build foundational shoulder strength and balance.' },
      { name: 'Advanced Tuck Planche', description: 'Back becomes more horizontal, hips open slightly. Requires significantly more shoulder protraction strength.' },
      { name: 'Straddle Planche', description: 'Legs extend outward in a straddle position. Major leap in difficulty requiring elite shoulder and core strength.' },
      { name: 'Full Planche', description: 'Legs fully extended together, body completely horizontal. Peak calisthenics achievement.' },
    ],
    totalTime: 'P2Y',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Planche Progression', url: '/planche-progression' },
  ]),
]

export default function PlancheProgressionPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      <SeoHero
        title="The Complete Planche Progression Ladder"
        subtitle="Master one of calisthenics' most impressive skills. Understand each stage, what determines readiness, and how to track your progress systematically."
        ctaText="Track Your Progress"
        ctaHref="/skills"
        secondaryCtaText="View All Features"
        secondaryCtaHref="/features"
      />

      {/* Progression Ladder */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <ProgressionLadderCard title="Planche Progression Stages" steps={plancheSteps} />
        </div>
      </section>

      {/* Readiness Indicators */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">How to Know You're Ready</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-5 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Hold Time</h3>
              <p className="text-sm text-[#A5A5A5]">
                Aim for 10-15 second holds with good form before progressing to the next variation.
              </p>
            </div>
            <div className="p-5 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Form Quality</h3>
              <p className="text-sm text-[#A5A5A5]">
                Straight arms, protracted shoulders, and consistent body line are non-negotiable.
              </p>
            </div>
            <div className="p-5 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Consistency</h3>
              <p className="text-sm text-[#A5A5A5]">
                Multiple clean sets across different training sessions, not just one lucky hold.
              </p>
            </div>
            <div className="p-5 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Prerequisite Strength</h3>
              <p className="text-sm text-[#A5A5A5]">
                Strong planche leans, pseudo planche push-ups, and adequate wrist conditioning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-[#E63946]" />
            <h2 className="text-2xl font-bold">Common Mistakes to Avoid</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {commonMistakes.map((mistake) => (
              <div key={mistake.title} className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <h3 className="font-semibold mb-2">{mistake.title}</h3>
                <p className="text-sm text-[#A5A5A5]">{mistake.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Feature CTA */}
      <RelatedFeatureCTA
        icon={Target}
        title="Track Your Planche Progress"
        description="Log your current level, set goals, and see estimated timelines to your next progression with SpartanLab's Skill Tracker."
        ctaText="Open Skill Tracker"
        ctaHref="/skills"
      />

      {/* Internal Links */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/front-lever-progression">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Front Lever Progression
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Platform Features
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                See Pricing
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
