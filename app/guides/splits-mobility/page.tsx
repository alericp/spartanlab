import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flame, CheckCircle2, Clock, Dumbbell, AlertTriangle, Calendar, Target, Gauge } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Splits Mobility Training Guide | SpartanLab',
  description: 'Build strength and control in deep split positions. Loaded stretching, active range work, and RPE-based progression for true mobility.',
  keywords: ['splits mobility', 'active flexibility', 'loaded stretching', 'end range strength', 'split strength', 'mobility training'],
  openGraph: {
    title: 'Splits Mobility Training Guide | SpartanLab',
    description: 'Build strength and control in deep split positions. Loaded stretching and active range work.',
    type: 'article',
  },
}

// Mobility exercises for front splits
const FRONT_SPLIT_MOBILITY = [
  {
    name: 'Active Hip Flexor Lift-Offs',
    type: 'Active Range',
    sets: '3',
    reps: '8-10 per side',
    description: 'From lunge position, lift and lower the back knee using hip flexor strength.',
    cues: ['Keep torso upright', 'Control the lift', 'Full range of motion', 'Squeeze at top'],
  },
  {
    name: 'Elevated Split Slider',
    type: 'Loaded Stretch',
    sets: '3',
    reps: '8-10 per side',
    description: 'Back foot on slider, actively slide into and out of split position.',
    cues: ['Control the descent', 'Drive back up with front leg', 'Keep hips square', 'RPE 7-8'],
  },
  {
    name: 'Front Split Isometric Holds',
    type: 'Isometric',
    sets: '3',
    reps: '20-30 sec per side',
    description: 'Hold split position while actively pressing both legs into the floor.',
    cues: ['Press front heel down', 'Press back toes down', 'Create tension', 'Breathe steadily'],
  },
]

// Mobility exercises for side splits
const SIDE_SPLIT_MOBILITY = [
  {
    name: 'Side-Lying Leg Raises',
    type: 'Active Range',
    sets: '3',
    reps: '10-12 per side',
    description: 'Lying on side, lift top leg toward ceiling using adductor strength of bottom leg to stabilize.',
    cues: ['Keep body straight', 'Control the movement', 'Full range of motion', 'Squeeze at top'],
  },
  {
    name: 'Cossack Squats',
    type: 'Loaded Stretch',
    sets: '3',
    reps: '8-10 per side',
    description: 'Shift weight side to side through deep lateral squat positions.',
    cues: ['Keep chest up', 'Straight leg fully extended', 'Control the transition', 'Go deep'],
  },
  {
    name: 'Straddle Pancake Good Mornings',
    type: 'Loaded Stretch',
    sets: '3',
    reps: '8-10',
    description: 'Standing wide stance, hinge forward and return to standing with control.',
    cues: ['Wide stance', 'Hinge at hips', 'Keep back flat', 'Drive through hips'],
  },
  {
    name: 'Side Split Isometric Press',
    type: 'Isometric',
    sets: '3',
    reps: '20-30 sec',
    description: 'In supported side split, press both legs into the floor creating tension.',
    cues: ['Press heels outward', 'Engage adductors', 'Create tension throughout', 'Breathe steadily'],
  },
]

export default function SplitsMobilityGuide() {
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Sticky Back Navigation */}
      <nav className="px-4 py-3 border-b border-[#2B313A]/50 sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/guides"
            className="inline-flex items-center gap-2 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>All Guides</span>
          </Link>
          <span className="text-xs text-[#6B7280]">9 min read</span>
        </div>
      </nav>

      <main className="px-4 py-12 sm:py-16">
        <article className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-8">
            <Link href="/landing" className="hover:text-[#A4ACB8]">Home</Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-[#A4ACB8]">Guides</Link>
            <span>/</span>
            <span className="text-[#A4ACB8]">Splits Mobility</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-[#C1121F]" />
              </div>
              <span className="text-sm text-[#C1121F] font-medium">Mobility</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E6E9EF] mb-6 text-balance">
              Splits Mobility Training Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              Own the position with strength. Build active control and end-range strength in split positions.
            </p>
          </header>

          {/* Flexibility vs Mobility Recap */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              What is Mobility Training?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              Mobility training builds strength and control at end ranges. Unlike flexibility work (short exposure holds for depth), mobility uses loaded movements, active contractions, and isometrics to develop usable strength in deep positions.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              If you can sink into a split passively but can't control the position or lift your leg to that height actively, you have flexibility without mobility. This guide addresses that gap.
            </p>
          </section>

          {/* The Difference */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Flexibility vs Mobility for Splits
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-emerald-500/5 to-[#1A1F26] border-emerald-500/20 p-6">
                <h3 className="text-lg font-bold text-emerald-400 mb-3">Flexibility</h3>
                <ul className="space-y-2 text-sm text-[#A4ACB8]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    15-second exposure holds
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    Low intensity, daily practice
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    Goal: get into deeper positions
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    Best for building passive range
                  </li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-br from-[#C1121F]/5 to-[#1A1F26] border-[#C1121F]/20 p-6">
                <h3 className="text-lg font-bold text-[#C1121F] mb-3">Mobility</h3>
                <ul className="space-y-2 text-sm text-[#A4ACB8]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    Loaded stretches and active work
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    RPE-based, 2-3x per week
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    Goal: build strength at end ranges
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    Best for active control and skills
                  </li>
                </ul>
              </Card>
            </div>

            <div className="bg-[#4F6D8A]/10 border border-[#4F6D8A]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#4F6D8A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#4F6D8A] mb-1">When to use mobility training</p>
                  <p className="text-sm text-[#A4ACB8]">
                    Use mobility work when you already have the passive range but need active control. If you can't get into the position at all, start with flexibility work first.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* RPE Guidance */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              RPE-Based Progression
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Mobility training uses Rate of Perceived Exertion (RPE) to guide intensity. This ensures you're working hard enough to build strength without overreaching.
            </p>

            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Gauge className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Target RPE: 7-8</h3>
              </div>
              <p className="text-sm text-[#A4ACB8] mb-4">
                Most mobility exercises should feel challenging but sustainable. You should be able to maintain form throughout the set.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[#C1121F] font-medium">RPE 6</span>
                  <span className="text-[#A4ACB8]">Moderate effort, could do many more reps</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[#C1121F] font-medium">RPE 7</span>
                  <span className="text-[#A4ACB8]">Challenging, 3-4 reps left in reserve</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[#C1121F] font-medium">RPE 8</span>
                  <span className="text-[#A4ACB8]">Hard, 2-3 reps left in reserve</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[#C1121F] font-medium">RPE 9</span>
                  <span className="text-[#A4ACB8]">Very hard, 1 rep left in reserve</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Front Split Mobility */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Front Split Mobility Exercises
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              These exercises build active strength in the hip flexors (back leg) and hamstrings (front leg) at end ranges.
            </p>

            <div className="space-y-4">
              {FRONT_SPLIT_MOBILITY.map((exercise, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-[#E6E9EF]">{exercise.name}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-[#C1121F]/10 text-[#C1121F] font-medium">
                          {exercise.type}
                        </span>
                      </div>
                      <p className="text-sm text-[#A4ACB8] mb-3">{exercise.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3">
                        <span>Sets: <span className="text-[#E6E9EF] font-medium">{exercise.sets}</span></span>
                        <span>Reps: <span className="text-[#E6E9EF] font-medium">{exercise.reps}</span></span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exercise.cues.map((cue, j) => (
                          <span key={j} className="text-xs px-2 py-1 rounded bg-[#0F1115] text-[#6B7280]">
                            {cue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Side Split Mobility */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Side Split Mobility Exercises
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              These exercises build adductor and hip strength at wide ranges for middle split control.
            </p>

            <div className="space-y-4">
              {SIDE_SPLIT_MOBILITY.map((exercise, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-[#E6E9EF]">{exercise.name}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-[#C1121F]/10 text-[#C1121F] font-medium">
                          {exercise.type}
                        </span>
                      </div>
                      <p className="text-sm text-[#A4ACB8] mb-3">{exercise.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-3">
                        <span>Sets: <span className="text-[#E6E9EF] font-medium">{exercise.sets}</span></span>
                        <span>Reps: <span className="text-[#E6E9EF] font-medium">{exercise.reps}</span></span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {exercise.cues.map((cue, j) => (
                          <span key={j} className="text-xs px-2 py-1 rounded bg-[#0F1115] text-[#6B7280]">
                            {cue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Training Frequency */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              When to Train Splits Mobility
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Unlike flexibility work, mobility training creates muscle fatigue and requires recovery. Treat it like strength training.
            </p>

            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Training Frequency</h3>
              </div>
              <ul className="space-y-3">
                {[
                  { label: 'Frequency', text: '2-3 times per week with 48-72 hours between sessions' },
                  { label: 'Duration', text: '15-20 minutes for a complete mobility session' },
                  { label: 'Recovery', text: 'Expect moderate soreness after initial sessions' },
                  { label: 'Combine', text: 'Can be paired with flexibility work on off-days' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-[#C1121F] font-medium min-w-[80px]">{item.label}:</span>
                    <span className="text-[#A4ACB8]">{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-400 mb-1">Hybrid approach</p>
                  <p className="text-sm text-[#A4ACB8]">
                    Use daily flexibility training for exposure and 2-3x per week mobility for strength building. This combination develops both passive range and active control.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#E6E9EF] mb-4">
                  Get a Personalized Mobility Program
                </h3>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  SpartanLab generates training programs that combine flexibility and mobility work based on your goals and current range.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                    <Link href="/programs">
                      Generate Program
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
                    <Link href="/guides/flexibility-vs-mobility">
                      Flexibility vs Mobility
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* Related Guides */}
          <section className="mb-12">
            <h3 className="text-lg font-semibold text-[#E6E9EF] mb-6">Related Guides</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { slug: 'front-splits-flexibility', title: 'Front Splits Flexibility', category: 'Flexibility' },
                { slug: 'side-splits-flexibility', title: 'Side Splits Flexibility', category: 'Flexibility' },
                { slug: 'pancake-flexibility', title: 'Pancake Flexibility', category: 'Flexibility' },
                { slug: 'flexibility-vs-mobility', title: 'Flexibility vs Mobility', category: 'Flexibility' },
              ].map((guide) => (
                <Link key={guide.slug} href={`/guides/${guide.slug}`}>
                  <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/40 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center">
                        <Flame className="w-5 h-5 text-[#C1121F]" />
                      </div>
                      <div>
                        <h4 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                          {guide.title}
                        </h4>
                        <p className="text-xs text-[#6B7280]">{guide.category}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Back Link */}
          <div className="mt-12">
            <Link 
              href="/guides" 
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              View all guides
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
