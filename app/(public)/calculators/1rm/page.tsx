import { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, Dumbbell, ArrowRight, Target, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BackNav } from '@/components/navigation/BackNav'
import { JsonLd } from '@/components/seo/JsonLd'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'
import { SITE_CONFIG, generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seo'
import { LIFT_CONFIGS, LiftType } from '@/lib/strength/one-rep-max'

export const metadata: Metadata = {
  title: '1RM Calculator | Estimate Your One Rep Max | SpartanLab',
  description: 'Free 1RM calculator for weighted pull-ups, dips, bench press, squat, and deadlift. Estimate your one-rep max using the Epley formula and get working weights for training.',
  keywords: ['1rm calculator', 'one rep max calculator', 'pull up 1rm', 'dip 1rm calculator', 'bench press 1rm', 'squat 1rm', 'deadlift 1rm', 'epley formula'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/calculators/1rm`,
  },
  openGraph: {
    title: '1RM Calculator | SpartanLab',
    description: 'Free one-rep max calculator for all major lifts. Get your 1RM and training percentages instantly.',
    url: `${SITE_CONFIG.url}/calculators/1rm`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
}

const liftOrder: LiftType[] = [
  'weighted_pull_up',
  'weighted_dip', 
  'bench_press',
  'squat',
  'deadlift',
]

const jsonLdSchemas = [
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: '1RM Calculator', url: '/calculators/1rm' },
  ]),
  generateArticleSchema({
    title: '1RM Calculator - Estimate Your One Rep Max',
    description: 'Free 1RM calculator using the Epley formula. Calculate your one-rep max for weighted pull-ups, dips, bench press, squat, and deadlift.',
    url: `${SITE_CONFIG.url}/calculators/1rm`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
]

export default function OneRepMaxHubPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLd data={jsonLdSchemas[0]} />
      <JsonLd data={jsonLdSchemas[1]} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <BackNav href="/calculators" label="Back to Calculators" />

        {/* Hero Section */}
        <section className="text-center py-12 border-b border-[#2B313A]">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Calculator className="w-8 h-8 text-[#C1121F]" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF] mb-4">
            1RM Calculator
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl mx-auto mb-6">
            Estimate your one-rep max for any lift using the proven Epley formula. 
            Get instant working weights for strength and hypertrophy training.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="border-[#C1121F]/30 text-[#C1121F]">
              Free Tool
            </Badge>
            <Badge variant="outline" className="border-[#2B313A] text-[#A4ACB8]">
              Epley Formula
            </Badge>
            <Badge variant="outline" className="border-[#2B313A] text-[#A4ACB8]">
              Instant Results
            </Badge>
          </div>
        </section>

        {/* Lift Calculators */}
        <section className="py-12">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Choose Your Lift</h2>
          <p className="text-[#6B7280] mb-6">
            Select a lift to calculate your estimated 1RM and get training percentages.
          </p>
          
          <div className="grid gap-4">
            {liftOrder.map((liftId) => {
              const config = LIFT_CONFIGS[liftId]
              return (
                <Link key={config.slug} href={`/calculators/1rm/${config.slug}`}>
                  <Card className="bg-[#1A1F26] border-[#2B313A] p-5 hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-6 h-6 text-[#C1121F]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                            {config.name} 1RM Calculator
                          </h3>
                          {config.requiresBodyweight && (
                            <Badge variant="outline" className="border-[#2B313A] text-[#6B7280] text-xs">
                              + Bodyweight
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#6B7280] line-clamp-1">{config.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#2B313A] group-hover:text-[#C1121F] transition-colors shrink-0" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">How the 1RM Calculator Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-5 bg-[#1A1F26] rounded-xl border border-[#2B313A]">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center mb-4">
                <span className="text-lg font-bold text-[#C1121F]">1</span>
              </div>
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Enter Your Set</h3>
              <p className="text-sm text-[#6B7280]">
                Input the weight you lifted and how many reps you completed. For weighted calisthenics, add your bodyweight.
              </p>
            </div>
            <div className="p-5 bg-[#1A1F26] rounded-xl border border-[#2B313A]">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center mb-4">
                <span className="text-lg font-bold text-[#C1121F]">2</span>
              </div>
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Get Your 1RM</h3>
              <p className="text-sm text-[#6B7280]">
                We use the Epley formula: <code className="bg-[#0F1115] px-1 rounded">1RM = weight × (1 + reps/30)</code>
              </p>
            </div>
            <div className="p-5 bg-[#1A1F26] rounded-xl border border-[#2B313A]">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center mb-4">
                <span className="text-lg font-bold text-[#C1121F]">3</span>
              </div>
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Training Weights</h3>
              <p className="text-sm text-[#6B7280]">
                Get recommended working weights: 70% for hypertrophy, 80% for strength, 85-90% for heavy work.
              </p>
            </div>
          </div>
        </section>

        {/* Why Track 1RM */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Why Track Your 1RM?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex gap-4 p-5 bg-[#1A1F26] rounded-xl border border-[#2B313A]">
              <Target className="w-5 h-5 text-[#C1121F] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#E6E9EF] mb-1">Set Clear Goals</h3>
                <p className="text-sm text-[#6B7280]">
                  Knowing your current 1RM lets you set specific, measurable strength targets.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-[#1A1F26] rounded-xl border border-[#2B313A]">
              <TrendingUp className="w-5 h-5 text-[#C1121F] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#E6E9EF] mb-1">Track Real Progress</h3>
                <p className="text-sm text-[#6B7280]">
                  1RM gives you an objective number to track over time, beyond just "feeling stronger."
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-[#1A1F26] rounded-xl border border-[#2B313A]">
              <Dumbbell className="w-5 h-5 text-[#C1121F] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#E6E9EF] mb-1">Program Accurately</h3>
                <p className="text-sm text-[#6B7280]">
                  Use percentage-based programming with confidence when you know your actual max.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-[#1A1F26] rounded-xl border border-[#2B313A]">
              <Calculator className="w-5 h-5 text-[#C1121F] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#E6E9EF] mb-1">Predict Skill Readiness</h3>
                <p className="text-sm text-[#6B7280]">
                  Weighted pull-up and dip strength strongly predict front lever, planche, and muscle-up potential.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="py-12 border-t border-[#2B313A]">
          <ToolConversionCardStatic context="strength-standards" />
        </section>

        {/* Related Resources */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/calisthenics-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">See how your strength compares to benchmarks</p>
              </Card>
            </Link>
            <Link href="/calculators">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">All Calculators</h3>
                <p className="text-xs text-[#6B7280]">Explore more fitness calculation tools</p>
              </Card>
            </Link>
            <Link href="/guides/weighted-pull-up-training">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Pull-Up Guide</h3>
                <p className="text-xs text-[#6B7280]">How to build pulling strength systematically</p>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
