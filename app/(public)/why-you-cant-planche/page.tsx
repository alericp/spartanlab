import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, Target, Dumbbell, Calculator, XCircle, Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Why You Can\'t Planche (The Real Limiting Factors) | SpartanLab',
  description: 'Diagnose your planche stall. Structured breakdown of the 5 most common pushing and straight-arm strength deficits blocking your progress.',
  keywords: ['why cant I planche', 'planche stuck', 'planche plateau', 'planche weak points', 'planche limiting factors', 'planche progression problems'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/why-you-cant-planche`,
  },
  openGraph: {
    title: 'Why You Can\'t Planche | Diagnose Your Weak Points',
    description: 'Structured breakdown of the 5 most common planche limiting factors.',
    url: `${SITE_CONFIG.url}/why-you-cant-planche`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const limitingFactors = [
  {
    rank: 1,
    factor: 'Insufficient Pushing Strength',
    prevalence: '65% of cases',
    description: 'The foundation of planche is raw pushing power. Weighted dip strength directly predicts planche potential.',
    diagnosis: 'Can you do a weighted dip with +75% bodyweight for 3 reps?',
    solution: 'You need +50% BW for tuck, +75% BW for straddle, +100% BW for full planche.',
    icon: Dumbbell,
  },
  {
    rank: 2,
    factor: 'Weak Straight-Arm Strength',
    prevalence: '60% of cases',
    description: 'Planche requires locked elbows under extreme load. This is a different strength quality than bent-arm pushing.',
    diagnosis: 'Can you hold a planche lean for 30+ seconds with fully locked elbows?',
    solution: 'Planche leans, maltese press conditioning, and ring support holds.',
    icon: Target,
  },
  {
    rank: 3,
    factor: 'Shoulder Protraction Weakness',
    prevalence: '45% of cases',
    description: 'Planche requires aggressive shoulder protraction. Failure to protract causes shoulder collapse.',
    diagnosis: 'Do your shoulders round forward and collapse when attempting holds?',
    solution: 'Protraction push-ups, planche lean holds with protraction focus, serratus work.',
    icon: AlertTriangle,
  },
  {
    rank: 4,
    factor: 'Wrist Conditioning Deficit',
    prevalence: '35% of cases',
    description: 'Wrists bear extreme load in extension. Most people lack the conditioning for sustained planche training.',
    diagnosis: 'Do your wrists hurt during or after planche training?',
    solution: 'Wrist prep routine, gradual load exposure, parallel bar or ring alternatives.',
    icon: Flame,
  },
  {
    rank: 5,
    factor: 'Core Compression Weakness',
    prevalence: '25% of cases',
    description: 'PPT (posterior pelvic tilt) required to maintain horizontal position. Core must resist extension forces.',
    diagnosis: 'Does your back arch and hips drop when attempting holds?',
    solution: 'Hollow body work, tuck planche hip position drills, compression work.',
    icon: XCircle,
  },
]

const selfAssessment = [
  { level: 'Beginner Limiter', description: 'Can\'t hold tuck planche for 5s', cause: 'Base pushing + straight-arm strength', priority: 'Weighted dips, planche leans' },
  { level: 'Intermediate Limiter', description: 'Stuck at tuck/advanced tuck', cause: 'Protraction + wrist conditioning', priority: 'Protraction work, wrist prep, lean holds' },
  { level: 'Advanced Limiter', description: 'Stuck at straddle', cause: 'Peak pushing + full-body tension', priority: 'Heavy weighted dips, max lean time, core work' },
]

const faqItems = [
  {
    question: 'Why is my planche progress so slow compared to front lever?',
    answer: 'Planche requires more absolute pushing strength and places extreme demands on wrists, elbows, and shoulders. The straight-arm strength component is also harder to develop. Most people progress 2-3x slower on planche than front lever.',
  },
  {
    question: 'Can I train planche without weighted dips?',
    answer: 'Technically yes, but it\'s significantly harder. Weighted dip strength provides the raw pushing power foundation. PPPU (pseudo planche push-ups) can substitute but progress is usually slower.',
  },
  {
    question: 'How do I know if my wrists are ready for planche?',
    answer: 'If you can hold a 60-second planche lean without wrist pain and do floor push-ups in full wrist extension comfortably, your wrists have adequate baseline conditioning. Pain signals insufficient preparation.',
  },
]

export default function WhyYouCantPlanchePage() {
  const schemas = [
    generateArticleSchema({
      title: 'Why You Can\'t Planche (Diagnostic Guide)',
      description: 'Structured breakdown of the 5 most common planche limiting factors.',
      url: `${SITE_CONFIG.url}/why-you-cant-planche`,
      publishedDate: '2024-01-15',
      modifiedDate: new Date().toISOString().split('T')[0],
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: SITE_CONFIG.url },
      { name: 'Planche Diagnosis', url: `${SITE_CONFIG.url}/why-you-cant-planche` },
    ]),
    generateFAQSchema(faqItems),
  ]

  return (
    <SeoPageLayout
      title="Why You Can't Planche"
      subtitle="(The Real Limiting Factors)"
      description="Planche failure is rarely about practice volume. It's about specific strength qualities that standard training doesn't build. Diagnose your limiter below."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Planche Diagnosis', href: '/why-you-cant-planche' },
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
                  Planche is the most strength-demanding calisthenics skill. Progress stalls when <span className="text-[#E6E9EF] font-medium">specific strength qualities</span> are 
                  missing—not from lack of practice. Find your limiter.
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
              <p className="text-xs text-[#6B7280]">Tests pushing + straight-arm strength</p>
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
            <Link href="/planche-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Strength Requirements</h3>
                <p className="text-xs text-[#6B7280]">Exact benchmarks per level</p>
              </Card>
            </Link>
            <Link href="/planche-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Readiness Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your readiness score</p>
              </Card>
            </Link>
            <Link href="/planche-training-program">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Program</h3>
                <p className="text-xs text-[#6B7280]">Structured progression system</p>
              </Card>
            </Link>
            <Link href="/weighted-dip-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Dip Standards</h3>
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
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Find Your Exact Weak Point</h2>
          <p className="text-[#A4ACB8] mb-8 max-w-xl mx-auto">
            Stop guessing. SpartanLab analyzes your pushing metrics and identifies exactly what's holding you back.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
                Analyze My Weak Points
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/planche-readiness-calculator">
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
