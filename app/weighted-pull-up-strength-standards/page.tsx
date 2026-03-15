import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, CheckCircle2, Calculator, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Weighted Pull-Up Strength Standards | How Much Weight Is Good? | SpartanLab',
  description: 'Complete weighted pull-up strength standards from beginner to elite. Learn how much added weight indicates good strength and what you need for advanced skills.',
  keywords: ['weighted pull-up standards', 'how much weight on pull-ups', 'weighted pull-up test', 'pull-up strength for front lever', 'calisthenics weighted standards'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/weighted-pull-up-strength-standards`,
  },
  openGraph: {
    title: 'Weighted Pull-Up Strength Standards | SpartanLab',
    description: 'Complete weighted pull-up standards. Know your strength level for advanced skills.',
    url: `${SITE_CONFIG.url}/weighted-pull-up-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const standards = [
  { level: 'Beginner', weight: '+10-25 lb', percentage: '5-15% BW', description: 'Just starting weighted work. Building base strength.', color: 'text-blue-400' },
  { level: 'Intermediate', weight: '+25-50 lb', percentage: '15-30% BW', description: 'Solid weighted foundation. Ready for skill progressions.', color: 'text-green-400' },
  { level: 'Advanced', weight: '+50-85 lb', percentage: '30-50% BW', description: 'Strong pulling base. Ready for front lever work.', color: 'text-yellow-400' },
  { level: 'Elite', weight: '+85 lb+', percentage: '50%+ BW', description: 'Exceptional pulling strength. Competition level.', color: 'text-[#C1121F]' },
]

const byBodyweight = [
  { bw: '150 lb (68 kg)', beginner: '+15-22 lb', intermediate: '+38-52 lb', advanced: '+52-75 lb', elite: '+75 lb+' },
  { bw: '175 lb (79 kg)', beginner: '+17-26 lb', intermediate: '+44-61 lb', advanced: '+61-88 lb', elite: '+88 lb+' },
  { bw: '200 lb (91 kg)', beginner: '+20-30 lb', intermediate: '+50-70 lb', advanced: '+70-100 lb', elite: '+100 lb+' },
  { bw: '225 lb (102 kg)', beginner: '+23-34 lb', intermediate: '+56-79 lb', advanced: '+79-113 lb', elite: '+113 lb+' },
]

const skillCorrelations = [
  { skill: 'Tuck Front Lever', requirement: '+25% BW (5 reps)', description: 'Entry point for front lever training', href: '/skills/front-lever' },
  { skill: 'Advanced Tuck FL', requirement: '+35% BW (5 reps)', description: 'Progressing through front lever', href: '/skills/front-lever' },
  { skill: 'Full Front Lever', requirement: '+50% BW (5 reps)', description: 'Elite weighted strength for full hold', href: '/skills/front-lever' },
  { skill: 'One-Arm Pull-Up', requirement: '+60-70% BW', description: 'The ultimate pulling skill', href: '/guides/one-arm-pull-up' },
]

const improvementTips = [
  { title: 'Progressive Loading', description: 'Add 2.5-5 lb every 1-2 weeks when hitting rep targets' },
  { title: 'Rep Ranges', description: 'Train in 3-8 rep range for strength, 8-12 for hypertrophy' },
  { title: 'Rest Periods', description: 'Take 3-5 minutes rest between heavy weighted sets' },
  { title: 'Frequency', description: 'Train weighted pulls 2-3x per week for optimal progress' },
]

const faqs = [
  {
    question: 'How much weight is good for weighted pull-ups?',
    answer: 'Adding +50% of your bodyweight for reps puts you in the advanced category. For a 180 lb person, that is about +90 lb. This level of strength strongly correlates with front lever ability.',
  },
  {
    question: 'How much weight do I need for front lever?',
    answer: 'Most athletes who achieve a full front lever can do weighted pull-ups with +50% bodyweight for 5 reps. The advanced tuck stage typically requires +35% bodyweight. Weighted strength is the strongest predictor of front lever success.',
  },
  {
    question: 'When should I start weighted pull-ups?',
    answer: 'Start adding weight once you can do 10-12 strict bodyweight pull-ups. Begin with +10-15 lb and focus on perfect form. Progress slowly to avoid injury.',
  },
  {
    question: 'Is +100 lb pull-up impressive?',
    answer: 'Yes, a +100 lb weighted pull-up is elite level strength. For most athletes, this represents +50-65% of bodyweight. Only a small percentage of trained athletes ever reach this level.',
  },
  {
    question: 'Should I use a belt or weight vest?',
    answer: 'A dip belt is preferred for heavier loads (+30 lb and above) as it allows unlimited loading and keeps the weight centered. Weight vests are convenient for lighter loads but have weight limits and can restrict range of motion.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Weighted Pull-Up Strength Standards',
    description: 'Complete weighted pull-up standards with skill correlations for front lever and one-arm pull-up.',
    url: `${SITE_CONFIG.url}/weighted-pull-up-strength-standards`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Standards', url: '/calisthenics-strength-standards' },
    { name: 'Weighted Pull-Up Standards', url: '/weighted-pull-up-strength-standards' },
  ]),
  generateFAQSchema(faqs),
]

export default function WeightedPullUpStandardsPage() {
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
          <span className="text-[#E6E9EF]">Weighted Pull-Ups</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Strength Standards</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Weighted Pull-Up Standards</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            Weighted pull-up strength is the single best predictor of success in advanced pulling skills 
            like front lever and one-arm pull-up. Your weighted pull capacity directly determines your 
            skill ceiling in calisthenics.
          </p>
        </header>

        {/* Quick Standards Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Weighted Pull-Up Standards</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {standards.map((standard) => (
              <Card key={standard.level} className="bg-[#1A1D23] border-[#2B313A] p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg font-bold ${standard.color}`}>{standard.level}</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-[#E6E9EF]">{standard.weight}</span>
                    <span className="text-sm text-[#6B7280] block">{standard.percentage}</span>
                  </div>
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
            Weighted standards scaled to different bodyweights. These are for 5-rep max performance.
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

        {/* Skill Correlations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Skill Requirements</h2>
          <p className="text-[#A5A5A5] mb-6">
            Your weighted pull-up strength directly predicts your readiness for advanced skills:
          </p>
          <div className="space-y-3">
            {skillCorrelations.map((item) => (
              <Link key={item.skill} href={item.href}>
                <Card className="bg-[#1A1D23] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-[#C1121F]" />
                      <div>
                        <h3 className="font-semibold text-[#E6E9EF]">{item.skill}</h3>
                        <p className="text-sm text-[#A5A5A5]">{item.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono text-[#E6E9EF]">{item.requirement}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* How to Improve */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How to Improve Your Weighted Pull-Ups</h2>
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
            <h2 className="text-xl font-bold mb-2">Calculate Your Skill Readiness</h2>
            <p className="text-[#A5A5A5] mb-4">
              Use our calculators to get a detailed analysis of your weighted strength and skill readiness.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/front-lever-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  <Calculator className="w-4 h-4 mr-2" />
                  Front Lever Readiness
                </Button>
              </Link>
              <Link href="/calculators/pull-up-strength-score">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Pull-Up Strength Score
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
            <Link href="/pull-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Bodyweight Pull-Up Standards
              </Button>
            </Link>
            <Link href="/weighted-dip-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Weighted Dip Standards
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
