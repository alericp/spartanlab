import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  TrendingUp,
  Activity,
  type LucideIcon,
} from 'lucide-react'

export interface TrainingProgramData {
  // Hero
  title: string
  subtitle: string
  description: string
  
  // What this program is
  whatItIs: {
    summary: string
    forWho: string[]
  }
  
  // Common mistakes
  mistakes: {
    title: string
    description: string
  }[]
  
  // How to train properly
  howToTrain: {
    frequency: string
    intensity: string
    progression: string
    recovery: string
  }
  
  // How SpartanLab does it
  spartanlabApproach: {
    title: string
    description: string
  }[]
  
  // Related programs for internal linking
  relatedPrograms: {
    title: string
    href: string
    description: string
  }[]
  
  // CTA
  ctaText: string
}

interface TrainingProgramPageProps {
  data: TrainingProgramData
}

export function TrainingProgramPage({ data }: TrainingProgramPageProps) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E6E9EF]">
      <MarketingHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C1121F]/10 text-[#C1121F] text-sm font-medium mb-6">
            <Target className="w-4 h-4" />
            Training Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-balance">
            {data.title}
          </h1>
          <p className="text-xl text-[#A4ACB8] max-w-2xl mx-auto mb-4">
            {data.subtitle}
          </p>
          <p className="text-[#6B7280] max-w-xl mx-auto">
            {data.description}
          </p>
        </div>
      </section>
      
      {/* What This Program Is */}
      <section className="py-16 sm:py-20 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            What This Program Is
          </h2>
          <p className="text-[#A4ACB8] text-lg mb-8 leading-relaxed">
            {data.whatItIs.summary}
          </p>
          <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
              This program is for athletes who
            </h3>
            <ul className="space-y-3">
              {data.whatItIs.forWho.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C1121F] shrink-0 mt-0.5" />
                  <span className="text-[#E6E9EF]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      
      {/* Common Mistakes */}
      <section className="py-16 sm:py-20 bg-[#0A0A0A] border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Common Mistakes
          </h2>
          <p className="text-[#6B7280] mb-8">
            Most athletes make these errors when training for this goal.
          </p>
          <div className="grid gap-4">
            {data.mistakes.map((mistake, i) => (
              <div 
                key={i}
                className="flex items-start gap-4 bg-[#1A1F26] border border-[#2B313A] rounded-lg p-5"
              >
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF] mb-1">{mistake.title}</h3>
                  <p className="text-sm text-[#A4ACB8]">{mistake.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How To Train Properly */}
      <section className="py-16 sm:py-20 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            How To Train Properly
          </h2>
          <p className="text-[#6B7280] mb-8">
            Structured approach to maximize progress while protecting joints.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[#C1121F]" />
                <h3 className="font-semibold text-sm">Frequency</h3>
              </div>
              <p className="text-[#A4ACB8] text-sm">{data.howToTrain.frequency}</p>
            </div>
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm">Intensity</h3>
              </div>
              <p className="text-[#A4ACB8] text-sm">{data.howToTrain.intensity}</p>
            </div>
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">Progression</h3>
              </div>
              <p className="text-[#A4ACB8] text-sm">{data.howToTrain.progression}</p>
            </div>
            <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm">Recovery</h3>
              </div>
              <p className="text-[#A4ACB8] text-sm">{data.howToTrain.recovery}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How SpartanLab Does It */}
      <section className="py-16 sm:py-20 bg-[#0A0A0A] border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              How <span className="text-[#C1121F]">SpartanLab</span> Builds This
            </h2>
            <p className="text-[#6B7280] max-w-xl mx-auto">
              SpartanLab analyzes your performance and builds adaptive programming using real training methodologies.
            </p>
          </div>
          <div className="grid gap-4">
            {data.spartanlabApproach.map((item, i) => (
              <div 
                key={i}
                className="flex items-start gap-4 bg-[#1A1F26] border border-[#2B313A] rounded-lg p-5"
              >
                <div className="w-8 h-8 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#C1121F]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#E6E9EF] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#A4ACB8]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link 
              href="/training-systems" 
              className="text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors inline-flex items-center gap-1"
            >
              Learn more about our training systems
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 sm:py-28 border-t border-[#2B313A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {data.ctaText}
          </h2>
          <p className="text-[#A4ACB8] max-w-xl mx-auto mb-8">
            Get structured programming that evolves with your performance. Free to start.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] px-10 h-12">
              Build Your Program
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-[#6B7280] mt-4">
            Built from real training methodologies. No credit card required.
          </p>
        </div>
      </section>
      
      {/* Related Programs */}
      {data.relatedPrograms.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#0A0A0A] border-t border-[#2B313A]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold mb-6">Related Programs</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {data.relatedPrograms.map((program, i) => (
                <Link
                  key={i}
                  href={program.href}
                  className="bg-[#1A1F26] border border-[#2B313A] rounded-lg p-4 hover:border-[#C1121F]/30 transition-colors group"
                >
                  <h3 className="font-semibold text-[#E6E9EF] mb-1 group-hover:text-[#C1121F] transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-xs text-[#6B7280]">{program.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      
      <MarketingFooter />
    </div>
  )
}
