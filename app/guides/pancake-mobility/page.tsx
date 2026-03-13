import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flame, CheckCircle2, Dumbbell, AlertTriangle, Calendar, Target, Gauge } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pancake Mobility Guide | SpartanLab',
  description: 'Build active compression strength for V-sit and straddle skills. Loaded pancake work, active holds, and RPE-based progression.',
  keywords: ['pancake mobility', 'active compression', 'straddle strength', 'V-sit training', 'loaded stretching', 'pancake strength'],
  openGraph: {
    title: 'Pancake Mobility Guide | SpartanLab',
    description: 'Build active compression strength for V-sit and straddle skills.',
    type: 'article',
  },
}

// Pancake mobility exercises
const MOBILITY_EXERCISES = [
  {
    name: 'Weighted Pancake Good Morning',
    type: 'Loaded Stretch',
    sets: '3',
    reps: '8-10',
    description: 'Standing wide stance with light weight (barbell or plate). Hinge forward maintaining flat back, return to standing.',
    cues: ['Wide stance', 'Hinge at hips', 'Control the descent', 'Drive through hips to stand'],
  },
  {
    name: 'Active Pancake Pulses',
    type: 'Active Range',
    sets: '3',
    reps: '12-15',
    description: 'Seated pancake position. Use hip flexors to actively pull chest toward floor, release and repeat.',
    cues: ['Engage hip flexors', 'Small controlled pulses', 'Don\'t bounce', 'Keep legs active'],
  },
  {
    name: 'Pancake Compression Slides',
    type: 'Active Range',
    sets: '3',
    reps: '8-10',
    description: 'Seated with legs wide. Walk hands forward into pancake, then actively compress to pull chest toward floor.',
    cues: ['Walk hands forward', 'Actively compress', 'Drive chest to floor', 'Control the return'],
  },
  {
    name: 'Pancake Isometric Press',
    type: 'Isometric',
    sets: '3',
    reps: '20-30 sec',
    description: 'In deepest pancake position, actively press legs into floor while pulling chest down with hip flexors.',
    cues: ['Press legs outward', 'Engage hip flexors', 'Create full-body tension', 'Breathe steadily'],
  },
  {
    name: 'Straddle Leg Lifts',
    type: 'Active Range',
    sets: '3',
    reps: '8-10 per side',
    description: 'Seated straddle. Lift one leg off floor using hip flexor strength while keeping the other leg grounded.',
    cues: ['Keep lifted leg straight', 'Control the lift', 'Pause at top', 'Lower with control'],
  },
]

export default function PancakeMobilityGuide() {
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
          <span className="text-xs text-[#6B7280]">8 min read</span>
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
            <span className="text-[#A4ACB8]">Pancake Mobility</span>
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
              Pancake Mobility Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              Own the position with strength. Build active compression for V-sit, straddle press, and advanced skills.
            </p>
          </header>

          {/* What is Pancake Mobility */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              What is Pancake Mobility?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              Pancake mobility goes beyond passive flexibility. It builds the strength to actively compress your torso toward your legs using hip flexors and core engagement. This active strength is essential for V-sit, straddle planche, and press to handstand.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              If you can fold into a pancake passively but can't lift your legs in that position or actively pull yourself deeper, you need mobility work, not more flexibility.
            </p>
          </section>

          {/* Flexibility vs Mobility */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Flexibility vs Mobility for Pancake
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-emerald-500/5 to-[#1A1F26] border-emerald-500/20 p-6">
                <h3 className="text-lg font-bold text-emerald-400 mb-3">Pancake Flexibility</h3>
                <ul className="space-y-2 text-sm text-[#A4ACB8]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    15-second exposure holds
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    Trainable daily
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    Goal: get deeper passively
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    Use when you can't reach the position
                  </li>
                </ul>
              </Card>

              <Card className="bg-gradient-to-br from-[#C1121F]/5 to-[#1A1F26] border-[#C1121F]/20 p-6">
                <h3 className="text-lg font-bold text-[#C1121F] mb-3">Pancake Mobility</h3>
                <ul className="space-y-2 text-sm text-[#A4ACB8]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    Loaded and active work
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    2-3x per week
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    Goal: build strength in the position
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    Use when range exceeds control
                  </li>
                </ul>
              </Card>
            </div>

            <div className="bg-[#4F6D8A]/10 border border-[#4F6D8A]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#4F6D8A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#4F6D8A] mb-1">When to use mobility</p>
                  <p className="text-sm text-[#A4ACB8]">
                    Use pancake mobility when you can sink into the position but can't actively compress, can't hold V-sit despite having the range, or your passive flexibility exceeds your active control.
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
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gauge className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Target RPE: 7-8</h3>
              </div>
              <p className="text-sm text-[#A4ACB8] mb-4">
                Work at a challenging but sustainable effort level. You should feel your hip flexors and core working throughout each set.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[#C1121F] font-medium">RPE 7</span>
                  <span className="text-[#A4ACB8]">Challenging, 3-4 reps left in reserve</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[#C1121F] font-medium">RPE 8</span>
                  <span className="text-[#A4ACB8]">Hard, 2-3 reps left in reserve</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Exercises */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Pancake Mobility Exercises
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              These exercises build active compression strength and control in the pancake position.
            </p>

            <div className="space-y-4">
              {MOBILITY_EXERCISES.map((exercise, i) => (
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
              When to Train Pancake Mobility
            </h2>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Training Frequency</h3>
              </div>
              <ul className="space-y-3">
                {[
                  { label: 'Frequency', text: '2-3 times per week with 48-72 hours between sessions' },
                  { label: 'Duration', text: '15-20 minutes for a complete mobility session' },
                  { label: 'Recovery', text: 'Moderate soreness expected, especially in hip flexors' },
                  { label: 'Combine', text: 'Use daily flexibility work on off-days for complete development' },
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
                  <p className="font-medium text-emerald-400 mb-1">Best approach</p>
                  <p className="text-sm text-[#A4ACB8]">
                    Combine daily 15-second flexibility exposure with 2-3x per week mobility work. This develops both passive range and active control simultaneously.
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
                  SpartanLab generates training programs that combine flexibility and mobility work based on your goals.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                    <Link href="/programs">
                      Generate Program
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
                    <Link href="/guides/pancake-flexibility">
                      Pancake Flexibility Guide
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
                { slug: 'pancake-flexibility', title: 'Pancake Flexibility Guide', category: 'Flexibility' },
                { slug: 'flexibility-vs-mobility', title: 'Flexibility vs Mobility', category: 'Flexibility' },
                { slug: 'v-sit-progression', title: 'V-Sit Progression Guide', category: 'Compression Skills' },
                { slug: 'l-sit-training', title: 'L-Sit Training Guide', category: 'Compression Skills' },
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
