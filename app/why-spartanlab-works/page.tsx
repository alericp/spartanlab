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
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  BarChart3,
  Settings,
  Calendar,
  User
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Why SpartanLab Works | Intelligent Calisthenics Training',
  description: 'Learn why SpartanLab creates smarter calisthenics programs using structured skill progressions, athlete modeling, and adaptive training logic.',
  keywords: [
    'best calisthenics training method',
    'structured calisthenics programs',
    'how to train calisthenics properly',
    'calisthenics program design',
    'intelligent workout programming',
    'adaptive calisthenics training',
    'skill-based bodyweight training',
    'calisthenics progression system',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/why-spartanlab-works`,
  },
  openGraph: {
    title: 'Why SpartanLab Works | Intelligent Calisthenics Training',
    description: 'Learn why SpartanLab creates smarter calisthenics programs using structured skill progressions, athlete modeling, and adaptive training logic.',
    url: `${SITE_CONFIG.url}/why-spartanlab-works`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Why SpartanLab Works',
    description: 'Discover how intelligent calisthenics programming produces better results.',
  },
}

// Common problems with typical programs
const COMMON_PROBLEMS = [
  {
    icon: XCircle,
    problem: 'Random Exercise Selection',
    description: 'Workouts thrown together without considering skill prerequisites or training goals.',
  },
  {
    icon: XCircle,
    problem: 'No Progression Structure',
    description: 'Same exercises repeated endlessly without systematic advancement.',
  },
  {
    icon: XCircle,
    problem: 'Ignoring Prerequisites',
    description: 'Attempting advanced skills without building necessary strength foundations.',
  },
  {
    icon: XCircle,
    problem: 'Push/Pull Imbalance',
    description: 'Overemphasizing pushing movements while neglecting pulling, leading to injury risk.',
  },
  {
    icon: XCircle,
    problem: 'No Long-Term Planning',
    description: 'Training week-to-week without structured periodization or progression phases.',
  },
]

// SpartanLab advantages
const SPARTANLAB_ADVANTAGES = [
  {
    icon: Target,
    title: 'Skill-Centered Programming',
    description: 'Every workout is designed around specific skill goals with exercises that directly transfer to skill acquisition.',
  },
  {
    icon: Layers,
    title: 'Structured Progressions',
    description: 'Clear progression ladders that systematically advance difficulty through leverage, load, and volume.',
  },
  {
    icon: BarChart3,
    title: 'Strength Analysis',
    description: 'Your pulling, pushing, and core strength are assessed to identify weak points and training priorities.',
  },
  {
    icon: Brain,
    title: 'Adaptive Programming',
    description: 'Programs adjust based on your progress, recovery, and individual response patterns.',
  },
  {
    icon: Shield,
    title: 'Injury Prevention',
    description: 'Joint preparation and tendon adaptation are built into every program to support long-term training.',
  },
  {
    icon: Activity,
    title: 'Balanced Development',
    description: 'Push/pull ratios and movement patterns are carefully balanced to prevent imbalances.',
  },
]

// Skills overview
const SKILLS = [
  { name: 'Planche', description: 'Straight-arm pushing strength and body control', href: '/planche-readiness-calculator' },
  { name: 'Front Lever', description: 'Horizontal pulling power and core tension', href: '/front-lever-readiness-calculator' },
  { name: 'Muscle-Up', description: 'Explosive transition from pull to push', href: '/muscle-up-readiness-calculator' },
  { name: 'Handstand Push-Up', description: 'Overhead pressing strength and balance', href: '/guides/hspu-progression' },
  { name: 'Iron Cross', description: 'Ring strength and shoulder stability', href: '/iron-cross-readiness-calculator' },
]

// SpartanLab flow steps
const FLOW_STEPS = [
  { label: 'Athlete Input', description: 'Enter your strength metrics and goals', icon: User },
  { label: 'Strength Analysis', description: 'Evaluate pulling, pushing, core levels', icon: BarChart3 },
  { label: 'Skill Readiness', description: 'Detect which skills you can pursue', icon: Target },
  { label: 'Program Generation', description: 'Build structured training plan', icon: Settings },
  { label: 'Adaptive Progression', description: 'Adjust based on your progress', icon: TrendingUp },
]

// What SpartanLab analyzes
const ANALYSIS_FACTORS = [
  { label: 'Strength Levels', description: 'Pull-ups, dips, push-ups, weighted exercises' },
  { label: 'Skill Readiness', description: 'Current progression stage for each skill' },
  { label: 'Weak Points', description: 'Limiting factors blocking skill progress' },
  { label: 'Equipment', description: 'Available training equipment and setup' },
  { label: 'Schedule', description: 'Training frequency and session length' },
  { label: 'Recovery', description: 'Training history and recovery capacity' },
]

// Related tools for internal linking
const RELATED_TOOLS = [
  {
    title: 'Strength Standards Calculator',
    description: 'Test your calisthenics strength levels',
    href: '/calisthenics-strength-standards',
    icon: Dumbbell,
  },
  {
    title: 'Front Lever Calculator',
    description: 'Check your front lever readiness',
    href: '/front-lever-readiness-calculator',
    icon: Target,
  },
  {
    title: 'Planche Calculator',
    description: 'Assess your planche preparation',
    href: '/planche-readiness-calculator',
    icon: Layers,
  },
  {
    title: 'Muscle-Up Calculator',
    description: 'Evaluate your muscle-up readiness',
    href: '/muscle-up-readiness-calculator',
    icon: Zap,
  },
]

export default function WhySpartanLabWorksPage() {
  return (
    <div className="min-h-screen bg-[#0A0C0F]">
      <MarketingHeader />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-[#E6E9EF] mb-6 text-balance">
              Why SpartanLab Works
            </h1>
            <p className="text-lg md:text-xl text-[#A4ACB8] max-w-2xl mx-auto mb-6 text-pretty">
              Most calisthenics programs fail because they lack structure. SpartanLab uses 
              intelligent programming principles to build training plans that actually work.
            </p>
            <p className="text-sm text-[#6B7280] max-w-xl mx-auto">
              Built from widely recognized training principles used by experienced calisthenics athletes and coaches.
            </p>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="py-12 md:py-16 px-4 sm:px-6 bg-[#0F1115]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C1121F]/10 text-[#C1121F] text-sm mb-4">
                <AlertTriangle className="w-4 h-4" />
                The Problem
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
                Why Most Calisthenics Programs Fail
              </h2>
              <p className="text-[#A4ACB8] max-w-2xl mx-auto">
                Random workouts and generic programs miss the fundamental principles that make 
                calisthenics training effective.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMMON_PROBLEMS.map((item, index) => (
                <Card key={index} className="bg-[#0A0C0F] border-[#2B313A] p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#C1121F]/10 flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#C1121F]" />
                    </div>
                    <div>
                      <h3 className="text-[#E6E9EF] font-semibold mb-1">{item.problem}</h3>
                      <p className="text-sm text-[#A4ACB8]">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How SpartanLab Approaches Training */}
        <section className="py-12 md:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm mb-4">
                <CheckCircle2 className="w-4 h-4" />
                The Solution
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
                How SpartanLab Approaches Training
              </h2>
              <p className="text-[#A4ACB8] max-w-2xl mx-auto">
                Structured programming built on proven principles that experienced athletes use 
                to develop real skills.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SPARTANLAB_ADVANTAGES.map((item, index) => (
                <Card key={index} className="bg-[#0F1115] border-[#2B313A] p-5">
                  <div className="p-2 rounded-lg bg-[#C1121F]/10 w-fit mb-3">
                    <item.icon className="w-5 h-5 text-[#C1121F]" />
                  </div>
                  <h3 className="text-[#E6E9EF] font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-[#A4ACB8]">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Skill-Based Programming */}
        <section className="py-12 md:py-16 px-4 sm:px-6 bg-[#0F1115]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
                Skill-Based Programming
              </h2>
              <p className="text-[#A4ACB8] max-w-2xl mx-auto">
                Calisthenics training revolves around developing specific skills. Each skill requires 
                a unique combination of strength, mobility, control, and progression stages.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {SKILLS.map((skill, index) => (
                <Link key={index} href={skill.href}>
                  <Card className="bg-[#0A0C0F] border-[#2B313A] p-5 hover:border-[#C1121F]/50 transition-colors h-full">
                    <h3 className="text-[#E6E9EF] font-semibold mb-1">{skill.name}</h3>
                    <p className="text-sm text-[#A4ACB8]">{skill.description}</p>
                    <div className="flex items-center gap-1 text-[#C1121F] text-sm mt-3">
                      Test Readiness <ChevronRight className="w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <Card className="bg-[#0A0C0F] border-[#2B313A] p-6">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-3">What Each Skill Requires</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-3">
                  <Dumbbell className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#E6E9EF] font-medium block">Strength</span>
                    <span className="text-sm text-[#6B7280]">Prerequisite force production</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#E6E9EF] font-medium block">Mobility</span>
                    <span className="text-sm text-[#6B7280]">Joint range of motion</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#E6E9EF] font-medium block">Control</span>
                    <span className="text-sm text-[#6B7280]">Body tension and awareness</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#E6E9EF] font-medium block">Progressions</span>
                    <span className="text-sm text-[#6B7280]">Staged skill development</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Progression Logic */}
        <section className="py-12 md:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
                  Real Progression Systems
                </h2>
                <p className="text-[#A4ACB8] mb-6">
                  SpartanLab uses structured progression principles that experienced athletes rely on 
                  to develop skills systematically.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-[#C1121F]/10">
                      <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                    </div>
                    <div>
                      <span className="text-[#E6E9EF] font-medium block">Skill Ladders</span>
                      <span className="text-sm text-[#6B7280]">Structured progressions from beginner to advanced variations</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-[#C1121F]/10">
                      <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                    </div>
                    <div>
                      <span className="text-[#E6E9EF] font-medium block">Prerequisite Strength</span>
                      <span className="text-sm text-[#6B7280]">Build foundational strength before advancing</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-[#C1121F]/10">
                      <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                    </div>
                    <div>
                      <span className="text-[#E6E9EF] font-medium block">Progressive Overload</span>
                      <span className="text-sm text-[#6B7280]">Systematic increases through leverage, load, or volume</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-[#C1121F]/10">
                      <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                    </div>
                    <div>
                      <span className="text-[#E6E9EF] font-medium block">Balanced Development</span>
                      <span className="text-sm text-[#6B7280]">Push/pull ratios prevent imbalances and injury</span>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="bg-[#0F1115] border-[#2B313A] p-6">
                <h3 className="text-lg font-semibold text-[#E6E9EF] mb-4">Example: Front Lever Ladder</h3>
                <div className="space-y-3">
                  {[
                    { stage: '1', name: 'Tuck Front Lever', status: 'foundation' },
                    { stage: '2', name: 'Advanced Tuck', status: 'building' },
                    { stage: '3', name: 'One-Leg Front Lever', status: 'intermediate' },
                    { stage: '4', name: 'Straddle Front Lever', status: 'advanced' },
                    { stage: '5', name: 'Full Front Lever', status: 'goal' },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C1121F]/10 flex items-center justify-center text-[#C1121F] text-sm font-medium">
                        {item.stage}
                      </div>
                      <span className="text-[#E6E9EF]">{item.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#6B7280] mt-4">
                  Each stage builds the strength and control needed for the next level.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Injury Prevention */}
        <section className="py-12 md:py-16 px-4 sm:px-6 bg-[#0F1115]">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <Card className="bg-[#0A0C0F] border-[#2B313A] p-6 order-2 lg:order-1">
                <div className="p-3 rounded-lg bg-[#C1121F]/10 w-fit mb-4">
                  <Shield className="w-6 h-6 text-[#C1121F]" />
                </div>
                <h3 className="text-lg font-semibold text-[#E6E9EF] mb-3">Long-Term Training Health</h3>
                <p className="text-[#A4ACB8] text-sm mb-4">
                  Calisthenics places significant demands on joints, tendons, and connective tissue. 
                  SpartanLab programs account for tissue adaptation rates to support sustainable progress.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0F1115] rounded-lg p-3">
                    <span className="text-[#E6E9EF] font-medium text-sm block">Tendon Adaptation</span>
                    <span className="text-xs text-[#6B7280]">Slower than muscle, requires patience</span>
                  </div>
                  <div className="bg-[#0F1115] rounded-lg p-3">
                    <span className="text-[#E6E9EF] font-medium text-sm block">Joint Preparation</span>
                    <span className="text-xs text-[#6B7280]">Progressive loading for joint health</span>
                  </div>
                  <div className="bg-[#0F1115] rounded-lg p-3">
                    <span className="text-[#E6E9EF] font-medium text-sm block">Gradual Loading</span>
                    <span className="text-xs text-[#6B7280]">Controlled difficulty increases</span>
                  </div>
                  <div className="bg-[#0F1115] rounded-lg p-3">
                    <span className="text-[#E6E9EF] font-medium text-sm block">Balance</span>
                    <span className="text-xs text-[#6B7280]">Push/pull equilibrium</span>
                  </div>
                </div>
              </Card>

              <div className="order-1 lg:order-2">
                <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
                  Injury Prevention Built In
                </h2>
                <p className="text-[#A4ACB8] mb-6">
                  Advanced calisthenics skills place extreme demands on the body. SpartanLab prioritizes 
                  long-term training health by building joint preparation and tissue adaptation into every program.
                </p>
                <p className="text-[#A4ACB8]">
                  Tendons adapt slower than muscles. Rushing progressions leads to overuse injuries. 
                  SpartanLab paces your training to allow connective tissue to strengthen alongside muscle.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How SpartanLab Works - Flow Diagram */}
        <section className="py-12 md:py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
                How SpartanLab Works
              </h2>
              <p className="text-[#A4ACB8] max-w-xl mx-auto">
                A simple flow from your input to adaptive, structured training.
              </p>
            </div>

            {/* Flow Steps */}
            <div className="relative">
              <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-5 md:gap-4">
                {FLOW_STEPS.map((step, index) => (
                  <div key={index} className="relative">
                    <Card className="bg-[#0F1115] border-[#2B313A] p-4 text-center h-full">
                      <div className="p-2 rounded-lg bg-[#C1121F]/10 w-fit mx-auto mb-3">
                        <step.icon className="w-5 h-5 text-[#C1121F]" />
                      </div>
                      <h3 className="text-[#E6E9EF] font-semibold text-sm mb-1">{step.label}</h3>
                      <p className="text-xs text-[#6B7280]">{step.description}</p>
                    </Card>
                    {/* Arrow between steps (hidden on mobile, visible on desktop) */}
                    {index < FLOW_STEPS.length - 1 && (
                      <>
                        <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                          <ChevronRight className="w-4 h-4 text-[#2B313A]" />
                        </div>
                        <div className="md:hidden flex justify-center py-2">
                          <ChevronDown className="w-4 h-4 text-[#2B313A]" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Adaptive Programming - What We Analyze */}
        <section className="py-12 md:py-16 px-4 sm:px-6 bg-[#0F1115]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
                Training That Adapts to You
              </h2>
              <p className="text-[#A4ACB8] max-w-2xl mx-auto">
                SpartanLab analyzes your individual situation to generate programs that fit your 
                current abilities and goals.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ANALYSIS_FACTORS.map((factor, index) => (
                <Card key={index} className="bg-[#0A0C0F] border-[#2B313A] p-5">
                  <h3 className="text-[#E6E9EF] font-semibold mb-1">{factor.label}</h3>
                  <p className="text-sm text-[#6B7280]">{factor.description}</p>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-[#6B7280] mt-6">
              This allows SpartanLab to generate programs tailored to where you actually are, not 
              generic routines that ignore your individual situation.
            </p>
          </div>
        </section>

        {/* Related Tools */}
        <section className="py-12 md:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-6 text-center">
              Test Your Readiness
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {RELATED_TOOLS.map((tool, index) => (
                <Link key={index} href={tool.href}>
                  <Card className="bg-[#0F1115] border-[#2B313A] p-5 hover:border-[#C1121F]/50 transition-colors h-full">
                    <div className="p-2 rounded-lg bg-[#C1121F]/10 w-fit mb-3">
                      <tool.icon className="w-5 h-5 text-[#C1121F]" />
                    </div>
                    <h3 className="text-[#E6E9EF] font-semibold text-sm mb-1">{tool.title}</h3>
                    <p className="text-xs text-[#6B7280]">{tool.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/training-philosophy" className="text-[#C1121F] text-sm hover:underline">
                Read our full Training Philosophy <ArrowRight className="w-3 h-3 inline ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-[#0F1115] to-[#0A0C0F]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#E6E9EF] mb-4">
              Start Your SpartanLab Plan
            </h2>
            <p className="text-[#A4ACB8] mb-6 max-w-lg mx-auto">
              Let SpartanLab analyze your strength, detect your skill readiness, and generate a 
              structured training program tailored to your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding">
                <Button size="lg" className="bg-[#C1121F] hover:bg-[#A50E1A] text-white px-8">
                  Build My Training Plan
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
      </main>

      <MarketingFooter />
    </div>
  )
}
