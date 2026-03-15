import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Target, CheckCircle2, AlertTriangle, Clock, Dumbbell, Calendar } from 'lucide-react'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Front Lever Training Guide | Complete Tutorial 2024',
  description: 'Complete front lever training guide with progressions, programming, common mistakes, and tips. Learn how to achieve your first front lever.',
  keywords: ['front lever training', 'front lever guide', 'how to front lever', 'front lever tutorial', 'front lever progressions'],
  openGraph: {
    title: 'Front Lever Training Guide | Complete Tutorial 2024',
    description: 'Complete front lever training guide with progressions, programming, common mistakes, and tips.',
    type: 'article',
  },
}

const PROGRESSIONS = [
  { name: 'Tuck Front Lever', time: '4-8 weeks', description: 'Knees tucked to chest, hips at bar height' },
  { name: 'Advanced Tuck', time: '4-8 weeks', description: 'Back parallel, knees at 90 degrees' },
  { name: 'Straddle Front Lever', time: '8-16 weeks', description: 'Legs spread wide, reduces lever length' },
  { name: 'Half Lay Front Lever', time: '8-12 weeks', description: 'One leg extended, one tucked' },
  { name: 'Full Front Lever', time: '12+ weeks', description: 'Body fully horizontal, legs together' },
]

const WEEKLY_STRUCTURE = [
  { day: 'Monday', focus: 'Front Lever Skill', exercises: ['Tuck FL Holds 5x10s', 'FL Rows 4x5', 'Weighted Pull-Ups 3x5'] },
  { day: 'Wednesday', focus: 'Strength Support', exercises: ['Pull-Ups 4x8', 'Dragon Flags 3x5', 'Hollow Holds 3x30s'] },
  { day: 'Friday', focus: 'Front Lever Skill', exercises: ['FL Negatives 5x5s', 'Ice Cream Makers 3x5', 'Arch Hangs 3x15s'] },
]

const COMMON_MISTAKES = [
  { mistake: 'Hips sagging below shoulder line', fix: 'Focus on posterior pelvic tilt and core engagement' },
  { mistake: 'Shoulders shrugged up', fix: 'Actively depress and retract scapulae' },
  { mistake: 'Bent arms', fix: 'Maintain slight elbow lockout throughout' },
  { mistake: 'Progressing too fast', fix: 'Master 15+ seconds before advancing' },
  { mistake: 'Neglecting rows', fix: 'Include front lever rows for dynamic strength' },
]

const FAQ_ITEMS = [
  {
    question: 'How long does it take to learn front lever?',
    answer: 'Most athletes achieve a full front lever in 1-3 years with consistent training. Progress depends heavily on starting strength, body composition, and training consistency.'
  },
  {
    question: 'How many pull-ups do I need for front lever?',
    answer: 'As a benchmark, aim for 12-15 strict pull-ups and a weighted pull-up of +40-50% bodyweight. These indicate sufficient pulling strength to begin serious front lever training.'
  },
  {
    question: 'Should I train front lever every day?',
    answer: 'No. Front lever training is demanding on the lats, core, and connective tissues. Train 2-3 times per week with at least 48 hours rest between sessions.'
  },
  {
    question: 'What is the best front lever progression?',
    answer: 'The standard progression is: Tuck > Advanced Tuck > Straddle > Half Lay > Full. Some athletes skip straddle and go straight to half lay, depending on flexibility.'
  },
]

export default function FrontLeverTrainingGuidePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Front Lever', url: '/skills/front-lever' },
    { name: 'Training Guide', url: '/front-lever-training-guide' },
  ])

  const faqSchema = generateFAQSchema(FAQ_ITEMS)

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbSchema, faqSchema]) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4">
            <Link href="/skills/front-lever" className="hover:text-[#E6E9EF]">Front Lever</Link>
            <span>/</span>
            <span>Training Guide</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Front Lever Training Guide</h1>
          <p className="text-xl text-[#A5A5A5]">
            Everything you need to know to achieve your first front lever. From foundational strength to advanced progressions.
          </p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <Clock className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
            <div className="text-xl font-bold">1-3 Years</div>
            <div className="text-xs text-[#6B7280]">Typical Timeline</div>
          </Card>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <Calendar className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
            <div className="text-xl font-bold">2-3x/week</div>
            <div className="text-xs text-[#6B7280]">Training Frequency</div>
          </Card>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <Dumbbell className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
            <div className="text-xl font-bold">15+ Pull-Ups</div>
            <div className="text-xs text-[#6B7280]">Prerequisite</div>
          </Card>
        </div>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#C1121F]" />
            Prerequisites
          </h2>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
            <p className="text-[#A5A5A5] mb-4">Before starting dedicated front lever training, you should have:</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>12-15 strict pull-ups</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>30+ second hollow body hold</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Basic understanding of scapular control</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>No shoulder or elbow injuries</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Progressions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Front Lever Progressions</h2>
          <div className="space-y-3">
            {PROGRESSIONS.map((prog, index) => (
              <Card key={prog.name} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#C1121F]/20 flex items-center justify-center text-[#C1121F] font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{prog.name}</h3>
                      <span className="text-sm text-[#6B7280]">{prog.time}</span>
                    </div>
                    <p className="text-sm text-[#A5A5A5]">{prog.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Sample Week */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Sample Training Week</h2>
          <div className="space-y-4">
            {WEEKLY_STRUCTURE.map((day) => (
              <Card key={day.day} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 flex-shrink-0">
                    <div className="font-semibold text-[#C1121F]">{day.day}</div>
                    <div className="text-xs text-[#6B7280]">{day.focus}</div>
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-1">
                      {day.exercises.map((ex) => (
                        <li key={ex} className="text-sm text-[#A5A5A5]">• {ex}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Common Mistakes
          </h2>
          <div className="space-y-3">
            {COMMON_MISTAKES.map((item) => (
              <Card key={item.mistake} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-400">{item.mistake}</h3>
                    <p className="text-sm text-[#A5A5A5]">{item.fix}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq) => (
              <Card key={faq.question} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-[#A5A5A5]">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/20 to-[#1A1F26] border-[#C1121F]/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Training?</h2>
            <p className="text-[#A5A5A5] mb-6">
              Test your readiness and get a personalized front lever program.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/front-lever-readiness-calculator">
                <Button variant="outline" className="border-[#2B313A]">
                  Test Readiness
                </Button>
              </Link>
              <Link href="/calisthenics-program-builder">
                <Button className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  Build Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* Related */}
        <section>
          <h2 className="text-xl font-bold mb-4">Related Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/best-exercises-for-front-lever" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Best Exercises</h3>
                <p className="text-sm text-[#6B7280]">Top 10 front lever exercises</p>
              </Card>
            </Link>
            <Link href="/how-many-pull-ups-for-front-lever" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Strength Requirements</h3>
                <p className="text-sm text-[#6B7280]">How many pull-ups needed?</p>
              </Card>
            </Link>
            <Link href="/pull-up-strength-standards" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Pull-Up Standards</h3>
                <p className="text-sm text-[#6B7280]">Check your pulling strength</p>
              </Card>
            </Link>
            <Link href="/front-lever-vs-planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Front Lever vs Planche</h3>
                <p className="text-sm text-[#6B7280]">Skill comparison guide</p>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
