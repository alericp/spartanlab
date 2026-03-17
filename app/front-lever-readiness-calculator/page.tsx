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
  calculateFrontLeverReadiness,
  type FrontLeverInputs,
  type ReadinessResult
} from '@/lib/readiness/skill-readiness'
import { spartanScoreFromFrontLeverInputs, type SpartanStrengthResult } from '@/lib/strength/spartan-strength-score'
import { ReadinessResultCard } from '@/components/calculators/ReadinessResultCard'
import { SpartanScoreCard } from '@/components/athlete/SpartanScoreCard'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'
import { trackToolUsed } from '@/lib/analytics'
import { cn } from '@/lib/utils'

// FAQ Data
const faqs = [
  {
    question: 'How many pull-ups do I need for front lever?',
    answer: 'Most athletes achieve their first tuck front lever with 8-12 strict pull-ups. However, for advanced progressions (straddle/full), you typically need 15-20 pull-ups AND weighted pull-ups with +50lb or more. Raw pull-up numbers alone are insufficient - weighted pulling strength is a stronger predictor.'
  },
  {
    question: 'Why does weighted pull-up matter so much?',
    answer: 'Weighted pull-ups build the specific strength needed to hold your body horizontal against gravity. The correlation between weighted pull-up strength (+50-70lb) and front lever achievement is very strong. Many athletes with high pull-up numbers but no weighted work struggle with front lever.'
  },
  {
    question: 'Can I train front lever as a beginner?',
    answer: 'You can start tuck front lever once you have 8+ strict pull-ups and a 30+ second hollow hold. The tuck variation is accessible and builds specific strength. However, rushing to harder progressions without the foundation leads to slow progress and potential injury.'
  },
  {
    question: 'How accurate is this calculator?',
    answer: 'This calculator uses rule-based thresholds derived from common training benchmarks. It provides a useful estimate but individual factors like body composition, limb length, and training history affect actual readiness. Use it as a guide, not a definitive answer.'
  },
]

export default function FrontLeverReadinessCalculator() {
  // Form state
  const [maxPullUps, setMaxPullUps] = useState('')
  const [weightedPullUpLoad, setWeightedPullUpLoad] = useState('')
  const [hollowHoldTime, setHollowHoldTime] = useState('')
  const [tuckFrontLeverHold, setTuckFrontLeverHold] = useState('')
  const [lSitHoldTime, setLSitHoldTime] = useState('')
  const [bodyweight, setBodyweight] = useState('')
  const [hasRings, setHasRings] = useState(false)
  const [hasBar, setHasBar] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Result state
  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [spartanScore, setSpartanScore] = useState<SpartanStrengthResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const pullUps = parseInt(maxPullUps) || 0
    const weighted = parseFloat(weightedPullUpLoad) || 0
    const hollow = parseInt(hollowHoldTime) || 0
    const tuck = parseInt(tuckFrontLeverHold) || 0
    
    if (pullUps === 0 && weighted === 0 && hollow === 0) {
      setError('Please enter at least your pull-up count or hollow hold time')
      return
    }
    
    const inputs: FrontLeverInputs = {
      maxPullUps: pullUps,
      weightedPullUpLoad: weighted,
      hollowHoldTime: hollow,
      tuckFrontLeverHold: tuck > 0 ? tuck : undefined,
      hasRings,
      hasBar,
    }
    
    const calcResult = calculateFrontLeverReadiness(inputs)
    setResult(calcResult)
    
    // Track tool usage
    trackToolUsed('front_lever_calculator', { readiness_score: calcResult.readinessScore })
    
    // Calculate Spartan Strength Score
    const spartanResult = spartanScoreFromFrontLeverInputs({
      maxPullUps: pullUps,
      weightedPullUpLoad: weighted,
      hollowHoldTime: hollow,
      tuckFrontLeverHold: tuck > 0 ? tuck : undefined,
    })
    setSpartanScore(spartanResult)
  }

  const handleReset = () => {
    setResult(null)
    setSpartanScore(null)
    setError(null)
    setMaxPullUps('')
    setWeightedPullUpLoad('')
    setHollowHoldTime('')
    setTuckFrontLeverHold('')
    setLSitHoldTime('')
    setBodyweight('')
    setHasRings(false)
    setHasBar(true)
    setShowAdvanced(false)
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
            Front Lever Readiness Calculator
          </h1>
          <p className="text-[#A4ACB8] text-lg max-w-2xl mx-auto mb-3">
            Evaluate your pulling strength, core tension, and skill experience to determine
            your readiness for front lever progressions.
          </p>
          <p className="text-xs text-[#6B7280] max-w-lg mx-auto">
            Built from structured calisthenics readiness principles used to evaluate real front lever progress.
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

              {/* Weighted Pull-Up */}
              <div className="space-y-2">
                <Label htmlFor="weighted" className="text-[#E6E9EF] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C1121F]" />
                  Weighted Pull-Up Load (lbs added)
                </Label>
                <Input
                  id="weighted"
                  type="number"
                  placeholder="e.g., 45"
                  value={weightedPullUpLoad}
                  onChange={(e) => setWeightedPullUpLoad(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Enter 0 if you don't train weighted</p>
              </div>

              {/* Hollow Hold */}
              <div className="space-y-2">
                <Label htmlFor="hollow" className="text-[#E6E9EF]">
                  Hollow Hold Time (seconds)
                </Label>
                <Input
                  id="hollow"
                  type="number"
                  placeholder="e.g., 45"
                  value={hollowHoldTime}
                  onChange={(e) => setHollowHoldTime(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
              </div>

              {/* Tuck Front Lever (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="tuck" className="text-[#E6E9EF]">
                  Tuck Front Lever Hold (seconds) <span className="text-[#6B7280]">- optional</span>
                </Label>
                <Input
                  id="tuck"
                  type="number"
                  placeholder="e.g., 15"
                  value={tuckFrontLeverHold}
                  onChange={(e) => setTuckFrontLeverHold(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Leave blank if you cannot hold a tuck</p>
              </div>

              {/* L-Sit Hold Time (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="lsit" className="text-[#E6E9EF]">
                  L-Sit Hold (seconds) <span className="text-[#6B7280]">- optional</span>
                </Label>
                <Input
                  id="lsit"
                  type="number"
                  placeholder="e.g., 20"
                  value={lSitHoldTime}
                  onChange={(e) => setLSitHoldTime(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Indicates core compression strength</p>
              </div>

              {/* Advanced Options Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-[#C1121F] hover:text-[#A50E1A] flex items-center gap-1 mt-2"
              >
                {showAdvanced ? 'Hide' : 'Show'} advanced options
                <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
              </button>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-[#2B313A]">
                  <div className="space-y-2">
                    <Label htmlFor="bodyweight" className="text-[#E6E9EF]">
                      Bodyweight (lbs) <span className="text-[#6B7280]">- optional</span>
                    </Label>
                    <Input
                      id="bodyweight"
                      type="number"
                      placeholder="e.g., 165"
                      value={bodyweight}
                      onChange={(e) => setBodyweight(e.target.value)}
                      className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                    />
                    <p className="text-xs text-[#6B7280]">Helps contextualize weighted pull-up strength</p>
                  </div>
                </div>
              )}

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
                      checked={hasRings}
                      onChange={(e) => setHasRings(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2B313A] bg-[#1A1F26] text-[#C1121F]"
                    />
                    <span className="text-sm text-[#A4ACB8]">Gymnastics Rings</span>
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
                skillName="Front Lever"
                progressionHref="/front-lever-progression"
              />
            ) : (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6 h-full flex flex-col items-center justify-center text-center">
                <Target className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in the form to calculate your front lever readiness score and get personalized recommendations.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Spartan Strength Score Section */}
        {spartanScore && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4 text-center">Your Spartan Strength Score</h2>
            <div className="max-w-md mx-auto">
              <SpartanScoreCard result={spartanScore} />
            </div>
          </section>
        )}

        {/* SEO Content Section */}
        <section className="mt-16 space-y-12">
          {/* What This Calculator Measures */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">What This Calculator Measures</h2>
            <p className="text-[#A4ACB8] mb-4">
              The Front Lever Readiness Calculator evaluates five key factors that predict front lever success:
            </p>
            <ul className="space-y-2 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">1.</span>
                <span><strong className="text-[#E6E9EF]">Pull-Up Strength:</strong> Raw pulling volume indicates base lat and bicep development.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">2.</span>
                <span><strong className="text-[#E6E9EF]">Weighted Pull-Up Load:</strong> Heavy weighted pulls correlate strongly with front lever - more than high rep pull-ups.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">3.</span>
                <span><strong className="text-[#E6E9EF]">Core Compression:</strong> Hollow hold ability demonstrates the core tension pattern essential for horizontal holds.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">4.</span>
                <span><strong className="text-[#E6E9EF]">Specific Skill Experience:</strong> Existing tuck front lever holds prove specific strength adaptation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">5.</span>
                <span><strong className="text-[#E6E9EF]">Equipment Access:</strong> Rings and bars enable different progression paths.</span>
              </li>
            </ul>
          </div>

          {/* Why These Benchmarks Matter */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Why These Benchmarks Matter</h2>
            <p className="text-[#A4ACB8] mb-4">
              The front lever is primarily a <strong className="text-[#E6E9EF]">pulling strength skill</strong>, not just 
              a core exercise. Many athletes fail because they underestimate the pulling strength required.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Weighted Pull-Ups</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Athletes with +50lb weighted pull-ups achieve advanced tuck significantly faster than those with only 
                  high-rep bodyweight pull-ups. Loading matters.
                </p>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Core Tension</h3>
                <p className="text-sm text-[#A4ACB8]">
                  The hollow body position is not optional. Without 45+ second hollow holds, maintaining 
                  the rigid body line required for front lever is nearly impossible.
                </p>
              </div>
            </div>
          </div>

          {/* Front Lever Resources - Hub Links */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Front Lever Resources</h2>
            <p className="text-[#6B7280] text-sm mb-4">Everything you need to master the front lever</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/skills/front-lever" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors border border-transparent hover:border-[#C1121F]/30">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Front Lever Hub</h3>
                <p className="text-xs text-[#6B7280]">Complete skill overview</p>
              </Link>
              <Link href="/front-lever-progression" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Progression Guide</h3>
                <p className="text-xs text-[#6B7280]">Tuck to full front lever</p>
              </Link>
              <Link href="/guides/front-lever-training" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Training Guide</h3>
                <p className="text-xs text-[#6B7280]">How to train effectively</p>
              </Link>
              <Link href="/programs/front-lever-program" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Training Program</h3>
                <p className="text-xs text-[#6B7280]">12-24 week structured plan</p>
              </Link>
            </div>
          </div>

          {/* Related Calculators & Standards */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Related Tools</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/planche-readiness-calculator" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Planche Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your pushing readiness</p>
              </Link>
              <Link href="/muscle-up-readiness-calculator" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Muscle Up Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your transition strength</p>
              </Link>
              <Link href="/calisthenics-strength-standards" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">Pull-up and dip benchmarks</p>
              </Link>
              <Link href="/onboarding" className="p-4 bg-[#C1121F]/10 rounded-lg hover:bg-[#C1121F]/20 transition-colors border border-[#C1121F]/30">
                <h3 className="font-semibold text-[#C1121F] text-sm mb-1">Generate Program</h3>
                <p className="text-xs text-[#A4ACB8]">Personalized training plan</p>
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

        {/* Conversion CTA */}
        <section className="mt-12">
          <ToolConversionCardStatic
            context="front-lever"
            toolData={result ? {
              maxPullUps: maxPullUps ? parseInt(maxPullUps) : undefined,
              weightedPullUp: weightedPullUpLoad ? parseFloat(weightedPullUpLoad) : undefined,
              hollowHold: hollowHoldTime ? parseInt(hollowHoldTime) : undefined,
              tuckFrontLeverHold: tuckFrontLeverHold ? parseInt(tuckFrontLeverHold) : undefined,
              readinessScore: result.readinessScore,
              classification: result.classification,
              limitingFactors: result.limitingFactors.map(lf => lf.factor),
            } : undefined}
          />
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
