import { Metadata } from 'next'
import Link from 'next/link'
import { Clock, ChevronRight, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  JOINT_INTEGRITY_PROTOCOLS, 
  JOINT_REGION_LABELS,
  type JointRegion 
} from '@/lib/protocols/joint-integrity-protocol'

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: 'Joint Integrity Protocols | Calisthenics Injury Prevention | SpartanLab',
  description: 'Evidence-based joint preparation protocols for calisthenics training. Protect your wrists, shoulders, elbows, and more with targeted injury prevention routines.',
  openGraph: {
    title: 'Joint Integrity Protocols | Calisthenics Injury Prevention',
    description: 'Evidence-based joint preparation protocols for calisthenics training. Protect your wrists, shoulders, elbows, and more.',
  },
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function ProtocolsIndexPage() {
  // Group protocols by joint region
  const protocolsByRegion = JOINT_INTEGRITY_PROTOCOLS.reduce((acc, protocol) => {
    if (!acc[protocol.jointRegion]) {
      acc[protocol.jointRegion] = []
    }
    acc[protocol.jointRegion].push(protocol)
    return acc
  }, {} as Record<JointRegion, typeof JOINT_INTEGRITY_PROTOCOLS>)

  const regions = Object.keys(protocolsByRegion) as JointRegion[]

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E63946]/20 mb-6">
            <Shield className="w-8 h-8 text-[#E63946]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-4">
            Joint Integrity Protocols
          </h1>
          <p className="text-lg text-[#A5A5A5] max-w-2xl mx-auto leading-relaxed">
            Targeted injury prevention routines for calisthenics athletes. 
            Each protocol takes 3-5 minutes and prepares specific joints for training.
          </p>
        </header>

        {/* Protocol Grid */}
        <div className="space-y-10">
          {regions.map((region) => (
            <section key={region}>
              <h2 className="text-xl font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E63946]" />
                {JOINT_REGION_LABELS[region]}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {protocolsByRegion[region].map((protocol) => (
                  <Link key={protocol.id} href={`/protocols/${protocol.seoSlug}`}>
                    <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg text-[#F5F5F5]">
                            {protocol.name}
                          </CardTitle>
                          <ChevronRight className="w-5 h-5 text-[#A5A5A5]" />
                        </div>
                        <CardDescription className="text-[#A5A5A5] line-clamp-2">
                          {protocol.purpose}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-[#A5A5A5]">
                            <Clock className="w-4 h-4" />
                            {protocol.durationMinutes} min
                          </div>
                          <Badge variant="outline" className="border-[#3A3A3A] text-[#A5A5A5]">
                            {protocol.difficultyLevel}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Integration Note */}
        <section className="mt-16 text-center border-t border-[#2A2A2A] pt-12">
          <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">
            Automatic Protocol Integration
          </h3>
          <p className="text-[#A5A5A5] mb-4 max-w-xl mx-auto">
            SpartanLab automatically adds relevant protocols to your warm-ups based on your training goals and any joint concerns you flag in your profile.
          </p>
          <Link 
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-[#E63946] hover:bg-[#E63946]/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Get Started
          </Link>
        </section>
      </div>
    </main>
  )
}
