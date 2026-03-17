import type { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { SeoHero } from '@/components/seo/SeoHero'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { FAQ } from '@/components/seo/FAQ'
import { generateArticleSchema, generateBreadcrumbSchema, generateFAQSchema, SITE_CONFIG } from '@/lib/seo'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dumbbell, Target, TrendingUp } from 'lucide-react'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'

// Client island for interactive calculator
import { CalisthenicsStrengthCalculator } from '@/components/public/CalisthenicsStrengthCalculator'

/**
 * Calisthenics Strength Standards Page - SERVER COMPONENT
 * 
 * This page is a SERVER component for maximum prerender safety.
 * All interactive logic is isolated in the CalisthenicsStrengthCalculator client island.
 * 
 * ARCHITECTURE:
 * - Page: Server component (this file) - handles SEO, metadata, static content
 * - Calculator: Client island (CalisthenicsStrengthCalculator) - handles form state, calculations
 * 
 * DO NOT add 'use client' to this file.
 * DO NOT import auth-aware components (useAuth, useUser, ToolConversionCardClient, etc.)
 */

// SEO Metadata
export const metadata: Metadata = {
  title: 'Calisthenics Strength Standards Calculator - Find Your Level',
  description: 'Calculate your calisthenics strength level from Beginner to Elite. Analyze pulling, pushing, and core strength. Identify movement imbalances and see which skills you are ready to pursue.',
  keywords: ['calisthenics strength standards', 'bodyweight strength calculator', 'pull up standards', 'dip standards', 'calisthenics level', 'strength benchmarks'],
  openGraph: {
    title: 'Calisthenics Strength Standards Calculator',
    description: 'Find your calisthenics strength level and identify movement imbalances.',
    url: `${SITE_CONFIG.url}/calisthenics-strength-standards`,
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/calisthenics-strength-standards`,
  },
}

// Bodyweight strength standards (for reference tables)
const pullUpStandards = [
  { level: 'Beginner', reps: '3-5 reps', description: 'Basic pulling strength established' },
  { level: 'Developing', reps: '6-9 reps', description: 'Building pulling foundation' },
  { level: 'Intermediate', reps: '10-14 reps', description: 'Solid foundation for skill work' },
  { level: 'Advanced', reps: '15-20 reps', description: 'Strong enough for most skills' },
  { level: 'Elite', reps: '25+ reps', description: 'Exceptional endurance capacity' },
]

const dipStandards = [
  { level: 'Beginner', reps: '5-8 reps', description: 'Basic pushing strength established' },
  { level: 'Developing', reps: '9-14 reps', description: 'Building pressing foundation' },
  { level: 'Intermediate', reps: '15-19 reps', description: 'Ready for weighted progression' },
  { level: 'Advanced', reps: '20-29 reps', description: 'Strong pressing foundation' },
  { level: 'Elite', reps: '30+ reps', description: 'Exceptional pushing endurance' },
]

const coreStandards = [
  { level: 'Beginner', benchmark: 'Hollow hold 15-30s', description: 'Basic core tension' },
  { level: 'Developing', benchmark: 'Hollow hold 45s+', description: 'Building core control' },
  { level: 'Intermediate', benchmark: 'L-sit 10-20s', description: 'Solid compression' },
  { level: 'Advanced', benchmark: 'L-sit 30s+', description: 'Strong compression strength' },
  { level: 'Elite', benchmark: 'V-sit hold', description: 'Elite compression' },
]

// FAQ data
const faqs = [
  { 
    question: 'How do I know my calisthenics level?', 
    answer: 'Use the calculator above to enter your max reps and hold times. Your level is determined by comparing your performance to established benchmarks. Test your max reps with strict form after adequate rest for the most accurate results.' 
  },
  { 
    question: 'Why does the calculator look at weighted exercises?', 
    answer: 'Weighted pull-ups and dips are the strongest predictors of success in advanced skills like front lever and planche. High rep bodyweight numbers show endurance, but weighted strength shows the raw power needed for skill work.' 
  },
  { 
    question: 'What is movement bias and why does it matter?', 
    answer: 'Movement bias means you are significantly stronger in one pattern (pulling or pushing) compared to others. Imbalances can limit skill progression and increase injury risk. The calculator identifies these so you can address them.' 
  },
  { 
    question: 'How accurate are the skill readiness predictions?', 
    answer: 'These are conservative estimates based on strength correlations. Meeting the strength requirements does not guarantee the skill - technique, body composition, and training specificity also matter. However, lacking the strength makes the skill very unlikely.' 
  },
  { 
    question: 'How often should I retest my strength levels?', 
    answer: 'Test every 6-8 weeks to track progress. More frequent testing can be demotivating and may not show meaningful changes. Focus on consistent training between tests.' 
  },
]

// JSON-LD schemas (static, computed at build time)
const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Calisthenics Strength Standards Calculator',
    description: 'Calculate your calisthenics strength level and identify movement imbalances.',
    url: `${SITE_CONFIG.url}/calisthenics-strength-standards`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Strength Standards', url: '/calisthenics-strength-standards' },
  ]),
  generateFAQSchema(faqs),
]

// Reusable table component (server-rendered)
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

export default function CalisthenicsStrengthStandardsPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Hero Section (server-rendered) */}
      <SeoHero
        title="Calisthenics Strength Standards Calculator"
        subtitle="Find your strength level from Beginner to Elite. Analyze pulling, pushing, and core strength. Identify movement imbalances and see which skills you are ready to pursue."
        badge="Strength Calculator"
      />
      
      {/* Trust-building microcopy (server-rendered) */}
      <div className="text-center -mt-4 mb-8 px-4">
        <p className="text-xs text-[#6B7280] max-w-lg mx-auto">
          Built from structured calisthenics benchmarks used to evaluate real athlete progression.
        </p>
      </div>

      {/* Interactive Calculator (CLIENT ISLAND) */}
      <CalisthenicsStrengthCalculator />

      {/* What This Calculator Measures (server-rendered) */}
      <section className="py-12 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-[#E6E9EF]">What This Calculator Measures</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <Dumbbell className="w-8 h-8 text-[#C1121F] mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Pulling Strength</h3>
              <p className="text-sm text-[#A5A5A5]">Pull-ups and weighted pull-ups indicate your back and bicep strength for skills like front lever and muscle-up.</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <Target className="w-8 h-8 text-[#C1121F] mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Pushing Strength</h3>
              <p className="text-sm text-[#A5A5A5]">Push-ups and dips measure your chest, tricep, and shoulder strength for skills like planche and HSPU.</p>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
              <TrendingUp className="w-8 h-8 text-[#C1121F] mb-3" />
              <h3 className="font-semibold text-[#E6E9EF] mb-2">Core Strength</h3>
              <p className="text-sm text-[#A5A5A5]">L-sit and hollow holds measure compression and body tension required for all advanced calisthenics skills.</p>
            </Card>
          </div>
          <p className="text-[#A5A5A5] text-sm">
            <strong className="text-[#E6E9EF]">Why balanced strength matters:</strong> Calisthenics skills require coordinated strength across all movement patterns. 
            An imbalance in pulling, pushing, or core strength will limit your skill progression and increase injury risk. 
            This calculator identifies these imbalances so you can address them in your training.
          </p>
        </div>
      </section>

      {/* Reference Standards Section (server-rendered) */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-[#E6E9EF]">Reference Strength Standards</h2>
          <p className="text-[#A5A5A5] mb-8">Benchmarks for each strength level.</p>
          
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
            title="Core Standards"
            data={coreStandards}
            columns={[
              { key: 'level', header: 'Level' },
              { key: 'benchmark', header: 'Benchmark' },
              { key: 'description', header: 'What It Means', className: 'hidden sm:table-cell' },
            ]}
          />
        </div>
      </section>

      {/* FAQ Section (server-rendered) */}
      <FAQ 
        title="Strength Standards FAQ" 
        faqs={faqs} 
        defaultOpen={[0]} 
      />

      {/* Related Calculators (server-rendered) */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-[#E6E9EF]">Skill-Specific Readiness Calculators</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/front-lever-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer h-full">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Front Lever</h3>
                <p className="text-xs text-[#6B7280]">Check your pulling readiness</p>
              </Card>
            </Link>
            <Link href="/planche-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer h-full">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Planche</h3>
                <p className="text-xs text-[#6B7280]">Check your pushing readiness</p>
              </Card>
            </Link>
            <Link href="/muscle-up-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer h-full">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Muscle-Up</h3>
                <p className="text-xs text-[#6B7280]">Check your transition readiness</p>
              </Card>
            </Link>
            <Link href="/iron-cross-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer h-full">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Iron Cross</h3>
                <p className="text-xs text-[#6B7280]">Check your ring strength</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-12 px-4 sm:px-6 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-[#E6E9EF]">Related Resources</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/weighted-pull-up-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Weighted Pull-Up Standards</h3>
                <p className="text-xs text-[#6B7280]">Advanced pulling benchmarks</p>
              </Card>
            </Link>
            <Link href="/guides">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Training Guides</h3>
                <p className="text-xs text-[#6B7280]">In-depth progression guides</p>
              </Card>
            </Link>
            <Link href="/programs">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors h-full">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Training Programs</h3>
                <p className="text-xs text-[#6B7280]">Structured skill programs</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Conversion CTA - Static version (server-rendered) */}
      <section className="py-12 px-4 sm:px-6 bg-[#0F1115]">
        <div className="max-w-4xl mx-auto">
          <ToolConversionCardStatic context="strength-standards" />
        </div>
      </section>
    </SeoPageLayout>
  )
}
