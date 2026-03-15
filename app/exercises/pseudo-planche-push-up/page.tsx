import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle, XCircle, Layers, Zap, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Pseudo Planche Push-Up Guide | Technique, Progressions & Skill Transfer | SpartanLab',
  description: 'Master the pseudo planche push-up with proper technique, common mistake fixes, and progression paths. Learn how this exercise builds planche-specific pushing strength.',
  keywords: ['pseudo planche push-up', 'PPPU', 'planche training', 'calisthenics', 'pushing exercises', 'straight arm strength'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/exercises/pseudo-planche-push-up`,
  },
  openGraph: {
    title: 'Pseudo Planche Push-Up Exercise Guide | SpartanLab',
    description: 'Complete PPPU guide with technique, progressions, and skill transfer connections.',
    url: `${SITE_CONFIG.url}/exercises/pseudo-planche-push-up`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Pseudo Planche Push-Up Exercise Guide',
    description: 'Comprehensive guide to the pseudo planche push-up including technique, progressions, and skill transfer to planche.',
    url: `${SITE_CONFIG.url}/exercises/pseudo-planche-push-up`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Exercises', url: '/exercises' },
    { name: 'Pseudo Planche Push-Up', url: '/exercises/pseudo-planche-push-up' },
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'ExercisePlan',
    name: 'Pseudo Planche Push-Up',
    exerciseType: 'Strength',
    activityDuration: 'PT3S',
    workload: 'Bodyweight',
  },
]

const musclesWorked = [
  { name: 'Anterior Deltoids', role: 'Primary pushing through forward lean', primary: true },
  { name: 'Chest (Pectoralis)', role: 'Horizontal pushing assistance', primary: true },
  { name: 'Serratus Anterior', role: 'Scapular protraction - critical for planche', primary: true },
  { name: 'Triceps', role: 'Elbow extension', primary: false },
  { name: 'Core', role: 'Maintaining hollow body position', primary: false },
  { name: 'Wrists', role: 'Supporting forward lean load', primary: false },
]

const techniqueSteps = [
  'Start in push-up position with hands turned out 45 degrees for wrist comfort',
  'Lean forward significantly - hands should be near hip level, not chest level',
  'Protract your scapulae (round upper back slightly, push shoulder blades apart)',
  'Maintain a slight hollow body position throughout',
  'Lower with control, keeping the forward lean constant',
  'Push back up without shifting weight backward',
]

const commonMistakes = [
  { title: 'Insufficient Lean', description: 'Not leaning forward enough reduces the planche-specific training effect. Hands should be well behind the shoulders.' },
  { title: 'Lost Protraction', description: 'Allowing shoulder blades to squeeze together. Keep scapulae protracted throughout the movement.' },
  { title: 'Arched Back', description: 'Breaking hollow position and hyperextending the lower back. This reduces core engagement.' },
  { title: 'Shifting Weight Back', description: 'Moving weight backward during the push. Maintain constant forward lean throughout.' },
]

const progressions = [
  { name: 'Planche Lean (Static)', description: 'Hold the leaned position without movement', level: 'Foundation' },
  { name: 'Light Lean PPPU', description: 'Small forward lean, full push-up ROM', level: 'Beginner' },
  { name: 'Moderate Lean PPPU', description: 'Hands near belly button level', level: 'Intermediate' },
  { name: 'Full Lean PPPU', description: 'Hands at hip level, maximum lean', level: 'Advanced' },
  { name: 'Feet Elevated PPPU', description: 'Increased difficulty with elevation', level: 'Advanced' },
  { name: 'Ring PPPU', description: 'Unstable surface increases demand', level: 'Elite' },
]

const skillTransfer = [
  { skill: 'Planche', href: '/skills/planche', description: 'Directly builds planche-specific pushing strength' },
  { skill: 'Handstand Push-Up', href: '/skills/handstand-push-up', description: 'Develops shoulder pressing power' },
  { skill: 'Dip', href: '/exercises/dip', description: 'Complements dip strength for overall pushing' },
]

export default function PseudoPlanchePushUpExercisePage() {
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
          <span className="text-[#E6E9EF]">Pseudo Planche Push-Up</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/20 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#C1121F] uppercase tracking-wider">Pushing Exercises</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Pseudo Planche Push-Up</h1>
            </div>
          </div>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            The pseudo planche push-up (PPPU) is the most important pushing exercise for planche development. 
            By shifting weight forward, it trains the same shoulder angle and protraction pattern as the planche itself.
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
            How to Perform Pseudo Planche Push-Ups
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
            PPPUs build specific strength that transfers to these skills:
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
              PPPUs are typically used in:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                <Link href="/skills/planche" className="hover:text-[#E6E9EF] underline">Planche Progression</Link> - Primary pushing strength builder
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                Push day training - For planche-specific work
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                <Link href="/calisthenics-strength-standards" className="hover:text-[#E6E9EF] underline">Strength testing</Link> - Benchmark for lean tolerance
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
