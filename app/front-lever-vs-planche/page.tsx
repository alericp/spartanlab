import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Target, Dumbbell, Brain, CheckCircle2, Scale } from 'lucide-react'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Front Lever vs Planche: Which is Harder? | Complete Comparison',
  description: 'Compare front lever and planche difficulty, strength requirements, and training approaches. Learn which skill to train first and why.',
  keywords: ['front lever vs planche', 'planche vs front lever', 'which is harder', 'calisthenics skills comparison'],
  openGraph: {
    title: 'Front Lever vs Planche: Which is Harder?',
    description: 'Compare front lever and planche difficulty, strength requirements, and training approaches.',
    type: 'article',
  },
}

const COMPARISON_DATA = [
  { category: 'Primary Movement', frontLever: 'Horizontal Pull', planche: 'Horizontal Push' },
  { category: 'Main Muscles', frontLever: 'Lats, Core, Rear Delts', planche: 'Anterior Delts, Chest, Core' },
  { category: 'Difficulty Level', frontLever: '8/10', planche: '10/10' },
  { category: 'Time to Achieve (Full)', frontLever: '1-3 years', planche: '3-5+ years' },
  { category: 'Strength Prerequisite', frontLever: '15+ Pull-Ups', planche: '30+ Push-Ups, 20+ Dips' },
  { category: 'Body Type Advantage', frontLever: 'Lighter athletes', planche: 'Shorter arms, lighter build' },
  { category: 'Joint Stress', frontLever: 'Shoulders, Elbows', planche: 'Wrists, Shoulders, Elbows' },
  { category: 'Balance Requirement', frontLever: 'Moderate', planche: 'High' },
]

const FAQ_ITEMS = [
  {
    question: 'Is planche harder than front lever?',
    answer: 'Yes, the planche is generally considered harder than the front lever. The planche requires extreme shoulder strength in a mechanically disadvantaged position, plus significant wrist conditioning. Most athletes achieve a full front lever 1-2 years before a full planche.'
  },
  {
    question: 'Should I train front lever or planche first?',
    answer: 'Most coaches recommend training front lever first because it builds foundational pulling strength and body tension that transfers to planche training. The front lever also has a lower injury risk and faster progression timeline.'
  },
  {
    question: 'Can you train front lever and planche together?',
    answer: 'Yes, training both simultaneously is common and often recommended. They target opposite muscle groups (pull vs push), so they complement each other well. Just ensure adequate recovery between sessions.'
  },
  {
    question: 'Which skill transfers better to other exercises?',
    answer: 'Front lever transfers well to muscle-ups, one-arm pull-ups, and back levers. Planche transfers to handstand push-ups, planche push-ups, and straight-arm pressing movements. Both build exceptional core strength.'
  },
]

export default function FrontLeverVsPlanchePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Front Lever vs Planche', url: '/front-lever-vs-planche' },
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
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280] mb-4">
            <Link href="/skills" className="hover:text-[#E6E9EF]">Skills</Link>
            <span>/</span>
            <span>Comparison</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Front Lever vs Planche</h1>
          <p className="text-xl text-[#A5A5A5] max-w-2xl mx-auto">
            The two most iconic horizontal holds in calisthenics. Learn the key differences, which is harder, and which to train first.
          </p>
        </header>

        {/* Visual Comparison */}
        <section className="mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Front Lever Card */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <Dumbbell className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold">Front Lever</h2>
                <p className="text-[#6B7280]">Horizontal Pull Hold</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Easier to progress
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Lower injury risk
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Builds pull strength foundation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Achievable in 1-3 years
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-[#2B313A]">
                <Link href="/skills/front-lever">
                  <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    Front Lever Hub
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Planche Card */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#C1121F]/20 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-8 h-8 text-[#C1121F]" />
                </div>
                <h2 className="text-2xl font-bold">Planche</h2>
                <p className="text-[#6B7280]">Horizontal Push Hold</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                  Ultimate pushing skill
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                  Requires wrist conditioning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                  Extreme shoulder strength
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                  Takes 3-5+ years
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-[#2B313A]">
                <Link href="/skills/planche">
                  <Button variant="outline" className="w-full border-[#C1121F]/30 text-[#C1121F] hover:bg-[#C1121F]/10">
                    Planche Hub
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#C1121F]" />
            Side-by-Side Comparison
          </h2>
          <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2B313A]">
                    <th className="text-left p-4 text-[#6B7280] font-medium">Category</th>
                    <th className="text-center p-4 text-blue-400 font-medium">Front Lever</th>
                    <th className="text-center p-4 text-[#C1121F] font-medium">Planche</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_DATA.map((row, i) => (
                    <tr key={row.category} className={i !== COMPARISON_DATA.length - 1 ? 'border-b border-[#2B313A]' : ''}>
                      <td className="p-4 font-medium">{row.category}</td>
                      <td className="p-4 text-center text-[#A5A5A5]">{row.frontLever}</td>
                      <td className="p-4 text-center text-[#A5A5A5]">{row.planche}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Which to Train First */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Which Should You Train First?</h2>
          <Card className="bg-gradient-to-br from-blue-500/10 to-[#1A1F26] border-blue-500/20 p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Recommendation: Start with Front Lever</h3>
            <div className="space-y-3 text-[#A5A5A5]">
              <p>
                For most athletes, we recommend starting with the front lever for several reasons:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                  <span>Faster progression timeline provides motivation and measurable wins</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                  <span>Lower wrist and shoulder injury risk during learning phase</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                  <span>Builds core tension patterns that transfer to planche</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                  <span>Pulling strength foundation benefits overall calisthenics development</span>
                </li>
              </ul>
            </div>
          </Card>
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
            <h2 className="text-2xl font-bold mb-4">Ready to Start Training?</h2>
            <p className="text-[#A5A5A5] mb-6 max-w-xl mx-auto">
              Test your readiness for both skills and get a personalized training program.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/front-lever-readiness-calculator">
                <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                  Front Lever Calculator
                </Button>
              </Link>
              <Link href="/planche-readiness-calculator">
                <Button variant="outline" className="border-[#C1121F]/30 text-[#C1121F] hover:bg-[#C1121F]/10">
                  Planche Calculator
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

        {/* Related Links */}
        <section>
          <h2 className="text-xl font-bold mb-4">Related Resources</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/best-exercises-for-front-lever" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-blue-500/50 transition-colors">
                <h3 className="font-semibold mb-1">Best Exercises for Front Lever</h3>
                <p className="text-sm text-[#6B7280]">Top exercises to build your front lever</p>
              </Card>
            </Link>
            <Link href="/best-exercises-for-planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Best Exercises for Planche</h3>
                <p className="text-sm text-[#6B7280]">Top exercises to build your planche</p>
              </Card>
            </Link>
            <Link href="/how-many-pull-ups-for-front-lever" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#2B313A] transition-colors">
                <h3 className="font-semibold mb-1">Pull-Up Requirements</h3>
                <p className="text-sm text-[#6B7280]">How many pull-ups for front lever?</p>
              </Card>
            </Link>
            <Link href="/how-strong-for-planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#2B313A] transition-colors">
                <h3 className="font-semibold mb-1">Planche Strength Requirements</h3>
                <p className="text-sm text-[#6B7280]">How strong for a planche?</p>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
