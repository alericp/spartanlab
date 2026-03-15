'use client'

import Link from 'next/link'
import { 
  Target, 
  Dumbbell, 
  Brain, 
  Calendar, 
  Activity, 
  Database,
  ArrowRight,
  CheckCircle2,
  X,
  TrendingUp,
  Shield,
  Cpu,
  Gauge,
  Zap,
  ChevronRight
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PRICING } from '@/lib/billing/pricing'

// Hero Section - Refined messaging positioning SpartanLab as an intelligent coach
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1F26] via-[#0F1115] to-[#0F1115]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#C1121F]/5 rounded-full blur-[120px]" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 mb-8">
          <SpartanIcon size={18} />
          <span className="text-sm text-[#C1121F] font-medium">Adaptive Calisthenics Coach</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-balance">
          Train Smarter With an{' '}
          <span className="text-[#C1121F]">Adaptive Coach</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-[#A4ACB8] max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
          SpartanLab analyzes your strength, skills, and recovery to generate the most effective calisthenics workouts for your goals.
        </p>
        
        {/* Trust Signals */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-10">
          <div className="flex items-center gap-2 text-sm text-[#A4ACB8]">
            <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
            <span>Skill-based training</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#A4ACB8]">
            <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
            <span>Adaptive programming</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#A4ACB8]">
            <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
            <span>Calisthenics focused</span>
          </div>
        </div>
        
        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] text-white px-8 py-6 text-lg font-semibold">
            <Link href="/sign-up">
              Start Training Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-[#2B313A] hover:bg-[#2B313A] px-8 py-6 text-lg">
            <Link href="/tools">
              Explore Tools
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// Problem Section
function ProblemSection() {
  const problems = [
    'Random programs with no structure',
    'Guessing when to progress skills',
    'Training too much or too little',
    'Weak points going unnoticed',
    'No system tracking real skill progression',
  ]
  
  return (
    <section className="px-4 py-20 bg-[#1A1F26]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Why Most Athletes <span className="text-[#C1121F]">Stay Stuck</span>
        </h2>
        <p className="text-[#A4ACB8] text-center mb-12 max-w-2xl mx-auto">
          Sound familiar? These common training mistakes keep athletes spinning their wheels for years.
        </p>
        
        <div className="grid gap-4 max-w-xl mx-auto">
          {problems.map((problem, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-[#E6E9EF]">{problem}</span>
            </div>
          ))}
        </div>
        
        <p className="text-center text-[#6B7280] mt-8 text-lg">
          Most athletes spend <span className="text-[#E6E9EF] font-medium">years</span> figuring this out through trial and error.
        </p>
      </div>
    </section>
  )
}

// How It Works - Simple 3 Step Process
function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Analyze Your Strength',
      description: 'Use SpartanLab tools to measure pulling strength, pushing strength, and skill readiness.',
      icon: Gauge,
      color: '#4F6D8A',
    },
    {
      number: '2',
      title: 'Identify Weak Points',
      description: 'The platform analyzes your performance data and identifies the strength gaps preventing skill progress.',
      icon: Brain,
      color: '#C1121F',
    },
    {
      number: '3',
      title: 'Generate Smarter Training',
      description: 'The Adaptive Training Engine generates a program designed for your current ability and adjusts it as you improve.',
      icon: Cpu,
      color: '#FFD700',
    },
  ]

  return (
    <section id="how-it-works" className="px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How SpartanLab <span className="text-[#C1121F]">Works</span>
          </h2>
          <p className="text-[#A4ACB8] max-w-2xl mx-auto">
            Three steps to smarter calisthenics training.
          </p>
        </div>
        
        {/* 3 Step Process */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#2B313A] to-transparent" />
                )}
                <Card className="bg-[#1A1F26] border-[#2B313A] p-6 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${step.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: step.color }} />
                    </div>
                    <span 
                      className="text-4xl font-bold"
                      style={{ color: step.color }}
                    >
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-[#A4ACB8] text-sm leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Intelligence Preview Section
function IntelligencePreviewSection() {
  return (
    <section className="px-4 py-20 bg-[#1A1F26]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Know Your Training <span className="text-[#C1121F]">State</span>
          </h2>
          <p className="text-[#A4ACB8] max-w-2xl mx-auto">
            The Athlete Intelligence dashboard gives you immediate clarity on what's happening with your training.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Spartan Score Preview */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h3 className="font-semibold">Spartan Strength Score</h3>
                <p className="text-xs text-[#6B7280]">Overall performance metric</p>
              </div>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-bold tabular-nums">482</span>
              <span className="text-sm text-[#4F6D8A] mb-2">/ 1000</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 flex-1 bg-[#2B313A] rounded-full overflow-hidden">
                <div className="h-full w-[48%] bg-[#4F6D8A] rounded-full" />
              </div>
            </div>
            <p className="text-sm text-[#A4ACB8]">Level: <span className="text-[#E6E9EF]">Intermediate</span></p>
          </Card>
          
          {/* Training Momentum Preview */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Training Momentum</h3>
                <p className="text-xs text-[#6B7280]">Consistency tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-2xl font-bold text-green-400">Strong</span>
              <span className="text-sm text-[#6B7280]">4 workouts this week</span>
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 h-2 rounded-full bg-green-500/50" />
              ))}
              <div className="flex-1 h-2 rounded-full bg-[#2B313A]" />
            </div>
            <p className="text-sm text-[#A4ACB8]">Your consistency supports steady progress.</p>
          </Card>
          
          {/* Primary Limiter Preview */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold">Primary Limiter</h3>
                <p className="text-xs text-[#6B7280]">What's holding you back</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-amber-400 mb-2">Horizontal Pull Strength</p>
            <p className="text-sm text-[#A4ACB8] mb-4">
              Your pulling strength supports your current progression, but horizontal capacity limits front lever development.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Front Lever Rows', 'Scapula Pulls'].map((item, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-amber-500/10 text-amber-400 rounded">
                  {item}
                </span>
              ))}
            </div>
          </Card>
          
          {/* Recommended Focus Preview */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#C1121F]" />
              </div>
              <div>
                <h3 className="font-semibold">Recommended Focus</h3>
                <p className="text-xs text-[#6B7280]">What to train today</p>
              </div>
            </div>
            <p className="text-lg font-semibold mb-3">Pulling Strength Session</p>
            <ul className="space-y-2 text-sm text-[#A4ACB8]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                Heavy rows for horizontal strength
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                Front lever holds at current level
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                Weighted pull-ups for support
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  )
}

// Free Tools Section (SEO Entry Points)
function FreeToolsSection() {
  const tools = [
    {
      name: 'Front Lever Progression Calculator',
      description: 'Assess your front lever readiness and get progression recommendations.',
      href: '/tools/front-lever-calculator',
      keywords: 'front lever, progression, calisthenics',
    },
    {
      name: 'Planche Readiness Test',
      description: 'Evaluate your planche prerequisites and identify weak points.',
      href: '/tools/planche-readiness',
      keywords: 'planche, progression, strength',
    },
    {
      name: 'Weighted Pull-Up Calculator',
      description: 'Calculate your relative strength and estimated 1RM.',
      href: '/tools/weighted-pullup-calculator',
      keywords: 'weighted pull-up, 1RM, strength',
    },
    {
      name: 'Calisthenics Strength Standards',
      description: 'See how your strength compares to benchmarks.',
      href: '/tools/strength-standards',
      keywords: 'strength standards, benchmarks',
    },
  ]
  
  return (
    <section id="tools" className="px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[#4F6D8A]" />
          <span className="text-sm text-[#4F6D8A] font-medium uppercase tracking-wide">Free Athlete Sensors</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Free Calisthenics <span className="text-[#C1121F]">Training Tools</span>
        </h2>
        <p className="text-[#A4ACB8] text-center mb-12 max-w-2xl mx-auto">
          Use these standalone sensors to assess your current level. Each tool feeds data into the SpartanLab intelligence system.
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {tools.map((tool, i) => (
            <Link key={i} href={tool.href}>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5 hover:border-[#C1121F]/50 transition-all hover:bg-[#1A1F26]/80 cursor-pointer h-full group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1 group-hover:text-[#C1121F] transition-colors">{tool.name}</h3>
                    <p className="text-sm text-[#A4ACB8]">{tool.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#6B7280] flex-shrink-0 mt-1 group-hover:text-[#C1121F] group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="text-center">
          <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-[#A4ACB8] hover:text-[#C1121F] transition-colors">
            View all free tools
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// Pricing Section
function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-20 bg-[#1A1F26]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Simple <span className="text-[#C1121F]">Pricing</span>
        </h2>
        <p className="text-[#A4ACB8] text-center mb-12 max-w-xl mx-auto">
          Start free with Athlete Sensors. Upgrade to unlock the full Training Decision Engine.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-1">Free</h3>
              <p className="text-[#6B7280] text-sm">Athlete Sensors + Basic Intelligence</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-[#6B7280]">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                'All Skill Progress Sensors',
                'Strength Analysis Tools',
                'Workout Logging',
                'Spartan Strength Score',
                'Training Momentum Tracking',
                'Primary Limiter Detection',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#A4ACB8]">
                  <CheckCircle2 className="w-4 h-4 text-[#4F6D8A] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full border-[#2B313A] hover:bg-[#2B313A]">
              <Link href="/dashboard">Start Free</Link>
            </Button>
          </Card>
          
          {/* Pro Tier */}
          <Card className="bg-gradient-to-b from-[#C1121F]/10 to-[#0F1115] border-[#C1121F]/30 p-6 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 bg-[#C1121F] text-white text-xs font-medium rounded">Recommended</span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-1">Pro</h3>
              <p className="text-[#6B7280] text-sm">Full Adaptive Training Engine</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">{PRICING.pro.display}</span>
              <span className="text-[#6B7280]">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                'Everything in Free',
                'Adaptive Program Builder',
                'Daily Training Adjustments',
                'Limiter Correction Programs',
                'Deload Detection & Timing',
                'Equipment-Based Programming',
                'Advanced Progression Planning',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#A4ACB8]">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full bg-[#C1121F] hover:bg-[#A30F1A]">
              <Link href="/dashboard">Unlock Pro</Link>
            </Button>
          </Card>
        </div>
      </div>
    </section>
  )
}

// Platform Value Section
function PlatformValueSection() {
  return (
    <section className="px-4 py-20 bg-[#1A1F26]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            A Training <span className="text-[#C1121F]">Intelligence System</span>
          </h2>
        </div>
        
        <div className="space-y-6 text-lg text-[#A4ACB8] max-w-2xl mx-auto text-center">
          <p>
            Most athletes follow generic programs or random workouts.
          </p>
          <p>
            SpartanLab analyzes your training performance and identifies the most effective exercises and progressions for your goals.
          </p>
          <p className="text-[#E6E9EF] font-medium">
            Instead of guessing what to train next, you receive data-driven recommendations.
          </p>
        </div>
      </div>
    </section>
  )
}

// Final CTA Section
function FinalCTASection() {
  return (
    <section className="px-4 py-24">
      <div className="max-w-3xl mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-[#C1121F]/10 flex items-center justify-center mx-auto mb-8">
          <SpartanIcon size={32} />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Start Training <span className="text-[#C1121F]">Smarter</span>
        </h2>
        <p className="text-lg text-[#A4ACB8] mb-8 max-w-xl mx-auto">
          Generate your first calisthenics training program and start making data-driven progress.
        </p>
        <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] text-white px-8 py-6 text-lg">
          <Link href="/programs">
            Generate Training Program
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="px-4 py-12 border-t border-[#2B313A]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SpartanIcon size={28} />
            <span className="font-semibold">SpartanLab</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#6B7280]">
            <Link href="/dashboard" className="hover:text-[#E6E9EF] transition-colors">Dashboard</Link>
            <Link href="/tools" className="hover:text-[#E6E9EF] transition-colors">Free Tools</Link>
            <Link href="/about" className="hover:text-[#E6E9EF] transition-colors">About</Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#2B313A] text-center text-sm text-[#6B7280]">
          <p>The Calisthenics Training Decision Engine. Built for athletes who want results, not guesswork.</p>
        </div>
      </div>
    </footer>
  )
}

// Navigation
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-[#0F1115]/80 backdrop-blur-lg border-b border-[#2B313A]/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/landing" className="flex items-center gap-2">
          <SpartanIcon size={28} />
          <span className="font-semibold">SpartanLab</span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm text-[#A4ACB8]">
          <a href="#how-it-works" className="hover:text-[#E6E9EF] transition-colors">How It Works</a>
          <a href="#tools" className="hover:text-[#E6E9EF] transition-colors">Free Tools</a>
          <a href="#pricing" className="hover:text-[#E6E9EF] transition-colors">Pricing</a>
        </div>
        <Button asChild size="sm" className="bg-[#C1121F] hover:bg-[#A30F1A]">
          <Link href="/dashboard">Open App</Link>
        </Button>
      </div>
    </nav>
  )
}

// Main Landing Page Component
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <Navigation />
      <main className="pt-16">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <PlatformValueSection />
        <IntelligencePreviewSection />
        <FreeToolsSection />
        <PricingSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}
