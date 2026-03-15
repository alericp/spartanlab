import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'How Many Dips for Muscle-Up? | Complete Requirements | SpartanLab',
  description: 'Learn the exact dip and pull-up requirements for muscle-up. Discover the strength benchmarks and technique prerequisites for your first muscle-up.',
  keywords: ['dips for muscle-up', 'muscle-up requirements', 'how many dips muscle-up', 'muscle-up strength', 'muscle-up prerequisites'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/how-many-dips-for-muscle-up`,
  },
  openGraph: {
    title: 'How Many Dips for Muscle-Up? | SpartanLab',
    description: 'Learn the exact strength requirements for muscle-up.',
    url: `${SITE_CONFIG.url}/how-many-dips-for-muscle-up`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const strengthRequirements = [
  { exercise: 'Pull-Ups', minimum: '10-12 strict', recommended: '15+', note: 'Must be explosive pull-ups, not slow' },
  { exercise: 'Chest-to-Bar Pull-Ups', minimum: '8-10', recommended: '12+', note: 'Critical for the high pull' },
  { exercise: 'Straight Bar Dips', minimum: '10-12', recommended: '15+', note: 'Different from parallel bar dips' },
  { exercise: 'Weighted Pull-Ups', minimum: '+15% BW', recommended: '+25% BW', note: 'For explosive power' },
]

const technicalRequirements = [
  { skill: 'Explosive Pull Power', description: 'You need to pull explosively to get your chest above the bar. Slow, controlled pull-ups will not transfer.' },
  { skill: 'Transition Strength', description: 'The hardest part - getting from pull to push. Requires deep dip strength and shoulder mobility.' },
  { skill: 'Straight Bar Dip Proficiency', description: 'Parallel bar dips are not enough. Straight bar dips build the pushing angle needed for muscle-up.' },
  { skill: 'Kipping Technique (Optional)', description: 'While strict muscle-ups are ideal, most people learn kipping first. Either requires the strength base.' },
]

const commonMistakes = [
  { mistake: 'Only Training Pull-Ups', why: 'The transition and dip portions are equally important. Many athletes can pull high enough but cannot transition.' },
  { mistake: 'Training Parallel Bar Dips Only', why: 'Straight bar dips have a different angle and require different strength. Train on the same bar you will muscle-up on.' },
  { mistake: 'Neglecting Explosive Training', why: 'Slow pull-ups do not build the speed needed. Include clapping pull-ups or explosive high pulls.' },
  { mistake: 'Attempting Too Soon', why: 'Without adequate strength, you reinforce bad technique. Build the strength base first.' },
]

const progressionPath = [
  { phase: 'Phase 1: Build Foundation', focus: 'Get to 12+ pull-ups, 15+ dips', duration: '4-8 weeks' },
  { phase: 'Phase 2: Explosive Power', focus: 'Chest-to-bar, high pulls, explosive work', duration: '4-6 weeks' },
  { phase: 'Phase 3: Transition Work', focus: 'Straight bar dips, negative muscle-ups', duration: '4-6 weeks' },
  { phase: 'Phase 4: Full Skill', focus: 'Banded muscle-ups, attempt full movement', duration: '2-4 weeks' },
]

const faqs = [
  {
    question: 'How many dips do I need for a muscle-up?',
    answer: 'You need approximately 10-15 straight bar dips to have the pushing strength for the muscle-up transition and lockout. Parallel bar dips help build general pushing strength, but straight bar dips are more specific to the muscle-up movement.',
  },
  {
    question: 'Are pull-ups or dips more important for muscle-up?',
    answer: 'Both are essential, but pull-up strength (specifically explosive high pull strength) is slightly more important. You need to pull high enough to transition. Many athletes find the transition is the hardest part, which requires both pulling to height AND straight bar dip strength.',
  },
  {
    question: 'Can I do a muscle-up with 10 pull-ups?',
    answer: 'Technically yes, but it depends on the quality. If you can do 10 explosive chest-to-bar pull-ups AND 10 straight bar dips, you may have the strength. If your 10 pull-ups are slow and controlled, you likely need more explosive power development.',
  },
  {
    question: 'How long does it take to get a muscle-up?',
    answer: 'For someone who can already do 8-10 pull-ups and 12-15 dips, a muscle-up typically takes 2-4 months of focused training. Starting from a lower base, expect 4-8 months. The timeline depends heavily on explosive power and transition practice.',
  },
  {
    question: 'Should I learn strict or kipping muscle-up first?',
    answer: 'Most people learn a kipping muscle-up first because the swing provides momentum through the hardest part (transition). However, both require the same strength base. A strict muscle-up requires significantly more strength but less technique.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'How Many Dips for Muscle-Up?',
    description: 'Complete guide to dip and strength requirements for muscle-up.',
    url: `${SITE_CONFIG.url}/how-many-dips-for-muscle-up`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Muscle-Up', url: '/skills/muscle-up' },
    { name: 'Dip Requirements', url: '/how-many-dips-for-muscle-up' },
  ]),
  generateFAQSchema(faqs),
]

export default function HowManyDipsForMuscleUpPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6 flex-wrap">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/skills/muscle-up" className="hover:text-[#E6E9EF]">Muscle-Up</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Requirements</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Requirements</span>
              <h1 className="text-3xl sm:text-4xl font-bold">How Many Dips for Muscle-Up?</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The muscle-up combines explosive pulling and pushing strength. Learn the exact dip 
            and pull-up requirements to achieve this fundamental calisthenics skill.
          </p>
        </header>

        {/* Quick Answer */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#1A1D23] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-3">The Quick Answer</h2>
            <p className="text-[#A5A5A5] mb-4">
              For a <strong className="text-[#E6E9EF]">muscle-up</strong>, you need:
            </p>
            <ul className="space-y-2 text-[#E6E9EF]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>10-12 explosive pull-ups</strong> (preferably chest-to-bar)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>10-15 straight bar dips</strong> (not parallel bar)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>+25% bodyweight</strong> weighted pull-up for explosive power</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Strength Requirements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Detailed Strength Requirements</h2>
          <div className="space-y-4">
            {strengthRequirements.map((req) => (
              <Card key={req.exercise} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#E6E9EF]">{req.exercise}</h3>
                    <p className="text-sm text-[#A5A5A5]">{req.note}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-[#6B7280]">Minimum:</span>
                      <span className="text-yellow-400 ml-1 font-medium">{req.minimum}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Recommended:</span>
                      <span className="text-green-400 ml-1 font-medium">{req.recommended}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Requirements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Technical Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {technicalRequirements.map((item) => (
              <Card key={item.skill} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">{item.skill}</h3>
                <p className="text-sm text-[#A5A5A5]">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Common Training Mistakes</h2>
          <div className="space-y-3">
            {commonMistakes.map((item) => (
              <Card key={item.mistake} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{item.mistake}</h3>
                    <p className="text-sm text-[#A5A5A5]">{item.why}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Progression Path */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Progression Path</h2>
          <div className="space-y-4">
            {progressionPath.map((phase, index) => (
              <Card key={phase.phase} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center text-[#C1121F] font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#E6E9EF]">{phase.phase}</h3>
                      <span className="text-sm text-[#6B7280]">{phase.duration}</span>
                    </div>
                    <p className="text-sm text-[#A5A5A5]">{phase.focus}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#1A1D23] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-2">Check Your Muscle-Up Readiness</h2>
            <p className="text-[#A5A5A5] mb-4">
              Assess your current pulling and pushing strength to see if you are ready.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/muscle-up-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  <Calculator className="w-4 h-4 mr-2" />
                  Muscle-Up Readiness Calculator
                </Button>
              </Link>
              <Link href="/skills/muscle-up">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Full Muscle-Up Guide
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <FAQ faqs={faqs} title="Frequently Asked Questions" />
        </section>

        {/* Related Links */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Related Guides</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/pull-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Pull-Up Standards
              </Button>
            </Link>
            <Link href="/dip-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Dip Standards
              </Button>
            </Link>
            <Link href="/exercises/straight-bar-dip">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Straight Bar Dip Guide
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
