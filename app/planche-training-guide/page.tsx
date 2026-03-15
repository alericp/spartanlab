import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Target, CheckCircle2, AlertTriangle, Clock, Dumbbell, Calendar } from 'lucide-react'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Planche Training Guide | Complete Tutorial 2024',
  description: 'Complete planche training guide with progressions, programming, common mistakes, and tips. Learn how to achieve your first planche.',
  keywords: ['planche training', 'planche guide', 'how to planche', 'planche tutorial', 'planche progressions'],
  openGraph: {
    title: 'Planche Training Guide | Complete Tutorial 2024',
    description: 'Complete planche training guide with progressions, programming, common mistakes, and tips.',
    type: 'article',
  },
}

const PROGRESSIONS = [
  { name: 'Frog Stand', time: '2-4 weeks', description: 'Knees resting on elbows, learning balance' },
  { name: 'Tuck Planche', time: '8-16 weeks', description: 'Knees tucked, hips at hand height' },
  { name: 'Advanced Tuck Planche', time: '8-16 weeks', description: 'Back horizontal, knees at 90 degrees' },
  { name: 'Straddle Planche', time: '16-32 weeks', description: 'Legs wide apart, body horizontal' },
  { name: 'Full Planche', time: '24+ weeks', description: 'Body fully extended and horizontal' },
]

const WEEKLY_STRUCTURE = [
  { day: 'Monday', focus: 'Planche Skill', exercises: ['Planche Leans 5x15s', 'Tuck Planche Holds 5x8s', 'Pseudo Planche Push-Ups 3x8'] },
  { day: 'Wednesday', focus: 'Strength Support', exercises: ['Dips 4x10', 'Pike Push-Ups 3x12', 'Hollow Body 3x30s'] },
  { day: 'Friday', focus: 'Planche Skill', exercises: ['L-Sit to Tuck Planche 4x5', 'Planche Leans 5x20s', 'Straight Arm Work 3x15s'] },
]

const COMMON_MISTAKES = [
  { mistake: 'Insufficient wrist preparation', fix: 'Dedicate 5-10 minutes daily to wrist conditioning before attempting planche work' },
  { mistake: 'Not leaning forward enough', fix: 'The shoulders must be well past the wrists - focus on increasing lean angle progressively' },
  { mistake: 'Rounded lower back', fix: 'Maintain posterior pelvic tilt (tucked hips) throughout the movement' },
  { mistake: 'Bent arms', fix: 'Lock arms completely and focus on straight-arm strength conditioning' },
  { mistake: 'Progressing too quickly', fix: 'Master each progression for 15+ seconds before advancing' },
  { mistake: 'Training through wrist pain', fix: 'Wrist discomfort is a signal to back off - heal before continuing' },
]

const FAQ_ITEMS = [
  {
    question: 'How long does it take to learn planche?',
    answer: 'The planche takes 3-5+ years for most athletes to achieve. It is one of the most difficult calisthenics skills. Progress depends on body type, training consistency, and starting strength.'
  },
  {
    question: 'What strength do I need for planche?',
    answer: 'Benchmarks include: 30+ push-ups, 20+ dips, 60+ second planche lean, and solid L-sit. However, the planche requires specific straight-arm strength that general exercises alone cannot build.'
  },
  {
    question: 'Is planche bad for wrists?',
    answer: 'Without proper preparation, yes. Wrist conditioning is essential before and during planche training. Use wrist stretches, wrist push-ups, and gradual loading to build wrist tolerance.'
  },
  {
    question: 'Should I use parallettes for planche?',
    answer: 'Parallettes are recommended, especially at first. They reduce wrist strain and allow a more neutral grip position. Many athletes find parallette planche easier on the wrists long-term.'
  },
]

export default function PlancheTrainingGuidePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Planche', url: '/skills/planche' },
    { name: 'Training Guide', url: '/planche-training-guide' },
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
            <Link href="/skills/planche" className="hover:text-[#E6E9EF]">Planche</Link>
            <span>/</span>
            <span>Training Guide</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Planche Training Guide</h1>
          <p className="text-xl text-[#A5A5A5]">
            The ultimate guide to achieving the planche - one of the most impressive and challenging calisthenics skills.
          </p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <Clock className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
            <div className="text-xl font-bold">3-5+ Years</div>
            <div className="text-xs text-[#6B7280]">Typical Timeline</div>
          </Card>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <Calendar className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
            <div className="text-xl font-bold">2-3x/week</div>
            <div className="text-xs text-[#6B7280]">Training Frequency</div>
          </Card>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <Dumbbell className="w-6 h-6 text-[#C1121F] mx-auto mb-2" />
            <div className="text-xl font-bold">20+ Dips</div>
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
            <p className="text-[#A5A5A5] mb-4">Before starting dedicated planche training, you should have:</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>20+ dips with full range of motion</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>30+ push-ups</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>60+ second hollow body hold</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Healthy wrists with good flexibility</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>15+ second L-sit hold</span>
              </li>
            </ul>
          </Card>
        </section>

        {/* Progressions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Planche Progressions</h2>
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
              Test your readiness and get a personalized planche program.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/planche-readiness-calculator">
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
            <Link href="/best-exercises-for-planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Best Exercises</h3>
                <p className="text-sm text-[#6B7280]">Top 10 planche exercises</p>
              </Card>
            </Link>
            <Link href="/how-strong-for-planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Strength Requirements</h3>
                <p className="text-sm text-[#6B7280]">How strong do you need to be?</p>
              </Card>
            </Link>
            <Link href="/dip-strength-standards" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Dip Standards</h3>
                <p className="text-sm text-[#6B7280]">Check your pressing strength</p>
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
