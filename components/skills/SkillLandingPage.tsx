import Link from 'next/link'
import { ArrowRight, Calculator, BookOpen, AlertTriangle, ChevronRight, Dumbbell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateArticleSchema, generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'
import type { SkillConfig } from '@/lib/skills/skill-page-config'

interface SkillLandingPageProps {
  config: SkillConfig
}

export function SkillLandingPage({ config }: SkillLandingPageProps) {
  const jsonLdSchemas = [
    generateArticleSchema({
      title: `${config.title} Training Hub`,
      description: config.seoDescription,
      url: `${SITE_CONFIG.url}/skills/${config.slug}`,
      publishedDate: '2024-01-01T00:00:00Z',
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Skills', url: '/skills' },
      { name: config.title, url: `/skills/${config.slug}` },
    ]),
  ]

  const Icon = config.icon

  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <JsonLdMultiple schemas={jsonLdSchemas} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
          <Link href="/" className="hover:text-[#E6E9EF]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/skills" className="hover:text-[#E6E9EF]">Skills</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#E6E9EF]">{config.title}</span>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-[#C1121F]" />
            </div>
            <div>
              <span className="text-xs text-[#C1121F] font-medium uppercase tracking-wider">Skill Hub</span>
              <h1 className="text-3xl sm:text-4xl font-bold">{config.title}</h1>
            </div>
          </div>
          <p className="text-lg text-[#A5A5A5] max-w-2xl">
            {config.intro}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {config.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-[#2B313A] rounded-full text-sm">{tag}</span>
            ))}
          </div>
        </header>

        {/* Quick Actions */}
        <section className="grid sm:grid-cols-2 gap-4 mb-12">
          {config.readinessCalculatorHref && (
            <Link href={config.readinessCalculatorHref}>
              <Card className="bg-[#C1121F]/10 border-[#C1121F]/30 p-5 h-full hover:bg-[#C1121F]/15 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-[#C1121F]" />
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF]">Check Your Strength</h3>
                    <p className="text-sm text-[#A5A5A5]">Take the strength calculator</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#C1121F] ml-auto" />
                </div>
              </Card>
            </Link>
          )}
          {config.oneRmCalculatorHref && (
            <Link href={config.oneRmCalculatorHref}>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5 h-full hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Calculator className="w-6 h-6 text-[#C1121F]" />
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF]">1RM Calculator</h3>
                    <p className="text-sm text-[#A5A5A5]">Estimate your max</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#6B7280] ml-auto" />
                </div>
              </Card>
            </Link>
          )}
          {config.progressionGuideHref && (
            <Link href={config.progressionGuideHref}>
              <Card className="bg-[#1A1F26] border-[#2B313A] p-5 h-full hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-[#C1121F]" />
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF]">Full Progression Guide</h3>
                    <p className="text-sm text-[#A5A5A5]">Detailed training walkthrough</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#6B7280] ml-auto" />
                </div>
              </Card>
            </Link>
          )}
        </section>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Prerequisites</h2>
          <div className="flex flex-wrap gap-2">
            {config.prereqs.map((prereq) => (
              <span key={prereq} className="px-3 py-1.5 bg-[#1A1F26] border border-[#2B313A] rounded-lg text-sm text-[#A5A5A5]">
                {prereq}
              </span>
            ))}
          </div>
        </section>

        {/* Key Muscles */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Key Muscles Used</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {config.keyMuscles.map((muscle) => (
              <div key={muscle.name} className="flex items-center gap-3 p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
                <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                <div>
                  <p className="font-medium text-[#E6E9EF]">{muscle.name}</p>
                  <p className="text-xs text-[#6B7280]">{muscle.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Progression Stages */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Progression Roadmap</h2>
          <div className="space-y-3">
            {config.progressionStages.map((stage, index) => (
              <div key={stage.name} className="flex items-center gap-4 p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
                <div className="w-8 h-8 rounded-full bg-[#2B313A] flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#E6E9EF]">{stage.name}</p>
                  <p className="text-xs text-[#6B7280]">{stage.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#C1121F]">{stage.hold || stage.reps}</p>
                  <p className="text-xs text-[#6B7280]">{stage.hold ? 'target hold' : 'target'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#E63946]" />
            <h2 className="text-xl font-bold">Common Training Mistakes</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {config.commonMistakes.map((mistake) => (
              <div key={mistake.title} className="p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
                <h3 className="font-medium text-[#E6E9EF] mb-1">{mistake.title}</h3>
                <p className="text-sm text-[#6B7280]">{mistake.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Training Resources */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Training Resources</h2>
          <div className="space-y-3">
            {config.trainingResources.map((resource) => (
              <Link key={resource.href} href={resource.href}>
                <div className="flex items-center justify-between p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium text-[#E6E9EF]">{resource.title}</p>
                    <p className="text-sm text-[#6B7280]">{resource.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#6B7280]" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-[#C1121F]/20 to-[#1A1F26] border-[#C1121F]/30 p-6">
            <h2 className="text-xl font-bold mb-2">Ready to Train?</h2>
            <p className="text-[#A5A5A5] mb-4">
              SpartanLab creates adaptive programs that target your specific limiting factors and integrate {config.title.toLowerCase()} training with your other goals.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/onboarding">
                <Button className="bg-[#C1121F] hover:bg-[#A50E1A]">
                  Generate Your Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {config.readinessCalculatorHref && (
                <Link href={config.readinessCalculatorHref}>
                  <Button variant="outline" className="border-[#2B313A] hover:bg-[#2B313A]">
                    Check Your Strength First
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </section>

        {/* Related Skills */}
        <section>
          <h2 className="text-xl font-bold mb-4">Related Skills</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {config.relatedSkills.map((skill) => (
              <Link key={skill.slug} href={`/skills/${skill.slug}`}>
                <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer h-full">
                  <h3 className="font-medium text-[#E6E9EF] mb-1">{skill.title}</h3>
                  <p className="text-xs text-[#6B7280]">{skill.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
