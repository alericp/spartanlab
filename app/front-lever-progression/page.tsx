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
import { getSkillCluster } from '@/lib/seo/skill-clusters'
import { Target, Dumbbell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Front Lever Progression Guide | SpartanLab',
  description: 'Master the front lever with this complete progression guide. From tuck to full front lever, understand each stage and what determines readiness.',
  keywords: ['front lever', 'front lever progression', 'front lever tutorial', 'calisthenics', 'bodyweight training', 'pull exercises'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/front-lever-progression`,
  },
  openGraph: {
    title: 'Front Lever Progression Guide | SpartanLab',
    description: 'Master the front lever with this complete progression guide. From tuck to full front lever, understand each stage and what determines readiness.',
    url: `${SITE_CONFIG.url}/front-lever-progression`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Front Lever Progression Guide | SpartanLab',
    description: 'Master the front lever with this complete progression guide. From tuck to full front lever.',
  },
}

const frontLeverSteps = [
  {
    name: 'Tuck Front Lever',
    description: 'Knees pulled tight to chest, body inverted and horizontal. Foundation for building lat and core tension.',
    difficulty: 'beginner' as const,
  },
  {
    name: 'Advanced Tuck Front Lever',
    description: 'Hips extend slightly, back flattens. Significant increase in leverage and lat engagement required.',
    difficulty: 'intermediate' as const,
  },
  {
    name: 'One Leg Front Lever',
    description: 'One leg extends fully while the other remains tucked. Asymmetric loading builds strength for straddle.',
    difficulty: 'advanced' as const,
  },
  {
    name: 'Straddle Front Lever',
    description: 'Both legs extended in straddle position. Requires elite pulling strength and core tension.',
    difficulty: 'advanced' as const,
  },
  {
    name: 'Full Front Lever',
    description: 'Legs together, body completely horizontal. Peak pulling strength achievement in calisthenics.',
    difficulty: 'elite' as const,
  },
]

const keyFactors = [
  {
    icon: Dumbbell,
    title: 'Pulling Strength',
    description: 'Strong weighted pull-ups (ideally +50% bodyweight) correlate highly with front lever success.',
  },
  {
    icon: Target,
    title: 'Core Tension',
    description: 'The ability to maintain a rigid body line under load is critical for horizontal holds.',
  },
]

// Progression table data
const progressionLevels = [
  { level: 'Tuck Front Lever', holdTime: '10-20 seconds', requirement: 'Basic pulling strength', nextGoal: 'Develop core tension' },
  { level: 'Advanced Tuck', holdTime: '10-15 seconds', requirement: 'Strong core compression', nextGoal: 'Begin straight-arm strength work' },
  { level: 'One Leg Front Lever', holdTime: '8-12 seconds', requirement: 'Asymmetric control', nextGoal: 'Build straddle flexibility' },
  { level: 'Straddle Front Lever', holdTime: '8-12 seconds', requirement: 'Elite pulling strength', nextGoal: 'Prepare for full front lever' },
  { level: 'Full Front Lever', holdTime: '5-10 seconds', requirement: 'Advanced straight-arm strength', nextGoal: 'Maintain and refine' },
]

// Common mistakes
const commonMistakes = [
  { title: 'Pulling Instead of Holding', description: 'Using momentum or active pulling instead of maintaining static hollow body tension throughout the hold.' },
  { title: 'Bent Arms', description: 'Allowing the elbows to bend rather than maintaining locked, straight-arm engagement during the hold.' },
  { title: 'Insufficient Pulling Strength', description: 'Training holds without building adequate weighted pull-up strength first. Aim for +50% BW pull-ups.' },
  { title: 'Neglecting Core Work', description: 'Ignoring core compression exercises like hollow body holds and dragon flags that build the tension pattern.' },
]

// FAQ data
const faqs = [
  { question: 'How long does it take to learn a front lever?', answer: 'Most athletes achieve a full front lever in 6-24 months of dedicated training, depending on starting strength and training consistency. Those with strong weighted pull-up foundations (50%+ BW added) typically progress faster. The progression from tuck to full usually takes longer than expected due to the significant strength gaps between stages.' },
  { question: 'How many pull-ups are required for a front lever?', answer: 'While there is no strict pull-up requirement, most athletes who achieve a full front lever can perform 15-20 strict pull-ups and weighted pull-ups with 50-70% of their bodyweight added. Weighted pulling strength correlates more strongly with front lever ability than high rep counts.' },
  { question: 'Is front lever harder than planche?', answer: 'For most athletes, planche is significantly harder and takes longer to achieve. Front lever primarily requires pulling strength (lats, rear delts), while planche demands pushing strength through extreme shoulder extension. Both are elite-level skills, but full planche typically takes 2-4x longer to achieve.' },
  { question: 'Can beginners train front lever progressions?', answer: 'Yes, beginners can start with tuck front lever once they have a foundation of 8-10 strict pull-ups and basic hollow body holds. The tuck variation is accessible and helps build the specific strength patterns needed for progression. Focus on form quality over hold time in early stages.' },
]

// JSON-LD structured data for rich search results
const jsonLdSchemas = [
  generateHowToSchema({
    name: 'Front Lever Progression Guide',
    description: 'Learn the front lever with this complete progression guide. Progress systematically from tuck to full front lever.',
    url: `${SITE_CONFIG.url}/front-lever-progression`,
    steps: [
      { name: 'Tuck Front Lever', description: 'Knees pulled tight to chest, body inverted and horizontal. Foundation for building lat and core tension.' },
      { name: 'Advanced Tuck Front Lever', description: 'Hips extend slightly, back flattens. Significant increase in leverage and lat engagement required.' },
      { name: 'One Leg Front Lever', description: 'One leg extends fully while the other remains tucked. Asymmetric loading builds strength for straddle.' },
      { name: 'Straddle Front Lever', description: 'Both legs extended in straddle position. Requires elite pulling strength and core tension.' },
      { name: 'Full Front Lever', description: 'Legs together, body completely horizontal. Peak pulling strength achievement in calisthenics.' },
    ],
    totalTime: 'P6M',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Front Lever Hub', url: '/skills/front-lever' },
    { name: 'Progression Guide', url: '/front-lever-progression' },
  ]),
  generateArticleSchema({
    title: 'Front Lever Progression Guide',
    description: 'Master the front lever with this complete progression guide.',
    url: `${SITE_CONFIG.url}/front-lever-progression`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateFAQSchema(faqs),
]

export default function FrontLeverProgressionPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      <SeoHero
        title="Front Lever Progression Guide"
        subtitle="Build the pulling strength and body tension needed to master this iconic calisthenics skill. Progress systematically from tuck to full front lever."
        ctaText="Track Your Progress"
        ctaHref="/skills"
        secondaryCtaText="Back to Front Lever Hub"
        secondaryCtaHref="/skills/front-lever"
      />

      {/* Progression Ladder */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <ProgressionLadderCard title="Front Lever Progression Stages" steps={frontLeverSteps} />
        </div>
      </section>

      {/* Readiness Calculator CTA */}
      <section className="py-8 px-4 sm:px-6 bg-[#C1121F]/10 border-y border-[#C1121F]/20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#E6E9EF]">Not sure if you are ready?</h2>
            <p className="text-sm text-[#A5A5A5]">Take the free readiness assessment to get a personalized score and recommendations.</p>
          </div>
          <Link href="/front-lever-readiness-calculator">
            <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
              Front Lever Readiness Calculator
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Key Factors */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">What Determines Readiness</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {keyFactors.map((factor) => (
              <div key={factor.title} className="p-6 bg-[#121212] rounded-xl border border-[#2A2A2A]">
                <div className="w-12 h-12 rounded-lg bg-[#E63946]/10 flex items-center justify-center mb-4">
                  <factor.icon className="w-6 h-6 text-[#E63946]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{factor.title}</h3>
                <p className="text-[#A5A5A5]">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Tips */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Training Guidance</h2>
          <div className="space-y-4">
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Build Weighted Pull-Up Strength</h3>
              <p className="text-sm text-[#A5A5A5]">
                Athletes who can do weighted pull-ups with +45-70 lbs typically have the raw pulling power for advanced front lever progressions. Track your 1RM regularly. Check our <Link href="/calisthenics-strength-standards" className="text-[#C1121F] hover:underline">strength standards</Link> to see where you stand.
              </p>
            </div>
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Train Rows Horizontally</h3>
              <p className="text-sm text-[#A5A5A5]">
                Front lever rows and ice cream makers build the specific horizontal pulling strength needed. Progress the difficulty as your holds improve.
              </p>
            </div>
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Consistent Volume</h3>
              <p className="text-sm text-[#A5A5A5]">
                Front lever requires high frequency training. Multiple short sessions per week are more effective than occasional long sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Progression Standards Table */}
      <ProgressionTable 
        title="Front Lever Progression Standards" 
        levels={progressionLevels} 
      />

      {/* Common Training Mistakes */}
      <CommonMistakes 
        title="Common Front Lever Training Mistakes" 
        mistakes={commonMistakes} 
        variant="list"
      />

      {/* FAQ Section */}
      <FAQ 
        title="Front Lever FAQ" 
        faqs={faqs} 
        defaultOpen={[0]} 
      />

      {/* Related Feature CTA */}
      <RelatedFeatureCTA
        icon={Target}
        title="Track Your Front Lever Progress"
        description="Log your current level, monitor pulling strength, and see projected timelines to your next stage with SpartanLab."
        ctaText="Open Skill Tracker"
        ctaHref="/skills"
      />

      {/* Related Content - SEO Internal Linking */}
      {getSkillCluster('front-lever') && (
        <RelatedContent 
          cluster={getSkillCluster('front-lever')!} 
          title="Continue Your Training"
        />
      )}
    </SeoPageLayout>
  )
}
