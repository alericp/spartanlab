import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ArrowRight, ChevronRight, Target, Trophy, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Streetlifting Strength Standards | Weighted Calisthenics Benchmarks | SpartanLab',
  description: 'Complete streetlifting strength standards for weighted pull-ups and dips. Competition-level benchmarks from beginner to world class.',
  keywords: ['streetlifting standards', 'weighted pull-up standards', 'weighted dip standards', 'streetlifting competition', 'weighted calisthenics benchmarks'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/streetlifting-strength-standards`,
  },
  openGraph: {
    title: 'Streetlifting Strength Standards | SpartanLab',
    description: 'Complete weighted pull-up and dip benchmarks for streetlifting.',
    url: `${SITE_CONFIG.url}/streetlifting-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
  },
}

const pullUpStandards = [
  { level: 'Beginner', weight: '+25% BW', example: '+45 lb @ 180 lb', color: 'text-blue-400' },
  { level: 'Intermediate', weight: '+50% BW', example: '+90 lb @ 180 lb', color: 'text-green-400' },
  { level: 'Advanced', weight: '+75% BW', example: '+135 lb @ 180 lb', color: 'text-yellow-400' },
  { level: 'Elite', weight: '+100% BW', example: '+180 lb @ 180 lb', color: 'text-[#C1121F]' },
  { level: 'World Class', weight: '+125% BW+', example: '+225 lb+ @ 180 lb', color: 'text-purple-400' },
]

const dipStandards = [
  { level: 'Beginner', weight: '+20% BW', example: '+36 lb @ 180 lb', color: 'text-blue-400' },
  { level: 'Intermediate', weight: '+45% BW', example: '+80 lb @ 180 lb', color: 'text-green-400' },
  { level: 'Advanced', weight: '+70% BW', example: '+125 lb @ 180 lb', color: 'text-yellow-400' },
  { level: 'Elite', weight: '+100% BW', example: '+180 lb @ 180 lb', color: 'text-[#C1121F]' },
  { level: 'World Class', weight: '+120% BW+', example: '+216 lb+ @ 180 lb', color: 'text-purple-400' },
]

const weightClasses = [
  { class: '-66 kg (145 lb)', pullUp: '+70 kg (154 lb)', dip: '+80 kg (176 lb)', total: '150 kg+' },
  { class: '-75 kg (165 lb)', pullUp: '+80 kg (176 lb)', dip: '+90 kg (198 lb)', total: '170 kg+' },
  { class: '-83 kg (183 lb)', pullUp: '+90 kg (198 lb)', dip: '+100 kg (220 lb)', total: '190 kg+' },
  { class: '-93 kg (205 lb)', pullUp: '+100 kg (220 lb)', dip: '+110 kg (242 lb)', total: '210 kg+' },
  { class: '+93 kg (205+ lb)', pullUp: '+110 kg (242 lb)', dip: '+120 kg (265 lb)', total: '230 kg+' },
]

const skillTransfer = [
  { skill: 'One-Arm Pull-Up', requirement: '+70% BW weighted pull-up', description: 'Strong foundation for unilateral pulling' },
  { skill: 'Muscle-Up', requirement: '+50% BW (5+ reps)', description: 'Pulling power for explosive transition' },
  { skill: 'Front Lever', requirement: '+60% BW weighted rows', description: 'Horizontal pulling strength transfer' },
  { skill: 'Planche', requirement: '+70% BW weighted dips', description: 'Pushing base for straight-arm work' },
]

const faqs = [
  {
    question: 'What is streetlifting?',
    answer: 'Streetlifting is competitive weighted calisthenics, typically featuring max-weight pull-ups and dips. Athletes compete in weight classes, lifting the heaviest additional weight for one rep. It bridges powerlifting intensity with calisthenics movements.',
  },
  {
    question: 'How do streetlifting standards compare to powerlifting?',
    answer: 'Elite streetlifters achieve similar relative strength to powerlifters. A +100% BW weighted pull-up is comparable difficulty to a 2x BW deadlift. Both represent top-tier relative strength, just through different movement patterns.',
  },
  {
    question: 'Can streetlifting help calisthenics skills?',
    answer: 'Yes, significantly. Heavy weighted pull-ups build the pulling strength needed for front lever, one-arm chin progressions, and muscle-ups. Heavy dips develop the pressing base for planche and HSPU. Many elite skill athletes incorporate streetlifting.',
  },
]

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Streetlifting Strength Standards',
    description: 'Complete weighted calisthenics benchmarks for competition',
    slug: 'streetlifting-strength-standards',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Strength Standards', url: `${SITE_CONFIG.url}/calisthenics-strength-standards` },
    { name: 'Streetlifting Standards', url: `${SITE_CONFIG.url}/streetlifting-strength-standards` },
  ]),
  generateFAQSchema(faqs),
]

export default function StreetliftingStrengthStandardsPage() {
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
          <span className="text-[#E6E9EF]">Streetlifting</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#C1121F]/10 rounded-lg">
              <Trophy className="w-6 h-6 text-[#C1121F]" />
            </div>
            <span className="text-sm font-medium text-[#C1121F]">Weighted Calisthenics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF] mb-4">
            Streetlifting Strength Standards
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl">
            Competition-level benchmarks for weighted pull-ups and dips. 
            These standards define what it takes to compete at local through world-class levels.
          </p>
        </div>
      </section>

      {/* Standards Grid */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Competition Standards (1RM)</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Weighted Pull-Ups */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-[#E6E9EF] mb-4 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                Weighted Pull-Up
              </h3>
              <div className="space-y-3">
                {pullUpStandards.map((s) => (
                  <div key={s.level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${s.color}`}>{s.level}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-[#E6E9EF] font-mono">{s.weight}</span>
                      <p className="text-xs text-[#6B7280]">{s.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Weighted Dips */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <h3 className="font-semibold text-[#E6E9EF] mb-4 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-amber-400" />
                Weighted Dip
              </h3>
              <div className="space-y-3">
                {dipStandards.map((s) => (
                  <div key={s.level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${s.color}`}>{s.level}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-[#E6E9EF] font-mono">{s.weight}</span>
                      <p className="text-xs text-[#6B7280]">{s.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Competition Weight Classes */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Elite Competition Standards by Weight Class</h2>
          <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B313A]">
                  <TableHead className="text-[#A4ACB8]">Weight Class</TableHead>
                  <TableHead className="text-[#C1121F]">Pull-Up</TableHead>
                  <TableHead className="text-amber-400">Dip</TableHead>
                  <TableHead className="text-green-400">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weightClasses.map((row) => (
                  <TableRow key={row.class} className="border-[#2B313A]">
                    <TableCell className="font-medium text-[#E6E9EF]">{row.class}</TableCell>
                    <TableCell className="text-[#A4ACB8]">{row.pullUp}</TableCell>
                    <TableCell className="text-[#A4ACB8]">{row.dip}</TableCell>
                    <TableCell className="text-[#A4ACB8]">{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <p className="text-xs text-[#6B7280] mt-3">
            * Elite = top 10% at national competitions. World records significantly exceed these.
          </p>
        </div>
      </section>

      {/* Skill Transfer */}
      <section className="py-8 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Transfer to Calisthenics Skills</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {skillTransfer.map((item) => (
              <Card key={item.skill} className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-[#C1121F] mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-[#E6E9EF] mb-1">{item.skill}</h3>
                    <p className="text-sm text-[#C1121F] font-mono mb-1">{item.requirement}</p>
                    <p className="text-xs text-[#6B7280]">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Streetlifting */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Why Train Streetlifting?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <Zap className="w-5 h-5 text-[#C1121F] mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Skill Foundation</h3>
              <p className="text-sm text-[#A4ACB8]">
                Heavy weighted movements build the raw strength needed for advanced calisthenics skills. 
                Most skill plateaus are strength deficits in disguise.
              </p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <Target className="w-5 h-5 text-amber-400 mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Clear Progression</h3>
              <p className="text-sm text-[#A4ACB8]">
                Unlike skill work with subjective progress, weighted numbers don&apos;t lie. 
                +5 lb is +5 lb. Track objective strength gains.
              </p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <Trophy className="w-5 h-5 text-green-400 mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Competition Ready</h3>
              <p className="text-sm text-[#A4ACB8]">
                Streetlifting competitions are growing globally. Test your strength against 
                others with standardized judging.
              </p>
            </Card>
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
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Pull-Up Guide</h3>
                <p className="text-xs text-[#6B7280]">Detailed pulling standards</p>
              </Card>
            </Link>
            <Link href="/weighted-dip-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Dip Guide</h3>
                <p className="text-xs text-[#6B7280]">Detailed pushing standards</p>
              </Card>
            </Link>
            <Link href="/front-lever-strength-requirements">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Front Lever Requirements</h3>
                <p className="text-xs text-[#6B7280]">Skill strength thresholds</p>
              </Card>
            </Link>
            <Link href="/training/weighted-pull-up-program">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">Weighted Pull-Up Program</h3>
                <p className="text-xs text-[#6B7280]">Structured progression</p>
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
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">Track Your Streetlifting Progress</h2>
          <p className="text-[#A4ACB8] mb-6">
            SpartanLab tracks weighted calisthenics with skill integration and intelligent programming.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2 w-full sm:w-auto">
                Start Tracking Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/weighted-pull-up-calculator">
              <Button size="lg" variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] w-full sm:w-auto">
                Calculate My Level
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
