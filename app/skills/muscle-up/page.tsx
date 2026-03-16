import { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Dumbbell, ArrowRight, Calculator, BookOpen, AlertTriangle, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Muscle-Up Training Hub | Complete Guide | SpartanLab',
  description: 'Master the muscle-up with comprehensive training resources. Progression guides, readiness calculators, training tips, and expert recommendations.',
  keywords: ['muscle-up', 'muscle up training', 'bar muscle up', 'calisthenics', 'explosive pulling', 'transition strength'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/skills/muscle-up`,
  },
  openGraph: {
    title: 'Muscle-Up Training Hub | SpartanLab',
    description: 'Master the muscle-up with comprehensive training resources, progression guides, and readiness calculators.',
    url: `${SITE_CONFIG.url}/skills/muscle-up`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Muscle-Up Training Hub',
    description: 'Comprehensive guide to muscle-up training including progressions, readiness assessment, and training resources.',
    url: `${SITE_CONFIG.url}/skills/muscle-up`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Muscle-Up', url: '/skills/muscle-up' },
  ]),
]

const progressionStages = [
  { name: 'Pull-Up Foundation', reps: '10-12 strict', description: 'Strong pulling base with full ROM' },
  { name: 'Chest-to-Bar', reps: '8-10 reps', description: 'High pull capability' },
  { name: 'Explosive Pull-Ups', reps: '6-8 reps', description: 'Generate upward momentum' },
  { name: 'Muscle-Up Negatives', reps: '5-8 negatives', description: 'Learn the transition path' },
  { name: 'Full Muscle-Up', reps: '1+ clean', description: 'Complete the movement' },
]

const keyMuscles = [
  { name: 'Latissimus Dorsi', role: 'Primary pulling power' },
  { name: 'Chest / Pectorals', role: 'Transition and press-out' },
  { name: 'Triceps', role: 'Lockout strength' },
  { name: 'Core', role: 'Hip drive and control' },
]

const commonMistakes = [
  { title: 'Weak Explosive Pull', description: 'Insufficient height on the pull phase, making transition impossible.' },
  { title: 'Skipping Negatives', description: 'Not learning the transition path through controlled eccentric work.' },
  { title: 'Insufficient Dip Strength', description: 'Weak straight bar dip making the press-out phase difficult.' },
  { title: 'Poor Timing', description: 'Not coordinating the hip drive with the pull for maximum height.' },
]

const trainingResources = [
  { title: 'Pull-Up Strength Guide', href: '/guides/pull-up-strength', description: 'Build your pulling foundation' },
  { title: 'Explosive Pull Training', href: '/guides/explosive-pull-training', description: 'Generate power for the transition' },
  { title: 'Chest-to-Bar Progression', href: '/guides/chest-to-bar-pull-ups', description: 'Build the required pull height' },
  { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your readiness benchmarks' },
]

export default function MuscleUpHubPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/skills" className="hover:text-[#E6E9EF]">Skills</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Muscle-Up</span>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Hub</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Muscle-Up</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The muscle-up is the gateway to bar skills, combining explosive pulling strength with 
            transition mechanics to get you from below to above the bar in one fluid movement.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Intermediate-Advanced</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Pull + Push</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Explosive</span>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="grid sm:grid-cols-2 gap-4 mb-12">
          <Link href="/muscle-up-readiness-calculator">
            <Card className="bg-[#C1121F]/10 border-[#C1121F]/30 p-5 h-full hover:bg-[#C1121F]/15 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-[#C1121F]" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF]">Check Your Readiness</h3>
                  <p className="text-sm text-[#A5A5A5]">Take the readiness calculator</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#C1121F] ml-auto" />
              </div>
            </Card>
          </Link>
          <Link href="/guides/muscle-up-training">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5 h-full hover:border-[#C1121F]/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#C1121F]" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF]">Full Training Guide</h3>
                  <p className="text-sm text-[#A5A5A5]">Detailed training walkthrough</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#6B7280] ml-auto" />
              </div>
            </Card>
          </Link>
        </section>

        {/* Key Muscles */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Key Muscles Used</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {keyMuscles.map((muscle) => (
              <div key={muscle.name} className="flex items-center gap-3 p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
                <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                <div>
                  <p className="font-medium text-[#E6E9EF]">{muscle.name}</p>
                  <p className="text-xs text-[#6B7280]">{muscle.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Progression Stages */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Progression Stages</h2>
            <Link href="/guides/muscle-up-training" className="text-sm text-[#C1121F] hover:underline flex items-center gap-1">
              Full guide <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {progressionStages.map((stage, index) => (
              <div key={stage.name} className="flex items-center gap-4 p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
                <div className="w-8 h-8 rounded-full bg-[#2B313A] flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#E6E9EF]">{stage.name}</p>
                  <p className="text-xs text-[#6B7280]">{stage.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#C1121F]">{stage.reps}</p>
                  <p className="text-xs text-[#6B7280]">target</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#E63946]" />
            <h2 className="text-xl font-bold">Common Training Mistakes</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {commonMistakes.map((mistake) => (
              <div key={mistake.title} className="p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
                <h3 className="font-medium text-[#E6E9EF] mb-1">{mistake.title}</h3>
                <p className="text-sm text-[#6B7280]">{mistake.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Training Resources */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Training Resources</h2>
          <div className="space-y-3">
            {trainingResources.map((resource) => (
              <Link key={resource.href} href={resource.href}>
                <div className="flex items-center justify-between p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium text-[#E6E9EF]">{resource.title}</p>
                    <p className="text-sm text-[#6B7280]">{resource.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#6B7280]" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Next Steps CTA */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-[#C1121F]/20 to-[#1A1F26] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-2">Ready to Train?</h2>
            <p className="text-[#A5A5A5] mb-4">
              SpartanLab creates adaptive programs that target your specific limiting factors and integrate muscle-up training with your other goals.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/onboarding">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  Generate Your Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/muscle-up-readiness-calculator">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                  Check Your Readiness First
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* Related Skills */}
        <section>
          <h2 className="text-xl font-bold mb-4">Related Skills</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/skills/front-lever">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Front Lever</h3>
                <p className="text-xs text-[#6B7280]">Build pulling strength</p>
              </Card>
            </Link>
            <Link href="/skills/planche">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Planche</h3>
                <p className="text-xs text-[#6B7280]">Build pushing strength</p>
              </Card>
            </Link>
            <Link href="/skills/handstand-push-up">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Handstand Push-Up</h3>
                <p className="text-xs text-[#6B7280]">Vertical pressing power</p>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
