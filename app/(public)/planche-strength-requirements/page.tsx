import { Metadata } from 'next'
import Link from 'next/link'
import { Target, ArrowRight, CheckCircle2, AlertTriangle, Dumbbell, Calculator, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Planche Strength Requirements | Are You Strong Enough? | SpartanLab',
  description: 'Exact pushing and core strength requirements for planche. Learn the weighted dip, PPPU, and compression benchmarks needed for each planche progression.',
  keywords: ['planche strength requirements', 'how strong for planche', 'planche prerequisites', 'weighted dip for planche', 'planche readiness'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/planche-strength-requirements`,
  },
  openGraph: {
    title: 'Planche Strength Requirements | Are You Strong Enough?',
    description: 'Exact pushing and core strength requirements for planche progression from tuck to full.',
    url: `${SITE_CONFIG.url}/planche-strength-requirements`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const strengthRequirements = [
  { 
    level: 'Tuck Planche', 
    weightedDip: '+25% BW', 
    pppu: '10 reps',
    lsit: '15 sec hold',
    description: 'Entry level. Focus on wrist conditioning and lean angle.',
    color: 'text-blue-400'
  },
  { 
    level: 'Advanced Tuck', 
    weightedDip: '+40% BW', 
    pppu: '8 reps (deep)',
    lsit: '20 sec hold',
    description: 'Hips open further. Significantly harder lever arm.',
    color: 'text-green-400'
  },
  { 
    level: 'Straddle Planche', 
    weightedDip: '+60% BW', 
    pppu: '5 reps (extended)',
    lsit: 'Full V-sit',
    description: 'Legs extended. Requires exceptional pushing strength.',
    color: 'text-yellow-400'
  },
  { 
    level: 'Full Planche', 
    weightedDip: '+80%+ BW', 
    pppu: 'Planche push-ups',
    lsit: 'V-sit + compression',
    description: 'Elite level. Few athletes achieve this without dedicated years.',
    color: 'text-[#C1121F]'
  },
]

const limitingFactors = [
  {
    factor: 'Pushing Strength',
    description: 'Most common limiter. Weighted dip and PPPU strength directly predict planche progress.',
    fix: 'Prioritize weighted dips (3-5 reps) and pseudo planche push-ups with increasing lean.',
  },
  {
    factor: 'Wrist Integrity',
    description: 'Wrists must handle full bodyweight at extreme angles. Often overlooked.',
    fix: 'Daily wrist prep, rice bucket work, and gradual lean progression over months.',
  },
  {
    factor: 'Scapular Protraction Strength',
    description: 'Scapulae must protract forcefully while supporting load. Different from bench press.',
    fix: 'Planche leans, deep push-up plus variations, and protraction holds.',
  },
  {
    factor: 'Core Compression',
    description: 'Posterior pelvic tilt requires strong lower abs and hip flexors.',
    fix: 'L-sit progressions, hollow body holds, and active pike compression work.',
  },
]

const faqs = [
  {
    question: 'Can you train for planche without weights?',
    answer: 'Yes, but progress will be slower. Pseudo planche push-ups and planche leans build specific strength. However, weighted dips accelerate pushing strength gains and correlate strongly with planche progression.',
  },
  {
    question: 'How long does it take to achieve full planche?',
    answer: 'Most athletes require 2-4+ years of dedicated training. Tuck planche is achievable in 6-12 months with proper prerequisites. The jump from straddle to full is where most athletes stall.',
  },
  {
    question: 'What is the best indicator of planche readiness?',
    answer: 'Weighted dip strength relative to bodyweight is the strongest predictor. If you can dip +50% BW for 5 reps, you likely have the raw pushing strength for advanced tuck work.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Planche Strength Requirements',
    description: 'Complete strength benchmarks for planche progression from tuck to full.',
    url: `${SITE_CONFIG.url}/planche-strength-requirements`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Requirements', url: '/planche-strength-requirements' },
  ]),
  generateFAQSchema(faqs),
]

export default function PlancheStrengthRequirementsPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Hero */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-b border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4">
            <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
            <span>/</span>
            <span className="text-[#C1121F]">Planche Requirements</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Planche Strength Requirements
            <span className="block text-[#C1121F] mt-2">(Are You Strong Enough?)</span>
          </h1>
          
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            SpartanLab evaluates planche readiness using weighted pushing metrics, core compression, 
            and wrist integrity. Raw strength determines your ceiling.
          </p>
        </div>
      </section>

      {/* Requirements Breakdown */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            Strength Benchmarks by Progression
          </h2>
          
          <div className="space-y-4">
            {strengthRequirements.map((req) => (
              <Card key={req.level} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className={`font-semibold text-lg ${req.color}`}>{req.level}</h3>
                    <p className="text-sm text-[#6B7280] mt-1">{req.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Weighted Dip</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.weightedDip}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">PPPU</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.pppu}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">L-Sit</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.lsit}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Decision Section */}
      <section className="py-12 px-4 sm:px-6 bg-[#0A0D12]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#C1121F]" />
            Can You Do It? Readiness Tiers
          </h2>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <h3 className="font-semibold">Beginner Ready</h3>
              </div>
              <ul className="text-sm text-[#A4ACB8] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  +20% BW weighted dip
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  30-sec planche lean
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  10-sec L-sit
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for tuck planche work</p>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <h3 className="font-semibold">Intermediate Ready</h3>
              </div>
              <ul className="text-sm text-[#A4ACB8] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  +40% BW weighted dip
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  10-sec tuck planche
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  8 deep PPPUs
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for advanced tuck</p>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#C1121F]"></div>
                <h3 className="font-semibold">Advanced Ready</h3>
              </div>
              <ul className="text-sm text-[#A4ACB8] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  +60% BW weighted dip
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  5-sec advanced tuck
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  V-sit capability
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for straddle progression</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Limiting Factors */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            Common Limiting Factors
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {limitingFactors.map((item) => (
              <Card key={item.factor} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">{item.factor}</h3>
                <p className="text-sm text-[#A4ACB8] mb-3">{item.description}</p>
                <div className="text-xs text-[#C1121F] font-medium">
                  Fix: {item.fix}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tool Integration */}
      <section className="py-12 px-4 sm:px-6 bg-[#0A0D12]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[#C1121F]" />
            Analyze Your Readiness
          </h2>
          
          <Card className="bg-[#1A1F26] border-[#C1121F]/30 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Run Your Full Planche Readiness Analysis</h3>
                <p className="text-sm text-[#A4ACB8]">
                  SpartanLab evaluates your pushing strength, core compression, and wrist integrity 
                  to identify your exact weak points and optimal progression path.
                </p>
              </div>
              <Link href="/planche-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
                  Planche Calculator
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Related Resources</h2>
          
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/guides/planche-progression">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Planche Progression Guide</h3>
                <p className="text-xs text-[#6B7280]">Step-by-step training</p>
              </Card>
            </Link>
            <Link href="/weighted-dip-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Dip Standards</h3>
                <p className="text-xs text-[#6B7280]">Pushing benchmarks</p>
              </Card>
            </Link>
            <Link href="/front-lever-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Front Lever Requirements</h3>
                <p className="text-xs text-[#6B7280]">Pulling strength needs</p>
              </Card>
            </Link>
            <Link href="/programs">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Programs</h3>
                <p className="text-xs text-[#6B7280]">Structured planche programs</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ faqs={faqs} title="Planche Strength FAQ" />

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-[#0A0A0A] to-[#121212]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Train for Planche?
          </h2>
          <p className="text-[#A5A5A5] mb-8 max-w-xl mx-auto">
            Get a personalized program based on your current strength levels and weak points.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
              Analyze My Training
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-xs text-[#6B7280] mt-4">
            Free readiness analysis. No credit card required.
          </p>
        </div>
      </section>
    </SeoPageLayout>
  )
}
