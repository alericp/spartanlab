'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'
import { RelatedFeatureCTA } from '@/components/seo/RelatedFeatureCTA'
import { Dumbbell, Calculator, ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function WeightedPullUpCalculatorPage() {
  const [bodyweight, setBodyweight] = useState('')
  const [addedWeight, setAddedWeight] = useState('')
  const [reps, setReps] = useState('')
  const [result, setResult] = useState<{ estimated1RM: number; totalWeight: number; relativeStrength: number } | null>(null)

  const calculate = () => {
    const bw = parseFloat(bodyweight)
    const added = parseFloat(addedWeight)
    const r = parseInt(reps)

    if (isNaN(bw) || isNaN(added) || isNaN(r) || r < 1) {
      return
    }

    const totalWeight = bw + added
    // Brzycki formula for 1RM estimation
    const estimated1RM = r === 1 ? totalWeight : totalWeight * (36 / (37 - r))
    const relativeStrength = ((estimated1RM - bw) / bw) * 100

    setResult({
      estimated1RM: Math.round(estimated1RM * 10) / 10,
      totalWeight,
      relativeStrength: Math.round(relativeStrength),
    })
  }

  const getStrengthLevel = (relativeStrength: number) => {
    if (relativeStrength >= 100) return { level: 'Elite', color: 'text-[#E63946]' }
    if (relativeStrength >= 70) return { level: 'Advanced', color: 'text-orange-400' }
    if (relativeStrength >= 40) return { level: 'Intermediate', color: 'text-yellow-400' }
    if (relativeStrength >= 20) return { level: 'Developing', color: 'text-green-400' }
    return { level: 'Beginner', color: 'text-[#A5A5A5]' }
  }

  return (
    <SeoPageLayout>
      {/* Hero */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E63946]/10 rounded-full text-sm text-[#E63946] mb-6">
            <Calculator className="w-4 h-4" />
            Free Tool
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-6">
            Weighted Pull-Up Calculator
          </h1>
          <p className="text-lg sm:text-xl text-[#A5A5A5] max-w-2xl mx-auto text-pretty">
            Estimate your one-rep max and relative pulling strength. See where you stand and what to aim for next.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#E63946]" />
              Calculate Your 1RM
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Bodyweight (lbs)</label>
                <Input
                  type="number"
                  placeholder="e.g. 175"
                  value={bodyweight}
                  onChange={(e) => setBodyweight(e.target.value)}
                  className="bg-[#121212] border-[#2A2A2A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Added Weight (lbs)</label>
                <Input
                  type="number"
                  placeholder="e.g. 45"
                  value={addedWeight}
                  onChange={(e) => setAddedWeight(e.target.value)}
                  className="bg-[#121212] border-[#2A2A2A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reps Completed</label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  min="1"
                  max="12"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="bg-[#121212] border-[#2A2A2A]"
                />
              </div>
            </div>

            <Button 
              onClick={calculate}
              className="w-full bg-[#E63946] hover:bg-[#D62828]"
            >
              Calculate Estimated 1RM
            </Button>

            {result && (
              <div className="mt-6 p-4 bg-[#121212] rounded-lg border border-[#2A2A2A]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-[#A5A5A5] mb-1">Estimated 1RM</div>
                    <div className="text-2xl font-bold">{result.estimated1RM} lbs</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#A5A5A5] mb-1">Added Weight 1RM</div>
                    <div className="text-2xl font-bold text-[#E63946]">
                      +{Math.round(result.estimated1RM - parseFloat(bodyweight))} lbs
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                  <div className="text-sm text-[#A5A5A5] mb-1">Relative Strength</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">+{result.relativeStrength}% BW</span>
                    <span className={`text-sm ${getStrengthLevel(result.relativeStrength).color}`}>
                      ({getStrengthLevel(result.relativeStrength).level})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 text-sm text-[#A5A5A5]">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Uses the Brzycki formula for estimation. Most accurate with 1-10 rep sets. For tracking over time, use SpartanLab's Strength Tracker.
            </p>
          </div>
        </div>
      </section>

      {/* Strength Standards */}
      <section className="py-12 px-4 sm:px-6 bg-[#1A1A1A]/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Weighted Pull-Up Strength Standards</h2>
          <p className="text-[#A5A5A5] mb-8">
            General benchmarks for relative pulling strength (added weight as percentage of bodyweight).
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A] text-center">
              <div className="text-sm text-[#A5A5A5] mb-1">Beginner</div>
              <div className="text-xl font-bold">+0-20%</div>
            </div>
            <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A] text-center">
              <div className="text-sm text-green-400 mb-1">Developing</div>
              <div className="text-xl font-bold">+20-40%</div>
            </div>
            <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A] text-center">
              <div className="text-sm text-yellow-400 mb-1">Intermediate</div>
              <div className="text-xl font-bold">+40-70%</div>
            </div>
            <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A] text-center">
              <div className="text-sm text-orange-400 mb-1">Advanced</div>
              <div className="text-xl font-bold">+70-100%</div>
            </div>
            <div className="p-4 bg-[#121212] rounded-lg border border-[#2A2A2A] text-center">
              <div className="text-sm text-[#E63946] mb-1">Elite</div>
              <div className="text-xl font-bold">+100%+</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Track */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Why Track Weighted Pull-Up Strength?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Predict Skill Readiness</h3>
              <p className="text-sm text-[#A5A5A5]">
                Weighted pull-up strength correlates strongly with front lever, muscle-up, and one-arm pull-up progress.
              </p>
            </div>
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Measure Real Progress</h3>
              <p className="text-sm text-[#A5A5A5]">
                Adding weight is more measurable than "feeling stronger." Track 1RM over time to see actual gains.
              </p>
            </div>
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Set Clear Goals</h3>
              <p className="text-sm text-[#A5A5A5]">
                Knowing your current 1RM lets you set specific targets. "+50 lbs" is more actionable than "get stronger."
              </p>
            </div>
            <div className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
              <h3 className="font-semibold mb-2">Identify Plateaus</h3>
              <p className="text-sm text-[#A5A5A5]">
                Historical tracking reveals when progress stalls, signaling when to adjust programming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Feature CTA */}
      <RelatedFeatureCTA
        icon={Dumbbell}
        title="Track Your Strength Over Time"
        description="SpartanLab logs your weighted pull-up, dip, and muscle-up PRs. See progress trends and forecast future milestones."
        ctaText="Open Strength Tracker"
        ctaHref="/strength"
      />

      {/* Internal Links */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/muscle-up-readiness">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Muscle-Up Readiness
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/front-lever-progression">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Front Lever Guide
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" className="border-[#3A3A3A] hover:bg-[#2A2A2A] gap-2">
                Platform Features
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
