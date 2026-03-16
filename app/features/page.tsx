'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import {
  Target,
  Dumbbell,
  Calendar,
  ClipboardList,
  Activity,
  TrendingUp,
  Crosshair,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

const FEATURES = [
  {
    id: 'readiness',
    icon: Target,
    title: 'Skill Readiness Analysis',
    description: 'SpartanLab analyzes your readiness for front lever, planche, muscle-up, HSPU, back lever, and L-sit.',
    benefits: [
      'Component-level readiness scoring (pull strength, compression, stability)',
      'Identifies the specific factor limiting your skill progress',
      'Tracks progression from foundation to mastery',
      'Real-time readiness updates as you train'
    ],
    highlight: 'Know exactly what limits your progress.'
  },
  {
    id: 'adaptive',
    icon: TrendingUp,
    title: 'Adaptive Program Generation',
    description: 'Programs that evolve based on your performance, not fixed timelines.',
    benefits: [
      'Programs adjust to readiness, fatigue, and training response',
      'Performance envelope learning personalizes volume and intensity',
      'Equipment-aware exercise selection',
      'Automatic deload detection when needed'
    ],
    highlight: 'Your program evolves as your performance changes.'
  },
  {
    id: 'constraints',
    icon: Crosshair,
    title: 'Constraint Detection Engine',
    description: 'Identifies the specific strength gaps, mobility deficits, or stability needs blocking your progress.',
    benefits: [
      'Analyzes pulling, pushing, compression, and straight-arm strength',
      'Detects mobility and stability limitations',
      'Prioritizes training to solve the real bottleneck',
      'Explains why you are stuck and what to do'
    ],
    highlight: 'Training that solves your actual limiters.'
  },
  {
    id: 'protocols',
    icon: Activity,
    title: 'Joint Integrity Protocols',
    description: 'Durability protocols protect your joints while you train advanced skills.',
    benefits: [
      'Wrist, elbow, shoulder, and scapular preparation',
      'Integrated into warmups and recovery',
      'Adapts based on training load and joint stress',
      'Longevity-focused injury prevention'
    ],
    highlight: 'Protect your joints. Train for decades.'
  },
  {
    id: 'style',
    icon: Calendar,
    title: 'Training Style Personalization',
    description: 'Supports different training approaches while preserving skill development.',
    benefits: [
      'Skill-focused, strength-focused, or balanced approaches',
      'Power/explosive and endurance/density options',
      'Hypertrophy-supported calisthenics available',
      'Style layered on top of prerequisite logic'
    ],
    highlight: 'Train your way. Same intelligent coaching.'
  },
  {
    id: 'workouts',
    icon: ClipboardList,
    title: 'Intelligent Workout Logging',
    description: 'Every logged workout feeds back into the coaching engine.',
    benefits: [
      'Performance data improves future programming',
      'Fatigue signals trigger adaptive adjustments',
      'Skill progress tracked automatically',
      'Complete training history preserved'
    ],
    highlight: 'The system learns from your real training.'
  },
  {
    id: 'score',
    icon: Dumbbell,
    title: 'Spartan Strength Score',
    description: 'Your unified performance metric combining skill progress, strength, and consistency.',
    benefits: [
      'Score from 0-1000 reflecting total calisthenics performance',
      'Combines skills, weighted strength, and training momentum',
      'Progress through Novice to Elite tiers',
      'Compare with community benchmarks'
    ],
    highlight: 'One number. Total performance clarity.'
  }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Adaptive Athlete Engine
          </h1>
          <p className="text-lg sm:text-xl text-[#A5A5A5] max-w-2xl mx-auto">
            AI coaching intelligence that analyzes, adapts, and protects. Built specifically for advanced calisthenics skill development.
          </p>
        </div>
      </section>

      {/* Features List */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="space-y-16 sm:space-y-24">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.id}
                className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#E63946]/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-[#E63946]" />
                    </div>
                    <span className="text-sm text-[#A5A5A5] font-medium uppercase tracking-wider">
                      Feature
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">{feature.title}</h2>
                  <p className="text-[#A5A5A5] mb-6 text-lg">{feature.description}</p>

                  <ul className="space-y-3 mb-6">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#E63946] mt-0.5 shrink-0" />
                        <span className="text-[#F5F5F5]">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 sm:p-10">
                    <div className="w-16 h-16 rounded-xl bg-[#E63946]/10 flex items-center justify-center mb-6 mx-auto">
                      <feature.icon className="w-8 h-8 text-[#E63946]" />
                    </div>
                    <p className="text-center text-xl font-semibold text-[#F5F5F5]">
                      {feature.highlight}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-[#1A1A1A] border-t border-[#2A2A2A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Start Training?
          </h2>
          <p className="text-[#A5A5A5] max-w-xl mx-auto mb-8">
            All features included. Start tracking your calisthenics progress today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-[#E63946] hover:bg-[#D62828] px-8 h-12">
                Start Training
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] px-8 h-12">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
