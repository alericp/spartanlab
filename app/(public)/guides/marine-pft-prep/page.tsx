import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Shield, Target, Dumbbell, Clock, CheckCircle2, AlertTriangle, Timer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackNav } from '@/components/navigation/BackNav'

export const metadata: Metadata = {
  title: 'Marine Corps PFT Prep Guide | SpartanLab',
  description: 'Complete guide to preparing for the Marine Corps Physical Fitness Test (PFT). Pull-up training, plank endurance, 3-mile run strategies, and scoring standards.',
  keywords: ['Marine Corps PFT', 'PFT training', 'Marine pull-ups', 'PFT prep', 'Marine Corps fitness test', '3 mile run training', 'plank training military'],
  openGraph: {
    title: 'Marine Corps PFT Prep Guide | SpartanLab',
    description: 'Complete preparation guide for the Marine Corps PFT. Pull-ups, plank, and 3-mile run training strategies.',
  },
}

const PFT_EVENTS = [
  {
    name: 'Pull-Ups (or Push-Ups)',
    description: 'Max dead-hang pull-ups or 2-minute push-up alternative',
    minimumMale: '4 pull-ups',
    minimumFemale: '4 pull-ups',
    maxMale: '23 pull-ups (100 pts)',
    maxFemale: '11 pull-ups (100 pts)',
    tips: [
      'Dead hang between each rep - kipping is not allowed',
      'Train volume: ladders, EMOMs, grease the groove',
      'Build strength with weighted pull-ups for capacity gains',
      'Practice test conditions: full hang, chin over bar, controlled descent',
    ],
    commonMistakes: [
      'Not fully extending at the bottom',
      'Kipping or using momentum',
      'Insufficient grip strength',
      'Training to failure too often',
    ],
  },
  {
    name: 'Plank',
    description: 'Hold proper plank position as long as possible',
    minimumMale: '1:10',
    minimumFemale: '1:10',
    maxMale: '4:20 (100 pts)',
    maxFemale: '4:20 (100 pts)',
    tips: [
      'Train beyond test times - aim for 5+ minute capacity',
      'Focus on body position: straight line from head to heels',
      'Practice breathing under tension',
      'Include variation work: shoulder taps, hip dips',
    ],
    commonMistakes: [
      'Hips too high or sagging',
      'Holding breath',
      'Looking up (strains neck)',
      'Neglecting core stability outside plank work',
    ],
  },
  {
    name: '3-Mile Run',
    description: 'Timed 3-mile run on measured course',
    minimumMale: '28:00',
    minimumFemale: '31:00',
    maxMale: '18:00 (100 pts)',
    maxFemale: '21:00 (100 pts)',
    tips: [
      'Build aerobic base with easy runs before speed work',
      'Practice 3-mile specific pace with tempo runs',
      'Include interval work: 800m and mile repeats',
      'Run at least 3x per week for meaningful improvement',
    ],
    commonMistakes: [
      'Going out too fast and dying',
      'Only running 3 miles (need variety)',
      'Skipping easy runs',
      'Neglecting running in favor of calisthenics',
    ],
  },
]

const SAMPLE_WEEK = [
  { day: 'Monday', focus: 'Pull-Up Volume + Core', exercises: 'Pull-up ladders (1-2-3-4-3-2-1), Plank 3x90s, Dead bugs, Hollow holds' },
  { day: 'Tuesday', focus: 'Run Development', exercises: '800m repeats x4 @ goal pace, 90s rest between' },
  { day: 'Wednesday', focus: 'Strength Support', exercises: 'Weighted pull-ups 4x5, Push-ups 3x20, Rows, Core circuit' },
  { day: 'Thursday', focus: 'Easy Run + Mobility', exercises: '30 min easy run, Hip flexor stretches, Shoulder mobility' },
  { day: 'Friday', focus: 'Pull-Up Density + Plank', exercises: 'EMOM 10 min: 3 pull-ups, Plank to max hold x2, Core work' },
  { day: 'Saturday', focus: 'Long Run', exercises: '4-5 miles at easy/moderate pace' },
  { day: 'Sunday', focus: 'Rest', exercises: 'Active recovery, light stretching' },
]

export default function MarinePFTPrepPage() {
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Back Navigation */}
      <nav className="px-4 py-3 border-b border-[#2B313A]/50 sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <BackNav to="guides" />
        </div>
      </nav>

      {/* Header */}
      <div className="px-4 py-16 sm:py-20 border-b border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 mb-6">
            <Shield className="w-4 h-4 text-[#C1121F]" />
            <span className="text-xs font-medium text-[#C1121F]">Marine Corps</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#E6E9EF] mb-6">
            Marine Corps PFT Prep Guide
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-3xl leading-relaxed">
            The Physical Fitness Test (PFT) measures combat fitness through pull-ups, plank, and a 3-mile run. 
            This guide covers everything you need to score your best.
          </p>
        </div>
      </div>

      <div className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Test Overview */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Test Overview</h2>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-3">
                    <Dumbbell className="w-6 h-6 text-[#C1121F]" />
                  </div>
                  <p className="text-2xl font-bold text-[#E6E9EF]">3</p>
                  <p className="text-sm text-[#6B7280]">Events</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-3">
                    <Timer className="w-6 h-6 text-[#C1121F]" />
                  </div>
                  <p className="text-2xl font-bold text-[#E6E9EF]">45-60</p>
                  <p className="text-sm text-[#6B7280]">Minutes Total</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-[#C1121F]" />
                  </div>
                  <p className="text-2xl font-bold text-[#E6E9EF]">300</p>
                  <p className="text-sm text-[#6B7280]">Max Score</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Events Detail */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Event Breakdown</h2>
            <div className="space-y-6">
              {PFT_EVENTS.map((event) => (
                <Card key={event.name} className="bg-[#1A1F26] border-[#2B313A] p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-[#E6E9EF]">{event.name}</h3>
                  </div>
                  <p className="text-[#A4ACB8] mb-4">{event.description}</p>
                  
                  {/* Standards */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-[#0F1115]">
                    <div>
                      <p className="text-xs text-[#6B7280] mb-1">Male Standards</p>
                      <p className="text-sm text-[#E6E9EF]">Min: {event.minimumMale}</p>
                      <p className="text-sm text-[#C1121F]">Max: {event.maxMale}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280] mb-1">Female Standards</p>
                      <p className="text-sm text-[#E6E9EF]">Min: {event.minimumFemale}</p>
                      <p className="text-sm text-[#C1121F]">Max: {event.maxFemale}</p>
                    </div>
                  </div>

                  {/* Training Tips */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-[#E6E9EF] mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                      Training Tips
                    </h4>
                    <ul className="space-y-1.5">
                      {event.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-[#A4ACB8] pl-6 relative before:content-[''] before:absolute before:left-2 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-[#6B7280]">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Mistakes */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#E6E9EF] mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Common Mistakes
                    </h4>
                    <ul className="space-y-1.5">
                      {event.commonMistakes.map((mistake, i) => (
                        <li key={i} className="text-sm text-[#A4ACB8] pl-6 relative before:content-[''] before:absolute before:left-2 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-amber-500/50">
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Sample Training Week */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Sample Training Week</h2>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <p className="text-sm text-[#A4ACB8] mb-6">
                This sample week balances pull-up development, running, and supporting work. 
                Adjust based on your weak points and available time.
              </p>
              <div className="space-y-3">
                {SAMPLE_WEEK.map((day) => (
                  <div 
                    key={day.day} 
                    className={`p-4 rounded-lg ${day.focus === 'Rest' ? 'bg-[#0F1115]/50' : 'bg-[#0F1115]'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 text-sm font-semibold text-[#C1121F]">{day.day}</div>
                      <div>
                        <p className="font-medium text-[#E6E9EF]">{day.focus}</p>
                        <p className="text-sm text-[#6B7280]">{day.exercises}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Programming Phases */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Training Phases</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  phase: 'Foundation (Weeks 1-4)',
                  focus: 'Build base fitness',
                  details: 'Establish running base, build pull-up volume, develop plank endurance. Focus on consistency over intensity.',
                },
                {
                  phase: 'Build (Weeks 5-8)',
                  focus: 'Increase specificity',
                  details: 'Add speed work to runs, increase pull-up density, extend plank holds. Start simulating test conditions.',
                },
                {
                  phase: 'Peak (Weeks 9-11)',
                  focus: 'Test-specific work',
                  details: 'Full test simulations, goal-pace running, max effort practice. High intensity, moderate volume.',
                },
                {
                  phase: 'Taper (Week 12)',
                  focus: 'Rest and recover',
                  details: 'Reduced volume, maintained intensity. Focus on sleep, nutrition, and confidence.',
                },
              ].map((phase) => (
                <Card key={phase.phase} className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <h3 className="font-semibold text-[#E6E9EF] mb-1">{phase.phase}</h3>
                  <p className="text-sm text-[#C1121F] mb-2">{phase.focus}</p>
                  <p className="text-sm text-[#A4ACB8]">{phase.details}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/guides/marine-cft-prep">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-5 hover:border-[#C1121F]/40 transition-colors group">
                  <h3 className="font-semibold text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                    Marine Corps CFT Prep
                  </h3>
                  <p className="text-sm text-[#A4ACB8]">Prepare for the Combat Fitness Test</p>
                </Card>
              </Link>
              <Link href="/guides/military-fitness-prep">
                <Card className="bg-[#1A1F26] border-[#2B313A] p-5 hover:border-[#C1121F]/40 transition-colors group">
                  <h3 className="font-semibold text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                    Military Fitness Overview
                  </h3>
                  <p className="text-sm text-[#A4ACB8]">All branches and general principles</p>
                </Card>
              </Link>
            </div>
          </section>

          {/* CTA */}
          <section>
            <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8 text-center">
              <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">
                Get Your Personalized PFT Program
              </h2>
              <p className="text-[#A4ACB8] mb-6 max-w-xl mx-auto">
                SpartanLab can generate a complete PFT prep program based on your current benchmarks, 
                test date, and goal score.
              </p>
              <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                <Link href="/programs">
                  Build Your PFT Program
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
