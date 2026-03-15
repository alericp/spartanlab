import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, CheckCircle2, Calculator } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Dip Strength Standards | How Many Dips Should You Do? | SpartanLab',
  description: 'Complete dip strength standards from beginner to elite. Learn how many dips you should be able to do at each level and how to build pressing strength.',
  keywords: ['dip strength standards', 'how many dips', 'parallel bar dips', 'dip test', 'pushing strength standards', 'calisthenics standards'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/dip-strength-standards`,
  },
  openGraph: {
    title: 'Dip Strength Standards | SpartanLab',
    description: 'Complete dip strength standards from beginner to elite. Know your pushing strength level.',
    url: `${SITE_CONFIG.url}/dip-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const standards = [
  { level: 'Beginner', reps: '1-8', description: 'Building foundational pushing strength and shoulder stability.', color: 'text-blue-400' },
  { level: 'Intermediate', reps: '9-18', description: 'Solid pressing base. Ready for weighted dips.', color: 'text-green-400' },
  { level: 'Advanced', reps: '19-30', description: 'Strong pushing foundation. Ready for advanced pressing skills.', color: 'text-yellow-400' },
  { level: 'Elite', reps: '31+', description: 'Exceptional pushing endurance and strength.', color: 'text-[#C1121F]' },
]

const byBodyweight = [
  { bw: 'Under 150 lb (68 kg)', beginner: '5-10', intermediate: '12-20', advanced: '22-32', elite: '35+' },
  { bw: '150-180 lb (68-82 kg)', beginner: '3-8', intermediate: '10-18', advanced: '20-30', elite: '32+' },
  { bw: '180-210 lb (82-95 kg)', beginner: '2-6', intermediate: '8-15', advanced: '17-26', elite: '28+' },
  { bw: 'Over 210 lb (95 kg)', beginner: '1-5', intermediate: '7-13', advanced: '15-22', elite: '24+' },
]

const skillRequirements = [
  { skill: 'Muscle-Up', requirement: '15+ straight bar dips', href: '/skills/muscle-up' },
  { skill: 'Planche', requirement: '20+ strict dips + weighted work', href: '/skills/planche' },
  { skill: 'Handstand Push-Up', requirement: 'Strong dip foundation + shoulder strength', href: '/skills/handstand-push-up' },
]

const improvementTips = [
  { title: 'Full Range of Motion', description: 'Go deep on each rep - shoulders below elbows' },
  { title: 'Controlled Tempo', description: '2-3 seconds down, 1 second up for muscle growth' },
  { title: 'Add Weight', description: 'Progress to weighted dips once you hit 15+ reps' },
  { title: 'Vary Your Grip', description: 'Use parallel bars, rings, and straight bar for variety' },
]

const faqs = [
  {
    question: 'How many dips should a beginner be able to do?',
    answer: 'Beginners should aim for 5-8 strict dips as their first goal. If you cannot do any dips yet, start with bench dips, negative dips, or assisted dips using a resistance band.',
  },
  {
    question: 'Is 20 dips good?',
    answer: 'Yes, 20 strict parallel bar dips puts you in the advanced category. This indicates excellent pressing strength and you are likely ready for weighted dips and advanced pushing skills.',
  },
  {
    question: 'Are dips harder than push-ups?',
    answer: 'Yes, dips are significantly harder than push-ups because you are lifting your entire bodyweight through a larger range of motion. Most people can do 2-3x more push-ups than dips.',
  },
  {
    question: 'How many dips do I need for planche?',
    answer: 'Planche requires exceptional pushing strength. Most athletes who achieve planche can do 20+ strict dips and weighted dips with +70% bodyweight or more. The straight-arm strength requirements are separate from dip strength.',
  },
  {
    question: 'Should I do ring dips or bar dips?',
    answer: 'Bar dips are easier and better for beginners. Ring dips add an instability component that requires more strength and control. Master bar dips first (15+ reps) before progressing to rings.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Dip Strength Standards',
    description: 'Complete dip strength standards from beginner to elite with benchmarks by bodyweight.',
    url: `${SITE_CONFIG.url}/dip-strength-standards`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Standards', url: '/calisthenics-strength-standards' },
    { name: 'Dip Standards', url: '/dip-strength-standards' },
  ]),
  generateFAQSchema(faqs),
]

export default function DipStrengthStandardsPage() {
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
          <span className="text-[#E6E9EF]">Dips</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Strength Standards</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Dip Strength Standards</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            The dip is the king of upper body pushing exercises in calisthenics. Your dip strength 
            indicates your readiness for planche training, muscle-ups, and other pressing skills.
          </p>
        </header>

        {/* Quick Standards Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Dip Standards by Level</h2>
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
            Like pull-ups, dip performance varies by bodyweight. Heavier athletes will do fewer reps at the same strength level.
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
          <h2 className="text-2xl font-bold mb-4">Dip Requirements for Skills</h2>
          <p className="text-[#A5A5A5] mb-6">
            Your dip strength determines your readiness for pushing-focused calisthenics skills:
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
          <h2 className="text-2xl font-bold mb-4">How to Improve Your Dip Numbers</h2>
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
            <h2 className="text-xl font-bold mb-2">Test Your Pushing Strength</h2>
            <p className="text-[#A5A5A5] mb-4">
              Use our calculators to get a detailed analysis of your pushing strength and skill readiness.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/calculators/calisthenics-strength-score">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  <Calculator className="w-4 h-4 mr-2" />
                  Strength Score Calculator
                </Button>
              </Link>
              <Link href="/planche-readiness-calculator">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Planche Readiness Test
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
            <Link href="/weighted-dip-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Weighted Dip Standards
              </Button>
            </Link>
            <Link href="/pull-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Pull-Up Standards
              </Button>
            </Link>
            <Link href="/push-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Push-Up Standards
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
