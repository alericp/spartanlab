import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Target, Dumbbell, Star, CheckCircle2 } from 'lucide-react'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Best Exercises for Front Lever | Top 10 Training Movements',
  description: 'Discover the best exercises to build your front lever. From pull-ups to front lever rows, learn which movements will accelerate your progress.',
  keywords: ['front lever exercises', 'best exercises for front lever', 'front lever training', 'front lever workout'],
  openGraph: {
    title: 'Best Exercises for Front Lever | Top 10 Training Movements',
    description: 'Discover the best exercises to build your front lever.',
    type: 'article',
  },
}

const EXERCISES = [
  {
    rank: 1,
    name: 'Front Lever Rows',
    category: 'Skill-Specific',
    description: 'The single most effective exercise for front lever. Builds horizontal pulling strength in the exact position needed.',
    muscles: ['Lats', 'Rear Delts', 'Core'],
    link: '/exercises/front-lever-row',
    tips: ['Start in tuck position', 'Focus on full ROM', 'Keep body tension throughout'],
  },
  {
    rank: 2,
    name: 'Weighted Pull-Ups',
    category: 'Strength Foundation',
    description: 'Builds the raw pulling strength needed to hold your body horizontal. A weighted pull-up of +50% bodyweight is a strong indicator of front lever readiness.',
    muscles: ['Lats', 'Biceps', 'Rear Delts'],
    link: '/exercises/pull-up',
    tips: ['Progress weight gradually', 'Full range of motion', 'Target +50% bodyweight'],
  },
  {
    rank: 3,
    name: 'Hollow Body Holds',
    category: 'Core Foundation',
    description: 'Develops the core tension and body line required to maintain the horizontal position. Essential for connecting upper and lower body.',
    muscles: ['Rectus Abdominis', 'Hip Flexors', 'Serratus'],
    link: '/exercises/hollow-body-hold',
    tips: ['Lower back pressed to floor', 'Arms overhead', 'Build to 60 seconds'],
  },
  {
    rank: 4,
    name: 'Tuck Front Lever Holds',
    category: 'Skill-Specific',
    description: 'The first front lever progression. Teaches body positioning and lat engagement at reduced leverage.',
    muscles: ['Lats', 'Core', 'Rear Delts'],
    link: '/front-lever-progression',
    tips: ['Keep hips at bar height', 'Depress shoulders', 'Build to 20 second holds'],
  },
  {
    rank: 5,
    name: 'Arch Hangs',
    category: 'Activation',
    description: 'Teaches scapular retraction and lat engagement needed for the front lever. Great warm-up and skill primer.',
    muscles: ['Lats', 'Lower Traps', 'Rear Delts'],
    link: '/exercises/arch-hang',
    tips: ['Active shoulders', 'Chest toward bar', 'Hold for 10-15 seconds'],
  },
  {
    rank: 6,
    name: 'Ice Cream Makers',
    category: 'Dynamic Skill',
    description: 'Dynamic movement from inverted hang to front lever position. Builds the pulling power through full range.',
    muscles: ['Lats', 'Core', 'Biceps'],
    link: null,
    tips: ['Control the descent', 'Start with tuck', 'Focus on lat engagement'],
  },
  {
    rank: 7,
    name: 'Dragon Flags',
    category: 'Core Strength',
    description: 'Advanced core exercise that mimics front lever body tension. Excellent for building anti-extension strength.',
    muscles: ['Core', 'Hip Flexors', 'Lats'],
    link: null,
    tips: ['Keep body straight', 'Control the negative', 'Progress from bent knee'],
  },
  {
    rank: 8,
    name: 'Inverted Rows',
    category: 'Foundation',
    description: 'Horizontal pulling pattern at reduced difficulty. Great for beginners building toward front lever.',
    muscles: ['Lats', 'Rhomboids', 'Rear Delts'],
    link: null,
    tips: ['Keep body straight', 'Pull to chest', 'Progress angle over time'],
  },
  {
    rank: 9,
    name: 'Scapular Pull-Ups',
    category: 'Activation',
    description: 'Isolates scapular depression and retraction. Builds the shoulder control needed for front lever.',
    muscles: ['Lower Traps', 'Lats', 'Serratus'],
    link: null,
    tips: ['Arms stay straight', 'Depress and retract', 'Full ROM'],
  },
  {
    rank: 10,
    name: 'Negative Front Levers',
    category: 'Skill-Specific',
    description: 'Eccentric front lever training. Lower slowly from inverted hang to build strength through full range.',
    muscles: ['Lats', 'Core', 'Rear Delts'],
    link: '/front-lever-progression',
    tips: ['5-10 second negatives', 'Maintain body tension', 'Start with tuck'],
  },
]

const FAQ_ITEMS = [
  {
    question: 'How often should I train front lever exercises?',
    answer: 'Train front lever-specific exercises 2-3 times per week with at least 48 hours rest between sessions. You can train general pulling strength more frequently.'
  },
  {
    question: 'Should I do front lever rows or holds?',
    answer: 'Both are essential. Rows build dynamic pulling strength while holds build isometric strength. A good program includes both, with rows typically done for 3-5 reps and holds for time.'
  },
  {
    question: 'Can I train front lever every day?',
    answer: 'Not recommended. Front lever training is highly demanding on the lats, core, and connective tissues. Daily training leads to overuse injuries and stalled progress.'
  },
]

export default function BestExercisesForFrontLeverPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Front Lever', url: '/skills/front-lever' },
    { name: 'Best Exercises', url: '/best-exercises-for-front-lever' },
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
            <span>Best Exercises</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Best Exercises for Front Lever</h1>
          <p className="text-xl text-[#A5A5A5]">
            The top 10 exercises to build your front lever, ranked by effectiveness and transfer to the skill.
          </p>
        </header>

        {/* Exercise List */}
        <section className="mb-12">
          <div className="space-y-4">
            {EXERCISES.map((exercise) => (
              <Card key={exercise.rank} className="bg-[#1A1F26] border-[#2B313A] p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C1121F]/20 flex items-center justify-center text-[#C1121F] font-bold text-xl flex-shrink-0">
                    {exercise.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold">{exercise.name}</h2>
                      <span className="text-xs px-2 py-1 rounded bg-[#2B313A] text-[#6B7280]">
                        {exercise.category}
                      </span>
                    </div>
                    <p className="text-[#A5A5A5] mb-3">{exercise.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {exercise.muscles.map((muscle) => (
                        <span key={muscle} className="text-xs px-2 py-1 rounded bg-[#C1121F]/10 text-[#C1121F]">
                          {muscle}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {exercise.tips.map((tip) => (
                        <div key={tip} className="flex items-center gap-2 text-sm text-[#6B7280]">
                          <CheckCircle2 className="w-3 h-3 text-[#C1121F]" />
                          {tip}
                        </div>
                      ))}
                    </div>
                    {exercise.link && (
                      <div className="mt-4">
                        <Link href={exercise.link}>
                          <Button variant="outline" size="sm" className="border-[#2B313A] text-[#A5A5A5]">
                            Learn More
                            <ArrowRight className="w-3 h-3 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
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
            <h2 className="text-2xl font-bold mb-4">Build Your Front Lever Program</h2>
            <p className="text-[#A5A5A5] mb-6">
              Get a personalized training program based on your current strength level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/front-lever-readiness-calculator">
                <Button variant="outline" className="border-[#2B313A]">
                  Test Your Readiness
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
            <Link href="/skills/front-lever" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Front Lever Skill Hub</h3>
                <p className="text-sm text-[#6B7280]">Complete front lever resource center</p>
              </Card>
            </Link>
            <Link href="/front-lever-progression" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Front Lever Progression</h3>
                <p className="text-sm text-[#6B7280]">Step-by-step progression guide</p>
              </Card>
            </Link>
            <Link href="/how-many-pull-ups-for-front-lever" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Strength Requirements</h3>
                <p className="text-sm text-[#6B7280]">How many pull-ups do you need?</p>
              </Card>
            </Link>
            <Link href="/front-lever-vs-planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Front Lever vs Planche</h3>
                <p className="text-sm text-[#6B7280]">Which skill to train first?</p>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
