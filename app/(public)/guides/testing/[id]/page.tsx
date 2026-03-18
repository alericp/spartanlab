import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft,
  ArrowRight,
  Dumbbell, 
  Target, 
  Flame, 
  CheckCircle2,
  AlertTriangle,
  Thermometer,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackNav } from '@/components/navigation/BackNav'
import { 
  ALL_TESTING_GUIDES,
  getTestingGuide,
  type TestCategory
} from '@/lib/testing-guides'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return ALL_TESTING_GUIDES.map((guide) => ({
    id: guide.id,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const guide = getTestingGuide(id)
  
  if (!guide) {
    return { title: 'Test Not Found | SpartanLab' }
  }

  return {
    title: `How to Test ${guide.name} | SpartanLab`,
    description: `${guide.shortDescription} Learn proper warm-up, form standards, and how to record your results.`,
    keywords: [`${guide.name.toLowerCase()} test`, `how to test ${guide.name.toLowerCase()}`, `${guide.category} testing`, 'calisthenics benchmarks'],
  }
}

const categoryConfig: Record<TestCategory, { 
  icon: typeof Dumbbell
  label: string
  color: string
  bgColor: string
}> = {
  strength: {
    icon: Dumbbell,
    label: 'Strength Test',
    color: 'text-[#C1121F]',
    bgColor: 'bg-[#C1121F]/10'
  },
  skill: {
    icon: Target,
    label: 'Skill Test',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10'
  },
  flexibility: {
    icon: Flame,
    label: 'Flexibility Test',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10'
  }
}

export default async function TestingGuidePage({ params }: PageProps) {
  const { id } = await params
  const guide = getTestingGuide(id)

  if (!guide) {
    notFound()
  }

  const config = categoryConfig[guide.category]
  const Icon = config.icon

  // Find related guides in same category
  const relatedGuides = ALL_TESTING_GUIDES
    .filter(g => g.category === guide.category && g.id !== guide.id)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Navigation */}
      <nav className="px-4 py-3 border-b border-[#2B313A]/50 sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <BackNav to="guides" label="Testing Guides" href="/guides/testing" />
        </div>
      </nav>

      <div className="px-4 py-12">
        <article className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>
              <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#E6E9EF] mb-4">
              How to Test {guide.name}
            </h1>
            <p className="text-lg text-[#A4ACB8] leading-relaxed">
              {guide.shortDescription}
            </p>
          </header>

          {/* Content */}
          <div className="space-y-8">
            {/* Warm-Up */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold text-[#E6E9EF]">Warm-Up First</h2>
              </div>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
                <p className="text-sm text-[#6B7280] mb-4">
                  Warm up before testing. This prepares your body and gives you a more accurate result.
                </p>
                <ol className="space-y-3">
                  {guide.warmUp.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-[#A4ACB8] text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </section>

            {/* How to Test */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                  <Target className={`w-4 h-4 ${config.color}`} />
                </div>
                <h2 className="text-xl font-semibold text-[#E6E9EF]">How to Perform the Test</h2>
              </div>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
                <ul className="space-y-3">
                  {guide.howToTest.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#A4ACB8]">
                      <ChevronRight className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            {/* What Counts */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold text-[#E6E9EF]">What Counts as a Good Rep</h2>
              </div>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
                <ul className="space-y-3">
                  {guide.whatCounts.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#A4ACB8]">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            {/* Recording Result */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#4F6D8A]/10 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-[#4F6D8A]" />
                </div>
                <h2 className="text-xl font-semibold text-[#E6E9EF]">Recording Your Result</h2>
              </div>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
                <p className="text-[#A4ACB8] text-sm">{guide.howToRecord}</p>
              </Card>
            </section>

            {/* Safety Notes */}
            {guide.safetyNotes && guide.safetyNotes.length > 0 && (
              <section>
                <Card className="bg-amber-500/5 border-amber-500/20 p-5">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-amber-400 mb-3">Safety Notes</h3>
                      <ul className="space-y-2">
                        {guide.safetyNotes.map((note, i) => (
                          <li key={i} className="text-sm text-[#A4ACB8] flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </section>
            )}
          </div>

          {/* Related Tests */}
          {relatedGuides.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#2B313A]">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-4">
                Other {guide.category.charAt(0).toUpperCase() + guide.category.slice(1)} Tests
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {relatedGuides.map((related) => (
                  <Link key={related.id} href={`/guides/testing/${related.id}`}>
                    <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/40 transition-colors group h-full">
                      <h4 className="font-medium text-[#E6E9EF] text-sm group-hover:text-[#C1121F] transition-colors mb-1">
                        {related.name}
                      </h4>
                      <p className="text-xs text-[#6B7280] line-clamp-2">
                        {related.shortDescription}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Card className="mt-12 bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2">
                Ready to Update Your Profile?
              </h3>
              <p className="text-sm text-[#A4ACB8] mb-4">
                Once you have tested, update your metrics in SpartanLab for a more accurate training program.
              </p>
              <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A]">
                <Link href="/sign-in?redirect_url=/dashboard">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Back Link */}
          <div className="mt-8">
            <Link 
              href="/guides/testing" 
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All testing guides
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
