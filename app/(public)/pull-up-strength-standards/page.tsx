import { Metadata } from 'next'
import Link from 'next/link'
import { Target, Dumbbell, ArrowRight, TrendingUp, ChevronRight, CheckCircle2, Calculator } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Pull-Up Strength Standards | How Many Pull-Ups Should You Do? | SpartanLab',
  description: 'Complete pull-up strength standards from beginner to elite. Learn how many pull-ups you should be able to do at each level and how to improve your pulling strength.',
  keywords: ['pull-up strength standards', 'how many pull-ups', 'pull-up test', 'pull-up benchmarks', 'calisthenics standards', 'bodyweight strength'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/pull-up-strength-standards`,
  },
  openGraph: {
    title: 'Pull-Up Strength Standards | SpartanLab',
    description: 'Complete pull-up strength standards from beginner to elite. Know your level and how to improve.',
    url: `${SITE_CONFIG.url}/pull-up-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const standards = [
  { level: 'Beginner', reps: '1-5', description: 'Just starting out with pull-ups. Focus on building foundational strength.', color: 'text-blue-400' },
  { level: 'Intermediate', reps: '6-12', description: 'Solid pulling foundation. Ready to start skill training.', color: 'text-green-400' },
  { level: 'Advanced', reps: '13-20', description: 'Strong pulling base. Ready for weighted progressions and advanced skills.', color: 'text-yellow-400' },
  { level: 'Elite', reps: '21+', description: 'Exceptional pulling endurance. Elite bodyweight strength.', color: 'text-[#C1121F]' },
]

const byBodyweight = [
  { bw: 'Under 150 lb (68 kg)', beginner: '3-6', intermediate: '8-14', advanced: '16-22', elite: '24+' },
  { bw: '150-180 lb (68-82 kg)', beginner: '2-5', intermediate: '7-12', advanced: '14-20', elite: '22+' },
  { bw: '180-210 lb (82-95 kg)', beginner: '1-4', intermediate: '6-10', advanced: '12-17', elite: '19+' },
  { bw: 'Over 210 lb (95 kg)', beginner: '1-3', intermediate: '5-9', advanced: '10-15', elite: '17+' },
]

const skillRequirements = [
  { skill: 'Muscle-Up', requirement: '10-12 strict pull-ups minimum', href: '/skills/muscle-up' },
  { skill: 'Front Lever', requirement: '15-20 strict pull-ups', href: '/skills/front-lever' },
  { skill: 'One-Arm Pull-Up', requirement: '20+ weighted pull-ups', href: '/guides/one-arm-pull-up' },
]

const improvementTips = [
  { title: 'Frequency', description: 'Train pull-ups 3-4 times per week for optimal progress' },
  { title: 'Progressive Overload', description: 'Add reps, sets, or weight each week' },
  { title: 'Varied Grips', description: 'Include wide, neutral, and chin-up variations' },
  { title: 'Weighted Training', description: 'Add weight once you hit 10+ strict reps' },
]

const faqs = [
  {
    question: 'How many pull-ups should a beginner be able to do?',
    answer: 'A true beginner may not be able to do any pull-ups. The goal is to work toward 1-5 strict pull-ups. Use assisted variations like band-assisted pull-ups, negatives, or inverted rows to build the foundation.',
  },
  {
    question: 'Is 10 pull-ups good?',
    answer: 'Yes, 10 strict pull-ups puts you solidly in the intermediate category. This is a great foundation and indicates you are ready for more advanced training like weighted pull-ups or skill work.',
  },
  {
    question: 'How many pull-ups do I need for a muscle-up?',
    answer: 'Most athletes need 10-12 strict pull-ups before they can achieve a muscle-up. However, you also need explosive pulling power and 8+ chest-to-bar pull-ups.',
  },
  {
    question: 'How long does it take to go from 0 to 10 pull-ups?',
    answer: 'For most people, achieving 10 strict pull-ups from zero takes 3-6 months of consistent training. This varies based on starting strength, bodyweight, training frequency, and genetics.',
  },
  {
    question: 'Do pull-up standards differ by bodyweight?',
    answer: 'Yes, bodyweight significantly affects pull-up performance. Heavier athletes will generally do fewer reps than lighter athletes at the same relative strength level. This is why weighted pull-up strength is a better indicator for advanced skills.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Pull-Up Strength Standards',
    description: 'Complete pull-up strength standards from beginner to elite with benchmarks by bodyweight.',
    url: `${SITE_CONFIG.url}/pull-up-strength-standards`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Standards', url: '/calisthenics-strength-standards' },
    { name: 'Pull-Up Standards', url: '/pull-up-strength-standards' },
  ]),
  generateFAQSchema(faqs),
]

export default function PullUpStrengthStandardsPage() {
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
          <span className="text-[#E6E9EF]">Pull-Ups</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Strength Standards</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Pull-Up Strength Standards</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The pull-up is the foundational test of upper body pulling strength. Your pull-up numbers 
            indicate your readiness for advanced calisthenics skills like front lever and muscle-up.
          </p>
        </header>

        {/* Quick Standards Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Pull-Up Standards by Level</h2>
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

        {/* Bodyweight Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Standards by Bodyweight</h2>
          <p className="text-[#A5A5A5] mb-6">
            Pull-up standards vary by bodyweight. Heavier athletes naturally do fewer reps at the same strength level.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B313A]">
                  <TableHead className="text-[#E6E9EF]">Bodyweight</TableHead>
                  <TableHead className="text-blue-400">Beginner</TableHead>
                  <TableHead className="text-green-400">Intermediate</TableHead>
                  <TableHead className="text-yellow-400">Advanced</TableHead>
                  <TableHead className="text-[#C1121F]">Elite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byBodyweight.map((row) => (
                  <TableRow key={row.bw} className="border-[#2B313A]">
                    <TableCell className="text-[#E6E9EF] font-medium">{row.bw}</TableCell>
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

        {/* Skill Requirements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Pull-Up Requirements for Skills</h2>
          <p className="text-[#A5A5A5] mb-6">
            Your pull-up strength determines your readiness for advanced calisthenics skills:
          </p>
          <div className="space-y-3">
            {skillRequirements.map((item) => (
              <Link key={item.skill} href={item.href}>
                <Card className="bg-[#1A1D23] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#E6E9EF]">{item.skill}</h3>
                      <p className="text-sm text-[#A5A5A5]">{item.requirement}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#6B7280]" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* How to Improve */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How to Improve Your Pull-Up Numbers</h2>
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
            <h2 className="text-xl font-bold mb-2">Test Your Pulling Strength</h2>
            <p className="text-[#A5A5A5] mb-4">
              Use our calculators to get a detailed analysis of your pulling strength and skill readiness.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/calculators/pull-up-strength-score">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  <Calculator className="w-4 h-4 mr-2" />
                  Pull-Up Strength Calculator
                </Button>
              </Link>
              <Link href="/front-lever-readiness-calculator">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Front Lever Readiness Test
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
            <Link href="/weighted-pull-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Weighted Pull-Up Standards
              </Button>
            </Link>
            <Link href="/dip-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Dip Standards
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
