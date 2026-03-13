import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flame, CheckCircle2, Clock, Repeat, AlertTriangle, Calendar, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pancake Flexibility Guide | SpartanLab',
  description: 'Master the pancake stretch with SpartanLab\'s 15-second exposure method. Short holds, multiple angles, frequent training for fast flexibility gains.',
  keywords: ['pancake stretch', 'pancake flexibility', 'straddle flexibility', 'pike compression', 'calisthenics flexibility', 'how to pancake'],
  openGraph: {
    title: 'Pancake Flexibility Guide | SpartanLab',
    description: 'Master the pancake stretch with SpartanLab\'s 15-second exposure method.',
    type: 'article',
  },
}

// Pancake flexibility sequence
const FLEXIBILITY_SEQUENCE = [
  {
    name: 'Seated Wide Straddle Fold',
    duration: '15 seconds',
    description: 'Sit with legs wide, fold forward from the hips keeping back straight.',
    cues: ['Wide leg position', 'Hinge from hips', 'Keep spine long', 'Breathe into the stretch'],
  },
  {
    name: 'Pancake Lean with Hands Walking',
    duration: '15 seconds',
    description: 'Walk hands forward as far as comfortable, maintaining hip hinge.',
    cues: ['Walk hands forward', 'Keep chest open', 'Relax shoulders', 'Don\'t round spine'],
  },
  {
    name: 'Active Compression Pancake Hold',
    duration: '15 seconds',
    description: 'Actively pull yourself into the fold using hip flexors.',
    cues: ['Engage hip flexors', 'Pull chest toward floor', 'Keep legs active', 'Breathe steadily'],
  },
]

// Progression levels
const PROGRESSION_LEVELS = [
  {
    name: 'Basic Exposure',
    description: 'Building initial range and tolerance to the stretch.',
    indicators: ['Can hold seated straddle comfortably', 'Some forward lean possible', 'No pain in hips or hamstrings'],
  },
  {
    name: 'Moderate Range',
    description: 'Developing deeper fold and better hip hinge mechanics.',
    indicators: ['Forearms reach the floor', 'Consistent hip hinge pattern', 'Comfortable with daily practice'],
  },
  {
    name: 'Deep Range',
    description: 'Approaching full pancake position with control.',
    indicators: ['Chest approaching floor', 'Active compression possible', 'Good control entering and exiting'],
  },
  {
    name: 'Full Position',
    description: 'Complete pancake with chest to floor.',
    indicators: ['Chest flat on floor', 'Full active compression', 'Can hold with control'],
  },
]

export default function PancakeFlexibilityGuide() {
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
            <span className="text-[#A4ACB8]">Pancake Flexibility</span>
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
              Pancake Flexibility Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              Short holds. Multiple angles. Daily practice. The SpartanLab approach to pancake flexibility.
            </p>
          </header>

          {/* What is the Pancake */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              What is the Pancake?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              The pancake is a seated forward fold with legs spread wide. Your chest folds toward the floor while maintaining a wide straddle position. It's essential for V-sit, straddle planche, and compression-based calisthenics skills.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              A good pancake requires flexibility in the hamstrings, adductors, and hip flexors, plus the ability to compress actively using your core and hip flexors.
            </p>
          </section>

          {/* Why Most People Train It Wrong */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Why Most People Train It Wrong
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              The traditional approach to pancake training involves long passive holds. Athletes sit in straddle position for 1-2 minutes, creating soreness and limiting training frequency.
            </p>

            <div className="space-y-4">
              {[
                {
                  mistake: 'Holding for 60+ seconds',
                  explanation: 'Long static holds create micro-damage and soreness. You need more recovery time between sessions.',
                },
                {
                  mistake: 'Training only 2-3 times per week',
                  explanation: 'Soreness from long holds limits frequency. Less exposure means slower progress.',
                },
                {
                  mistake: 'Rounding the spine',
                  explanation: 'Collapsing through the spine instead of hinging at the hips. You feel like you\'re folding, but the hips aren\'t opening.',
                },
                {
                  mistake: 'Ignoring active compression',
                  explanation: 'Passive range without the ability to actively pull into the position is limited for skill transfer.',
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
              Short frequent exposure beats long infrequent stretching. SpartanLab uses 15-second holds with multiple movement angles, repeated for 3 rounds.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Clock, label: '15s holds', description: 'Short exposures' },
                { icon: Repeat, label: '3 rounds', description: 'Per sequence' },
                { icon: Target, label: '3-4 angles', description: 'Per session' },
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
                  <p className="font-medium text-emerald-400 mb-1">Why it works</p>
                  <p className="text-sm text-[#A4ACB8]">
                    Short holds create range adaptation without significant tissue damage. Low soreness means you can train daily. More exposure accelerates progress.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Example Sequence */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Pancake Flexibility Sequence
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Complete this sequence for 3 rounds. Total time: approximately 5-7 minutes.
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
                Complete all three exercises, then repeat the sequence two more times. Rest minimally between exercises. Take 30-60 seconds between rounds if needed.
              </p>
            </Card>
          </section>

          {/* Progression Levels */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Progression Levels
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Track your progress through these milestones. The same 15-second exposure structure works at every level.
            </p>

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
              When to Train Pancake Flexibility
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              The 15-second exposure method creates minimal soreness, allowing frequent training.
            </p>

            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Training Frequency</h3>
              </div>
              <ul className="space-y-3">
                {[
                  { label: 'Optimal', text: 'Daily, either post-workout or as a standalone session' },
                  { label: 'Minimum', text: '4-5 times per week for consistent progress' },
                  { label: 'Best time', text: 'After strength training when muscles are warm' },
                  { label: 'Duration', text: '5-7 minutes per session with the 3-round structure' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-[#C1121F] font-medium min-w-[70px]">{item.label}:</span>
                    <span className="text-[#A4ACB8]">{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Flexibility vs Mobility Note */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              When Mobility is Better
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              If you have the passive range but lack active control, you may benefit more from pancake mobility training with loaded work and strength-based progressions.
            </p>
            
            <div className="bg-[#4F6D8A]/10 border border-[#4F6D8A]/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#4F6D8A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#4F6D8A] mb-1">Consider mobility training if:</p>
                  <ul className="text-sm text-[#A4ACB8] space-y-1">
                    <li>You can sink into a deep pancake but can't hold it actively</li>
                    <li>You need strength for V-sit, straddle press, or compression skills</li>
                    <li>Passive range exceeds your active control</li>
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
                  SpartanLab can generate a complete training program including pancake flexibility work based on your goals and current level.
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
                { slug: 'flexibility-vs-mobility', title: 'Flexibility vs Mobility Explained', category: 'Flexibility' },
                { slug: 'side-splits-flexibility', title: 'Side Splits Flexibility', category: 'Flexibility' },
                { slug: 'toe-touch-flexibility', title: 'Toe Touch Flexibility', category: 'Flexibility' },
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
