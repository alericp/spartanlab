import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flame, CheckCircle2, Clock, Repeat, AlertTriangle, Calendar, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Front Splits Flexibility Guide | SpartanLab',
  description: 'Progress toward front splits using SpartanLab\'s 15-second exposure method. Short holds, both sides, 3 rounds. Train frequently without soreness.',
  keywords: ['front splits', 'front split flexibility', 'hip flexor stretch', 'hamstring flexibility', 'splits training', 'how to do splits'],
  openGraph: {
    title: 'Front Splits Flexibility Guide | SpartanLab',
    description: 'Progress toward front splits using SpartanLab\'s 15-second exposure method.',
    type: 'article',
  },
}

// Front split flexibility sequence (per side)
const FLEXIBILITY_SEQUENCE = [
  {
    name: 'Hip Flexor Kneeling Stretch',
    duration: '15 seconds',
    description: 'Kneeling lunge position with back knee down. Sink hips forward and down.',
    cues: ['Back knee on pad', 'Squeeze glute of back leg', 'Sink hips forward', 'Keep torso upright'],
  },
  {
    name: 'Half Split Position',
    duration: '15 seconds',
    description: 'Front leg straight, back knee down. Fold toward the front leg.',
    cues: ['Front leg straight', 'Hinge at hips', 'Reach toward foot', 'Keep hips square'],
  },
  {
    name: 'Front Split Exposure',
    duration: '15 seconds',
    description: 'Slide into your deepest comfortable split position with support.',
    cues: ['Use hands for support', 'Keep hips square', 'Back leg straight', 'Breathe and relax'],
  },
]

// Progression levels
const PROGRESSION_LEVELS = [
  {
    name: 'Basic Exposure',
    description: 'Building hip flexor and hamstring tolerance.',
    indicators: ['Comfortable in deep lunge', 'Half split possible with support', 'No sharp pain in hips'],
  },
  {
    name: 'Moderate Range',
    description: 'Developing deeper split position with decreasing support.',
    indicators: ['Half split comfortable', 'Split exposure with hands on blocks', 'Hips staying square'],
  },
  {
    name: 'Deep Range',
    description: 'Approaching full split with minimal support.',
    indicators: ['Hands on floor beside hips', 'Controlled descent', 'Both legs straight possible'],
  },
  {
    name: 'Full Position',
    description: 'Complete front split with hips on floor.',
    indicators: ['Hips fully on floor', 'Both legs straight', 'Oversplit training possible'],
  },
]

export default function FrontSplitsFlexibilityGuide() {
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
            <span className="text-[#A4ACB8]">Front Splits Flexibility</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#C1121F]" />
              </div>
              <span className="text-sm text-[#C1121F] font-medium">Flexibility</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E6E9EF] mb-6 text-balance">
              Front Splits Flexibility Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              15-second holds. Both sides. 3 rounds. The SpartanLab approach to front split development.
            </p>
          </header>

          {/* What is the Front Split */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              What is the Front Split?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              The front split is a leg split with one leg forward and one leg back. Your hips descend toward the floor with both legs extended. It requires flexibility in the hip flexors of the back leg and hamstrings of the front leg.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              Front splits are essential for high kicks, dance, gymnastics, and calisthenics skills like press to handstand variations. Building this range takes consistent exposure over time.
            </p>
          </section>

          {/* Why Most People Train It Wrong */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Why Most People Train It Wrong
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Traditional split training involves forcing yourself into the deepest position possible and holding for extended periods. This creates excessive soreness and limits training frequency.
            </p>

            <div className="space-y-4">
              {[
                {
                  mistake: 'Forcing depth before readiness',
                  explanation: 'Pushing into painful ranges creates tissue damage and protective tension. Progress stalls.',
                },
                {
                  mistake: 'Holding 60+ seconds at max depth',
                  explanation: 'Extended holds at your limit cause soreness. You need more recovery between sessions.',
                },
                {
                  mistake: 'Only training the full split position',
                  explanation: 'Missing the component stretches (hip flexors, half split) leaves gaps in your range.',
                },
                {
                  mistake: 'Training one side more than the other',
                  explanation: 'Imbalanced training creates asymmetry. Both sides need equal attention.',
                },
              ].map((item, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#E6E9EF] mb-1">{item.mistake}</h4>
                      <p className="text-sm text-[#6B7280]">{item.explanation}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* The SpartanLab Approach */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              The SpartanLab Approach
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              15-second holds through a sequence of positions. Hip flexor, half split, then split exposure. Complete for both legs, repeat 3 rounds.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Clock, label: '15s holds', description: 'Per position' },
                { icon: Repeat, label: '3 rounds', description: 'Both sides' },
                { icon: Target, label: '3 positions', description: 'Per leg' },
                { icon: Calendar, label: 'Daily', description: 'Trainable frequency' },
              ].map((item, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
                  <item.icon className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
                  <p className="font-semibold text-[#E6E9EF] text-sm">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.description}</p>
                </Card>
              ))}
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-400 mb-1">What it targets</p>
                  <p className="text-sm text-[#A4ACB8]">
                    Hip flexors of the back leg, hamstrings of the front leg, and the combined split position. Building all components ensures balanced progress.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Example Sequence */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Front Split Flexibility Sequence
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Complete this sequence for the right leg, then the left leg. Repeat for 3 total rounds. Total time: approximately 8-10 minutes.
            </p>

            <div className="space-y-4 mb-8">
              {FLEXIBILITY_SEQUENCE.map((exercise, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0 text-lg font-bold text-[#C1121F]">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#E6E9EF]">{exercise.name}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-[#C1121F]/10 text-[#C1121F] font-medium">
                          {exercise.duration}
                        </span>
                      </div>
                      <p className="text-sm text-[#A4ACB8] mb-3">{exercise.description}</p>
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

            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-3 mb-3">
                <Repeat className="w-5 h-5 text-[#C1121F]" />
                <span className="font-semibold text-[#E6E9EF]">Both sides, 3 rounds</span>
              </div>
              <p className="text-sm text-[#A4ACB8]">
                Complete the sequence for the right leg, then immediately for the left leg. That's one round. Repeat for 3 total rounds. Minimal rest between positions.
              </p>
            </Card>
          </section>

          {/* Progression Levels */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Progression Levels
            </h2>
            <div className="space-y-4">
              {PROGRESSION_LEVELS.map((level, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      i === 0 ? 'bg-blue-500/10 text-blue-400' :
                      i === 1 ? 'bg-emerald-500/10 text-emerald-400' :
                      i === 2 ? 'bg-amber-500/10 text-amber-400' :
                      'bg-[#C1121F]/10 text-[#C1121F]'
                    }`}>
                      <span className="text-sm font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#E6E9EF] mb-1">{level.name}</h3>
                      <p className="text-sm text-[#A4ACB8] mb-3">{level.description}</p>
                      <ul className="space-y-1">
                        {level.indicators.map((indicator, j) => (
                          <li key={j} className="flex items-center gap-2 text-xs text-[#6B7280]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* When to Train */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              When to Train Front Splits Flexibility
            </h2>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Training Frequency</h3>
              </div>
              <ul className="space-y-3">
                {[
                  { label: 'Optimal', text: 'Daily, after lower body training or as a standalone session' },
                  { label: 'Minimum', text: '4-5 times per week for consistent progress' },
                  { label: 'Best time', text: 'When muscles are warm from activity or light cardio' },
                  { label: 'Duration', text: '8-10 minutes per session with both sides' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-[#C1121F] font-medium min-w-[70px]">{item.label}:</span>
                    <span className="text-[#A4ACB8]">{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Mobility Note */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              When Mobility is Better
            </h2>
            <div className="bg-[#4F6D8A]/10 border border-[#4F6D8A]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#4F6D8A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#4F6D8A] mb-1">Consider mobility training if:</p>
                  <ul className="text-sm text-[#A4ACB8] space-y-1">
                    <li>You can sink into splits but can't lift your leg in that range</li>
                    <li>You need active flexibility for kicks or dance</li>
                    <li>Your passive range exceeds your active control</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#E6E9EF] mb-4">
                  Get a Personalized Flexibility Program
                </h3>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  SpartanLab generates training programs including split flexibility work tailored to your goals.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                    <Link href="/programs">
                      Generate Program
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
                    <Link href="/guides/side-splits-flexibility">
                      Side Splits Guide
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
                { slug: 'side-splits-flexibility', title: 'Side Splits Flexibility', category: 'Flexibility' },
                { slug: 'splits-mobility', title: 'Splits Mobility Training', category: 'Mobility' },
                { slug: 'flexibility-vs-mobility', title: 'Flexibility vs Mobility', category: 'Flexibility' },
                { slug: 'toe-touch-flexibility', title: 'Toe Touch Flexibility', category: 'Flexibility' },
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
