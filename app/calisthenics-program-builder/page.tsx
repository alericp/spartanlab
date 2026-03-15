import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { SeoHero } from '@/components/seo/SeoHero'
import { RelatedFeatureCTA } from '@/components/seo/RelatedFeatureCTA'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateBreadcrumbSchema, SITE_CONFIG } from '@/lib/seo'
import { Calendar, Target, Dumbbell, Activity, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Calisthenics Program Builder | SpartanLab',
  description: 'Build structured calisthenics training programs. Balance skill work, weighted strength, and recovery for consistent progress.',
  keywords: ['calisthenics program', 'workout builder', 'training program', 'bodyweight workout', 'workout generator', 'calisthenics routine'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/calisthenics-program-builder`,
  },
  openGraph: {
    title: 'Calisthenics Program Builder | SpartanLab',
    description: 'Build structured calisthenics training programs with skill work, weighted strength, and smart recovery planning.',
    url: `${SITE_CONFIG.url}/calisthenics-program-builder`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calisthenics Program Builder | SpartanLab',
    description: 'Build structured calisthenics training programs for consistent progress.',
  },
}

const programComponents = [
  {
    icon: Target,
    title: 'Skill Training',
    description: 'Dedicated time for practicing skill progressions like planche, front lever, and muscle-up.',
  },
  {
    icon: Dumbbell,
    title: 'Weighted Strength',
    description: 'Progressive overload through weighted pull-ups, dips, and other foundational movements.',
  },
  {
    icon: Activity,
    title: 'Volume Management',
    description: 'Balancing training stimulus with recovery to avoid burnout and maximize adaptation.',
  },
  {
    icon: Calendar,
    title: 'Frequency Planning',
    description: 'Structuring weekly training days to allow adequate recovery between sessions.',
  },
]

const exampleWeek = [
  { day: 'Monday', focus: 'Push Skills + Weighted Dips', type: 'skill' },
  { day: 'Tuesday', focus: 'Pull Strength + Front Lever', type: 'strength' },
  { day: 'Wednesday', focus: 'Rest / Mobility', type: 'rest' },
  { day: 'Thursday', focus: 'Weighted Pull-Ups + Rows', type: 'strength' },
  { day: 'Friday', focus: 'Planche Work + Handstand', type: 'skill' },
  { day: 'Saturday', focus: 'Full Body + Muscle-Up Practice', type: 'mixed' },
  { day: 'Sunday', focus: 'Rest', type: 'rest' },
]

const typeColors = {
  skill: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20',
  strength: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  rest: 'bg-[#2A2A2A] text-[#A5A5A5] border-[#3A3A3A]',
  mixed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function CalisthenicsProgramBuilderPage() {
  return (
    <SeoPageLayout>
      <SeoHero
        title="Build Your Calisthenics Training Program"
        subtitle="Structure your training for consistent progress. Balance skill practice, weighted strength, and recovery in one organized system."
        ctaText="Open Program Builder"
        ctaHref="/programs"
        secondaryCtaText="View Features"
        secondaryCtaHref="/features"
      />

      {/* What Makes a Good Program */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">What a Good Calisthenics Program Includes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {programComponents.map((component) => (
              <div key={component.title} className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <div className="w-10 h-10 rounded-lg bg-[#E63946]/10 flex items-center justify-center mb-4">
                  <component.icon className="w-5 h-5 text-[#E63946]" />
                </div>
                <h3 className="font-semibold mb-2">{component.title}</h3>
                <p className="text-sm text-[#A5A5A5]">{component.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Week Structure */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Example Training Week</h2>
          <p className="text-[#A5A5A5] mb-8">
            A balanced week mixing skill work, weighted strength, and adequate recovery.
          </p>
          <div className="bg-[#121212] rounded-xl border border-[#2A2A2A] overflow-hidden">
            {exampleWeek.map((day, index) => (
              <div
                key={day.day}
                className={`flex items-center justify-between p-4 ${
                  index !== exampleWeek.length - 1 ? 'border-b border-[#2A2A2A]' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium w-24 text-[#A5A5A5]">{day.day}</span>
                  <span className="font-medium">{day.focus}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${typeColors[day.type as keyof typeof typeColors]}`}>
                  {day.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Principles */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Program Building Principles</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <CheckCircle2 className="w-5 h-5 text-[#E63946] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Prioritize Skills Early</h3>
                <p className="text-sm text-[#A5A5A5]">
                  Practice high-skill movements when fresh. Place planche, front lever, or muscle-up work at the start of sessions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <CheckCircle2 className="w-5 h-5 text-[#E63946] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Progressive Overload</h3>
                <p className="text-sm text-[#A5A5A5]">
                  Add weight, reps, or hold time systematically. Small consistent increases beat random training.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <CheckCircle2 className="w-5 h-5 text-[#E63946] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Balance Push and Pull</h3>
                <p className="text-sm text-[#A5A5A5]">
                  Maintain roughly equal pushing and pulling volume to prevent imbalances and protect shoulder health.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <CheckCircle2 className="w-5 h-5 text-[#E63946] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Schedule Recovery</h3>
                <p className="text-sm text-[#A5A5A5]">
                  Rest days are part of the program, not gaps. Plan them intentionally for optimal adaptation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <CheckCircle2 className="w-5 h-5 text-[#E63946] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Track Everything</h3>
                <p className="text-sm text-[#A5A5A5]">
                  Logging workouts reveals what works. Without data, programming adjustments are guesswork.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Use a Builder */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Why Use a Program Builder?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-5 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Structure Over Randomness</h3>
              <p className="text-sm text-[#A5A5A5]">
                Random workouts rarely lead to specific goals. Structured programs create predictable progress paths.
              </p>
            </div>
            <div className="p-5 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Volume Visibility</h3>
              <p className="text-sm text-[#A5A5A5]">
                See your weekly training load at a glance. Identify if you're undertraining or overreaching.
              </p>
            </div>
            <div className="p-5 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Progress Integration</h3>
              <p className="text-sm text-[#A5A5A5]">
                Link your program to skill and strength tracking. See how training translates to actual gains.
              </p>
            </div>
            <div className="p-5 bg-[#121212] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Accountability</h3>
              <p className="text-sm text-[#A5A5A5]">
                A written program creates commitment. You know what to do each day without decision fatigue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Feature CTA */}
      <RelatedFeatureCTA
        icon={Calendar}
        title="Build Your Program in SpartanLab"
        description="Create multi-week training blocks, schedule skill and strength days, and connect your program to workout logging and progress tracking."
        ctaText="Open Program Builder"
        ctaHref="/programs"
      />

      {/* Internal Links */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/planche-progression">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Planche Progression
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/front-lever-progression">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Front Lever Guide
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                See Pricing
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
