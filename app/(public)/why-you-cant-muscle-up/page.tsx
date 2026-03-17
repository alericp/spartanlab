import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Target, Dumbbell, Calculator, XCircle, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Why You Can\'t Muscle-Up (Diagnose Your Sticking Point) | SpartanLab',
  description: 'Diagnose why your muscle-up is stuck. Structured breakdown of the 5 most common limiters: pulling height, transition strength, technique, and more.',
  keywords: ['why cant I muscle up', 'muscle up stuck', 'muscle up transition', 'muscle up technique', 'muscle up strength requirements'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/why-you-cant-muscle-up`,
  },
  openGraph: {
    title: 'Why You Can\'t Muscle-Up | Diagnose Your Sticking Point',
    description: 'Structured breakdown of the 5 most common muscle-up limiting factors.',
    url: `${SITE_CONFIG.url}/why-you-cant-muscle-up`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const limitingFactors = [
  {
    rank: 1,
    factor: 'Not Pulling High Enough',
    prevalence: '60% of cases',
    description: 'Most muscle-up failures happen because the pull doesn\'t clear the bar/rings. You need to pull to sternum level, not chin.',
    diagnosis: 'Can you do a chest-to-bar pull-up consistently?',
    solution: 'High pulls, explosive pull-up training, and weighted pull-ups for power.',
    icon: Dumbbell,
  },
  {
    rank: 2,
    factor: 'Weak Transition Strength',
    prevalence: '55% of cases',
    description: 'The transition is a unique position—neither pull-up nor dip. Requires specific training to build strength there.',
    diagnosis: 'Can you hold the bottom of a ring dip with control?',
    solution: 'Negative muscle-ups, band-assisted transitions, and bottom position holds.',
    icon: Zap,
  },
  {
    rank: 3,
    factor: 'Insufficient Pulling Power',
    prevalence: '45% of cases',
    description: 'Raw weighted pull-up strength enables explosive pulling. Muscle-ups require FAST strength, not just max strength.',
    diagnosis: 'Can you do a weighted pull-up with +30% BW for 5 reps?',
    solution: 'Weighted pull-ups (3-5 rep range) and explosive pull training.',
    icon: Dumbbell,
  },
  {
    rank: 4,
    factor: 'Poor Kip Timing (Bar)',
    prevalence: '40% of cases',
    description: 'Kipping muscle-ups require precise timing between hip drive and pull. Mistimed kips waste energy.',
    diagnosis: 'Do you feel like your pull and hip drive happen separately?',
    solution: 'Kip swings, beat swings, and glide kip progressions.',
    icon: Target,
  },
  {
    rank: 5,
    factor: 'Weak Pushing Finish',
    prevalence: '25% of cases',
    description: 'Some athletes complete the transition but fail to press out. This is a dip strength issue.',
    diagnosis: 'Can you do 15+ dips with full ROM?',
    solution: 'Straight bar dips, deep ring dips, and weighted dip work.',
    icon: XCircle,
  },
]

const selfAssessment = [
  { level: 'Pre-Requisite Gap', description: 'Under 10 pull-ups or under 15 dips', cause: 'Base strength insufficient', priority: 'Build to 15+ pull-ups, 20+ dips first' },
  { level: 'Power Gap', description: '15+ pull-ups but can\'t pull high', cause: 'Missing explosive strength', priority: 'Weighted pulls, high pulls, chest-to-bar' },
  { level: 'Transition Gap', description: 'Pulls high but fails at transition', cause: 'Transition-specific weakness', priority: 'Negatives, band-assisted, position holds' },
]

const faqItems = [
  {
    question: 'How many pull-ups do I need before attempting muscle-ups?',
    answer: 'For strict bar muscle-up: 15+ pull-ups. For ring muscle-up: 12+ pull-ups. For kipping bar muscle-up: 10+ pull-ups. Having weighted pull-up strength (+25-30% BW) dramatically helps with the explosive pull component.',
  },
  {
    question: 'Why is the ring muscle-up easier than bar?',
    answer: 'Rings allow the false grip and can rotate during transition, reducing the leverage disadvantage. Bar muscle-ups require more explosive pulling and a steeper learning curve for the turnover.',
  },
  {
    question: 'Should I train kipping or strict muscle-ups first?',
    answer: 'For long-term skill development, strict is better—it builds foundational strength. However, kipping bar muscle-ups are often achieved first due to lower strength requirements. Both have value.',
  },
]

export default function WhyYouCantMuscleUpPage() {
  const schemas = [
    generateArticleSchema({
      title: 'Why You Can\'t Muscle-Up (Diagnostic Guide)',
      description: 'Structured breakdown of the 5 most common muscle-up limiting factors.',
      url: `${SITE_CONFIG.url}/why-you-cant-muscle-up`,
      datePublished: '2024-01-15',
      dateModified: new Date().toISOString().split('T')[0],
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: SITE_CONFIG.url },
      { name: 'Muscle-Up Diagnosis', url: `${SITE_CONFIG.url}/why-you-cant-muscle-up` },
    ]),
    generateFAQSchema(faqItems),
  ]

  return (
    <SeoPageLayout
      title="Why You Can't Muscle-Up"
      subtitle="(Diagnose Your Sticking Point)"
      description="The muscle-up combines pulling power, transition strength, and timing. Most failures come from one specific weakness—not general fitness. Find yours below."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Muscle-Up Diagnosis', href: '/why-you-cant-muscle-up' },
      ]}
    >
      <JsonLdMultiple schemas={schemas} />

      {/* Core Problem */}
      <section className="py-8 px-4 sm:px-6 border-b border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-[#1A1F26] border-[#C1121F]/30 p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-[#C1121F] shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-[#E6E9EF] mb-2">The Real Problem</h2>
                <p className="text-[#A4ACB8]">
                  The muscle-up is a <span className="text-[#E6E9EF] font-medium">compound skill</span> with three distinct phases: pull, transition, push. 
                  Most people fail at one specific phase—identify which one is your limiter.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Limiting Factors */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-2">The 5 Limiting Factors</h2>
          <p className="text-[#6B7280] mb-8">Ranked by prevalence. Identify which one matches your situation.</p>
          
          <div className="space-y-4">
            {limitingFactors.map((item) => (
              <Card key={item.rank} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#C1121F]/10 text-[#C1121F] font-bold shrink-0">
                    {item.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-[#E6E9EF]">{item.factor}</h3>
                      <span className="text-xs text-[#6B7280] bg-[#2B313A] px-2 py-1 rounded">{item.prevalence}</span>
                    </div>
                    <p className="text-sm text-[#A4ACB8] mb-3">{item.description}</p>
                    <div className="bg-[#0F1115] rounded p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-[#6B7280] uppercase w-20 shrink-0">Diagnosis:</span>
                        <span className="text-sm text-[#E6E9EF]">{item.diagnosis}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-[#6B7280] uppercase w-20 shrink-0">Fix:</span>
                        <span className="text-sm text-[#A4ACB8]">{item.solution}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Assessment */}
      <section className="py-12 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Where Are You Stuck?</h2>
          <div className="grid gap-4">
            {selfAssessment.map((item) => (
              <Card key={item.level} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-[#E6E9EF]">{item.level}</h3>
                  <span className="text-xs text-[#C1121F]">{item.description}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">Likely cause: <span className="text-[#A4ACB8]">{item.cause}</span></span>
                  <span className="text-[#6B7280]">Priority: <span className="text-[#E6E9EF]">{item.priority}</span></span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SpartanLab Solution */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">How SpartanLab Diagnoses This</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
              <Calculator className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
              <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Readiness Analysis</h3>
              <p className="text-xs text-[#6B7280]">Tests pull + push + explosive power</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
              <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Phase Detection</h3>
              <p className="text-xs text-[#6B7280]">Identifies which phase fails</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
              <Target className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
              <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Targeted Programming</h3>
              <p className="text-xs text-[#6B7280]">Builds program around your limiter</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 px-4 sm:px-6 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-[#E6E9EF] mb-4">Related Resources</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/muscle-up-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Strength Requirements</h3>
                <p className="text-xs text-[#6B7280]">Exact benchmarks for each phase</p>
              </Card>
            </Link>
            <Link href="/muscle-up-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Readiness Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your readiness score</p>
              </Card>
            </Link>
            <Link href="/muscle-up-training-program">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Program</h3>
                <p className="text-xs text-[#6B7280]">Structured progression system</p>
              </Card>
            </Link>
            <Link href="/weighted-pull-up-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Pull-Up Standards</h3>
                <p className="text-xs text-[#6B7280]">Benchmark your pulling power</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <FAQ items={faqItems} title="Common Questions" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Find Your Exact Sticking Point</h2>
          <p className="text-[#A4ACB8] mb-8 max-w-xl mx-auto">
            Stop guessing which phase is failing. SpartanLab analyzes your metrics and identifies exactly what's blocking your muscle-up.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
                Analyze My Weak Points
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/muscle-up-readiness-calculator">
              <Button size="lg" variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] gap-2">
                Check My Readiness First
                <Calculator className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
