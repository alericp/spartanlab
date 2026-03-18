import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Target, 
  Dumbbell, 
  Calendar,
  Brain,
  Activity,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Zap
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Calisthenics Training Results | SpartanLab',
  description: 'See real examples of calisthenics strength progress including front lever training, pull-up strength improvements, and skill progression timelines.',
  keywords: ['calisthenics progress', 'front lever training results', 'pull-up strength progress', 'calisthenics transformation'],
  openGraph: {
    title: 'Calisthenics Training Results | SpartanLab',
    description: 'See real examples of calisthenics strength progress including front lever training, pull-up strength improvements, and skill progression timelines.',
    type: 'website',
  },
}

// Progress example data
const skillProgressExamples = [
  {
    skill: 'Front Lever',
    icon: Target,
    start: '6 sec hold',
    current: '14 sec hold',
    improvement: '+133%',
    timeframe: '10 weeks',
    color: 'from-[#C1121F]/20 to-[#C1121F]/5',
  },
  {
    skill: 'Planche',
    icon: Target,
    start: 'Tuck (8 sec)',
    current: 'Adv. Tuck (12 sec)',
    improvement: 'Progression',
    timeframe: '12 weeks',
    color: 'from-amber-500/20 to-amber-500/5',
  },
  {
    skill: 'Muscle-Up',
    icon: Zap,
    start: '0 reps',
    current: '5 clean reps',
    improvement: 'Unlocked',
    timeframe: '8 weeks',
    color: 'from-emerald-500/20 to-emerald-500/5',
  },
]

const strengthProgressExamples = [
  {
    exercise: 'Weighted Pull-Up',
    start: '+25 lb',
    current: '+55 lb',
    improvement: '+30 lb',
    percentGain: '+120%',
  },
  {
    exercise: 'Weighted Dip',
    start: '+30 lb',
    current: '+70 lb',
    improvement: '+40 lb',
    percentGain: '+133%',
  },
  {
    exercise: 'Front Lever Rows',
    start: '3 reps (tuck)',
    current: '6 reps (adv. tuck)',
    improvement: 'Progression',
    percentGain: '+100%',
  },
]

const timelineStages = [
  { week: 'Week 1', milestone: 'Tuck Front Lever', description: 'Initial assessment and baseline established', status: 'complete' },
  { week: 'Week 4', milestone: 'Improved Tuck Hold', description: '8 to 15 second holds consistently', status: 'complete' },
  { week: 'Week 6', milestone: 'Advanced Tuck', description: 'Hips extended, back flat position achieved', status: 'complete' },
  { week: 'Week 10', milestone: 'One-Leg Front Lever', description: 'Single leg extension drills introduced', status: 'complete' },
  { week: 'Week 12', milestone: 'Straddle Front Lever', description: 'Full straddle position held for 5+ seconds', status: 'current' },
]

const systemFeatures = [
  {
    icon: Brain,
    title: 'Strength Analysis',
    description: 'Identifies current strength levels across all movement patterns',
  },
  {
    icon: Target,
    title: 'Constraint Detection',
    description: 'Finds the specific weakness limiting your skill progress',
  },
  {
    icon: Activity,
    title: 'Fatigue Monitoring',
    description: 'Tracks recovery signals to optimize training intensity',
  },
  {
    icon: Calendar,
    title: 'Adaptive Programming',
    description: 'Adjusts workouts automatically based on performance data',
  },
]

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <header className="px-4 py-4 border-b border-[#2B313A]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C1121F] flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-[#E6E9EF]">SpartanLab</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/guides" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
              Guides
            </Link>
            <Link href="/tools" className="text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
              Tools
            </Link>
            <Link href="/sign-in?redirect_url=/dashboard">
              <Button size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                Open App
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 mb-6">
              <TrendingUp className="w-4 h-4 text-[#C1121F]" />
              <span className="text-xs font-medium text-[#C1121F]">Real Progress Examples</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#E6E9EF] mb-4">
              Training Results with SpartanLab
            </h1>
            <p className="text-lg text-[#A4ACB8] max-w-2xl mx-auto">
              See how structured calisthenics training and adaptive programming lead to real strength and skill progress.
            </p>
          </div>

          {/* Skill Progress Section */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#E6E9EF]">Skill Progress Examples</h2>
                <p className="text-sm text-[#6B7280]">Real improvements from structured training</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {skillProgressExamples.map((example, index) => (
                <Card key={index} className="bg-[#1A1F26] border-[#2B313A] p-6 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${example.color} rounded-bl-full pointer-events-none`} />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center">
                        <example.icon className="w-5 h-5 text-[#C1121F]" />
                      </div>
                      <h3 className="font-semibold text-[#E6E9EF]">{example.skill}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#6B7280] uppercase tracking-wider">Start</span>
                        <span className="text-sm text-[#A4ACB8]">{example.start}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#6B7280] uppercase tracking-wider">Current</span>
                        <span className="text-sm font-medium text-[#E6E9EF]">{example.current}</span>
                      </div>
                      <div className="pt-4 border-t border-[#2B313A]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-400 font-medium">{example.improvement}</span>
                          <span className="text-xs text-[#6B7280]">{example.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Strength Progress Section */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#E6E9EF]">Strength Improvements</h2>
                <p className="text-sm text-[#6B7280]">Measurable strength gains over training cycles</p>
              </div>
            </div>

            <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2B313A]">
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Exercise</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Starting</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Current</th>
                      <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strengthProgressExamples.map((example, index) => (
                      <tr key={index} className="border-b border-[#2B313A]/50 last:border-0">
                        <td className="px-6 py-4">
                          <span className="font-medium text-[#E6E9EF]">{example.exercise}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#A4ACB8]">{example.start}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#E6E9EF] font-medium">{example.current}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-medium">{example.improvement}</span>
                            <span className="text-xs text-[#6B7280]">({example.percentGain})</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Timeline Section */}
          <section className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#E6E9EF]">Skill Progression Timeline</h2>
                <p className="text-sm text-[#6B7280]">Front Lever progression example over 12 weeks</p>
              </div>
            </div>

            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 sm:p-8">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#C1121F] via-[#C1121F]/50 to-[#2B313A]" />

                <div className="space-y-8">
                  {timelineStages.map((stage, index) => (
                    <div key={index} className="flex gap-6">
                      {/* Timeline dot */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          stage.status === 'current' 
                            ? 'bg-[#C1121F] ring-4 ring-[#C1121F]/20' 
                            : stage.status === 'complete'
                            ? 'bg-emerald-500/20 border-2 border-emerald-500'
                            : 'bg-[#2B313A]'
                        }`}>
                          {stage.status === 'complete' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : stage.status === 'current' ? (
                            <div className="w-3 h-3 rounded-full bg-white" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-[#6B7280]" />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                          <span className="text-xs font-medium text-[#C1121F] uppercase tracking-wider">{stage.week}</span>
                          <h3 className="font-semibold text-[#E6E9EF]">{stage.milestone}</h3>
                        </div>
                        <p className="text-sm text-[#A4ACB8]">{stage.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          {/* Why It Works Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#E6E9EF] mb-4">Why Structured Training Works</h2>
              <p className="text-[#A4ACB8] max-w-2xl mx-auto">
                SpartanLab analyzes strength levels, skill progressions, and training performance. The Adaptive Training Engine then adjusts workouts based on the athlete&apos;s progress and recovery signals.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {systemFeatures.map((feature, index) => (
                <Card key={index} className="bg-[#1A1F26] border-[#2B313A] p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-[#C1121F]" />
                  </div>
                  <h3 className="font-semibold text-[#E6E9EF] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#A4ACB8]">{feature.description}</p>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-8 mt-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1">
                  <p className="text-[#A4ACB8] leading-relaxed">
                    Instead of guessing what to train next, athletes receive data-driven training recommendations. The system identifies your primary limiter and builds targeted programs to address specific weaknesses while maintaining overall progress.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link href="/sign-in?redirect_url=/dashboard">
                    <Button variant="outline" className="border-[#C1121F]/30 text-[#C1121F] hover:bg-[#C1121F]/10">
                      See How It Works
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <Card className="bg-gradient-to-br from-[#C1121F]/20 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/30 p-12">
              <h2 className="text-3xl font-bold text-[#E6E9EF] mb-4">
                Start Your Training Program
              </h2>
              <p className="text-[#A4ACB8] max-w-xl mx-auto mb-8">
                Generate a calisthenics program tailored to your strength level and training goals. The Adaptive Training Engine builds your program and adjusts it as you progress.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/my-programs">
                  <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] px-8">
                    Generate Program
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/tools">
                  <Button size="lg" variant="outline" className="border-[#2B313A] text-[#E6E9EF] hover:bg-[#1A1F26]">
                    Try Free Tools
                  </Button>
                </Link>
              </div>
            </Card>
          </section>

          {/* Related Links */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[#6B7280]">
            <Link href="/guides/front-lever-training" className="hover:text-[#E6E9EF] transition-colors">Front Lever Guide</Link>
            <span className="text-[#2B313A]">|</span>
            <Link href="/guides/weighted-pull-up-training" className="hover:text-[#E6E9EF] transition-colors">Weighted Pull-Up Guide</Link>
            <span className="text-[#2B313A]">|</span>
            <Link href="/guides/muscle-up-training" className="hover:text-[#E6E9EF] transition-colors">Muscle-Up Guide</Link>
            <span className="text-[#2B313A]">|</span>
            <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">All Tools</Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#2B313A] mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6B7280]">
          <p>SpartanLab Calisthenics Training Decision Engine</p>
          <div className="flex items-center gap-6">
            <Link href="/guides" className="hover:text-[#E6E9EF] transition-colors">Guides</Link>
            <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">Tools</Link>
            <Link href="/my-programs" className="hover:text-[#E6E9EF] transition-colors">Programs</Link>
            <Link href="/sign-in?redirect_url=/dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
