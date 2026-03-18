import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Target, CheckCircle2, AlertTriangle, Dumbbell, Clock, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Handstand Push-Up Progression Guide | SpartanLab',
  description: 'Learn how to master the handstand push-up with step-by-step progressions, exercises, and expert training advice. Complete guide from pike push-ups to freestanding HSPU.',
  keywords: ['handstand push-up training', 'HSPU progression', 'how to learn handstand push-up', 'calisthenics HSPU', 'vertical pressing strength'],
  openGraph: {
    title: 'Handstand Push-Up Progression Guide | SpartanLab',
    description: 'Learn how to master the handstand push-up with step-by-step progressions, exercises, and expert training advice.',
    type: 'article',
  },
}

// Progression data
const PROGRESSIONS = [
  {
    name: 'Pike Push-Up',
    difficulty: 'Beginner',
    reps: '15-20 reps',
    description: 'Hips high, forming an inverted V position. Head travels forward between hands. Foundation for all vertical pressing.',
    strengthRequired: '20+ push-ups with good form',
    image: '/guides/hspu/pike-pushup.jpg',
  },
  {
    name: 'Elevated Pike Push-Up',
    difficulty: 'Beginner',
    reps: '12-15 reps',
    description: 'Feet elevated on a box or bench, increasing vertical pressing angle. Torso more vertical than standard pike.',
    strengthRequired: '15+ pike push-ups',
    image: '/guides/hspu/elevated-pike.jpg',
  },
  {
    name: 'Wall HSPU Negative',
    difficulty: 'Intermediate',
    reps: '6-8 reps (3-4s descent)',
    description: 'Slow controlled descent from wall handstand. Build eccentric strength before concentric pressing ability.',
    strengthRequired: '30s wall handstand hold',
    image: '/guides/hspu/hspu-negative.jpg',
  },
  {
    name: 'Wall Handstand Push-Up',
    difficulty: 'Advanced',
    reps: '5-10 reps',
    description: 'Full range of motion pressing against wall. Head touches floor, press back to full lockout.',
    strengthRequired: '8+ HSPU negatives with control',
    image: '/guides/hspu/wall-hspu.jpg',
  },
  {
    name: 'Deficit Handstand Push-Up',
    difficulty: 'Advanced',
    reps: '3-5 reps',
    description: 'Extended range of motion using parallettes or blocks. Head travels past hand level for maximum shoulder strength.',
    strengthRequired: '10+ wall HSPU',
    image: '/guides/hspu/deficit-hspu.jpg',
  },
  {
    name: 'Freestanding Handstand Push-Up',
    difficulty: 'Elite',
    reps: '1-5 reps',
    description: 'The ultimate vertical pressing skill. Requires balance mastery and exceptional pressing strength combined.',
    strengthRequired: '30s freestanding handstand + 5+ deficit HSPU',
    image: '/guides/hspu/freestanding-hspu.jpg',
  },
]

// Exercises data
const EXERCISES = [
  {
    name: 'Wall Handstand Holds',
    description: 'Build time in the inverted position to develop shoulder stability and comfort upside down.',
    cues: ['Belly to wall position', 'Straight body line', 'Push through shoulders', 'Fingers spread for balance'],
    sets: '3-4',
    reps: '30-60s holds',
    image: '/guides/hspu/wall-handstand-hold.jpg',
  },
  {
    name: 'Pike Push-Up Variations',
    description: 'Progressive pike push-up training from floor to elevated. The primary strength builder before wall work.',
    cues: ['Hips high', 'Head forward between hands', 'Elbows track 45 degrees', 'Full lockout at top'],
    sets: '4',
    reps: '8-12',
    image: '/guides/hspu/pike-pushups.jpg',
  },
  {
    name: 'Wall Shoulder Taps',
    description: 'Develop single-arm stability and control in the handstand position. Essential for balance development.',
    cues: ['Shift weight to one arm', 'Quick controlled taps', 'Maintain straight body', 'Keep hips level'],
    sets: '3',
    reps: '10-16 taps (alternating)',
    image: '/guides/hspu/shoulder-taps.jpg',
  },
  {
    name: 'HSPU Negatives',
    description: 'Slow eccentric lowering builds strength through the full range of motion. Key transitional exercise.',
    cues: ['Start at top of wall HSPU', '3-4 second descent', 'Control head placement', 'Reset at bottom'],
    sets: '4-5',
    reps: '4-6',
    image: '/guides/hspu/hspu-negatives.jpg',
  },
  {
    name: 'Wall Scapula Shrugs',
    description: 'Isolated shoulder elevation in handstand position. Strengthens the top portion of the press.',
    cues: ['Start in wall handstand', 'Sink into shoulders', 'Push up through scaps', 'Small controlled movement'],
    sets: '3',
    reps: '12-15',
    image: '/guides/hspu/scap-shrugs.jpg',
  },
]

// Mistakes data
const MISTAKES = [
  {
    mistake: 'Skipping the negative phase',
    explanation: 'Jumping straight to full HSPU without mastering negatives leads to poor technique and stalled progress. Eccentric strength builds the foundation.',
  },
  {
    mistake: 'Elbows flaring out to 90 degrees',
    explanation: 'Keeping elbows at 90 degrees places excessive stress on shoulders. Track elbows at 45 degrees for safer, stronger pressing.',
  },
  {
    mistake: 'Lack of handstand time',
    explanation: 'Attempting HSPU without comfortable handstand holds limits your pressing ability. Build to 60 seconds wall handstand before serious HSPU training.',
  },
  {
    mistake: 'Arching the back excessively',
    explanation: 'A banana-shaped body position reduces core engagement and transfers load incorrectly. Maintain a hollow body or slight posterior pelvic tilt.',
  },
  {
    mistake: 'Not using full range of motion',
    explanation: 'Partial reps build partial strength. Touch your head to the floor and lock out completely at the top for maximum strength development.',
  },
]

export default function HSPUTrainingGuide() {
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
          <span className="text-xs text-[#6B7280]">12 min read</span>
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
            <span className="text-[#A4ACB8]">Handstand Push-Up Progression</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#C1121F]" />
              </div>
              <span className="text-sm text-[#C1121F] font-medium">Skill Progression</span>
              <span className="text-xs text-[#6B7280] ml-auto">12 min read</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E6E9EF] mb-6 text-balance">
              Handstand Push-Up Progression Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              Master the handstand push-up from pike push-ups to freestanding HSPU using proven calisthenics progressions and training methods.
            </p>
          </header>

          {/* Introduction */}
          <section className="mb-16">
            <div className="prose prose-invert max-w-none">
              <p className="text-[#A4ACB8] leading-relaxed text-lg mb-4">
                The handstand push-up is one of the most impressive upper body pressing movements in calisthenics. It develops exceptional shoulder strength, tricep power, and overhead stability that transfers to nearly every other pressing skill.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Unlike horizontal pressing (push-ups, dips), the HSPU demands vertical pressing strength with your full bodyweight inverted. This requires not just raw strength, but comfort in the handstand position and proper technique.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                This guide will walk you through the progressions, exercises, and training strategies used by experienced calisthenics athletes to build toward the freestanding handstand push-up.
              </p>
            </div>
          </section>

          {/* Strength Requirements */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Strength Requirements for HSPU
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Before starting HSPU training, you should have baseline strength and comfort in inverted positions. Here are the key prerequisites.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {[
                { metric: 'Push-Ups', requirement: '20+ strict reps', description: 'Baseline horizontal pressing strength' },
                { metric: 'Dips', requirement: '10+ strict reps', description: 'Vertical pressing foundation' },
                { metric: 'Wall Handstand', requirement: '30+ seconds', description: 'Inverted position comfort' },
                { metric: 'Pike Push-Ups', requirement: '15+ reps', description: 'Entry point for HSPU training' },
              ].map((item, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="w-4 h-4 text-[#C1121F]" />
                    <h4 className="font-semibold text-[#E6E9EF]">{item.metric}</h4>
                  </div>
                  <p className="text-lg font-bold text-[#C1121F] mb-1">{item.requirement}</p>
                  <p className="text-sm text-[#6B7280]">{item.description}</p>
                </Card>
              ))}
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-400 mb-1">Important Note</p>
                  <p className="text-sm text-[#A4ACB8]">
                    If you cannot hold a wall handstand for 30 seconds, focus on building handstand time before starting HSPU progressions. Comfort upside down is essential for safe, effective training.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Muscles Used Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Muscles Used in the Handstand Push-Up
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              The HSPU is a compound vertical pressing movement that primarily targets the shoulders and triceps while engaging the entire upper body and core.
            </p>
            
            {/* Muscle Diagram Placeholder */}
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#1A1F26] border border-[#2B313A] mb-6">
              <Image
                src="/guides/hspu/muscle-diagram.jpg"
                alt="HSPU Muscle Activation Diagram"
                fill
                className="object-cover"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { muscle: 'Anterior Deltoids', role: 'Primary movers - generate the pressing force' },
                { muscle: 'Triceps Brachii', role: 'Elbow extension to complete the lockout' },
                { muscle: 'Upper Chest (Clavicular)', role: 'Assists pressing at bottom range' },
                { muscle: 'Core (Abs & Obliques)', role: 'Stabilizes body position throughout movement' },
                { muscle: 'Upper Trapezius', role: 'Shoulder elevation and stability at top' },
              ].map((item, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] p-4">
                  <h4 className="font-semibold text-[#E6E9EF] mb-1">{item.muscle}</h4>
                  <p className="text-sm text-[#6B7280]">{item.role}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Progression Levels */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              HSPU Progression Levels
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-8">
              The handstand push-up follows a systematic progression that gradually increases the vertical pressing angle and difficulty. Each level builds the strength and stability required for the next.
            </p>

            <div className="space-y-6">
              {PROGRESSIONS.map((prog, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="relative w-full md:w-64 aspect-video md:aspect-square bg-[#0F1115] flex-shrink-0">
                      <Image
                        src={prog.image}
                        alt={prog.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Content */}
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-[#E6E9EF]">{prog.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          prog.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                          prog.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                          prog.difficulty === 'Advanced' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-[#C1121F]/10 text-[#C1121F]'
                        }`}>
                          {prog.difficulty}
                        </span>
                      </div>
                      <p className="text-[#A4ACB8] mb-4">{prog.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-[#C1121F]" />
                          <span className="text-[#6B7280]">Target:</span>
                          <span className="text-[#E6E9EF] font-medium">{prog.reps}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-[#C1121F]" />
                          <span className="text-[#6B7280]">Prerequisite:</span>
                          <span className="text-[#E6E9EF] font-medium">{prog.strengthRequired}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Best Exercises */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Best Exercises to Build HSPU Strength
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-8">
              These exercises target the specific strength qualities needed for HSPU development. Include them in your training program alongside your pressing practice.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {EXERCISES.map((exercise, i) => (
                <Card key={i} className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
                  <div className="relative aspect-video bg-[#0F1115]">
                    <Image
                      src={exercise.image}
                      alt={exercise.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-[#E6E9EF] mb-2">{exercise.name}</h4>
                    <p className="text-sm text-[#A4ACB8] mb-4">{exercise.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-4">
                      <span>Sets: <span className="text-[#E6E9EF] font-medium">{exercise.sets}</span></span>
                      <span>Reps: <span className="text-[#E6E9EF] font-medium">{exercise.reps}</span></span>
                    </div>
                    
                    <div className="pt-4 border-t border-[#2B313A]/50">
                      <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">Key Cues</p>
                      <ul className="space-y-1">
                        {exercise.cues.map((cue, j) => (
                          <li key={j} className="text-xs text-[#A4ACB8] flex items-start gap-2">
                            <span className="text-[#C1121F] mt-0.5">•</span>
                            {cue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Common Mistakes */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Common HSPU Mistakes
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Avoid these common errors that slow progress and can lead to injury.
            </p>

            <div className="space-y-4">
              {MISTAKES.map((item, i) => (
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

          {/* Training Frequency */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              How Often to Train HSPU
            </h2>
            
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Recommended Training Frequency</h3>
              </div>
              <p className="text-[#A4ACB8] mb-4">
                Most athletes see optimal progress training HSPU progressions <span className="text-[#E6E9EF] font-medium">2-3 times per week</span> with adequate recovery between sessions.
              </p>
              <ul className="space-y-2">
                {[
                  'Skill Work: Practice wall handstands and your current progression 3-5 sets per session',
                  'Strength Work: Include pike push-up variations and negatives for volume',
                  'Recovery: Allow 48-72 hours between heavy HSPU sessions',
                  'Handstand Time: Accumulate 5-10 minutes of total handstand hold time per week',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tip */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-400 mb-1">Pro Tip</p>
                  <p className="text-sm text-[#A4ACB8]">
                    Place HSPU work at the beginning of your session when you are fresh. Vertical pressing is neurally demanding and technique suffers when fatigued.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Tool Integration CTA */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-7 h-7 text-[#C1121F]" />
                </div>
                <h2 className="text-2xl font-bold text-[#E6E9EF] mb-3">
                  Test Your HSPU Level
                </h2>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  Not sure which progression you should train? Use the SpartanLab tools to analyze your current pressing strength and handstand ability.
                </p>
                <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  <Link href="/tools">
                    View HSPU Tools
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          </section>

          {/* Platform Funnel CTA */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#C1121F]/15 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/30 p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#E6E9EF] mb-3">
                  Generate a Training Program for Your HSPU Level
                </h2>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  SpartanLab can generate a full training program based on your current strength level, skill progression, recovery signals, and training schedule. Stop guessing what to train next and let the Adaptive Training Engine build the perfect program for your HSPU goals.
                </p>
                <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  <Link href="/programs">
                    Generate Program
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          </section>

          {/* Related Guides */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { slug: 'planche-progression', title: 'Planche Progression Guide', description: 'Another advanced horizontal pushing skill' },
                { slug: 'weighted-dip-training', title: 'Weighted Dip Training', description: 'Build pushing strength that transfers to HSPU' },
                { slug: 'front-lever-training', title: 'Front Lever Training', description: 'Pulling skill that balances HSPU training' },
                { slug: 'muscle-up-training', title: 'Muscle-Up Training', description: 'Combine pulling and pushing in one movement' },
              ].map((guide, i) => (
                <Link key={i} href={`/guides/${guide.slug}`}>
                  <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer">
                    <h4 className="font-semibold text-[#E6E9EF] mb-1">{guide.title}</h4>
                    <p className="text-sm text-[#6B7280]">{guide.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Back Link */}
          <div className="flex items-center justify-between pt-8 border-t border-[#2B313A]">
            <Link 
              href="/guides" 
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All Guides
            </Link>
            <Link 
              href="/tools" 
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              Free Tools
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#6B7280]">
            <p>Part of the SpartanLab Calisthenics Training Platform</p>
            <div className="flex items-center gap-6">
              <Link href="/guides" className="hover:text-[#E6E9EF] transition-colors">Guides</Link>
              <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">Tools</Link>
              <Link href="/programs" className="hover:text-[#E6E9EF] transition-colors">Programs</Link>
              <Link href="/sign-in?redirect_url=/dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
