import { Metadata } from 'next'
import Link from 'next/link'
import { Target, ArrowRight, CheckCircle2, AlertTriangle, Dumbbell, Calculator } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Front Lever Strength Requirements | Are You Strong Enough? | SpartanLab',
  description: 'Exact pulling strength requirements for front lever. Weighted pull-up benchmarks, scapular strength, and core tension metrics for each progression level.',
  keywords: ['front lever strength requirements', 'how strong for front lever', 'front lever prerequisites', 'weighted pull-up for front lever', 'front lever readiness'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/front-lever-strength-requirements`,
  },
  openGraph: {
    title: 'Front Lever Strength Requirements | Are You Strong Enough?',
    description: 'Exact pulling strength requirements for front lever from tuck to full.',
    url: `${SITE_CONFIG.url}/front-lever-strength-requirements`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const strengthRequirements = [
  { 
    level: 'Tuck Front Lever', 
    weightedPullUp: '+20% BW', 
    pullUps: '10-12 strict',
    rowStrength: 'Inverted rows',
    description: 'Entry level. Knees tucked to chest, body horizontal.',
    color: 'text-blue-400'
  },
  { 
    level: 'Advanced Tuck', 
    weightedPullUp: '+35% BW', 
    pullUps: '15+ strict',
    rowStrength: 'Tuck FL rows',
    description: 'Hips extended. Significantly longer lever arm.',
    color: 'text-green-400'
  },
  { 
    level: 'Straddle Front Lever', 
    weightedPullUp: '+50% BW', 
    pullUps: '20+ strict',
    rowStrength: 'Adv tuck FL rows',
    description: 'Legs extended wide. Major strength threshold.',
    color: 'text-yellow-400'
  },
  { 
    level: 'Full Front Lever', 
    weightedPullUp: '+65-75% BW', 
    pullUps: '25+ strict',
    rowStrength: 'Straddle FL rows',
    description: 'Legs together, fully horizontal. Elite level achievement.',
    color: 'text-[#C1121F]'
  },
]

const limitingFactors = [
  {
    factor: 'Pulling Strength',
    description: 'The primary limiter for most athletes. Weighted pull-up strength is the strongest predictor.',
    fix: 'Prioritize heavy weighted pull-ups (3-5 rep range) 2-3x per week.',
  },
  {
    factor: 'Scapular Depression',
    description: 'Must maintain depressed scapulae under load. Different muscle activation than pull-ups.',
    fix: 'Scapular pulls from dead hang, front lever raises, and active hang holds.',
  },
  {
    factor: 'Lat Engagement',
    description: 'Lats must engage at extreme shoulder extension angles. Requires specific training.',
    fix: 'Straight-arm pulldowns, front lever negatives, and lever-specific pulling.',
  },
  {
    factor: 'Core Tension',
    description: 'Full-body tension required to maintain horizontal position without arching.',
    fix: 'Hollow body holds, dragon flags, and compression work for anti-extension strength.',
  },
]

const faqs = [
  {
    question: 'How much weighted pull-up for front lever?',
    answer: 'Full front lever typically requires +65-75% bodyweight weighted pull-up for 5 reps. For a 175 lb athlete, that is +115-130 lb. Tuck front lever is achievable at +20-25% bodyweight.',
  },
  {
    question: 'Why can I do heavy weighted pull-ups but not front lever?',
    answer: 'Front lever requires horizontal pulling strength and straight-arm lat engagement - different from vertical pulling. You need specific front lever training (rows, raises, holds) to build the motor pattern and angle-specific strength.',
  },
  {
    question: 'How long to achieve front lever?',
    answer: 'With proper prerequisites, tuck front lever takes 2-4 months. Full front lever typically requires 1-3 years of dedicated training. The straddle to full transition is often the longest phase.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Front Lever Strength Requirements',
    description: 'Complete pulling strength benchmarks for front lever progression.',
    url: `${SITE_CONFIG.url}/front-lever-strength-requirements`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Requirements', url: '/front-lever-strength-requirements' },
  ]),
  generateFAQSchema(faqs),
]

export default function FrontLeverStrengthRequirementsPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Hero */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-b border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4">
            <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
            <span>/</span>
            <span className="text-[#C1121F]">Front Lever Requirements</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Front Lever Strength Requirements
            <span className="block text-[#C1121F] mt-2">(Are You Strong Enough?)</span>
          </h1>
          
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            SpartanLab evaluates front lever readiness through weighted pulling strength, 
            scapular control, and horizontal pulling capacity. Pulling power determines your progress.
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
                      <div className="text-xs text-[#6B7280] mb-1">Weighted Pull-Up</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.weightedPullUp}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Pull-Ups</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.pullUps}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Row Strength</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.rowStrength}</div>
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
                  8-10 strict pull-ups
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  +15% BW weighted pull-up
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  10-sec active hang
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for tuck front lever work</p>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <h3 className="font-semibold">Intermediate Ready</h3>
              </div>
              <ul className="text-sm text-[#A4ACB8] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  +35% BW weighted pull-up
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  10-sec tuck front lever
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  5 tuck FL rows
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
                  +50% BW weighted pull-up
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  5-sec advanced tuck
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  8 adv tuck FL rows
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
                <h3 className="text-lg font-semibold mb-2">Run Your Full Front Lever Readiness Analysis</h3>
                <p className="text-sm text-[#A4ACB8]">
                  SpartanLab evaluates your pulling strength, scapular control, and horizontal pulling 
                  capacity to identify your exact weak points and optimal progression.
                </p>
              </div>
              <Link href="/front-lever-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
                  Front Lever Calculator
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
            <Link href="/guides/front-lever-training">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Front Lever Training Guide</h3>
                <p className="text-xs text-[#6B7280]">Complete training methodology</p>
              </Card>
            </Link>
            <Link href="/weighted-pull-up-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Pull-Up Standards</h3>
                <p className="text-xs text-[#6B7280]">Pulling benchmarks</p>
              </Card>
            </Link>
            <Link href="/planche-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Planche Requirements</h3>
                <p className="text-xs text-[#6B7280]">Pushing strength needs</p>
              </Card>
            </Link>
            <Link href="/programs">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Programs</h3>
                <p className="text-xs text-[#6B7280]">Structured front lever programs</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ faqs={faqs} title="Front Lever Strength FAQ" />

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-[#0A0A0A] to-[#121212]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Train for Front Lever?
          </h2>
          <p className="text-[#A5A5A5] mb-8 max-w-xl mx-auto">
            Get a personalized program based on your current pulling strength and weak points.
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
