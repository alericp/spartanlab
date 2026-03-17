import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flame, CheckCircle2, Clock, Repeat, AlertTriangle, Calendar, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Side Splits Flexibility Guide | SpartanLab',
  description: 'Develop middle split range with SpartanLab\'s 15-second exposure method. Multiple movement angles, low soreness, frequent training for adductor flexibility.',
  keywords: ['side splits', 'middle splits', 'straddle flexibility', 'adductor stretch', 'side split training', 'how to side split'],
  openGraph: {
    title: 'Side Splits Flexibility Guide | SpartanLab',
    description: 'Develop middle split range with SpartanLab\'s 15-second exposure method.',
    type: 'article',
  },
}

// Side split flexibility sequence
const FLEXIBILITY_SEQUENCE = [
  {
    name: 'Frog Stretch Position',
    duration: '15 seconds',
    description: 'On hands and knees with knees spread wide. Sink hips toward the floor.',
    cues: ['Knees at 90 degrees', 'Feet turned out', 'Sink hips down', 'Keep spine neutral'],
  },
  {
    name: 'Wide Squat Adductor Stretch',
    duration: '15 seconds',
    description: 'Deep squat position with wide stance. Press knees outward with elbows.',
    cues: ['Wide stance', 'Heels down if possible', 'Push knees outward', 'Chest upright'],
  },
  {
    name: 'Standing Straddle Slide',
    duration: '15 seconds',
    description: 'Standing with feet wide, slowly slide feet apart toward your comfortable limit.',
    cues: ['Hands on floor or blocks', 'Keep legs straight', 'Feet parallel or turned out', 'Breathe into stretch'],
  },
  {
    name: 'Side Split Exposure',
    duration: '15 seconds',
    description: 'Slide into your deepest comfortable middle split with support.',
    cues: ['Use hands or blocks', 'Keep hips forward', 'Legs straight', 'Relax and breathe'],
  },
]

// Progression levels
const PROGRESSION_LEVELS = [
  {
    name: 'Basic Exposure',
    description: 'Building adductor tolerance and hip opening.',
    indicators: ['Comfortable in deep squat', 'Frog stretch possible', 'No groin pain'],
  },
  {
    name: 'Moderate Range',
    description: 'Developing wider straddle with decreasing support.',
    indicators: ['Standing straddle with hands on floor', 'Side split with hands on blocks', 'Consistent training without soreness'],
  },
  {
    name: 'Deep Range',
    description: 'Approaching full side split with minimal support.',
    indicators: ['Hands flat on floor in split', 'Controlled descent', 'Can hold position comfortably'],
  },
  {
    name: 'Full Position',
    description: 'Complete middle split with hips on floor.',
    indicators: ['Hips to floor', 'Legs straight', 'Can begin oversplit training'],
  },
]

export default function SideSplitsFlexibilityGuide() {
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
            <span className="text-[#A4ACB8]">Side Splits Flexibility</span>
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
              Side Splits Flexibility Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              15-second exposures. Multiple angles. Low soreness. The SpartanLab approach to middle split development.
            </p>
          </header>

          {/* What is the Side Split */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              What is the Side Split?
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              The side split (middle split or straddle split) has both legs extending outward to the sides with hips descending to the floor. It requires flexibility in the adductors (inner thigh muscles) and hip joint mobility.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              Side splits are foundational for martial arts, dance, gymnastics, and calisthenics skills like straddle planche and side kicks. The position requires patience to develop safely.
            </p>
          </section>

          {/* Why Most People Train It Wrong */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Why Most People Train It Wrong
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              The adductors are sensitive to overstretching. Traditional methods of forcing into a split and holding create micro-tears that require extended recovery.
            </p>

            <div className="space-y-4">
              {[
                {
                  mistake: 'Sliding into the deepest possible position',
                  explanation: 'Forcing maximum depth before the adductors are ready causes strains and protective tightening.',
                },
                {
                  mistake: 'Long static holds at max range',
                  explanation: 'Extended holds in the adductors create significant soreness. Recovery time limits frequency.',
                },
                {
                  mistake: 'Only training the split position',
                  explanation: 'Missing preparatory positions like frog stretch and deep squat leaves gaps in your range.',
                },
                {
                  mistake: 'Training through groin pain',
                  explanation: 'Adductor strains are common and slow to heal. Respecting discomfort signals prevents injury.',
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
              15-second holds through a sequence of positions that prepare the adductors before split exposure. Frog, deep squat, straddle, then split. 3 rounds.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Clock, label: '15s holds', description: 'Per position' },
                { icon: Repeat, label: '3 rounds', description: 'Full sequence' },
                { icon: Target, label: '4 angles', description: 'Prep to split' },
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
                    Adductors, hip joint mobility, and groin flexibility. The preparatory positions warm up the tissue before the split exposure, reducing strain risk.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Example Sequence */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Side Split Flexibility Sequence
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Complete this sequence for 3 rounds. Total time: approximately 6-8 minutes.
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
                Flow through all four positions, then repeat the sequence two more times. The preparatory positions make the split exposure safer and more effective.
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
              When to Train Side Splits Flexibility
            </h2>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Training Frequency</h3>
              </div>
              <ul className="space-y-3">
                {[
                  { label: 'Optimal', text: 'Daily, with proper warm-up' },
                  { label: 'Minimum', text: '4-5 times per week for consistent progress' },
                  { label: 'Best time', text: 'After lower body training or light cardio' },
                  { label: 'Duration', text: '6-8 minutes per session' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-[#C1121F] font-medium min-w-[70px]">{item.label}:</span>
                    <span className="text-[#A4ACB8]">{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-400 mb-1">Safety note</p>
                  <p className="text-sm text-[#A4ACB8]">
                    The adductors are particularly sensitive. If you feel sharp pain in the groin, back off immediately. Mild stretch sensation is normal; sharp pain is not.
                  </p>
                </div>
              </div>
            </div>
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
                    <li>You have passive range but lack active control</li>
                    <li>You need strength for straddle planche or similar skills</li>
                    <li>You want to kick or lift legs to the side with control</li>
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
                    <Link href="/guides/splits-mobility">
                      Splits Mobility Guide
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
                { slug: 'pancake-flexibility', title: 'Pancake Flexibility', category: 'Flexibility' },
                { slug: 'splits-mobility', title: 'Splits Mobility Training', category: 'Mobility' },
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
