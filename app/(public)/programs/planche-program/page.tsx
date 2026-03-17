import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, Calendar, CheckCircle, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, generateHowToSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Planche Training Program | 24-48 Week Plan | SpartanLab',
  description: 'Complete planche training program with weekly structure, exercise selection, and progression timeline. Build from frog stand to full planche systematically.',
  keywords: ['planche program', 'planche training plan', 'planche workout', 'calisthenics program', 'pushing strength program'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/programs/planche-program`,
  },
  openGraph: {
    title: 'Planche Training Program | SpartanLab',
    description: 'Complete planche training program with weekly structure and progression timeline.',
    url: `${SITE_CONFIG.url}/programs/planche-program`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Planche Training Program',
    description: 'Complete training program for developing the planche with structured progressions and exercise selection.',
    url: `${SITE_CONFIG.url}/programs/planche-program`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Programs', url: '/programs' },
    { name: 'Planche Program', url: '/programs/planche-program' },
  ]),
  generateHowToSchema({
    name: 'Planche Training Program',
    description: 'A structured training program to develop the planche over 24-48 weeks.',
    url: `${SITE_CONFIG.url}/programs/planche-program`,
    totalTime: 'P48W',
    steps: [
      { name: 'Phase 1: Foundation', description: 'Build pushing strength with weighted dips and planche leans' },
      { name: 'Phase 2: Frog Stand & Tuck', description: 'Develop frog stand balance and tuck planche holds' },
      { name: 'Phase 3: Advanced Tuck', description: 'Progress to advanced tuck with full hip extension' },
      { name: 'Phase 4: Straddle & Full', description: 'Work toward straddle and full planche holds' },
    ],
  }),
]

const weeklyStructure = [
  {
    day: 'Day 1',
    focus: 'Push Strength',
    exercises: [
      { name: 'Weighted Dips', sets: '4x5-8', href: '/exercises/dip' },
      { name: 'Pseudo Planche Push-Ups', sets: '3x8-12', href: '/exercises/pseudo-planche-push-up' },
      { name: 'Pike Push-Ups', sets: '3x8-12', href: null },
    ],
  },
  {
    day: 'Day 2',
    focus: 'Straight-Arm Conditioning',
    exercises: [
      { name: 'Planche Leans', sets: '5x15-30s', href: null },
      { name: 'Planche Raises', sets: '3x5-8', href: null },
      { name: 'L-Sit Holds', sets: '4x15-30s', href: '/exercises/l-sit' },
    ],
  },
  {
    day: 'Day 3',
    focus: 'Skill Work',
    exercises: [
      { name: 'Tuck Planche Holds', sets: '5x5-15s', href: null },
      { name: 'Frog Stand Balance', sets: '3x20-30s', href: null },
      { name: 'Wall HSPU Negatives', sets: '3x3-5', href: null },
    ],
  },
]

const progressionTimeline = [
  { phase: 'Weeks 1-6', title: 'Foundation Phase', description: 'Build pushing strength with weighted dips and establish planche lean conditioning.' },
  { phase: 'Weeks 7-14', title: 'Frog Stand & Tuck', description: 'Develop solid frog stand balance and begin tuck planche attempts (5-10s holds).' },
  { phase: 'Weeks 15-24', title: 'Tuck Development', description: 'Extend tuck planche holds to 15-20s. Begin pseudo planche push-ups with significant lean.' },
  { phase: 'Weeks 25-36', title: 'Advanced Tuck Phase', description: 'Progress to advanced tuck with full hip extension. Target 10-15s holds.' },
  { phase: 'Weeks 37-48', title: 'Straddle & Full', description: 'Begin straddle planche work. The strongest athletes may achieve full planche.' },
]

const exercises = [
  { name: 'Weighted Dips', href: '/exercises/dip', purpose: 'Build raw pushing strength' },
  { name: 'Pseudo Planche Push-Ups', href: '/exercises/pseudo-planche-push-up', purpose: 'Planche-specific strength' },
  { name: 'L-Sit Holds', href: '/exercises/l-sit', purpose: 'Core compression and hip flexor strength' },
  { name: 'Hollow Body Holds', href: '/exercises/hollow-body-hold', purpose: 'Body tension pattern' },
  { name: 'Planche Leans', href: null, purpose: 'Wrist and shoulder conditioning' },
  { name: 'Tuck Planche Holds', href: null, purpose: 'Entry-level skill work' },
]

export default function PlancheProgramPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Header */}
      <section className="py-16 px-4 sm:px-6 border-b border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
            <Link href="/" className="hover:text-[#A4ACB8]">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/programs" className="hover:text-[#A4ACB8]">Programs</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#E6E9EF]">Planche Program</span>
          </nav>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wide">Training Program</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Planche Training Program</h1>
            </div>
          </div>
          
          <p className="text-lg text-[#A5A5A5] mb-6 max-w-2xl">
            Build the pushing strength, straight-arm conditioning, and body control required for the planche. This program takes you from foundation work to advanced holds over 24-48 weeks.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Clock className="w-4 h-4" />
              <span>24-48 Weeks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Calendar className="w-4 h-4" />
              <span>3 Days/Week</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Target className="w-4 h-4" />
              <span>Intermediate to Advanced</span>
            </div>
          </div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Program Overview</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-[#A5A5A5] leading-relaxed">
              The planche is one of the most challenging bodyweight skills, requiring exceptional pushing strength, 
              straight-arm conditioning, and full-body tension. This program systematically develops these qualities 
              through progressive overload on pushing exercises, dedicated straight-arm work, and structured skill practice.
            </p>
            <p className="text-[#A5A5A5] leading-relaxed mt-4">
              Expect this journey to take 2-4 years for most athletes. The planche demands patience, consistency, 
              and a low body fat percentage for optimal leverage. Focus on quality holds over quantity.
            </p>
          </div>
        </div>
      </section>

      {/* Weekly Structure */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Example Weekly Structure</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {weeklyStructure.map((day) => (
              <Card key={day.day} className="bg-[#0F1115] border-[#2B313A] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF]">{day.day}</h3>
                    <span className="text-xs text-[#6B7280]">{day.focus}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {day.exercises.map((exercise) => (
                    <li key={exercise.name} className="text-sm">
                      {exercise.href ? (
                        <Link href={exercise.href} className="text-[#A5A5A5] hover:text-[#C1121F] transition-colors">
                          {exercise.name}
                        </Link>
                      ) : (
                        <span className="text-[#A5A5A5]">{exercise.name}</span>
                      )}
                      <span className="text-[#6B7280] ml-2">{exercise.sets}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Progression Timeline */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Progression Timeline</h2>
          <div className="space-y-4">
            {progressionTimeline.map((phase, idx) => (
              <div key={phase.phase} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center text-[#C1121F] font-bold text-sm">
                    {idx + 1}
                  </div>
                  {idx < progressionTimeline.length - 1 && (
                    <div className="w-0.5 h-full bg-[#2B313A] mt-2" />
                  )}
                </div>
                <div className="pb-6">
                  <span className="text-xs text-[#C1121F] font-medium">{phase.phase}</span>
                  <h3 className="font-semibold text-[#E6E9EF]">{phase.title}</h3>
                  <p className="text-sm text-[#A5A5A5] mt-1">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exercise List */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Key Exercises</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {exercises.map((exercise) => (
              <div key={exercise.name} className="flex items-center justify-between p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <div>
                  {exercise.href ? (
                    <Link href={exercise.href} className="font-medium text-[#E6E9EF] hover:text-[#C1121F] transition-colors">
                      {exercise.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-[#E6E9EF]">{exercise.name}</span>
                  )}
                  <p className="text-xs text-[#6B7280] mt-0.5">{exercise.purpose}</p>
                </div>
                {exercise.href && (
                  <ArrowRight className="w-4 h-4 text-[#6B7280]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Readiness Calculator CTA */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-[#C1121F]/10 border-[#C1121F]/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Check Your Planche Readiness</h2>
                <p className="text-sm text-[#A5A5A5]">
                  Before starting this program, assess your current strength levels to identify focus areas.
                </p>
              </div>
              <Link href="/planche-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white whitespace-nowrap">
                  <Zap className="w-4 h-4 mr-2" />
                  Take Readiness Test
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Program Builder CTA */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Build Your Personalized Program</h2>
          <p className="text-[#A5A5A5] mb-6 max-w-xl mx-auto">
            Use the SpartanLab Program Builder to generate a training plan customized to your current strength level, 
            available equipment, and schedule.
          </p>
          <Link href="/calisthenics-program-builder">
            <Button size="lg" className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
              Open Program Builder
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/skills/planche" className="block p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Planche Skill Hub</h3>
              <p className="text-sm text-[#6B7280]">Complete overview of the planche skill</p>
            </Link>
            <Link href="/planche-progression" className="block p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Planche Progression Guide</h3>
              <p className="text-sm text-[#6B7280]">Detailed progression breakdown</p>
            </Link>
            <Link href="/calisthenics-strength-standards" className="block p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Strength Standards</h3>
              <p className="text-sm text-[#6B7280]">Benchmark your current strength</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
