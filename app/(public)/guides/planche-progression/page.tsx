import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Target, CheckCircle2, AlertTriangle, Dumbbell, Clock, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Planche Progression Guide | SpartanLab',
  description: 'Learn how to train the planche with step-by-step progressions, exercises, and expert calisthenics training advice. Complete guide from planche lean to full planche.',
  keywords: ['planche progression', 'how to train planche', 'planche exercises', 'calisthenics planche', 'planche tutorial', 'learn planche'],
  openGraph: {
    title: 'Planche Progression Guide | SpartanLab',
    description: 'Learn how to train the planche with step-by-step progressions, exercises, and expert calisthenics training advice.',
    type: 'article',
  },
}

// Progression data
const PROGRESSIONS = [
  {
    name: 'Planche Lean',
    difficulty: 'Foundation',
    holdTime: '30-60 seconds',
    description: 'Hands on floor in push-up position, lean shoulders forward past wrists while maintaining straight arms. The essential starting point for building planche-specific shoulder strength.',
    strengthRequired: '20+ push-ups, solid handstand comfort',
    image: '/guides/planche/planche-lean.jpg',
  },
  {
    name: 'Tuck Planche',
    difficulty: 'Beginner',
    holdTime: '10-20 seconds',
    description: 'Knees pulled tight to chest while balancing on hands with shoulders forward of wrists. First full planche position where feet leave the ground.',
    strengthRequired: '+25% BW weighted dips, 60s planche lean',
    image: '/guides/planche/tuck-planche.jpg',
  },
  {
    name: 'Advanced Tuck Planche',
    difficulty: 'Intermediate',
    holdTime: '8-15 seconds',
    description: 'Hips extended backward with back flat and thighs below horizontal. Significantly harder than tuck due to longer lever arm and increased core demand.',
    strengthRequired: '+40% BW weighted dips, 15s tuck planche',
    image: '/guides/planche/advanced-tuck-planche.jpg',
  },
  {
    name: 'Straddle Planche',
    difficulty: 'Advanced',
    holdTime: '5-10 seconds',
    description: 'Legs fully extended and spread wide while maintaining horizontal body position. Straddle shortens the lever compared to full planche.',
    strengthRequired: '+50-60% BW weighted dips',
    image: '/guides/planche/straddle-planche.jpg',
  },
  {
    name: 'Full Planche',
    difficulty: 'Elite',
    holdTime: '3-8 seconds',
    description: 'Legs together, body completely horizontal with only hands touching the ground. The ultimate test of straight-arm pushing strength.',
    strengthRequired: '+70-80% BW weighted dips',
    image: '/guides/planche/full-planche.jpg',
  },
]

// Exercises data
const EXERCISES = [
  {
    name: 'Planche Leans',
    description: 'The foundation exercise for planche. Develops shoulder protraction strength and forward lean tolerance in a controlled position.',
    cues: ['Hands shoulder-width', 'Lean shoulders past wrists', 'Lock elbows completely', 'Protract scapulae'],
    sets: '4-5',
    reps: '20-45 sec holds',
    image: '/guides/planche/planche-lean.jpg',
  },
  {
    name: 'Pseudo Planche Push-Ups',
    description: 'Push-ups with forward lean mimicking planche position. Builds dynamic strength in the shoulder angle required for planche.',
    cues: ['Start in planche lean', 'Maintain lean throughout', 'Full range of motion', 'Elbows track back, not out'],
    sets: '3-4',
    reps: '8-12',
    image: '/guides/planche/pseudo-planche-pushups.jpg',
  },
  {
    name: 'Planche Hold Variations',
    description: 'Isometric holds at your current progression level. The primary skill-building exercise for planche development.',
    cues: ['Maximum shoulder protraction', 'Straight arm lockout', 'Posterior pelvic tilt', 'Look slightly forward'],
    sets: '5-8',
    reps: '5-15 sec holds',
    image: '/guides/planche/planche-holds.jpg',
  },
  {
    name: 'Handstand Push-Ups',
    description: 'Vertical pressing strength transfers to planche. Builds shoulder and tricep strength needed for advanced progressions.',
    cues: ['Wall-supported or freestanding', 'Full range of motion', 'Controlled negative', 'Push through shoulders at top'],
    sets: '3-4',
    reps: '5-8',
    image: '/guides/planche/handstand-pushups.jpg',
  },
  {
    name: 'Planche Push-Up Negatives',
    description: 'Lower from planche position with control. Builds eccentric strength through the most challenging range.',
    cues: ['Start in planche hold', 'Lower chest toward floor', 'Maintain forward lean', '3-5 second negative'],
    sets: '3-4',
    reps: '3-5',
    image: '/guides/planche/planche-negatives.jpg',
  },
]

// Mistakes data
const MISTAKES = [
  {
    mistake: 'Insufficient shoulder lean',
    explanation: 'Without adequate forward lean, you cannot balance in planche. Your shoulders must be well past your wrists to counterbalance your legs.',
  },
  {
    mistake: 'Bent arms during the hold',
    explanation: 'Planche requires straight-arm strength. Bending the elbows shifts the load from shoulders to biceps and makes the skill unstable.',
  },
  {
    mistake: 'Weak scapular protraction',
    explanation: 'Without pushing your shoulders forward and around your ribcage, you lack the shoulder position needed to hold planche.',
  },
  {
    mistake: 'Ignoring wrist preparation',
    explanation: 'Planche places extreme demands on wrist extension. Neglecting wrist warm-ups and conditioning leads to pain and injury.',
  },
  {
    mistake: 'Hips too high or piked',
    explanation: 'A piked position with raised hips is significantly easier than true horizontal. Focus on keeping hips at shoulder level.',
  },
]

export default function PlancheProgressionGuide() {
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
            <span className="text-[#A4ACB8]">Planche Progression</span>
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
              Planche Progression Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              Learn how to develop the strength, balance, and shoulder stability required to achieve a full Planche.
            </p>
          </header>

          {/* Introduction */}
          <section className="mb-16">
            <div className="prose prose-invert max-w-none">
              <p className="text-[#A4ACB8] leading-relaxed text-lg mb-4">
                The planche is one of the most advanced strength skills in calisthenics. It requires extraordinary pushing strength, shoulder stability, and core tension to hold the body completely horizontal while balancing on the hands.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Achieving a full planche takes consistent training and careful progression. Most athletes spend months or years developing the necessary strength. The skill demands exceptional straight-arm pushing power that cannot be rushed.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                This guide explains the progression levels, exercises, and training principles used by experienced calisthenics athletes to build toward the planche.
              </p>
            </div>
          </section>

          {/* Muscles Used Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Muscles Used in the Planche
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              The planche is a full-body pushing skill that primarily targets the anterior shoulder chain while demanding extreme core activation.
            </p>
            
            {/* Muscle Diagram */}
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#1A1F26] border border-[#2B313A] mb-6">
              <Image
                src="/guides/planche/muscle-diagram.jpg"
                alt="Planche Muscle Activation Diagram"
                fill
                className="object-cover"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { muscle: 'Anterior Deltoids (Front Shoulders)', role: 'Primary mover - creates the pushing force to hold body horizontal' },
                { muscle: 'Chest (Pectoralis Major)', role: 'Horizontal adduction and forward pushing assistance' },
                { muscle: 'Triceps', role: 'Elbow lockout and straight-arm maintenance under load' },
                { muscle: 'Core (Rectus Abdominis, Obliques)', role: 'Anti-extension and body tension to maintain straight line' },
                { muscle: 'Serratus Anterior', role: 'Scapular protraction - essential for shoulder position' },
                { muscle: 'Wrist Flexors and Extensors', role: 'Stabilize wrists under extreme extension load' },
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
              Planche Progression Levels
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-8">
              The planche follows a systematic progression that gradually increases the lever arm length. Each level requires significantly more shoulder strength than the previous.
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
                          prog.difficulty === 'Foundation' ? 'bg-blue-500/10 text-blue-400' :
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
                          <Clock className="w-4 h-4 text-[#C1121F]" />
                          <span className="text-[#6B7280]">Hold:</span>
                          <span className="text-[#E6E9EF] font-medium">{prog.holdTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-[#C1121F]" />
                          <span className="text-[#6B7280]">Strength:</span>
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
              Best Exercises for Planche Strength
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-8">
              These exercises target the specific strength qualities needed for planche development. Include them in your training program alongside your planche practice.
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
              Common Planche Training Mistakes
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              Avoid these common errors that slow progress and can lead to shoulder or wrist injury.
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
              How Often to Train Planche
            </h2>
            
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Recommended Training Frequency</h3>
              </div>
              <p className="text-[#A4ACB8] mb-4">
                Most athletes see optimal progress training planche <span className="text-[#E6E9EF] font-medium">2-3 times per week</span> with adequate recovery between sessions. The shoulders and wrists need time to adapt.
              </p>
              <ul className="space-y-2">
                {[
                  'Skill Work: Practice your current progression with 5-8 quality holds per session',
                  'Strength Work: Include weighted dips and pseudo planche push-ups in your program',
                  'Wrist Prep: Always warm up wrists before planche work (5-10 minutes)',
                  'Recovery: Allow 48-72 hours between planche sessions for connective tissue recovery',
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
                    Combine planche skill work with pushing strength training. On planche days, do your holds first while fresh, then follow with weighted dips or pseudo planche push-ups.
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
                  Test Your Planche Strength
                </h2>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  Not sure where you stand in the planche progression? Use the SpartanLab Planche Strength Calculator to analyze your current pushing strength and determine the progression you should train.
                </p>
                <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  <Link href="/tools/planche-progression">
                    Open Planche Strength Calculator
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
                  Generate a Planche Training Program
                </h2>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  SpartanLab can generate a full calisthenics program based on your strength levels, training schedule, and available equipment. The Adaptive Training Engine adjusts your workouts automatically as you gain strength.
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
                { slug: 'front-lever-training', title: 'Front Lever Training Guide', description: 'Master the horizontal pull complement to planche' },
                { slug: 'hspu-progression', title: 'Handstand Push-Up Guide', description: 'Build vertical pressing strength for planche' },
                { slug: 'calisthenics-strength-standards', title: 'Calisthenics Strength Standards', description: 'See how your strength compares to benchmarks' },
                { slug: 'calisthenics-periodization', title: 'Calisthenics Periodization', description: 'Structure training cycles for optimal progress' },
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
              <Link href="/dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
