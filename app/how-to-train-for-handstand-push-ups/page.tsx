import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Target, Dumbbell, Brain, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'How to Train for Handstand Push-Ups | Complete HSPU Guide',
  description: 'Learn how to train for handstand push-ups with strength requirements, progression exercises, and training tips. Build the pressing power for freestanding HSPUs.',
  keywords: ['handstand push-up training', 'HSPU progression', 'handstand push-up requirements', 'how to do handstand push-ups'],
  openGraph: {
    title: 'How to Train for Handstand Push-Ups | Complete HSPU Guide',
    description: 'Learn how to train for handstand push-ups with strength requirements, progression exercises, and training tips.',
    type: 'article',
  },
}

const STRENGTH_REQUIREMENTS = [
  { exercise: 'Pike Push-Ups', requirement: '15+ reps', importance: 'Foundation', description: 'Builds overhead pressing pattern' },
  { exercise: 'Elevated Pike Push-Ups', requirement: '12+ reps', importance: 'Essential', description: 'Increases vertical pressing angle' },
  { exercise: 'Wall Handstand Hold', requirement: '60+ seconds', importance: 'Critical', description: 'Builds balance and shoulder stability' },
  { exercise: 'Dips', requirement: '20+ reps', importance: 'Important', description: 'Develops tricep and shoulder strength' },
  { exercise: 'Overhead Press', requirement: '0.5x bodyweight', importance: 'Helpful', description: 'Raw pressing strength indicator' },
]

const PROGRESSION_PATH = [
  { stage: 'Stage 1', name: 'Pike Push-Ups', description: 'Build basic pressing pattern', duration: '2-4 weeks' },
  { stage: 'Stage 2', name: 'Elevated Pike Push-Ups', description: 'Increase angle progressively', duration: '4-6 weeks' },
  { stage: 'Stage 3', name: 'Wall Handstand Holds', description: 'Build balance and endurance', duration: '4-8 weeks' },
  { stage: 'Stage 4', name: 'Wall HSPU Negatives', description: 'Eccentric strength development', duration: '4-6 weeks' },
  { stage: 'Stage 5', name: 'Wall Handstand Push-Ups', description: 'Full ROM against wall', duration: '6-12 weeks' },
  { stage: 'Stage 6', name: 'Freestanding HSPU', description: 'Balance + strength combined', duration: '12+ weeks' },
]

const COMMON_MISTAKES = [
  { mistake: 'Skipping pike progressions', fix: 'Master pike push-ups before moving to wall work' },
  { mistake: 'Neglecting balance training', fix: 'Practice freestanding handstands separately' },
  { mistake: 'Flaring elbows too wide', fix: 'Keep elbows at 45 degrees, not 90' },
  { mistake: 'Insufficient core tension', fix: 'Maintain hollow body position throughout' },
  { mistake: 'Going too deep too soon', fix: 'Build ROM gradually to protect shoulders' },
]

const FAQ_ITEMS = [
  {
    question: 'How long does it take to learn handstand push-ups?',
    answer: 'Most athletes need 6-12 months of dedicated training to achieve wall handstand push-ups, and 1-2+ years for freestanding HSPUs. This depends heavily on your starting strength and handstand balance.'
  },
  {
    question: 'Do I need to be able to hold a handstand first?',
    answer: 'For wall HSPUs, a 30-60 second wall handstand hold is sufficient. For freestanding HSPUs, you need a solid 30+ second freestanding handstand before adding the push-up component.'
  },
  {
    question: 'What muscles do handstand push-ups work?',
    answer: 'HSPUs primarily target the anterior deltoids, triceps, and upper chest. They also heavily engage the core, traps, and serratus anterior for stability.'
  },
  {
    question: 'Are handstand push-ups harder than regular push-ups?',
    answer: 'Yes, significantly harder. HSPUs require pressing nearly 100% of your bodyweight overhead, while regular push-ups only require pressing about 60-70% of your bodyweight.'
  },
]

export default function HowToTrainForHandstandPushUpsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'How to Train for Handstand Push-Ups', url: '/how-to-train-for-handstand-push-ups' },
  ])

  const faqSchema = generateFAQSchema(FAQ_ITEMS)

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumbSchema, faqSchema]) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4">
            <Link href="/guides" className="hover:text-[#E6E9EF]">Guides</Link>
            <span>/</span>
            <span>HSPU Training</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">How to Train for Handstand Push-Ups</h1>
          <p className="text-xl text-[#A5A5A5]">
            Build the pressing strength, balance, and body control needed to master this impressive vertical pressing skill.
          </p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <div className="text-2xl font-bold text-[#C1121F]">6-12</div>
            <div className="text-sm text-[#6B7280]">Months to Wall HSPU</div>
          </Card>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <div className="text-2xl font-bold text-[#C1121F]">15+</div>
            <div className="text-sm text-[#6B7280]">Pike Push-Ups First</div>
          </Card>
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
            <div className="text-2xl font-bold text-[#C1121F]">60s</div>
            <div className="text-sm text-[#6B7280]">Wall Hold Minimum</div>
          </Card>
        </div>

        {/* Strength Requirements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#C1121F]" />
            Strength Requirements
          </h2>
          <div className="space-y-3">
            {STRENGTH_REQUIREMENTS.map((req) => (
              <Card key={req.exercise} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{req.exercise}</h3>
                    <p className="text-sm text-[#6B7280]">{req.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#C1121F]">{req.requirement}</div>
                    <div className="text-xs text-[#6B7280]">{req.importance}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Progression Path */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#C1121F]" />
            HSPU Progression Path
          </h2>
          <div className="space-y-4">
            {PROGRESSION_PATH.map((stage, index) => (
              <Card key={stage.stage} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C1121F]/20 flex items-center justify-center text-[#C1121F] font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{stage.name}</h3>
                      <span className="text-sm text-[#6B7280]">{stage.duration}</span>
                    </div>
                    <p className="text-sm text-[#A5A5A5]">{stage.description}</p>
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
            Common Mistakes to Avoid
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

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#C1121F]" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq) => (
              <Card key={faq.question} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-[#A5A5A5]">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/20 to-[#1A1F26] border-[#C1121F]/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Build HSPU Strength?</h2>
            <p className="text-[#A5A5A5] mb-6 max-w-xl mx-auto">
              Use SpartanLab to create a personalized handstand push-up training program based on your current strength level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/calisthenics-program-builder">
                <Button className="bg-[#C1121F] hover:bg-[#A30F1A]">
                  Build Your Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/skills/handstand-push-up">
                <Button variant="outline" className="border-[#2B313A]">
                  HSPU Skill Hub
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* Related Links */}
        <section>
          <h2 className="text-xl font-bold mb-4">Related Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/dip-strength-standards" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Dip Strength Standards</h3>
                <p className="text-sm text-[#6B7280]">Check your pressing strength benchmarks</p>
              </Card>
            </Link>
            <Link href="/push-up-strength-standards" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Push-Up Standards</h3>
                <p className="text-sm text-[#6B7280]">Foundational pressing strength</p>
              </Card>
            </Link>
            <Link href="/programs/handstand-push-up-program" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">HSPU Training Program</h3>
                <p className="text-sm text-[#6B7280]">Structured progression plan</p>
              </Card>
            </Link>
            <Link href="/exercises/dip" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Dip Exercise Guide</h3>
                <p className="text-sm text-[#6B7280]">Build pressing foundation</p>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
