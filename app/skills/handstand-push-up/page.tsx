import { Metadata } from 'next'
import Link from 'next/link'
import { Hand, Dumbbell, ArrowRight, BookOpen, AlertTriangle, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Handstand Push-Up Training Hub | Complete Guide | SpartanLab',
  description: 'Master the handstand push-up with comprehensive training resources. Progression guides, training tips, and expert recommendations for vertical pressing strength.',
  keywords: ['handstand push-up', 'HSPU', 'handstand press', 'calisthenics', 'vertical pressing', 'shoulder strength'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/skills/handstand-push-up`,
  },
  openGraph: {
    title: 'Handstand Push-Up Training Hub | SpartanLab',
    description: 'Master the handstand push-up with comprehensive training resources and progression guides.',
    url: `${SITE_CONFIG.url}/skills/handstand-push-up`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Handstand Push-Up Training Hub',
    description: 'Comprehensive guide to handstand push-up training including progressions and training resources.',
    url: `${SITE_CONFIG.url}/skills/handstand-push-up`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Handstand Push-Up', url: '/skills/handstand-push-up' },
  ]),
]

const progressionStages = [
  { name: 'Pike Push-Up', reps: '15-20 reps', description: 'Elevated feet, hips high' },
  { name: 'Box Pike Push-Up', reps: '12-15 reps', description: 'Feet on box, increased angle' },
  { name: 'Wall HSPU (Face Wall)', reps: '8-12 reps', description: 'Chest facing wall, partial ROM' },
  { name: 'Wall HSPU (Back to Wall)', reps: '5-8 reps', description: 'Full ROM against wall' },
  { name: 'Freestanding HSPU', reps: '1-5 reps', description: 'No wall support' },
]

const keyMuscles = [
  { name: 'Anterior Deltoids', role: 'Primary pressing muscles' },
  { name: 'Triceps', role: 'Elbow extension and lockout' },
  { name: 'Upper Chest', role: 'Pressing assistance' },
  { name: 'Core / Stabilizers', role: 'Balance and body control' },
]

const commonMistakes = [
  { title: 'Flared Elbows', description: 'Elbows flaring out instead of tracking at 45 degrees.' },
  { title: 'Incomplete ROM', description: 'Not going deep enough to head touch or parallettes.' },
  { title: 'Arched Back', description: 'Excessive arch instead of maintaining hollow body position.' },
  { title: 'Weak Handstand', description: 'Attempting HSPU before solid wall handstand foundation.' },
]

const trainingResources = [
  { title: 'Handstand Training Guide', href: '/guides/handstand-training', description: 'Build balance and control first' },
  { title: 'Pike Push-Up Progression', href: '/guides/pike-push-up-progression', description: 'Foundation for vertical pressing' },
  { title: 'Shoulder Mobility', href: '/guides/shoulder-mobility', description: 'Prerequisite flexibility work' },
  { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your readiness benchmarks' },
]

export default function HSPUHubPage() {
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
          <span className="text-[#E6E9EF]">Handstand Push-Up</span>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Hand className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Hub</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Handstand Push-Up</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The handstand push-up is the ultimate vertical pressing movement in calisthenics. 
            It builds exceptional shoulder strength, upper body pressing power, and requires 
            solid balance and body control in the inverted position.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Intermediate-Advanced</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Vertical Press</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Balance Required</span>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="grid sm:grid-cols-2 gap-4 mb-12">
          <Link href="/guides/handstand-training">
            <Card className="bg-[#C1121F]/10 border-[#C1121F]/30 p-5 h-full hover:bg-[#C1121F]/15 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Hand className="w-6 h-6 text-[#C1121F]" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF]">Handstand Foundation</h3>
                  <p className="text-sm text-[#A5A5A5]">Build balance first</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#C1121F] ml-auto" />
              </div>
            </Card>
          </Link>
          <Link href="/guides/hspu-progression">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5 h-full hover:border-[#C1121F]/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#C1121F]" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF]">HSPU Progression Guide</h3>
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
            <Link href="/guides/hspu-progression" className="text-sm text-[#C1121F] hover:underline flex items-center gap-1">
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
              Build a personalized program that integrates handstand push-up training with your other goals.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/calisthenics-program-builder">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  Build Your Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/calisthenics-strength-standards">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                  Check Strength Standards
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* Related Skills */}
        <section>
          <h2 className="text-xl font-bold mb-4">Related Skills</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/skills/planche">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Planche</h3>
                <p className="text-xs text-[#6B7280]">Horizontal pushing power</p>
              </Card>
            </Link>
            <Link href="/skills/muscle-up">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Muscle-Up</h3>
                <p className="text-xs text-[#6B7280]">Combined push and pull</p>
              </Card>
            </Link>
            <Link href="/skills/front-lever">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Front Lever</h3>
                <p className="text-xs text-[#6B7280]">Pulling counterpart</p>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
