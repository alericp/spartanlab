import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Shield, Target, Dumbbell, Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackNav } from '@/components/navigation/BackNav'

export const metadata: Metadata = {
  title: 'Military Fitness Test Prep Guide | SpartanLab',
  description: 'Complete guide to preparing for military fitness tests including Marine Corps PFT/CFT, Army ACFT, Navy PRT, and Air Force PT. Training strategies, programming, and test-specific preparation.',
  keywords: ['military fitness test', 'PFT training', 'ACFT prep', 'military PT test', 'boot camp fitness', 'military physical training', 'Marine Corps PFT', 'Army ACFT guide'],
  openGraph: {
    title: 'Military Fitness Test Prep Guide | SpartanLab',
    description: 'Complete guide to preparing for military fitness tests. All branches, all tests, proven training strategies.',
  },
}

const BRANCH_GUIDES = [
  {
    branch: 'Marine Corps',
    tests: [
      { name: 'PFT (Physical Fitness Test)', slug: 'marine-pft-prep', events: 'Pull-ups, Plank, 3-Mile Run' },
      { name: 'CFT (Combat Fitness Test)', slug: 'marine-cft-prep', events: 'MTC, Ammo Lift, MUF' },
    ],
    color: '#C1121F',
  },
  {
    branch: 'Army',
    tests: [
      { name: 'ACFT (Army Combat Fitness Test)', slug: 'army-acft-prep', events: '6 Events: MDL, SPT, HRP, SDC, LTK, 2MR' },
    ],
    color: '#C1121F',
  },
  {
    branch: 'Navy',
    tests: [
      { name: 'PRT (Physical Readiness Test)', slug: 'navy-prt-prep', events: 'Push-ups, Plank, 1.5-Mile Run' },
    ],
    color: '#C1121F',
  },
  {
    branch: 'Air Force / Space Force',
    tests: [
      { name: 'PT Test', slug: 'air-force-pt-prep', events: 'Push-ups, Sit-ups, 1.5-Mile Run' },
    ],
    color: '#C1121F',
  },
]

const TRAINING_PRINCIPLES = [
  {
    title: 'Test-Specific Training',
    description: 'Train the exact events you will be tested on. Generic fitness programs waste time.',
    icon: Target,
  },
  {
    title: 'Progressive Overload',
    description: 'Systematically increase volume and intensity over time. Small, consistent gains compound.',
    icon: Dumbbell,
  },
  {
    title: 'Periodization',
    description: 'Structure training in phases: foundation, build, peak, and taper before test day.',
    icon: Clock,
  },
  {
    title: 'Weak Point Focus',
    description: 'Identify your limiting events and prioritize them. A chain is only as strong as its weakest link.',
    icon: AlertCircle,
  },
]

const COMMON_EVENTS = [
  {
    event: 'Pull-Ups',
    branches: ['Marine Corps PFT/IST'],
    tips: [
      'Train pull-up specific volume, not just back exercises',
      'Use ladders, EMOMs, and grease-the-groove protocols',
      'Build from negatives if starting from zero',
      'Dead hang between reps to match test standards',
    ],
  },
  {
    event: 'Push-Ups',
    branches: ['Army ACFT', 'Navy PRT', 'Air Force PT'],
    tips: [
      'Practice test-specific form (hand-release for ACFT)',
      'Build volume with pyramid and EMOM training',
      'Train both speed and endurance',
      'Work on pacing for 2-minute tests',
    ],
  },
  {
    event: 'Plank',
    branches: ['Marine Corps PFT', 'Navy PRT'],
    tips: [
      'Train beyond minimum hold times',
      'Include plank variations for trunk stability',
      'Practice breathing under tension',
      'Build tolerance with progressive overload on time',
    ],
  },
  {
    event: 'Running',
    branches: ['All branches'],
    tips: [
      'Mix easy runs with interval training',
      'Practice goal pace with specific distance repeats',
      'Build aerobic base before adding speed work',
      'Run at least 2-3x per week minimum',
    ],
  },
]

export default function MilitaryFitnessPrepPage() {
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
            <span className="text-xs font-medium text-[#C1121F]">Military Prep</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#E6E9EF] mb-6">
            Military Fitness Test Prep
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-3xl leading-relaxed">
            Whether you&apos;re a recruit preparing for boot camp, an active service member maintaining standards, 
            or chasing a max score, this guide covers the training principles and strategies that work.
          </p>
        </div>
      </div>

      <div className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Quick Links to Branch Guides */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Branch-Specific Guides</h2>
            <div className="space-y-4">
              {BRANCH_GUIDES.map((branch) => (
                <Card key={branch.branch} className="bg-[#1A1F26] border-[#2B313A] p-6">
                  <h3 className="text-lg font-semibold text-[#E6E9EF] mb-4">{branch.branch}</h3>
                  <div className="space-y-3">
                    {branch.tests.map((test) => (
                      <Link 
                        key={test.slug} 
                        href={`/guides/${test.slug}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-[#0F1115] hover:bg-[#0F1115]/80 border border-[#2B313A] hover:border-[#C1121F]/40 transition-colors group"
                      >
                        <div>
                          <p className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                            {test.name}
                          </p>
                          <p className="text-sm text-[#6B7280]">{test.events}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#C1121F] transition-colors" />
                      </Link>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Core Training Principles */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Core Training Principles</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {TRAINING_PRINCIPLES.map((principle) => {
                const Icon = principle.icon
                return (
                  <Card key={principle.title} className="bg-[#1A1F26] border-[#2B313A] p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#C1121F]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#E6E9EF] mb-1">{principle.title}</h3>
                        <p className="text-sm text-[#A4ACB8]">{principle.description}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Event-Specific Tips */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Event-Specific Training Tips</h2>
            <div className="space-y-6">
              {COMMON_EVENTS.map((event) => (
                <Card key={event.event} className="bg-[#1A1F26] border-[#2B313A] p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#E6E9EF]">{event.event}</h3>
                    <span className="text-xs text-[#6B7280] bg-[#0F1115] px-2 py-1 rounded">
                      {event.branches.join(', ')}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {event.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                        <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </section>

          {/* Sample Week Structure */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-6">Sample Training Week</h2>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <p className="text-sm text-[#A4ACB8] mb-6">
                A typical military test prep week balances event-specific work with supporting strength 
                and conditioning. Here&apos;s a 4-day template:
              </p>
              <div className="space-y-4">
                {[
                  { day: 'Day 1', focus: 'Upper Body + Core', work: 'Pull-up work, push-up density, plank holds' },
                  { day: 'Day 2', focus: 'Run Development', work: 'Intervals or tempo run, mobility' },
                  { day: 'Day 3', focus: 'Full Body Conditioning', work: 'Circuit training, event simulation' },
                  { day: 'Day 4', focus: 'Run + Recovery', work: 'Easy run, flexibility, active recovery' },
                ].map((day) => (
                  <div key={day.day} className="flex items-start gap-4 p-3 rounded-lg bg-[#0F1115]">
                    <div className="w-16 text-sm font-medium text-[#C1121F]">{day.day}</div>
                    <div>
                      <p className="font-medium text-[#E6E9EF]">{day.focus}</p>
                      <p className="text-sm text-[#6B7280]">{day.work}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Boot Camp Readiness */}
          <section className="mb-16">
            <Card className="bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-[#C1121F]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#E6E9EF] mb-2">New to Military Fitness?</h3>
                  <p className="text-[#A4ACB8] mb-4">
                    If you&apos;re preparing for basic training and don&apos;t know where to start, check out our 
                    Boot Camp Readiness guide. It covers the foundational fitness you need before shipping out.
                  </p>
                  <Button asChild variant="outline" className="border-[#C1121F]/50 text-[#C1121F] hover:bg-[#C1121F]/10">
                    <Link href="/guides/boot-camp-readiness">
                      Read Boot Camp Readiness Guide
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* CTA */}
          <section>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-8 text-center">
              <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">
                Ready to Train?
              </h2>
              <p className="text-[#A4ACB8] mb-6 max-w-xl mx-auto">
                SpartanLab can generate a personalized military test prep program based on your branch, 
                target test, current benchmarks, and test date.
              </p>
              <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
                <Link href="/programs">
                  Build Your Military Prep Program
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
