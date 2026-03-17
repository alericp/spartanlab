import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, CheckCircle, XCircle, Layers, Zap, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Dip Exercise Guide | Technique, Progressions & Skill Transfer | SpartanLab',
  description: 'Master the dip with proper technique, common mistake fixes, and progression paths. Learn how dips build toward planche, muscle-up, and advanced pressing skills.',
  keywords: ['dip', 'dip technique', 'tricep dip', 'calisthenics', 'chest exercises', 'pushing strength'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/exercises/dip`,
  },
  openGraph: {
    title: 'Dip Exercise Guide | SpartanLab',
    description: 'Complete dip guide with technique, progressions, and skill transfer connections.',
    url: `${SITE_CONFIG.url}/exercises/dip`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Dip Exercise Guide',
    description: 'Comprehensive guide to the dip including technique, progressions, and skill transfer to advanced calisthenics movements.',
    url: `${SITE_CONFIG.url}/exercises/dip`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Exercises', url: '/exercises' },
    { name: 'Dip', url: '/exercises/dip' },
  ]),
]

const musclesWorked = [
  { name: 'Triceps Brachii', role: 'Primary mover - elbow extension', primary: true },
  { name: 'Anterior Deltoids', role: 'Shoulder flexion and stabilization', primary: true },
  { name: 'Pectoralis Major', role: 'Chest engagement, especially at depth', primary: false },
  { name: 'Serratus Anterior', role: 'Scapular protraction', primary: false },
  { name: 'Core', role: 'Trunk stabilization', primary: false },
]

const techniqueSteps = [
  'Grip the bars with arms fully extended and shoulders depressed',
  'Keep your body slightly hollow with core engaged',
  'Lower with control, maintaining elbow tracking behind you',
  'Descend until shoulders are below elbows (full ROM)',
  'Press back up with control to full lockout',
  'Maintain shoulder depression throughout the movement',
]

const commonMistakes = [
  { title: 'Flared Elbows', description: 'Elbows tracking outward instead of back. This stresses the shoulders and reduces tricep engagement.' },
  { title: 'Insufficient Depth', description: 'Not lowering shoulders below elbows. Full depth builds complete strength.' },
  { title: 'Forward Lean Collapse', description: 'Losing body control and collapsing forward. Maintain controlled hollow body position.' },
  { title: 'Shoulder Shrugging', description: 'Allowing shoulders to rise toward ears. Keep shoulders depressed throughout.' },
]

const progressions = [
  { name: 'Bench Dips', description: 'Feet supported, hands on bench', level: 'Foundation' },
  { name: 'Band-Assisted Dips', description: 'Full ROM with reduced load', level: 'Beginner' },
  { name: 'Negative Dips', description: 'Eccentric strength building', level: 'Beginner' },
  { name: 'Parallel Bar Dips', description: 'Standard bodyweight dip', level: 'Intermediate' },
  { name: 'Ring Dips', description: 'Added instability challenge', level: 'Intermediate' },
  { name: 'Weighted Dips', description: 'Progressive overload for strength', level: 'Advanced' },
  { name: 'Russian Dips', description: 'Forearm support variation', level: 'Advanced' },
]

const skillTransfer = [
  { skill: 'Planche', href: '/skills/planche', description: 'Pushing strength transfers to planche training' },
  { skill: 'Muscle-Up', href: '/skills/muscle-up', description: 'Strong dips enable the pressing phase' },
  { skill: 'Handstand Push-Up', href: '/skills/handstand-push-up', description: 'Vertical pressing development' },
]

export default function DipExercisePage() {
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
          <span className="text-[#E6E9EF]">Dip</span>
        </nav>

        {/* Hero Section */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Exercise</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Dip</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The dip is the foundation of calisthenics pushing strength. Strong dips develop the 
            triceps, chest, and shoulder strength needed for planche, muscle-up, and advanced pressing skills.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Pushing</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Compound</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Bodyweight</span>
          </div>
        </header>

        {/* Muscles Worked */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-[#C1121F]" />
            <h2 className="text-xl font-bold">Muscles Worked</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {musclesWorked.map((muscle) => (
              <div 
                key={muscle.name} 
                className={`p-4 rounded-xl border ${muscle.primary ? 'bg-[#C1121F]/10 border-[#C1121F]/30' : 'bg-[#1A1F26] border-[#2B313A]'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {muscle.primary && <Zap className="w-4 h-4 text-[#C1121F]" />}
                  <h3 className="font-semibold text-[#E6E9EF]">{muscle.name}</h3>
                </div>
                <p className="text-sm text-[#A5A5A5]">{muscle.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technique */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-[#C1121F]" />
            <h2 className="text-xl font-bold">Proper Technique</h2>
          </div>
          <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-6">
            <ol className="space-y-4">
              {techniqueSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="w-7 h-7 rounded-full bg-[#C1121F]/20 text-[#C1121F] flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-[#A5A5A5] pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-[#E63946]" />
            <h2 className="text-xl font-bold">Common Mistakes</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {commonMistakes.map((mistake) => (
              <div key={mistake.title} className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-[#E63946]" />
                  <h3 className="font-semibold text-[#E6E9EF]">{mistake.title}</h3>
                </div>
                <p className="text-sm text-[#A5A5A5]">{mistake.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Progressions */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#C1121F]" />
            <h2 className="text-xl font-bold">Progressions & Variations</h2>
          </div>
          <div className="space-y-3">
            {progressions.map((prog, index) => (
              <div key={prog.name} className="flex items-center gap-4 p-4 bg-[#1A1F26] border border-[#2B313A] rounded-xl">
                <span className="w-8 h-8 rounded-full bg-[#C1121F]/20 text-[#C1121F] flex items-center justify-center text-sm font-bold shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#E6E9EF]">{prog.name}</h3>
                  <p className="text-sm text-[#A5A5A5]">{prog.description}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-[#2B313A] rounded text-[#A5A5A5]">{prog.level}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Skill Transfer */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#C1121F]" />
            <h2 className="text-xl font-bold">Skills This Exercise Builds</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {skillTransfer.map((skill) => (
              <Link key={skill.skill} href={skill.href}>
                <Card className="bg-[#1A1F26] border-[#2B313A] p-5 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                  <h3 className="font-semibold text-[#E6E9EF] mb-1 group-hover:text-[#C1121F] transition-colors">
                    {skill.skill}
                  </h3>
                  <p className="text-sm text-[#6B7280]">{skill.description}</p>
                  <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#C1121F] transition-colors mt-2" />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Training Integration */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#C1121F]" />
            <h2 className="text-xl font-bold">Training Integration</h2>
          </div>
          <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-6">
            <p className="text-[#A5A5A5] mb-4">
              Dips are a foundational pushing exercise commonly programmed in:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-[#E6E9EF]">
                <CheckCircle className="w-4 h-4 text-[#C1121F]" />
                Planche progression training
              </li>
              <li className="flex items-center gap-2 text-[#E6E9EF]">
                <CheckCircle className="w-4 h-4 text-[#C1121F]" />
                Muscle-up skill development
              </li>
              <li className="flex items-center gap-2 text-[#E6E9EF]">
                <CheckCircle className="w-4 h-4 text-[#C1121F]" />
                General pushing strength blocks
              </li>
              <li className="flex items-center gap-2 text-[#E6E9EF]">
                <CheckCircle className="w-4 h-4 text-[#C1121F]" />
                Upper body hypertrophy programs
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/calisthenics-program-builder">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
                  Build Your Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/calisthenics-strength-standards">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                  View Strength Standards
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Exercises */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Related Exercises</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/exercises/pseudo-planche-push-up">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                Pseudo Planche Push-Up
              </Button>
            </Link>
            <Link href="/exercises/hollow-body-hold">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                Hollow Body Hold
              </Button>
            </Link>
            <Link href="/exercises/l-sit">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                L-Sit
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
