import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Target, Dumbbell, Calculator, XCircle, Scale } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Why Your HSPU Is Stuck (Wall vs Freestanding Diagnosis) | SpartanLab',
  description: 'Diagnose your handstand push-up plateau. Structured breakdown of pressing strength, shoulder mobility, core stability, and balance limiters.',
  keywords: ['hspu stuck', 'handstand push up plateau', 'hspu not improving', 'wall hspu to freestanding', 'hspu weak points'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/why-your-hspu-is-stuck`,
  },
  openGraph: {
    title: 'Why Your HSPU Is Stuck | Diagnose Your Plateau',
    description: 'Structured breakdown of the 5 most common HSPU limiting factors.',
    url: `${SITE_CONFIG.url}/why-your-hspu-is-stuck`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const limitingFactors = [
  {
    rank: 1,
    factor: 'Insufficient Pressing Strength',
    prevalence: '55% of cases',
    description: 'HSPU requires pressing your full bodyweight overhead. Most people lack the raw strength, especially at the bottom position.',
    diagnosis: 'Can you strict press 70% of your bodyweight for 3 reps?',
    solution: 'Pike push-ups, elevated pike, and overhead pressing progressions.',
    icon: Dumbbell,
  },
  {
    rank: 2,
    factor: 'Weak Bottom Position',
    prevalence: '50% of cases',
    description: 'The hardest part is pressing out of the hole. Shoulders must be strong at end range with head touching floor.',
    diagnosis: 'Do you fail in the bottom 1/3 of the movement?',
    solution: 'Deficit pike push-ups, HSPU negatives, and bottom position pauses.',
    icon: Target,
  },
  {
    rank: 3,
    factor: 'Poor Shoulder Mobility',
    prevalence: '40% of cases',
    description: 'Full shoulder flexion required for proper handstand line. Restricted mobility forces compensation and energy leak.',
    diagnosis: 'Can you hold a wall handstand with fully open shoulders (no arch)?',
    solution: 'Shoulder flexion stretches, wall slides, and active flexibility work.',
    icon: Scale,
  },
  {
    rank: 4,
    factor: 'Core Stability Breakdown',
    prevalence: '35% of cases',
    description: 'Core must maintain hollow body alignment during the press. Failure causes banana back and energy waste.',
    diagnosis: 'Does your lower back arch during the press?',
    solution: 'Hollow body holds, handstand hollow body drills, and core anti-extension.',
    icon: AlertTriangle,
  },
  {
    rank: 5,
    factor: 'Balance Interference (Freestanding)',
    prevalence: '60% for freestanding',
    description: 'Freestanding HSPU requires simultaneous pressing and balance. Balance corrections interfere with pressing mechanics.',
    diagnosis: 'Can you hold a freestanding handstand for 30+ seconds?',
    solution: 'Separate balance training from strength training until both are solid.',
    icon: XCircle,
  },
]

const selfAssessment = [
  { level: 'Pre-Requisite Gap', description: 'Can\'t do wall HSPU yet', cause: 'Base pressing strength missing', priority: 'Pike push-ups, elevated pike progressions' },
  { level: 'Wall HSPU Plateau', description: 'Stuck at 3-5 wall reps', cause: 'Bottom strength or shoulder mobility', priority: 'Deficit work, negatives, mobility' },
  { level: 'Freestanding Struggle', description: 'Wall is easy but FS is impossible', cause: 'Balance and pressing not integrated', priority: 'Separate balance training, wall eccentrics' },
]

const faqItems = [
  {
    question: 'Why is wall HSPU much easier than freestanding?',
    answer: 'The wall removes the balance requirement entirely. Freestanding HSPU requires your nervous system to simultaneously maintain balance AND produce pressing force. These compete for neural resources. Most people need 30+ second freestanding holds before attempting FS HSPU.',
  },
  {
    question: 'Do I need overhead pressing strength for HSPU?',
    answer: 'Not strictly required, but it helps significantly. Being able to strict press 50-70% BW correlates strongly with wall HSPU ability. The movement pattern is different (inverted) but the pressing muscles are the same.',
  },
  {
    question: 'How do I stop arching my back during HSPU?',
    answer: 'Back arching indicates core weakness or shoulder mobility restriction. Train hollow body holds separately, and work on shoulder flexion mobility. Use the wall as feedback—your lower back should stay flat against it.',
  },
]

export default function WhyYourHSPUIsStuckPage() {
  const schemas = [
    generateArticleSchema({
      title: 'Why Your HSPU Is Stuck (Diagnostic Guide)',
      description: 'Structured breakdown of the 5 most common HSPU limiting factors.',
      url: `${SITE_CONFIG.url}/why-your-hspu-is-stuck`,
      publishedDate: '2024-01-15',
      modifiedDate: new Date().toISOString().split('T')[0],
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: SITE_CONFIG.url },
      { name: 'HSPU Diagnosis', url: `${SITE_CONFIG.url}/why-your-hspu-is-stuck` },
    ]),
    generateFAQSchema(faqItems),
  ]

  return (
    <SeoPageLayout
      title="Why Your HSPU Is Stuck"
      subtitle="(Wall vs Freestanding Diagnosis)"
      description="HSPU combines pressing strength, shoulder mobility, core stability, and balance. Plateaus happen when one component limits the others. Find your limiter."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'HSPU Diagnosis', href: '/why-your-hspu-is-stuck' },
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
                  HSPU progress stalls when <span className="text-[#E6E9EF] font-medium">one specific component</span> limits the movement—not because you 
                  need more volume. Wall HSPU and freestanding HSPU have different limiters.
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
          <p className="text-[#6B7280] mb-8">Ranked by prevalence. Note: Factor #5 applies specifically to freestanding.</p>
          
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
              <p className="text-xs text-[#6B7280]">Tests pressing + balance + mobility</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
              <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Component Detection</h3>
              <p className="text-xs text-[#6B7280]">Identifies which component limits</p>
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
            <Link href="/hspu-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Strength Requirements</h3>
                <p className="text-xs text-[#6B7280]">Exact benchmarks for each level</p>
              </Card>
            </Link>
            <Link href="/hspu-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Readiness Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your readiness score</p>
              </Card>
            </Link>
            <Link href="/guides/handstand-push-up-progression">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">HSPU Guide</h3>
                <p className="text-xs text-[#6B7280]">Full progression breakdown</p>
              </Card>
            </Link>
            <Link href="/weighted-dip-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Pressing Standards</h3>
                <p className="text-xs text-[#6B7280]">Benchmark your pushing strength</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <FAQ faqs={faqItems} title="Common Questions" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Find Your Exact Limiter</h2>
          <p className="text-[#A4ACB8] mb-8 max-w-xl mx-auto">
            Stop wondering why your HSPU isn't improving. SpartanLab identifies exactly which component is holding you back.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
                Analyze My Weak Points
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/hspu-readiness-calculator">
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
