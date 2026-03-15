import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'How Many Pull-Ups Do You Need for Front Lever? | SpartanLab',
  description: 'Learn the exact pull-up strength requirements for front lever. Discover the benchmarks for each progression stage and how to build the pulling strength you need.',
  keywords: ['pull-ups for front lever', 'front lever requirements', 'how many pull-ups front lever', 'front lever strength', 'front lever prerequisites'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/how-many-pull-ups-for-front-lever`,
  },
  openGraph: {
    title: 'How Many Pull-Ups for Front Lever? | SpartanLab',
    description: 'Learn the exact pull-up strength requirements for front lever progression.',
    url: `${SITE_CONFIG.url}/how-many-pull-ups-for-front-lever`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const strengthRequirements = [
  { stage: 'Tuck Front Lever', pullUps: '8-10 strict', weighted: '+20-25% BW', core: '30s hollow hold', timeframe: 'Month 1-3' },
  { stage: 'Advanced Tuck', pullUps: '12-15 strict', weighted: '+30-40% BW', core: '45s hollow hold', timeframe: 'Month 3-6' },
  { stage: 'One Leg / Straddle', pullUps: '15-18 strict', weighted: '+40-50% BW', core: '60s hollow hold', timeframe: 'Month 6-12' },
  { stage: 'Full Front Lever', pullUps: '18-20+ strict', weighted: '+50%+ BW', core: '60s+ hollow hold', timeframe: 'Month 12-24+' },
]

const keyFactors = [
  { title: 'Weighted Pull-Up Strength', description: 'The strongest predictor of front lever success. +50% bodyweight correlates with full front lever ability.' },
  { title: 'Straight-Arm Strength', description: 'Front lever requires straight-arm pulling, which is different from regular pull-ups. Train arc holds and front lever rows.' },
  { title: 'Core Compression', description: 'Strong hollow body position is essential. Without proper core engagement, your hips will drop.' },
  { title: 'Lat Activation', description: 'Learning to maximally engage your lats while maintaining body tension is crucial for horizontal holds.' },
]

const commonMistakes = [
  { mistake: 'Only Training Bodyweight Pull-Ups', why: 'High rep pull-ups build endurance, not the maximum strength needed for front lever. Weighted work is essential.' },
  { mistake: 'Skipping Core Training', why: 'Without strong core compression, your hips will sag. Hollow body holds and hanging leg raises are critical.' },
  { mistake: 'Rushing Progressions', why: 'Moving to harder progressions before building adequate strength leads to bad form and plateau.' },
  { mistake: 'Ignoring Straight-Arm Work', why: 'Regular pull-ups use bent arms. Front lever requires straight-arm strength trained through arc holds and rows.' },
]

const trainingPlan = [
  { phase: 'Phase 1: Build Foundation', weeks: 'Weeks 1-8', focus: 'Get to 12+ strict pull-ups, 45s hollow hold', exercises: ['Pull-up progression', 'Hollow body holds', 'Scapular pulls'] },
  { phase: 'Phase 2: Add Weight', weeks: 'Weeks 9-16', focus: 'Build to +30% BW weighted pull-ups', exercises: ['Weighted pull-ups 3x5', 'Tuck front lever holds', 'Front lever rows'] },
  { phase: 'Phase 3: Skill Development', weeks: 'Weeks 17-24+', focus: 'Progress through front lever stages', exercises: ['Advanced tuck holds', 'Weighted pulls +40%', 'Ice cream makers'] },
]

const faqs = [
  {
    question: 'Can I do front lever with only 10 pull-ups?',
    answer: 'You may be able to hold a tuck front lever with 10 pull-ups, but progressing beyond that typically requires more strength. Most athletes who achieve full front lever can do 15-20 strict pull-ups AND heavy weighted pull-ups (+50% bodyweight).',
  },
  {
    question: 'Why is weighted pull-up strength more important than max reps?',
    answer: 'Front lever is a maximal strength skill, not an endurance skill. Weighted pull-up strength (relative strength) better predicts your ability to hold your body horizontal than high rep endurance. Focus on getting to +50% bodyweight for 5 reps.',
  },
  {
    question: 'How long does it take to get front lever from 10 pull-ups?',
    answer: 'Assuming you can do 10 strict pull-ups, reaching a full front lever typically takes 12-24 months of dedicated training. The tuck front lever may come within 2-4 months, but each subsequent progression takes longer.',
  },
  {
    question: 'Do I need to train front lever directly or just get stronger?',
    answer: 'Both. While strength is the foundation, you also need skill-specific training to learn proper body positioning, lat engagement, and core tension. Combine heavy pulling work with front lever progressions.',
  },
  {
    question: 'My pull-ups are strong but I still struggle with front lever. Why?',
    answer: 'Front lever requires straight-arm strength and lat engagement in a different position than pull-ups. Add training for arc holds, front lever raises, and isometric holds at your current progression level.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'How Many Pull-Ups Do You Need for Front Lever?',
    description: 'Complete guide to pull-up strength requirements for front lever training.',
    url: `${SITE_CONFIG.url}/how-many-pull-ups-for-front-lever`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Front Lever', url: '/skills/front-lever' },
    { name: 'Pull-Up Requirements', url: '/how-many-pull-ups-for-front-lever' },
  ]),
  generateFAQSchema(faqs),
]

export default function HowManyPullUpsForFrontLeverPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6 flex-wrap">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/skills/front-lever" className="hover:text-[#E6E9EF]">Front Lever</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Pull-Up Requirements</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Requirements</span>
              <h1 className="text-3xl sm:text-4xl font-bold">How Many Pull-Ups for Front Lever?</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            Pull-up strength is the foundation of front lever. Learn the exact benchmarks you need 
            at each progression stage, plus why weighted pull-up strength matters more than max reps.
          </p>
        </header>

        {/* Quick Answer */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#1A1D23] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-3">The Short Answer</h2>
            <p className="text-[#A5A5A5] mb-4">
              For a <strong className="text-[#E6E9EF]">full front lever</strong>, most athletes need:
            </p>
            <ul className="space-y-2 text-[#E6E9EF]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>15-20 strict pull-ups</strong> (bodyweight)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>+50% bodyweight</strong> weighted pull-up for 5 reps</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>60+ second</strong> hollow body hold</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Progression Requirements Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Requirements by Progression Stage</h2>
          <div className="space-y-4">
            {strengthRequirements.map((req) => (
              <Card key={req.stage} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#E6E9EF]">{req.stage}</h3>
                    <p className="text-sm text-[#6B7280]">{req.timeframe}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-[#6B7280]">Pull-Ups:</span>
                      <span className="text-[#E6E9EF] ml-1 font-medium">{req.pullUps}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Weighted:</span>
                      <span className="text-[#E6E9EF] ml-1 font-medium">{req.weighted}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Core:</span>
                      <span className="text-[#E6E9EF] ml-1 font-medium">{req.core}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Factors */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Key Factors Beyond Pull-Up Numbers</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {keyFactors.map((factor) => (
              <Card key={factor.title} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">{factor.title}</h3>
                <p className="text-sm text-[#A5A5A5]">{factor.description}</p>
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

        {/* Training Plan */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Sample Training Plan</h2>
          <div className="space-y-4">
            {trainingPlan.map((phase) => (
              <Card key={phase.phase} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-1/3">
                    <h3 className="font-bold text-[#E6E9EF]">{phase.phase}</h3>
                    <p className="text-sm text-[#C1121F]">{phase.weeks}</p>
                    <p className="text-sm text-[#A5A5A5] mt-1">{phase.focus}</p>
                  </div>
                  <div className="sm:w-2/3">
                    <p className="text-sm text-[#6B7280] mb-2">Key Exercises:</p>
                    <div className="flex flex-wrap gap-2">
                      {phase.exercises.map((ex) => (
                        <span key={ex} className="px-2 py-1 bg-[#2B313A] rounded text-sm text-[#E6E9EF]">{ex}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#1A1D23] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-2">Check Your Front Lever Readiness</h2>
            <p className="text-[#A5A5A5] mb-4">
              Use our calculator to get a detailed analysis of your current strength and what you need to improve.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/front-lever-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  <Calculator className="w-4 h-4 mr-2" />
                  Front Lever Readiness Calculator
                </Button>
              </Link>
              <Link href="/skills/front-lever">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Full Front Lever Guide
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
                Pull-Up Strength Standards
              </Button>
            </Link>
            <Link href="/weighted-pull-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Weighted Pull-Up Standards
              </Button>
            </Link>
            <Link href="/front-lever-progression">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Front Lever Progression
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
