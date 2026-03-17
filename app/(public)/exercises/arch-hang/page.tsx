import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle, XCircle, Layers, Zap, BookOpen, Timer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Arch Hang Guide | Technique, Progressions & Skill Transfer | SpartanLab',
  description: 'Master the arch hang with proper technique, common mistake fixes, and progression paths. Learn how this scapular exercise builds lat engagement for front lever and muscle-up.',
  keywords: ['arch hang', 'scapular pull-up', 'lat engagement', 'calisthenics', 'front lever prep', 'pulling exercises'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/exercises/arch-hang`,
  },
  openGraph: {
    title: 'Arch Hang Exercise Guide | SpartanLab',
    description: 'Complete arch hang guide with technique, progressions, and skill transfer connections.',
    url: `${SITE_CONFIG.url}/exercises/arch-hang`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Arch Hang Exercise Guide',
    description: 'Comprehensive guide to the arch hang including technique, progressions, and skill transfer to advanced calisthenics movements.',
    url: `${SITE_CONFIG.url}/exercises/arch-hang`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Exercises', url: '/exercises' },
    { name: 'Arch Hang', url: '/exercises/arch-hang' },
  ]),
  {
    '@context': 'https://schema.org',
    '@type': 'ExercisePlan',
    name: 'Arch Hang',
    exerciseType: 'Isometric',
    activityDuration: 'PT30S',
    workload: 'Bodyweight',
  },
]

const musclesWorked = [
  { name: 'Latissimus Dorsi', role: 'Primary lat engagement and shoulder extension', primary: true },
  { name: 'Lower Trapezius', role: 'Scapular depression', primary: true },
  { name: 'Rhomboids', role: 'Scapular retraction', primary: false },
  { name: 'Rear Deltoids', role: 'Shoulder stabilization', primary: false },
  { name: 'Core', role: 'Maintaining arch position', primary: false },
]

const techniqueSteps = [
  'Hang from a bar with arms fully extended and shoulder-width grip',
  'Depress your scapulae (pull shoulders away from ears)',
  'Retract your scapulae (squeeze shoulder blades together)',
  'Create an arch by pushing chest forward and pulling hips back',
  'Engage lats fully - you should feel them contract',
  'Hold the position while maintaining steady breathing',
]

const commonMistakes = [
  { title: 'Passive Hanging', description: 'Simply hanging without engaging scapulae. The arch hang requires active lat and scap engagement.' },
  { title: 'Shrugged Shoulders', description: 'Allowing shoulders to rise toward ears. Focus on depressing and retracting.' },
  { title: 'Bent Arms', description: 'Bending elbows instead of keeping arms locked. This reduces the scapular work.' },
  { title: 'No Chest Push', description: 'Missing the arch component. Push chest forward to create the proper body position.' },
]

const progressions = [
  { name: 'Passive Hang', description: 'Just grip endurance, no engagement', level: 'Foundation' },
  { name: 'Scapular Depression', description: 'Pull shoulders down while hanging', level: 'Beginner' },
  { name: 'Active Hang', description: 'Depression plus slight retraction', level: 'Beginner' },
  { name: 'Full Arch Hang', description: 'Complete position with chest push', level: 'Intermediate' },
  { name: 'Arch Hang Raises', description: 'Dynamic movement into arch position', level: 'Intermediate' },
]

const skillTransfer = [
  { skill: 'Front Lever', href: '/skills/front-lever', description: 'Same scapular position used in front lever' },
  { skill: 'Muscle-Up', href: '/skills/muscle-up', description: 'Lat engagement pattern for the pull phase' },
  { skill: 'Pull-Up', href: '/exercises/pull-up', description: 'Starting position for proper pull-ups' },
]

export default function ArchHangExercisePage() {
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
          <span className="text-[#E6E9EF]">Arch Hang</span>
        </nav>

        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#C1121F] uppercase tracking-wider">Pulling Exercises</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Arch Hang</h1>
            </div>
          </div>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            The arch hang is a foundational scapular exercise that teaches proper lat engagement and shoulder positioning. 
            It is an essential prerequisite for the front lever and improves all pulling movements.
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
            How to Perform the Arch Hang
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
                  'bg-yellow-500/20 text-yellow-400'
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
            The arch hang builds scapular control that transfers to these skills:
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
              Arch hangs are typically used in:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                Warm-up - Activate lats before pulling work
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                <Link href="/skills/front-lever" className="hover:text-[#E6E9EF] underline">Front Lever Training</Link> - As a prerequisite drill
              </li>
              <li className="flex items-center gap-2 text-[#A4ACB8]">
                <ArrowRight className="w-4 h-4 text-[#C1121F]" />
                Pull day - First exercise to establish scapular control
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
