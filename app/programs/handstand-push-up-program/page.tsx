import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, Calendar, CheckCircle, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, generateHowToSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Handstand Push-Up Program | 12-24 Week Plan | SpartanLab',
  description: 'Complete handstand push-up training program with weekly structure, exercise selection, and progression timeline. Build from pike push-ups to freestanding HSPU.',
  keywords: ['hspu program', 'handstand push-up training', 'hspu workout', 'calisthenics program', 'vertical pushing program'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/programs/handstand-push-up-program`,
  },
  openGraph: {
    title: 'Handstand Push-Up Training Program | SpartanLab',
    description: 'Complete HSPU training program with weekly structure and progression timeline.',
    url: `${SITE_CONFIG.url}/programs/handstand-push-up-program`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Handstand Push-Up Training Program',
    description: 'Complete training program for developing handstand push-ups with structured progressions.',
    url: `${SITE_CONFIG.url}/programs/handstand-push-up-program`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Programs', url: '/programs' },
    { name: 'HSPU Program', url: '/programs/handstand-push-up-program' },
  ]),
  generateHowToSchema({
    name: 'Handstand Push-Up Training Program',
    description: 'A structured training program to develop handstand push-ups over 12-24 weeks.',
    url: `${SITE_CONFIG.url}/programs/handstand-push-up-program`,
    totalTime: 'P24W',
    steps: [
      { name: 'Phase 1: Foundation', description: 'Build overhead pressing strength and handstand balance' },
      { name: 'Phase 2: Wall HSPU Development', description: 'Develop wall-supported handstand push-ups' },
      { name: 'Phase 3: Deficit Work', description: 'Increase range of motion with deficit HSPU' },
      { name: 'Phase 4: Freestanding', description: 'Work toward freestanding handstand push-ups' },
    ],
  }),
]

const weeklyStructure = [
  {
    day: 'Day 1',
    focus: 'Pressing Strength',
    exercises: [
      { name: 'Pike Push-Ups (Elevated)', sets: '4x8-12', href: null },
      { name: 'Wall HSPU Negatives', sets: '3x3-5', href: null },
      { name: 'Dips', sets: '3x10-15', href: '/exercises/dip' },
    ],
  },
  {
    day: 'Day 2',
    focus: 'Balance & Stability',
    exercises: [
      { name: 'Wall Handstand Holds', sets: '5x30-60s', href: null },
      { name: 'Freestanding Handstand Practice', sets: '10 min', href: null },
      { name: 'Hollow Body Holds', sets: '3x30-45s', href: '/exercises/hollow-body-hold' },
    ],
  },
  {
    day: 'Day 3',
    focus: 'Skill Integration',
    exercises: [
      { name: 'Wall HSPU (Full ROM)', sets: '4x3-8', href: null },
      { name: 'Deficit Pike Push-Ups', sets: '3x8-12', href: null },
      { name: 'Shoulder Taps in Handstand', sets: '3x6-10 each', href: null },
    ],
  },
]

const progressionTimeline = [
  { phase: 'Weeks 1-4', title: 'Foundation Phase', description: 'Build overhead pressing strength with pike push-ups and establish handstand balance.' },
  { phase: 'Weeks 5-10', title: 'Wall HSPU Development', description: 'Develop wall HSPU with negatives first, then full reps. Target 5-8 strict wall HSPU.' },
  { phase: 'Weeks 11-16', title: 'Deficit Training', description: 'Increase range of motion with deficit wall HSPU. Build to 5+ deficit reps.' },
  { phase: 'Weeks 17-24', title: 'Freestanding Work', description: 'Begin freestanding HSPU attempts. Continue building pressing endurance.' },
]

const exercises = [
  { name: 'Pike Push-Ups', href: null, purpose: 'Build vertical pressing foundation' },
  { name: 'Dips', href: '/exercises/dip', purpose: 'General pushing strength' },
  { name: 'Wall Handstand Holds', href: null, purpose: 'Build balance and endurance' },
  { name: 'Hollow Body Holds', href: '/exercises/hollow-body-hold', purpose: 'Body line awareness' },
  { name: 'Wall HSPU', href: null, purpose: 'Primary skill developer' },
  { name: 'L-Sit', href: '/exercises/l-sit', purpose: 'Core compression for balance' },
]

export default function HSPUProgramPage() {
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
            <span className="text-[#E6E9EF]">HSPU Program</span>
          </nav>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wide">Training Program</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Handstand Push-Up Program</h1>
            </div>
          </div>
          
          <p className="text-lg text-[#A5A5A5] mb-6 max-w-2xl">
            Develop the vertical pressing strength, balance, and body control needed for handstand push-ups. 
            This program progresses from pike push-ups through wall work to freestanding HSPU over 12-24 weeks.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Clock className="w-4 h-4" />
              <span>12-24 Weeks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Calendar className="w-4 h-4" />
              <span>3 Days/Week</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Target className="w-4 h-4" />
              <span>Beginner to Intermediate</span>
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
              The handstand push-up is a fundamental vertical pressing movement in calisthenics. 
              It builds shoulder strength, improves body awareness, and serves as a foundation for advanced skills like the planche.
            </p>
            <p className="text-[#A5A5A5] leading-relaxed mt-4">
              This program develops both the strength and balance components simultaneously. 
              You will practice handstand holds for balance while building pressing strength through progressively harder push-up variations.
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

      {/* Program Builder CTA */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-[#C1121F]/10 border-[#C1121F]/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Build Your Personalized Program</h2>
                <p className="text-sm text-[#A5A5A5]">
                  Use the SpartanLab Program Builder to create a customized training plan.
                </p>
              </div>
              <Link href="/calisthenics-program-builder">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white whitespace-nowrap">
                  <Zap className="w-4 h-4 mr-2" />
                  Open Program Builder
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/skills/handstand-push-up" className="block p-4 bg-[#0F1115] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">HSPU Skill Hub</h3>
              <p className="text-sm text-[#6B7280]">Complete overview of handstand push-ups</p>
            </Link>
            <Link href="/guides/handstand-training" className="block p-4 bg-[#0F1115] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Handstand Training Guide</h3>
              <p className="text-sm text-[#6B7280]">Build your handstand foundation</p>
            </Link>
            <Link href="/calisthenics-strength-standards" className="block p-4 bg-[#0F1115] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Strength Standards</h3>
              <p className="text-sm text-[#6B7280]">Benchmark your current strength</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
