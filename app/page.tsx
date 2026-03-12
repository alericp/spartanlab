'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/ClerkComponents'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import { isPreviewMode } from '@/lib/app-mode'
import {
  Target,
  Dumbbell,
  Calendar,
  ClipboardList,
  Activity,
  TrendingUp,
  Crosshair,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react'

const PLATFORM_TOOLS = [
  {
    icon: Target,
    name: 'Skill Progression Tracker',
    description: 'Track planche, front lever, muscle-up, and HSPU from foundation to mastery.'
  },
  {
    icon: Dumbbell,
    name: 'Weighted Strength Tracker',
    description: 'Log weighted pull-ups, dips, and muscle-ups with 1RM calculations.'
  },
  {
    icon: Calendar,
    name: 'Program Builder',
    description: 'Generate focused training programs based on your goals and level.'
  },
  {
    icon: ClipboardList,
    name: 'Workout Log',
    description: 'Record sessions with detailed exercise logging and notes.'
  },
  {
    icon: Activity,
    name: 'Volume & Recovery Analyzer',
    description: 'Analyze training volume and get recovery insights.'
  },
  {
    icon: TrendingUp,
    name: 'Spartan Strength Score',
    description: 'Your unified performance metric from 0-100.'
  },
  {
    icon: Crosshair,
    name: 'Goal Projection Engine',
    description: 'Get estimated timelines for reaching milestones.'
  },
  {
    icon: LayoutDashboard,
    name: 'Performance Dashboard',
    description: 'Unified view of all your training data and progress.'
  }
]

const CORE_VALUES = [
  {
    title: 'Track Skill Mastery',
    description: 'Visual progression maps from tuck to full for every major calisthenics skill.'
  },
  {
    title: 'Build Real Strength',
    description: 'Monitor weighted calisthenics with automatic 1RM calculations and progress tracking.'
  },
  {
    title: 'Measure Your Progress',
    description: 'Turn training into data. See exactly where you stand and how far you can go.'
  }
]

const COMPARISON = [
  { feature: 'Skill progression tracking', spartanlab: true, generic: false },
  { feature: 'Weighted calisthenics focus', spartanlab: true, generic: false },
  { feature: 'Unified Strength Score', spartanlab: true, generic: false },
  { feature: 'Goal milestone projections', spartanlab: true, generic: false },
  { feature: 'Push/pull volume analysis', spartanlab: true, generic: false },
  { feature: 'Calisthenics-specific programs', spartanlab: true, generic: false },
]

export default function Home() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const preview = isPreviewMode()
  
  // Use Clerk's useAuth hook for production mode
  // In preview mode, we check localStorage
  const { isSignedIn, isLoaded } = useAuth()
  
  useEffect(() => {
    // Wait for Clerk to load in production mode
    if (!preview && !isLoaded) return
    
    // Check if user is authenticated and redirect to dashboard
    let shouldRedirect = false
    
    if (preview) {
      // In preview mode, check if user has started using the app
      const hasProfile = localStorage.getItem('athlete_profile')
      const hasWorkouts = localStorage.getItem('workouts')
      const hasPrograms = localStorage.getItem('saved_programs')
      shouldRedirect = Boolean(hasProfile || hasWorkouts || hasPrograms)
    } else {
      // In production mode, use Clerk's auth state
      shouldRedirect = Boolean(isSignedIn)
    }
    
    if (shouldRedirect) {
      router.replace('/dashboard')
    } else {
      setIsCheckingAuth(false)
    }
  }, [router, preview, isSignedIn, isLoaded])
  
  // Show nothing while checking auth to prevent flash
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E63946]/10 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse" />
                <span className="text-sm text-[#E63946] font-medium">Adaptive Calisthenics Coach</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-balance mb-6">
                The AI Coach That Builds Your Calisthenics Training For You
              </h1>

              <p className="text-lg text-[#A5A5A5] mb-6 text-pretty max-w-lg">
                SpartanLab analyzes your strength, skills, and recovery to generate the most effective workouts for your goals. Stop guessing what to train.
              </p>
              
              {/* Trust Signals */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm text-[#A5A5A5]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#E63946]" />
                  <span>Skill-based training</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#E63946]" />
                  <span>Adaptive programming</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#E63946]" />
                  <span>Calisthenics focused</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-[#E63946] hover:bg-[#D62828] w-full sm:w-auto px-8 h-12 text-base font-semibold">
                    Start Training Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/tools">
                  <Button size="lg" variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] w-full sm:w-auto px-8 h-12 text-base">
                    Explore Tools
                  </Button>
                </Link>
              </div>
            </div>

            {/* Product Preview Panel */}
            <div className="relative">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 space-y-4">
                {/* Spartan Score Preview */}
                <div className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[#A5A5A5]">Spartan Strength Score</span>
                    <span className="text-xs text-[#E63946] font-medium">Advanced</span>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold">67</span>
                    <span className="text-sm text-[#A5A5A5] mb-1">/100</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-[#1A1A1A] rounded">
                      <div className="text-[#A5A5A5]">Skill</div>
                      <div className="font-semibold">58</div>
                    </div>
                    <div className="text-center p-2 bg-[#1A1A1A] rounded">
                      <div className="text-[#A5A5A5]">Strength</div>
                      <div className="font-semibold">72</div>
                    </div>
                    <div className="text-center p-2 bg-[#1A1A1A] rounded">
                      <div className="text-[#A5A5A5]">Consistency</div>
                      <div className="font-semibold">75</div>
                    </div>
                  </div>
                </div>

                {/* Skill Progress Preview */}
                <div className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Planche Progress</span>
                    <span className="text-xs text-[#E63946]">Advanced Tuck</span>
                  </div>
                  <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div className="h-full bg-[#E63946] rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                {/* Goal Projection Preview */}
                <div className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Next Milestone</div>
                      <div className="text-xs text-[#A5A5A5]">Straddle Planche</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#E63946]">9-15 mo</div>
                      <div className="text-xs text-[#A5A5A5]">estimated</div>
                    </div>
                  </div>
                </div>

                {/* Weighted Strength Preview */}
                <div className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Weighted Pull-Up</div>
                      <div className="text-xs text-[#A5A5A5]">Estimated 1RM</div>
                    </div>
                    <div className="text-2xl font-bold">+85 lbs</div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 top-4 -right-4 w-full h-full bg-[#E63946]/5 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Section */}
      <section className="py-16 sm:py-20 border-y border-[#2A2A2A] bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8">
            {CORE_VALUES.map((value) => (
              <div key={value.title} className="text-center sm:text-left">
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-[#A5A5A5]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Tools Grid */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">8 Core Platform Tools</h2>
            <p className="text-[#A5A5A5] max-w-2xl mx-auto">
              Everything you need to track, analyze, and optimize your calisthenics training.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORM_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="group bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#E63946]/10 flex items-center justify-center mb-4 group-hover:bg-[#E63946]/20 transition-colors">
                  <tool.icon className="w-5 h-5 text-[#E63946]" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{tool.name}</h3>
                <p className="text-xs text-[#A5A5A5] leading-relaxed">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Different Section */}
      <section className="py-20 sm:py-28 bg-[#1A1A1A] border-y border-[#2A2A2A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Built for Calisthenics.<br />Not Generic Fitness.
              </h2>
              <p className="text-[#A5A5A5] mb-8 text-lg">
                Generic apps count reps. SpartanLab is a training intelligence system that analyzes skill readiness, calculates weighted strength, provides training insights, and projects when you will hit your next milestone.
              </p>

              <div className="space-y-4">
                {[
                  'Skill-specific progression tracking (not just rep counting)',
                  'Weighted calisthenics with 1RM calculations',
                  'Push/pull volume balance analysis',
                  'Unified Spartan Score combining all metrics',
                  'Milestone projections based on your data'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E63946] mt-0.5 shrink-0" />
                    <span className="text-[#F5F5F5]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-6">
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-[#2A2A2A]">
                <div className="text-sm text-[#A5A5A5]">Feature</div>
                <div className="text-sm font-semibold text-center text-[#E63946]">SpartanLab</div>
                <div className="text-sm text-center text-[#A5A5A5]">Generic Apps</div>
              </div>
              
              <div className="space-y-4">
                {COMPARISON.map((row) => (
                  <div key={row.feature} className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-sm">{row.feature}</div>
                    <div className="flex justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#E63946]" />
                    </div>
                    <div className="flex justify-center">
                      <X className="w-5 h-5 text-[#3A3A3A]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-[#A5A5A5]">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <div className="text-3xl font-bold mb-4">$0</div>
              <p className="text-sm text-[#A5A5A5] mb-6">Basic tracking to get started</p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-[#3A3A3A] hover:bg-[#2A2A2A]">
                  Start Free
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#1A1A1A] border-2 border-[#E63946] rounded-xl p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#E63946] text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-4">$9<span className="text-base font-normal text-[#A5A5A5]">/mo</span></div>
              <p className="text-sm text-[#A5A5A5] mb-6">Full platform access</p>
              <Button className="w-full bg-[#E63946] hover:bg-[#D62828]" disabled>
                Coming Soon
              </Button>
            </div>

            {/* Elite */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Elite</h3>
              <div className="text-3xl font-bold mb-4">$15<span className="text-base font-normal text-[#A5A5A5]">/mo</span></div>
              <p className="text-sm text-[#A5A5A5] mb-6">Advanced analytics + projections</p>
              <Button variant="outline" className="w-full border-[#3A3A3A] hover:bg-[#2A2A2A]" disabled>
                Coming Soon
              </Button>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-sm text-[#E63946] hover:underline">
              View full pricing details
            </Link>
          </div>
        </div>
      </section>

      {/* Target Athletes Section */}
      <section className="py-20 sm:py-28 bg-[#1A1A1A] border-y border-[#2A2A2A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built For Athletes Who Train Seriously</h2>
          <p className="text-[#A5A5A5] max-w-2xl mx-auto mb-10">
            SpartanLab is designed for those committed to mastering advanced bodyweight strength.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {['Calisthenics Athletes', 'Streetlifting Competitors', 'Gymnasts', 'Bodyweight Specialists'].map((athlete) => (
              <div
                key={athlete}
                className="px-5 py-2.5 bg-[#121212] border border-[#2A2A2A] rounded-full text-sm font-medium"
              >
                {athlete}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-b from-[#1A1A1A] to-[#121212] border border-[#2A2A2A] rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Train Smarter. Progress Faster.
            </h2>
            <p className="text-[#A5A5A5] max-w-xl mx-auto mb-8">
              Stop guessing and start tracking. Explore SpartanLab and take control of your calisthenics progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-[#E63946] hover:bg-[#D62828] px-10 h-12 text-base">
                  Explore Platform
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] px-10 h-12 text-base">
                  See Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
