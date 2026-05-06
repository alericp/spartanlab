'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  RefreshCw,
  ChevronRight,
  Dumbbell,
  ChevronDown,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { cn } from '@/lib/utils'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'
import { trackToolUsed } from '@/lib/analytics'

// Scoring logic
function calculatePullUpStrengthScore(
  maxPullUps: number,
  bodyweight: number,
  weightedLoad: number
): {
  score: number
  level: string
  pullUpScore: number
  weightedScore: number
  relativeStrength: number
  recommendation: string
} {
  // Pull-up rep score (0-50 points)
  let pullUpScore = 0
  if (maxPullUps >= 25) pullUpScore = 50
  else if (maxPullUps >= 20) pullUpScore = 45
  else if (maxPullUps >= 15) pullUpScore = 38
  else if (maxPullUps >= 12) pullUpScore = 32
  else if (maxPullUps >= 10) pullUpScore = 26
  else if (maxPullUps >= 8) pullUpScore = 20
  else if (maxPullUps >= 5) pullUpScore = 14
  else if (maxPullUps >= 3) pullUpScore = 8
  else if (maxPullUps >= 1) pullUpScore = 4
  else pullUpScore = 0
  
  // Weighted pull-up score (0-50 points)
  const relativeStrength = bodyweight > 0 ? (weightedLoad / bodyweight) * 100 : 0
  let weightedScore = 0
  if (relativeStrength >= 100) weightedScore = 50
  else if (relativeStrength >= 80) weightedScore = 45
  else if (relativeStrength >= 60) weightedScore = 38
  else if (relativeStrength >= 50) weightedScore = 32
  else if (relativeStrength >= 40) weightedScore = 26
  else if (relativeStrength >= 30) weightedScore = 20
  else if (relativeStrength >= 20) weightedScore = 14
  else if (relativeStrength >= 10) weightedScore = 8
  else if (relativeStrength > 0) weightedScore = 4
  else weightedScore = 0
  
  const score = pullUpScore + weightedScore
  
  // Level classification
  let level = 'Beginner'
  if (score >= 85) level = 'Elite'
  else if (score >= 65) level = 'Advanced'
  else if (score >= 40) level = 'Intermediate'
  else level = 'Beginner'
  
  // Recommendation
  let recommendation = ''
  if (score >= 85) {
    recommendation = 'Exceptional pull-up strength. Focus on advanced skills like front lever and one-arm pull-up progressions.'
  } else if (score >= 65) {
    recommendation = 'Strong pulling foundation. Ready for advanced skill work and heavy weighted progressions.'
  } else if (score >= 40) {
    recommendation = 'Solid base. Continue building with weighted pull-ups and volume work.'
  } else {
    recommendation = 'Focus on building pull-up volume and technique before adding weight.'
  }
  
  return {
    score,
    level,
    pullUpScore,
    weightedScore,
    relativeStrength,
    recommendation,
  }
}

// FAQ Data
const faqs = [
  {
    question: 'What is a good pull-up strength score?',
    answer: 'A score of 40-65 indicates intermediate level - solid for general fitness. Scores of 65-85 are advanced, suitable for skill work like front lever. Scores above 85 are elite level, typically seen in competitive calisthenics athletes.'
  },
  {
    question: 'How do weighted pull-ups affect the score?',
    answer: 'Weighted pull-ups account for 50% of your total score. The score is based on relative strength (weight added as a percentage of bodyweight). Adding 50% of your bodyweight is considered advanced, while 100%+ is elite.'
  },
  {
    question: 'How can I improve my pull-up strength score?',
    answer: 'Focus on progressive overload: increase reps at bodyweight, then add weight gradually. Train pull-ups 2-3x per week with varying rep ranges. Include accessory work like rows and bicep curls.'
  },
]

export default function PullUpStrengthScoreCalculator() {
  const [bodyweight, setBodyweight] = useState('')
  const [maxPullUps, setMaxPullUps] = useState('')
  const [weightedLoad, setWeightedLoad] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calculatePullUpStrengthScore> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const bw = parseFloat(bodyweight) || 0
    const pullUps = parseInt(maxPullUps) || 0
    const weighted = parseFloat(weightedLoad) || 0
    
    if (pullUps === 0) {
      setError('Please enter your max pull-ups')
      return
    }
    
  const calcResult = calculatePullUpStrengthScore(pullUps, bw, weighted)
  setResult(calcResult)
  
  // Track tool usage
  // [PRE-AB6 BUILD GREEN GATE / CALCULATOR ANALYTICS CONTRACT]
  //   The local result contract for `calculatePullUpStrengthScore`
  //   exposes `level: string`, not `classification`. The previous
  //   payload read `calcResult.classification`, which does not exist
  //   on the result object — TypeScript correctly rejected it.
  //   Preserved the existing analytics key `classification` (matches
  //   the sibling `calisthenics-strength-score/page.tsx:187` payload
  //   convention so downstream dashboards keep a stable cross-
  //   calculator key) while sourcing the value from the authoritative
  //   `calcResult.level` field. `trackToolUsed` accepts
  //   `Record<string, unknown>` (see `lib/analytics.ts:251`), so the
  //   key name is free-form. No casts, no suppressions, no
  //   result-type widening, no scoring/UI change.
  //
  //   [DELIVERY-PROOF NOTE / PRE-AB6 BUILD GREEN GATE]
  //   This comment line is appended solely to force a content change so
  //   v0's end-of-turn auto-commit produces a fresh branch HEAD newer
  //   than commit `98f1c69`. The Vercel deployment that surfaced this
  //   file's "Property 'classification' does not exist" error was built
  //   from `98f1c69`, which predates the corrective edit on the line
  //   below. After this turn's auto-commit lands, Vercel must build the
  //   new HEAD on `v0/alericpetsch836-6923-6213db1c-2`, NOT `98f1c69`.
  //   No executable code changed; this is a comment-only delivery-proof
  //   marker.
  trackToolUsed('pull_up_strength_score', { score: calcResult.score, classification: calcResult.level })
  }
  
  const handleReset = () => {
    setResult(null)
    setError(null)
    setBodyweight('')
    setMaxPullUps('')
    setWeightedLoad('')
  }

  const handleCopyResult = () => {
    if (!result) return
    
    const text = `My Pull-Up Strength Score: ${result.score}/100
Level: ${result.level}
Max Pull-Ups: ${maxPullUps}
Weighted: +${weightedLoad || 0} lbs (${result.relativeStrength.toFixed(0)}% BW)

Calculate yours at SpartanLab.io/calculators/pull-up-strength-score`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-purple-400'
    if (score >= 65) return 'text-emerald-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-orange-400'
  }

  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Navigation */}
        <Link 
          href="/calculators"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E6E9EF] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calculators
        </Link>

        {/* Header */}
        <section className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-xl bg-[#C1121F]/10 flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-[#C1121F]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-3">
            Pull-Up Strength Score Calculator
          </h1>
          <p className="text-[#A4ACB8] max-w-xl mx-auto">
            Calculate your pull-up strength score based on max reps and weighted performance. 
            Get your classification from Beginner to Elite.
          </p>
        </section>

        {/* Calculator */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Input Form */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
            <h2 className="text-lg font-semibold text-[#E6E9EF] mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#C1121F]" />
              Enter Your Stats
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="bodyweight" className="text-[#A4ACB8]">
                  Bodyweight (lbs)
                </Label>
                <Input
                  id="bodyweight"
                  type="number"
                  placeholder="e.g., 175"
                  value={bodyweight}
                  onChange={(e) => setBodyweight(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="pullups" className="text-[#A4ACB8]">
                  Max Strict Pull-Ups *
                </Label>
                <Input
                  id="pullups"
                  type="number"
                  placeholder="e.g., 12"
                  value={maxPullUps}
                  onChange={(e) => setMaxPullUps(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="weighted" className="text-[#A4ACB8]">
                  Weighted Pull-Up Load (lbs added)
                </Label>
                <Input
                  id="weighted"
                  type="number"
                  placeholder="e.g., 45"
                  value={weightedLoad}
                  onChange={(e) => setWeightedLoad(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Enter 0 if you have not trained weighted pull-ups
                </p>
              </div>
              
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleCalculate}
                  className="flex-1 bg-[#C1121F] hover:bg-[#A50E1A] text-white"
                >
                  Calculate Score
                </Button>
                {result && (
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="border-[#2B313A] hover:bg-[#2B313A]"
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
              <Card className="bg-[#1A1F26] border-[#2B313A] p-6 h-full">
                <div className="text-center mb-6">
                  <p className="text-sm text-[#6B7280] mb-2">Your Pull-Up Strength Score</p>
                  <div className={cn('text-5xl font-bold mb-2', getScoreColor(result.score))}>
                    {result.score}
                  </div>
                  <Badge className={cn(
                    'text-sm',
                    result.level === 'Elite' && 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                    result.level === 'Advanced' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                    result.level === 'Intermediate' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                    result.level === 'Beginner' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                  )}>
                    {result.level}
                  </Badge>
                </div>
                
                {/* Score Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Pull-Up Reps Score</span>
                    <span className="text-sm font-medium text-[#E6E9EF]">{result.pullUpScore}/50</span>
                  </div>
                  <div className="w-full h-2 bg-[#2B313A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#C1121F] transition-all duration-500"
                      style={{ width: `${(result.pullUpScore / 50) * 100}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Weighted Strength Score</span>
                    <span className="text-sm font-medium text-[#E6E9EF]">{result.weightedScore}/50</span>
                  </div>
                  <div className="w-full h-2 bg-[#2B313A] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#C1121F] transition-all duration-500"
                      style={{ width: `${(result.weightedScore / 50) * 100}%` }}
                    />
                  </div>
                  
                  {result.relativeStrength > 0 && (
                    <p className="text-xs text-[#6B7280] text-center">
                      Relative strength: {result.relativeStrength.toFixed(0)}% of bodyweight
                    </p>
                  )}
                </div>
                
                {/* Recommendation */}
                <div className="bg-[#0F1115] rounded-lg p-4 mb-4">
                  <p className="text-sm text-[#A4ACB8]">{result.recommendation}</p>
                </div>
                
                {/* Share Button */}
                <Button 
                  onClick={handleCopyResult}
                  variant="outline"
                  className="w-full border-[#2B313A] hover:bg-[#2B313A]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Result to Share
                    </>
                  )}
                </Button>
              </Card>
            ) : (
              <Card className="bg-[#0F1115] border-[#2B313A] p-6 h-full flex flex-col items-center justify-center text-center">
                <Dumbbell className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in your pull-up performance to calculate your strength score.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Classification Guide */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Score Classifications</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { level: 'Beginner', range: '0-39', color: 'text-orange-400', description: 'Building foundation' },
              { level: 'Intermediate', range: '40-64', color: 'text-yellow-400', description: 'Solid base' },
              { level: 'Advanced', range: '65-84', color: 'text-emerald-400', description: 'Skill ready' },
              { level: 'Elite', range: '85-100', color: 'text-purple-400', description: 'Exceptional' },
            ].map((item) => (
              <Card key={item.level} className="bg-[#1A1F26] border-[#2B313A] p-4 text-center">
                <p className={cn('text-lg font-bold', item.color)}>{item.level}</p>
                <p className="text-sm text-[#6B7280]">{item.range}</p>
                <p className="text-xs text-[#6B7280] mt-1">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">FAQ</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <Card 
                key={index}
                className="bg-[#1A1F26] border-[#2B313A] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqs(prev => 
                    prev.includes(index) 
                      ? prev.filter(i => i !== index)
                      : [...prev, index]
                  )}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-[#E6E9EF]">{faq.question}</span>
                  <ChevronDown className={cn(
                    'w-5 h-5 text-[#6B7280] transition-transform',
                    openFaqs.includes(index) && 'rotate-180'
                  )} />
                </button>
                {openFaqs.includes(index) && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-[#A4ACB8]">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Related Links */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Next Steps</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/skills/front-lever">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Front Lever Hub</h3>
                <p className="text-xs text-[#6B7280]">Apply your pulling strength</p>
              </Card>
            </Link>
            <Link href="/calisthenics-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">View all benchmarks</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="mb-8">
          <ToolConversionCardStatic
            context="front-lever"
            toolData={result ? {
              maxPullUps: parseInt(maxPullUps) || undefined,
              weightedPullUp: parseInt(weightedLoad) || undefined,
            } : undefined}
          />
        </section>
      </div>
    </main>
  )
}
