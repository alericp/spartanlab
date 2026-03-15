import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, Calculator, BookOpen, AlertTriangle, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Front Lever Training Hub | Complete Guide | SpartanLab',
  description: 'Master the front lever with comprehensive training resources. Progression guides, readiness calculators, training tips, and expert recommendations for all levels.',
  keywords: ['front lever', 'front lever training', 'front lever progression', 'calisthenics', 'pulling strength', 'horizontal pull'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/skills/front-lever`,
  },
  openGraph: {
    title: 'Front Lever Training Hub | SpartanLab',
    description: 'Master the front lever with comprehensive training resources, progression guides, and readiness calculators.',
    url: `${SITE_CONFIG.url}/skills/front-lever`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Front Lever Training Hub',
    description: 'Comprehensive guide to front lever training including progressions, readiness assessment, and training resources.',
    url: `${SITE_CONFIG.url}/skills/front-lever`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Front Lever', url: '/skills/front-lever' },
  ]),
]

const progressionStages = [
  { name: 'Tuck Front Lever', hold: '10-20s', description: 'Knees to chest, body horizontal' },
  { name: 'Advanced Tuck', hold: '10-15s', description: 'Hips extend, back flattens' },
  { name: 'One Leg Front Lever', hold: '8-12s', description: 'One leg extended' },
  { name: 'Straddle Front Lever', hold: '8-12s', description: 'Legs straddled wide' },
  { name: 'Full Front Lever', hold: '5-10s', description: 'Legs together, fully horizontal' },
]

const keyMuscles = [
  { name: 'Latissimus Dorsi', role: 'Primary pulling muscles' },
  { name: 'Core / Rectus Abdominis', role: 'Maintains body tension' },
  { name: 'Rear Deltoids', role: 'Shoulder stabilization' },
  { name: 'Lower Back', role: 'Spinal extension control' },
]

const commonMistakes = [
  { title: 'Pulling Instead of Holding', description: 'Using active pulling motion instead of static hollow body tension.' },
  { title: 'Bent Arms', description: 'Allowing elbows to bend rather than maintaining straight-arm strength.' },
  { title: 'Insufficient Pulling Strength', description: 'Attempting holds without adequate weighted pull-up foundation.' },
  { title: 'Neglecting Core Work', description: 'Skipping hollow body holds and core compression training.' },
]

const trainingResources = [
  { title: 'Pull-Up Strength Guide', href: '/guides/pull-up-strength', description: 'Build your pulling foundation' },
  { title: 'Core Compression Training', href: '/guides/core-compression-training', description: 'Essential for horizontal holds' },
  { title: 'Weighted Pull-Up Programming', href: '/guides/weighted-pull-up-progression', description: 'Add load to accelerate progress' },
  { title: 'Strength Standards', href: '/calisthenics-strength-standards', description: 'Check your readiness benchmarks' },
]

export default function FrontLeverHubPage() {
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
          <span className="text-[#E6E9EF]">Front Lever</span>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Hub</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Front Lever</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The front lever is the ultimate test of horizontal pulling strength. This isometric hold requires 
            elite lat strength, core tension, and body control to maintain a perfectly horizontal body position 
            while hanging from a bar.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Advanced Skill</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Pulling Focus</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Isometric Hold</span>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="grid sm:grid-cols-2 gap-4 mb-12">
          <Link href="/front-lever-readiness-calculator">
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
          <Link href="/front-lever-progression">
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
            <Link href="/front-lever-progression" className="text-sm text-[#C1121F] hover:underline flex items-center gap-1">
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
              Build a personalized program that integrates front lever training with your other goals.
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
                <p className="text-xs text-[#6B7280]">The pushing counterpart</p>
              </Card>
            </Link>
            <Link href="/skills/muscle-up">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Muscle-Up</h3>
                <p className="text-xs text-[#6B7280]">Explosive pulling power</p>
              </Card>
            </Link>
            <Link href="/planche-progression">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Back Lever</h3>
                <p className="text-xs text-[#6B7280]">The reverse horizontal hold</p>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
