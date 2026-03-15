import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

// Prevent static prerendering to avoid auth issues during build
export const dynamic = 'force-dynamic'
import { SeoHero } from '@/components/seo/SeoHero'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Dumbbell, Target, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Calisthenics Strength Standards | SpartanLab',
  description: 'Complete calisthenics strength standards for pull-ups, dips, push-ups, and weighted exercises. Know your level from beginner to elite and understand skill readiness requirements.',
  keywords: ['calisthenics strength standards', 'pull-up standards', 'dip standards', 'weighted pull-up standards', 'bodyweight strength levels', 'calisthenics benchmarks'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/calisthenics-strength-standards`,
  },
  openGraph: {
    title: 'Calisthenics Strength Standards | SpartanLab',
    description: 'Complete calisthenics strength standards for pull-ups, dips, push-ups, and weighted exercises. Know your level from beginner to elite.',
    url: `${SITE_CONFIG.url}/calisthenics-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calisthenics Strength Standards | SpartanLab',
    description: 'Know your strength level from beginner to elite with complete calisthenics benchmarks.',
  },
}

// Bodyweight strength standards
const pullUpStandards = [
  { level: 'Beginner', reps: '3-5 reps', description: 'Basic pulling strength established' },
  { level: 'Intermediate', reps: '8-12 reps', description: 'Solid foundation for skill work' },
  { level: 'Advanced', reps: '15-20 reps', description: 'Strong enough for most skills' },
  { level: 'Elite', reps: '25+ reps', description: 'Exceptional endurance capacity' },
]

const dipStandards = [
  { level: 'Beginner', reps: '5-8 reps', description: 'Basic pushing strength established' },
  { level: 'Intermediate', reps: '12-15 reps', description: 'Ready for weighted progression' },
  { level: 'Advanced', reps: '20+ reps', description: 'Strong pressing foundation' },
  { level: 'Elite', reps: '30+ reps', description: 'Exceptional pushing endurance' },
]

const pushUpStandards = [
  { level: 'Beginner', reps: '10-15 reps', description: 'Basic pressing pattern established' },
  { level: 'Intermediate', reps: '25-35 reps', description: 'Solid endurance base' },
  { level: 'Advanced', reps: '50+ reps', description: 'Strong pressing endurance' },
  { level: 'Elite', reps: '75+ reps', description: 'Exceptional capacity' },
]

const coreStandards = [
  { level: 'Beginner', benchmark: '30s hollow hold', description: 'Basic core tension' },
  { level: 'Intermediate', benchmark: '60s hollow hold', description: 'Solid core stability' },
  { level: 'Advanced', benchmark: 'L-sit 15s+', description: 'Strong compression' },
  { level: 'Elite', benchmark: 'V-sit hold', description: 'Elite compression strength' },
]

// Weighted strength standards
const weightedPullUpStandards = [
  { level: 'Beginner', weight: '+10 lb / +5 kg', percentage: '~5-7% BW', description: 'Starting weighted work' },
  { level: 'Intermediate', weight: '+35 lb / +16 kg', percentage: '~20% BW', description: 'Solid weighted foundation' },
  { level: 'Advanced', weight: '+70 lb / +32 kg', percentage: '~40% BW', description: 'Skill-ready strength' },
  { level: 'Elite', weight: '+100 lb+ / +45 kg+', percentage: '~55%+ BW', description: 'Exceptional pulling power' },
]

const weightedDipStandards = [
  { level: 'Beginner', weight: '+25 lb / +11 kg', percentage: '~15% BW', description: 'Starting weighted work' },
  { level: 'Intermediate', weight: '+70 lb / +32 kg', percentage: '~40% BW', description: 'Strong pressing base' },
  { level: 'Advanced', weight: '+110 lb / +50 kg', percentage: '~60% BW', description: 'Elite pressing strength' },
  { level: 'Elite', weight: '+160 lb+ / +73 kg+', percentage: '~90%+ BW', description: 'Competition level' },
]

// Skill readiness indicators
const frontLeverReadiness = [
  '15-20 strict pull-ups',
  'Weighted pull-up +50% bodyweight',
  '60+ second hollow body hold',
  'Strong lat activation awareness',
]

const plancheReadiness = [
  '20+ strict dips',
  'Weighted dip +70% bodyweight',
  '60+ second planche lean',
  'Strong wrist conditioning',
  'Elite shoulder protraction strength',
]

const muscleUpReadiness = [
  '12+ strict pull-ups',
  '8+ chest-to-bar pull-ups',
  'Weighted pull-up +25% bodyweight',
  '15+ straight bar dips',
]

// FAQ data
const faqs = [
  { 
    question: 'How do I know my calisthenics level?', 
    answer: 'Use the bodyweight standards as your primary guide. If you can do 8-12 strict pull-ups and 12-15 dips, you are at an intermediate level. Test your max reps with good form, rest 3-5 minutes, then compare to the standards. For weighted exercises, use your 1RM or 5RM to assess.' 
  },
  { 
    question: 'What strength level do I need for front lever?', 
    answer: 'Most athletes who achieve a full front lever have 15-20 strict pull-ups, can perform weighted pull-ups with +50% bodyweight, and have strong core compression (60+ second hollow hold). The weighted pull-up strength is the strongest predictor of front lever success.' 
  },
  { 
    question: 'Are these standards the same for everyone?', 
    answer: 'These are general benchmarks based on typical male athletes weighing 150-180 lbs. Lighter athletes may find bodyweight exercises easier while heavier athletes may find them harder. Relative strength (strength-to-weight ratio) matters most for calisthenics skills.' 
  },
  { 
    question: 'How long does it take to progress between levels?', 
    answer: 'Progressing from beginner to intermediate typically takes 6-12 months of consistent training. Intermediate to advanced may take 1-2 years. Advanced to elite can take 2-5+ years depending on the exercise and individual factors. Weighted strength tends to progress more linearly than skill work.' 
  },
]

// JSON-LD schemas
const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Calisthenics Strength Standards',
    description: 'Complete calisthenics strength standards for pull-ups, dips, push-ups, and weighted exercises.',
    url: `${SITE_CONFIG.url}/calisthenics-strength-standards`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Strength Standards', url: '/calisthenics-strength-standards' },
  ]),
  generateFAQSchema(faqs),
]

// Reusable table component for this page
function StrengthTable({ 
  title, 
  data, 
  columns 
}: { 
  title: string
  data: Array<Record<string, string>>
  columns: { key: string; header: string; className?: string }[]
}) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-[#E6E9EF]">{title}</h3>
      <div className="rounded-xl border border-[#2A2A2A] overflow-hidden bg-[#121212]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] bg-[#1A1A1A]">
              {columns.map((col) => (
                <TableHead key={col.key} className={`text-[#E6E9EF] font-semibold ${col.className || ''}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow 
                key={index} 
                className={`border-b border-[#2A2A2A] ${index % 2 === 0 ? 'bg-[#121212]' : 'bg-[#161616]'}`}
              >
                {columns.map((col) => (
                  <TableCell 
                    key={col.key} 
                    className={col.key === 'level' ? 'font-medium text-[#E6E9EF]' : 'text-[#A5A5A5]'}
                  >
                    {row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Skill readiness card component
function SkillReadinessCard({ 
  title, 
  href, 
  requirements 
}: { 
  title: string
  href: string
  requirements: string[] 
}) {
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-6 hover:border-[#C1121F]/50 transition-all">
      <h4 className="text-lg font-semibold text-[#E6E9EF] mb-4">{title}</h4>
      <ul className="space-y-2 mb-4">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-[#A5A5A5]">
            <CheckCircle2 className="w-4 h-4 text-[#C1121F] mt-0.5 flex-shrink-0" />
            <span>{req}</span>
          </li>
        ))}
      </ul>
      <Link href={href}>
        <Button variant="outline" className="w-full border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
          View Progression Guide
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </Card>
  )
}

export default function CalisthenicsStrengthStandardsPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Hero Section */}
      <SeoHero
        title="Calisthenics Strength Standards"
        subtitle="Know exactly where you stand. Compare your bodyweight and weighted strength to established benchmarks used by calisthenics athletes worldwide."
        badge="Strength Reference"
      />

      {/* Intro Section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 text-center">
              <Dumbbell className="w-8 h-8 text-[#C1121F] mx-auto mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Bodyweight Standards</h3>
              <p className="text-sm text-[#A5A5A5]">Pull-ups, dips, push-ups, and core benchmarks</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 text-center">
              <TrendingUp className="w-8 h-8 text-[#C1121F] mx-auto mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Weighted Standards</h3>
              <p className="text-sm text-[#A5A5A5]">Weighted pull-ups and dips for skill progression</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6 text-center">
              <Target className="w-8 h-8 text-[#C1121F] mx-auto mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Skill Readiness</h3>
              <p className="text-sm text-[#A5A5A5]">Prerequisites for advanced calisthenics skills</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Bodyweight Standards Section */}
      <section className="py-12 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-[#E6E9EF]">Bodyweight Strength Standards</h2>
          <p className="text-[#A5A5A5] mb-8">Rep-based benchmarks for fundamental calisthenics exercises.</p>
          
          <StrengthTable
            title="Pull-Up Standards"
            data={pullUpStandards}
            columns={[
              { key: 'level', header: 'Level' },
              { key: 'reps', header: 'Reps' },
              { key: 'description', header: 'What It Means', className: 'hidden sm:table-cell' },
            ]}
          />
          
          <StrengthTable
            title="Dip Standards"
            data={dipStandards}
            columns={[
              { key: 'level', header: 'Level' },
              { key: 'reps', header: 'Reps' },
              { key: 'description', header: 'What It Means', className: 'hidden sm:table-cell' },
            ]}
          />
          
          <StrengthTable
            title="Push-Up Standards"
            data={pushUpStandards}
            columns={[
              { key: 'level', header: 'Level' },
              { key: 'reps', header: 'Reps' },
              { key: 'description', header: 'What It Means', className: 'hidden sm:table-cell' },
            ]}
          />
          
          <StrengthTable
            title="Core Strength Standards"
            data={coreStandards}
            columns={[
              { key: 'level', header: 'Level' },
              { key: 'benchmark', header: 'Benchmark' },
              { key: 'description', header: 'What It Means', className: 'hidden sm:table-cell' },
            ]}
          />
        </div>
      </section>

      {/* Weighted Standards Section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-[#E6E9EF]">Weighted Strength Standards</h2>
          <p className="text-[#A5A5A5] mb-8">Weighted exercises are the strongest predictors of advanced skill readiness.</p>
          
          <StrengthTable
            title="Weighted Pull-Up Standards"
            data={weightedPullUpStandards}
            columns={[
              { key: 'level', header: 'Level' },
              { key: 'weight', header: 'Added Weight' },
              { key: 'percentage', header: '% of BW', className: 'hidden sm:table-cell' },
              { key: 'description', header: 'What It Means', className: 'hidden md:table-cell' },
            ]}
          />
          
          <StrengthTable
            title="Weighted Dip Standards"
            data={weightedDipStandards}
            columns={[
              { key: 'level', header: 'Level' },
              { key: 'weight', header: 'Added Weight' },
              { key: 'percentage', header: '% of BW', className: 'hidden sm:table-cell' },
              { key: 'description', header: 'What It Means', className: 'hidden md:table-cell' },
            ]}
          />
        </div>
      </section>

      {/* Skill Readiness Section */}
      <section className="py-12 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-[#E6E9EF]">Skill Readiness Indicators</h2>
          <p className="text-[#A5A5A5] mb-8">
            Strength benchmarks that correlate with successful skill acquisition. Meeting these standards does not guarantee the skill, but significantly increases your chance of success.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkillReadinessCard
              title="Front Lever Readiness"
              href="/front-lever-progression"
              requirements={frontLeverReadiness}
            />
            <SkillReadinessCard
              title="Planche Readiness"
              href="/planche-progression"
              requirements={plancheReadiness}
            />
            <SkillReadinessCard
              title="Muscle-Up Readiness"
              href="/guides/muscle-up-training"
              requirements={muscleUpReadiness}
            />
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-[#E6E9EF]">How to Use These Standards</h2>
          <div className="space-y-4">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <h3 className="font-semibold text-[#E6E9EF] mb-2">1. Test Your Max Reps</h3>
              <p className="text-[#A5A5A5] text-sm">
                Perform each exercise with strict form until failure. Rest 3-5 minutes before testing to ensure you are fresh. Count only full range-of-motion reps.
              </p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <h3 className="font-semibold text-[#E6E9EF] mb-2">2. Identify Your Level</h3>
              <p className="text-[#A5A5A5] text-sm">
                Compare your results to the standards. Your overall level is typically determined by your weakest category. Focus training on bringing up weak areas.
              </p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <h3 className="font-semibold text-[#E6E9EF] mb-2">3. Set Progressive Goals</h3>
              <p className="text-[#A5A5A5] text-sm">
                Use the next level up as your training target. For weighted exercises, add weight gradually (2.5-5 lb increments) while maintaining rep quality.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ 
        title="Strength Standards FAQ" 
        faqs={faqs} 
        defaultOpen={[0]} 
      />

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#C1121F]/20 to-[#1C1F26] border border-[#C1121F]/30 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold mb-3 text-[#E6E9EF]">Build a Program Based on Your Level</h2>
            <p className="text-[#A5A5A5] mb-6 max-w-xl mx-auto">
              SpartanLab uses your strength levels to generate personalized training programs that target your weak points and prepare you for advanced skills.
            </p>
            <Link href="/calisthenics-program-builder">
              <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white px-8 py-3 rounded-lg gap-2">
                Build Your Program
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related Links Section */}
      <section className="py-12 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-[#E6E9EF]">Explore Skill Progressions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/front-lever-progression">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Front Lever Guide <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/planche-progression">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Planche Guide <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/guides/muscle-up-training">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Muscle-Up Training <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/guides/handstand-training">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Handstand Guide <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
