import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'How Strong Do You Need to Be for Planche? | SpartanLab',
  description: 'Learn the exact strength requirements for planche. Discover the pushing benchmarks, straight-arm conditioning, and what it takes to achieve this elite calisthenics skill.',
  keywords: ['planche strength requirements', 'how strong for planche', 'planche prerequisites', 'planche training requirements', 'planche benchmarks'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/how-strong-for-planche`,
  },
  openGraph: {
    title: 'How Strong for Planche? | SpartanLab',
    description: 'Learn the exact strength requirements for planche progression.',
    url: `${SITE_CONFIG.url}/how-strong-for-planche`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const strengthRequirements = [
  { stage: 'Tuck Planche', dips: '20+ strict', weighted: '+40% BW dip', plancheLean: '60s lean', timeframe: 'Month 6-12' },
  { stage: 'Advanced Tuck', dips: '25+ strict', weighted: '+55% BW dip', plancheLean: '45s lean, hips back', timeframe: 'Month 12-18' },
  { stage: 'Straddle Planche', dips: '30+ strict', weighted: '+70% BW dip', plancheLean: 'Full lean, shoulders past wrists', timeframe: 'Month 18-36' },
  { stage: 'Full Planche', dips: '30+ strict', weighted: '+80%+ BW dip', plancheLean: 'Full lean mastery', timeframe: 'Year 3-5+' },
]

const keyBenchmarks = [
  { benchmark: 'Weighted Dips', target: '+70% bodyweight for 5 reps', why: 'Builds the pressing foundation needed for planche. This is the minimum for serious planche training.' },
  { benchmark: 'Planche Lean', target: '60+ seconds with shoulders past wrists', why: 'Develops the specific wrist, shoulder, and straight-arm conditioning unique to planche.' },
  { benchmark: 'Pseudo Planche Push-Ups', target: '15+ reps with full lean', why: 'Builds dynamic strength in the planche position. Critical for planche press progressions.' },
  { benchmark: 'L-Sit Hold', target: '30+ seconds', why: 'Demonstrates core compression and shoulder depression strength needed for planche.' },
]

const uniqueChallenges = [
  { title: 'Straight-Arm Strength', description: 'Unlike any other exercise, planche requires extreme straight-arm pushing. This takes years to develop and cannot be rushed.' },
  { title: 'Wrist Conditioning', description: 'Your wrists bear enormous load in planche. Progressive wrist strengthening is essential and often overlooked.' },
  { title: 'Shoulder Protraction', description: 'Maximum protraction (pushing shoulders forward) while maintaining position requires specific training.' },
  { title: 'Time Investment', description: 'Planche typically takes 3-5 years of dedicated training. It is one of the most difficult calisthenics skills.' },
]

const trainingRecommendations = [
  { exercise: 'Planche Leans', sets: '4x30-60s', purpose: 'Build straight-arm conditioning' },
  { exercise: 'Pseudo Planche Push-Ups', sets: '4x8-12', purpose: 'Dynamic pressing in planche position' },
  { exercise: 'Weighted Dips', sets: '5x5', purpose: 'Build max pressing strength' },
  { exercise: 'Tuck Planche Holds', sets: '5x10-20s', purpose: 'Skill practice at current level' },
  { exercise: 'Band-Assisted Planche', sets: '4x15-30s', purpose: 'Practice full position with assistance' },
]

const faqs = [
  {
    question: 'Why is planche so much harder than front lever?',
    answer: 'Planche requires straight-arm pushing strength, which is biomechanically disadvantaged compared to pulling. You are essentially doing a push-up with your entire body extended, requiring massive shoulder and tricep strength in a locked arm position. Most athletes find planche takes 2-3x longer to achieve than front lever.',
  },
  {
    question: 'Can I achieve planche with just bodyweight training?',
    answer: 'While the planche itself is bodyweight, building the prerequisite strength is faster with weighted exercises. Heavy weighted dips (+70% BW) build the pressing foundation much faster than bodyweight dips alone. Combine weighted work with planche-specific training.',
  },
  {
    question: 'How important are genetics for planche?',
    answer: 'Genetics play a significant role. Factors like arm length, shoulder width, and tendon insertions affect leverage. Shorter arms and favorable proportions make planche easier. However, with enough time (3-7 years), most dedicated athletes can achieve at least a straddle planche.',
  },
  {
    question: 'Should I train front lever or planche first?',
    answer: 'Most athletes find front lever easier and achieve it first. Training front lever builds body tension and isometric strength that transfers to planche. However, you can train both simultaneously - they use opposite muscle groups.',
  },
  {
    question: 'How long does it realistically take to achieve full planche?',
    answer: 'For most athletes, full planche takes 3-5 years of dedicated, intelligent training. Tuck planche may come in 1-2 years. Straddle planche typically takes 2-4 years. Some athletes with favorable genetics achieve it faster, while others may take longer.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'How Strong Do You Need to Be for Planche?',
    description: 'Complete guide to strength requirements for planche training.',
    url: `${SITE_CONFIG.url}/how-strong-for-planche`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Planche', url: '/skills/planche' },
    { name: 'Strength Requirements', url: '/how-strong-for-planche' },
  ]),
  generateFAQSchema(faqs),
]

export default function HowStrongForPlanchePage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6 flex-wrap">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/skills/planche" className="hover:text-[#E6E9EF]">Planche</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Strength Requirements</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Requirements</span>
              <h1 className="text-3xl sm:text-4xl font-bold">How Strong for Planche?</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The planche is one of the most demanding calisthenics skills. Learn what strength benchmarks 
            you need and why this skill requires years of dedicated training.
          </p>
        </header>

        {/* Quick Answer */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#1A1D23] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-3">The Reality</h2>
            <p className="text-[#A5A5A5] mb-4">
              For a <strong className="text-[#E6E9EF]">straddle planche</strong> (most athletes goal), you need:
            </p>
            <ul className="space-y-2 text-[#E6E9EF]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>+70% bodyweight</strong> weighted dip for 5 reps</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>60+ second</strong> planche lean with shoulders past wrists</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F]" />
                <span><strong>2-4 years</strong> of dedicated planche-specific training</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Progression Requirements */}
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
                      <span className="text-[#6B7280]">Dips:</span>
                      <span className="text-[#E6E9EF] ml-1 font-medium">{req.dips}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Weighted:</span>
                      <span className="text-[#E6E9EF] ml-1 font-medium">{req.weighted}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Benchmarks */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Key Strength Benchmarks</h2>
          <div className="space-y-4">
            {keyBenchmarks.map((item) => (
              <Card key={item.benchmark} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex items-start gap-4">
                  <Dumbbell className="w-5 h-5 text-[#C1121F] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-[#E6E9EF]">{item.benchmark}</h3>
                      <span className="text-sm text-[#C1121F] font-mono">{item.target}</span>
                    </div>
                    <p className="text-sm text-[#A5A5A5]">{item.why}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Unique Challenges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What Makes Planche So Difficult</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {uniqueChallenges.map((item) => (
              <Card key={item.title} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">{item.title}</h3>
                <p className="text-sm text-[#A5A5A5]">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Training Recommendations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Essential Training Exercises</h2>
          <div className="space-y-3">
            {trainingRecommendations.map((item) => (
              <Card key={item.exercise} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF]">{item.exercise}</h3>
                    <p className="text-sm text-[#A5A5A5]">{item.purpose}</p>
                  </div>
                  <span className="text-sm font-mono text-[#C1121F]">{item.sets}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#1A1D23] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-2">Check Your Planche Readiness</h2>
            <p className="text-[#A5A5A5] mb-4">
              Use our calculator to assess your current strength and see what you need to work on.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/planche-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  <Calculator className="w-4 h-4 mr-2" />
                  Planche Readiness Calculator
                </Button>
              </Link>
              <Link href="/skills/planche">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Full Planche Guide
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
            <Link href="/dip-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Dip Strength Standards
              </Button>
            </Link>
            <Link href="/weighted-dip-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Weighted Dip Standards
              </Button>
            </Link>
            <Link href="/planche-progression">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Planche Progression
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
