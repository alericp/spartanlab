import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import {
  Brain,
  Activity,
  Gauge,
  TrendingUp,
  Settings2,
  Dumbbell,
  Timer,
  ArrowRight,
  Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How SpartanLab Works - Adaptive Calisthenics Training Engine',
  description: 'Discover how SpartanLab\'s adaptive training engine analyzes your performance to generate optimal calisthenics workouts. Track planche, front lever, and muscle-up progression with intelligent fatigue monitoring.',
  keywords: [
    'calisthenics training program',
    'calisthenics skill progression',
    'calisthenics training intelligence',
    'planche training',
    'front lever training',
    'calisthenics progression tracking',
    'calisthenics recovery monitoring',
    'adaptive workout program',
  ],
  openGraph: {
    title: 'How SpartanLab Works - Adaptive Calisthenics Training',
    description: 'SpartanLab analyzes your strength, skills, and effort to generate workouts that evolve with your training.',
    type: 'website',
  },
}

const INTELLIGENT_FEATURES = [
  {
    id: 'adaptive-engine',
    icon: Brain,
    title: 'Adaptive Training Engine',
    hook: 'Workouts that evolve as you train.',
    explanation: 'SpartanLab analyzes your strength levels, skill progress, effort ratings, and training consistency to generate workouts tailored to your current performance. Instead of following rigid programs, your training adjusts based on how your body responds each session.',
    benefit: 'Every workout pushes progress without unnecessary fatigue.',
    accent: 'bg-[#C1121F]/10 text-[#C1121F]',
  },
  {
    id: 'fatigue-intelligence',
    icon: Activity,
    title: 'AI Fatigue Intelligence',
    hook: 'Detect fatigue before it stalls your progress.',
    explanation: 'SpartanLab continuously analyzes workout effort, performance trends, and training load to identify fatigue patterns across your sessions. If the system detects accumulating strain, it can recommend adjustments to rest, volume, or session structure.',
    benefit: 'Train consistently without burning out.',
    accent: 'bg-amber-500/10 text-amber-400',
  },
  {
    id: 'rpe-workouts',
    icon: Gauge,
    title: 'RPE Smart Workouts',
    hook: 'Your workouts respond to real effort.',
    explanation: 'Every set includes a target RPE (effort level). After completing a set, you record the actual difficulty and SpartanLab adjusts rest times, rep targets, or load guidance accordingly.',
    benefit: 'The system responds to real performance instead of fixed assumptions.',
    accent: 'bg-blue-500/10 text-blue-400',
  },
  {
    id: 'skill-tracking',
    icon: TrendingUp,
    title: 'Skill Progress Tracking',
    hook: 'Track real progress toward calisthenics skills.',
    explanation: 'SpartanLab tracks hold times, strength progressions, and exercise performance to monitor advancement toward skills like front lever, planche, and muscle-up.',
    benefit: 'Always know exactly how close you are to your next progression.',
    accent: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'constraint-engine',
    icon: Settings2,
    title: 'Constraint Engine',
    hook: 'Your training adapts to real life.',
    explanation: 'SpartanLab automatically adjusts workouts when schedule changes, missed sessions, or limited training time occur. Instead of skipping workouts, the system generates the most effective training possible with the time you have available.',
    benefit: 'Your progress continues even when life gets busy.',
    accent: 'bg-purple-500/10 text-purple-400',
  },
  {
    id: 'equipment-aware',
    icon: Dumbbell,
    title: 'Equipment-Aware Programming',
    hook: 'Programs that match the equipment you actually have.',
    explanation: 'During onboarding, SpartanLab learns what equipment you have available. Programs are automatically generated using exercises that fit your setup while still targeting optimal strength development.',
    benefit: 'Train effectively whether you have a full gym or minimal equipment.',
    accent: 'bg-cyan-500/10 text-cyan-400',
  },
  {
    id: 'adaptive-deload',
    icon: Timer,
    title: 'Adaptive Deload Detection',
    hook: 'Deload only when your body actually needs it.',
    explanation: 'SpartanLab monitors performance trends and fatigue signals to determine when recovery becomes necessary. Instead of fixed deload schedules, adjustments are triggered based on real training data.',
    benefit: 'Improve long-term strength progress and prevent unnecessary downtime.',
    accent: 'bg-orange-500/10 text-orange-400',
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: typeof INTELLIGENT_FEATURES[0]
  index: number
}) {
  const Icon = feature.icon
  const isEven = index % 2 === 0

  return (
    <article className="group">
      <div className={`grid lg:grid-cols-12 gap-6 lg:gap-10 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
        {/* Content Side */}
        <div className={`lg:col-span-7 ${!isEven ? 'lg:order-2' : ''}`}>
          {/* Icon and Label */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg ${feature.accent} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#6B7280] uppercase tracking-wider font-medium">
              Intelligence
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-2">
            {feature.title}
          </h2>

          {/* Hook */}
          <p className="text-lg text-[#C1121F] font-medium mb-4">
            {feature.hook}
          </p>

          {/* Explanation */}
          <p className="text-[#A4ACB8] leading-relaxed mb-5">
            {feature.explanation}
          </p>

          {/* Benefit */}
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-[#C1121F] mt-1 flex-shrink-0" />
            <p className="text-[#E6E9EF] font-medium">
              {feature.benefit}
            </p>
          </div>
        </div>

        {/* Visual Side */}
        <div className={`lg:col-span-5 ${!isEven ? 'lg:order-1' : ''}`}>
          <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-8 sm:p-10 transition-all duration-300 group-hover:border-[#C1121F]/30">
            <div className={`w-16 h-16 rounded-xl ${feature.accent} flex items-center justify-center mb-6 mx-auto`}>
              <Icon className="w-8 h-8" />
            </div>
            <p className="text-center text-lg font-semibold text-[#E6E9EF] text-balance">
              {feature.hook}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C1121F]/10 text-[#C1121F] text-sm font-medium mb-6">
            <Brain className="w-4 h-4" />
            Adaptive Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
            Training That Thinks <span className="text-[#C1121F]">With You</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#A4ACB8] max-w-2xl mx-auto leading-relaxed">
            SpartanLab is a training intelligence system. It analyzes your strength levels, skill readiness, and training performance to generate optimal programming and real-time adjustments.
          </p>
        </div>
      </section>

      {/* Core Promise */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-[#C1121F]/5 to-[#1A1F26] border border-[#C1121F]/20 rounded-2xl p-8 sm:p-10 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-4">
              Stop guessing your training.
            </p>
            <p className="text-[#A4ACB8] max-w-xl mx-auto">
              Every feature below works together to ensure your calisthenics program adapts to your body, your schedule, and your goals.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="space-y-20 sm:space-y-28">
            {INTELLIGENT_FEATURES.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="py-16 sm:py-20 border-t border-[#2B313A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              The Complete Training System
            </h2>
            <p className="text-[#A4ACB8] max-w-xl mx-auto">
              Every component works together to make your calisthenics training intelligent, responsive, and effective.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Adapts to your strength', icon: Dumbbell },
              { label: 'Responds to your effort', icon: Gauge },
              { label: 'Monitors your fatigue', icon: Activity },
              { label: 'Fits your schedule', icon: Settings2 },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#1A1F26] border border-[#2B313A] rounded-lg p-5 text-center"
              >
                <item.icon className="w-6 h-6 text-[#C1121F] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#E6E9EF]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-[#1A1F26] border-t border-[#2B313A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Train Smarter?
          </h2>
          <p className="text-[#A4ACB8] max-w-xl mx-auto mb-8">
            Experience adaptive calisthenics training that evolves with every workout. Start your progression today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] px-8 h-12 w-full sm:w-auto">
                Start Training
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-[#2B313A] hover:bg-[#2B313A] px-8 h-12 w-full sm:w-auto">
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
