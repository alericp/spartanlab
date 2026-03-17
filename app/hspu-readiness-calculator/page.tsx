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
  calculateHSPUReadiness,
  type HSPUInputs,
  type ReadinessResult
} from '@/lib/readiness/skill-readiness'
import { ReadinessResultCard } from '@/components/calculators/ReadinessResultCard'
import { ToolConversionCard } from '@/components/tools/ToolConversionCard'
import { trackToolUsed } from '@/lib/analytics'
import { cn } from '@/lib/utils'

import type { Metadata } from 'next'

// FAQ Data
const faqs = [
  {
    question: 'How many pike push-ups do I need for wall HSPU?',
    answer: 'Most athletes need 8-12 elevated pike push-ups (feet on a box or bench) before attempting wall HSPUs. The pike push-up with elevated feet closely mimics the vertical pressing angle of the HSPU, making it an excellent prerequisite test.'
  },
  {
    question: 'Is HSPU easier on parallettes or floor?',
    answer: 'Parallettes are generally easier because they allow greater range of motion for the shoulders and reduce wrist strain. Floor HSPUs require more shoulder mobility. Start on parallettes if wrist flexibility is a limiting factor.'
  },
  {
    question: 'How long to learn a freestanding HSPU?',
    answer: 'With solid wall HSPU ability (5+ reps) and decent freestanding handstand balance (15+ seconds), most athletes achieve their first freestanding HSPU within 2-4 months. Without these prerequisites, expect 6-12 months of foundation building.'
  },
  {
    question: 'Do I need a good handstand for HSPU?',
    answer: 'For wall HSPUs, you need comfort being inverted but not freestanding balance. For freestanding HSPUs, yes - you need at least 15-20 seconds of consistent freestanding balance. Many athletes train wall HSPUs while developing their freestanding handstand separately.'
  },
]

export default function HSPUReadinessCalculator() {
  // Form state
  const [wallHSPUReps, setWallHSPUReps] = useState('')
  const [pikeHSPUReps, setPikeHSPUReps] = useState('')
  const [maxDips, setMaxDips] = useState('')
  const [wallHandstandHold, setWallHandstandHold] = useState('')
  const [overheadPressStrength, setOverheadPressStrength] = useState<'none' | 'light' | 'moderate' | 'strong'>('light')
  const [hasWall, setHasWall] = useState(true)
  const [hasParallettes, setHasParallettes] = useState(false)
  
  // Result state
  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const wallHSPU = parseInt(wallHSPUReps) || 0
    const pike = parseInt(pikeHSPUReps) || 0
    const dips = parseInt(maxDips) || 0
    const hsHold = parseInt(wallHandstandHold) || 0
    
    if (pike === 0 && dips === 0 && hsHold === 0) {
      setError('Please enter at least your pike push-up count, dip count, or handstand hold time')
      return
    }
    
    const inputs: HSPUInputs = {
      wallHSPUReps: wallHSPU,
      pikeHSPUReps: pike,
      maxDips: dips,
      wallHandstandHold: hsHold,
      overheadPressStrength,
      hasWall,
      hasParallettes,
    }
    
  const calcResult = calculateHSPUReadiness(inputs)
  setResult(calcResult)
  
  // Track tool usage
  trackToolUsed('hspu_readiness_calculator', { readiness_score: calcResult.readinessScore })
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setWallHSPUReps('')
    setPikeHSPUReps('')
    setMaxDips('')
    setWallHandstandHold('')
    setOverheadPressStrength('light')
    setHasWall(true)
    setHasParallettes(false)
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
            Handstand Push-Up Readiness Calculator
          </h1>
          <p className="text-[#A4ACB8] text-lg max-w-2xl mx-auto">
            Evaluate your vertical pressing strength, handstand stability, and overhead mobility to determine
            your readiness for HSPU progressions.
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
              {/* Wall HSPU Reps */}
              <div className="space-y-2">
                <Label htmlFor="wallhspu" className="text-[#E6E9EF] flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#C1121F]" />
                  Wall HSPU Reps <span className="text-[#6B7280] text-xs">(face to wall)</span>
                </Label>
                <Input
                  id="wallhspu"
                  type="number"
                  placeholder="e.g., 5"
                  value={wallHSPUReps}
                  onChange={(e) => setWallHSPUReps(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Enter 0 if you cannot do wall HSPUs yet</p>
              </div>

              {/* Pike Push-Ups */}
              <div className="space-y-2">
                <Label htmlFor="pike" className="text-[#E6E9EF] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C1121F]" />
                  Elevated Pike Push-Up Reps
                </Label>
                <Input
                  id="pike"
                  type="number"
                  placeholder="e.g., 10"
                  value={pikeHSPUReps}
                  onChange={(e) => setPikeHSPUReps(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Feet elevated on box or bench</p>
              </div>

              {/* Dips */}
              <div className="space-y-2">
                <Label htmlFor="dips" className="text-[#E6E9EF]">
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

              {/* Wall Handstand Hold */}
              <div className="space-y-2">
                <Label htmlFor="hshold" className="text-[#E6E9EF]">
                  Wall Handstand Hold (seconds)
                </Label>
                <Input
                  id="hshold"
                  type="number"
                  placeholder="e.g., 45"
                  value={wallHandstandHold}
                  onChange={(e) => setWallHandstandHold(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
              </div>

              {/* Overhead Press Strength */}
              <div className="space-y-3">
                <Label className="text-[#E6E9EF]">Overhead Press Strength</Label>
                <p className="text-xs text-[#6B7280]">Relative to your bodyweight (barbell or dumbbell)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['none', 'light', 'moderate', 'strong'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setOverheadPressStrength(level)}
                      className={cn(
                        "p-3 text-sm rounded-lg border transition-colors",
                        overheadPressStrength === level
                          ? "bg-[#C1121F]/20 border-[#C1121F] text-[#E6E9EF]"
                          : "bg-[#1A1F26] border-[#2B313A] text-[#A4ACB8] hover:border-[#3B414A]"
                      )}
                    >
                      {level === 'none' && 'None'}
                      {level === 'light' && 'Light (<0.3x BW)'}
                      {level === 'moderate' && 'Moderate (0.3-0.5x)'}
                      {level === 'strong' && 'Strong (>0.5x BW)'}
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
                      checked={hasWall}
                      onChange={(e) => setHasWall(e.target.checked)}
                      className="w-4 h-4 rounded border-[#2B313A] bg-[#1A1F26] text-[#C1121F]"
                    />
                    <span className="text-sm text-[#A4ACB8]">Wall Space</span>
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
                skillName="Handstand Push-Up"
                progressionHref="/guides/handstand-push-up-progression"
              />
            ) : (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6 h-full flex flex-col items-center justify-center text-center">
                <Target className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in the form to calculate your HSPU readiness score and get personalized recommendations.
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
              The HSPU Readiness Calculator evaluates five key factors that predict handstand push-up success:
            </p>
            <ul className="space-y-2 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">1.</span>
                <span><strong className="text-[#E6E9EF]">Wall HSPU Ability:</strong> The most direct indicator - if you can already do wall HSPUs, you are on the path.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">2.</span>
                <span><strong className="text-[#E6E9EF]">Pike Push-Up Strength:</strong> The best prerequisite exercise - elevated pike push-ups mimic the pressing angle.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">3.</span>
                <span><strong className="text-[#E6E9EF]">Dip Strength:</strong> General vertical pressing capacity that supports HSPU development.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">4.</span>
                <span><strong className="text-[#E6E9EF]">Handstand Hold:</strong> Comfort inverted is essential - you need stability before adding the press.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">5.</span>
                <span><strong className="text-[#E6E9EF]">Overhead Press Strength:</strong> General shoulder pressing capacity transfers to HSPU ability.</span>
              </li>
            </ul>
          </div>

          {/* Key Benchmarks */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">HSPU Progression Benchmarks</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-yellow-400 mb-2">Foundation</h3>
                <ul className="text-sm text-[#A4ACB8] space-y-1">
                  <li>8+ pike push-ups</li>
                  <li>10+ dips</li>
                  <li>15s wall handstand</li>
                </ul>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-green-400 mb-2">Wall HSPU Ready</h3>
                <ul className="text-sm text-[#A4ACB8] space-y-1">
                  <li>12+ elevated pike PU</li>
                  <li>15+ dips</li>
                  <li>30s wall handstand</li>
                </ul>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-emerald-400 mb-2">Freestanding Path</h3>
                <ul className="text-sm text-[#A4ACB8] space-y-1">
                  <li>7+ wall HSPUs</li>
                  <li>20+ dips</li>
                  <li>45s+ handstand hold</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Mistakes */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Common HSPU Training Mistakes</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A1F26] rounded-lg border-l-4 border-red-500">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Skipping Pike Work</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Many athletes jump straight to wall HSPUs without building pike push-up strength. 
                  This leads to compensations and potential shoulder issues.
                </p>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg border-l-4 border-red-500">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Ignoring Wrist Prep</h3>
                <p className="text-sm text-[#A4ACB8]">
                  HSPUs place significant load on the wrists. Without conditioning, wrist pain limits progress.
                  Use parallettes or dedicate time to wrist mobility.
                </p>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Poor Head Position</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Looking at the floor versus forward changes the movement significantly.
                  Practice consistent head position from the beginning.
                </p>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Too Much Kipping</h3>
                <p className="text-sm text-[#A4ACB8]">
                  Kipping HSPUs build less strength than strict. If your goal is strength,
                  prioritize strict reps even if you can do more with momentum.
                </p>
              </div>
            </div>
          </div>

          {/* Related Skills & Guides */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Continue Your Training</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/guides/handstand-push-up-progression" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">HSPU Guide</h3>
                <p className="text-xs text-[#6B7280]">Complete progression guide</p>
              </Link>
              <Link href="/guides/handstand-training" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Handstand Guide</h3>
                <p className="text-xs text-[#6B7280]">Build your balance</p>
              </Link>
              <Link href="/planche-readiness-calculator" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Planche Readiness</h3>
                <p className="text-xs text-[#6B7280]">Test your pushing strength</p>
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
          <ToolConversionCard
            context="handstand"
            toolData={result ? {
              maxDips: maxDips ? parseInt(maxDips) : undefined,
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

      {/* Footer */}
      <footer className="border-t border-[#2B313A] mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SpartanIcon className="w-6 h-6 text-[#C1121F]" />
              <span className="text-sm text-[#A4ACB8]">SpartanLab - AI-Powered Calisthenics Training</span>
            </div>
            <div className="flex gap-6 text-sm text-[#6B7280]">
              <Link href="/front-lever-readiness-calculator" className="hover:text-[#E6E9EF]">Front Lever</Link>
              <Link href="/planche-readiness-calculator" className="hover:text-[#E6E9EF]">Planche</Link>
              <Link href="/muscle-up-readiness-calculator" className="hover:text-[#E6E9EF]">Muscle-Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
