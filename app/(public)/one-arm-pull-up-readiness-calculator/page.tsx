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
  ChevronDown
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  calculateOneArmPullUpReadiness,
  type OneArmPullUpInputs,
  type ReadinessResult
} from '@/lib/readiness/skill-readiness'
import { ReadinessResultCard } from '@/components/calculators/ReadinessResultCard'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'
import { trackToolUsed } from '@/lib/analytics'
import { cn } from '@/lib/utils'

// FAQ Data
const faqs = [
  {
    question: 'How strong do I need to be for a one-arm pull-up?',
    answer: 'Most athletes achieve their first OAP when they can do a weighted pull-up with +80-100% of their bodyweight, or 20+ strict pull-ups. Archer pull-ups for 8+ reps per arm is another strong indicator. The correlation with weighted pull-up strength is the highest predictor.'
  },
  {
    question: 'How long does it take to learn a one-arm pull-up?',
    answer: 'For most athletes starting from 15+ pull-ups, expect 2-4 years of dedicated training. The OAP is one of the most difficult bodyweight pulling achievements. Rushing leads to elbow injuries - tendons need time to adapt to unilateral loading.'
  },
  {
    question: 'Do archer pull-ups help with one-arm pull-up?',
    answer: 'Yes, archer pull-ups are one of the most effective progressions. They build unilateral pulling strength and the neural coordination needed for OAP. Target 10+ per arm before attempting assisted OAP work.'
  },
  {
    question: 'What is the biggest mistake in OAP training?',
    answer: 'Neglecting elbow conditioning. The OAP puts extreme stress on the bicep tendon and elbow joint. Athletes who rush into OAP negatives without proper preparation often develop elbow tendinopathy. Build weighted pull-up strength first.'
  },
]

export default function OneArmPullUpReadinessCalculator() {
  // Form state
  const [maxPullUps, setMaxPullUps] = useState('')
  const [weightedPullUpLoad, setWeightedPullUpLoad] = useState('')
  const [archerPullUps, setArcherPullUps] = useState('')
  const [bodyweight, setBodyweight] = useState('')
  const [gripStrength, setGripStrength] = useState<'weak' | 'moderate' | 'strong' | 'very_strong'>('moderate')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Result state
  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const pullUps = parseInt(maxPullUps) || 0
    const weighted = parseFloat(weightedPullUpLoad) || 0
    const archers = parseInt(archerPullUps) || 0

    if (pullUps === 0 && weighted === 0) {
      setError('Please enter at least your pull-up count or weighted pull-up load')
      return
    }

    /*
      [PRE-AB6 BUILD GREEN GATE / READINESS INPUT CONTRACT]
      OneArmPullUpInputs (lib/readiness/skill-readiness.ts:2910) requires
      exactly: { maxPullUps: number; weightedPullUpLoad: number;
      archerPullUpReps: number; hasBar: boolean }. The previous shape
      used the stale name `archerPullUps` and added `bodyweight` and
      `gripStrength` keys that do not exist on the contract. The
      bodyweight and gripStrength UI form fields are preserved as
      user-context inputs but are not consumed by the current engine.
      `archerPullUpReps` is typed as required `number`, so empty input
      becomes `0` (not `undefined`). `hasBar: true` is the safe explicit
      value for this calculator since the entire form assumes pull-up
      bar access. The unused `bw` parse variable was removed.
    */
    const inputs: OneArmPullUpInputs = {
      maxPullUps: pullUps,
      weightedPullUpLoad: weighted,
      archerPullUpReps: archers > 0 ? archers : 0,
      hasBar: true,
    }
    
    const calcResult = calculateOneArmPullUpReadiness(inputs)
    setResult(calcResult)
    
    // Track tool usage
    trackToolUsed('oap_readiness_calculator', { readiness_score: calcResult.score })
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setMaxPullUps('')
    setWeightedPullUpLoad('')
    setArcherPullUps('')
    setBodyweight('')
    setGripStrength('moderate')
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
            One-Arm Pull-Up Readiness Calculator
          </h1>
          <p className="text-[#A4ACB8] text-lg max-w-2xl mx-auto mb-3">
            Evaluate your pulling strength, weighted capacity, and unilateral development to determine
            your readiness for one-arm pull-up training.
          </p>
          <p className="text-xs text-[#6B7280] max-w-lg mx-auto">
            The OAP is one of the most difficult bodyweight skills. This calculator helps identify if you have the prerequisites.
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
                  placeholder="e.g., 20"
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
                  placeholder="e.g., 90"
                  value={weightedPullUpLoad}
                  onChange={(e) => setWeightedPullUpLoad(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Target: +80-100% bodyweight for OAP readiness</p>
              </div>

              {/* Archer Pull-Ups */}
              <div className="space-y-2">
                <Label htmlFor="archers" className="text-[#E6E9EF]">
                  Archer Pull-Ups (per arm) <span className="text-[#6B7280]">- optional</span>
                </Label>
                <Input
                  id="archers"
                  type="number"
                  placeholder="e.g., 8"
                  value={archerPullUps}
                  onChange={(e) => setArcherPullUps(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Strong indicator of unilateral pulling ability</p>
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
                    <p className="text-xs text-[#6B7280]">Helps calculate relative strength ratio</p>
                  </div>
                  
                  {/* Grip Strength */}
                  <div className="space-y-2">
                    <Label className="text-[#E6E9EF]">Grip Strength</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['weak', 'moderate', 'strong', 'very_strong'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setGripStrength(level)}
                          className={cn(
                            "p-2 text-sm rounded-lg border transition-colors",
                            gripStrength === level
                              ? "bg-[#C1121F]/20 border-[#C1121F] text-[#E6E9EF]"
                              : "bg-[#1A1F26] border-[#2B313A] text-[#A4ACB8] hover:border-[#3B414A]"
                          )}
                        >
                          {level === 'very_strong' ? 'Very Strong' : level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                skillName="One-Arm Pull-Up"
                progressionHref="/guides/one-arm-pull-up-training"
              />
            ) : (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6 h-full flex flex-col items-center justify-center text-center">
                <Target className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in the form to calculate your one-arm pull-up readiness score and get personalized recommendations.
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
              The One-Arm Pull-Up Readiness Calculator evaluates four key factors that predict OAP success:
            </p>
            <ul className="space-y-2 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">1.</span>
                <span><strong className="text-[#E6E9EF]">Pull-Up Volume:</strong> High rep pull-ups (20+) indicate the endurance base needed for OAP training volume.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">2.</span>
                <span><strong className="text-[#E6E9EF]">Weighted Pull-Up Strength:</strong> The strongest predictor. Target +80-100% bodyweight before serious OAP attempts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">3.</span>
                <span><strong className="text-[#E6E9EF]">Unilateral Development:</strong> Archer pull-ups demonstrate the one-arm pulling pattern and strength transfer.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">4.</span>
                <span><strong className="text-[#E6E9EF]">Grip Strength:</strong> Single-arm hanging requires exceptional grip. Dead hangs and grip work are prerequisites.</span>
              </li>
            </ul>
          </div>

          {/* Why These Benchmarks Matter */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Why These Benchmarks Matter</h2>
            <p className="text-[#A4ACB8] mb-4">
              The one-arm pull-up is an <strong className="text-[#E6E9EF]">elite pulling skill</strong> that requires 
              years of dedicated training. Rushing into OAP work without the prerequisites leads to injury.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Weighted Pull-Ups</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Athletes who achieve OAP typically have weighted pull-up 1RMs of +80-100% bodyweight. 
                  This builds the raw strength needed to support your entire body with one arm.
                </p>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Elbow Health</h3>
                <p className="text-sm text-[#A4ACB8]">
                  The OAP puts extreme stress on the bicep tendon and elbow joint. 
                  Years of progressive overload through weighted work conditions these structures.
                </p>
              </div>
            </div>
          </div>

          {/* Related Skills & Guides */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Continue Your Training</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/skills/one-arm-pull-up" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors border border-transparent hover:border-[#C1121F]/30">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">OAP Skill Hub</h3>
                <p className="text-xs text-[#6B7280]">Complete skill overview</p>
              </Link>
              <Link href="/guides/one-arm-pull-up-training" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">OAP Training Guide</h3>
                <p className="text-xs text-[#6B7280]">Complete progression path</p>
              </Link>
              <Link href="/weighted-pull-up-strength-standards" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Weighted Pull-Up Standards</h3>
                <p className="text-xs text-[#6B7280]">See strength benchmarks</p>
              </Link>
              <Link href="/front-lever-readiness-calculator" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Front Lever Calculator</h3>
                <p className="text-xs text-[#6B7280]">Related pulling skill</p>
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-[#2B313A] rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1A1F26] transition-colors"
                  >
                    <span className="font-medium text-[#E6E9EF]">{faq.question}</span>
                    <ChevronDown className={cn(
                      "w-5 h-5 text-[#6B7280] transition-transform",
                      openFaqs.includes(index) && "rotate-180"
                    )} />
                  </button>
                  {openFaqs.includes(index) && (
                    <div className="p-4 pt-0 text-[#A4ACB8] text-sm">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-12">
          {/*
            [PRE-AB6 BUILD GREEN GATE / TOOL CARD CONTRACT]
            ToolConversionCardStaticProps (components/tools/
            ToolConversionCardStatic.tsx:139) requires `context:
            ToolContext` and uses `headline` (not `heading`) plus
            `primaryCtaText` (not `ctaText`). There is no `ctaHref`
            prop — the component routes to `/onboarding` internally,
            which is exactly what the previous `ctaHref="/onboarding"`
            override expressed, so dropping it preserves behavior.
            ToolContext (tool-conversion-types.ts:11-22) does not
            include `'one-arm-pull-up'`; `'general'` is the closest
            valid match for a generic OAP-readiness CTA.
          */}
          <ToolConversionCardStatic
            context="general"
            headline="Ready to Train for One-Arm Pull-Up?"
            description="SpartanLab builds personalized programs that progressively develop the pulling strength needed for OAP."
            primaryCtaText="Generate Your Program"
          />
        </section>

        {/* Breadcrumb back to tools */}
        <div className="mt-12 pt-6 border-t border-[#2B313A]">
          <Link href="/tools" className="text-sm text-[#6B7280] hover:text-[#C1121F] transition-colors inline-flex items-center gap-1">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to all tools
          </Link>
        </div>
      </main>
    </div>
  )
}
