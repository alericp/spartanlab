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
  calculatePlancheReadiness,
  type PlancheInputs,
  type ReadinessResult
} from '@/lib/readiness/skill-readiness'
import { ReadinessResultCard } from '@/components/calculators/ReadinessResultCard'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'
import { trackToolUsed } from '@/lib/analytics'
import { cn } from '@/lib/utils'

// FAQ Data
const faqs = [
  {
    question: 'How long does it take to learn a planche?',
    answer: 'A full planche typically takes 2-5 years of dedicated training. Tuck planche can be achieved in 1-2 years for most athletes. The progression from tuck to straddle is often the longest phase. Body weight, limb length, and training consistency significantly affect timeline.'
  },
  {
    question: 'Do push-ups help planche training?',
    answer: 'Standard push-ups have limited carryover to planche. Pseudo planche push-ups (PPPU) with significant forward lean are much more effective as they train the specific shoulder angle. Planche leans are the most direct preparation exercise.'
  },
  {
    question: 'Is planche harder than front lever?',
    answer: 'Yes, for most athletes planche is significantly harder. The straight-arm pushing strength required takes much longer to develop than pulling strength. Most coaches estimate planche takes 2-4x longer than front lever to achieve.'
  },
  {
    question: 'Can I train planche as a beginner?',
    answer: 'You can start planche lean work once you have 20+ push-ups and 10+ dips. Focus on wrist conditioning first - planche puts extreme stress on the wrists. Start with modest leans (20-30 degrees) and progress slowly.'
  },
]

export default function PlancheReadinessCalculator() {
  // Form state
  const [maxPushUps, setMaxPushUps] = useState('')
  const [maxDips, setMaxDips] = useState('')
  const [weightedDipLoad, setWeightedDipLoad] = useState('')
  const [plancheLeanHold, setPlancheLeanHold] = useState('')
  const [wallHandstandHold, setWallHandstandHold] = useState('')
  const [lSitHoldTime, setLSitHoldTime] = useState('')
  const [bodyweight, setBodyweight] = useState('')
  const [shoulderMobility, setShoulderMobility] = useState<'poor' | 'moderate' | 'good' | 'excellent'>('moderate')
  const [hasParallettes, setHasParallettes] = useState(false)
  const [hasFloor, setHasFloor] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Result state
  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const pushUps = parseInt(maxPushUps) || 0
    const dips = parseInt(maxDips) || 0
    const lean = parseInt(plancheLeanHold) || 0
    const hs = parseInt(wallHandstandHold) || 0
    
    if (pushUps === 0 && dips === 0 && lean === 0) {
      setError('Please enter at least your push-up count, dip count, or lean hold time')
      return
    }
    
    const inputs: PlancheInputs = {
      maxPushUps: pushUps,
      maxDips: dips,
      plancheLeanHold: lean,
      wallHandstandHold: hs > 0 ? hs : undefined,
      shoulderMobilityConfidence: shoulderMobility,
      hasParallettes,
      hasFloor,
    }
    
    const calcResult = calculatePlancheReadiness(inputs)
    setResult(calcResult)
    
    // Track tool usage
    // [PRE-AB6 BUILD GREEN GATE / READINESS RESULT CONTRACT]
    // ReadinessResult exposes `score`, not `readinessScore`. Preserve the
    // analytics payload key `readiness_score` (existing event schema)
    // and source the value from the authoritative `calcResult.score`.
    trackToolUsed('planche_calculator', { readiness_score: calcResult.score })
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setMaxPushUps('')
    setMaxDips('')
    setWeightedDipLoad('')
    setPlancheLeanHold('')
    setWallHandstandHold('')
    setLSitHoldTime('')
    setBodyweight('')
    setShoulderMobility('moderate')
    setHasParallettes(false)
    setHasFloor(true)
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
            Planche Readiness Calculator
          </h1>
          <p className="text-[#A4ACB8] text-lg max-w-2xl mx-auto mb-3">
            Evaluate your pushing strength, shoulder conditioning, and lean tolerance to determine
            your readiness for planche progressions.
          </p>
          <p className="text-xs text-[#6B7280] max-w-lg mx-auto">
            Built from structured calisthenics readiness principles used to evaluate real planche progress.
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
              {/* Push-Ups */}
              <div className="space-y-2">
                <Label htmlFor="pushups" className="text-[#E6E9EF] flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#C1121F]" />
                  Max Push-Ups
                </Label>
                <Input
                  id="pushups"
                  type="number"
                  placeholder="e.g., 30"
                  value={maxPushUps}
                  onChange={(e) => setMaxPushUps(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
              </div>

              {/* Dips */}
              <div className="space-y-2">
                <Label htmlFor="dips" className="text-[#E6E9EF] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C1121F]" />
                  Max Dips
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

              {/* Weighted Dip (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="weightedDip" className="text-[#E6E9EF]">
                  Weighted Dip Load (lbs added) <span className="text-[#6B7280]">- optional</span>
                </Label>
                <Input
                  id="weightedDip"
                  type="number"
                  placeholder="e.g., 45"
                  value={weightedDipLoad}
                  onChange={(e) => setWeightedDipLoad(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Enter 0 if you don't train weighted</p>
              </div>

              {/* Planche Lean */}
              <div className="space-y-2">
                <Label htmlFor="lean" className="text-[#E6E9EF]">
                  Planche Lean Hold (seconds)
                </Label>
                <Input
                  id="lean"
                  type="number"
                  placeholder="e.g., 30"
                  value={plancheLeanHold}
                  onChange={(e) => setPlancheLeanHold(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Max hold with shoulders past wrists</p>
              </div>

              {/* Wall Handstand (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="handstand" className="text-[#E6E9EF]">
                  Wall Handstand Hold (seconds) <span className="text-[#6B7280]">- optional</span>
                </Label>
                <Input
                  id="handstand"
                  type="number"
                  placeholder="e.g., 45"
                  value={wallHandstandHold}
                  onChange={(e) => setWallHandstandHold(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
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
                <p className="text-xs text-[#6B7280]">Indicates core compression and body tension</p>
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
                    <p className="text-xs text-[#6B7280]">Lighter bodyweight generally favors planche progression</p>
                  </div>
                </div>
              )}

              {/* Shoulder Mobility */}
              <div className="space-y-2">
                <Label className="text-[#E6E9EF]">Shoulder Mobility Confidence</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['poor', 'moderate', 'good', 'excellent'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setShoulderMobility(level)}
                      className={cn(
                        "p-2 text-sm rounded-lg border transition-colors",
                        shoulderMobility === level
                          ? "bg-[#C1121F]/20 border-[#C1121F] text-[#E6E9EF]"
                          : "bg-[#1A1F26] border-[#2B313A] text-[#A4ACB8] hover:border-[#3B414A]"
                      )}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-3">
                <Label className="text-[#E6E9EF]">Equipment Available</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasFloor}
                      onChange={(e) => setHasFloor(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2B313A] bg-[#1A1F26] text-[#C1121F]"
                    />
                    <span className="text-sm text-[#A4ACB8]">Floor Space</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasParallettes}
                      onChange={(e) => setHasParallettes(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2B313A] bg-[#1A1F26] text-[#C1121F]"
                    />
                    <span className="text-sm text-[#A4ACB8]">Parallettes</span>
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
                skillName="Planche"
                progressionHref="/planche-progression"
              />
            ) : (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6 h-full flex flex-col items-center justify-center text-center">
                <Target className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in the form to calculate your planche readiness score and get personalized recommendations.
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
              The Planche Readiness Calculator evaluates five key factors that predict planche success:
            </p>
            <ul className="space-y-2 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">1.</span>
                <span><strong className="text-[#E6E9EF]">Push-Up Endurance:</strong> General pushing work capacity and tricep development.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">2.</span>
                <span><strong className="text-[#E6E9EF]">Dip Strength:</strong> Vertical pushing power correlates strongly with planche - weighted dips especially.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">3.</span>
                <span><strong className="text-[#E6E9EF]">Planche Lean Tolerance:</strong> The most specific indicator - how long can you hold a deep forward lean?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">4.</span>
                <span><strong className="text-[#E6E9EF]">Overhead Stability:</strong> Handstand hold ability indicates shoulder strength and body awareness.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">5.</span>
                <span><strong className="text-[#E6E9EF]">Shoulder Mobility:</strong> Adequate shoulder extension is required for safe lean depth.</span>
              </li>
            </ul>
          </div>

          {/* Why These Benchmarks Matter */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Why These Benchmarks Matter</h2>
            <p className="text-[#A4ACB8] mb-4">
              The planche is an <strong className="text-[#E6E9EF]">extreme straight-arm pushing skill</strong> that 
              demands specialized shoulder strength most athletes do not develop through normal training.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Planche Leans</h3>
                <p className="text-sm text-[#A4ACB8]">
                  The planche lean is your primary indicator. If you cannot hold a 45+ second lean with shoulders 
                  significantly past your wrists, tuck planche will be out of reach.
                </p>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Wrist Conditioning</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Planche puts extreme pressure on wrists. Parallettes reduce this but do not eliminate it. 
                  Never skip wrist warmups and conditioning.
                </p>
              </div>
            </div>
          </div>

          {/* Related Skills & Guides */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Continue Your Training</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/planche-progression" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Planche Progression</h3>
                <p className="text-xs text-[#6B7280]">Complete progression guide</p>
              </Link>
              <Link href="/calisthenics-strength-standards" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">Push-up and dip benchmarks</p>
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

        {/* Conversion CTA */}
        <section className="mt-12">
          <ToolConversionCardStatic
            context="planche"
            toolData={result ? {
              maxPushUps: maxPushUps ? parseInt(maxPushUps) : undefined,
              maxDips: maxDips ? parseInt(maxDips) : undefined,
              weightedDip: weightedDipLoad ? parseFloat(weightedDipLoad) : undefined,
              plancheLeanHold: plancheLeanHold ? parseInt(plancheLeanHold) : undefined,
              lSitHold: lSitHoldTime ? parseInt(lSitHoldTime) : undefined,
              // [PRE-AB6 BUILD GREEN GATE / READINESS RESULT CONTRACT]
              // ReadinessResult exposes `score`, `level`, and a single
              // `limitingFactor: string` (not `readinessScore`,
              // `classification`, or `limitingFactors[]`). The
              // ToolDataPayload keys are correct; only the *source*
              // fields needed contract realignment.
              readinessScore: result.score,
              classification: result.level,
              limitingFactors: result.limitingFactor ? [result.limitingFactor] : [],
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
