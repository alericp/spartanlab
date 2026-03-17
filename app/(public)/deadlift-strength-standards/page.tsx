import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, Target, Scale, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Deadlift Strength Standards | Relative Strength by Bodyweight | SpartanLab',
  description: 'Deadlift strength standards from beginner to elite. Know your relative pulling power and how it translates to calisthenics performance.',
  keywords: ['deadlift strength standards', 'how much should I deadlift', 'deadlift by bodyweight', 'relative deadlift strength', 'deadlift for calisthenics'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/deadlift-strength-standards`,
  },
  openGraph: {
    title: 'Deadlift Strength Standards | SpartanLab',
    description: 'Deadlift standards by bodyweight. Understand your relative pulling power.',
    url: `${SITE_CONFIG.url}/deadlift-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const standards = [
  { level: 'Beginner', multiplier: '1.0x BW', example: '180 lb @ 180 lb BW', description: 'Learning movement patterns. Building foundation.', color: 'text-blue-400' },
  { level: 'Intermediate', multiplier: '1.5x BW', example: '270 lb @ 180 lb BW', description: 'Solid strength base. Most recreational lifters.', color: 'text-green-400' },
  { level: 'Advanced', multiplier: '2.0x BW', example: '360 lb @ 180 lb BW', description: 'Strong by any standard. Athletic level.', color: 'text-yellow-400' },
  { level: 'Elite', multiplier: '2.5x+ BW', example: '450 lb+ @ 180 lb BW', description: 'Competitive strength. Top 1% of lifters.', color: 'text-[#C1121F]' },
]

const byBodyweight = [
  { bw: '150 lb (68 kg)', beginner: '150 lb', intermediate: '225 lb', advanced: '300 lb', elite: '375 lb+' },
  { bw: '175 lb (79 kg)', beginner: '175 lb', intermediate: '263 lb', advanced: '350 lb', elite: '438 lb+' },
  { bw: '200 lb (91 kg)', beginner: '200 lb', intermediate: '300 lb', advanced: '400 lb', elite: '500 lb+' },
  { bw: '225 lb (102 kg)', beginner: '225 lb', intermediate: '338 lb', advanced: '450 lb', elite: '563 lb+' },
]

const calisthenicsTransfer = [
  { skill: 'Front Lever', correlation: 'Moderate', description: 'Posterior chain strength helps, but straight-arm pulling is key', benefit: 'Better hip extension, core brace' },
  { skill: 'Weighted Pull-Ups', correlation: 'High', description: 'General pulling strength transfers well', benefit: 'Grip strength, lat engagement' },
  { skill: 'One-Arm Chin', correlation: 'Moderate', description: 'Raw pulling power helps early progressions', benefit: 'Tendon conditioning, grip strength' },
  { skill: 'Muscle-Up', correlation: 'Low-Moderate', description: 'Hip hinge power useful for kip variations', benefit: 'Explosive hip drive' },
]

const faqs = [
  {
    question: 'Is deadlift necessary for calisthenics?',
    answer: 'Not necessary, but beneficial. Deadlifts build posterior chain strength, grip, and general pulling power that transfers to weighted pull-ups and some skill work. For pure skill athletes, front lever rows and weighted pulls may be more specific. For hybrid athletes, deadlifts are excellent.',
  },
  {
    question: 'How does deadlift strength translate to pull-up strength?',
    answer: 'Indirectly. A strong deadlift indicates good lat, grip, and back development. Athletes with 2x BW deadlifts typically can achieve +50% BW weighted pull-ups with focused training. The transfer is not automatic but the strength foundation is there.',
  },
  {
    question: 'What deadlift strength do elite calisthenics athletes have?',
    answer: 'Varies widely. Pure skill athletes may deadlift only 1.5x BW. Streetlifters and hybrid athletes often pull 2-2.5x BW. The correlation depends on training focus. A 2x BW deadlift is a solid benchmark for any serious strength athlete.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Deadlift Strength Standards',
    description: 'Complete guide to deadlift strength standards by bodyweight ratio',
    slug: 'deadlift-strength-standards',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Strength Standards', url: `${SITE_CONFIG.url}/calisthenics-strength-standards` },
    { name: 'Deadlift Standards', url: `${SITE_CONFIG.url}/deadlift-strength-standards` },
  ]),
  generateFAQSchema(faqs),
]

export default function DeadliftStrengthStandardsPage() {
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
          <span className="text-[#E6E9EF]">Deadlift</span>
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
            Deadlift Strength Standards
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            Know your relative pulling power. These bodyweight-ratio standards help you 
            understand where you stand and how deadlift strength translates to calisthenics performance.
          </p>
        </div>
      </section>

      {/* Standards Overview */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Relative Strength Standards</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {standards.map((standard) => (
              <Card key={standard.level} className="bg-[#1A1F26] border-[#2B313A] p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold ${standard.color}`}>{standard.level}</span>
                  <span className="text-[#E6E9EF] font-mono">{standard.multiplier}</span>
                </div>
                <p className="text-sm text-[#6B7280] mb-2">{standard.example}</p>
                <p className="text-sm text-[#A4ACB8]">{standard.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Standards by Bodyweight */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Standards by Bodyweight</h2>
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
                {byBodyweight.map((row) => (
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
        </div>
      </section>

      {/* System Difference */}
      <section className="py-8 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Deadlift vs. Calisthenics Pulling</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-[#E6E9EF]">Deadlift</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>Maximum force output</li>
                <li>Ground-based pulling</li>
                <li>Bilateral loading</li>
                <li>Hip hinge dominant</li>
              </ul>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-[#C1121F]" />
                <h3 className="font-semibold text-[#E6E9EF]">Calisthenics</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>Relative strength</li>
                <li>Vertical/horizontal pulls</li>
                <li>Bodyweight leverage</li>
                <li>Straight-arm control</li>
              </ul>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5 border-[#C1121F]/30">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-[#E6E9EF]">Hybrid Approach</h3>
              </div>
              <ul className="space-y-2 text-sm text-[#A4ACB8]">
                <li>Best of both systems</li>
                <li>Raw power + control</li>
                <li>Complete back development</li>
                <li>SpartanLab integration</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Transfer to Calisthenics */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Transfer to Calisthenics Skills</h2>
          <div className="space-y-3">
            {calisthenicsTransfer.map((item) => (
              <Card key={item.skill} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-[#E6E9EF]">{item.skill}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.correlation === 'High' ? 'bg-green-500/20 text-green-400' :
                        item.correlation === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {item.correlation} Transfer
                      </span>
                    </div>
                    <p className="text-sm text-[#A4ACB8]">{item.description}</p>
                  </div>
                  <span className="text-xs text-[#6B7280] whitespace-nowrap ml-4">{item.benefit}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Related Resources</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/weighted-pull-up-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Pull-Up Standards</h3>
                <p className="text-xs text-[#6B7280]">Calisthenics pulling benchmarks</p>
              </Card>
            </Link>
            <Link href="/powerlifting-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Powerlifting Standards</h3>
                <p className="text-xs text-[#6B7280]">Complete SBD benchmarks</p>
              </Card>
            </Link>
            <Link href="/hybrid-training-program">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Hybrid Training</h3>
                <p className="text-xs text-[#6B7280]">Combine barbell + bodyweight</p>
              </Card>
            </Link>
            <Link href="/front-lever-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Front Lever Requirements</h3>
                <p className="text-xs text-[#6B7280]">Pulling strength for skills</p>
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
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Track Your Strength Across Systems</h2>
          <p className="text-[#A4ACB8] mb-6">
            SpartanLab unifies barbell and bodyweight strength tracking with intelligent programming.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2 w-full sm:w-auto">
                Start Training Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/weighted-calisthenics-vs-powerlifting">
              <Button size="lg" variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] w-full sm:w-auto">
                Compare Training Systems
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
