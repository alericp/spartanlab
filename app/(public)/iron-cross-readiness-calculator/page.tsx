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
  ChevronDown,
  CircleDot
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  calculateIronCrossReadiness,
  type IronCrossInputs,
  type ReadinessResult
} from '@/lib/readiness/skill-readiness'
import { ReadinessResultCard } from '@/components/calculators/ReadinessResultCard'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'
import { trackToolUsed } from '@/lib/analytics'
import { cn } from '@/lib/utils'

// FAQ Data
const faqs = [
  {
    question: 'How strong do I need to be for Iron Cross?',
    answer: 'The Iron Cross requires exceptional ring support strength (60+ second RTO hold), advanced straight-arm pressing strength, and years of tendon conditioning. Most athletes need weighted dips of +50-70% bodyweight and mastery of skills like RTO dips and support holds before attempting Cross work.'
  },
  {
    question: 'Why is tendon tolerance important for Iron Cross?',
    answer: 'The Iron Cross places extreme stress on the biceps tendons and shoulder joints. Unlike muscle strength which can develop quickly, tendon strength adapts slowly over years. Rushing into Cross training without adequate tendon preparation is a common cause of serious injury.'
  },
  {
    question: 'What is RTO support and why does it matter?',
    answer: 'RTO (Rings Turned Out) support means holding a support position on rings with your palms facing forward. This position requires significantly more shoulder stability and strength than neutral ring support, and directly prepares the joint angles used in the Cross.'
  },
  {
    question: 'How accurate is this Iron Cross calculator?',
    answer: 'This calculator uses rule-based thresholds derived from common training benchmarks for advanced ring work. It provides a useful estimate, but the Iron Cross is highly individual - factors like limb length, body composition, and training history significantly affect actual readiness.'
  },
]

export default function IronCrossReadinessCalculator() {
  // Form state
  const [ringSupportHold, setRingSupportHold] = useState('')
  const [rtoSupportHold, setRtoSupportHold] = useState('')
  const [maxDips, setMaxDips] = useState('')
  const [weightedDipLoad, setWeightedDipLoad] = useState('')
  const [straightArmStrength, setStraightArmStrength] = useState<'none' | 'basic' | 'intermediate' | 'advanced'>('none')
  const [scapularStrength, setScapularStrength] = useState<'weak' | 'moderate' | 'strong'>('weak')
  const [shoulderStability, setShoulderStability] = useState<'unstable' | 'moderate' | 'stable' | 'very_stable'>('moderate')
  const [tendonTolerance, setTendonTolerance] = useState<'low' | 'moderate' | 'high'>('low')
  const [assistedCrossHold, setAssistedCrossHold] = useState('')
  const [bodyweight, setBodyweight] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Result state
  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const ringSupport = parseInt(ringSupportHold) || 0
    const rtoSupport = parseInt(rtoSupportHold) || 0
    const dips = parseInt(maxDips) || 0
    const assistedCross = parseInt(assistedCrossHold) || 0
    
    if (ringSupport === 0 && rtoSupport === 0 && dips === 0) {
      setError('Please enter at least your ring support hold or dip count')
      return
    }
    
    const inputs: IronCrossInputs = {
      ringSupportHoldTime: ringSupport,
      rtoSupportHoldTime: rtoSupport,
      straightArmStrength,
      maxDips: dips,
      scapularDepressionStrength: scapularStrength,
      shoulderStability,
      tendonTolerance,
      hasRings: true, // Iron Cross requires rings
      assistedCrossHoldTime: assistedCross > 0 ? assistedCross : undefined,
    }
    
    const calcResult = calculateIronCrossReadiness(inputs)
    setResult(calcResult)
    
    // Track tool usage
    // [PRE-AB6 BUILD GREEN GATE / READINESS RESULT CONTRACT]
    // ReadinessResult exposes `score`, not `readinessScore`. Preserve the
    // analytics payload key `readiness_score` (existing event schema)
    // and source the value from the authoritative `calcResult.score`.
    trackToolUsed('iron_cross_calculator', { readiness_score: calcResult.score })
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setRingSupportHold('')
    setRtoSupportHold('')
    setMaxDips('')
    setWeightedDipLoad('')
    setStraightArmStrength('none')
    setScapularStrength('weak')
    setShoulderStability('moderate')
    setTendonTolerance('low')
    setAssistedCrossHold('')
    setBodyweight('')
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
            Iron Cross Readiness Calculator
          </h1>
          <p className="text-[#A4ACB8] text-lg max-w-2xl mx-auto mb-3">
            Evaluate your ring support strength, shoulder stability, and tendon conditioning to determine
            your readiness for Iron Cross progressions.
          </p>
          <p className="text-xs text-[#6B7280] max-w-lg mx-auto">
            Built using structured calisthenics readiness principles used to evaluate advanced ring strength development.
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
              {/* Ring Support Hold */}
              <div className="space-y-2">
                <Label htmlFor="ringSupport" className="text-[#E6E9EF] flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-[#C1121F]" />
                  Ring Support Hold (seconds)
                </Label>
                <Input
                  id="ringSupport"
                  type="number"
                  placeholder="e.g., 45"
                  value={ringSupportHold}
                  onChange={(e) => setRingSupportHold(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Basic ring support (neutral grip)</p>
              </div>

              {/* RTO Support Hold */}
              <div className="space-y-2">
                <Label htmlFor="rtoSupport" className="text-[#E6E9EF] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C1121F]" />
                  RTO Support Hold (seconds)
                </Label>
                <Input
                  id="rtoSupport"
                  type="number"
                  placeholder="e.g., 20"
                  value={rtoSupportHold}
                  onChange={(e) => setRtoSupportHold(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
                <p className="text-xs text-[#6B7280]">Rings Turned Out support (palms forward)</p>
              </div>

              {/* Max Dips */}
              <div className="space-y-2">
                <Label htmlFor="dips" className="text-[#E6E9EF] flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#C1121F]" />
                  Max Ring Dips
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
                  placeholder="e.g., 50"
                  value={weightedDipLoad}
                  onChange={(e) => setWeightedDipLoad(e.target.value)}
                  className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                />
              </div>

              {/* Straight-Arm Strength */}
              <div className="space-y-2">
                <Label className="text-[#E6E9EF]">Straight-Arm Strength Level</Label>
                <select
                  value={straightArmStrength}
                  onChange={(e) => setStraightArmStrength(e.target.value as typeof straightArmStrength)}
                  className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2B313A] rounded-md text-[#E6E9EF]"
                >
                  <option value="none">None - No straight-arm ring work</option>
                  <option value="basic">Basic - Can hold back lever tuck</option>
                  <option value="intermediate">Intermediate - Full back lever, planche lean</option>
                  <option value="advanced">Advanced - Full planche/maltese work</option>
                </select>
              </div>

              {/* Scapular Depression Strength */}
              <div className="space-y-2">
                <Label className="text-[#E6E9EF]">Scapular Depression Strength</Label>
                <select
                  value={scapularStrength}
                  onChange={(e) => setScapularStrength(e.target.value as typeof scapularStrength)}
                  className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2B313A] rounded-md text-[#E6E9EF]"
                >
                  <option value="weak">Weak - Shoulders shrug during supports</option>
                  <option value="moderate">Moderate - Can maintain depression briefly</option>
                  <option value="strong">Strong - Solid depression under load</option>
                </select>
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
                  {/* Shoulder Stability */}
                  <div className="space-y-2">
                    <Label className="text-[#E6E9EF]">Shoulder Stability</Label>
                    <select
                      value={shoulderStability}
                      onChange={(e) => setShoulderStability(e.target.value as typeof shoulderStability)}
                      className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2B313A] rounded-md text-[#E6E9EF]"
                    >
                      <option value="unstable">Unstable - History of shoulder issues</option>
                      <option value="moderate">Moderate - Generally stable</option>
                      <option value="stable">Stable - No issues, good control</option>
                      <option value="very_stable">Very Stable - Excellent stability</option>
                    </select>
                  </div>

                  {/* Tendon Tolerance */}
                  <div className="space-y-2">
                    <Label className="text-[#E6E9EF]">Tendon Tolerance</Label>
                    <select
                      value={tendonTolerance}
                      onChange={(e) => setTendonTolerance(e.target.value as typeof tendonTolerance)}
                      className="w-full px-3 py-2 bg-[#1A1F26] border border-[#2B313A] rounded-md text-[#E6E9EF]"
                    >
                      <option value="low">Low - Less than 2 years of ring training</option>
                      <option value="moderate">Moderate - 2-4 years of ring work</option>
                      <option value="high">High - 4+ years progressive ring training</option>
                    </select>
                    <p className="text-xs text-[#6B7280]">Critical safety factor - tendons adapt slowly over years</p>
                  </div>

                  {/* Assisted Cross Hold (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="assistedCross" className="text-[#E6E9EF]">
                      Band-Assisted Cross Hold (seconds) <span className="text-[#6B7280]">- optional</span>
                    </Label>
                    <Input
                      id="assistedCross"
                      type="number"
                      placeholder="e.g., 10"
                      value={assistedCrossHold}
                      onChange={(e) => setAssistedCrossHold(e.target.value)}
                      className="bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                    />
                    <p className="text-xs text-[#6B7280]">If you've trained assisted cross holds</p>
                  </div>

                  {/* Bodyweight (Optional) */}
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
                skillName="Iron Cross"
                progressionHref="/skills/iron-cross"
              />
            ) : (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6 h-full flex flex-col items-center justify-center text-center">
                <Target className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in the form to calculate your Iron Cross readiness score and get personalized recommendations.
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
              The Iron Cross Readiness Calculator evaluates six key factors that determine your readiness for this demanding skill:
            </p>
            <ul className="space-y-2 text-[#A4ACB8]">
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">1.</span>
                <span><strong className="text-[#E6E9EF]">Ring Support Stability:</strong> Foundation for all ring work - must be rock solid before cross training.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">2.</span>
                <span><strong className="text-[#E6E9EF]">RTO Support Hold:</strong> Rings Turned Out support demonstrates the shoulder stability required for cross angles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">3.</span>
                <span><strong className="text-[#E6E9EF]">Straight-Arm Strength:</strong> The Cross demands extreme straight-arm pressing strength built through years of ring work.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">4.</span>
                <span><strong className="text-[#E6E9EF]">Scapular Depression:</strong> You must hold your entire bodyweight through depressed shoulder blades.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">5.</span>
                <span><strong className="text-[#E6E9EF]">Shoulder Stability:</strong> The joint must be extremely stable to handle cross loading safely.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C1121F] font-bold">6.</span>
                <span><strong className="text-[#E6E9EF]">Tendon Tolerance:</strong> Years of progressive loading are required to prepare tendons for cross demands.</span>
              </li>
            </ul>
          </div>

          {/* Why Iron Cross Is Different */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Why Iron Cross Is Different</h2>
            <p className="text-[#A4ACB8] mb-4">
              The Iron Cross is <strong className="text-[#E6E9EF]">one of the most demanding skills in gymnastics</strong>. 
              Unlike other calisthenics skills that can be achieved in 1-2 years, the Cross typically requires 
              4-8+ years of progressive ring training.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Tendon Conditioning</h3>
                <p className="text-sm text-[#A4ACB8]">
                  The biceps tendons experience forces 4-5x bodyweight during the Cross. Tendons strengthen 
                  slowly - there are no shortcuts. Rushing leads to injury.
                </p>
              </div>
              <div className="p-4 bg-[#1A1F26] rounded-lg">
                <h3 className="font-semibold text-[#E6E9EF] mb-2">Straight-Arm Strength</h3>
                <p className="text-sm text-[#A4ACB8]">
                  The Cross requires holding your entire bodyweight at extreme leverage with straight arms. 
                  This demands years of progressive loading through ring support positions.
                </p>
              </div>
            </div>
          </div>

          {/* Ring Strength Resources */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">Ring Strength Resources</h2>
            <p className="text-[#6B7280] text-sm mb-4">Build the foundation for advanced ring work</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/skills/iron-cross" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors border border-transparent hover:border-[#C1121F]/30">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Iron Cross Hub</h3>
                <p className="text-xs text-[#6B7280]">Complete skill overview</p>
              </Link>
              <Link href="/guides/ring-strength-training" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Ring Strength Guide</h3>
                <p className="text-xs text-[#6B7280]">Build ring foundations</p>
              </Link>
              <Link href="/skills/back-lever" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Back Lever</h3>
                <p className="text-xs text-[#6B7280]">Prerequisite straight-arm skill</p>
              </Link>
              <Link href="/programs/ring-strength-program" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Ring Program</h3>
                <p className="text-xs text-[#6B7280]">Structured ring development</p>
              </Link>
            </div>
          </div>

          {/* Related Calculators */}
          <div className="bg-[#0F1115] border border-[#2B313A] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Related Tools</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/front-lever-readiness-calculator" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Front Lever Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your pulling readiness</p>
              </Link>
              <Link href="/planche-readiness-calculator" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Planche Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your pushing readiness</p>
              </Link>
              <Link href="/muscle-up-readiness-calculator" className="p-4 bg-[#1A1F26] rounded-lg hover:bg-[#252A33] transition-colors">
                <h3 className="font-semibold text-[#E6E9EF] text-sm mb-1">Muscle Up Calculator</h3>
                <p className="text-xs text-[#6B7280]">Test your transition strength</p>
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
            context="iron-cross"
            toolData={result ? {
              ringSupport: ringSupportHold ? parseInt(ringSupportHold) : undefined,
              maxDips: ringDips ? parseInt(ringDips) : undefined,
              weightedDip: weightedDipLoad ? parseFloat(weightedDipLoad) : undefined,
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
