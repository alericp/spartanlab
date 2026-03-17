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
    id: 'skill-readiness',
    icon: TrendingUp,
    title: 'Skill Readiness Analysis',
    hook: 'Know exactly what limits your skill progress.',
    explanation: 'SpartanLab analyzes component-level readiness for front lever, planche, muscle-up, handstand push-up, back lever, and L-sit. The engine breaks down pull strength, compression, scapular control, straight-arm strength, mobility, and shoulder stability to identify your specific limiting factors.',
    benefit: 'Training targets the real bottleneck, not generic strength work.',
    accent: 'bg-[#C1121F]/10 text-[#C1121F]',
  },
  {
    id: 'constraint-detection',
    icon: Brain,
    title: 'Constraint Detection Engine',
    hook: 'Identify what is actually blocking progress.',
    explanation: 'The engine analyzes your strength ratios, mobility tests, and skill performance to detect constraints. Whether it is pulling strength, compression, shoulder stability, or wrist tolerance, SpartanLab identifies the specific factor and prioritizes training to solve it.',
    benefit: 'Stop spinning wheels on generic programs.',
    accent: 'bg-amber-500/10 text-amber-400',
  },
  {
    id: 'adaptive-engine',
    icon: Activity,
    title: 'Adaptive Program Generation',
    hook: 'Programs that evolve as your performance changes.',
    explanation: 'SpartanLab generates programs based on readiness, constraints, training style, and equipment. As you train and log workouts, the Performance Envelope Engine learns your optimal rep ranges, volume tolerance, and fatigue thresholds to personalize future sessions.',
    benefit: 'Every workout is calibrated to your actual response patterns.',
    accent: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'joint-protocols',
    icon: Settings2,
    title: 'Joint Integrity Protocols',
    hook: 'Durability work integrated into every session.',
    explanation: 'Advanced calisthenics skills place significant stress on wrists, elbows, shoulders, and scapulae. SpartanLab integrates joint preparation and recovery protocols based on your training load, skill focus, and any cautions you have indicated.',
    benefit: 'Protect your joints while training advanced skills.',
    accent: 'bg-purple-500/10 text-purple-400',
  },
  {
    id: 'training-style',
    icon: Gauge,
    title: 'Training Style Personalization',
    hook: 'Different approaches, same intelligent coaching.',
    explanation: 'SpartanLab supports skill-focused, strength-focused, power, endurance, and hypertrophy-supported training styles. The engine adjusts methods, rep ranges, and density while preserving prerequisite logic and skill development priorities.',
    benefit: 'Train your way without compromising progress.',
    accent: 'bg-blue-500/10 text-blue-400',
  },
  {
    id: 'equipment-aware',
    icon: Dumbbell,
    title: 'Equipment-Aware Programming',
    hook: 'Programs that match your actual setup.',
    explanation: 'During onboarding, SpartanLab learns your available equipment. Exercise selection automatically adapts while preserving movement intent and skill carryover. Minimal hypertrophy support uses only approved high-ROI exercises that match your equipment.',
    benefit: 'Train effectively with any equipment configuration.',
    accent: 'bg-cyan-500/10 text-cyan-400',
  },
  {
    id: 'adaptive-deload',
    icon: Timer,
    title: 'Fatigue Detection and Deload',
    hook: 'Recovery triggered by real signals, not fixed schedules.',
    explanation: 'SpartanLab monitors performance trends, effort ratings, and completion patterns to detect accumulating fatigue. When the system identifies strain, it triggers adaptive volume adjustments or recovery-focused sessions before burnout occurs.',
    benefit: 'Train consistently without overreaching.',
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
            Training Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
            How <span className="text-[#C1121F]">SpartanLab</span> Works
          </h1>
          <p className="text-lg sm:text-xl text-[#A4ACB8] max-w-2xl mx-auto leading-relaxed">
            A calisthenics-first training intelligence system. Analyzes your performance and builds adaptive programs using real strength methodologies.
          </p>
        </div>
      </section>

      {/* Core Promise */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-[#C1121F]/5 to-[#1A1F26] border border-[#C1121F]/20 rounded-2xl p-8 sm:p-10 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-4">
              Built from real training methodologies.
            </p>
            <p className="text-[#A4ACB8] max-w-xl mx-auto">
              Calisthenics-first with support for weighted movements and hybrid strength. Designed for long-term performance.
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
              { label: 'Analyzes skill readiness', icon: TrendingUp },
              { label: 'Detects training constraints', icon: Brain },
              { label: 'Protects your joints', icon: Settings2 },
              { label: 'Adapts to performance', icon: Activity },
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
            Ready to Train Intelligently?
          </h2>
          <p className="text-[#A4ACB8] max-w-xl mx-auto mb-8">
            Get structured programming that evolves with your performance. Built from real training methodologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] px-8 h-12 w-full sm:w-auto">
                Analyze My Training
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
