'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Dumbbell, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  Zap,
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  ChevronRight,
  Lightbulb
} from 'lucide-react'

// Muscle data
const muscles = [
  { name: 'Chest', role: 'Primary pushing muscle during the press', icon: Target },
  { name: 'Triceps', role: 'Extends the elbow during lockout', icon: Dumbbell },
  { name: 'Shoulders', role: 'Anterior deltoids assist the press', icon: Activity },
  { name: 'Core', role: 'Stabilizes the body throughout the movement', icon: Zap },
]

// Skill transfer benefits
const skillBenefits = [
  {
    skill: 'Muscle-Up Transition',
    description: 'Strong dips power the transition phase of the muscle-up, helping you press over the bar.',
    correlation: '+30% BW dips = easier muscle-up transitions',
    icon: Zap,
  },
  {
    skill: 'Planche Pushing Strength',
    description: 'Weighted dip strength directly transfers to planche push-up and lean strength.',
    correlation: '+50% BW dips often correlates with advanced tuck planche',
    icon: Target,
  },
  {
    skill: 'Straight Bar Dips',
    description: 'Parallel bar dip strength builds the foundation for more demanding straight bar dips.',
    correlation: 'Strong weighted dips make bar work feel easier',
    icon: Dumbbell,
  },
  {
    skill: 'Upper Body Pressing Power',
    description: 'General pressing strength improves HSPU, ring work, and overall pushing capacity.',
    correlation: 'Foundation for all advanced pushing skills',
    icon: TrendingUp,
  },
]

// Strength levels
const strengthLevels = [
  {
    level: 'Beginner',
    weight: 'Bodyweight Only',
    reps: '8-12 reps',
    description: 'Building foundational pressing strength and proper form.',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    level: 'Intermediate',
    weight: '+10-25% BW',
    reps: '6-10 reps',
    description: 'Developing solid pushing power. Ready for basic skill work.',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    level: 'Advanced',
    weight: '+30-50% BW',
    reps: '5-8 reps',
    description: 'Strong pressing foundation. Muscle-up and planche prerequisites often met.',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    level: 'Elite',
    weight: '+70-100% BW',
    reps: '3-5 reps',
    description: 'Exceptional pressing strength. Advanced planche and ring work becomes accessible.',
    color: 'bg-[#C1121F]/20 text-[#C1121F] border-[#C1121F]/30',
  },
]

// Exercises
const exercises = [
  {
    name: 'Weighted Dips',
    description: 'The primary exercise for building pushing strength. Add weight progressively with a dip belt or weighted vest.',
    cues: ['Full depth - shoulders below elbows', 'Control the descent', 'Drive through palms to lockout', 'Slight forward lean for chest emphasis'],
    sets: '4-5 sets × 5-8 reps',
    image: '/guides/weighted-dips/weighted-dip.jpg',
  },
  {
    name: 'Straight Bar Dips',
    description: 'Dips performed on a straight bar. Requires more forward lean and builds muscle-up specific strength.',
    cues: ['Lean forward significantly', 'Keep elbows close to body', 'Lower chest toward bar', 'Full lockout at top'],
    sets: '3-4 sets × 6-10 reps',
    image: '/guides/weighted-dips/straight-bar-dips.jpg',
  },
  {
    name: 'Pseudo Planche Push-Ups',
    description: 'Push-ups with extreme forward lean. Builds planche-specific pressing strength.',
    cues: ['Lean shoulders past wrists', 'Protract scapulae at top', 'Keep core tight', 'Control the descent'],
    sets: '3-4 sets × 8-12 reps',
    image: '/guides/weighted-dips/pseudo-planche-pushups.jpg',
  },
  {
    name: 'Handstand Push-Ups',
    description: 'Vertical pressing builds shoulder strength that transfers to dips and planche.',
    cues: ['Hands shoulder-width or slightly wider', 'Lower under control', 'Head gently touches ground', 'Full lockout at top'],
    sets: '3-4 sets × 5-10 reps',
    image: '/guides/weighted-dips/handstand-pushups.jpg',
  },
  {
    name: 'Ring Dips',
    description: 'Dips on gymnastic rings. Requires significant stabilization and builds functional pressing strength.',
    cues: ['Turn rings out at top (RTO)', 'Control the wobble', 'Full depth with control', 'Build to weighted ring dips'],
    sets: '3-4 sets × 6-10 reps',
    image: '/guides/weighted-dips/ring-dips.jpg',
  },
]

// Common mistakes
const mistakes = [
  {
    mistake: 'Poor Shoulder Positioning',
    explanation: 'Shrugging shoulders or letting them roll forward puts excessive stress on the joint and reduces power output.',
  },
  {
    mistake: 'Partial Range of Motion',
    explanation: 'Not going deep enough (shoulders below elbows) limits strength gains and skill transfer.',
  },
  {
    mistake: 'Excessive Forward Lean',
    explanation: 'While some lean is fine, too much shifts stress away from triceps and can strain shoulders.',
  },
  {
    mistake: 'Adding Weight Too Quickly',
    explanation: 'Jumping weight before mastering current loads leads to form breakdown and injury risk.',
  },
  {
    mistake: 'Flaring Elbows',
    explanation: 'Elbows flaring out excessively stresses the shoulder joint. Keep them at roughly 45 degrees.',
  },
]

// Related guides
const relatedGuides = [
  { slug: 'planche-progression', title: 'Planche Progression Guide' },
  { slug: 'muscle-up-training', title: 'Muscle-Up Training Guide' },
  { slug: 'weighted-pull-up-training', title: 'Weighted Pull-Up Guide' },
]

export default function WeightedDipTrainingGuide() {
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Header */}
      <header className="border-b border-[#2B313A] bg-[#0F1115]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/guides" className="flex items-center gap-2 text-[#6B7280] hover:text-[#E6E9EF] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">All Guides</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <Clock className="w-3.5 h-3.5" />
            <span>10 min read</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 text-xs font-medium bg-[#C1121F]/10 text-[#C1121F] rounded-full border border-[#C1121F]/20">
              Strength Guide
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#E6E9EF] mb-4 leading-tight">
            Weighted Dip Training Guide
          </h1>
          <p className="text-lg md:text-xl text-[#A4ACB8] max-w-2xl leading-relaxed">
            Learn how to build elite pushing strength using weighted dips and proven calisthenics strength progressions.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="px-4 pb-16">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Introduction</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Weighted dips are one of the most powerful pushing exercises in calisthenics. They develop pressing strength, improve muscle-up transitions, and build the pushing power required for advanced skills like the planche.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Athletes who develop strong weighted dips often progress faster in upper-body calisthenics skills. The strength gained from weighted dips transfers directly to straight bar work, ring exercises, and handstand pressing.
              </p>
              <p className="text-[#A4ACB8] leading-relaxed">
                This guide explains how to safely build weighted dip strength and integrate it into a calisthenics training program for maximum skill transfer.
              </p>
            </div>
          </section>

          {/* Muscles Used */}
          <section>
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Muscles Used in Weighted Dips</h2>
            
            {/* Muscle Diagram */}
            <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden bg-[#1A1F26] border border-[#2B313A] mb-6">
              <Image
                src="/guides/weighted-dips/muscle-diagram.jpg"
                alt="Weighted Dip Muscle Activation Diagram"
                fill
                className="object-cover"
              />
            </div>

            {/* Muscle Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {muscles.map((muscle) => (
                <Card key={muscle.name} className="bg-[#1A1F26] border-[#2B313A] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                      <muscle.icon className="w-5 h-5 text-[#C1121F]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#E6E9EF] mb-1">{muscle.name}</h3>
                      <p className="text-sm text-[#A4ACB8]">{muscle.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Why Weighted Dips Matter */}
          <section>
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Why Weighted Dips Matter for Calisthenics</h2>
            <p className="text-[#A4ACB8] mb-6">
              Weighted dip strength is one of the best predictors of success in advanced pushing skills. Here is how it transfers:
            </p>
            <div className="grid gap-4">
              {skillBenefits.map((benefit) => (
                <Card key={benefit.skill} className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C1121F]/20 to-[#C1121F]/5 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-[#C1121F]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#E6E9EF] mb-1">{benefit.skill}</h3>
                      <p className="text-sm text-[#A4ACB8] mb-2">{benefit.description}</p>
                      <p className="text-xs text-[#C1121F] font-medium">{benefit.correlation}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Strength Levels */}
          <section>
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Weighted Dip Strength Levels</h2>
            <p className="text-[#A4ACB8] mb-6">
              Use these benchmarks to assess your current pushing strength and set training goals:
            </p>
            <div className="space-y-4">
              {strengthLevels.map((level, index) => (
                <Card key={level.level} className="bg-[#1A1F26] border-[#2B313A] p-5 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${level.color}`}>
                        {level.level}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[#E6E9EF]">{level.weight}</div>
                        <div className="text-sm text-[#6B7280]">{level.reps}</div>
                      </div>
                    </div>
                    <p className="text-sm text-[#A4ACB8] sm:max-w-xs">{level.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Best Exercises */}
          <section>
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Best Exercises for Pushing Strength</h2>
            <p className="text-[#A4ACB8] mb-6">
              These exercises build the pressing strength needed for weighted dips and advanced calisthenics skills:
            </p>
            <div className="space-y-6">
              {exercises.map((exercise) => (
                <Card key={exercise.name} className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
                  <div className="md:flex">
                    {/* Exercise Image */}
                    <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 bg-[#0F1115]">
                      <Image
                        src={exercise.image}
                        alt={exercise.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Exercise Content */}
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-lg font-semibold text-[#E6E9EF]">{exercise.name}</h3>
                        <span className="text-xs text-[#C1121F] font-medium whitespace-nowrap bg-[#C1121F]/10 px-2 py-1 rounded">
                          {exercise.sets}
                        </span>
                      </div>
                      <p className="text-sm text-[#A4ACB8] mb-4">{exercise.description}</p>
                      <div>
                        <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Key Cues</h4>
                        <ul className="space-y-1.5">
                          {exercise.cues.map((cue, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              {cue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Common Mistakes */}
          <section>
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Common Weighted Dip Mistakes</h2>
            <p className="text-[#A4ACB8] mb-6">
              Avoid these common errors to maximize progress and prevent injury:
            </p>
            <div className="space-y-4">
              {mistakes.map((item) => (
                <Card key={item.mistake} className="bg-[#1A1F26] border-[#2B313A] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#E6E9EF] mb-1">{item.mistake}</h3>
                      <p className="text-sm text-[#A4ACB8]">{item.explanation}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Training Frequency */}
          <section>
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">How Often to Train Weighted Dips</h2>
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                Most athletes see best results training weighted dips 2-3 times per week. This allows sufficient stimulus for strength gains while providing adequate recovery time.
              </p>
            </div>

            <Card className="bg-[#1A1F26] border-[#2B313A] p-5 mb-6">
              <h3 className="font-semibold text-[#E6E9EF] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C1121F]" />
                Sample Weekly Structure
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F1115]/50">
                  <span className="w-20 text-sm font-medium text-[#E6E9EF]">Day 1</span>
                  <span className="text-sm text-[#A4ACB8]">Heavy weighted dips (4×5 at 80-85% max)</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F1115]/50">
                  <span className="w-20 text-sm font-medium text-[#E6E9EF]">Day 2</span>
                  <span className="text-sm text-[#A4ACB8]">Skill work + accessory pressing</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F1115]/50">
                  <span className="w-20 text-sm font-medium text-[#E6E9EF]">Day 3</span>
                  <span className="text-sm text-[#A4ACB8]">Volume dips (3×10-12 at moderate weight)</span>
                </div>
              </div>
            </Card>

            {/* Pro Tip */}
            <Card className="bg-emerald-500/5 border-emerald-500/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-400 mb-1">Pro Tip</h4>
                  <p className="text-sm text-[#A4ACB8]">
                    Pair weighted dips with weighted pull-ups for balanced upper body development. Both exercises complement each other and help prevent muscle imbalances.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Tool Integration CTA */}
          <section>
            <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C1121F]/20 to-[#C1121F]/5 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-7 h-7 text-[#C1121F]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Analyze Your Dip Strength</h2>
                  <p className="text-[#A4ACB8] mb-4">
                    Use SpartanLab training tools to analyze your pushing strength and determine how your dip strength compares to other calisthenics athletes.
                  </p>
                  <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A]">
                    <Link href="/tools/weighted-dip-calculator">
                      Analyze Dip Strength
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* Platform Funnel CTA */}
          <section>
            <Card className="bg-gradient-to-br from-[#C1121F]/15 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/30 p-8 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
                Generate a Pushing Strength Program
              </h2>
              <p className="text-[#A4ACB8] mb-6 max-w-xl mx-auto">
                SpartanLab can generate a calisthenics program based on your pushing strength, skill progressions, and training schedule. The Adaptive Training Engine analyzes your performance and automatically adjusts your workouts as your strength improves.
              </p>
              <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                <Link href="/programs">
                  Generate Program
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </Card>
          </section>

          {/* Related Guides */}
          <section>
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Related Guides</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedGuides.map((guide) => (
                <Link key={guide.slug} href={`/guides/${guide.slug}`}>
                  <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                        {guide.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#C1121F] transition-colors" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2B313A] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#6B7280]">
            <p>Part of the SpartanLab Calisthenics Training Intelligence Platform</p>
            <div className="flex items-center gap-6">
              <Link href="/guides" className="hover:text-[#E6E9EF] transition-colors">All Guides</Link>
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
