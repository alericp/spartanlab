import { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Best Exercises for Planche | Top 10 Training Movements',
  description: 'Discover the best exercises to build your planche. From pseudo planche push-ups to planche leans, learn which movements will accelerate your progress.',
  keywords: ['planche exercises', 'best exercises for planche', 'planche training', 'planche workout'],
  openGraph: {
    title: 'Best Exercises for Planche | Top 10 Training Movements',
    description: 'Discover the best exercises to build your planche.',
    type: 'article',
  },
}

const EXERCISES = [
  {
    rank: 1,
    name: 'Planche Leans',
    category: 'Skill-Specific',
    description: 'The most important planche exercise. Progressively lean forward in a push-up position to load the shoulders in the planche angle.',
    muscles: ['Anterior Delts', 'Chest', 'Core'],
    tips: ['Hands turned out 45 degrees', 'Protract shoulders fully', 'Increase lean gradually'],
  },
  {
    rank: 2,
    name: 'Pseudo Planche Push-Ups',
    category: 'Skill-Specific',
    description: 'Push-ups with significant forward lean. Builds dynamic pressing strength in planche position.',
    muscles: ['Anterior Delts', 'Chest', 'Triceps'],
    tips: ['Lean forward as far as possible', 'Keep elbows in', 'Full range of motion'],
  },
  {
    rank: 3,
    name: 'Tuck Planche Holds',
    category: 'Skill-Specific',
    description: 'First planche progression. Teaches balance and shoulder positioning at reduced leverage.',
    muscles: ['Anterior Delts', 'Core', 'Serratus'],
    tips: ['Round upper back', 'Push through shoulders', 'Hips above hands'],
  },
  {
    rank: 4,
    name: 'Dips',
    category: 'Strength Foundation',
    description: 'Builds the pressing strength foundation. Target 20+ reps before serious planche training.',
    muscles: ['Chest', 'Triceps', 'Anterior Delts'],
    tips: ['Full depth', 'Lean forward slightly', 'Progress to weighted'],
  },
  {
    rank: 5,
    name: 'Straight Arm Strength Work',
    category: 'Skill-Specific',
    description: 'Support holds with straight arms. Builds the straight-arm strength unique to planche.',
    muscles: ['Bicep Tendons', 'Forearms', 'Anterior Delts'],
    tips: ['Lock arms completely', 'Protracted shoulders', 'Build time gradually'],
  },
  {
    rank: 6,
    name: 'Hollow Body Holds',
    category: 'Core Foundation',
    description: 'Develops the posterior pelvic tilt and core tension needed for planche body position.',
    muscles: ['Rectus Abdominis', 'Hip Flexors', 'Serratus'],
    tips: ['Lower back flat', 'Arms overhead', 'Build to 60 seconds'],
  },
  {
    rank: 7,
    name: 'Wrist Conditioning',
    category: 'Prehab',
    description: 'Essential prep for planche. Wrist flexibility and strength prevent injury and enable progression.',
    muscles: ['Forearm Flexors', 'Forearm Extensors'],
    tips: ['Daily stretching', 'Wrist push-ups', 'Progress slowly'],
  },
  {
    rank: 8,
    name: 'Pike Push-Ups',
    category: 'Foundation',
    description: 'Builds overhead pressing pattern that transfers to planche lean angle.',
    muscles: ['Anterior Delts', 'Triceps', 'Upper Chest'],
    tips: ['Hips high', 'Head toward floor', 'Progress to elevated'],
  },
  {
    rank: 9,
    name: 'L-Sit Holds',
    category: 'Foundation',
    description: 'Develops straight-arm pressing strength and hip flexor power for planche.',
    muscles: ['Hip Flexors', 'Triceps', 'Core'],
    tips: ['Lock arms', 'Push shoulders down', 'Legs parallel to floor'],
  },
  {
    rank: 10,
    name: 'Frog Stand',
    category: 'Skill Foundation',
    description: 'Entry-level balance skill. Teaches hand balancing and forward lean basics.',
    muscles: ['Core', 'Shoulders', 'Wrists'],
    tips: ['Knees on elbows', 'Look forward', 'Hold for 30+ seconds'],
  },
]

const FAQ_ITEMS = [
  {
    question: 'How often should I train planche exercises?',
    answer: 'Train planche 2-3 times per week. Due to the high shoulder and wrist stress, adequate recovery is crucial. Many athletes use a skill day / strength day split.'
  },
  {
    question: 'What is the most important exercise for planche?',
    answer: 'Planche leans are the single most important exercise. They directly train the forward lean and shoulder angle needed while allowing progressive overload through lean angle.'
  },
  {
    question: 'Do I need to do weighted exercises for planche?',
    answer: 'Weighted dips and push-ups can help build the strength foundation, but the planche itself requires specific straight-arm strength that is best trained with skill-specific exercises.'
  },
]

export default function BestExercisesForPlanchePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
    { name: 'Planche', url: '/skills/planche' },
    { name: 'Best Exercises', url: '/best-exercises-for-planche' },
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
            <span>Best Exercises</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Best Exercises for Planche</h1>
          <p className="text-xl text-[#A5A5A5]">
            The top 10 exercises to build your planche, ranked by effectiveness and transfer to the skill.
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
            <h2 className="text-2xl font-bold mb-4">Build Your Planche Program</h2>
            <p className="text-[#A5A5A5] mb-6">
              Get a personalized training program based on your current strength level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/planche-readiness-calculator">
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
            <Link href="/skills/planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Planche Skill Hub</h3>
                <p className="text-sm text-[#6B7280]">Complete planche resource center</p>
              </Card>
            </Link>
            <Link href="/how-strong-for-planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Strength Requirements</h3>
                <p className="text-sm text-[#6B7280]">How strong do you need to be?</p>
              </Card>
            </Link>
            <Link href="/front-lever-vs-planche" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Front Lever vs Planche</h3>
                <p className="text-sm text-[#6B7280]">Which skill to train first?</p>
              </Card>
            </Link>
            <Link href="/planche-training-guide" className="block">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                <h3 className="font-semibold mb-1">Planche Training Guide</h3>
                <p className="text-sm text-[#6B7280]">Complete training guide</p>
              </Card>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
