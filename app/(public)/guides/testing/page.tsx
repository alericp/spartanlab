import { Metadata } from 'next'
import Link from 'next/link'
import { 
  ArrowRight, 
  Dumbbell, 
  Target, 
  Flame, 
  BookOpen,
  CheckCircle2,
  Thermometer,
  ClipboardList
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackNav } from '@/components/navigation/BackNav'
import { 
  STRENGTH_TESTS, 
  SKILL_TESTS, 
  FLEXIBILITY_TESTS,
  type TestingGuide,
  type TestCategory
} from '@/lib/testing-guides'

export const metadata: Metadata = {
  title: 'How to Test Your Metrics | SpartanLab Testing Guides',
  description: 'Learn how to properly test your strength, skill, and flexibility benchmarks for accurate training programs. Includes warm-up guidance, form standards, and recording tips.',
  keywords: ['calisthenics testing', 'pull-up test', 'front lever test', 'planche test', 'flexibility assessment', 'strength benchmarks'],
  openGraph: {
    title: 'How to Test Your Metrics | SpartanLab',
    description: 'Proper testing instructions for strength, skill, and flexibility benchmarks.',
  },
}

const categoryConfig: Record<TestCategory, { 
  icon: typeof Dumbbell
  title: string
  description: string
  color: string
  bgColor: string
}> = {
  strength: {
    icon: Dumbbell,
    title: 'Strength Tests',
    description: 'Max rep tests and weighted movement benchmarks',
    color: 'text-[#C1121F]',
    bgColor: 'bg-[#C1121F]/10'
  },
  skill: {
    icon: Target,
    title: 'Skill Tests',
    description: 'Progression levels and hold times for calisthenics skills',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10'
  },
  flexibility: {
    icon: Flame,
    title: 'Flexibility Tests',
    description: 'Range of motion assessments for key positions',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10'
  }
}

function TestCard({ test, category }: { test: TestingGuide; category: TestCategory }) {
  const config = categoryConfig[category]
  const Icon = config.icon

  return (
    <Link href={`/guides/testing/${test.id}`}>
      <Card className="h-full bg-[#1A1F26] border-[#2B313A] p-5 hover:border-[#C1121F]/40 transition-colors group">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#E6E9EF] mb-1 group-hover:text-[#C1121F] transition-colors">
              {test.name}
            </h3>
            <p className="text-sm text-[#A4ACB8] line-clamp-2">
              {test.shortDescription}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default function TestingGuidesPage() {
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Navigation */}
      <nav className="px-4 py-3 border-b border-[#2B313A]/50 sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <BackNav to="guides" />
        </div>
      </nav>

      {/* Header */}
      <div className="px-4 py-16 sm:py-20 border-b border-[#2B313A]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 mb-6">
            <ClipboardList className="w-4 h-4 text-[#C1121F]" />
            <span className="text-xs font-medium text-[#C1121F]">Testing Guides</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#E6E9EF] mb-6 text-balance">
            How to Test Your Metrics
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-3xl mx-auto leading-relaxed">
            Accurate testing leads to better training programs. These guides explain how to 
            properly test your strength, skills, and flexibility for reliable results.
          </p>
        </div>
      </div>

      <div className="px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Quick Tips */}
          <Card className="bg-gradient-to-br from-amber-500/5 to-[#1A1F26] border-amber-500/20 p-6 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Before You Test</h2>
                <ul className="space-y-2 text-sm text-[#A4ACB8]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    Always warm up before testing. Use 1-2 easier sets before max efforts.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    Test when you are fresh, not after a hard workout.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    Stop if you feel sharp pain. Discomfort at end-range is normal; pain is not.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    You can update your numbers anytime as you improve.
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Strength Tests */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#E6E9EF]">Strength Tests</h2>
                <p className="text-sm text-[#6B7280]">Max rep tests and weighted benchmarks</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STRENGTH_TESTS.map((test) => (
                <TestCard key={test.id} test={test} category="strength" />
              ))}
            </div>
          </section>

          {/* Skill Tests */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#E6E9EF]">Skill Tests</h2>
                <p className="text-sm text-[#6B7280]">Progression levels and hold times</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SKILL_TESTS.map((test) => (
                <TestCard key={test.id} test={test} category="skill" />
              ))}
            </div>
          </section>

          {/* Flexibility Tests */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#E6E9EF]">Flexibility Tests</h2>
                <p className="text-sm text-[#6B7280]">Range of motion assessments</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FLEXIBILITY_TESTS.map((test) => (
                <TestCard key={test.id} test={test} category="flexibility" />
              ))}
            </div>
          </section>

          {/* CTA */}
          <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8 sm:p-12">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-4">
                Ready to Update Your Profile?
              </h2>
              <p className="text-[#A4ACB8] mb-8 leading-relaxed">
                SpartanLab adapts to your progress. Update your strength and skill metrics 
                anytime to refine your training program.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  <Link href="/sign-in?redirect_url=/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-[#2B313A] text-[#A4ACB8]">
                  <Link href="/guides">
                    <BookOpen className="w-5 h-5 mr-2" />
                    All Training Guides
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
