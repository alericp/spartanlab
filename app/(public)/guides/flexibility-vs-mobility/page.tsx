import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Flame, CheckCircle2, Dumbbell, Clock, Repeat, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Flexibility vs Mobility Explained | SpartanLab',
  description: 'Understand the difference between flexibility and mobility training. Learn when to use 15-second exposure holds vs loaded stretching for optimal range development.',
  keywords: ['flexibility vs mobility', 'stretching methods', 'range of motion training', 'calisthenics flexibility', 'loaded stretching', 'active flexibility'],
  openGraph: {
    title: 'Flexibility vs Mobility Explained | SpartanLab',
    description: 'Understand the difference between flexibility and mobility training. When to use each approach.',
    type: 'article',
  },
}

export default function FlexibilityVsMobilityGuide() {
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
          <span className="text-xs text-[#6B7280]">6 min read</span>
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
            <span className="text-[#A4ACB8]">Flexibility vs Mobility</span>
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
              Flexibility vs Mobility Explained
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              Two training systems. One goal: better range of motion. Learn when to use each.
            </p>
          </header>

          {/* Introduction */}
          <section className="mb-16">
            <p className="text-[#A4ACB8] leading-relaxed text-lg mb-4">
              SpartanLab distinguishes between two approaches to range-of-motion training. Understanding the difference helps you train smarter and recover better.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              Most people blend these approaches randomly. The result: inconsistent progress and unnecessary soreness. By separating them, you can train range more frequently and make faster gains.
            </p>
          </section>

          {/* The Two Systems */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-8">
              The Two Systems
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Flexibility Card */}
              <Card className="bg-gradient-to-br from-emerald-500/5 to-[#1A1F26] border-emerald-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Repeat className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-400">Flexibility</h3>
                    <p className="text-sm text-emerald-400/70">Go deeper with ease</p>
                  </div>
                </div>
                <p className="text-[#A4ACB8] mb-6">
                  Short holds, low soreness, frequent practice. Build passive range without compromising recovery.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-[#E6E9EF]">15-second holds</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Repeat className="w-4 h-4 text-emerald-400" />
                    <span className="text-[#E6E9EF]">3 rounds, multiple angles</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-[#E6E9EF]">Trainable daily</span>
                  </div>
                </div>
              </Card>

              {/* Mobility Card */}
              <Card className="bg-gradient-to-br from-[#C1121F]/5 to-[#1A1F26] border-[#C1121F]/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#C1121F]">Mobility</h3>
                    <p className="text-sm text-[#C1121F]/70">Own the position with strength</p>
                  </div>
                </div>
                <p className="text-[#A4ACB8] mb-6">
                  Loaded work, active strength, more recovery. Build control and strength at end ranges.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Dumbbell className="w-4 h-4 text-[#C1121F]" />
                    <span className="text-[#E6E9EF]">Loaded stretches</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-[#C1121F]" />
                    <span className="text-[#E6E9EF]">RPE-based progression</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                    <span className="text-[#E6E9EF]">2-3x per week</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Why Most People Train It Wrong */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Why Most People Train It Wrong
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              The traditional approach to flexibility involves long passive holds: 30-60 seconds or more in uncomfortable positions. This creates several problems.
            </p>

            <div className="space-y-4 mb-8">
              {[
                {
                  mistake: 'Long static holds create soreness',
                  explanation: 'Extended time under stretch damages tissue. You need more recovery, so you train less frequently.',
                },
                {
                  mistake: 'Training infrequently slows progress',
                  explanation: 'If you can only stretch 2-3x per week due to soreness, you lose the benefit of consistent exposure.',
                },
                {
                  mistake: 'Passive range without strength is useless',
                  explanation: 'Being able to sink into a position passively doesn\'t mean you can control it actively.',
                },
                {
                  mistake: 'One approach doesn\'t fit all goals',
                  explanation: 'Getting deeper requires different training than building strength in deep positions.',
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
              Instead of long passive holds, SpartanLab uses short exposure training for flexibility and loaded work for mobility. The two systems have different purposes.
            </p>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2B313A]">
                    <th className="text-left py-3 pr-4 text-[#E6E9EF] font-semibold">Aspect</th>
                    <th className="text-left py-3 pr-4 text-emerald-400 font-semibold">Flexibility</th>
                    <th className="text-left py-3 text-[#C1121F] font-semibold">Mobility</th>
                  </tr>
                </thead>
                <tbody className="text-[#A4ACB8]">
                  <tr className="border-b border-[#2B313A]/50">
                    <td className="py-3 pr-4 text-[#E6E9EF]">Goal</td>
                    <td className="py-3 pr-4">Get into deeper positions</td>
                    <td className="py-3">Build strength at end range</td>
                  </tr>
                  <tr className="border-b border-[#2B313A]/50">
                    <td className="py-3 pr-4 text-[#E6E9EF]">Hold Duration</td>
                    <td className="py-3 pr-4 font-medium text-emerald-400">15 seconds</td>
                    <td className="py-3 font-medium text-[#C1121F]">Reps or loaded holds</td>
                  </tr>
                  <tr className="border-b border-[#2B313A]/50">
                    <td className="py-3 pr-4 text-[#E6E9EF]">Structure</td>
                    <td className="py-3 pr-4">3 rounds, multiple angles</td>
                    <td className="py-3">Sets x reps with load</td>
                  </tr>
                  <tr className="border-b border-[#2B313A]/50">
                    <td className="py-3 pr-4 text-[#E6E9EF]">Soreness</td>
                    <td className="py-3 pr-4">Low</td>
                    <td className="py-3">Moderate</td>
                  </tr>
                  <tr className="border-b border-[#2B313A]/50">
                    <td className="py-3 pr-4 text-[#E6E9EF]">Frequency</td>
                    <td className="py-3 pr-4">Daily / post-workout</td>
                    <td className="py-3">2-3x per week</td>
                  </tr>
                  <tr className="border-b border-[#2B313A]/50">
                    <td className="py-3 pr-4 text-[#E6E9EF]">Recovery Impact</td>
                    <td className="py-3 pr-4">Minimal</td>
                    <td className="py-3">Like strength training</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-[#E6E9EF]">Best For</td>
                    <td className="py-3 pr-4">Building passive range fast</td>
                    <td className="py-3">Active control in deep positions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* When to Use Flexibility */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              When to Use Flexibility
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Choose the flexibility system when your goal is to get deeper into positions without adding training stress.
            </p>
            
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-emerald-400 mb-4">Flexibility is best when:</h3>
              <ul className="space-y-3">
                {[
                  'You want to improve range without impacting strength training',
                  'You can train daily or multiple times per day',
                  'Your main limiter is passive range, not strength in range',
                  'You want to reduce tightness after workouts',
                  'You\'re maintaining existing range during heavy training phases',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#A4ACB8]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* When to Use Mobility */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              When Mobility is Better
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Choose the mobility system when you need strength and control in deep positions, not just passive range.
            </p>
            
            <div className="bg-[#C1121F]/5 border border-[#C1121F]/20 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-[#C1121F] mb-4">Mobility is best when:</h3>
              <ul className="space-y-3">
                {[
                  'You can get into a position but can\'t control it',
                  'You need active strength at end ranges for skills',
                  'Your flexibility exceeds your strength in that range',
                  'You want to reduce injury risk in deep positions',
                  'You\'re building toward skills that require active flexibility',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#A4ACB8]">
                    <CheckCircle2 className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* The Hybrid Approach */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              The Hybrid Approach
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              For most athletes, combining both systems works best. Use flexibility for frequent exposure and mobility strategically for strength building.
            </p>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-6">
              <h3 className="font-semibold text-[#E6E9EF] mb-4">Hybrid Structure</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-emerald-400">1</div>
                  <div>
                    <p className="font-medium text-[#E6E9EF]">Daily flexibility</p>
                    <p className="text-sm text-[#6B7280]">15-second exposure work after workouts or as a standalone session</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-[#C1121F]">2</div>
                  <div>
                    <p className="font-medium text-[#E6E9EF]">2x per week mobility</p>
                    <p className="text-sm text-[#6B7280]">Loaded stretching and end-range strength work on dedicated days</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#E6E9EF] mb-4">
                  Train Smarter with SpartanLab
                </h3>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  The adaptive program builder automatically selects the right system based on your goals. Get a personalized flexibility or mobility program.
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
                { slug: 'front-splits-flexibility', title: 'Front Splits Flexibility', category: 'Flexibility' },
                { slug: 'toe-touch-flexibility', title: 'Toe Touch Flexibility', category: 'Flexibility' },
                { slug: 'splits-mobility', title: 'Splits Mobility Training', category: 'Mobility' },
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
