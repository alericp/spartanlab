import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Target, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  getProtocolBySlug, 
  getAllProtocolSlugs,
  JOINT_REGION_LABELS,
  type JointIntegrityProtocol 
} from '@/lib/protocols/joint-integrity-protocol'

// =============================================================================
// STATIC PARAMS
// =============================================================================

export async function generateStaticParams() {
  const slugs = getAllProtocolSlugs()
  return slugs.map((slug) => ({ slug }))
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params
  const protocol = getProtocolBySlug(slug)
  
  if (!protocol) {
    return { title: 'Protocol Not Found' }
  }
  
  return {
    title: protocol.seoTitle,
    description: protocol.seoDescription,
    openGraph: {
      title: protocol.seoTitle,
      description: protocol.seoDescription,
      type: 'article',
    },
  }
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function ProtocolGuidePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const protocol = getProtocolBySlug(slug)
  
  if (!protocol) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link 
          href="/protocols" 
          className="inline-flex items-center gap-2 text-[#A5A5A5] hover:text-[#F5F5F5] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All Protocols
        </Link>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="border-[#E63946] text-[#E63946]">
              {JOINT_REGION_LABELS[protocol.jointRegion]}
            </Badge>
            <Badge variant="outline" className="border-[#3A3A3A] text-[#A5A5A5]">
              {protocol.difficultyLevel}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-4">
            {protocol.name}
          </h1>
          <p className="text-lg text-[#A5A5A5] leading-relaxed">
            {protocol.purpose}
          </p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="w-5 h-5 text-[#E63946]" />
              <div>
                <p className="text-sm text-[#A5A5A5]">Duration</p>
                <p className="font-semibold text-[#F5F5F5]">{protocol.durationMinutes} minutes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardContent className="flex items-center gap-3 p-4">
              <Target className="w-5 h-5 text-[#E63946]" />
              <div>
                <p className="text-sm text-[#A5A5A5]">Frequency</p>
                <p className="font-semibold text-[#F5F5F5] text-sm">{protocol.recommendedFrequency}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exercises */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">Exercises</h2>
          <div className="space-y-3">
            {protocol.exercises.map((exercise, index) => (
              <Card key={index} className="bg-[#1A1A1A] border-[#2A2A2A]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E63946]/20 text-[#E63946] text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium text-[#F5F5F5]">{exercise.name}</h3>
                        {exercise.notes && (
                          <p className="text-sm text-[#A5A5A5] mt-1">{exercise.notes}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-[#2A2A2A] text-[#F5F5F5]">
                      {exercise.prescription}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Skill Relevance */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">Relevant Skills</h2>
          <div className="flex flex-wrap gap-2">
            {protocol.skillRelevance.map((skill) => (
              <Badge 
                key={skill} 
                variant="outline" 
                className="border-[#3A3A3A] text-[#A5A5A5] capitalize"
              >
                {skill.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </section>

        {/* Coaching Notes */}
        <section className="mb-10">
          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-lg text-[#F5F5F5] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#E63946]" />
                Coaching Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#A5A5A5] leading-relaxed">
                {protocol.coachingNotes}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-8 border-t border-[#2A2A2A]">
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">
            Get personalized training with SpartanLab
          </h3>
          <p className="text-[#A5A5A5] mb-4">
            This protocol is automatically integrated into your warm-ups when relevant.
          </p>
          <Link 
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-[#E63946] hover:bg-[#E63946]/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Start Training
          </Link>
        </section>
      </div>
    </main>
  )
}
