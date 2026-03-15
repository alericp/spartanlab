import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { SeoHero } from '@/components/seo/SeoHero'
import { ProgressionLadderCard } from '@/components/seo/ProgressionLadderCard'
import { RelatedFeatureCTA } from '@/components/seo/RelatedFeatureCTA'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { RelatedContent } from '@/components/seo/RelatedContent'
import { ProgressionTable } from '@/components/seo/ProgressionTable'
import { FAQ } from '@/components/seo/FAQ'
import { generateHowToSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'
import { getSkillCluster } from '@/lib/seo/skill-clusters'
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

// Progression table data
const progressionLevels = [
  { level: 'Planche Lean', holdTime: '30-60 seconds', requirement: 'Wrist conditioning', nextGoal: 'Increase lean angle' },
  { level: 'Tuck Planche', holdTime: '10-20 seconds', requirement: 'Basic pushing strength', nextGoal: 'Develop shoulder protraction' },
  { level: 'Advanced Tuck', holdTime: '10-15 seconds', requirement: 'Strong protraction', nextGoal: 'Begin hip extension' },
  { level: 'Straddle Planche', holdTime: '5-10 seconds', requirement: 'Elite shoulder strength', nextGoal: 'Prepare for full planche' },
  { level: 'Full Planche', holdTime: '3-5 seconds', requirement: 'Peak straight-arm strength', nextGoal: 'Extend hold time' },
]

// FAQ data
const faqs = [
  { question: 'How long does it take to learn a planche?', answer: 'A full planche typically takes 2-5 years of dedicated training for most athletes. Tuck planche can be achieved in 6-18 months, while the jump to straddle and full planche represents the longest training periods. Genetics, training consistency, and body weight all significantly impact timeline.' },
  { question: 'Do push-ups help planche training?', answer: 'Regular push-ups have limited carryover to planche. Pseudo planche push-ups (PPPU) with significant forward lean are much more effective as they train the same shoulder angle and protraction pattern. Weighted dips also build relevant pushing strength for planche.' },
  { question: 'Is planche harder than front lever?', answer: 'Yes, for most athletes planche is significantly harder. The full planche requires extreme shoulder extension strength and straight-arm pushing power that takes much longer to develop than the pulling strength for front lever. Most coaches estimate planche takes 2-4x longer than front lever.' },
  { question: 'What are the best planche accessory exercises?', answer: 'The most effective accessories are: pseudo planche push-ups (PPPU), planche leans, maltese press negatives, front lever rows, and weighted dips. Band-assisted planche holds can help learn the body position, but strength must be built through leans and pressing work.' },
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
  generateFAQSchema(faqs),
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
                Strong planche leans, pseudo planche push-ups, and adequate wrist conditioning. Check our <Link href="/calisthenics-strength-standards" className="text-[#C1121F] hover:underline">strength standards</Link> to assess your readiness.
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

      {/* Progression Standards Table */}
      <ProgressionTable 
        title="Planche Progression Standards" 
        levels={progressionLevels} 
      />

      {/* FAQ Section */}
      <FAQ 
        title="Planche FAQ" 
        faqs={faqs} 
        defaultOpen={[0]} 
      />

      {/* Related Feature CTA */}
      <RelatedFeatureCTA
        icon={Target}
        title="Track Your Planche Progress"
        description="Log your current level, set goals, and see estimated timelines to your next progression with SpartanLab's Skill Tracker."
        ctaText="Open Skill Tracker"
        ctaHref="/skills"
      />

      {/* Related Content - SEO Internal Linking */}
      {getSkillCluster('planche') && (
        <RelatedContent 
          cluster={getSkillCluster('planche')!} 
          title="Continue Your Training"
        />
      )}
    </SeoPageLayout>
  )
}
