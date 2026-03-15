import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, Calculator, BookOpen, AlertTriangle, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Planche Training Hub | Complete Guide | SpartanLab',
  description: 'Master the planche with comprehensive training resources. Progression guides, readiness calculators, training tips, and expert recommendations for all levels.',
  keywords: ['planche', 'planche training', 'planche progression', 'calisthenics', 'pushing strength', 'straight arm strength'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/skills/planche`,
  },
  openGraph: {
    title: 'Planche Training Hub | SpartanLab',
    description: 'Master the planche with comprehensive training resources, progression guides, and readiness calculators.',
    url: `${SITE_CONFIG.url}/skills/planche`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Planche Training Hub',
    description: 'Comprehensive guide to planche training including progressions, readiness assessment, and training resources.',
    url: `${SITE_CONFIG.url}/skills/planche`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Planche', url: '/skills/planche' },
  ]),
]

const progressionStages = [
  { name: 'Planche Lean', hold: '30-60s', description: 'Forward lean on floor, wrists conditioned' },
  { name: 'Tuck Planche', hold: '10-20s', description: 'Knees tucked, hips elevated' },
  { name: 'Advanced Tuck', hold: '10-15s', description: 'Back parallel, hips higher' },
  { name: 'Straddle Planche', hold: '5-10s', description: 'Legs straddled and extended' },
  { name: 'Full Planche', hold: '3-5s', description: 'Legs together, body horizontal' },
]

const keyMuscles = [
  { name: 'Anterior Deltoids', role: 'Primary shoulder flexion' },
  { name: 'Chest / Pectorals', role: 'Horizontal pressing support' },
  { name: 'Core / Rectus Abdominis', role: 'Body line maintenance' },
  { name: 'Serratus Anterior', role: 'Scapular protraction' },
]

const commonMistakes = [
  { title: 'Insufficient Lean', description: 'Not leaning forward enough to properly load the shoulders.' },
  { title: 'Bent Arms', description: 'Allowing elbows to bend rather than maintaining straight-arm strength.' },
  { title: 'Rushing Progressions', description: 'Moving to harder variations before adequate hold time at current level.' },
  { title: 'Ignoring Protraction', description: 'Failing to maintain shoulder protraction throughout the hold.' },
]

const trainingResources = [
  { title: 'Planche Lean Guide', href: '/guides/planche-leans', description: 'Build wrist and shoulder conditioning' },
  { title: 'Straight-Arm Strength', href: '/guides/straight-arm-strength', description: 'Essential for planche holds' },
  { title: 'Weighted Dip Progression', href: '/guides/weighted-dip-progression', description: 'Build pushing foundation' },
  { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your readiness benchmarks' },
]

export default function PlancheHubPage() {
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
          <span className="text-[#E6E9EF]">Planche</span>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Hub</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Planche</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The planche is the pinnacle of pushing strength in calisthenics. This gravity-defying hold requires 
            extreme shoulder strength, straight-arm power, and years of dedicated training to achieve the full variation.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Elite Skill</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Pushing Focus</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Straight-Arm</span>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="grid sm:grid-cols-2 gap-4 mb-12">
          <Link href="/planche-readiness-calculator">
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
          <Link href="/planche-progression">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5 h-full hover:border-[#C1121F]/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#C1121F]" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF]">Full Progression Guide</h3>
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
            <Link href="/planche-progression" className="text-sm text-[#C1121F] hover:underline flex items-center gap-1">
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
                  <p className="text-sm font-medium text-[#C1121F]">{stage.hold}</p>
                  <p className="text-xs text-[#6B7280]">target hold</p>
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
              Build a personalized program that integrates planche training with your other goals.
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
            <Link href="/skills/front-lever">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Front Lever</h3>
                <p className="text-xs text-[#6B7280]">The pulling counterpart</p>
              </Card>
            </Link>
            <Link href="/skills/handstand-push-up">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Handstand Push-Up</h3>
                <p className="text-xs text-[#6B7280]">Vertical pressing power</p>
              </Card>
            </Link>
            <Link href="/skills/muscle-up">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Muscle-Up</h3>
                <p className="text-xs text-[#6B7280]">Combined push and pull</p>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
