import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, Calendar, CheckCircle, Clock, Zap, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, generateHowToSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Calisthenics Beginner Program | 12 Week Foundation Plan | SpartanLab',
  description: 'Complete calisthenics beginner program for building foundational strength. Learn proper technique for pull-ups, dips, and push-ups with a structured 12-week plan.',
  keywords: ['calisthenics beginner program', 'bodyweight training plan', 'beginner workout', 'calisthenics for beginners', 'foundation strength program'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/programs/calisthenics-beginner-program`,
  },
  openGraph: {
    title: 'Calisthenics Beginner Program | SpartanLab',
    description: 'Complete beginner program for building calisthenics foundation strength.',
    url: `${SITE_CONFIG.url}/programs/calisthenics-beginner-program`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Calisthenics Beginner Program',
    description: 'Complete 12-week beginner program for building foundational calisthenics strength.',
    url: `${SITE_CONFIG.url}/programs/calisthenics-beginner-program`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Programs', url: '/programs' },
    { name: 'Beginner Program', url: '/programs/calisthenics-beginner-program' },
  ]),
  generateHowToSchema({
    name: 'Calisthenics Beginner Program',
    description: 'A 12-week foundation program for calisthenics beginners.',
    url: `${SITE_CONFIG.url}/programs/calisthenics-beginner-program`,
    totalTime: 'P12W',
    steps: [
      { name: 'Phase 1: Movement Foundations', description: 'Learn proper form for basic movements' },
      { name: 'Phase 2: Strength Building', description: 'Build rep capacity in core exercises' },
      { name: 'Phase 3: Progressive Overload', description: 'Add volume and intensity' },
      { name: 'Phase 4: Skill Introduction', description: 'Begin basic skill work' },
    ],
  }),
]

const weeklyStructure = [
  {
    day: 'Day 1',
    focus: 'Upper Body Push',
    exercises: [
      { name: 'Push-Ups', sets: '3x8-15', href: null },
      { name: 'Dips (Assisted if needed)', sets: '3x5-10', href: '/exercises/dip' },
      { name: 'Pike Push-Ups', sets: '3x5-10', href: null },
    ],
  },
  {
    day: 'Day 2',
    focus: 'Upper Body Pull',
    exercises: [
      { name: 'Pull-Ups (Assisted if needed)', sets: '3x3-8', href: '/exercises/pull-up' },
      { name: 'Inverted Rows', sets: '3x8-12', href: null },
      { name: 'Arch Hangs', sets: '3x15-30s', href: '/exercises/arch-hang' },
    ],
  },
  {
    day: 'Day 3',
    focus: 'Core & Legs',
    exercises: [
      { name: 'Hollow Body Holds', sets: '3x20-30s', href: '/exercises/hollow-body-hold' },
      { name: 'Squats', sets: '3x15-20', href: null },
      { name: 'Lunges', sets: '3x10 each', href: null },
    ],
  },
]

const progressionTimeline = [
  { phase: 'Weeks 1-3', title: 'Movement Foundations', description: 'Focus on learning proper form. Use assisted variations as needed. Prioritize quality over quantity.' },
  { phase: 'Weeks 4-6', title: 'Building Base Strength', description: 'Increase rep ranges. Target 10+ push-ups, 5+ pull-ups, 8+ dips.' },
  { phase: 'Weeks 7-9', title: 'Progressive Overload', description: 'Add sets and reduce rest. Begin working toward harder variations.' },
  { phase: 'Weeks 10-12', title: 'Skill Introduction', description: 'Introduce basic skill holds like L-sit and handstand practice. Prepare for intermediate training.' },
]

const exercises = [
  { name: 'Push-Ups', href: null, purpose: 'Foundational horizontal push' },
  { name: 'Pull-Ups', href: '/exercises/pull-up', purpose: 'Foundational vertical pull' },
  { name: 'Dips', href: '/exercises/dip', purpose: 'Foundational pushing strength' },
  { name: 'Hollow Body Holds', href: '/exercises/hollow-body-hold', purpose: 'Core stability and tension' },
  { name: 'Inverted Rows', href: null, purpose: 'Horizontal pulling strength' },
  { name: 'L-Sit (Tucked)', href: '/exercises/l-sit', purpose: 'Core compression introduction' },
]

const programGoals = [
  { goal: '10+ Strict Push-Ups', description: 'Build foundational pushing strength' },
  { goal: '5+ Strict Pull-Ups', description: 'Establish pulling foundation' },
  { goal: '8+ Dips', description: 'Develop dip strength' },
  { goal: '30s Hollow Hold', description: 'Core tension endurance' },
]

export default function BeginnerProgramPage() {
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
            <span className="text-[#E6E9EF]">Beginner Program</span>
          </nav>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wide">Foundation Program</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Calisthenics Beginner Program</h1>
            </div>
          </div>
          
          <p className="text-lg text-[#A5A5A5] mb-6 max-w-2xl">
            Build your calisthenics foundation with this structured 12-week program. Learn proper technique, 
            develop base strength, and prepare for advanced skill training.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Clock className="w-4 h-4" />
              <span>12 Weeks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Calendar className="w-4 h-4" />
              <span>3 Days/Week</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
              <Target className="w-4 h-4" />
              <span>Beginner</span>
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
              This program is designed for complete beginners or those returning to training after a long break. 
              It focuses on mastering the fundamental movement patterns that form the basis of all calisthenics training.
            </p>
            <p className="text-[#A5A5A5] leading-relaxed mt-4">
              By the end of 12 weeks, you will have built the strength foundation needed to pursue intermediate skills 
              like the front lever, muscle-up, and planche progressions.
            </p>
          </div>
        </div>
      </section>

      {/* Program Goals */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">End-of-Program Goals</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {programGoals.map((item) => (
              <div key={item.goal} className="flex items-start gap-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                <CheckCircle className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF]">{item.goal}</h3>
                  <p className="text-sm text-[#6B7280]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Structure */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Example Weekly Structure</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {weeklyStructure.map((day) => (
              <Card key={day.day} className="bg-[#1A1A1A] border-[#2B313A] p-5">
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
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
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
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Key Exercises</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {exercises.map((exercise) => (
              <div key={exercise.name} className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A]">
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
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-[#C1121F]/10 border-[#C1121F]/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Build Your Personalized Program</h2>
                <p className="text-sm text-[#A5A5A5]">
                  Use the SpartanLab Program Builder to create a customized training plan based on your current level and available equipment.
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

      {/* Next Steps */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">After This Program</h2>
          <p className="text-[#A5A5A5] mb-6">
            Once you have completed this foundation program, you will be ready to pursue skill-specific training:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/programs/front-lever-program" className="block p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Front Lever Program</h3>
              <p className="text-sm text-[#6B7280]">Build horizontal pulling strength</p>
            </Link>
            <Link href="/programs/muscle-up-program" className="block p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Muscle-Up Program</h3>
              <p className="text-sm text-[#6B7280]">Master the explosive transition</p>
            </Link>
            <Link href="/calisthenics-strength-standards" className="block p-4 bg-[#1A1A1A] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors">
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Strength Standards</h3>
              <p className="text-sm text-[#6B7280]">Track your progress benchmarks</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
