import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, Target, Dumbbell, Zap, CheckCircle, ChevronRight, Sparkles, Trophy, Shield, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Calisthenics Training Programs | Free Program Builder | SpartanLab',
  description: 'Build personalized calisthenics training programs for front lever, planche, muscle-up, and more. Free program generator with skill-specific progressions and adaptive training.',
  keywords: ['calisthenics program', 'calisthenics training program', 'bodyweight program', 'front lever program', 'planche program', 'muscle-up program', 'calisthenics workout plan'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/programs`,
  },
  openGraph: {
    title: 'Calisthenics Training Programs | SpartanLab',
    description: 'Build personalized calisthenics training programs for front lever, planche, muscle-up, and more.',
    url: `${SITE_CONFIG.url}/programs`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calisthenics Training Programs | SpartanLab',
    description: 'Build personalized calisthenics training programs for front lever, planche, muscle-up, and more.',
  },
}

const jsonLdSchemas = [
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Programs', url: '/programs' },
  ]),
]

const FEATURED_PROGRAMS = [
  {
    slug: 'calisthenics-beginner-program',
    title: 'Calisthenics Beginner Program',
    description: 'Build foundational strength with proper technique for pull-ups, dips, and push-ups.',
    icon: Dumbbell,
    duration: '12 weeks',
    level: 'Beginner',
    featured: true,
  },
  {
    slug: 'front-lever-program',
    title: 'Front Lever Program',
    description: 'Systematic approach to master the front lever from tuck to full.',
    icon: Target,
    duration: '16+ weeks',
    level: 'Intermediate',
    featured: true,
  },
  {
    slug: 'planche-program',
    title: 'Planche Program',
    description: 'Progressive training to build planche strength from lean to full.',
    icon: Target,
    duration: '20+ weeks',
    level: 'Intermediate-Advanced',
    featured: true,
  },
  {
    slug: 'muscle-up-program',
    title: 'Muscle-Up Program',
    description: 'Master the bar and ring muscle-up with proper technique.',
    icon: Zap,
    duration: '8-12 weeks',
    level: 'Intermediate',
    featured: true,
  },
  {
    slug: 'handstand-push-up-program',
    title: 'Handstand Push-Up Program',
    description: 'Build pressing strength for freestanding handstand push-ups.',
    icon: Trophy,
    duration: '12+ weeks',
    level: 'Intermediate',
  },
]

const PROGRAM_FEATURES = [
  {
    icon: Target,
    title: 'Skill-Specific Progressions',
    description: 'Programs tailored to your target skill with appropriate exercise selection.',
  },
  {
    icon: Activity,
    title: 'Adaptive Adjustments',
    description: 'Pro users get automatic program adjustments based on performance and fatigue.',
  },
  {
    icon: Shield,
    title: 'Joint Integrity Built-In',
    description: 'All programs include wrist, elbow, and shoulder preparation protocols.',
  },
  {
    icon: Sparkles,
    title: 'Constraint-Aware Training',
    description: 'Programs prioritize exercises to address your specific limiters.',
  },
]

export default function ProgramsPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 text-[#C1121F] text-sm mb-6">
            <Calendar className="w-4 h-4" />
            Free Program Builder
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-6">
            Calisthenics Training Programs
          </h1>
          <p className="text-lg sm:text-xl text-[#A5A5A5] max-w-2xl mx-auto mb-8 text-pretty">
            Generate personalized training programs based on your current strength, target skills, and available training time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
                Build Your Program
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#programs">
              <Button size="lg" variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A]">
                Browse Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 sm:px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAM_FEATURES.map((feature) => (
              <div key={feature.title} className="p-5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                <feature.icon className="w-8 h-8 text-[#C1121F] mb-3" />
                <h3 className="font-semibold text-[#F5F5F5] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#A5A5A5]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs List */}
      <section id="programs" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Training Programs</h2>
            <p className="text-[#A5A5A5] max-w-2xl mx-auto">
              Explore our structured training programs for specific calisthenics skills and goals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_PROGRAMS.map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`}>
                <Card className="h-full bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors p-6 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
                      <program.icon className="w-6 h-6 text-[#C1121F]" />
                    </div>
                    {program.featured && (
                      <span className="text-xs px-2 py-1 rounded-full bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/20">
                        Popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2 group-hover:text-[#C1121F] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-sm text-[#A5A5A5] mb-4">
                    {program.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {program.duration}
                    </span>
                    <span>{program.level}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-[#0A0A0A] to-[#121212]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Build Your Program?
          </h2>
          <p className="text-[#A5A5A5] mb-8 max-w-xl mx-auto">
            Create a free account to generate personalized training programs based on your strength levels and goals.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-xs text-[#6B7280] mt-4">
            No credit card required. Free tools available immediately.
          </p>
        </div>
      </section>
    </SeoPageLayout>
  )
}
