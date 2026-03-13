import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flame, CheckCircle2, Clock, Repeat, AlertTriangle, Calendar, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Toe Touch Flexibility Guide | SpartanLab',
  description: 'Improve your forward fold with SpartanLab\'s 15-second exposure method. Short holds, low soreness, trainable daily for fast hamstring flexibility gains.',
  keywords: ['toe touch flexibility', 'forward fold', 'hamstring flexibility', 'pike stretch', 'touch your toes', 'hamstring stretching'],
  openGraph: {
    title: 'Toe Touch Flexibility Guide | SpartanLab',
    description: 'Improve your forward fold with SpartanLab\'s 15-second exposure method.',
    type: 'article',
  },
}

// Toe touch flexibility sequence
const FLEXIBILITY_SEQUENCE = [
  {
    name: 'Single-Leg Hamstring Pull (Left)',
    duration: '15 seconds',
    description: 'Seated with one leg extended, opposite leg bent. Fold toward the straight leg.',
    cues: ['Keep extended leg straight', 'Hinge from hips', 'Reach toward foot', 'Breathe into the stretch'],
  },
  {
    name: 'Single-Leg Hamstring Pull (Right)',
    duration: '15 seconds',
    description: 'Switch legs. Same position with the opposite leg extended.',
    cues: ['Keep extended leg straight', 'Hinge from hips', 'Reach toward foot', 'Match the other side'],
  },
  {
    name: 'Seated Forward Fold - Straight Back',
    duration: '15 seconds',
    description: 'Both legs extended, fold forward maintaining a long spine.',
    cues: ['Legs together', 'Lead with chest', 'Keep back flat', 'Hinge at hips'],
  },
  {
    name: 'Seated Forward Fold - Rounded',
    duration: '15 seconds',
    description: 'Allow spine to round as you fold deeper toward your legs.',
    cues: ['Relax into the fold', 'Let spine round', 'Reach past feet', 'Breathe deeply'],
  },
]

// Progression levels
const PROGRESSION_LEVELS = [
  {
    name: 'Basic Exposure',
    description: 'Building initial hamstring flexibility and tolerance.',
    indicators: ['Can reach past knees', 'No sharp pain behind legs', 'Comfortable daily practice'],
  },
  {
    name: 'Moderate Range',
    description: 'Developing deeper fold and improved pike position.',
    indicators: ['Fingertips reach ankles', 'Can maintain hip hinge', 'Minimal soreness after training'],
  },
  {
    name: 'Deep Range',
    description: 'Approaching full toe touch with control.',
    indicators: ['Palms reach floor', 'Chest close to thighs', 'Good pike compression starting'],
  },
  {
    name: 'Full Position',
    description: 'Complete forward fold with chest to thighs.',
    indicators: ['Chest flat on thighs', 'Palms past feet', 'Active compression possible'],
  },
]

export default function ToeTouchFlexibilityGuide() {
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
          <span className="text-xs text-[#6B7280]">7 min read</span>
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
            <span className="text-[#A4ACB8]">Toe Touch Flexibility</span>
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
              Toe Touch Flexibility Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              Short holds. Low soreness. Daily practice. The SpartanLab approach to forward fold flexibility.
            </p>
          </header>

          {/* What is the Toe Touch */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              What is the Toe Touch?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              The toe touch, or forward fold, is a fundamental flexibility position. Standing or seated, you fold forward at the hips bringing your hands toward your feet. It's the foundation for pike compression used in L-sits, V-sits, and press handstands.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              Good toe touch flexibility requires mobile hamstrings, hip flexors that can actively compress, and the ability to hinge properly at the hips rather than just rounding the spine.
            </p>
          </section>

          {/* Why Most People Train It Wrong */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Why Most People Train It Wrong
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Traditional hamstring stretching involves long painful holds. Athletes bounce, force, and create soreness that limits training frequency.
            </p>

            <div className="space-y-4">
              {[
                {
                  mistake: 'Bouncing into the stretch',
                  explanation: 'Ballistic stretching triggers the stretch reflex and can cause micro-tears. Controlled exposure is more effective.',
                },
                {
                  mistake: 'Holding for 60+ seconds',
                  explanation: 'Extended holds create soreness. Recovery requirements limit how often you can train.',
                },
                {
                  mistake: 'Rounding the lower back excessively',
                  explanation: 'Spinal flexion feels like progress but doesn\'t improve hip hinge or hamstring length.',
                },
                {
                  mistake: 'Only training standing toe touches',
                  explanation: 'Missing single-leg variations and seated work limits overall hamstring development.',
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
              15-second holds with multiple angles. Single-leg work plus double-leg. Straight back and rounded variations. 3 rounds for consistent exposure.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Clock, label: '15s holds', description: 'Short exposures' },
                { icon: Repeat, label: '3 rounds', description: 'Per sequence' },
                { icon: Target, label: '4 angles', description: 'Per session' },
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
                    Hamstrings, spinal flexion, posterior chain mobility. The sequence addresses both single-leg and bilateral hamstring flexibility plus pike compression.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Example Sequence */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Toe Touch Flexibility Sequence
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Complete this sequence for 3 rounds. Total time: approximately 5-6 minutes.
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
                <span className="font-semibold text-[#E6E9EF]">Repeat for 3 rounds</span>
              </div>
              <p className="text-sm text-[#A4ACB8]">
                Complete all four positions, then repeat the sequence two more times. Flow smoothly between exercises. Rest minimally between rounds.
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
              When to Train Toe Touch Flexibility
            </h2>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Training Frequency</h3>
              </div>
              <ul className="space-y-3">
                {[
                  { label: 'Optimal', text: 'Daily, post-workout or as a brief standalone session' },
                  { label: 'Minimum', text: '4-5 times per week for consistent progress' },
                  { label: 'Best time', text: 'After lower body training when hamstrings are warm' },
                  { label: 'Duration', text: '5-6 minutes per session' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-[#C1121F] font-medium min-w-[70px]">{item.label}:</span>
                    <span className="text-[#A4ACB8]">{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#E6E9EF] mb-4">
                  Get a Personalized Flexibility Program
                </h3>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  SpartanLab generates training programs including flexibility work tailored to your goals.
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
                { slug: 'pancake-flexibility', title: 'Pancake Flexibility Guide', category: 'Flexibility' },
                { slug: 'front-splits-flexibility', title: 'Front Splits Flexibility', category: 'Flexibility' },
                { slug: 'flexibility-vs-mobility', title: 'Flexibility vs Mobility', category: 'Flexibility' },
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
