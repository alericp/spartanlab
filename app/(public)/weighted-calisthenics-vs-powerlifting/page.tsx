import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, Target, Scale, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Weighted Calisthenics vs Powerlifting | Which Is Better? | SpartanLab',
  description: 'Complete comparison of weighted calisthenics and powerlifting. Understand the differences in strength development, skill transfer, and which system fits your goals.',
  keywords: ['weighted calisthenics vs powerlifting', 'streetlifting vs powerlifting', 'calisthenics or weightlifting', 'barbell vs bodyweight'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/weighted-calisthenics-vs-powerlifting`,
  },
  openGraph: {
    title: 'Weighted Calisthenics vs Powerlifting | SpartanLab',
    description: 'Complete comparison of weighted calisthenics and powerlifting training systems.',
    url: `${SITE_CONFIG.url}/weighted-calisthenics-vs-powerlifting`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const comparisonTable = [
  { factor: 'Primary Metric', calisthenics: 'Relative strength (% BW)', powerlifting: 'Absolute strength (total lbs)', advantage: 'depends' },
  { factor: 'Equipment Needs', calisthenics: 'Pull-up bar, dip station, belt', powerlifting: 'Barbell, rack, bench, plates', advantage: 'calisthenics' },
  { factor: 'Skill Component', calisthenics: 'High - body control matters', powerlifting: 'Moderate - technique focused', advantage: 'calisthenics' },
  { factor: 'Progression Clarity', calisthenics: 'Clear - add weight', powerlifting: 'Clear - add weight', advantage: 'tie' },
  { factor: 'Competition Structure', calisthenics: 'Growing - WSF, WSWCF', powerlifting: 'Established - IPF, USAPL', advantage: 'powerlifting' },
  { factor: 'Transfer to Skills', calisthenics: 'Direct - same movements', powerlifting: 'Indirect - different patterns', advantage: 'calisthenics' },
  { factor: 'Max Strength Ceiling', calisthenics: 'Limited by body mechanics', powerlifting: 'Higher absolute potential', advantage: 'powerlifting' },
  { factor: 'Injury Risk Profile', calisthenics: 'Shoulder/elbow focus', powerlifting: 'Lower back/knee focus', advantage: 'depends' },
]

const strengthEquivalents = [
  { calisthenics: 'Weighted Pull-Up +50% BW', powerlifting: '~1.8x BW Deadlift', notes: 'Similar relative pulling demand' },
  { calisthenics: 'Weighted Dip +60% BW', powerlifting: '~1.4x BW Bench Press', notes: 'Similar pressing strength' },
  { calisthenics: 'Weighted Pull-Up +100% BW', powerlifting: '~2.2x BW Deadlift', notes: 'Elite relative pulling' },
  { calisthenics: 'Weighted Dip +100% BW', powerlifting: '~1.8x BW Bench Press', notes: 'Elite pressing strength' },
]

const chooseIf = {
  calisthenics: [
    'Your primary goals include calisthenics skills (front lever, planche, muscle-up)',
    'You value relative strength and body control',
    'You train at home or parks with minimal equipment',
    'You want direct carryover to skill work',
    'You prefer a lower bodyweight athlete physique',
  ],
  powerlifting: [
    'Your primary goals are maximal absolute strength',
    'You want to compete in established federations',
    'You have access to a fully equipped gym',
    'You want to build maximum muscle mass',
    'You prioritize the big 3 lifts over skills',
  ],
  hybrid: [
    'You want both skill mastery AND maximum strength',
    'You value complete athletic development',
    'You can train 4-5 days per week',
    'You want the best of both systems',
    'You use SpartanLab to intelligently program both',
  ],
}

const faqs = [
  {
    question: 'Which builds more muscle: weighted calisthenics or powerlifting?',
    answer: 'For pure hypertrophy, powerlifting typically wins due to easier progressive overload and the ability to isolate muscle groups. However, weighted calisthenics builds impressive physiques while developing relative strength and body control. The difference is smaller than most assume.',
  },
  {
    question: 'Can I get strong doing only weighted calisthenics?',
    answer: 'Absolutely. Elite streetlifters achieve +100% BW weighted pull-ups and dips, representing extreme relative strength. A +100% BW weighted pull-up is arguably more impressive than a 2x BW deadlift in terms of athletic capability.',
  },
  {
    question: 'Which is better for athletic performance?',
    answer: 'Weighted calisthenics generally transfers better to sports requiring body control, climbing, and relative strength. Powerlifting better serves sports requiring maximal force production like football or shot put. Most athletes benefit from both.',
  },
  {
    question: 'Why choose when I can do both?',
    answer: 'You can, and SpartanLab is built for exactly this. The key is intelligent programming that doesn\'t exhaust recovery. We track both domains and optimize the interaction between barbell strength and skill progression.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Weighted Calisthenics vs Powerlifting',
    description: 'Complete comparison of training systems for strength development',
    slug: 'weighted-calisthenics-vs-powerlifting',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Training', url: `${SITE_CONFIG.url}/training` },
    { name: 'Calisthenics vs Powerlifting', url: `${SITE_CONFIG.url}/weighted-calisthenics-vs-powerlifting` },
  ]),
  generateFAQSchema(faqs),
]

export default function WeightedCalisthenicsVsPowerliftingPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/training" className="hover:text-[#E6E9EF]">Training</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Calisthenics vs Powerlifting</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#C1121F]/10 rounded-lg">
              <Scale className="w-6 h-6 text-[#C1121F]" />
            </div>
            <span className="text-sm font-medium text-[#C1121F]">Training Systems</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF] mb-4">
            Weighted Calisthenics vs Powerlifting
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            Two paths to strength. One focuses on relative power and body control, 
            the other on absolute force production. Here&apos;s how they compare.
          </p>
        </div>
      </section>

      {/* Quick Comparison */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-[#C1121F]" />
                <h2 className="text-lg font-semibold text-[#E6E9EF]">Weighted Calisthenics</h2>
              </div>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>Relative strength focus</li>
                <li>Direct skill transfer</li>
                <li>Minimal equipment</li>
                <li>Body control emphasis</li>
                <li>Growing competition scene</li>
              </ul>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Dumbbell className="w-6 h-6 text-blue-400" />
                <h2 className="text-lg font-semibold text-[#E6E9EF]">Powerlifting</h2>
              </div>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>Absolute strength focus</li>
                <li>Maximal load potential</li>
                <li>Full gym required</li>
                <li>Technique emphasis</li>
                <li>Established federations</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Factor-by-Factor Comparison</h2>
          <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B313A]">
                  <TableHead className="text-[#A4ACB8]">Factor</TableHead>
                  <TableHead className="text-[#C1121F]">Calisthenics</TableHead>
                  <TableHead className="text-blue-400">Powerlifting</TableHead>
                  <TableHead className="text-[#A4ACB8]">Advantage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonTable.map((row) => (
                  <TableRow key={row.factor} className="border-[#2B313A]">
                    <TableCell className="font-medium text-[#E6E9EF]">{row.factor}</TableCell>
                    <TableCell className="text-[#A4ACB8] text-sm">{row.calisthenics}</TableCell>
                    <TableCell className="text-[#A4ACB8] text-sm">{row.powerlifting}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${
                        row.advantage === 'calisthenics' ? 'bg-[#C1121F]/20 text-[#C1121F]' :
                        row.advantage === 'powerlifting' ? 'bg-blue-500/20 text-blue-400' :
                        row.advantage === 'tie' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {row.advantage === 'depends' ? 'Goal-dependent' : row.advantage}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </section>

      {/* Strength Equivalents */}
      <section className="py-8 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Rough Strength Equivalents</h2>
          <div className="space-y-3">
            {strengthEquivalents.map((eq) => (
              <Card key={eq.calisthenics} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1">
                    <span className="text-sm text-[#C1121F] font-medium">{eq.calisthenics}</span>
                  </div>
                  <div className="hidden sm:block text-[#6B7280]">≈</div>
                  <div className="flex-1">
                    <span className="text-sm text-blue-400 font-medium">{eq.powerlifting}</span>
                  </div>
                  <div className="sm:max-w-[200px]">
                    <span className="text-xs text-[#6B7280]">{eq.notes}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-[#6B7280] mt-4 italic">
            * These are rough equivalents based on similar relative difficulty. Individual variation is significant.
          </p>
        </div>
      </section>

      {/* Choose If */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Choose Your Path</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Calisthenics */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-[#C1121F] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Choose Calisthenics If:
              </h3>
              <ul className="space-y-2">
                {chooseIf.calisthenics.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            
            {/* Powerlifting */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                Choose Powerlifting If:
              </h3>
              <ul className="space-y-2">
                {chooseIf.powerlifting.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            
            {/* Hybrid */}
            <Card className="bg-[#1A1F26] border-[#C1121F]/30 p-5">
              <h3 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Choose Hybrid If:
              </h3>
              <ul className="space-y-2">
                {chooseIf.hybrid.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* SpartanLab Advantage */}
      <section className="py-8 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">The SpartanLab Approach</h2>
          <Card className="bg-[#1A1F26] border-[#C1121F]/30 p-6">
            <p className="text-[#A4ACB8] mb-4">
              SpartanLab doesn&apos;t force you to choose. We built a system that:
            </p>
            <ul className="space-y-3 mb-4">
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F] mt-0.5 shrink-0" />
                <span className="text-[#E6E9EF]">
                  <strong>Tracks both domains</strong> — weighted calisthenics AND barbell lifts in one unified strength profile
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F] mt-0.5 shrink-0" />
                <span className="text-[#E6E9EF]">
                  <strong>Maps transfer</strong> — shows how your deadlift strength impacts front lever readiness
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F] mt-0.5 shrink-0" />
                <span className="text-[#E6E9EF]">
                  <strong>Programs intelligently</strong> — balances skill work and strength work without overtraining
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-[#C1121F] mt-0.5 shrink-0" />
                <span className="text-[#E6E9EF]">
                  <strong>Adapts to readiness</strong> — adjusts programming based on recovery, not fixed percentages
                </span>
              </li>
            </ul>
            <p className="text-sm text-[#6B7280] italic">
              Most programs make you choose. We give you both — intelligently combined.
            </p>
          </Card>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/streetlifting-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Streetlifting Standards</h3>
                <p className="text-xs text-[#6B7280]">Weighted calisthenics benchmarks</p>
              </Card>
            </Link>
            <Link href="/powerlifting-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Powerlifting Standards</h3>
                <p className="text-xs text-[#6B7280]">SBD benchmarks by bodyweight</p>
              </Card>
            </Link>
            <Link href="/hybrid-training-program">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Hybrid Training</h3>
                <p className="text-xs text-[#6B7280]">Combine both systems</p>
              </Card>
            </Link>
            <Link href="/calisthenics-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">All Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">Complete benchmarks hub</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <FAQ items={faqs} title="Common Questions" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-[#0F1115] to-[#0D0D0D]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Stop Choosing. Start Training Both.</h2>
          <p className="text-[#A4ACB8] mb-6">
            SpartanLab tracks weighted calisthenics and barbell strength in one unified system.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2 w-full sm:w-auto">
                Build My Program
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/training">
              <Button size="lg" variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] w-full sm:w-auto">
                Explore Training Options
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
