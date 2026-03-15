import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Calculator, Target, Dumbbell, Trophy, Zap, Calendar, Activity, ClipboardList, Brain, Cpu, BarChart3, Wrench, Crown, Lock, TrendingUp, Sparkles } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BackNav } from '@/components/navigation/BackNav'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Calisthenics Training Tools | SpartanLab',
  description: 'Use SpartanLab calisthenics training tools to analyze strength, test skill readiness, and generate training programs. Front lever calculator, planche calculator, muscle-up readiness test.',
  keywords: ['calisthenics training tools', 'front lever calculator', 'planche calculator', 'muscle-up readiness test', 'weighted pull-up calculator', 'fitness calculator'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/tools`,
  },
  openGraph: {
    title: 'Calisthenics Training Tools | SpartanLab',
    description: 'Use SpartanLab calisthenics training tools to analyze strength, test skill readiness, and generate training programs.',
    url: `${SITE_CONFIG.url}/tools`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calisthenics Training Tools | SpartanLab',
    description: 'Free calisthenics calculators: front lever, planche, muscle-up readiness, and more.',
  },
}

const tools = [
  {
    slug: 'pull-up-strength-calculator',
    title: 'Pull-Up Strength Standards',
    description: 'Find out how your pull-up strength compares to calisthenics standards. From beginner to elite.',
    icon: Dumbbell,
    category: 'Strength Calculator',
    featured: true,
  },
  {
    slug: 'front-lever-calculator',
    title: 'Front Lever Strength Calculator',
    description: 'Calculate your Front Lever readiness using pulling strength, core stability, and skill progression metrics.',
    icon: Target,
    category: 'Strength Calculator',
    featured: true,
  },
  {
    slug: '../front-lever-readiness-calculator',
    title: 'Front Lever Readiness Calculator',
    description: 'Calculate your front lever readiness score based on pulling strength, core tension, and skill experience.',
    icon: Target,
    category: 'Readiness Calculator',
    featured: true,
  },
  {
    slug: '../planche-readiness-calculator',
    title: 'Planche Readiness Calculator',
    description: 'Evaluate your planche prerequisites based on pushing strength, lean tolerance, and shoulder conditioning.',
    icon: Calculator,
    category: 'Readiness Calculator',
    featured: true,
  },
  {
    slug: '../muscle-up-readiness-calculator',
    title: 'Muscle-Up Readiness Calculator',
    description: 'Test your muscle-up readiness with pulling strength, explosive power, and transition metrics.',
    icon: Zap,
    category: 'Readiness Calculator',
    featured: true,
  },
  {
    slug: 'planche-readiness',
    title: 'Planche Readiness Test (Legacy)',
    description: 'Evaluate your planche prerequisites and identify weak points.',
    icon: Calculator,
    category: 'Skill Sensor',
    featured: false,
  },
  {
    slug: 'muscle-up-progression',
    title: 'Muscle-Up Progression Calculator',
    description: 'Track your muscle-up progression from assisted to strict to weighted.',
    icon: Zap,
    category: 'Skill Sensor',
    featured: false,
  },
  {
    slug: 'hspu-progression',
    title: 'HSPU Progression Calculator',
    description: 'Track your handstand push-up progression from wall-supported to freestanding.',
    icon: Target,
    category: 'Skill Sensor',
    featured: false,
  },
  {
    slug: 'weighted-pullup-calculator',
    title: 'Weighted Pull-Up Calculator',
    description: 'Calculate your estimated 1RM and relative strength ratio for weighted pull-ups.',
    icon: Dumbbell,
    category: 'Strength Calculator',
    featured: false,
  },
  {
    slug: 'strength-standards',
    title: 'Calisthenics Strength Standards',
    description: 'See how your strength compares to calisthenics benchmarks.',
    icon: Trophy,
    category: 'Benchmarks',
    featured: false,
  },
  {
    slug: 'weighted-dip-calculator',
    title: 'Weighted Dip Calculator',
    description: 'Calculate your estimated 1RM and relative strength for weighted dips.',
    icon: Dumbbell,
    category: 'Strength Calculator',
    featured: false,
  },
  {
    slug: 'calisthenics-program-builder',
    title: 'Calisthenics Program Builder',
    description: 'Generate a personalized calisthenics training program based on your goals and current ability.',
    icon: Calendar,
    category: 'Program Generator',
    featured: true,
  },
  {
    slug: 'front-lever-strength-test',
    title: 'Front Lever Strength Test',
    description: 'Test your front lever readiness with this interactive strength assessment based on pulling strength and hold times.',
    icon: Target,
    category: 'Skill Sensor',
    featured: true,
  },
  {
    slug: 'planche-strength-calculator',
    title: 'Planche Strength Calculator',
    description: 'Calculate your planche readiness based on pushing strength, lean angle tolerance, and core compression.',
    icon: Calculator,
    category: 'Skill Sensor',
    featured: true,
  },
]

// Pro-only advanced tools
const proTools = [
  {
    title: 'Training Intelligence Dashboard',
    description: 'Deep performance analysis with adaptive program adjustments and progress forecasting.',
    icon: Brain,
    category: 'Pro Intelligence',
  },
  {
    title: 'Fatigue Analytics Engine',
    description: 'Advanced fatigue tracking, recovery predictions, and overtraining prevention signals.',
    icon: Activity,
    category: 'Pro Analytics',
  },
  {
    title: 'Progress Forecasting',
    description: 'See estimated timelines for your next skill milestones based on current progress rate.',
    icon: TrendingUp,
    category: 'Pro Projections',
  },
  {
    title: 'Constraint Analysis',
    description: 'Identify what is currently limiting your progress and get targeted recommendations.',
    icon: Sparkles,
    category: 'Pro Insights',
  },
]

// Platform tools that link to app sections
const platformTools = [
  {
    title: 'Workout Program Builder',
    description: 'Generate a personalized calisthenics training program based on your goals and current ability.',
    icon: Calendar,
    route: '/programs',
    category: 'Training Program',
  },
  {
    title: 'Workout Log',
    description: 'Record training sessions and feed performance data into the Adaptive Training Engine.',
    icon: ClipboardList,
    route: '/workout-log',
    category: 'Performance Tracking',
  },
  {
    title: 'Skill Progress Tracker',
    description: 'Analyze skill readiness and progression toward front lever, planche, and muscle-up.',
    icon: Activity,
    route: '/skills',
    category: 'Skill Tracking',
  },
  {
    title: 'Training Dashboard',
    description: 'View all training intelligence, progress metrics, and personalized recommendations.',
    icon: BarChart3,
    route: '/dashboard',
    category: 'Intelligence Hub',
  },
]

export default function ToolsIndexPage() {
  const featuredTools = tools.filter(t => t.featured)
  const otherTools = tools.filter(t => !t.featured)
  
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Navigation */}
      <nav className="px-4 py-4 border-b border-[#2B313A] sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <BackNav to="dashboard" />
            <Link href="/landing" className="flex items-center gap-2.5">
              <SpartanIcon size={28} />
              <span className="font-semibold text-[#E6E9EF]">SpartanLab</span>
            </Link>
          </div>
          <Button asChild size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A]">
            <Link href="/dashboard">Open App</Link>
          </Button>
        </div>
      </nav>
      
      <main className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 mb-6">
              <Wrench className="w-4 h-4 text-[#C1121F]" />
              <span className="text-sm text-[#C1121F] font-medium">Performance Sensors</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-[#E6E9EF] text-balance">
              SpartanLab Training Tools
            </h1>
            <p className="text-xl text-[#A4ACB8] max-w-2xl mx-auto mb-4">
              Analyze your strength, test your skill readiness, and build smarter calisthenics programs using SpartanLab training tools.
            </p>
            <p className="text-[#6B7280] max-w-xl mx-auto">
              SpartanLab tools act as performance sensors that analyze your training data and help determine the most effective exercises and progressions for your goals. Use these tools to evaluate your strength and generate training programs based on your current ability.
            </p>
          </div>
          
          {/* Featured Tools */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-4">
              Featured Skill Sensors
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {featuredTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                    <Card className="bg-[#1A1F26] border-[#2B313A] p-6 h-full hover:border-[#C1121F]/50 transition-all hover:bg-[#1A1F26]/80 cursor-pointer group">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C1121F]/20 transition-colors">
                          <Icon className="w-6 h-6 text-[#C1121F]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">{tool.category}</p>
                          <h2 className="text-lg font-semibold mb-2 text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">{tool.title}</h2>
                          <p className="text-sm text-[#A4ACB8] mb-4">{tool.description}</p>
                          <div className="flex items-center gap-2 text-sm text-[#C1121F]">
                            <span>Try Sensor</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* Other Tools Grid */}
          <div className="mb-12">
            <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-4">
              All Tools
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {otherTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                    <Card className="bg-[#1A1F26] border-[#2B313A] p-5 h-full hover:border-[#4F6D8A]/50 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-[#A4ACB8] group-hover:text-[#C1121F] transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#6B7280] uppercase tracking-wide">{tool.category}</p>
                          <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">{tool.title}</h3>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#C1121F] group-hover:translate-x-1 transition-all" />
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* Pro Intelligence Tools */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider">
                Pro Intelligence Tools
              </h2>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {proTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link key={tool.title} href="/upgrade">
                    <Card className="bg-[#1A1F26]/50 border-[#2B313A] p-4 h-full hover:border-amber-500/30 transition-all cursor-pointer group relative overflow-hidden">
                      {/* Locked overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F1115]/30 pointer-events-none" />
                      <div className="flex items-center gap-3 relative">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-amber-400/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-amber-400 uppercase tracking-wide">{tool.category}</p>
                          <h3 className="font-medium text-[#A4ACB8] group-hover:text-amber-400 transition-colors">{tool.title}</h3>
                          <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{tool.description}</p>
                        </div>
                        <Lock className="w-4 h-4 text-amber-400/50 flex-shrink-0" />
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 text-center">
              <Link href="/upgrade">
                <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro for Advanced Tools
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Platform Tools */}
          <div className="mb-12">
            <h2 className="text-sm font-medium text-[#6B7280] uppercase tracking-wider mb-4">
              Training Platform
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {platformTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link key={tool.route} href={tool.route}>
                    <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#2B313A] p-5 h-full hover:border-[#C1121F]/40 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C1121F]/15 to-[#C1121F]/5 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-[#C1121F]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#C1121F] uppercase tracking-wide mb-1">{tool.category}</p>
                          <h3 className="font-semibold text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">{tool.title}</h3>
                          <p className="text-sm text-[#A4ACB8] mt-1 line-clamp-1">{tool.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#C1121F] group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* How SpartanLab Works */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#C1121F]" />
              </div>
              <h2 className="text-xl font-semibold text-[#E6E9EF]">How SpartanLab Works</h2>
            </div>
            <p className="text-[#A4ACB8] mb-6">
              SpartanLab uses training data from multiple tools to analyze your performance and generate training recommendations. These tools act as performance sensors that feed the Adaptive Training Engine. Instead of guessing what to train next, SpartanLab uses your data to guide your training.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C1121F] font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-[#E6E9EF] mb-1">Use Tools</h3>
                  <p className="text-sm text-[#A4ACB8]">Test your strength and skill levels using our calculators.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C1121F] font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-[#E6E9EF] mb-1">Analyze Data</h3>
                  <p className="text-sm text-[#A4ACB8]">The engine processes your performance data and identifies patterns.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0F1115] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C1121F] font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-[#E6E9EF] mb-1">Get Recommendations</h3>
                  <p className="text-sm text-[#A4ACB8]">Receive personalized training recommendations based on your data.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Generate Program CTA */}
          <Card className="bg-gradient-to-br from-[#C1121F]/15 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8 sm:p-10 text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C1121F]/20 to-[#C1121F]/5 flex items-center justify-center mx-auto mb-6">
              <Cpu className="w-7 h-7 text-[#C1121F]" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-[#E6E9EF]">Generate Your Training Program</h2>
            <p className="text-[#A4ACB8] mb-2 max-w-lg mx-auto">
              SpartanLab can generate a personalized calisthenics training program based on your strength level, training schedule, and available equipment.
            </p>
            <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
              The Adaptive Training Engine continuously adjusts your program as your performance improves.
            </p>
            <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
              <Link href="/programs">
                Generate Program
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </Card>
          
          </div>
      </main>
      
      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#2B313A] mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#6B7280]">
          <p>Part of the SpartanLab Calisthenics Training Decision Engine</p>
          <div className="flex items-center gap-6">
            <Link href="/guides" className="hover:text-[#E6E9EF] transition-colors">Guides</Link>
            <Link href="/programs" className="hover:text-[#E6E9EF] transition-colors">Program Builder</Link>
            <Link href="/dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
            <Link href="/results" className="hover:text-[#E6E9EF] transition-colors">Results</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
