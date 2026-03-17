import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calculator, Dumbbell, Target, Activity, TrendingUp, Zap } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BackNav } from '@/components/navigation/BackNav'
import { JsonLd } from '@/components/seo/JsonLd'
import { ToolConversionCard } from '@/components/tools/ToolConversionCard'
import { SITE_CONFIG, generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Fitness Calculators | Calisthenics Strength Tools | SpartanLab',
  description: 'Free calisthenics fitness calculators: pull-up strength score, bodyweight strength ratio, calisthenics strength score, and skill readiness calculator. Evaluate your training level.',
  keywords: ['fitness calculator', 'calisthenics calculator', 'pull-up strength', 'bodyweight strength ratio', 'strength score', 'skill readiness'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/calculators`,
  },
  openGraph: {
    title: 'Fitness Calculators | SpartanLab',
    description: 'Free calisthenics fitness calculators to evaluate your strength level and skill readiness.',
    url: `${SITE_CONFIG.url}/calculators`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
}

const calculators = [
  {
    slug: 'pull-up-strength-score',
    title: 'Pull-Up Strength Score',
    description: 'Calculate your pull-up strength score based on max reps and weighted pull-up performance. Get your classification from Beginner to Elite.',
    icon: Dumbbell,
    category: 'Strength Score',
    featured: true,
  },
  {
    slug: 'bodyweight-strength-ratio',
    title: 'Bodyweight Strength Ratio',
    description: 'Calculate your pulling and pushing strength ratios relative to bodyweight. Understand your readiness for advanced skills.',
    icon: Activity,
    category: 'Strength Ratio',
    featured: true,
  },
  {
    slug: 'calisthenics-strength-score',
    title: 'Calisthenics Strength Score',
    description: 'Get a combined strength score (0-100) based on pull-ups, dips, push-ups, and core holds. See where you stand.',
    icon: TrendingUp,
    category: 'Overall Score',
    featured: true,
  },
  {
    slug: 'skill-readiness-score',
    title: 'Skill Readiness Score',
    description: 'Evaluate your readiness for front lever, planche, and muscle-up based on your current strength metrics.',
    icon: Target,
    category: 'Skill Readiness',
    featured: true,
  },
]

const relatedTools = [
  { title: 'Front Lever Readiness Calculator', href: '/front-lever-readiness-calculator', description: 'Detailed front lever assessment' },
  { title: 'Planche Readiness Calculator', href: '/planche-readiness-calculator', description: 'Detailed planche assessment' },
  { title: 'Muscle-Up Readiness Calculator', href: '/muscle-up-readiness-calculator', description: 'Detailed muscle-up assessment' },
  { title: 'Body Fat Calculator', href: '/body-fat-calculator', description: 'Calculate body composition' },
]

const jsonLdSchemas = [
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
  ]),
  generateArticleSchema({
    title: 'Fitness Calculators - Calisthenics Strength Tools',
    description: 'Free calisthenics fitness calculators to evaluate your strength level and skill readiness.',
    url: `${SITE_CONFIG.url}/calculators`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
]

export default function CalculatorsHubPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLd data={jsonLdSchemas[0]} />
      <JsonLd data={jsonLdSchemas[1]} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Navigation */}
        <BackNav href="/" label="Back to Home" />

        {/* Hero Section */}
        <section className="text-center py-12 border-b border-[#2B313A]">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Calculator className="w-8 h-8 text-[#C1121F]" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF] mb-4">
            Fitness Calculators
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl mx-auto mb-6">
            Evaluate your calisthenics strength level and skill readiness with our free calculators. 
            Get personalized insights and training recommendations.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="border-[#C1121F]/30 text-[#C1121F]">
              Free Tools
            </Badge>
            <Badge variant="outline" className="border-[#2B313A] text-[#A4ACB8]">
              Instant Results
            </Badge>
            <Badge variant="outline" className="border-[#2B313A] text-[#A4ACB8]">
              No Account Required
            </Badge>
          </div>
        </section>

        {/* Main Calculators */}
        <section className="py-12">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Strength Calculators</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {calculators.map((calc) => (
              <Link key={calc.slug} href={`/calculators/${calc.slug}`}>
                <Card className="bg-[#1A1F26] border-[#2B313A] p-6 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0">
                      <calc.icon className="w-6 h-6 text-[#C1121F]" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="border-[#2B313A] text-[#6B7280] text-xs mb-2">
                        {calc.category}
                      </Badge>
                      <h3 className="font-semibold text-[#E6E9EF] mb-2 group-hover:text-[#C1121F] transition-colors">
                        {calc.title}
                      </h3>
                      <p className="text-sm text-[#6B7280]">{calc.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#2B313A] group-hover:text-[#C1121F] transition-colors shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Related Readiness Calculators */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Skill Readiness Calculators</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer">
                  <h3 className="font-medium text-[#E6E9EF] text-sm mb-1">{tool.title}</h3>
                  <p className="text-xs text-[#6B7280]">{tool.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="py-12 border-t border-[#2B313A]">
          <ToolConversionCard context="strength-standards" />
        </section>

        {/* Info Section */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">About Our Calculators</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-[#A4ACB8]">
              Our fitness calculators use evidence-based thresholds derived from common calisthenics training benchmarks. 
              Each calculator provides a score or classification to help you understand your current level and identify 
              areas for improvement. While these tools provide useful estimates, individual factors like body composition, 
              training history, and limb proportions affect actual performance.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
