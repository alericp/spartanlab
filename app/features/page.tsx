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
    id: 'skills',
    icon: Target,
    title: 'Skill Progression Tracking',
    description: 'Track your progress across the most demanding calisthenics skills with visual progression maps.',
    benefits: [
      'Track planche, front lever, muscle-up, and handstand push-up',
      'Visual progression from foundation to mastery',
      'Log practice sessions and hold times',
      'See your progression history over time'
    ],
    highlight: 'From tuck to full - every step is tracked.'
  },
  {
    id: 'strength',
    icon: Dumbbell,
    title: 'Weighted Strength Tracking',
    description: 'Monitor your weighted calisthenics performance with automatic 1RM calculations.',
    benefits: [
      'Track weighted pull-ups, dips, and muscle-ups',
      'Automatic 1RM estimation using proven formulas',
      'Log sets, reps, and weights for each session',
      'View strength progression charts over time'
    ],
    highlight: 'Know exactly how strong you are.'
  },
  {
    id: 'programs',
    icon: Calendar,
    title: 'Program Builder',
    description: 'Create structured training programs tailored to your goals, level, and schedule.',
    benefits: [
      'Generate programs based on your target skill',
      'Customize training days per week',
      'Balance skill work and strength training',
      'Track program completion and adherence'
    ],
    highlight: 'Train with structure, not randomness.'
  },
  {
    id: 'workouts',
    icon: ClipboardList,
    title: 'Workout Logging',
    description: 'Record every training session with detailed exercise logging and notes.',
    benefits: [
      'Quick session logging with exercise templates',
      'Track sets, reps, load, and hold times',
      'Add notes and session ratings',
      'Build your complete training history'
    ],
    highlight: 'Every rep counts. Every session matters.'
  },
  {
    id: 'recovery',
    icon: Activity,
    title: 'Volume & Recovery Analyzer',
    description: 'Understand your training load and get recovery insights based on your workout patterns.',
    benefits: [
      'Analyze weekly training volume by category',
      'Monitor push/pull balance ratio',
      'Get recovery readiness signals',
      'Receive training balance insights'
    ],
    highlight: 'Train hard. Recover smarter.'
  },
  {
    id: 'score',
    icon: TrendingUp,
    title: 'Spartan Strength Score',
    description: 'Your unified performance metric combining skill progress, weighted strength, and consistency.',
    benefits: [
      'Single score from 0-100 reflecting total performance',
      'Weighted formula: 40% skills + 40% strength + 20% consistency',
      'Progress from Novice to Elite tier',
      'Score updates automatically as you train'
    ],
    highlight: 'One number. Total performance clarity.'
  },
  {
    id: 'goals',
    icon: Crosshair,
    title: 'Goal Projection Engine',
    description: 'Get estimated timelines for reaching your next skill and strength milestones.',
    benefits: [
      'Projections for all tracked skills and lifts',
      'Estimates adjusted by your consistency score',
      'Time ranges instead of false precision dates',
      'Know what is achievable and when'
    ],
    highlight: 'See how far you can go.'
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
            Platform Features
          </h1>
          <p className="text-lg sm:text-xl text-[#A5A5A5] max-w-2xl mx-auto">
            Every tool you need to track, analyze, and optimize your calisthenics training. Built by athletes, for athletes.
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
