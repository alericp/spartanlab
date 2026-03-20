import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Target, Dumbbell, Trophy, Zap, ChevronRight, Sparkles, Activity, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Calisthenics Skills Hub | Front Lever, Planche, Muscle-Up | SpartanLab',
  description: 'Master advanced calisthenics skills with structured progression guides. Front lever, planche, muscle-up, HSPU training resources with readiness calculators and program builders.',
  keywords: ['calisthenics skills', 'front lever', 'planche', 'muscle-up', 'handstand push-up', 'calisthenics progression', 'skill training'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/skills`,
  },
  openGraph: {
    title: 'Calisthenics Skills Hub | SpartanLab',
    description: 'Master advanced calisthenics skills with structured progression guides and readiness calculators.',
    url: `${SITE_CONFIG.url}/skills`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calisthenics Skills Hub | SpartanLab',
    description: 'Master advanced calisthenics skills with structured progression guides and readiness calculators.',
  },
}

const jsonLdSchemas = [
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Skills', url: '/skills' },
  ]),
]

const SKILLS = [
  // Static/Lever Skills
  {
    slug: 'front-lever',
    title: 'Front Lever',
    description: 'The ultimate horizontal pulling skill. Build incredible lat and core strength.',
    icon: Target,
    difficulty: 'Intermediate',
    category: 'Pulling',
    prereqs: ['10+ strict pull-ups', 'Strong core', 'Scapular control'],
    featured: true,
  },
  {
    slug: 'back-lever',
    title: 'Back Lever',
    description: 'Foundational straight-arm skill. Build shoulder extension and body tension.',
    icon: Target,
    difficulty: 'Intermediate',
    category: 'Pulling',
    prereqs: ['German hang', 'Shoulder mobility', 'Body tension'],
    featured: true,
  },
  {
    slug: 'planche',
    title: 'Planche',
    description: 'The pinnacle of pushing strength. Full body horizontal on straight arms.',
    icon: Target,
    difficulty: 'Advanced',
    category: 'Pushing',
    prereqs: ['Strong dips', 'Wrist conditioning', 'Shoulder stability'],
    featured: true,
  },
  // Transition Skills
  {
    slug: 'muscle-up',
    title: 'Muscle-Up',
    description: 'The gateway skill combining pulling and pushing in one explosive movement.',
    icon: Zap,
    difficulty: 'Intermediate',
    category: 'Transition',
    prereqs: ['12+ pull-ups', 'Explosive pull power', 'Straight bar dips'],
    featured: true,
  },
  // Pressing Skills
  {
    slug: 'handstand-push-up',
    title: 'Handstand Push-Up',
    description: 'Vertical pressing mastery. Build shoulder strength and balance.',
    icon: Trophy,
    difficulty: 'Intermediate-Advanced',
    category: 'Pushing',
    prereqs: ['Wall handstand', 'Pike push-ups', 'Overhead mobility'],
    featured: true,
  },
  // Weighted Skills
  {
    slug: 'weighted-pull-up',
    title: 'Weighted Pull-Up',
    description: 'Build elite pulling strength. Foundation for front lever and one-arm pull-up.',
    icon: Dumbbell,
    difficulty: 'Intermediate',
    category: 'Weighted',
    prereqs: ['10+ strict pull-ups', 'Good form', 'Healthy shoulders'],
    featured: true,
  },
  {
    slug: 'weighted-dip',
    title: 'Weighted Dip',
    description: 'The king of upper body pushing. Build tricep and chest mass.',
    icon: Dumbbell,
    difficulty: 'Intermediate',
    category: 'Weighted',
    prereqs: ['15+ strict dips', 'Shoulder health', 'Core stability'],
    featured: true,
  },
  // Elite Skills
  {
    slug: 'one-arm-pull-up',
    title: 'One-Arm Pull-Up',
    description: 'Ultimate display of relative pulling strength. Elite skill requiring years.',
    icon: Trophy,
    difficulty: 'Elite',
    category: 'Pulling',
    prereqs: ['+50% BW weighted pull-up', 'Strong grip', 'Healthy elbows'],
    featured: true,
  },
]

const SKILL_RESOURCES = [
  {
    title: 'Readiness Calculators',
    description: 'Test your current readiness for each skill and identify what is limiting your progress.',
    href: '/calculators/skill-readiness-score',
    icon: Activity,
  },
  {
    title: 'Training Guides',
    description: 'In-depth guides covering progressions, programming, and common mistakes.',
    href: '/guides',
    icon: Target,
  },
  {
    title: 'Strength Standards',
    description: 'Benchmark your strength against skill-specific requirements.',
    href: '/calisthenics-strength-standards',
    icon: Dumbbell,
  },
]

export default function SkillsPage() {
  return (
    <SeoPageLayout>
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 text-[#C1121F] text-sm mb-6">
            <Target className="w-4 h-4" />
            Skill Mastery
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-6">
            Calisthenics Skills Hub
          </h1>
          <p className="text-lg sm:text-xl text-[#A5A5A5] max-w-2xl mx-auto mb-8 text-pretty">
            Master advanced calisthenics skills with structured progressions, readiness analysis, and personalized training programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] gap-2">
                Start Training
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#skills">
              <Button size="lg" variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A]">
                Explore Skills
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <section id="skills" className="py-16 px-4 sm:px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Advanced Skills</h2>
            <p className="text-[#A5A5A5] max-w-2xl mx-auto">
              Each skill has dedicated resources including progression guides, readiness calculators, and training programs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {SKILLS.map((skill) => (
              <Link key={skill.slug} href={`/skills/${skill.slug}`}>
                <Card className="h-full bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors p-6 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
                      <skill.icon className="w-7 h-7 text-[#C1121F]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-[#2A2A2A] text-[#A5A5A5]">
                        {skill.category}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-[#C1121F]/10 text-[#C1121F]">
                        {skill.difficulty}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2 group-hover:text-[#C1121F] transition-colors">
                    {skill.title}
                  </h3>
                  <p className="text-sm text-[#A5A5A5] mb-4">
                    {skill.description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider">Prerequisites</p>
                    <ul className="space-y-1">
                      {skill.prereqs.map((prereq) => (
                        <li key={prereq} className="flex items-center gap-2 text-sm text-[#A5A5A5]">
                          <CheckCircle className="w-3.5 h-3.5 text-[#C1121F]/70" />
                          {prereq}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#2A2A2A] flex items-center justify-between">
                    <span className="text-sm text-[#C1121F] group-hover:underline">View Training Hub</span>
                    <ChevronRight className="w-4 h-4 text-[#C1121F] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Training Resources</h2>
            <p className="text-[#A5A5A5] max-w-2xl mx-auto">
              Free tools and guides to support your skill development journey.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {SKILL_RESOURCES.map((resource) => (
              <Link key={resource.href} href={resource.href}>
                <Card className="h-full bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#C1121F]/30 transition-colors p-6 group">
                  <resource.icon className="w-10 h-10 text-[#C1121F] mb-4" />
                  <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2 group-hover:text-[#C1121F] transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-[#A5A5A5]">
                    {resource.description}
                  </p>
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
            Track Your Skill Progress
          </h2>
          <p className="text-[#A5A5A5] mb-8 max-w-xl mx-auto">
            Create a free account to track your skill progressions, log sessions, and get personalized readiness analysis.
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
