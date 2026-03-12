import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Target, CheckCircle2, AlertTriangle, Dumbbell, Clock, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Front Lever Training Guide | SpartanLab',
  description: 'Learn how to train the front lever with step-by-step progressions, exercises, and expert training advice. Complete guide for beginners to advanced athletes.',
  keywords: ['front lever training', 'front lever progression', 'how to learn front lever', 'calisthenics front lever', 'front lever exercises'],
  openGraph: {
    title: 'Front Lever Training Guide | SpartanLab',
    description: 'Learn how to train the front lever with step-by-step progressions, exercises, and expert training advice.',
    type: 'article',
  },
}

// Progression data
const PROGRESSIONS = [
  {
    name: 'Tuck Front Lever',
    difficulty: 'Beginner',
    holdTime: '10-20 seconds',
    description: 'Knees pulled tight to chest, body horizontal beneath the bar. Focus on scapular depression and straight arms.',
    strengthRequired: '+20% BW weighted pull-up or 8-10 strict pull-ups',
    image: '/guides/front-lever/tuck.jpg',
  },
  {
    name: 'Advanced Tuck Front Lever',
    difficulty: 'Intermediate',
    holdTime: '8-15 seconds',
    description: 'Hips extended backward with thighs below horizontal. Significantly harder than tuck due to longer lever arm.',
    strengthRequired: '+35% BW weighted pull-up or 12-15 strict pull-ups',
    image: '/guides/front-lever/advanced-tuck.jpg',
  },
  {
    name: 'Straddle Front Lever',
    difficulty: 'Advanced',
    holdTime: '5-10 seconds',
    description: 'Both legs fully extended and spread wide. Straddle position shortens the lever compared to full.',
    strengthRequired: '+50% BW weighted pull-up',
    image: '/guides/front-lever/straddle.jpg',
  },
  {
    name: 'Full Front Lever',
    difficulty: 'Elite',
    holdTime: '3-8 seconds',
    description: 'Legs together, body completely horizontal. The ultimate test of horizontal pulling strength.',
    strengthRequired: '+65-75% BW weighted pull-up',
    image: '/guides/front-lever/full.jpg',
  },
]

// Exercises data
const EXERCISES = [
  {
    name: 'Front Lever Raises',
    description: 'Dynamic movement from inverted hang to front lever position. Builds strength through the full range of motion.',
    cues: ['Start in inverted hang', 'Lower with straight arms', 'Control the descent', 'Stop at horizontal'],
    sets: '3-4',
    reps: '3-5',
    image: '/guides/front-lever/front-lever-raises.jpg',
  },
  {
    name: 'Front Lever Holds',
    description: 'Isometric holds at your current progression level. The primary skill-building exercise.',
    cues: ['Depress scapulae', 'Straight arms always', 'Squeeze glutes', 'Maintain body tension'],
    sets: '4-6',
    reps: '5-15 sec holds',
    image: '/guides/front-lever/front-lever-holds.jpg',
  },
  {
    name: 'Weighted Pull-Ups',
    description: 'The foundation of front lever strength. Weighted pull-up strength directly correlates with lever progression.',
    cues: ['Full range of motion', 'Control both phases', 'No kipping', 'Progress weight slowly'],
    sets: '4-5',
    reps: '5-8',
    image: '/guides/front-lever/weighted-pullups.jpg',
  },
  {
    name: 'Front Lever Rows',
    description: 'Horizontal pulling from front lever position. Develops specific strength for the hold.',
    cues: ['Start in lever position', 'Pull chest to bar', 'Maintain horizontal body', 'Lower with control'],
    sets: '3-4',
    reps: '5-8',
    image: '/guides/front-lever/front-lever-rows.jpg',
  },
  {
    name: 'Scapular Pulls',
    description: 'Isolated scapular depression from dead hang. Essential for proper lever position.',
    cues: ['Dead hang start', 'Depress scapulae only', 'No elbow bend', 'Hold at top'],
    sets: '3',
    reps: '8-12',
    image: '/guides/front-lever/scapular-pulls.jpg',
  },
]

// Mistakes data
const MISTAKES = [
  {
    mistake: 'Bent arms during the hold',
    explanation: 'Bending the arms makes the lever easier but does not build the correct strength. Always maintain locked elbows.',
  },
  {
    mistake: 'Hips dropping below body line',
    explanation: 'A piked position is easier but trains incorrect muscle activation. Keep your body in a straight line from shoulders to feet.',
  },
  {
    mistake: 'Lack of scapular engagement',
    explanation: 'Without proper scapular depression and retraction, you cannot maintain a horizontal position. Focus on pulling your shoulders down and back.',
  },
  {
    mistake: 'Progressing too quickly',
    explanation: 'Rushing to harder progressions before owning easier ones leads to plateaus and potential injury. Master each level before advancing.',
  },
  {
    mistake: 'Neglecting pulling strength',
    explanation: 'Front lever progress stalls without adequate weighted pull-up strength. If your lever is stuck, increase your pulling strength.',
  },
]

export default function FrontLeverTrainingGuide() {
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
          <span className="text-xs text-[#6B7280]">15 min read</span>
        </div>
      </nav>
      
      <div className="px-4 py-12 sm:py-16">
        <article className="max-w-4xl mx-auto">
          {/* Breadcrumb - hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-2 text-sm text-[#6B7280] mb-8">
            <Link href="/landing" className="hover:text-[#A4ACB8]">Home</Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-[#A4ACB8]">Guides</Link>
            <span>/</span>
            <span className="text-[#A4ACB8]">Front Lever Training</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#C1121F]" />
              </div>
              <span className="text-sm text-[#C1121F] font-medium">Skill Progression</span>
              <span className="text-xs text-[#6B7280] ml-auto">15 min read</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E6E9EF] mb-6 text-balance">
              Front Lever Training Guide
            </h1>
            <p className="text-xl text-[#A4ACB8] leading-relaxed">
              Learn how to build the strength and technique required for a full Front Lever using proven calisthenics progressions.
            </p>
          </header>

          {/* Introduction */}
          <section className="mb-16">
            <div className="prose prose-invert max-w-none">
              <p className="text-[#A4ACB8] leading-relaxed text-lg mb-4">
                The front lever is one of the most respected strength skills in calisthenics. It requires exceptional pulling strength, core tension, and scapular control to hold your body horizontally beneath the bar.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Unlike many exercises, the front lever cannot be rushed. Progression training, proper technique, and patience are required to build the strength necessary for the full position.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                This guide will walk you through the progressions, exercises, and training strategies used by experienced calisthenics athletes.
              </p>
            </div>
          </section>

          {/* Muscles Used Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">
              Muscles Used in the Front Lever
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-6">
              The front lever is a full-body exercise that primarily targets the pulling muscles while demanding significant core activation.
            </p>
            
            {/* Muscle Diagram Placeholder */}
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#1A1F26] border border-[#2B313A] mb-6">
              <Image
                src="/guides/front-lever/muscle-diagram.jpg"
                alt="Front Lever Muscle Activation Diagram"
                fill
                className="object-cover"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { muscle: 'Latissimus Dorsi (Lats)', role: 'Primary mover - creates the pulling force to hold body horizontal' },
                { muscle: 'Upper Back (Rhomboids, Traps)', role: 'Scapular retraction and depression for stable shoulder position' },
                { muscle: 'Core (Rectus Abdominis)', role: 'Anti-extension strength to maintain straight body line' },
                { muscle: 'Rear Deltoids', role: 'Shoulder stabilization and horizontal pulling assistance' },
                { muscle: 'Grip and Forearms', role: 'Maintaining bar grip under significant body tension' },
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
              Front Lever Progression Levels
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-8">
              The front lever follows a systematic progression that gradually increases the lever arm length. Each level requires significantly more strength than the previous.
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
              Best Exercises to Build Front Lever Strength
            </h2>
            <p className="text-[#A4ACB8] leading-relaxed mb-8">
              These exercises target the specific strength qualities needed for front lever development. Include them in your training program alongside your lever practice.
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
              Common Front Lever Mistakes
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
              How Often to Train Front Lever
            </h2>
            
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Recommended Training Frequency</h3>
              </div>
              <p className="text-[#A4ACB8] mb-4">
                Most athletes see optimal progress training front lever <span className="text-[#E6E9EF] font-medium">2-3 times per week</span> with adequate recovery between sessions.
              </p>
              <ul className="space-y-2">
                {[
                  'Skill Work: Practice your current progression with 4-6 quality holds per session',
                  'Strength Work: Include weighted pull-ups and rows in your program',
                  'Recovery: Allow 48-72 hours between front lever sessions',
                  'Volume Management: Quality beats quantity - avoid training to failure every session',
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
                    Place front lever work at the beginning of your session when you are fresh. Skill acquisition is most effective when not fatigued.
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
                  Test Your Front Lever Level
                </h2>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  Not sure which progression you should train? Use the SpartanLab Front Lever Progression Calculator to analyze your current level based on your hold time and strength.
                </p>
                <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  <Link href="/tools/front-lever-progression">
                    Open Front Lever Calculator
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
                  Generate a Training Program for Your Level
                </h2>
                <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                  SpartanLab can generate a full training program based on your current strength level, skill progression, recovery signals, and training schedule. Instead of guessing what to train next, the Adaptive Training Engine analyzes your data and builds a program designed for your current ability.
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
                { slug: 'front-lever-progression', title: 'Front Lever Progression & Standards', description: 'Detailed progression levels and strength prerequisites' },
                { slug: 'weighted-pull-up-training', title: 'Weighted Pull-Up Training', description: 'Build the pulling strength needed for front lever' },
                { slug: 'calisthenics-strength-standards', title: 'Calisthenics Strength Standards', description: 'See how your strength compares to benchmarks' },
                { slug: 'calisthenics-training-program', title: 'Calisthenics Program Guide', description: 'Structure your overall training program' },
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
      </div>

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
