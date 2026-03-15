import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle, XCircle, Layers, Zap, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Front Lever Row Guide | Technique, Progressions & Skill Transfer | SpartanLab',
  description: 'Master the front lever row with proper technique, common mistake fixes, and progression paths. Learn how this exercise builds front lever strength and horizontal pulling power.',
  keywords: ['front lever row', 'front lever row technique', 'horizontal pulling', 'calisthenics', 'advanced pulling', 'lat strength'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/exercises/front-lever-row`,
  },
  openGraph: {
    title: 'Front Lever Row Exercise Guide | SpartanLab',
    description: 'Complete front lever row guide with technique, progressions, and skill transfer connections.',
    url: `${SITE_CONFIG.url}/exercises/front-lever-row`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Front Lever Row Exercise Guide',
    description: 'Comprehensive guide to the front lever row including technique, progressions, and skill transfer to front lever mastery.',
    url: `${SITE_CONFIG.url}/exercises/front-lever-row`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Exercises', url: '/exercises' },
    { name: 'Front Lever Row', url: '/exercises/front-lever-row' },
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'ExercisePlan',
    name: 'Front Lever Row',
    exerciseType: 'Strength',
    activityDuration: 'PT5S',
    workload: 'Bodyweight',
  },
]

const musclesWorked = [
  { name: 'Latissimus Dorsi', role: 'Primary horizontal pulling power', primary: true },
  { name: 'Posterior Deltoids', role: 'Shoulder extension in horizontal plane', primary: true },
  { name: 'Rhomboids & Mid Traps', role: 'Scapular retraction and depression', primary: false },
  { name: 'Biceps Brachii', role: 'Elbow flexion assistance', primary: false },
  { name: 'Core (Rectus Abdominis)', role: 'Maintaining body line tension', primary: true },
  { name: 'Lower Back (Erector Spinae)', role: 'Posterior chain stability', primary: false },
]

const techniqueSteps = [
  'Start in a front lever hold position (tuck, advanced tuck, or straddle based on level)',
  'Maintain a rigid, hollow body line with hips level with shoulders',
  'Pull your body toward the bar by driving elbows back',
  'Keep arms close to body and retract shoulder blades fully',
  'Touch chest to bar while maintaining body position',
  'Lower with control, extending arms fully before next rep',
]

const commonMistakes = [
  { title: 'Hips Dropping', description: 'Allowing hips to sag below shoulder level. This reduces core demand and compromises the movement pattern.' },
  { title: 'Using Momentum', description: 'Swinging or kipping to complete reps. Front lever rows should be strict with controlled tempo.' },
  { title: 'Incomplete Retraction', description: 'Not pulling shoulder blades together fully at top. Full retraction maximizes lat and rear delt engagement.' },
  { title: 'Bent Body Line', description: 'Breaking the hollow position during the pull. Maintain rigid core tension throughout.' },
]

const progressions = [
  { name: 'Tuck Front Lever Row', description: 'Knees tucked to chest, shortest lever', level: 'Intermediate' },
  { name: 'Advanced Tuck FL Row', description: 'Back parallel, knees still tucked', level: 'Intermediate' },
  { name: 'One-Leg FL Row', description: 'One leg extended for increased difficulty', level: 'Advanced' },
  { name: 'Straddle Front Lever Row', description: 'Legs spread wide, significant lever increase', level: 'Advanced' },
  { name: 'Full Front Lever Row', description: 'Legs together and extended, maximum difficulty', level: 'Elite' },
]

const skillTransfer = [
  { skill: 'Front Lever', href: '/skills/front-lever', description: 'Directly builds the dynamic strength for static holds' },
  { skill: 'Muscle-Up', href: '/skills/muscle-up', description: 'Develops pulling strength through extended range' },
  { skill: 'One-Arm Pull-Up', href: '/guides/one-arm-pull-up', description: 'Builds unilateral pulling capacity' },
]

export default function FrontLeverRowExercisePage() {
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
          <span className="text-[#E6E9EF]">Front Lever Row</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/20 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#C1121F] uppercase tracking-wider">Advanced Exercise</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Front Lever Row</h1>
            </div>
          </div>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            The front lever row is an advanced horizontal pulling exercise that builds tremendous lat and core strength. 
            It is one of the most effective exercises for developing the dynamic pulling power needed for front lever mastery.
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
            How to Perform Front Lever Rows
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
            Front lever rows directly build strength for these advanced calisthenics skills:
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
              Front lever rows are typically used in:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                <Link href="/skills/front-lever" className="hover:text-[#E6E9EF] underline">Front Lever Progression</Link> - As a primary strength builder
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                Pull day training - For advanced horizontal pulling
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                <Link href="/calisthenics-strength-standards" className="hover:text-[#E6E9EF] underline">Strength testing</Link> - Benchmark for pulling ability
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
