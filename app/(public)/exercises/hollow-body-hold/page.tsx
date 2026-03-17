import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle, XCircle, Layers, Zap, BookOpen, Timer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Hollow Body Hold Guide | Technique, Progressions & Skill Transfer | SpartanLab',
  description: 'Master the hollow body hold with proper technique, common mistake fixes, and progression paths. Learn how this foundational core exercise builds tension for advanced calisthenics.',
  keywords: ['hollow body hold', 'hollow hold', 'core exercise', 'calisthenics', 'gymnastics', 'core tension'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/exercises/hollow-body-hold`,
  },
  openGraph: {
    title: 'Hollow Body Hold Exercise Guide | SpartanLab',
    description: 'Complete hollow body hold guide with technique, progressions, and skill transfer connections.',
    url: `${SITE_CONFIG.url}/exercises/hollow-body-hold`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Hollow Body Hold Exercise Guide',
    description: 'Comprehensive guide to the hollow body hold including technique, progressions, and skill transfer to advanced calisthenics movements.',
    url: `${SITE_CONFIG.url}/exercises/hollow-body-hold`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Exercises', url: '/exercises' },
    { name: 'Hollow Body Hold', url: '/exercises/hollow-body-hold' },
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'ExercisePlan',
    name: 'Hollow Body Hold',
    exerciseType: 'Isometric',
    activityDuration: 'PT60S',
    workload: 'Bodyweight',
  },
]

const musclesWorked = [
  { name: 'Rectus Abdominis', role: 'Primary flexion and compression', primary: true },
  { name: 'Transverse Abdominis', role: 'Deep core stabilization', primary: true },
  { name: 'Hip Flexors', role: 'Leg elevation and position maintenance', primary: false },
  { name: 'Serratus Anterior', role: 'Scapular protraction', primary: false },
  { name: 'Quadriceps', role: 'Knee extension and leg tension', primary: false },
]

const techniqueSteps = [
  'Lie flat on your back with arms extended overhead',
  'Press your lower back firmly into the floor - eliminate any gap',
  'Engage your core by drawing your belly button toward your spine',
  'Lift your shoulders and head off the ground, arms by ears',
  'Lift your legs off the ground with pointed toes',
  'Hold this position while breathing steadily - maintain the low back contact',
]

const commonMistakes = [
  { title: 'Lower Back Gap', description: 'Allowing space between lower back and floor. This compromises core engagement and can strain the back.' },
  { title: 'Chin Tucked Too Far', description: 'Looking at your toes instead of straight ahead. Keep a neutral neck position.' },
  { title: 'Holding Breath', description: 'Forgetting to breathe during the hold. Practice steady breathing while maintaining position.' },
  { title: 'Legs Too High', description: 'Raising legs too high reduces difficulty. Legs should be just off the floor for maximum challenge.' },
]

const progressions = [
  { name: 'Tuck Hollow Hold', description: 'Knees bent, hands by sides', level: 'Foundation' },
  { name: 'Single Leg Hollow', description: 'One leg extended, one tucked', level: 'Beginner' },
  { name: 'Standard Hollow Hold', description: 'Arms by ears, legs together and extended', level: 'Intermediate' },
  { name: 'Hollow Rocks', description: 'Rocking while maintaining hollow position', level: 'Intermediate' },
  { name: 'Weighted Hollow Hold', description: 'Holding weight overhead or between ankles', level: 'Advanced' },
]

const skillTransfer = [
  { skill: 'Front Lever', href: '/skills/front-lever', description: 'Same body tension pattern in horizontal pulling position' },
  { skill: 'Planche', href: '/skills/planche', description: 'Core compression essential for planche holds' },
  { skill: 'L-Sit', href: '/exercises/l-sit', description: 'Builds the compression strength for L-sit' },
]

export default function HollowBodyHoldExercisePage() {
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
          <span className="text-[#E6E9EF]">Hollow Body Hold</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#C1121F] uppercase tracking-wider">Core & Static Holds</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Hollow Body Hold</h1>
            </div>
          </div>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            The hollow body hold is the foundational core position in gymnastics and calisthenics. 
            Mastering this position creates the body tension pattern needed for nearly every advanced skill.
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
            How to Perform the Hollow Body Hold
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
                  'bg-orange-500/20 text-orange-400'
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
            The hollow body position directly transfers to these advanced calisthenics skills:
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
              Hollow body holds are typically used in:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                Warm-up activation - Prepare core for skill work
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                <Link href="/skills/front-lever" className="hover:text-[#E6E9EF] underline">Front Lever Training</Link> - Prerequisite body tension
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                Core finisher - End of session core work
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
