import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, Target, Scale, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Powerlifting Strength Standards | SBD Benchmarks by Bodyweight | SpartanLab',
  description: 'Complete powerlifting strength standards for squat, bench, and deadlift. Relative strength benchmarks from beginner to elite for all weight classes.',
  keywords: ['powerlifting strength standards', 'squat bench deadlift standards', 'SBD standards', 'powerlifting totals', 'strength standards by bodyweight'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/powerlifting-strength-standards`,
  },
  openGraph: {
    title: 'Powerlifting Strength Standards | SpartanLab',
    description: 'Complete SBD standards by bodyweight. Know your powerlifting level.',
    url: `${SITE_CONFIG.url}/powerlifting-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const squatStandards = [
  { level: 'Beginner', multiplier: '0.75x BW', color: 'text-blue-400' },
  { level: 'Intermediate', multiplier: '1.25x BW', color: 'text-green-400' },
  { level: 'Advanced', multiplier: '1.75x BW', color: 'text-yellow-400' },
  { level: 'Elite', multiplier: '2.25x+ BW', color: 'text-[#C1121F]' },
]

const benchStandards = [
  { level: 'Beginner', multiplier: '0.5x BW', color: 'text-blue-400' },
  { level: 'Intermediate', multiplier: '1.0x BW', color: 'text-green-400' },
  { level: 'Advanced', multiplier: '1.5x BW', color: 'text-yellow-400' },
  { level: 'Elite', multiplier: '2.0x+ BW', color: 'text-[#C1121F]' },
]

const deadliftStandards = [
  { level: 'Beginner', multiplier: '1.0x BW', color: 'text-blue-400' },
  { level: 'Intermediate', multiplier: '1.5x BW', color: 'text-green-400' },
  { level: 'Advanced', multiplier: '2.0x BW', color: 'text-yellow-400' },
  { level: 'Elite', multiplier: '2.5x+ BW', color: 'text-[#C1121F]' },
]

const totalsByBW = [
  { bw: '150 lb', beginner: '340 lb', intermediate: '565 lb', advanced: '790 lb', elite: '1015 lb+' },
  { bw: '175 lb', beginner: '395 lb', intermediate: '660 lb', advanced: '920 lb', elite: '1180 lb+' },
  { bw: '200 lb', beginner: '450 lb', intermediate: '750 lb', advanced: '1050 lb', elite: '1350 lb+' },
  { bw: '225 lb', beginner: '510 lb', intermediate: '845 lb', advanced: '1180 lb', elite: '1520 lb+' },
]

const wilksComparison = [
  { level: 'Beginner', wilks: '< 200', description: 'Learning lifts. Building foundation.' },
  { level: 'Intermediate', wilks: '200-300', description: 'Solid base. 1-3 years training.' },
  { level: 'Advanced', wilks: '300-400', description: 'Strong. Local competition level.' },
  { level: 'Elite', wilks: '400-500', description: 'Very strong. National level.' },
  { level: 'World Class', wilks: '500+', description: 'Top 0.1%. International competition.' },
]

const faqs = [
  {
    question: 'What is a good powerlifting total?',
    answer: 'A "good" total depends on bodyweight and training age. For a 180 lb lifter, 800 lb total (200 lb x 4.4 BW) is intermediate, 1100+ lb is advanced, and 1400+ lb approaches elite. Wilks score provides bodyweight-independent comparison.',
  },
  {
    question: 'Can powerlifters do calisthenics skills?',
    answer: 'Yes, but relative strength matters. A 200 lb lifter with a 1000 lb total has raw strength but may struggle with front levers due to bodyweight ratio. Lighter powerlifters and those who maintain relative strength excel at calisthenics crossover.',
  },
  {
    question: 'How does powerlifting total translate to calisthenics?',
    answer: 'Indirect correlation. A 2x BW deadlift suggests pulling strength for weighted pull-ups. A 1.5x BW bench correlates with strong dips. But calisthenics requires straight-arm strength, leverage control, and relative strength that powerlifting doesn\'t directly train.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Powerlifting Strength Standards',
    description: 'Complete SBD standards for all levels and bodyweight classes',
    url: `${SITE_CONFIG.url}/powerlifting-strength-standards`,
    publishedDate: '2024-01-01',
    modifiedDate: new Date().toISOString().split('T')[0],
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Strength Standards', url: `${SITE_CONFIG.url}/calisthenics-strength-standards` },
    { name: 'Powerlifting Standards', url: `${SITE_CONFIG.url}/powerlifting-strength-standards` },
  ]),
  generateFAQSchema(faqs),
]

export default function PowerliftingStrengthStandardsPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/calisthenics-strength-standards" className="hover:text-[#E6E9EF]">Strength Standards</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Powerlifting</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#C1121F]/10 rounded-lg">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <span className="text-sm font-medium text-[#C1121F]">Barbell Strength</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF] mb-4">
            Powerlifting Strength Standards
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            Squat, bench, and deadlift benchmarks by bodyweight ratio. Understand your 
            powerlifting level and how barbell strength integrates with calisthenics training.
          </p>
        </div>
      </section>

      {/* SBD Standards Grid */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Relative Strength by Lift</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Squat */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-[#E6E9EF] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                Squat
              </h3>
              <div className="space-y-3">
                {squatStandards.map((s) => (
                  <div key={s.level} className="flex justify-between items-center">
                    <span className={`text-sm ${s.color}`}>{s.level}</span>
                    <span className="text-sm text-[#A4ACB8] font-mono">{s.multiplier}</span>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Bench */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-[#E6E9EF] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                Bench Press
              </h3>
              <div className="space-y-3">
                {benchStandards.map((s) => (
                  <div key={s.level} className="flex justify-between items-center">
                    <span className={`text-sm ${s.color}`}>{s.level}</span>
                    <span className="text-sm text-[#A4ACB8] font-mono">{s.multiplier}</span>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Deadlift */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-[#E6E9EF] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#C1121F] rounded-full" />
                Deadlift
              </h3>
              <div className="space-y-3">
                {deadliftStandards.map((s) => (
                  <div key={s.level} className="flex justify-between items-center">
                    <span className={`text-sm ${s.color}`}>{s.level}</span>
                    <span className="text-sm text-[#A4ACB8] font-mono">{s.multiplier}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Total by Bodyweight */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Powerlifting Total by Bodyweight</h2>
          <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B313A]">
                  <TableHead className="text-[#A4ACB8]">Bodyweight</TableHead>
                  <TableHead className="text-blue-400">Beginner</TableHead>
                  <TableHead className="text-green-400">Intermediate</TableHead>
                  <TableHead className="text-yellow-400">Advanced</TableHead>
                  <TableHead className="text-[#C1121F]">Elite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalsByBW.map((row) => (
                  <TableRow key={row.bw} className="border-[#2B313A]">
                    <TableCell className="font-medium text-[#E6E9EF]">{row.bw}</TableCell>
                    <TableCell className="text-[#A4ACB8]">{row.beginner}</TableCell>
                    <TableCell className="text-[#A4ACB8]">{row.intermediate}</TableCell>
                    <TableCell className="text-[#A4ACB8]">{row.advanced}</TableCell>
                    <TableCell className="text-[#A4ACB8]">{row.elite}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <p className="text-xs text-[#6B7280] mt-3">
            * Totals assume ratio split: Squat ~35%, Bench ~25%, Deadlift ~40%
          </p>
        </div>
      </section>

      {/* Wilks Comparison */}
      <section className="py-8 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Wilks Score Reference</h2>
          <p className="text-sm text-[#A4ACB8] mb-4">
            Wilks coefficient normalizes strength across bodyweights for fair comparison.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wilksComparison.map((item) => (
              <Card key={item.level} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-[#E6E9EF]">{item.level}</span>
                  <span className="text-sm text-[#C1121F] font-mono">{item.wilks}</span>
                </div>
                <p className="text-xs text-[#6B7280]">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* System Comparison */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Powerlifting vs. Calisthenics Strength</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-[#E6E9EF]">Powerlifting</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>Absolute strength focus</li>
                <li>3 competition lifts</li>
                <li>External load progression</li>
                <li>Bilateral movements</li>
                <li>Equipment dependent</li>
              </ul>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Calisthenics</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>Relative strength focus</li>
                <li>Infinite progressions</li>
                <li>Leverage manipulation</li>
                <li>Unilateral + isometric</li>
                <li>Minimal equipment</li>
              </ul>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5 border-[#C1121F]/30">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-[#E6E9EF]">SpartanLab Hybrid</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>Both systems unified</li>
                <li>Smart periodization</li>
                <li>Readiness-based loading</li>
                <li>Skill + strength balance</li>
                <li>Adaptive programming</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/deadlift-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Deadlift Standards</h3>
                <p className="text-xs text-[#6B7280]">Detailed pulling benchmarks</p>
              </Card>
            </Link>
            <Link href="/weighted-pull-up-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Pull-Up Standards</h3>
                <p className="text-xs text-[#6B7280]">Calisthenics pulling metrics</p>
              </Card>
            </Link>
            <Link href="/streetlifting-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Streetlifting Standards</h3>
                <p className="text-xs text-[#6B7280]">Weighted calisthenics benchmarks</p>
              </Card>
            </Link>
            <Link href="/weighted-calisthenics-vs-powerlifting">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Systems Compared</h3>
                <p className="text-xs text-[#6B7280]">Choose your path</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <FAQ faqs={faqs} title="Common Questions" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-[#0F1115] to-[#0D0D0D]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Unify Your Strength Training</h2>
          <p className="text-[#A4ACB8] mb-6">
            SpartanLab tracks powerlifting alongside calisthenics for complete strength programming.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2 w-full sm:w-auto">
                Track My Strength
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/hybrid-training-program">
              <Button size="lg" variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] w-full sm:w-auto">
                Explore Hybrid Training
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
