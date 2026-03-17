import { Metadata } from 'next'

// Prevent static prerendering to avoid auth issues during build
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, CheckCircle2, Calculator, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { ToolConversionCard } from '@/components/tools/ToolConversionCard'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Weighted Dip Strength Standards | How Much Weight Is Strong? | SpartanLab',
  description: 'Complete weighted dip strength standards from beginner to elite. Learn how much added weight indicates strong pressing and what you need for planche.',
  keywords: ['weighted dip standards', 'how much weight on dips', 'weighted dip strength', 'dip strength for planche', 'calisthenics pressing standards'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/weighted-dip-strength-standards`,
  },
  openGraph: {
    title: 'Weighted Dip Strength Standards | SpartanLab',
    description: 'Complete weighted dip standards. Know your pressing strength for advanced skills.',
    url: `${SITE_CONFIG.url}/weighted-dip-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
}

const standards = [
  { level: 'Beginner', weight: '+15-35 lb', percentage: '10-20% BW', description: 'Starting weighted work. Focus on form and control.', color: 'text-blue-400' },
  { level: 'Intermediate', weight: '+35-70 lb', percentage: '20-40% BW', description: 'Solid weighted foundation. Good pushing base.', color: 'text-green-400' },
  { level: 'Advanced', weight: '+70-110 lb', percentage: '40-60% BW', description: 'Strong pressing base. Ready for planche progressions.', color: 'text-yellow-400' },
  { level: 'Elite', weight: '+110 lb+', percentage: '60%+ BW', description: 'Exceptional pressing strength. Competition level.', color: 'text-[#C1121F]' },
]

const byBodyweight = [
  { bw: '150 lb (68 kg)', beginner: '+15-30 lb', intermediate: '+30-60 lb', advanced: '+60-90 lb', elite: '+90 lb+' },
  { bw: '175 lb (79 kg)', beginner: '+18-35 lb', intermediate: '+35-70 lb', advanced: '+70-105 lb', elite: '+105 lb+' },
  { bw: '200 lb (91 kg)', beginner: '+20-40 lb', intermediate: '+40-80 lb', advanced: '+80-120 lb', elite: '+120 lb+' },
  { bw: '225 lb (102 kg)', beginner: '+23-45 lb', intermediate: '+45-90 lb', advanced: '+90-135 lb', elite: '+135 lb+' },
]

const skillCorrelations = [
  { skill: 'Tuck Planche', requirement: '+40% BW (5 reps)', description: 'Entry point for planche training', href: '/skills/planche' },
  { skill: 'Advanced Tuck Planche', requirement: '+55% BW (5 reps)', description: 'Progressing through planche', href: '/skills/planche' },
  { skill: 'Straddle Planche', requirement: '+70% BW (5 reps)', description: 'Strong pressing base needed', href: '/skills/planche' },
  { skill: 'HSPU', requirement: '+50% BW dips', description: 'Correlates with wall HSPU ability', href: '/skills/handstand-push-up' },
]

const improvementTips = [
  { title: 'Full ROM', description: 'Go deep - shoulders below elbows on every rep' },
  { title: 'Progressive Overload', description: 'Add 2.5-5 lb every 1-2 weeks when hitting targets' },
  { title: 'Pause Reps', description: 'Add 2-second pauses at the bottom for strength gains' },
  { title: 'Frequency', description: 'Train weighted dips 2x per week, allow adequate recovery' },
]

const faqs = [
  {
    question: 'How much weight is strong for weighted dips?',
    answer: 'Adding +70% of your bodyweight for reps is elite level. +40-50% puts you in the advanced category. For a 180 lb person, +70-90 lb for 5 reps is advanced, while +125 lb+ is elite.',
  },
  {
    question: 'Do weighted dips help with planche?',
    answer: 'Yes and no. Weighted dips build general pressing strength, but planche requires straight-arm strength which is trained differently. Strong weighted dips (+60% BW) indicate you have the pressing base, but you still need planche-specific training like planche leans and pseudo planche push-ups.',
  },
  {
    question: 'When should I start weighted dips?',
    answer: 'Start adding weight once you can do 15+ strict bodyweight dips with full range of motion. Begin with +10-20 lb and focus on maintaining perfect form through the entire range.',
  },
  {
    question: 'Are weighted dips safe?',
    answer: 'Yes, when performed correctly. Use a dip belt (not a weight vest for heavy loads), maintain controlled tempo, and go through full range of motion. Shoulder injuries typically come from too much weight too soon or bouncing out of the bottom.',
  },
  {
    question: 'How do weighted dips compare to bench press?',
    answer: 'A weighted dip with +50% bodyweight roughly equates to a 1.1-1.2x bodyweight bench press in terms of pressing strength. However, dips also require more stabilization and engage more muscle groups.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Weighted Dip Strength Standards',
    description: 'Complete weighted dip standards with skill correlations for planche and advanced pressing.',
    url: `${SITE_CONFIG.url}/weighted-dip-strength-standards`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Strength Standards', url: '/calisthenics-strength-standards' },
    { name: 'Weighted Dip Standards', url: '/weighted-dip-strength-standards' },
  ]),
  generateFAQSchema(faqs),
]

export default function WeightedDipStandardsPage() {
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
          <span className="text-[#E6E9EF]">Weighted Dips</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Strength Standards</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Weighted Dip Standards</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            Weighted dip strength is the foundation of advanced pressing in calisthenics. Strong weighted dips 
            indicate the pushing power needed for muscle-ups, handstand push-ups, and planche progressions.
          </p>
        </header>

        {/* Quick Standards Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Weighted Dip Standards</h2>
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
            Weighted dip standards scaled to different bodyweights. These are for 5-rep max performance.
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
          <h2 className="text-2xl font-bold mb-4">Skill Correlations</h2>
          <p className="text-[#A5A5A5] mb-6">
            Your weighted dip strength indicates readiness for these pressing skills:
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
          <h2 className="text-2xl font-bold mb-4">How to Improve Your Weighted Dips</h2>
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
              Use our calculators to get a detailed analysis of your pressing strength and planche readiness.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/planche-readiness-calculator">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  <Calculator className="w-4 h-4 mr-2" />
                  Planche Readiness
                </Button>
              </Link>
              <Link href="/calculators/bodyweight-strength-ratio">
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                  Strength Ratio Calculator
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
                Bodyweight Dip Standards
              </Button>
            </Link>
            <Link href="/weighted-pull-up-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                Weighted Pull-Up Standards
              </Button>
            </Link>
            <Link href="/calisthenics-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1D23]">
                All Strength Standards
              </Button>
            </Link>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="mb-12">
          <ToolConversionCard context="planche" />
        </section>
      </div>
    </main>
  )
}
