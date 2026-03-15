import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { SeoHero } from '@/components/seo/SeoHero'
import { ProgressionLadderCard } from '@/components/seo/ProgressionLadderCard'
import { RelatedFeatureCTA } from '@/components/seo/RelatedFeatureCTA'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { RelatedContent } from '@/components/seo/RelatedContent'
import { ProgressionTable } from '@/components/seo/ProgressionTable'
import { CommonMistakes } from '@/components/seo/CommonMistakes'
import { FAQ } from '@/components/seo/FAQ'
import { generateHowToSchema, generateBreadcrumbSchema, generateArticleSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'
import { Target, Dumbbell, ArrowRight, Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Muscle-Up Progression Guide | Learn the Muscle-Up | SpartanLab',
  description: 'Master the muscle-up with this complete progression guide. From pull-ups to explosive muscle-ups, learn each stage, prerequisites, and common mistakes.',
  keywords: ['muscle-up', 'muscle-up progression', 'muscle-up tutorial', 'how to muscle-up', 'calisthenics', 'bar muscle-up', 'ring muscle-up'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/muscle-up-progression`,
  },
  openGraph: {
    title: 'Muscle-Up Progression Guide | SpartanLab',
    description: 'Master the muscle-up with this complete progression guide. From pull-ups to explosive muscle-ups.',
    url: `${SITE_CONFIG.url}/muscle-up-progression`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muscle-Up Progression Guide | SpartanLab',
    description: 'Master the muscle-up with this complete progression guide.',
  },
}

const muscleUpSteps = [
  {
    name: 'High Pull-Ups',
    description: 'Pull explosively to bring chest to bar height. Foundation for generating the power needed for transition.',
    difficulty: 'beginner' as const,
  },
  {
    name: 'Chest-to-Bar Pull-Ups',
    description: 'Pull until chest touches the bar. Builds the pulling power and range of motion required.',
    difficulty: 'intermediate' as const,
  },
  {
    name: 'Negative Muscle-Ups',
    description: 'Jump to the top position and slowly lower through the transition. Builds strength in the weak range.',
    difficulty: 'intermediate' as const,
  },
  {
    name: 'Assisted Muscle-Up',
    description: 'Use bands or a small jump to complete the movement. Practice the full motion with assistance.',
    difficulty: 'advanced' as const,
  },
  {
    name: 'Strict Muscle-Up',
    description: 'Full muscle-up with controlled technique. The ultimate demonstration of pulling power and transition skill.',
    difficulty: 'elite' as const,
  },
]

const keyFactors = [
  {
    icon: Dumbbell,
    title: 'Explosive Pulling Power',
    description: 'The muscle-up requires explosive strength to generate momentum through the transition.',
  },
  {
    icon: Zap,
    title: 'Transition Technique',
    description: 'The hardest part - rotating around the bar from below to above requires specific practice.',
  },
  {
    icon: Target,
    title: 'Straight Bar Dips',
    description: 'Strong dips on a straight bar are essential for the pressing portion of the muscle-up.',
  },
]

// Progression table data
const progressionLevels = [
  { level: 'High Pull-Ups', holdTime: '8-10 reps', requirement: 'Explosive pulling power', nextGoal: 'Touch chest to bar' },
  { level: 'Chest-to-Bar', holdTime: '8-10 reps', requirement: 'Full range pulling', nextGoal: 'Add negative muscle-ups' },
  { level: 'Negative Muscle-Ups', holdTime: '5-8 reps', requirement: 'Transition strength', nextGoal: 'Attempt assisted muscle-ups' },
  { level: 'Assisted Muscle-Up', holdTime: '3-5 reps', requirement: 'Full movement pattern', nextGoal: 'Reduce assistance gradually' },
  { level: 'Strict Muscle-Up', holdTime: '1-3 reps', requirement: 'Complete skill mastery', nextGoal: 'Build volume and consistency' },
]

// Common mistakes
const commonMistakes = [
  { title: 'Insufficient Pull-Up Strength', description: 'Attempting muscle-ups before having 10-12 strict pull-ups. Build the foundation first.' },
  { title: 'Pulling Straight Up', description: 'The bar must travel in an arc. Pull back slightly to create the path for the transition.' },
  { title: 'Chicken Wing Transition', description: 'Going over one arm at a time. Practice keeping elbows even during the transition.' },
  { title: 'Weak Straight Bar Dips', description: 'Unable to press out of the transition. Train straight bar dips separately.' },
  { title: 'Skipping Negatives', description: 'Negatives build the specific transition strength. Do not skip this progression.' },
]

// Strength requirements
const strengthRequirements = [
  { metric: 'Strict Pull-Ups', minimum: '10-12 reps', ideal: '15+ reps', notes: 'Foundation for explosive pulling' },
  { metric: 'Chest-to-Bar Pull-Ups', minimum: '5-8 reps', ideal: '10+ reps', notes: 'Required range of motion' },
  { metric: 'Weighted Pull-Ups', minimum: '+20% BW', ideal: '+35% BW', notes: 'Indicates power capacity' },
  { metric: 'Straight Bar Dips', minimum: '10 reps', ideal: '15+ reps', notes: 'For pressing out of transition' },
]

// FAQ data
const faqs = [
  { question: 'How many pull-ups do I need for a muscle-up?', answer: 'Most athletes need 10-12 strict pull-ups as a minimum, with the ability to do chest-to-bar pull-ups explosively. Having 15+ pull-ups with weighted capacity (+25-35% BW) makes the muscle-up significantly easier to achieve.' },
  { question: 'How long does it take to learn a muscle-up?', answer: 'If you already have 10+ pull-ups, most athletes achieve their first muscle-up in 2-6 months of focused training. The key is developing explosive pulling power and practicing the transition specifically, not just building more pull-up strength.' },
  { question: 'Should I learn bar muscle-up or ring muscle-up first?', answer: 'Bar muscle-ups are generally easier to learn first because the bar is stable. Ring muscle-ups require additional stability and a different transition technique. Master bar muscle-ups before progressing to rings.' },
  { question: 'Why can I do 15 pull-ups but not a muscle-up?', answer: 'Pull-up strength does not directly equal muscle-up ability. Muscle-ups require explosive power (not just strength), a specific transition technique, and straight bar dip strength. Train high pulls, chest-to-bar, and negatives specifically.' },
  { question: 'What is the hardest part of the muscle-up?', answer: 'The transition - the moment you rotate from below the bar to above it - is the hardest part. This is where most athletes fail. Negative muscle-ups and assisted practice specifically target this weak point.' },
]

// JSON-LD structured data for rich search results
const jsonLdSchemas = [
  generateHowToSchema({
    name: 'Muscle-Up Progression Guide',
    description: 'Learn the muscle-up with this complete progression guide. Progress from pull-ups to strict muscle-ups.',
    url: `${SITE_CONFIG.url}/muscle-up-progression`,
    steps: [
      { name: 'High Pull-Ups', description: 'Pull explosively to bring chest to bar height. Foundation for generating power.' },
      { name: 'Chest-to-Bar Pull-Ups', description: 'Pull until chest touches the bar. Builds pulling power and range of motion.' },
      { name: 'Negative Muscle-Ups', description: 'Jump to top position and lower slowly through transition. Builds transition strength.' },
      { name: 'Assisted Muscle-Up', description: 'Use bands or small jump to complete movement. Practice full motion with assistance.' },
      { name: 'Strict Muscle-Up', description: 'Full muscle-up with controlled technique. Ultimate demonstration of skill.' },
    ],
    totalTime: 'P6M',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Muscle-Up Hub', url: '/skills/muscle-up' },
    { name: 'Progression Guide', url: '/muscle-up-progression' },
  ]),
  generateArticleSchema({
    title: 'Muscle-Up Progression Guide',
    description: 'Master the muscle-up with this complete progression guide.',
    url: `${SITE_CONFIG.url}/muscle-up-progression`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateFAQSchema(faqs),
]

export default function MuscleUpProgressionPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      <SeoHero
        title="Muscle-Up Progression Guide"
        subtitle="Master the muscle-up - one of the most impressive calisthenics skills. Learn the explosive pulling power and transition technique needed to get over the bar."
        ctaText="Check Your Readiness"
        ctaHref="/muscle-up-readiness-calculator"
        secondaryCtaText="Back to Muscle-Up Hub"
        secondaryCtaHref="/skills/muscle-up"
      />

      {/* Progression Ladder */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Muscle-Up Progression Ladder</h2>
          <div className="space-y-4">
            {muscleUpSteps.map((step, index) => (
              <ProgressionLadderCard
                key={step.name}
                step={index + 1}
                name={step.name}
                description={step.description}
                difficulty={step.difficulty}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Key Factors */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">What Makes a Muscle-Up Possible</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {keyFactors.map((factor) => (
              <Card key={factor.title} className="p-6 bg-[#1A1A1A] border-[#2A2A2A]">
                <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mb-4">
                  <factor.icon className="w-6 h-6 text-[#C1121F]" />
                </div>
                <h3 className="font-semibold mb-2 text-[#E6E9EF]">{factor.title}</h3>
                <p className="text-sm text-[#A5A5A5]">{factor.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Strength Requirements */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Strength Requirements</h2>
          <p className="text-[#A5A5A5] mb-6">
            Before attempting muscle-ups, ensure you meet these baseline strength requirements.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#A5A5A5]">Metric</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#A5A5A5]">Minimum</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#A5A5A5]">Ideal</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#A5A5A5] hidden sm:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {strengthRequirements.map((req) => (
                  <tr key={req.metric} className="border-b border-[#2A2A2A]/50">
                    <td className="py-3 px-4 font-medium text-[#E6E9EF]">{req.metric}</td>
                    <td className="py-3 px-4 text-yellow-400">{req.minimum}</td>
                    <td className="py-3 px-4 text-green-400">{req.ideal}</td>
                    <td className="py-3 px-4 text-sm text-[#A5A5A5] hidden sm:table-cell">{req.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Progression Table */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Progression Milestones</h2>
          <ProgressionTable levels={progressionLevels} />
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Common Mistakes
          </h2>
          <CommonMistakes mistakes={commonMistakes} />
        </div>
      </section>

      {/* Readiness Calculator CTA */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <RelatedFeatureCTA
            title="Check Your Muscle-Up Readiness"
            description="Enter your current strength metrics and find out if you are ready to start muscle-up training."
            ctaText="Use Readiness Calculator"
            ctaHref="/muscle-up-readiness-calculator"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <FAQ questions={faqs} />
        </div>
      </section>

      {/* Related Content */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
          <RelatedContent
            items={[
              { title: 'Muscle-Up Training Guide', href: '/guides/muscle-up-training', description: 'Complete training guide with workouts' },
              { title: 'Pull-Up Strength Standards', href: '/pull-up-strength-standards', description: 'Know your pulling strength level' },
              { title: 'How Many Pull-Ups for Front Lever?', href: '/how-many-pull-ups-for-front-lever', description: 'Related pulling skill requirements' },
              { title: 'Muscle-Up Readiness Calculator', href: '/muscle-up-readiness-calculator', description: 'Check if you are ready' },
            ]}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Train for the Muscle-Up?</h2>
          <p className="text-[#A5A5A5] mb-8 max-w-xl mx-auto">
            Track your progress, get personalized recommendations, and master the muscle-up with SpartanLab.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/skills/muscle-up">
              <Button className="bg-[#C1121F] hover:bg-[#A10E1A] text-white">
                Start Training
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/muscle-up-readiness-calculator">
              <Button variant="outline" className="border-[#2A2A2A] text-[#A5A5A5] hover:bg-[#2A2A2A]">
                Check Readiness First
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
