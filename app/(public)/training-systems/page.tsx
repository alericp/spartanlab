import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import {
  Target,
  Dumbbell,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Training Systems - How SpartanLab Builds Your Program',
  description: 'Understand the training methodologies behind SpartanLab: calisthenics skill progression, weighted strength integration, powerlifting principles, and hypertrophy support. Built from real training systems.',
  keywords: [
    'calisthenics training system',
    'hybrid strength training',
    'streetlifting program',
    'weighted calisthenics training',
    'bodyweight strength training',
    'calisthenics programming',
    'deadlift calisthenics',
    'muscle up training program',
  ],
  openGraph: {
    title: 'Training Systems - How SpartanLab Builds Your Program',
    description: 'The training methodologies behind SpartanLab: calisthenics intelligence, hybrid strength, and structured progression.',
    type: 'website',
  },
}

const TRAINING_SYSTEMS = [
  {
    id: 'calisthenics',
    icon: Target,
    title: 'Calisthenics System',
    badge: 'Primary',
    badgeColor: 'bg-[#C1121F]/10 text-[#C1121F] border-[#C1121F]/30',
    description: 'Your training is built around skill progression, not just strength.',
    principles: [
      'Leverage and body position mastery before load',
      'Tendon and joint adaptation timelines respected',
      'Skill prerequisites enforced before advancement',
      'Straight-arm and bent-arm strength balanced',
    ],
    detail: 'Front lever, planche, muscle-up, and HSPU require specific strength ratios and joint preparation. SpartanLab tracks component readiness and builds programs that develop the right foundations.',
  },
  {
    id: 'hybrid',
    icon: Dumbbell,
    title: 'Hybrid Strength System',
    badge: 'Integrated',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Weighted strength is integrated without compromising skill performance.',
    principles: [
      'Weighted pull-ups and dips for strength carryover',
      'Load progression tied to skill readiness',
      'Frequency balanced with skill volume',
      'Streetlifting methodology for max strength',
    ],
    detail: 'Weighted calisthenics builds raw strength that transfers to skills. SpartanLab integrates weighted work at the right frequency and intensity to enhance performance without creating fatigue interference.',
  },
  {
    id: 'strength',
    icon: TrendingUp,
    title: 'Strength System',
    badge: 'Supportive',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'Barbell strength is used selectively to improve force production while preserving recovery.',
    principles: [
      'Deadlift as primary posterior chain developer',
      'Intensity management via RPE and percentage',
      'Strategic placement to avoid skill interference',
      'Periodization aligned with calisthenics goals',
    ],
    detail: 'Powerlifting principles inform how SpartanLab manages intensity and fatigue. Deadlift and squat variations support hip extension and leg drive needed for explosive skills.',
  },
  {
    id: 'hypertrophy',
    icon: Shield,
    title: 'Hypertrophy Support',
    badge: 'Optional',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Muscle is built where it improves performance and reduces injury risk.',
    principles: [
      'Volume targeted at weak points identified by constraints',
      'Joint-safe exercises that support skill positions',
      'Rear delt, rotator cuff, and scapular stability focus',
      'Accumulation phases timed with recovery capacity',
    ],
    detail: 'Hypertrophy work in SpartanLab is not aesthetics-first. It builds tissue in areas that protect joints and improve strength expression in skill positions.',
  },
]

export default function TrainingSystemsPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E6E9EF]">
      <MarketingHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-[#C1121F] mb-4 tracking-wide uppercase">
            Training Intelligence
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-balance">
            How Your Training Is Built
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl mx-auto leading-relaxed">
            SpartanLab combines four training systems into one adaptive program. 
            Calisthenics leads. Everything else supports.
          </p>
        </div>
      </section>

      {/* Training Systems */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-6">
            {TRAINING_SYSTEMS.map((system) => {
              const Icon = system.icon
              return (
                <div 
                  key={system.id}
                  className="bg-[#1A1F26]/50 border border-[#2B313A] rounded-xl p-6 sm:p-8"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-lg ${system.badgeColor.split(' ')[0]} border ${system.badgeColor.split(' ')[2]} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${system.badgeColor.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg sm:text-xl font-semibold text-[#E6E9EF]">
                          {system.title}
                        </h2>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${system.badgeColor}`}>
                          {system.badge}
                        </span>
                      </div>
                      <p className="text-[#A4ACB8] text-sm sm:text-base">
                        {system.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pl-0 sm:pl-14">
                    <ul className="space-y-2 mb-4">
                      {system.principles.map((principle, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                          <CheckCircle2 className="w-4 h-4 text-[#4B5563] shrink-0 mt-0.5" />
                          <span>{principle}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      {system.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-[#C1121F]/5 to-[#1A1F26] border border-[#C1121F]/20 rounded-xl p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[#E6E9EF] mb-3">
              One Adaptive System
            </h3>
            <p className="text-[#A4ACB8] max-w-xl mx-auto mb-6">
              These systems work together based on your goals, equipment, and performance data. 
              SpartanLab handles the integration so you can focus on training.
            </p>
            <Link href="/onboarding">
              <Button size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A] px-8 h-12">
                Build Your Program
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <div className="mt-4">
              <Link 
                href="/training" 
                className="text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors inline-flex items-center gap-1"
              >
                Browse training programs
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
