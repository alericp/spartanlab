import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, Target, Zap, CheckCircle2, Scale, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Hybrid Training Program | Calisthenics + Barbell Strength | SpartanLab',
  description: 'Combine calisthenics skills with barbell training intelligently. Build complete strength with weighted pull-ups, deadlifts, and skill progressions.',
  keywords: ['hybrid training', 'calisthenics and weightlifting', 'barbell calisthenics', 'hybrid strength program', 'combined training'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/hybrid-training-program`,
  },
  openGraph: {
    title: 'Hybrid Training Program | SpartanLab',
    description: 'Intelligently combine calisthenics skills with barbell strength training.',
    url: `${SITE_CONFIG.url}/hybrid-training-program`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const hybridBenefits = [
  { title: 'Maximum Strength Development', description: 'Barbells allow progressive overload beyond bodyweight limitations' },
  { title: 'Skill Transfer', description: 'Heavy weighted movements directly support calisthenics progressions' },
  { title: 'Complete Physique', description: 'Address movement patterns that bodyweight alone cannot optimally train' },
  { title: 'Injury Prevention', description: 'Balanced development across push/pull/hinge patterns' },
]

const programStructure = [
  { 
    day: 'Day 1: Pull Strength',
    focus: 'Weighted Pull-Ups + Deadlift',
    exercises: ['Weighted Pull-Ups (5x5)', 'Deadlift (5x3)', 'Front Lever Rows (4x6)', 'Barbell Rows (3x8)'],
    rationale: 'Combine vertical and horizontal pulling with hip hinge'
  },
  { 
    day: 'Day 2: Push Strength',
    focus: 'Weighted Dips + Pressing',
    exercises: ['Weighted Dips (5x5)', 'Overhead Press (5x5)', 'Planche Leans (4x20s)', 'PPPU (3x8)'],
    rationale: 'Vertical and horizontal pushing with straight-arm skill'
  },
  { 
    day: 'Day 3: Skill Focus',
    focus: 'Calisthenics Progressions',
    exercises: ['Front Lever Progressions', 'Planche Progressions', 'Handstand Practice', 'L-Sit/Compression'],
    rationale: 'Dedicated skill work when fresh'
  },
  { 
    day: 'Day 4: Lower + Core',
    focus: 'Squats + Compression',
    exercises: ['Back Squat (5x5)', 'Romanian Deadlift (3x8)', 'Hanging Leg Raises (4x10)', 'Compression Work'],
    rationale: 'Lower body strength and core compression for skills'
  },
]

const integrationPrinciples = [
  { 
    principle: 'Strength Before Skill', 
    description: 'Place heavy barbell work early in the week when recovery is optimal. Skill work thrives on a strength foundation.',
    icon: Dumbbell
  },
  { 
    principle: 'Periodize Intelligently', 
    description: 'Don\'t max out both systems simultaneously. Alternate emphasis between skill blocks and strength blocks.',
    icon: TrendingUp
  },
  { 
    principle: 'Monitor Recovery', 
    description: 'Hybrid training creates more systemic fatigue. Track readiness and autoregulate intensity accordingly.',
    icon: Zap
  },
  { 
    principle: 'Complementary Selection', 
    description: 'Choose exercises that support each other. Deadlifts help front lever. Weighted dips help planche.',
    icon: Target
  },
]

const whereTraditionalFails = [
  { problem: 'Generic periodization', solution: 'SpartanLab adapts based on your actual skill + strength data' },
  { problem: 'Ignoring skill transfer', solution: 'Our system maps barbell gains to calisthenics progressions' },
  { problem: 'Fixed programming', solution: 'Readiness-based adjustments prevent overtraining' },
  { problem: 'Isolated tracking', solution: 'Unified strength score across all movement patterns' },
]

const faqs = [
  {
    question: 'Can I combine powerlifting and calisthenics effectively?',
    answer: 'Yes, with intelligent programming. The key is understanding transfer: heavy pulls help front lever, heavy pressing helps planche, but the relationship isn\'t automatic. SpartanLab tracks both domains and optimizes the interaction.',
  },
  {
    question: 'Will barbells slow my calisthenics progress?',
    answer: 'The opposite, usually. Most skill plateaus are hidden strength deficits. A +50% BW weighted pull-up makes tuck front lever trivial. The issue is poor programming that exhausts recovery, not the barbell itself.',
  },
  {
    question: 'How do I balance skill work and heavy lifting?',
    answer: 'Dedicate 1-2 days to heavy lifting, 1-2 days to skill focus, and use the remaining days for integration or recovery. Never max out both systems in the same session. Periodize emphasis across 4-8 week blocks.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Hybrid Training Program',
    description: 'Complete guide to combining calisthenics and barbell training',
    url: `${SITE_CONFIG.url}/hybrid-training-program`,
    publishedDate: '2024-01-01',
    modifiedDate: new Date().toISOString().split('T')[0],
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Training', url: `${SITE_CONFIG.url}/training` },
    { name: 'Hybrid Training', url: `${SITE_CONFIG.url}/hybrid-training-program` },
  ]),
  generateFAQSchema(faqs),
]

export default function HybridTrainingProgramPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/training" className="hover:text-[#E6E9EF]">Training</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Hybrid Program</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#C1121F]/10 rounded-lg">
              <Scale className="w-6 h-6 text-[#C1121F]" />
            </div>
            <span className="text-sm font-medium text-[#C1121F]">Hybrid Strength</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF] mb-4">
            Hybrid Training Program
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            Combine calisthenics skills with barbell strength intelligently. 
            Build complete strength without sacrificing skill progression.
          </p>
        </div>
      </section>

      {/* Why Hybrid */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Why Hybrid Training?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {hybridBenefits.map((benefit) => (
              <Card key={benefit.title} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] mb-1">{benefit.title}</h3>
                    <p className="text-sm text-[#A4ACB8]">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Program Structure */}
      <section className="py-8 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Sample 4-Day Structure</h2>
          <div className="space-y-4">
            {programStructure.map((day) => (
              <Card key={day.day} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{day.day}</h3>
                    <p className="text-sm text-[#C1121F] mb-2">{day.focus}</p>
                    <ul className="space-y-1">
                      {day.exercises.map((ex) => (
                        <li key={ex} className="text-sm text-[#A4ACB8] flex items-center gap-2">
                          <span className="w-1 h-1 bg-[#6B7280] rounded-full" />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="md:max-w-[200px]">
                    <p className="text-xs text-[#6B7280] italic">{day.rationale}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Principles */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Integration Principles</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {integrationPrinciples.map((item) => (
              <Card key={item.principle} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-[#C1121F] mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-2">{item.principle}</h3>
                    <p className="text-sm text-[#A4ACB8]">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Where Traditional Fails */}
      <section className="py-8 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Where Traditional Programs Fail</h2>
          <div className="space-y-3">
            {whereTraditionalFails.map((item) => (
              <Card key={item.problem} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-400/80">Problem:</span>
                    <span className="text-[#A4ACB8]">{item.problem}</span>
                  </div>
                  <div className="hidden sm:block text-[#6B7280]">→</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">SpartanLab:</span>
                    <span className="text-[#E6E9EF]">{item.solution}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Transfer Mapping */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Barbell → Calisthenics Transfer</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-[#E6E9EF] mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#C1121F]" />
                Pulling Transfer
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between text-[#A4ACB8]">
                  <span>Deadlift 2x BW</span>
                  <span className="text-[#6B7280]">→ Front Lever Foundation</span>
                </li>
                <li className="flex justify-between text-[#A4ACB8]">
                  <span>Weighted Pull +60% BW</span>
                  <span className="text-[#6B7280]">→ Tuck Front Lever</span>
                </li>
                <li className="flex justify-between text-[#A4ACB8]">
                  <span>Barbell Row 1.2x BW</span>
                  <span className="text-[#6B7280]">→ Advanced Tuck</span>
                </li>
              </ul>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-[#E6E9EF] mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Pushing Transfer
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between text-[#A4ACB8]">
                  <span>OHP 0.75x BW</span>
                  <span className="text-[#6B7280]">→ Wall HSPU</span>
                </li>
                <li className="flex justify-between text-[#A4ACB8]">
                  <span>Weighted Dip +60% BW</span>
                  <span className="text-[#6B7280]">→ Tuck Planche</span>
                </li>
                <li className="flex justify-between text-[#A4ACB8]">
                  <span>Bench 1.5x BW</span>
                  <span className="text-[#6B7280]">→ Advanced Pushing Base</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/powerlifting-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Powerlifting Standards</h3>
                <p className="text-xs text-[#6B7280]">SBD benchmarks by bodyweight</p>
              </Card>
            </Link>
            <Link href="/weighted-calisthenics-vs-powerlifting">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Systems Compared</h3>
                <p className="text-xs text-[#6B7280]">Detailed comparison guide</p>
              </Card>
            </Link>
            <Link href="/front-lever-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Front Lever Requirements</h3>
                <p className="text-xs text-[#6B7280]">Skill strength thresholds</p>
              </Card>
            </Link>
            <Link href="/training">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">All Training Programs</h3>
                <p className="text-xs text-[#6B7280]">Browse program options</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <FAQ faqs={faqs} title="Common Questions" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-[#0F1115] to-[#0D0D0D]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Build Your Hybrid Program</h2>
          <p className="text-[#A4ACB8] mb-6">
            SpartanLab unifies barbell and calisthenics tracking with intelligent, readiness-based programming.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2 w-full sm:w-auto">
                Start Training Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/programs">
              <Button size="lg" variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] w-full sm:w-auto">
                Explore Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
