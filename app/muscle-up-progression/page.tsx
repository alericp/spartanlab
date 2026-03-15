import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, TrendingUp, ChevronRight, CheckCircle2, Calculator, Zap, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, generateHowToSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Muscle-Up Progression | Step-by-Step Guide to Your First Muscle-Up | SpartanLab',
  description: 'Complete muscle-up progression from beginner to advanced. Learn the exercises, strength requirements, and step-by-step progressions to achieve your first muscle-up.',
  keywords: ['muscle-up progression', 'how to muscle-up', 'muscle-up tutorial', 'muscle-up training', 'calisthenics muscle-up', 'bar muscle-up'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/muscle-up-progression`,
  },
  openGraph: {
    title: 'Muscle-Up Progression | SpartanLab',
    description: 'Complete muscle-up progression from beginner to advanced. Step-by-step guide to your first muscle-up.',
    url: `${SITE_CONFIG.url}/muscle-up-progression`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const progressionStages = [
  { 
    stage: 1, 
    name: 'Pull-Up Foundation', 
    target: '10-12 strict reps',
    description: 'Build baseline pulling strength with full range of motion pull-ups.',
    timeframe: '4-8 weeks',
    exercises: ['Strict Pull-Ups', 'Negative Pull-Ups', 'Scapular Pull-Ups'],
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  { 
    stage: 2, 
    name: 'Chest-to-Bar Pull-Ups', 
    target: '8-10 reps',
    description: 'Develop the pulling height needed to create space for the transition.',
    timeframe: '4-6 weeks',
    exercises: ['Chest-to-Bar Pull-Ups', 'High Pull-Ups', 'Archer Pull-Ups'],
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  { 
    stage: 3, 
    name: 'Explosive Power', 
    target: '6-8 explosive reps',
    description: 'Train explosive pulling to generate upward momentum above the bar.',
    timeframe: '4-6 weeks',
    exercises: ['Explosive Pull-Ups', 'Clapping Pull-Ups', 'Band-Assisted Muscle-Ups'],
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  { 
    stage: 4, 
    name: 'Transition Training', 
    target: '5-8 controlled reps',
    description: 'Practice the wrist rotation and transition over the bar.',
    timeframe: '3-5 weeks',
    exercises: ['Muscle-Up Negatives', 'Low Bar Transitions', 'Band Muscle-Ups'],
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
  { 
    stage: 5, 
    name: 'Full Muscle-Up', 
    target: '1-5 clean reps',
    description: 'Combine explosive pull with smooth transition technique.',
    timeframe: 'Ongoing',
    exercises: ['Full Muscle-Ups', 'Strict Muscle-Ups', 'Multiple Rep Sets'],
    color: 'text-[#C1121F]',
    bgColor: 'bg-[#C1121F]/10',
  },
]

const strengthBenchmarks = [
  { exercise: 'Strict Pull-Ups', minimum: '10 reps', optimal: '15+ reps', notes: 'Full dead hang to chin over bar' },
  { exercise: 'Chest-to-Bar Pull-Ups', minimum: '8 reps', optimal: '12+ reps', notes: 'Chest touches the bar' },
  { exercise: 'Weighted Pull-Ups', minimum: '+10% BW', optimal: '+25-30% BW', notes: 'Builds explosive power reserve' },
  { exercise: 'Straight Bar Dips', minimum: '10 reps', optimal: '15+ reps', notes: 'Required for press-out phase' },
]

const commonMistakes = [
  { mistake: 'Attempting too early', fix: 'Build 10+ strict pull-ups first. Rushing leads to poor technique and potential injury.' },
  { mistake: 'Insufficient pulling height', fix: 'If your pull stops at chin level, you cannot transition. Train chest-to-bar pulls.' },
  { mistake: 'Poor transition technique', fix: 'The wrist rotation is critical. Practice low bar transitions and negatives.' },
  { mistake: 'Weak dip strength', fix: 'Many athletes fail at the top. Train straight bar dips specifically.' },
  { mistake: 'Too much kip, not enough strength', fix: 'Kipping hides strength deficits. Build strict strength first.' },
]

const faqs = [
  {
    question: 'How many pull-ups do I need for a muscle-up?',
    answer: 'Most athletes need 10-12 strict pull-ups and 8-10 chest-to-bar pull-ups as a minimum. Additionally, weighted pull-ups at +20-30% bodyweight help build the explosive power reserve needed for the transition phase.',
  },
  {
    question: 'How long does it take to learn a muscle-up?',
    answer: 'Athletes with solid pull-up strength (10+ strict) typically achieve their first muscle-up in 2-6 months of dedicated training. Complete beginners may need 6-12 months to build the prerequisite strength before starting muscle-up specific training.',
  },
  {
    question: 'Can I learn a muscle-up without kipping?',
    answer: 'Yes, strict muscle-ups are achievable and build more strength than kipping variations. They require more raw pulling power but develop better overall strength. Start with strict progressions and only add kipping after mastering the movement.',
  },
  {
    question: 'What is the hardest part of the muscle-up?',
    answer: 'The transition phase is typically the hardest part. This is where you rotate your wrists and body from below the bar to above it. Many athletes have the pulling strength but lack the technique. Negatives and low bar drills help.',
  },
  {
    question: 'Should I use a false grip for muscle-ups?',
    answer: 'A false grip (wrists over the bar) makes the transition easier on rings but is less common on bar muscle-ups. Most bar muscle-ups use a standard grip with a quick wrist rotation during the transition.',
  },
]

const jsonLdSchemas = [
  generateHowToSchema({
    name: 'Muscle-Up Progression Guide',
    description: 'Step-by-step progression to achieve your first muscle-up.',
    url: `${SITE_CONFIG.url}/muscle-up-progression`,
    steps: [
      { name: 'Build Pull-Up Foundation', description: 'Achieve 10-12 strict pull-ups with full range of motion.' },
      { name: 'Train Chest-to-Bar', description: 'Develop 8-10 chest-to-bar pull-ups for pulling height.' },
      { name: 'Add Explosive Work', description: 'Train explosive pull-ups to generate upward momentum.' },
      { name: 'Practice Transition', description: 'Use negatives and low bar drills to learn the transition.' },
      { name: 'Attempt Full Muscle-Up', description: 'Combine explosive pull with smooth transition technique.' },
    ],
    totalTime: 'P6M',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Muscle-Up Progression', url: '/muscle-up-progression' },
  ]),
  generateFAQSchema(faqs),
]

export default function MuscleUpProgressionPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/skills" className="hover:text-[#E6E9EF]">Skills</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Muscle-Up Progression</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Progression</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Muscle-Up Progression</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The muscle-up combines explosive pulling power with a technical transition over the bar. 
            Follow this step-by-step progression to achieve your first muscle-up safely and efficiently.
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-[#A4ACB8] leading-relaxed mb-4">
            The muscle-up is one of the most iconic calisthenics skills. It represents the transition 
            from basic pull-up strength to advanced bodyweight mastery. Unlike a standard pull-up, 
            the muscle-up requires you to generate enough height to get your entire upper body above 
            the bar, then press out to a straight arm support.
          </p>
          <p className="text-[#A4ACB8] leading-relaxed">
            Most athletes fail because they attempt muscle-ups before building sufficient strength, 
            or they focus only on pulling power without developing the transition technique. This 
            progression addresses both requirements systematically.
          </p>
        </section>

        {/* Progression Stages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Muscle-Up Progression Stages</h2>
          <div className="space-y-4">
            {progressionStages.map((stage) => (
              <Card key={stage.stage} className="bg-[#1A1D23] border-[#2B313A] p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stage.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-lg font-bold ${stage.color}`}>{stage.stage}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${stage.color}`}>{stage.name}</h3>
                      <span className="text-sm text-[#6B7280]">Target: {stage.target}</span>
                    </div>
                    <p className="text-sm text-[#A5A5A5] mb-3">{stage.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span className="text-[#6B7280]">{stage.timeframe}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.exercises.map((ex) => (
                          <span key={ex} className="px-2 py-0.5 rounded bg-[#0F1115] text-[#A5A5A5]">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Strength Benchmarks */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Strength Requirements</h2>
          <p className="text-[#A5A5A5] mb-6">
            These benchmarks indicate your readiness for muscle-up training. Meeting the minimum 
            requirements allows you to start, while optimal levels make success much more likely.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B313A]">
                  <TableHead className="text-[#E6E9EF]">Exercise</TableHead>
                  <TableHead className="text-yellow-400">Minimum</TableHead>
                  <TableHead className="text-green-400">Optimal</TableHead>
                  <TableHead className="text-[#6B7280]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strengthBenchmarks.map((row) => (
                  <TableRow key={row.exercise} className="border-[#2B313A]">
                    <TableCell className="text-[#E6E9EF] font-medium">{row.exercise}</TableCell>
                    <TableCell className="text-yellow-400">{row.minimum}</TableCell>
                    <TableCell className="text-green-400">{row.optimal}</TableCell>
                    <TableCell className="text-[#6B7280] text-sm">{row.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Common Mistakes to Avoid</h2>
          <div className="space-y-3">
            {commonMistakes.map((item) => (
              <Card key={item.mistake} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#C1121F] text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{item.mistake}</h3>
                    <p className="text-sm text-[#A5A5A5]">{item.fix}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#1A1D23] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-2">Test Your Muscle-Up Readiness</h2>
            <p className="text-[#A5A5A5] mb-4">
              Use our calculators to get a detailed analysis of your pulling strength and muscle-up readiness score.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/muscle-up-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  <Calculator className="w-4 h-4 mr-2" />
                  Muscle-Up Readiness Calculator
                </Button>
              </Link>
              <Link href="/calculators/pull-up-strength-score">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Pull-Up Strength Score
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <FAQ faqs={faqs} title="Frequently Asked Questions" />
        </section>

        {/* Related Links */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Related Content</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/skills/muscle-up">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Muscle-Up Skill Hub
              </Button>
            </Link>
            <Link href="/guides/muscle-up-training">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Full Training Guide
              </Button>
            </Link>
            <Link href="/pull-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Pull-Up Standards
              </Button>
            </Link>
            <Link href="/how-many-dips-for-muscle-up">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Dip Requirements
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
