import { Metadata } from 'next'
import Link from 'next/link'
import { 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Brain, 
  Shield, 
  Layers, 
  Activity,
  Dumbbell,
  ChevronRight,
  Zap,
  Users,
  CheckCircle2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'SpartanLab Training Philosophy | Intelligent Calisthenics Programming',
  description: 'Learn how SpartanLab builds intelligent calisthenics programs using structured training principles, skill progressions, and athlete modeling. Discover the science behind effective bodyweight training.',
  keywords: [
    'calisthenics training principles',
    'calisthenics program structure',
    'how to train calisthenics correctly',
    'calisthenics progression principles',
    'bodyweight training philosophy',
    'skill-based calisthenics training',
    'intelligent workout programming',
    'calisthenics periodization',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/training-philosophy`,
  },
  openGraph: {
    title: 'SpartanLab Training Philosophy | Intelligent Calisthenics Programming',
    description: 'Learn how SpartanLab builds intelligent calisthenics programs using structured training principles, skill progressions, and athlete modeling.',
    url: `${SITE_CONFIG.url}/training-philosophy`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanLab Training Philosophy',
    description: 'Discover the principles behind intelligent calisthenics programming.',
  },
}

// Core principles data
const CORE_PRINCIPLES = [
  {
    icon: Target,
    title: 'Skill-First Training',
    description: 'Every program centers around specific skill goals. Exercises are selected based on their direct transfer to skill acquisition.',
  },
  {
    icon: Layers,
    title: 'Progressive Overload',
    description: 'Systematic increases in difficulty through leverage changes, added load, or volume manipulation to drive consistent adaptation.',
  },
  {
    icon: Shield,
    title: 'Joint Preparation',
    description: 'Tendons and connective tissue adapt slower than muscles. Training must account for tissue tolerance to prevent injury.',
  },
  {
    icon: Brain,
    title: 'Adaptive Programming',
    description: 'Programs adjust based on performance data, recovery indicators, and individual response patterns.',
  },
]

// Skills overview
const SKILLS = [
  { name: 'Planche', href: '/planche-readiness-calculator', difficulty: 'Advanced' },
  { name: 'Front Lever', href: '/front-lever-readiness-calculator', difficulty: 'Intermediate' },
  { name: 'Muscle-Up', href: '/muscle-up-readiness-calculator', difficulty: 'Intermediate' },
  { name: 'Handstand Push-Up', href: '/guides/hspu-progression', difficulty: 'Intermediate' },
  { name: 'Iron Cross', href: '/iron-cross-readiness-calculator', difficulty: 'Elite' },
  { name: 'Back Lever', href: '/guides/back-lever-progression', difficulty: 'Intermediate' },
]

// Related tools for internal linking
const RELATED_TOOLS = [
  {
    title: 'Strength Standards Calculator',
    description: 'Test your pulling, pushing, and core strength levels',
    href: '/calisthenics-strength-standards',
    icon: Dumbbell,
  },
  {
    title: 'Front Lever Calculator',
    description: 'Check your front lever readiness and limiting factors',
    href: '/front-lever-readiness-calculator',
    icon: Target,
  },
  {
    title: 'Planche Calculator',
    description: 'Assess your planche readiness and get recommendations',
    href: '/planche-readiness-calculator',
    icon: Target,
  },
  {
    title: 'Muscle-Up Calculator',
    description: 'See if you have the strength for muscle-up training',
    href: '/muscle-up-readiness-calculator',
    icon: Zap,
  },
]

export default function TrainingPhilosophyPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#C1121F] font-medium mb-4 tracking-wide uppercase text-sm">
            Training Philosophy
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-balance">
            Intelligent Calisthenics Programming
          </h1>
          <p className="text-xl text-[#A4ACB8] max-w-2xl mx-auto leading-relaxed">
            SpartanLab is built on structured training principles used by experienced 
            athletes and coaches across the calisthenics community.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-[#A4ACB8] leading-relaxed">
              Calisthenics skill development is not random. Behind every impressive 
              planche, front lever, or muscle-up lies months of structured preparation. 
              The athletes who achieve these skills follow clear principles—whether they 
              know it explicitly or not.
            </p>
            <p className="text-lg text-[#A4ACB8] leading-relaxed mt-4">
              SpartanLab codifies these principles into an intelligent system that 
              analyzes your current abilities and generates training programs designed 
              to build the specific strength, control, and tissue tolerance required 
              for your goals.
            </p>
          </div>
        </div>
      </section>

      {/* Why Most Programs Fail */}
      <section className="py-20 bg-[#1A1F26] border-y border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Why Most Calisthenics Programs Fail</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-3">Generic Programming</h3>
              <p className="text-[#A4ACB8]">
                Cookie-cutter programs ignore individual differences in strength, 
                mobility, and recovery capacity. What works for one athlete may be 
                too easy or too difficult for another.
              </p>
            </Card>
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-3">Missing Prerequisites</h3>
              <p className="text-[#A4ACB8]">
                Athletes often attempt skills before building the necessary foundation. 
                Without adequate pulling strength, front lever training becomes wasted effort.
              </p>
            </Card>
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-3">Imbalanced Development</h3>
              <p className="text-[#A4ACB8]">
                Training only what you enjoy creates strength imbalances. Push-dominant 
                athletes struggle with pulling skills. Pull-dominant athletes plateau on planche.
              </p>
            </Card>
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-3">Ignoring Tissue Adaptation</h3>
              <p className="text-[#A4ACB8]">
                Muscles adapt faster than tendons and connective tissue. Aggressive 
                progression leads to chronic overuse injuries that derail training for months.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">The SpartanLab Approach</h2>
          <p className="text-[#A4ACB8] mb-10 max-w-2xl">
            Four core principles guide every program SpartanLab generates.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {CORE_PRINCIPLES.map((principle) => (
              <div key={principle.title} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#C1121F]/10 rounded-lg flex items-center justify-center">
                  <principle.icon className="w-6 h-6 text-[#C1121F]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2">{principle.title}</h3>
                  <p className="text-[#A4ACB8] text-sm leading-relaxed">{principle.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill-Based Training */}
      <section className="py-20 bg-[#1A1F26] border-y border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-[#C1121F]/10 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Skill-Based Training</h2>
              <p className="text-[#A4ACB8] mt-2">
                Calisthenics revolves around mastering specific skills that require 
                unique combinations of strength, mobility, and body control.
              </p>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-semibold text-[#E6E9EF] mb-4">Target Skills</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SKILLS.map((skill) => (
                <Link key={skill.name} href={skill.href}>
                  <Card className="bg-[#0F1115] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                    <div className="text-[#E6E9EF] font-medium">{skill.name}</div>
                    <div className="text-xs text-[#6B7280] mt-1">{skill.difficulty}</div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-[#A4ACB8]">
            <p>
              Each skill has distinct requirements. A planche demands exceptional 
              straight-arm pushing strength and shoulder protraction. A front lever 
              requires pulling strength, scapular depression, and core tension. 
              A muscle-up needs explosive power and transition strength.
            </p>
            <p>
              SpartanLab identifies which skill-specific capacities you already possess 
              and which need development, then builds programs that systematically address 
              the gaps.
            </p>
          </div>
        </div>
      </section>

      {/* Progression Systems */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-[#C1121F]/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Progressive Skill Development</h2>
              <p className="text-[#A4ACB8] mt-2">
                Skills are not achieved overnight. They require methodical progression 
                through increasingly difficult variations.
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 mb-10">
            <div>
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-4">Progression Principles</h3>
              <ul className="space-y-3">
                {[
                  'Build prerequisite strength before skill-specific training',
                  'Use progressive overload through leverage changes',
                  'Master each progression before advancing',
                  'Balance straight-arm and bent-arm development',
                  'Allow adequate tendon adaptation time',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[#A4ACB8]">
                    <CheckCircle2 className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-4">Example: Front Lever Ladder</h3>
              <div className="space-y-2">
                {[
                  { name: 'Tuck Front Lever', level: '1' },
                  { name: 'Advanced Tuck', level: '2' },
                  { name: 'One-Leg Front Lever', level: '3' },
                  { name: 'Straddle Front Lever', level: '4' },
                  { name: 'Full Front Lever', level: '5' },
                ].map((step) => (
                  <div key={step.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-[#C1121F]/10 rounded text-[#C1121F] text-sm font-medium flex items-center justify-center">
                      {step.level}
                    </span>
                    <span className="text-[#A4ACB8]">{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
            <h3 className="text-lg font-semibold text-[#E6E9EF] mb-3">Straight-Arm vs Bent-Arm Strength</h3>
            <p className="text-[#A4ACB8] text-sm leading-relaxed">
              Calisthenics requires both bent-arm strength (pull-ups, dips, push-ups) 
              and straight-arm strength (planche leans, front lever holds, iron cross). 
              Straight-arm movements place significantly more stress on connective tissue 
              and require dedicated training. SpartanLab programs both movement types 
              with appropriate volume and intensity ratios.
            </p>
          </Card>
        </div>
      </section>

      {/* Injury Prevention */}
      <section className="py-20 bg-[#1A1F26] border-y border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-[#C1121F]/10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Injury Prevention and Tendon Adaptation</h2>
              <p className="text-[#A4ACB8] mt-2">
                Sustainable progress requires respecting tissue adaptation timelines.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-10">
            <Card className="bg-[#0F1115] border-[#2B313A] p-5">
              <h3 className="text-base font-semibold text-[#E6E9EF] mb-2">Joint Preparation</h3>
              <p className="text-[#A4ACB8] text-sm">
                Wrists, elbows, and shoulders must be progressively conditioned for 
                the demands of advanced calisthenics before loading them heavily.
              </p>
            </Card>
            <Card className="bg-[#0F1115] border-[#2B313A] p-5">
              <h3 className="text-base font-semibold text-[#E6E9EF] mb-2">Tendon Tolerance</h3>
              <p className="text-[#A4ACB8] text-sm">
                Tendons adapt 3-5x slower than muscle tissue. Training volume must 
                account for this to prevent overuse injuries.
              </p>
            </Card>
            <Card className="bg-[#0F1115] border-[#2B313A] p-5">
              <h3 className="text-base font-semibold text-[#E6E9EF] mb-2">Balanced Development</h3>
              <p className="text-[#A4ACB8] text-sm">
                Strength imbalances between opposing muscle groups create joint stress. 
                Programming must maintain proportional development.
              </p>
            </Card>
          </div>

          <p className="text-[#A4ACB8]">
            SpartanLab tracks your progression pace and adjusts intensity to maintain 
            a sustainable training load. The system identifies when athletes are 
            advancing too quickly and recommends appropriate deload periods.
          </p>
        </div>
      </section>

      {/* Adaptive Programming */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-[#C1121F]/10 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Adaptive Programming</h2>
              <p className="text-[#A4ACB8] mt-2">
                SpartanLab analyzes multiple factors to generate personalized training programs.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {[
              { label: 'Current Strength Levels', description: 'Pull, push, and core capacity' },
              { label: 'Movement Balance', description: 'Pull vs push dominance' },
              { label: 'Skill Readiness', description: 'Prerequisite completion' },
              { label: 'Training History', description: 'Volume tolerance' },
              { label: 'Available Equipment', description: 'Rings, bars, weights' },
              { label: 'Time Constraints', description: 'Sessions per week' },
            ].map((factor) => (
              <div key={factor.label} className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[#E6E9EF] font-medium text-sm">{factor.label}</div>
                  <div className="text-[#6B7280] text-xs">{factor.description}</div>
                </div>
              </div>
            ))}
          </div>

          <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
            <p className="text-[#A4ACB8] leading-relaxed">
              Rather than providing a static workout template, SpartanLab continuously 
              evaluates your logged performance to identify what is working and what 
              needs adjustment. When progress stalls, the system modifies exercise 
              selection, volume, or intensity to restart adaptation.
            </p>
          </Card>
        </div>
      </section>

      {/* Credibility Statement */}
      <section className="py-12 bg-[#1A1F26] border-y border-[#2B313A]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Users className="w-8 h-8 text-[#C1121F] mx-auto mb-4" />
          <p className="text-[#A4ACB8] italic">
            SpartanLab is built from widely recognized calisthenics training principles 
            used by experienced athletes and coaches across the sport. The system 
            codifies these principles into structured, repeatable programming logic.
          </p>
        </div>
      </section>

      {/* Related Tools */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold mb-2">Test Your Current Level</h2>
          <p className="text-[#A4ACB8] mb-8">
            Use these free tools to assess your strength and skill readiness.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {RELATED_TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card className="bg-[#1A1F26] border-[#2B313A] p-5 hover:border-[#C1121F]/50 transition-colors h-full">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#C1121F]/10 rounded-lg flex items-center justify-center">
                      <tool.icon className="w-5 h-5 text-[#C1121F]" />
                    </div>
                    <div>
                      <h3 className="text-[#E6E9EF] font-medium">{tool.title}</h3>
                      <p className="text-[#6B7280] text-sm mt-1">{tool.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Conversion CTA */}
      <section className="py-20 bg-gradient-to-b from-[#0F1115] to-[#1A1F26]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Build Your SpartanLab Training Plan
          </h2>
          <p className="text-[#A4ACB8] text-lg mb-8 max-w-xl mx-auto">
            Let SpartanLab analyze your strength, identify your limiting factors, 
            and generate a structured training program for your skill goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A50E1A] text-white px-8">
                Start My Program
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26] hover:text-[#E6E9EF]">
                Learn More About SpartanLab
              </Button>
            </Link>
          </div>
          <p className="text-xs text-[#6B7280] mt-4">
            Free to start. No credit card required.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
