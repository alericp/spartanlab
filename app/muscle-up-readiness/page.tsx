import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

// Prevent static prerendering to avoid auth issues during build
export const dynamic = 'force-dynamic'
import { SeoHero } from '@/components/seo/SeoHero'
import { RelatedFeatureCTA } from '@/components/seo/RelatedFeatureCTA'
import { Dumbbell, CheckCircle2, XCircle, ArrowRight, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Muscle-Up Readiness Checklist | SpartanLab',
  description: 'Are you ready for the muscle-up? Check your pulling strength, explosive power, and transition readiness with this practical assessment guide.',
}

const readinessChecklist = [
  {
    category: 'Pulling Strength',
    items: [
      { text: 'Can do 10+ strict pull-ups', essential: true },
      { text: 'Weighted pull-up at +25 lbs or more', essential: true },
      { text: 'Can do 5+ chest-to-bar pull-ups', essential: true },
      { text: 'High pull-ups (pulling to sternum)', essential: false },
    ],
  },
  {
    category: 'Explosive Power',
    items: [
      { text: 'Explosive pull-ups with visible height above bar', essential: true },
      { text: 'Can perform kipping swings with control', essential: false },
      { text: 'Straight arm pulling strength (front lever progression)', essential: false },
    ],
  },
  {
    category: 'Dip Strength',
    items: [
      { text: 'Can do 15+ strict dips', essential: true },
      { text: 'Deep dips below parallel with control', essential: true },
      { text: 'Weighted dips at +25 lbs or more', essential: false },
    ],
  },
  {
    category: 'Transition',
    items: [
      { text: 'Comfortable with false grip on rings or bar', essential: false },
      { text: 'Can perform negative muscle-ups with control', essential: false },
      { text: 'Banded muscle-up attempts showing transition understanding', essential: false },
    ],
  },
]

export default function MuscleUpReadinessPage() {
  return (
    <SeoPageLayout>
      <SeoHero
        title="Are You Ready for the Muscle-Up?"
        subtitle="The muscle-up requires specific pulling strength, explosive power, and transition technique. Use this checklist to assess your readiness and identify gaps."
        ctaText="Track Your Strength"
        ctaHref="/strength"
        secondaryCtaText="Build a Program"
        secondaryCtaHref="/programs"
      />

      {/* Quick Assessment */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 sm:p-8 mb-8">
            <h2 className="text-xl font-bold mb-4">Quick Strength Benchmarks</h2>
            <p className="text-[#A5A5A5] mb-6">
              Most athletes who achieve their first muscle-up meet these minimum thresholds:
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A]">
                <div className="text-2xl font-bold text-[#E63946] mb-1">+25-45 lbs</div>
                <div className="text-sm text-[#A5A5A5]">Weighted Pull-Up</div>
              </div>
              <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A]">
                <div className="text-2xl font-bold text-[#E63946] mb-1">+25-45 lbs</div>
                <div className="text-sm text-[#A5A5A5]">Weighted Dip</div>
              </div>
              <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A]">
                <div className="text-2xl font-bold text-[#E63946] mb-1">10+</div>
                <div className="text-sm text-[#A5A5A5]">Strict Pull-Ups</div>
              </div>
              <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A]">
                <div className="text-2xl font-bold text-[#E63946] mb-1">15+</div>
                <div className="text-sm text-[#A5A5A5]">Strict Dips</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Checklist */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Full Readiness Checklist</h2>
          <p className="text-[#A5A5A5] mb-8">
            Essential items should be checked off before serious muscle-up attempts. Other items accelerate progress.
          </p>
          <div className="space-y-8">
            {readinessChecklist.map((section) => (
              <div key={section.category}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#E63946]" />
                  {section.category}
                </h3>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={item.text}
                      className="flex items-center gap-3 p-4 bg-[#121212] rounded-lg border border-[#2A2A2A]"
                    >
                      {item.essential ? (
                        <CheckCircle2 className="w-5 h-5 text-[#E63946] flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#3A3A3A] flex-shrink-0" />
                      )}
                      <span className={item.essential ? 'text-white' : 'text-[#A5A5A5]'}>
                        {item.text}
                      </span>
                      {item.essential && (
                        <span className="ml-auto text-xs text-[#E63946] bg-[#E63946]/10 px-2 py-0.5 rounded">
                          Essential
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator CTA */}
      <section className="py-8 px-4 sm:px-6 bg-[#C1121F]/10 border-y border-[#C1121F]/20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#E6E9EF]">Get Your Personalized Score</h2>
            <p className="text-sm text-[#A5A5A5]">Use our interactive calculator for a detailed readiness assessment.</p>
          </div>
          <Link href="/muscle-up-readiness-calculator">
            <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
              Muscle-Up Readiness Calculator
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Training Recommendations */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">How to Build Toward Your First Muscle-Up</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Build Weighted Strength</h3>
              <p className="text-sm text-[#A5A5A5]">
                Progressive weighted pull-ups and dips are the fastest path to muscle-up strength. Aim to add weight consistently.
              </p>
            </div>
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Train Explosively</h3>
              <p className="text-sm text-[#A5A5A5]">
                High pulls and explosive pull-ups build the power needed to clear the bar during the transition.
              </p>
            </div>
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Practice the Transition</h3>
              <p className="text-sm text-[#A5A5A5]">
                Negative muscle-ups and banded attempts teach your body the movement pattern.
              </p>
            </div>
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Track Your Progress</h3>
              <p className="text-sm text-[#A5A5A5]">
                Logging strength numbers helps you know when you're approaching readiness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Feature CTA */}
      <RelatedFeatureCTA
        icon={Target}
        title="Track Your Muscle-Up Progress"
        description="Log your weighted pull-up and dip strength, track skill progression, and get projected timelines to your first muscle-up."
        ctaText="Open Strength Tracker"
        ctaHref="/strength"
      />

      {/* Internal Links */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/weighted-pull-up-calculator">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Pull-Up Calculator
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/calisthenics-program-builder">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Program Builder
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
