import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Push-Up Strength Standards | How Many Push-Ups Should You Do? | SpartanLab',
  description: 'Complete push-up strength standards from beginner to elite. Learn how many push-ups indicate good fitness and how to improve your pressing endurance.',
  keywords: ['push-up strength standards', 'how many push-ups', 'push-up test', 'push-up benchmarks', 'bodyweight fitness standards'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/push-up-strength-standards`,
  },
  openGraph: {
    title: 'Push-Up Strength Standards | SpartanLab',
    description: 'Complete push-up strength standards from beginner to elite. Know your fitness level.',
    url: `${SITE_CONFIG.url}/push-up-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const standards = [
  { level: 'Beginner', reps: '5-15', description: 'Basic pressing pattern established. Focus on form.', color: 'text-blue-400' },
  { level: 'Intermediate', reps: '16-35', description: 'Solid foundation for endurance work.', color: 'text-green-400' },
  { level: 'Advanced', reps: '36-60', description: 'Strong pressing endurance. Ready for variations.', color: 'text-yellow-400' },
  { level: 'Elite', reps: '61+', description: 'Exceptional pushing endurance capacity.', color: 'text-[#C1121F]' },
]

const byAgeAndGender = [
  { group: 'Men 20-29', beginner: '10-20', intermediate: '25-40', advanced: '45-60', elite: '65+' },
  { group: 'Men 30-39', beginner: '8-18', intermediate: '22-35', advanced: '40-55', elite: '60+' },
  { group: 'Men 40-49', beginner: '6-15', intermediate: '18-30', advanced: '35-50', elite: '55+' },
  { group: 'Men 50+', beginner: '5-12', intermediate: '15-25', advanced: '30-40', elite: '45+' },
  { group: 'Women 20-29', beginner: '5-12', intermediate: '15-25', advanced: '30-40', elite: '45+' },
  { group: 'Women 30-39', beginner: '4-10', intermediate: '12-22', advanced: '25-35', elite: '40+' },
]

const progressions = [
  { variation: 'Knee Push-Ups', description: 'Great for beginners building pressing strength' },
  { variation: 'Standard Push-Ups', description: 'The baseline for measuring pressing endurance' },
  { variation: 'Diamond Push-Ups', description: 'Increased tricep emphasis' },
  { variation: 'Archer Push-Ups', description: 'Progression toward one-arm push-ups' },
  { variation: 'Pseudo Planche Push-Ups', description: 'Planche-specific pushing strength' },
]

const improvementTips = [
  { title: 'Greasing the Groove', description: 'Do multiple sets throughout the day at 40-50% of max' },
  { title: 'Pyramids', description: 'Increase reps each set then decrease (1,2,3,4,5,4,3,2,1)' },
  { title: 'Timed Sets', description: 'Do as many as possible in 2 minutes, try to beat your score' },
  { title: 'Weighted Push-Ups', description: 'Add resistance to build max strength' },
]

const faqs = [
  {
    question: 'How many push-ups should a man be able to do?',
    answer: 'For men aged 20-39, 20-30 push-ups is average/intermediate, 35-50 is above average/advanced, and 50+ is excellent/elite. These numbers decrease slightly with age.',
  },
  {
    question: 'Is 50 push-ups good?',
    answer: 'Yes, 50 consecutive push-ups with good form is an advanced fitness level. This indicates strong pressing endurance and puts you in the top tier of general fitness.',
  },
  {
    question: 'How many push-ups should I do a day?',
    answer: 'For general fitness, 50-100 push-ups per day spread across multiple sets is effective. For strength building, do 3-5 sets of challenging variations 3-4 times per week with rest days.',
  },
  {
    question: 'Why are dips harder than push-ups?',
    answer: 'Dips require you to lift 100% of your bodyweight through a larger range of motion, while push-ups only load about 60-70% of bodyweight. Most people can do 2-3x more push-ups than dips.',
  },
  {
    question: 'Do push-ups build muscle?',
    answer: 'Yes, but primarily for beginners. Once you can do 20+ push-ups easily, they become more of an endurance exercise. Add weight or progress to harder variations to continue building muscle.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Push-Up Strength Standards',
    description: 'Complete push-up strength standards by age and fitness level.',
    url: `${SITE_CONFIG.url}/push-up-strength-standards`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Standards', url: '/calisthenics-strength-standards' },
    { name: 'Push-Up Standards', url: '/push-up-strength-standards' },
  ]),
  generateFAQSchema(faqs),
]

export default function PushUpStrengthStandardsPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/calisthenics-strength-standards" className="hover:text-[#E6E9EF]">Strength Standards</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Push-Ups</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Strength Standards</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Push-Up Strength Standards</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The push-up is the universal test of upper body pressing endurance. While simple, 
            your push-up numbers reveal your baseline fitness and serve as a foundation for 
            more advanced pressing work.
          </p>
        </header>

        {/* Quick Standards Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Push-Up Standards by Level</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {standards.map((standard) => (
              <Card key={standard.level} className="bg-[#1A1D23] border-[#2B313A] p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg font-bold ${standard.color}`}>{standard.level}</span>
                  <span className="text-2xl font-bold text-[#E6E9EF]">{standard.reps} reps</span>
                </div>
                <p className="text-sm text-[#A5A5A5]">{standard.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* By Age/Gender Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Standards by Age and Gender</h2>
          <p className="text-[#A5A5A5] mb-6">
            Push-up standards vary by age and gender. These benchmarks help you understand where you stand.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B313A]">
                  <TableHead className="text-[#E6E9EF]">Group</TableHead>
                  <TableHead className="text-blue-400">Beginner</TableHead>
                  <TableHead className="text-green-400">Intermediate</TableHead>
                  <TableHead className="text-yellow-400">Advanced</TableHead>
                  <TableHead className="text-[#C1121F]">Elite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byAgeAndGender.map((row) => (
                  <TableRow key={row.group} className="border-[#2B313A]">
                    <TableCell className="text-[#E6E9EF] font-medium">{row.group}</TableCell>
                    <TableCell>{row.beginner}</TableCell>
                    <TableCell>{row.intermediate}</TableCell>
                    <TableCell>{row.advanced}</TableCell>
                    <TableCell>{row.elite}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Progressions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Push-Up Progressions</h2>
          <p className="text-[#A5A5A5] mb-6">
            Once standard push-ups become easy, progress to harder variations:
          </p>
          <div className="space-y-3">
            {progressions.map((item) => (
              <Card key={item.variation} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF]">{item.variation}</h3>
                    <p className="text-sm text-[#A5A5A5]">{item.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#6B7280]" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* How to Improve */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How to Improve Your Push-Up Numbers</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {improvementTips.map((tip) => (
              <Card key={tip.title} className="bg-[#1A1D23] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C1121F] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{tip.title}</h3>
                    <p className="text-sm text-[#A5A5A5]">{tip.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-[#C1121F]/10 to-[#1A1D23] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-2">Ready for Harder Variations?</h2>
            <p className="text-[#A5A5A5] mb-4">
              Once you hit 30+ push-ups, it is time to explore planche progressions and advanced pushing work.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/exercises/pseudo-planche-push-up">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  Pseudo Planche Push-Ups
                </Button>
              </Link>
              <Link href="/skills/planche">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Planche Training Hub
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
          <h2 className="text-xl font-bold mb-4">Related Standards</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/dip-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Dip Standards
              </Button>
            </Link>
            <Link href="/pull-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Pull-Up Standards
              </Button>
            </Link>
            <Link href="/calisthenics-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                All Strength Standards
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
