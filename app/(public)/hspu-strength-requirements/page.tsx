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
  title: 'HSPU Strength Requirements | Are You Strong Enough? | SpartanLab',
  description: 'Exact pressing and shoulder strength requirements for handstand push-ups. Pike push-up, dip, and overhead benchmarks for wall and freestanding HSPU.',
  keywords: ['hspu strength requirements', 'handstand push-up prerequisites', 'how strong for hspu', 'pike push-up for hspu', 'hspu readiness'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/hspu-strength-requirements`,
  },
  openGraph: {
    title: 'HSPU Strength Requirements | Are You Strong Enough?',
    description: 'Exact pressing and shoulder strength requirements for wall and freestanding handstand push-ups.',
    url: `${SITE_CONFIG.url}/hspu-strength-requirements`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const strengthRequirements = [
  { 
    level: 'Wall HSPU (Partial ROM)', 
    pikePushUp: '15 strict',
    dips: '20 strict',
    shoulderPress: '0.5x BW',
    description: 'Entry level. Head to floor with partial range.',
    color: 'text-blue-400'
  },
  { 
    level: 'Wall HSPU (Full ROM)', 
    pikePushUp: '10 deficit pike',
    dips: '+25% BW weighted',
    shoulderPress: '0.6x BW',
    description: 'Full depth to floor. Standard wall HSPU.',
    color: 'text-green-400'
  },
  { 
    level: 'Wall HSPU (Deficit)', 
    pikePushUp: '8 elevated deficit',
    dips: '+40% BW weighted',
    shoulderPress: '0.7x BW',
    description: 'Extended range below hand height.',
    color: 'text-yellow-400'
  },
  { 
    level: 'Freestanding HSPU', 
    pikePushUp: '5 freestanding pike',
    dips: '+50% BW weighted',
    shoulderPress: '0.8x BW',
    description: 'Elite level. No wall support during press.',
    color: 'text-[#C1121F]'
  },
]

const limitingFactors = [
  {
    factor: 'Pressing Strength',
    description: 'Vertical pressing strength is the primary determinant. Pike push-ups and weighted dips build this.',
    fix: 'Prioritize pike push-ups (elevated feet), deficit pike push-ups, and weighted dips.',
  },
  {
    factor: 'Shoulder Stability',
    description: 'Shoulders must remain stable while inverted under load. Different from standing press.',
    fix: 'Wall walks, handstand holds, and controlled negative HSPUs.',
  },
  {
    factor: 'Core Anti-Extension',
    description: 'Core must prevent lower back from arching during the press phase.',
    fix: 'Hollow body holds, handstand hollow position, and compression work.',
  },
  {
    factor: 'Handstand Balance (Freestanding)',
    description: 'Freestanding HSPU requires balance maintenance during dynamic movement.',
    fix: 'Solid 30-sec freestanding handstand before attempting freestanding HSPU.',
  },
]

const faqs = [
  {
    question: 'How many pike push-ups for HSPU?',
    answer: 'A full-ROM wall HSPU typically requires 10 deficit pike push-ups (feet elevated). For partial ROM wall HSPU, 15 strict pike push-ups is sufficient. The pike push-up is the best predictor of HSPU readiness.',
  },
  {
    question: 'Can I do HSPU without a handstand?',
    answer: 'Wall HSPU can be trained without freestanding handstand ability. However, you need wall handstand comfort (30+ seconds) and shoulder stability while inverted. Freestanding HSPU requires solid freestanding handstand first.',
  },
  {
    question: 'Why cant I do HSPU with strong shoulders?',
    answer: 'Shoulder pressing strength alone doesnt transfer directly to HSPU. The inverted position requires different stability patterns, core anti-extension, and motor control. Pike push-ups bridge this gap better than overhead press.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'HSPU Strength Requirements',
    description: 'Complete pressing strength benchmarks for handstand push-up progression.',
    url: `${SITE_CONFIG.url}/hspu-strength-requirements`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Requirements', url: '/hspu-strength-requirements' },
  ]),
  generateFAQSchema(faqs),
]

export default function HSPUStrengthRequirementsPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Hero */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-b border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4">
            <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
            <span>/</span>
            <span className="text-[#C1121F]">HSPU Requirements</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            HSPU Strength Requirements
            <span className="block text-[#C1121F] mt-2">(Are You Strong Enough?)</span>
          </h1>
          
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            SpartanLab evaluates handstand push-up readiness through vertical pressing strength, 
            shoulder stability, and core control. Pressing power determines your ceiling.
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
                      <div className="text-xs text-[#6B7280] mb-1">Pike Push-Up</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.pikePushUp}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Dips</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.dips}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6B7280] mb-1">Shoulder Press</div>
                      <div className="font-mono text-sm text-[#E6E9EF]">{req.shoulderPress}</div>
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
                  15 strict pike push-ups
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  20 strict dips
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  30-sec wall handstand
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for partial ROM wall HSPU</p>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <h3 className="font-semibold">Intermediate Ready</h3>
              </div>
              <ul className="text-sm text-[#A4ACB8] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  10 deficit pike push-ups
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  +25% BW weighted dip
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  3 partial wall HSPU
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for full ROM wall HSPU</p>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#C1121F]"></div>
                <h3 className="font-semibold">Advanced Ready</h3>
              </div>
              <ul className="text-sm text-[#A4ACB8] space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  +40% BW weighted dip
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  10 full ROM wall HSPU
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 shrink-0" />
                  30-sec freestanding HS
                </li>
              </ul>
              <p className="text-xs text-[#6B7280] mt-3">Ready for deficit or freestanding</p>
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
                <h3 className="text-lg font-semibold mb-2">Run Your Full HSPU Readiness Analysis</h3>
                <p className="text-sm text-[#A4ACB8]">
                  SpartanLab evaluates your vertical pressing strength, shoulder stability, and core control 
                  to identify your exact weak points and optimal progression.
                </p>
              </div>
              <Link href="/hspu-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
                  HSPU Calculator
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
            <Link href="/guides/handstand-push-up-progression">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">HSPU Progression Guide</h3>
                <p className="text-xs text-[#6B7280]">Step-by-step training</p>
              </Card>
            </Link>
            <Link href="/guides/handstand-training">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Handstand Training</h3>
                <p className="text-xs text-[#6B7280]">Balance prerequisites</p>
              </Card>
            </Link>
            <Link href="/planche-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Planche Requirements</h3>
                <p className="text-xs text-[#6B7280]">Horizontal pressing needs</p>
              </Card>
            </Link>
            <Link href="/programs">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Training Programs</h3>
                <p className="text-xs text-[#6B7280]">Structured HSPU programs</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ faqs={faqs} title="HSPU Strength FAQ" />

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-[#0A0A0A] to-[#121212]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Train for HSPU?
          </h2>
          <p className="text-[#A5A5A5] mb-8 max-w-xl mx-auto">
            Get a personalized program based on your current pressing strength and weak points.
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
