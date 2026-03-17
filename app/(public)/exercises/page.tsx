import { Metadata } from 'next'
import Link from 'next/link'
import { Dumbbell, ChevronRight, ArrowRight, Target, Zap, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Calisthenics Exercise Library | SpartanLab',
  description: 'Complete guide to calisthenics exercises. Learn proper technique, common mistakes, progressions, and how each exercise builds toward advanced skills.',
  keywords: ['calisthenics exercises', 'bodyweight exercises', 'pull-up', 'dip', 'hollow body hold', 'l-sit', 'exercise library'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/exercises`,
  },
  openGraph: {
    title: 'Calisthenics Exercise Library | SpartanLab',
    description: 'Complete guide to calisthenics exercises with technique tips and skill connections.',
    url: `${SITE_CONFIG.url}/exercises`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
}

const jsonLdSchemas = [
  generateArticleSchema({
    title: 'Calisthenics Exercise Library',
    description: 'Complete guide to calisthenics exercises including technique, progressions, and skill transfer.',
    url: `${SITE_CONFIG.url}/exercises`,
    publishedDate: '2024-01-01T00:00:00Z',
  }),
  generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Exercises', url: '/exercises' },
  ]),
]

const exerciseCategories = [
  {
    name: 'Pulling Exercises',
    icon: Target,
    exercises: [
      { name: 'Pull-Up', slug: 'pull-up', description: 'Foundation pulling movement' },
      { name: 'Arch Hang', slug: 'arch-hang', description: 'Scapular control and lat engagement' },
      { name: 'Front Lever Row', slug: 'front-lever-row', description: 'Advanced horizontal pulling' },
    ],
  },
  {
    name: 'Pushing Exercises',
    icon: Zap,
    exercises: [
      { name: 'Dip', slug: 'dip', description: 'Foundation pushing movement' },
      { name: 'Pseudo Planche Push-Up', slug: 'pseudo-planche-push-up', description: 'Planche-specific pushing' },
    ],
  },
  {
    name: 'Core & Static Holds',
    icon: Shield,
    exercises: [
      { name: 'Hollow Body Hold', slug: 'hollow-body-hold', description: 'Core tension pattern' },
      { name: 'L-Sit', slug: 'l-sit', description: 'Core compression and hip flexor strength' },
    ],
  },
]

export default function ExercisesIndexPage() {
  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">Exercises</span>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Library</span>
              <h1 className="text-3xl sm:text-4xl font-bold">Exercise Library</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            Master the fundamental exercises that build calisthenics skills. Each exercise page includes 
            technique instructions, common mistakes, progressions, and skill transfer connections.
          </p>
        </header>

        {/* Exercise Categories */}
        {exerciseCategories.map((category) => (
          <section key={category.name} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <category.icon className="w-5 h-5 text-[#C1121F]" />
              <h2 className="text-xl font-bold">{category.name}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.exercises.map((exercise) => (
                <Link key={exercise.slug} href={`/exercises/${exercise.slug}`}>
                  <Card className="bg-[#1A1F26] border-[#2B313A] p-5 h-full hover:border-[#C1121F]/50 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[#E6E9EF] mb-1 group-hover:text-[#C1121F] transition-colors">
                          {exercise.name}
                        </h3>
                        <p className="text-sm text-[#6B7280]">{exercise.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#C1121F] transition-colors shrink-0 mt-1" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* CTA Section */}
        <section className="mt-12 bg-gradient-to-r from-[#C1121F]/20 to-[#1C1F26] border border-[#C1121F]/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Build Your Training Program</h2>
          <p className="text-[#A4ACB8] mb-4">
            SpartanLab intelligently programs these exercises based on your goals and current level.
          </p>
          <Link
            href="/calisthenics-program-builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C1121F] text-white font-medium rounded-lg hover:bg-[#A50E1A] transition-colors"
          >
            Open Program Builder
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </main>
  )
}
