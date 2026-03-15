import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle, XCircle, Layers, Zap, BookOpen, Timer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'L-Sit Guide | Technique, Progressions & Skill Transfer | SpartanLab',
  description: 'Master the L-sit with proper technique, common mistake fixes, and progression paths. Learn how this core exercise builds compression strength for advanced calisthenics skills.',
  keywords: ['l-sit', 'l sit', 'core exercise', 'calisthenics', 'gymnastics', 'hip flexor strength', 'compression'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/exercises/l-sit`,
  },
  openGraph: {
    title: 'L-Sit Exercise Guide | SpartanLab',
    description: 'Complete L-sit guide with technique, progressions, and skill transfer connections.',
    url: `${SITE_CONFIG.url}/exercises/l-sit`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'L-Sit Exercise Guide',
    description: 'Comprehensive guide to the L-sit including technique, progressions, and skill transfer to advanced calisthenics movements.',
    url: `${SITE_CONFIG.url}/exercises/l-sit`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Exercises', url: '/exercises' },
    { name: 'L-Sit', url: '/exercises/l-sit' },
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'ExercisePlan',
    name: 'L-Sit',
    exerciseType: 'Isometric',
    activityDuration: 'PT30S',
    workload: 'Bodyweight',
  },
]

const musclesWorked = [
  { name: 'Hip Flexors (Iliopsoas)', role: 'Primary leg elevation', primary: true },
  { name: 'Rectus Abdominis', role: 'Core compression and stabilization', primary: true },
  { name: 'Quadriceps', role: 'Knee extension - keeping legs straight', primary: false },
  { name: 'Triceps', role: 'Arm lockout and body elevation', primary: false },
  { name: 'Serratus Anterior', role: 'Scapular depression and protraction', primary: false },
]

const techniqueSteps = [
  'Place hands on parallettes, floor, or dip bars at your sides',
  'Lock out arms completely with shoulders depressed (push down away from ears)',
  'Engage core and lift your body off the ground',
  'Raise legs to horizontal with knees fully locked',
  'Point toes and maintain the L position',
  'Hold while breathing steadily, keeping shoulders down',
]

const commonMistakes = [
  { title: 'Bent Knees', description: 'Allowing knees to bend due to tight hamstrings or weak quads. Work on flexibility and leg strength separately.' },
  { title: 'Shoulders Shrugged', description: 'Elevating shoulders toward ears instead of pressing down. This makes the hold much harder and limits longevity.' },
  { title: 'Rounded Lower Back', description: 'Slouching the lower back instead of maintaining neutral spine. This indicates weak core compression.' },
  { title: 'Legs Below Horizontal', description: 'Failing to raise legs to 90 degrees. Build hip flexor strength with compression work.' },
]

const progressions = [
  { name: 'Tuck L-Sit', description: 'Knees bent, feet off floor', level: 'Foundation' },
  { name: 'One-Leg L-Sit', description: 'One leg extended, one tucked', level: 'Beginner' },
  { name: 'Advanced Tuck L-Sit', description: 'Knees bent but legs compressed to chest', level: 'Intermediate' },
  { name: 'Full L-Sit', description: 'Legs straight and horizontal', level: 'Intermediate' },
  { name: 'V-Sit', description: 'Legs raised above horizontal', level: 'Advanced' },
  { name: 'Manna', description: 'Ultimate compression skill', level: 'Elite' },
]

const skillTransfer = [
  { skill: 'Front Lever', href: '/skills/front-lever', description: 'Same compression pattern, different plane' },
  { skill: 'Planche', href: '/skills/planche', description: 'Core compression essential for body position' },
  { skill: 'V-Sit', href: '/guides/v-sit-progression', description: 'Direct progression from L-sit' },
]

export default function LSitExercisePage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/exercises" className="hover:text-[#E6E9EF]">Exercises</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">L-Sit</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#C1121F] uppercase tracking-wider">Core & Static Holds</span>
              <h1 className="text-3xl sm:text-4xl font-bold">L-Sit</h1>
            </div>
          </div>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            The L-sit is a fundamental compression hold that builds hip flexor strength, core stability, and scapular control. 
            It serves as the foundation for advanced holds like the V-sit and Manna.
          </p>
        </header>

        {/* Muscles Worked */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#C1121F]" />
            Primary Muscles Worked
          </h2>
          <div className="grid gap-3">
            {musclesWorked.map((muscle) => (
              <div 
                key={muscle.name}
                className={`p-4 rounded-lg border ${
                  muscle.primary 
                    ? 'bg-[#C1121F]/10 border-[#C1121F]/30' 
                    : 'bg-[#1C1F26] border-[#2B313A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${muscle.primary ? 'text-[#E6E9EF]' : 'text-[#A4ACB8]'}`}>
                    {muscle.name}
                  </span>
                  {muscle.primary && (
                    <span className="text-xs bg-[#C1121F]/20 text-[#C1121F] px-2 py-0.5 rounded">Primary</span>
                  )}
                </div>
                <p className="text-sm text-[#6B7280] mt-1">{muscle.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technique */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            How to Perform the L-Sit
          </h2>
          <Card className="bg-[#1C1F26] border-[#2B313A] p-6">
            <ol className="space-y-4">
              {techniqueSteps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#C1121F]/20 text-[#C1121F] flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-[#A4ACB8] pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>

        {/* Common Mistakes */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Common Mistakes to Avoid
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {commonMistakes.map((mistake) => (
              <Card key={mistake.title} className="bg-[#1C1F26] border-[#2B313A] p-4">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">{mistake.title}</h3>
                <p className="text-sm text-[#6B7280]">{mistake.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Progressions */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#C1121F]" />
            Progressions & Variations
          </h2>
          <div className="space-y-3">
            {progressions.map((prog) => (
              <div key={prog.name} className="flex items-center gap-4 p-4 bg-[#1C1F26] rounded-lg border border-[#2B313A]">
                <div className="flex-1">
                  <h3 className="font-medium text-[#E6E9EF]">{prog.name}</h3>
                  <p className="text-sm text-[#6B7280]">{prog.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  prog.level === 'Foundation' ? 'bg-gray-500/20 text-gray-400' :
                  prog.level === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                  prog.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  prog.level === 'Advanced' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {prog.level}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Skill Transfer */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#C1121F]" />
            Skill Transfer
          </h2>
          <p className="text-[#A4ACB8] mb-4">
            The L-sit builds compression strength that transfers to these skills:
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {skillTransfer.map((skill) => (
              <Link key={skill.skill} href={skill.href}>
                <Card className="bg-[#1C1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                  <h3 className="font-medium text-[#E6E9EF] mb-1">{skill.skill}</h3>
                  <p className="text-sm text-[#6B7280]">{skill.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Training Integration */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C1121F]" />
            Where This Exercise Fits in Training
          </h2>
          <Card className="bg-[#1C1F26] border-[#2B313A] p-6">
            <p className="text-[#A4ACB8] mb-4">
              L-sits are typically used in:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                Skill work sessions - As a primary compression skill
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                Core training - Integrated with other holds
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                <Link href="/calisthenics-strength-standards" className="hover:text-[#E6E9EF] underline">Strength testing</Link> - L-sit time is a core benchmark
              </li>
            </ul>
            <Link href="/calisthenics-program-builder">
              <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
                Build Your Training Program
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </section>

        {/* Back to Exercises */}
        <div className="pt-6 border-t border-[#2B313A]">
          <Link 
            href="/exercises" 
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E6E9EF] transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Exercise Library
          </Link>
        </div>
      </div>
    </main>
  )
}
