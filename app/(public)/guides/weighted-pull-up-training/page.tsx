'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dumbbell, 
  Target, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  TrendingUp,
  Activity,
  Calendar,
  LayoutDashboard,
  Clock,
  Info
} from 'lucide-react'

export default function WeightedPullUpTrainingGuide() {
  // Muscle data
  const muscles = [
    { name: 'Latissimus Dorsi', role: 'Primary pulling muscles', icon: '💪' },
    { name: 'Biceps', role: 'Elbow flexion', icon: '🦾' },
    { name: 'Upper Back', role: 'Scapular retraction', icon: '🔙' },
    { name: 'Forearms', role: 'Grip strength', icon: '✊' },
    { name: 'Core', role: 'Body stabilization', icon: '🎯' },
  ]

  // Why weighted pull-ups matter
  const benefits = [
    {
      title: 'Front Lever Strength',
      description: 'Weighted pull-up strength directly correlates with front lever ability. Athletes with +50% BW pull-ups often unlock straddle front lever.',
      icon: Target,
    },
    {
      title: 'Muscle-Up Explosiveness',
      description: 'The pulling power built from weighted pull-ups transfers directly to explosive movements like the muscle-up.',
      icon: Zap,
    },
    {
      title: 'Pull-Up Endurance',
      description: 'Getting stronger at weighted pull-ups makes bodyweight pull-ups feel effortless, dramatically improving endurance.',
      icon: TrendingUp,
    },
    {
      title: 'Upper-Body Pulling Power',
      description: 'Weighted pull-ups build raw pulling strength that transfers to rows, levers, and climbing movements.',
      icon: Activity,
    },
  ]

  // Strength levels
  const strengthLevels = [
    {
      level: 'Beginner',
      weight: 'Bodyweight only',
      reps: '8-12 strict reps',
      description: 'Building foundational pulling strength and proper form.',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      level: 'Intermediate',
      weight: '+10-25% BW',
      reps: '5-8 reps',
      description: 'Ready for basic front lever progressions and muscle-up training.',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      level: 'Advanced',
      weight: '+30-50% BW',
      reps: '5-8 reps',
      description: 'Capable of straddle front lever and clean muscle-ups.',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      level: 'Elite',
      weight: '+70-100% BW',
      reps: '3-5 reps',
      description: 'Full front lever, weighted muscle-ups, and advanced pulling skills.',
      color: 'bg-[#C1121F]/20 text-[#C1121F] border-[#C1121F]/30',
    },
  ]

  // Exercises
  const exercises = [
    {
      name: 'Weighted Pull-Ups',
      description: 'The foundation of pulling strength. Use a dip belt or weight vest to add external load.',
      cues: ['Full ROM: dead hang to chin over bar', 'Control the negative (3-4 seconds)', 'Add weight gradually (2.5-5kg increments)'],
      sets: '4-5 sets x 3-6 reps',
      image: '/guides/weighted-pullups/weighted-pullup.jpg',
    },
    {
      name: 'Chest-to-Bar Pull-Ups',
      description: 'Pull higher than standard pull-ups to build the pulling height needed for muscle-ups.',
      cues: ['Touch chest to bar, not just chin over', 'Slight backward lean at top', 'Explosive concentric, controlled eccentric'],
      sets: '3-4 sets x 6-8 reps',
      image: '/guides/weighted-pullups/chest-to-bar.jpg',
    },
    {
      name: 'Explosive Pull-Ups',
      description: 'Build power and rate of force development for muscle-ups and dynamic movements.',
      cues: ['Pull as fast as possible', 'Release hands briefly at top if possible', 'Reset fully between reps'],
      sets: '4 sets x 5-6 reps',
      image: '/guides/weighted-pullups/explosive-pullups.jpg',
    },
    {
      name: 'Front Lever Rows',
      description: 'Build horizontal pulling strength while maintaining front lever body position.',
      cues: ['Maintain flat body throughout', 'Pull to lower chest/upper abs', 'Use tuck or advanced tuck for easier variation'],
      sets: '3-4 sets x 5-8 reps',
      image: '/guides/weighted-pullups/front-lever-rows.jpg',
    },
    {
      name: 'Archer Pull-Ups',
      description: 'Unilateral pulling strength that develops one-arm pull-up ability and addresses imbalances.',
      cues: ['One arm does most of the work', 'Assist arm stays relatively straight', 'Full ROM on working arm'],
      sets: '3 sets x 4-6 reps each side',
      image: '/guides/weighted-pullups/archer-pullups.jpg',
    },
  ]

  // Common mistakes
  const mistakes = [
    {
      mistake: 'Using Excessive Body Swing',
      explanation: 'Kipping or swinging removes tension from the target muscles and increases injury risk. Use strict form with controlled movement.',
    },
    {
      mistake: 'Partial Range of Motion',
      explanation: 'Not going to full dead hang or stopping before chin clears the bar. Full ROM builds complete strength and prevents imbalances.',
    },
    {
      mistake: 'Poor Scapular Engagement',
      explanation: 'Pulling without initiating from the scapulae. Start each rep by depressing and retracting the shoulder blades.',
    },
    {
      mistake: 'Adding Weight Too Quickly',
      explanation: 'Jumping to heavy loads before building a solid base. Master 10-12 strict bodyweight pull-ups before adding significant weight.',
    },
    {
      mistake: 'Neglecting Grip Training',
      explanation: 'Grip often fails before back muscles fatigue. Train dead hangs and avoid over-reliance on straps for submaximal work.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      {/* Header */}
      <header className="border-b border-[#2B313A] bg-[#0F1115]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/guides" className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E6E9EF] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All Guides
          </Link>
          <Link href="/sign-in?redirect_url=/dashboard">
            <Button size="sm" variant="outline" className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF]">
              Open SpartanLab
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C1121F]/20 to-[#C1121F]/5 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <span className="text-xs font-medium text-[#C1121F] uppercase tracking-wider">Strength Training</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Weighted Pull-Up Strength Guide</h1>
          <p className="text-xl text-[#A4ACB8] leading-relaxed max-w-2xl">
            Learn how to build elite pulling strength using weighted pull-ups and proven calisthenics strength progressions.
          </p>
          <div className="flex items-center gap-4 mt-6 text-sm text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              10 min read
            </span>
            <span>Last updated: March 2026</span>
          </div>
        </div>

        {/* Introduction */}
        <section className="mb-16">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-[#A4ACB8] leading-relaxed mb-4">
              Weighted pull-ups are one of the most powerful strength exercises in calisthenics. They build raw pulling power, improve muscle-up explosiveness, and dramatically accelerate front lever progress.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed mb-4">
              Athletes who develop strong weighted pull-ups often progress faster in advanced calisthenics skills. The correlation between weighted pull-up strength and skill acquisition is well documented—most athletes who achieve full front lever can perform weighted pull-ups with +50% or more of their bodyweight.
            </p>
            <p className="text-[#A4ACB8] leading-relaxed">
              This guide explains how to safely build weighted pull-up strength, understand your current level, and integrate pulling strength work into a balanced calisthenics program.
            </p>
          </div>
        </section>

        {/* Muscles Used */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Muscles Used in Weighted Pull-Ups</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Muscle Diagram */}
            <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
              <div className="aspect-[4/3] relative bg-[#0F1115]">
                <Image
                  src="/guides/weighted-pullups/muscle-diagram.jpg"
                  alt="Weighted Pull-Up Muscle Activation Diagram"
                  fill
                  className="object-cover"
                />
              </div>
            </Card>

            {/* Muscle List */}
            <div className="space-y-3">
              {muscles.map((muscle, index) => (
                <Card key={index} className="bg-[#1A1F26] border-[#2B313A] p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{muscle.icon}</span>
                    <div>
                      <h3 className="font-semibold text-[#E6E9EF]">{muscle.name}</h3>
                      <p className="text-sm text-[#6B7280]">{muscle.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Weighted Pull-Ups Matter */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Why Weighted Pull-Ups Matter for Calisthenics</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{benefit.title}</h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Strength Levels */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Weighted Pull-Up Strength Levels</h2>
          <p className="text-[#A4ACB8] mb-6">
            Understanding where you stand helps you set realistic goals and choose appropriate training progressions.
          </p>
          
          <div className="space-y-4">
            {strengthLevels.map((item, index) => (
              <Card key={index} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-lg border text-sm font-semibold w-fit ${item.color}`}>
                    {item.level}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                      <span className="font-semibold text-[#E6E9EF]">{item.weight}</span>
                      <span className="text-sm text-[#6B7280]">{item.reps}</span>
                    </div>
                    <p className="text-sm text-[#A4ACB8]">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Strength Correlation Note */}
          <Card className="bg-[#C1121F]/5 border-[#C1121F]/20 p-4 mt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[#E6E9EF] text-sm mb-1">Strength Correlations</h4>
                <p className="text-sm text-[#A4ACB8]">
                  Research shows strong correlations between weighted pull-up strength and skill acquisition: +30% BW often unlocks tuck front lever, +50% correlates with straddle, and +70%+ athletes typically achieve full front lever.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Best Exercises */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Best Exercises for Pulling Strength</h2>
          
          <div className="space-y-6">
            {exercises.map((exercise, index) => (
              <Card key={index} className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
                <div className="grid sm:grid-cols-[200px_1fr] gap-0">
                  {/* Exercise Image */}
                  <div className="aspect-[4/3] sm:aspect-auto relative bg-[#0F1115]">
                    <Image
                      src={exercise.image}
                      alt={exercise.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Exercise Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-[#E6E9EF]">{exercise.name}</h3>
                      <span className="text-xs text-[#C1121F] font-medium">{exercise.sets}</span>
                    </div>
                    <p className="text-sm text-[#A4ACB8] mb-4">{exercise.description}</p>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Key Cues</p>
                      {exercise.cues.map((cue, cueIndex) => (
                        <div key={cueIndex} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-[#A4ACB8]">{cue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Common Weighted Pull-Up Mistakes</h2>
          
          <div className="space-y-4">
            {mistakes.map((item, index) => (
              <Card key={index} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-start gap-4">
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
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">How Often to Train Weighted Pull-Ups</h2>
          
          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-[#A4ACB8] leading-relaxed">
              Weighted pull-up training requires adequate recovery due to the high mechanical tension on muscles and connective tissue. Most athletes benefit from 2-3 pulling sessions per week, with at least 48 hours between heavy weighted sessions.
            </p>
          </div>

          <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
            <h3 className="font-semibold text-[#E6E9EF] mb-4">Sample Weekly Structure</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#0F1115] border border-[#2B313A]">
                <p className="text-xs font-semibold text-[#C1121F] uppercase tracking-wider mb-2">Day 1 - Heavy</p>
                <p className="text-sm text-[#A4ACB8]">Weighted Pull-Ups 5x3-5 @ 85-90% max</p>
              </div>
              <div className="p-4 rounded-lg bg-[#0F1115] border border-[#2B313A]">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Day 2 - Volume</p>
                <p className="text-sm text-[#A4ACB8]">Bodyweight variations, rows, and skill work</p>
              </div>
              <div className="p-4 rounded-lg bg-[#0F1115] border border-[#2B313A]">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Day 3 - Power</p>
                <p className="text-sm text-[#A4ACB8]">Explosive pull-ups, moderate weighted work</p>
              </div>
            </div>
          </Card>

          {/* Pro Tip */}
          <Card className="bg-emerald-500/5 border-emerald-500/20 p-4 mt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-[#E6E9EF] text-sm mb-1">Progressive Overload Strategy</h4>
                <p className="text-sm text-[#A4ACB8]">
                  Add weight in small increments (1-2.5kg) when you can complete all prescribed reps with good form. Prioritize consistency over rapid weight increases—sustainable progress prevents injury and builds lasting strength.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Tool CTA */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C1121F]/20 to-[#C1121F]/5 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-8 h-8 text-[#C1121F]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Analyze Your Pull-Up Strength</h2>
                <p className="text-[#A4ACB8] mb-4">
                  Use the SpartanLab Weighted Pull-Up Strength Calculator to determine your current strength level and see how it compares to advanced calisthenics athletes.
                </p>
                <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  <Link href="/tools/weighted-pullup-calculator">
                    Open Weighted Pull-Up Calculator
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Platform Funnel CTA */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-[#C1121F]/15 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/30 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">Generate a Pulling Strength Program</h2>
              <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
                SpartanLab can generate a full calisthenics program based on your strength levels, skill progressions, and training schedule. The Adaptive Training Engine analyzes your performance and automatically adjusts your program as you get stronger.
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
        <section className="mb-16">
          <h2 className="text-xl font-bold mb-4">Related Guides</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/guides/front-lever-training">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <Target className="w-5 h-5 text-[#C1121F] mb-2" />
                <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors text-sm">Front Lever Training Guide</h3>
                <p className="text-xs text-[#6B7280] mt-1">Build front lever strength</p>
              </Card>
            </Link>
            <Link href="/guides/muscle-up-training">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <Zap className="w-5 h-5 text-[#C1121F] mb-2" />
                <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors text-sm">Muscle-Up Training Guide</h3>
                <p className="text-xs text-[#6B7280] mt-1">Master the muscle-up</p>
              </Card>
            </Link>
            <Link href="/guides/calisthenics-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <TrendingUp className="w-5 h-5 text-[#C1121F] mb-2" />
                <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors text-sm">Strength Standards Guide</h3>
                <p className="text-xs text-[#6B7280] mt-1">Calisthenics benchmarks</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* Internal Linking */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Continue Your Training</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/programs">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Program Builder</h3>
                    <p className="text-xs text-[#6B7280]">Generate a training plan</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/strength">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Strength Tracker</h3>
                    <p className="text-xs text-[#6B7280]">Log your strength PRs</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/sign-in?redirect_url=/dashboard">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Dashboard</h3>
                    <p className="text-xs text-[#6B7280]">View training intelligence</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* Back Link */}
        <div className="flex items-center justify-between pt-8 border-t border-[#2B313A]">
          <Link 
            href="/guides" 
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Training Guides
          </Link>
          <Link 
            href="/tools" 
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          >
            Free Calculators
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#2B313A] mt-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#6B7280]">
            <p>Part of the SpartanLab Calisthenics Training Intelligence Platform</p>
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
