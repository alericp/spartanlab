import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Target, Dumbbell, Calculator, CheckCircle2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Why You Can\'t Front Lever (And What\'s Actually Holding You Back) | SpartanLab',
  description: 'Diagnose your front lever stall. Structured breakdown of the 5 most common limiting factors and how to identify which one is blocking your progress.',
  keywords: ['why cant I front lever', 'front lever stuck', 'front lever progression plateau', 'front lever weak points', 'front lever limiting factors'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/why-you-cant-front-lever`,
  },
  openGraph: {
    title: 'Why You Can\'t Front Lever | Diagnose Your Weak Points',
    description: 'Structured breakdown of the 5 most common front lever limiting factors.',
    url: `${SITE_CONFIG.url}/why-you-cant-front-lever`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const limitingFactors = [
  {
    rank: 1,
    factor: 'Insufficient Pulling Strength',
    prevalence: '70% of cases',
    description: 'The #1 reason for stalled front lever progress. Your weighted pull-up max directly predicts your front lever potential.',
    diagnosis: 'Can you do a weighted pull-up with +50% bodyweight for 3 reps?',
    solution: 'You need at least +50% BW weighted pull-up for straddle, +65-75% BW for full.',
    icon: Dumbbell,
  },
  {
    rank: 2,
    factor: 'Weak Scapular Control',
    prevalence: '50% of cases',
    description: 'Different from pull-up strength. Front lever requires depressed scapulae under horizontal load.',
    diagnosis: 'Can you hold a scapular pull from dead hang for 10+ seconds?',
    solution: 'Scapular pulls, active hangs, and front lever raises isolate this weakness.',
    icon: Target,
  },
  {
    rank: 3,
    factor: 'Poor Lat Engagement at Extension',
    prevalence: '40% of cases',
    description: 'Lats must engage at shoulder angles not trained in normal pull-ups. Different muscle recruitment.',
    diagnosis: 'Do your shoulders ride up when you attempt the hold?',
    solution: 'Straight-arm pulldowns and front lever negatives build this specific strength.',
    icon: AlertTriangle,
  },
  {
    rank: 4,
    factor: 'Core Tension Breakdown',
    prevalence: '30% of cases',
    description: 'Full-body tension required to prevent hip drop and lower back arch. Core must be isometrically strong.',
    diagnosis: 'Does your lower back arch or hips drop when holding?',
    solution: 'Hollow body work, dragon flag progressions, and RKC planks.',
    icon: Target,
  },
  {
    rank: 5,
    factor: 'Rushing Progressions',
    prevalence: '25% of cases',
    description: 'Jumping to harder progressions before mastering the current level. 10-second holds required.',
    diagnosis: 'Can you hold your current progression for 10+ seconds with perfect form?',
    solution: 'Stay at each level until 3x10s holds are achievable before progressing.',
    icon: XCircle,
  },
]

const selfAssessment = [
  { level: 'Beginner Limiter', description: 'Can\'t hold tuck for 5+ seconds', cause: 'Base pulling strength + core', priority: 'Weighted pull-ups, hollow holds' },
  { level: 'Intermediate Limiter', description: 'Stuck at tuck/advanced tuck', cause: 'Scapular control + lat engagement', priority: 'FL raises, straight-arm work' },
  { level: 'Advanced Limiter', description: 'Stuck at straddle', cause: 'Peak pulling strength + full-body tension', priority: 'Heavy weighted pulls, max tension drills' },
]

const faqItems = [
  {
    question: 'Why am I stuck even though I train front lever every day?',
    answer: 'Daily front lever training often leads to fatigue accumulation without strength gains. The limiting factor is usually pulling strength, which requires progressive overload (weighted pull-ups), not just skill practice.',
  },
  {
    question: 'Do I need weights to unlock front lever?',
    answer: 'For most people, yes. Weighted pull-up strength is the strongest predictor of front lever ability. Adding +50-75% bodyweight to your pull-up correlates directly with straddle to full front lever.',
  },
  {
    question: 'How long should progress take between levels?',
    answer: 'Typical timeline: Tuck (2-4 months), Advanced Tuck (3-6 months), Straddle (6-12 months), Full (12-24+ months). Slower progress usually indicates a strength deficit, not technique.',
  },
]

export default function WhyYouCantFrontLeverPage() {
  const schemas = [
    generateArticleSchema({
      title: 'Why You Can\'t Front Lever (Diagnostic Guide)',
      description: 'Structured breakdown of the 5 most common front lever limiting factors.',
      url: `${SITE_CONFIG.url}/why-you-cant-front-lever`,
      datePublished: '2024-01-15',
      dateModified: new Date().toISOString().split('T')[0],
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: SITE_CONFIG.url },
      { name: 'Front Lever Diagnosis', url: `${SITE_CONFIG.url}/why-you-cant-front-lever` },
    ]),
    generateFAQSchema(faqItems),
  ]

  return (
    <SeoPageLayout
      title="Why You Can't Front Lever"
      subtitle="(And What's Actually Holding You Back)"
      description="Most people fail front lever not because of effort, but because of specific missing prerequisites. This page diagnoses the real limiting factors."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Front Lever Diagnosis', href: '/why-you-cant-front-lever' },
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
                  Front lever failure is rarely about training volume. It's about <span className="text-[#E6E9EF] font-medium">specific strength deficits</span> that 
                  normal training doesn't address. Identify your limiter below.
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
              <p className="text-xs text-[#6B7280]">Tests your actual strength vs requirements</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
              <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weak Point Detection</h3>
              <p className="text-xs text-[#6B7280]">Identifies your specific limiter</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
              <Target className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
              <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Targeted Programming</h3>
              <p className="text-xs text-[#6B7280]">Builds program around your deficit</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-12 px-4 sm:px-6 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-[#E6E9EF] mb-4">Related Resources</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/front-lever-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Strength Requirements</h3>
                <p className="text-xs text-[#6B7280]">Exact benchmarks per level</p>
              </Card>
            </Link>
            <Link href="/front-lever-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Readiness Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your readiness score</p>
              </Card>
            </Link>
            <Link href="/front-lever-training-program">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Program</h3>
                <p className="text-xs text-[#6B7280]">Structured progression system</p>
              </Card>
            </Link>
            <Link href="/weighted-pull-up-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Pull-Up Standards</h3>
                <p className="text-xs text-[#6B7280]">Benchmark your pulling strength</p>
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
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Find Your Exact Weak Point</h2>
          <p className="text-[#A4ACB8] mb-8 max-w-xl mx-auto">
            Stop guessing. SpartanLab analyzes your strength metrics and identifies exactly what's holding you back.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
                Analyze My Weak Points
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/front-lever-readiness-calculator">
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
