import { Metadata } from 'next'
import Link from 'next/link'
import { Target, ArrowRight, CheckCircle2, AlertTriangle, Dumbbell, Calculator, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Muscle-Up Strength Requirements | Are You Strong Enough? | SpartanLab',
  description: 'Exact pulling, pushing, and explosive strength requirements for muscle-ups. Pull-up and dip benchmarks needed for bar and ring muscle-ups.',
  keywords: ['muscle-up strength requirements', 'how strong for muscle-up', 'muscle-up prerequisites', 'pull-ups for muscle-up', 'muscle-up readiness'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/muscle-up-strength-requirements`,
  },
  openGraph: {
    title: 'Muscle-Up Strength Requirements | Are You Strong Enough?',
    description: 'Exact pulling, pushing, and explosive strength requirements for strict and kipping muscle-ups.',
    url: `${SITE_CONFIG.url}/muscle-up-strength-requirements`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const strengthRequirements = [
  { 
    level: 'Kipping Bar Muscle-Up', 
    pullUps: '8-10 strict',
    dips: '12-15 strict',
    explosive: 'Chest-to-bar pull-ups',
    description: 'Entry level. Uses momentum to assist the transition.',
    color: 'text-blue-400'
  },
  { 
    level: 'Strict Bar Muscle-Up', 
    pullUps: '12-15 strict',
    dips: '15-20 strict',
    explosive: 'High pull-ups (hips to bar)',
    description: 'No kip. Pure pulling strength through transition.',
    color: 'text-green-400'
  },
  { 
    level: 'Ring Muscle-Up', 
    pullUps: '15+ strict',
    dips: '10 ring dips',
    explosive: 'False grip pull-ups',
    description: 'Requires false grip and ring stability. Harder than bar.',
    color: 'text-yellow-400'
  },
  { 
    level: 'Weighted Muscle-Up', 
    pullUps: '+25% BW weighted',
    dips: '+50% BW weighted',
    explosive: 'Explosive muscle-ups',
    description: 'Elite level. Adding load to the complete movement.',
    color: 'text-[#C1121F]'
  },
]

const limitingFactors = [
  {
    factor: 'Pulling Power',
    description: 'Must be able to pull explosively high enough to clear the transition. High pull strength is critical.',
    fix: 'Chest-to-bar pull-ups, explosive pull-ups, and weighted pull-ups for raw strength.',
  },
  {
    factor: 'Transition Strength',
    description: 'The transition requires pulling with elbows traveling backward, not the same as regular pull-ups.',
    fix: 'Negative muscle-ups, banded muscle-ups, and low bar muscle-up practice.',
  },
  {
    factor: 'Dip Strength',
    description: 'Once over the bar/rings, you need pushing strength to complete. Often underestimated.',
    fix: 'Build to 15+ strict dips and practice deep dips for range of motion.',
  },
  {
    factor: 'False Grip (Rings)',
    description: 'Ring muscle-ups require false grip to maintain wrist position through transition.',
    fix: 'False grip hangs, false grip pull-ups, and gradual duration progression.',
  },
]

const faqs = [
  {
    question: 'How many pull-ups do I need for a muscle-up?',
    answer: 'A strict bar muscle-up typically requires 12-15 strict pull-ups. A kipping muscle-up can be achieved with 8-10. Ring muscle-ups require 15+ plus false grip strength. Explosive pulling ability is more important than max reps.',
  },
  {
    question: 'Why cant I do a muscle-up with 15 pull-ups?',
    answer: 'Pull-up reps alone dont guarantee muscle-up ability. The muscle-up requires explosive pulling, transition-specific strength (pulling with elbows back), and dip strength. You need high pull-ups where you clear chest height.',
  },
  {
    question: 'Which is easier - bar or ring muscle-up?',
    answer: 'Bar muscle-ups are generally easier because they dont require false grip and the bar is stable. Ring muscle-ups require false grip mastery and ring stability, making them significantly harder for most athletes.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Muscle-Up Strength Requirements',
    description: 'Complete strength benchmarks for bar and ring muscle-ups.',
    url: `${SITE_CONFIG.url}/muscle-up-strength-requirements`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Requirements', url: '/muscle-up-strength-requirements' },
  ]),
  generateFAQSchema(faqs),
]

export default function MuscleUpStrengthRequirementsPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Hero */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-b border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4">
            <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
            <span>/</span>
            <span className="text-[#C1121F]">Muscle-Up Requirements</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Muscle-Up Strength Requirements
            <span className="block text-[#C1121F] mt-2">(Are You Strong Enough?)</span>
          </h1>
          
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            SpartanLab evaluates muscle-up readiness through pulling power, transition strength, 
            and dip capacity. Explosive strength determines your success rate.
          </p>
        </div>
      </section>

      {/* Requirements Breakdown */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            Strength Benchmarks by Variation
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
                      <div className="text-xs text-[#6B7280] mb-1">Pull-Ups</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.pullUps}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Dips</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.dips}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Explosive</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.explosive}</div>
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
                  8 strict pull-ups
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  12 strict dips
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  Chest-to-bar pulls
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for kipping muscle-up work</p>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <h3 className="font-semibold">Intermediate Ready</h3>
              </div>
              <ul className="text-sm text-[#A4ACB8] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  12 strict pull-ups
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  15 strict dips
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  3 high pull-ups
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for strict bar muscle-up</p>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#C1121F]"></div>
                <h3 className="font-semibold">Advanced Ready</h3>
              </div>
              <ul className="text-sm text-[#A4ACB8] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  15+ strict pull-ups
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  10 ring dips
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  30-sec false grip hang
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for ring muscle-up</p>
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
                <h3 className="text-lg font-semibold mb-2">Run Your Full Muscle-Up Readiness Analysis</h3>
                <p className="text-sm text-[#A4ACB8]">
                  SpartanLab evaluates your pulling power, transition strength, and dip capacity 
                  to identify your exact weak points and optimal training path.
                </p>
              </div>
              <Link href="/muscle-up-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
                  Muscle-Up Calculator
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
            <Link href="/guides/muscle-up-training">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Muscle-Up Training Guide</h3>
                <p className="text-xs text-[#6B7280]">Complete training methodology</p>
              </Card>
            </Link>
            <Link href="/calisthenics-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">Pull-up and dip benchmarks</p>
              </Card>
            </Link>
            <Link href="/front-lever-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Front Lever Requirements</h3>
                <p className="text-xs text-[#6B7280]">Advanced pulling needs</p>
              </Card>
            </Link>
            <Link href="/programs">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Programs</h3>
                <p className="text-xs text-[#6B7280]">Structured muscle-up programs</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ faqs={faqs} title="Muscle-Up Strength FAQ" />

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-[#0A0A0A] to-[#121212]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Train for Muscle-Ups?
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
