import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, Calendar, CheckCircle, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, generateHowToSchema, SITE_CONFIG } from '@/lib/seo'
import { AuthAwareProgramCTA } from '@/components/shared/AuthAwareProgramCTA'

export const metadata: Metadata = {
  title: 'Muscle-Up Training Program | 8-16 Week Plan | SpartanLab',
  description: 'Complete muscle-up training program with weekly structure, exercise selection, and progression timeline. Build from pull-ups to strict muscle-ups systematically.',
  keywords: ['muscle-up program', 'muscle-up training plan', 'muscle-up workout', 'calisthenics program', 'explosive pulling program'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/programs/muscle-up-program`,
  },
  openGraph: {
    title: 'Muscle-Up Training Program | SpartanLab',
    description: 'Complete muscle-up training program with weekly structure and progression timeline.',
    url: `${SITE_CONFIG.url}/programs/muscle-up-program`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Muscle-Up Training Program',
    description: 'Complete training program for developing the muscle-up with structured progressions and exercise selection.',
    url: `${SITE_CONFIG.url}/programs/muscle-up-program`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Programs', url: '/programs' },
    { name: 'Muscle-Up Program', url: '/programs/muscle-up-program' },
  ]),
  generateHowToSchema({
    name: 'Muscle-Up Training Program',
    description: 'A structured training program to develop the muscle-up over 8-16 weeks.',
    url: `${SITE_CONFIG.url}/programs/muscle-up-program`,
    totalTime: 'P16W',
    steps: [
      { name: 'Phase 1: Pulling Foundation', description: 'Build high-rep pull-up strength and explosive power' },
      { name: 'Phase 2: High Pull Development', description: 'Develop chest-to-bar and explosive pulling' },
      { name: 'Phase 3: Transition Practice', description: 'Master the transition with band assistance and negatives' },
      { name: 'Phase 4: Strict Muscle-Up', description: 'Achieve strict bar and ring muscle-ups' },
    ],
  }),
]

const weeklyStructure = [
  {
    day: 'Day 1',
    focus: 'Pull Strength',
    exercises: [
      { name: 'Weighted Pull-Ups', sets: '4x5-8', href: '/exercises/pull-up' },
      { name: 'Chest-to-Bar Pull-Ups', sets: '3x6-10', href: '/exercises/pull-up' },
      { name: 'Straight Bar Dips', sets: '3x8-12', href: '/exercises/dip' },
    ],
  },
  {
    day: 'Day 2',
    focus: 'Explosive Power',
    exercises: [
      { name: 'Explosive Pull-Ups', sets: '5x3-5', href: '/exercises/pull-up' },
      { name: 'Clapping Pull-Ups', sets: '3x3-5', href: null },
      { name: 'Kipping Practice', sets: '3x5-8', href: null },
    ],
  },
  {
    day: 'Day 3',
    focus: 'Transition & Skill',
    exercises: [
      { name: 'Banded Muscle-Ups', sets: '5x1-3', href: null },
      { name: 'Negative Muscle-Ups', sets: '3x3-5', href: null },
      { name: 'Transition Swings', sets: '3x5-8', href: null },
    ],
  },
]

const progressionTimeline = [
  { phase: 'Weeks 1-4', title: 'Pulling Foundation', description: 'Build to 15+ strict pull-ups and establish high pull strength patterns.' },
  { phase: 'Weeks 5-8', title: 'High Pull Development', description: 'Develop consistent chest-to-bar pulls. Begin explosive pulling work.' },
  { phase: 'Weeks 9-12', title: 'Transition Training', description: 'Focus on the transition phase with bands and negatives. Master the hip drive.' },
  { phase: 'Weeks 13-16', title: 'Muscle-Up Achievement', description: 'Achieve first strict muscle-up. Work on consistency and form.' },
]

const exercises = [
  { name: 'Weighted Pull-Ups', href: '/exercises/pull-up', purpose: 'Build pulling strength foundation' },
  { name: 'Chest-to-Bar Pull-Ups', href: '/exercises/pull-up', purpose: 'Develop high pull range' },
  { name: 'Straight Bar Dips', href: '/exercises/dip', purpose: 'Transition pushing strength' },
  { name: 'Hollow Body Holds', href: '/exercises/hollow-body-hold', purpose: 'Kip and swing control' },
  { name: 'Explosive Pull-Ups', href: '/exercises/pull-up', purpose: 'Generate power for transition' },
  { name: 'Negative Muscle-Ups', href: null, purpose: 'Learn the movement pattern' },
]

export default function MuscleUpProgramPage() {
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
            <span className="text-[#E6E9EF]">Muscle-Up Program</span>
          </nav>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wide">Training Program</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Muscle-Up Training Program</h1>
            </div>
          </div>
          
          <p className="text-lg text-[#A5A5A5] mb-6 max-w-2xl">
            Master the muscle-up through progressive strength building, explosive power development, and focused transition practice. This program takes you from solid pull-ups to strict muscle-ups in 8-16 weeks.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Clock className="w-4 h-4" />
              <span>8-16 Weeks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Calendar className="w-4 h-4" />
              <span>3 Days/Week</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Target className="w-4 h-4" />
              <span>Intermediate</span>
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
              The muscle-up combines pulling strength, explosive power, and a unique transition phase that many athletes struggle with. 
              This program breaks down each component and develops them systematically so the full movement becomes achievable.
            </p>
            <p className="text-[#A5A5A5] leading-relaxed mt-4">
              Prerequisites: You should be able to perform at least 10-12 strict pull-ups and 15-20 dips before starting. 
              If you cannot meet these minimums, focus on building your pulling and pushing base first.
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
                <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Check Your Muscle-Up Readiness</h2>
                <p className="text-sm text-[#A5A5A5]">
                  Before starting this program, assess your current strength levels to identify focus areas.
                </p>
              </div>
              <Link href="/muscle-up-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white whitespace-nowrap">
                  <Zap className="w-4 h-4 mr-2" />
                  Take Readiness Test
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Program Builder CTA - Auth-aware */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <AuthAwareProgramCTA 
            headline="Build Your Personalized Program"
            description="Use the SpartanLab Program Builder to generate a training plan customized to your current strength level, available equipment, and schedule."
            skillContext="muscle-up"
          />
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/skills/muscle-up" className="block p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Muscle-Up Skill Hub</h3>
              <p className="text-sm text-[#6B7280]">Complete overview of the muscle-up skill</p>
            </Link>
            <Link href="/guides/muscle-up-training" className="block p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Muscle-Up Training Guide</h3>
              <p className="text-sm text-[#6B7280]">Detailed technique breakdown</p>
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
