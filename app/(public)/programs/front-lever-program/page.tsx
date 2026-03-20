import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, ChevronRight, Calendar, CheckCircle, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, generateHowToSchema, SITE_CONFIG } from '@/lib/seo'
import { AuthAwareProgramCTA } from '@/components/shared/AuthAwareProgramCTA'

export const metadata: Metadata = {
  title: 'Front Lever Training Program | 12-24 Week Plan | SpartanLab',
  description: 'Complete front lever training program with weekly structure, exercise selection, and progression timeline. Build from tuck to full front lever systematically.',
  keywords: ['front lever program', 'front lever training plan', 'front lever workout', 'calisthenics program', 'pulling strength program'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/programs/front-lever-program`,
  },
  openGraph: {
    title: 'Front Lever Training Program | SpartanLab',
    description: 'Complete front lever training program with weekly structure and progression timeline.',
    url: `${SITE_CONFIG.url}/programs/front-lever-program`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Front Lever Training Program',
    description: 'Complete training program for developing the front lever with structured progressions and exercise selection.',
    url: `${SITE_CONFIG.url}/programs/front-lever-program`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Programs', url: '/programs' },
    { name: 'Front Lever Program', url: '/programs/front-lever-program' },
  ]),
  generateHowToSchema({
    name: 'Front Lever Training Program',
    description: 'A structured training program to develop the front lever over 12-24 weeks.',
    url: `${SITE_CONFIG.url}/programs/front-lever-program`,
    totalTime: 'P24W',
    steps: [
      { name: 'Phase 1: Foundation', description: 'Build pulling strength with weighted pull-ups and core work' },
      { name: 'Phase 2: Tuck Development', description: 'Develop tuck front lever holds and rows' },
      { name: 'Phase 3: Advanced Progressions', description: 'Progress to advanced tuck and straddle variations' },
      { name: 'Phase 4: Full Front Lever', description: 'Work toward the full front lever hold' },
    ],
  }),
]

const weeklyStructure = [
  {
    day: 'Day 1',
    focus: 'Pull Strength',
    exercises: [
      { name: 'Weighted Pull-Ups', sets: '4x5-8', href: '/exercises/pull-up' },
      { name: 'Front Lever Rows', sets: '3x6-10', href: '/exercises/front-lever-row' },
      { name: 'Archer Pull-Ups', sets: '3x4-6 each', href: '/exercises/pull-up' },
    ],
  },
  {
    day: 'Day 2',
    focus: 'Core & Compression',
    exercises: [
      { name: 'Hollow Body Holds', sets: '4x30-45s', href: '/exercises/hollow-body-hold' },
      { name: 'Hanging Leg Raises', sets: '3x10-15', href: '/exercises/hanging-leg-raise' },
      { name: 'Dragon Flags (Negatives)', sets: '3x5-8', href: null },
    ],
  },
  {
    day: 'Day 3',
    focus: 'Skill Work',
    exercises: [
      { name: 'Tuck/Adv. Tuck Front Lever Holds', sets: '5x5-15s', href: null },
      { name: 'Front Lever Raises (Tuck)', sets: '3x5-8', href: null },
      { name: 'Scapular Pulls', sets: '3x8-12', href: '/exercises/pull-up' },
    ],
  },
]

const progressionTimeline = [
  { phase: 'Weeks 1-4', title: 'Foundation Phase', description: 'Build pulling strength base with weighted pull-ups and establish core tension patterns.' },
  { phase: 'Weeks 5-8', title: 'Tuck Development', description: 'Develop solid tuck front lever holds (15-20s) and begin front lever rows.' },
  { phase: 'Weeks 9-14', title: 'Advanced Tuck Phase', description: 'Progress to advanced tuck with hip extension. Target 10-15s holds.' },
  { phase: 'Weeks 15-20', title: 'Straddle Progressions', description: 'Begin straddle front lever work. Continue building row strength.' },
  { phase: 'Weeks 21-24', title: 'Full Front Lever', description: 'Work toward full front lever holds. Refine body tension and alignment.' },
]

const exercises = [
  { name: 'Weighted Pull-Ups', href: '/exercises/pull-up', purpose: 'Build raw pulling strength' },
  { name: 'Front Lever Rows', href: '/exercises/front-lever-row', purpose: 'Specific horizontal pull strength' },
  { name: 'Hollow Body Holds', href: '/exercises/hollow-body-hold', purpose: 'Core tension pattern' },
  { name: 'Arch Hangs', href: '/exercises/arch-hang', purpose: 'Scapular depression strength' },
  { name: 'Tuck Front Lever Holds', href: null, purpose: 'Entry-level skill work' },
  { name: 'Dragon Flags', href: null, purpose: 'Advanced core compression' },
]

export default function FrontLeverProgramPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/programs" className="hover:text-[#E6E9EF]">Programs</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Front Lever Program</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Program Template</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Front Lever Training Program</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl mb-6">
            A structured 12-24 week program to build the pulling strength, core tension, and 
            straight-arm endurance required for the front lever. Progress systematically from 
            tuck to full front lever.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              12-24 Weeks
            </span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">Intermediate Level</span>
            <span className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">3 Days/Week</span>
          </div>
        </header>

        {/* Quick Actions */}
        <section className="grid sm:grid-cols-2 gap-4 mb-12">
          <Link href="/front-lever-readiness-calculator">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all cursor-pointer group h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#C1121F]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Check Your Readiness</h3>
                  <p className="text-sm text-[#6B7280]">Take the readiness calculator first</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/skills/front-lever">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all cursor-pointer group h-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#C1121F]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">Front Lever Hub</h3>
                  <p className="text-sm text-[#6B7280]">Complete skill overview</p>
                </div>
              </div>
            </Card>
          </Link>
        </section>

        {/* Who This Is For */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Who This Program Is For</h2>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-[#A5A5A5]">Athletes who can perform 10+ strict pull-ups</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-[#A5A5A5]">Those with basic hollow body hold capability (30s+)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-[#A5A5A5]">Athletes ready to commit to 3 focused sessions per week</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-[#A5A5A5]">Access to pull-up bar (rings optional but helpful)</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Weekly Structure */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Example Weekly Structure</h2>
          <div className="space-y-4">
            {weeklyStructure.map((day) => (
              <Card key={day.day} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-1 bg-[#C1121F]/10 text-[#C1121F] text-sm font-medium rounded">
                    {day.day}
                  </span>
                  <h3 className="font-semibold text-[#E6E9EF]">{day.focus}</h3>
                </div>
                <ul className="space-y-2">
                  {day.exercises.map((exercise, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      {exercise.href ? (
                        <Link href={exercise.href} className="text-[#A5A5A5] hover:text-[#C1121F] transition-colors">
                          {exercise.name}
                        </Link>
                      ) : (
                        <span className="text-[#A5A5A5]">{exercise.name}</span>
                      )}
                      <span className="text-[#6B7280]">{exercise.sets}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* Exercise List */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Key Exercises</h2>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {exercises.map((exercise) => (
                <div key={exercise.name} className="flex items-start gap-3">
                  <Dumbbell className="w-4 h-4 text-[#C1121F] mt-1 flex-shrink-0" />
                  <div>
                    {exercise.href ? (
                      <Link href={exercise.href} className="font-medium text-[#E6E9EF] hover:text-[#C1121F] transition-colors">
                        {exercise.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-[#E6E9EF]">{exercise.name}</span>
                    )}
                    <p className="text-xs text-[#6B7280]">{exercise.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Progression Timeline */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Progression Timeline</h2>
          <div className="space-y-4">
            {progressionTimeline.map((phase, index) => (
              <Card key={phase.phase} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#C1121F]">{index + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#6B7280]">{phase.phase}</span>
                    </div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{phase.title}</h3>
                    <p className="text-sm text-[#A5A5A5]">{phase.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Related Resources */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Related Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/front-lever-progression">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all cursor-pointer group h-full">
                <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors mb-1">
                  Front Lever Progression Guide
                </h3>
                <p className="text-sm text-[#6B7280]">Detailed breakdown of each progression stage</p>
              </Card>
            </Link>
            <Link href="/calisthenics-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all cursor-pointer group h-full">
                <h3 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors mb-1">
                  Strength Standards
                </h3>
                <p className="text-sm text-[#6B7280]">Check your pulling strength benchmarks</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* Program Builder CTA - Auth-aware */}
        <AuthAwareProgramCTA 
          headline="Want a Personalized Version?"
          description="Use the SpartanLab Program Builder to generate a custom front lever program based on your current strength level, available equipment, and training schedule."
          skillContext="front lever"
        />
      </div>
    </main>
  )
}
