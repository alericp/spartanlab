import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import {
  Target,
  Dumbbell,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Training Programs - Calisthenics & Hybrid Strength',
  description: 'Structured training programs for calisthenics skills, weighted calisthenics, and hybrid strength. Front lever, planche, weighted pull-ups, and complete bodyweight programming.',
  keywords: [
    'calisthenics programs',
    'calisthenics training programs',
    'bodyweight training programs',
    'front lever program',
    'planche program',
    'weighted calisthenics',
    'hybrid strength training',
    'streetlifting programs',
  ],
  openGraph: {
    title: 'Training Programs - SpartanLab',
    description: 'Structured calisthenics and hybrid strength training programs.',
    type: 'website',
  },
}

const PROGRAMS = [
  {
    title: 'Front Lever Program',
    href: '/training/front-lever-program',
    description: 'Build the pulling strength, core compression, and shoulder stability required for front lever.',
    icon: Target,
    tags: ['Pulling', 'Skill'],
    color: 'text-[#C1121F]',
  },
  {
    title: 'Planche Program',
    href: '/training/planche-program',
    description: 'Develop straight-arm strength, pushing power, and wrist conditioning for planche.',
    icon: Zap,
    tags: ['Pushing', 'Skill'],
    color: 'text-amber-400',
  },
  {
    title: 'Weighted Pull-Up Program',
    href: '/training/weighted-pull-up-program',
    description: 'Build raw pulling strength with streetlifting methodology for skill transfer.',
    icon: Dumbbell,
    tags: ['Strength', 'Weighted'],
    color: 'text-blue-400',
  },
  {
    title: 'Calisthenics Program',
    href: '/training/calisthenics-program',
    description: 'Complete bodyweight training for skill mastery and strength development.',
    icon: Target,
    tags: ['Skills', 'Complete'],
    color: 'text-emerald-400',
  },
  {
    title: 'Hybrid Strength Program',
    href: '/training/hybrid-strength-program',
    description: 'Combine calisthenics skills with barbell training for complete strength.',
    icon: TrendingUp,
    tags: ['Hybrid', 'Barbell'],
    color: 'text-purple-400',
  },
]

export default function TrainingProgramsPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E6E9EF]">
      <MarketingHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C1121F]/10 text-[#C1121F] text-sm font-medium mb-6">
            <Target className="w-4 h-4" />
            Training Programs
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-balance">
            Structured Programs for <span className="text-[#C1121F]">Real Progress</span>
          </h1>
          <p className="text-xl text-[#A4ACB8] max-w-2xl mx-auto mb-4">
            Calisthenics-first programming built from real training methodologies.
          </p>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            Each program adapts to your performance and evolves with your training.
          </p>
        </div>
      </section>
      
      {/* Programs Grid */}
      <section className="py-16 sm:py-20 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid gap-4">
            {PROGRAMS.map((program) => (
              <Link
                key={program.href}
                href={program.href}
                className="group bg-[#1A1F26] border border-[#2B313A] rounded-xl p-6 hover:border-[#C1121F]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-[#0D0D0D] border border-[#2B313A] flex items-center justify-center shrink-0 ${program.color}`}>
                    <program.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                        {program.title}
                      </h2>
                      <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#C1121F] group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-[#A4ACB8] mb-3">
                      {program.description}
                    </p>
                    <div className="flex gap-2">
                      {program.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded bg-[#0D0D0D] text-[#6B7280] border border-[#2B313A]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Why Structured Programming */}
      <section className="py-16 sm:py-20 bg-[#0A0A0A] border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Why Structured Programming?
          </h2>
          <p className="text-[#6B7280] text-center max-w-xl mx-auto mb-10">
            Random workouts lead to random results. Structured programs lead to measurable progress.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-5 text-center">
              <CheckCircle2 className="w-6 h-6 text-[#C1121F] mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Progressive Overload</h3>
              <p className="text-sm text-[#6B7280]">Systematic progression based on performance, not guesswork.</p>
            </div>
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-5 text-center">
              <CheckCircle2 className="w-6 h-6 text-[#C1121F] mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Fatigue Management</h3>
              <p className="text-sm text-[#6B7280]">Volume and intensity balanced for sustainable progress.</p>
            </div>
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-5 text-center">
              <CheckCircle2 className="w-6 h-6 text-[#C1121F] mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Joint Protection</h3>
              <p className="text-sm text-[#6B7280]">Preparation protocols integrated into every session.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 sm:py-28 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Start Training Intelligently
          </h2>
          <p className="text-[#A4ACB8] max-w-xl mx-auto mb-8">
            SpartanLab analyzes your performance and builds adaptive programming. Free to start.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] px-10 h-12">
              Build Your Program
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <div className="mt-6">
            <Link 
              href="/training-systems" 
              className="text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors inline-flex items-center gap-1"
            >
              Learn about our training systems
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>
      
      <MarketingFooter />
    </div>
  )
}
