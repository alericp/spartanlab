'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { 
  Calculator, 
  RefreshCw,
  ChevronRight,
  Target,
  Dumbbell,
  HelpCircle,
  ChevronDown
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  calculateMuscleUpReadiness,
  type MuscleUpInputs,
  type ReadinessResult
} from '@/lib/readiness/skill-readiness'
import { ReadinessResultCard } from '@/components/calculators/ReadinessResultCard'
import { cn } from '@/lib/utils'

// FAQ Data
const faqs = [
  {
    question: 'How many pull-ups do I need for a muscle-up?',
    answer: 'Most athletes need 10-12 strict pull-ups as a baseline. However, muscle-ups also require explosive pulling power and chest-to-bar ability. Athletes with 15+ pull-ups who can pull chest-to-bar have a much higher success rate than those with 20 pull-ups but no explosive capability.'
  },
  {
    question: 'Am I strong enough for a muscle-up?',
    answer: 'Strength requirements: 10-12 strict pull-ups, 8-10 chest-to-bar pull-ups, 10-15 straight bar dips, and the ability to do explosive/high pulls. If you can do explosive pull-ups where your chest clears the bar, you likely have the strength - technique is your next focus.'
  },
  {
    question: 'What is the hardest part of the muscle-up?',
    answer: 'The transition (moving from below the bar to above it) is the most technically challenging part. Many athletes have the raw strength but struggle with the transition timing and body position. Transition drills and negatives help develop this skill.'
  },
  {
    question: 'Should I learn kipping or strict muscle-ups first?',
    answer: 'This depends on your goals. Strict muscle-ups build more strength but require higher baseline strength. Kipping muscle-ups are more accessible but can mask strength deficits. For strength athletes, starting with strict progressions (even if using bands) is recommended.'
  },
]

export default function MuscleUpReadinessCalculator() {
  // Form state
  const [maxPullUps, setMaxPullUps] = useState('')
  const [maxDips, setMaxDips] = useState('')
  const [chestToBarReps, setChestToBarReps] = useState('')
  const [hasExplosivePulls, setHasExplosivePulls] = useState(false)
  const [hasBar, setHasBar] = useState(true)
  const [hasBands, setHasBands] = useState(false)
  
  // Result state
  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const pullUps = parseInt(maxPullUps) || 0
    const dips = parseInt(maxDips) || 0
    const ctb = parseInt(chestToBarReps) || 0
    
    if (pullUps === 0 && dips === 0) {
      setError('Please enter at least your pull-up or dip count')
      return
    }
    
    const inputs: MuscleUpInputs = {
      maxPullUps: pullUps,
      maxDips: dips,
      chestToBarReps: ctb,
      hasExplosivePulls,
      hasBar,
      hasBands,
    }
    
    const calcResult = calculateMuscleUpReadiness(inputs)
    setResult(calcResult)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setMaxPullUps('')
    setMaxDips('')
    setChestToBarReps('')
    setHasExplosivePulls(false)
    setHasBar(true)
    setHasBands(false)
  }

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0C0F]">
      {/* Header */}
      <header className="border-b border-[#2B313A] bg-[#0F1115]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SpartanIcon className="w-8 h-8 text-[#C1121F]" />
            <span className="text-xl font-bold text-[#E6E9EF]">SpartanLab</span>
          </Link>
          <Link href="/onboarding">
            <Button variant="outline" size="sm" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
              Start Training
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#E6E9EF] mb-4">
            Muscle-Up Readiness Calculator
          </h1>
          <p className="text-[#A4ACB8] text-lg max-w-2xl mx-auto">
            Evaluate your pulling strength, dip power, and explosive capability to determine
            your readiness for muscle-up training.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calculator Card */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-[#C1121F]" />
              <h2 className="text-lg font-semibold text-[#E6E9EF]">Enter Your Stats</h2>
            </div>

            <div className="space-y-5">
              {/* Pull-Ups */}
              <div className="space-y-2">
                <Label htmlFor="pullups" className="text-[#E6E9EF] flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#C1121F]" />
                  Max Strict Pull-Ups
                </Label>
                <Input
                  id="pullups"
                  type="number"
                  placeholder="e.g., 12"
                  value={maxPullUps}
                  onChange={(e) => setMaxPullUps(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
              </div>

              {/* Dips */}
              <div className="space-y-2">
                <Label htmlFor="dips" className="text-[#E6E9EF] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C1121F]" />
                  Max Dips (straight bar or parallel)
                </Label>
                <Input
                  id="dips"
                  type="number"
                  placeholder="e.g., 15"
                  value={maxDips}
                  onChange={(e) => setMaxDips(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
              </div>

              {/* Chest-to-Bar */}
              <div className="space-y-2">
                <Label htmlFor="ctb" className="text-[#E6E9EF]">
                  Chest-to-Bar Pull-Up Reps
                </Label>
                <Input
                  id="ctb"
                  type="number"
                  placeholder="e.g., 6"
                  value={chestToBarReps}
                  onChange={(e) => setChestToBarReps(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Enter 0 if you cannot do chest-to-bar</p>
              </div>

              {/* Explosive Pulls */}
              <div className="space-y-3">
                <Label className="text-[#E6E9EF]">Can you do explosive/high pulls?</Label>
                <p className="text-xs text-[#6B7280]">Pull-ups where your chest or belly button clears the bar</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setHasExplosivePulls(true)}
                    className={cn(
                      "flex-1 p-3 text-sm rounded-lg border transition-colors",
                      hasExplosivePulls
                        ? "bg-[#C1121F]/20 border-[#C1121F] text-[#E6E9EF]"
                        : "bg-[#1A1F26] border-[#2B313A] text-[#A4ACB8] hover:border-[#3B414A]"
                    )}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHasExplosivePulls(false)}
                    className={cn(
                      "flex-1 p-3 text-sm rounded-lg border transition-colors",
                      !hasExplosivePulls
                        ? "bg-[#C1121F]/20 border-[#C1121F] text-[#E6E9EF]"
                        : "bg-[#1A1F26] border-[#2B313A] text-[#A4ACB8] hover:border-[#3B414A]"
                    )}
                  >
                    No / Not Sure
                  </button>
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-3">
                <Label className="text-[#E6E9EF]">Equipment Available</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasBar}
                      onChange={(e) => setHasBar(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2B313A] bg-[#1A1F26] text-[#C1121F]"
                    />
                    <span className="text-sm text-[#A4ACB8]">Pull-Up Bar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasBands}
                      onChange={(e) => setHasBands(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2B313A] bg-[#1A1F26] text-[#C1121F]"
                    />
                    <span className="text-sm text-[#A4ACB8]">Resistance Bands</span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleCalculate}
                  className="flex-1 bg-[#C1121F] hover:bg-[#A50E1A] text-white"
                >
                  Calculate Readiness
                </Button>
                {result && (
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Result Card */}
          <div>
            {result ? (
              <ReadinessResultCard
                result={result}
                skillName="Muscle-Up"
                progressionHref="/guides/muscle-up-training"
              />
            ) : (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6 h-full flex flex-col items-center justify-center text-center">
                <Target className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in the form to calculate your muscle-up readiness score and get personalized recommendations.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* SEO Content Section */}
        <section className="mt-16 space-y-12">
          {/* What This Calculator Measures */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">What This Calculator Measures</h2>
            <p className="text-[#A4ACB8] mb-4">
              The Muscle-Up Readiness Calculator evaluates five key factors that predict muscle-up success:
            </p>
            <ul className="space-y-2 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">1.</span>
                <span><strong className="text-[#E6E9EF]">Pull-Up Strength:</strong> Foundation pulling power - you need at least 10-12 strict reps.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">2.</span>
                <span><strong className="text-[#E6E9EF]">Dip Strength:</strong> Often overlooked - weak dips mean you cannot finish the movement.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">3.</span>
                <span><strong className="text-[#E6E9EF]">Chest-to-Bar Ability:</strong> Proves you can generate enough height to clear the bar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">4.</span>
                <span><strong className="text-[#E6E9EF]">Explosive Power:</strong> The muscle-up requires speed - slow pulls will not clear the bar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">5.</span>
                <span><strong className="text-[#E6E9EF]">Equipment Access:</strong> Bands help learn the movement pattern safely.</span>
              </li>
            </ul>
          </div>

          {/* Why These Benchmarks Matter */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Why These Benchmarks Matter</h2>
            <p className="text-[#A4ACB8] mb-4">
              The muscle-up combines <strong className="text-[#E6E9EF]">explosive pulling</strong> with a 
              <strong className="text-[#E6E9EF]"> transition</strong> and <strong className="text-[#E6E9EF]">dip press-out</strong>. 
              All three phases must be strong.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Chest-to-Bar is Critical</h3>
                <p className="text-sm text-[#A4ACB8]">
                  If you cannot pull your chest to the bar, you cannot generate enough height for the transition. 
                  This is the most common limiting factor.
                </p>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Do Not Skip Dips</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Many athletes focus only on pulling. Without 10-15 straight bar dips, you will get stuck 
                  at the top of the transition, unable to press out.
                </p>
              </div>
            </div>
          </div>

          {/* Related Skills & Guides */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Continue Your Training</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/guides/muscle-up-training" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Muscle-Up Guide</h3>
                <p className="text-xs text-[#6B7280]">Complete training guide</p>
              </Link>
              <Link href="/calisthenics-strength-standards" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">Pull-up and dip benchmarks</p>
              </Link>
              <Link href="/front-lever-readiness-calculator" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Front Lever Readiness</h3>
                <p className="text-xs text-[#6B7280]">Test your pulling readiness</p>
              </Link>
              <Link href="/calisthenics-program-builder" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Program Builder</h3>
                <p className="text-xs text-[#6B7280]">Build your training plan</p>
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-6 h-6 text-[#C1121F]" />
              <h2 className="text-xl font-bold text-[#E6E9EF]">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-[#2A2A2A] rounded-xl overflow-hidden bg-[#0F1115]">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-[#1A1A1A] transition-colors"
                  >
                    <span className="font-medium text-[#E6E9EF] pr-4">{faq.question}</span>
                    <ChevronDown 
                      className={cn(
                        "w-5 h-5 text-[#A5A5A5] shrink-0 transition-transform duration-200",
                        openFaqs.includes(index) && "rotate-180"
                      )} 
                    />
                  </button>
                  <div 
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      openFaqs.includes(index) ? "max-h-96" : "max-h-0"
                    )}
                  >
                    <div className="p-5 pt-0 text-[#A5A5A5] text-sm leading-relaxed border-t border-[#2A2A2A]">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="mt-12 bg-gradient-to-br from-[#C1121F]/10 to-[#C1121F]/5 border border-[#C1121F]/20 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">
            Ready to Train for Muscle-Up?
          </h2>
          <p className="text-[#A4ACB8] mb-4 max-w-md mx-auto">
            SpartanLab generates adaptive programs that build the explosive pulling strength and transition power you need for muscle-ups.
          </p>
          <Link href="/onboarding">
            <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white px-6">
              Build Your Muscle-Up Program
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <p className="text-xs text-[#6B7280] mt-2">Free to start. No credit card required.</p>
        </section>

        {/* Back to Tools */}
        <div className="mt-8 text-center">
          <Link href="/tools">
            <Button variant="outline" className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]">
              View All Tools
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
