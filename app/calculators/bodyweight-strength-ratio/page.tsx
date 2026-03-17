'use client'

// Prevent static prerendering to avoid auth issues during build
export const dynamic = 'force-dynamic'

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
  Activity,
  ChevronDown,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToolConversionCard } from '@/components/tools/ToolConversionCard'
import { trackToolUsed } from '@/lib/analytics'

// Scoring logic
function calculateStrengthRatios(
  bodyweight: number,
  weightedPullUp: number,
  weightedDip: number
): {
  pullRatio: number
  pushRatio: number
  pullLevel: string
  pushLevel: string
  balance: string
  skillReadiness: {
    frontLever: string
    planche: string
    muscleUp: string
  }
  recommendation: string
} {
  const pullRatio = bodyweight > 0 ? ((bodyweight + weightedPullUp) / bodyweight) : 1
  const pushRatio = bodyweight > 0 ? ((bodyweight + weightedDip) / bodyweight) : 1
  
  // Pull level classification
  let pullLevel = 'Beginner'
  if (pullRatio >= 2.0) pullLevel = 'Elite'
  else if (pullRatio >= 1.7) pullLevel = 'Advanced'
  else if (pullRatio >= 1.4) pullLevel = 'Intermediate'
  else pullLevel = 'Beginner'
  
  // Push level classification
  let pushLevel = 'Beginner'
  if (pushRatio >= 2.0) pushLevel = 'Elite'
  else if (pushRatio >= 1.8) pushLevel = 'Advanced'
  else if (pushRatio >= 1.5) pushLevel = 'Intermediate'
  else pushLevel = 'Beginner'
  
  // Balance assessment
  const ratioDiff = Math.abs(pullRatio - pushRatio)
  let balance = 'Balanced'
  if (ratioDiff > 0.3) {
    balance = pullRatio > pushRatio ? 'Pull Dominant' : 'Push Dominant'
  }
  
  // Skill readiness
  const skillReadiness = {
    frontLever: pullRatio >= 1.5 ? (pullRatio >= 1.7 ? 'Ready' : 'Close') : 'Not Ready',
    planche: pushRatio >= 1.6 ? (pushRatio >= 1.8 ? 'Ready' : 'Close') : 'Not Ready',
    muscleUp: (pullRatio >= 1.3 && pushRatio >= 1.3) 
      ? (pullRatio >= 1.5 ? 'Ready' : 'Close') 
      : 'Not Ready',
  }
  
  // Recommendation
  let recommendation = ''
  if (balance === 'Pull Dominant') {
    recommendation = 'Your pulling strength exceeds pushing. Focus on weighted dips and push-up variations to balance your strength.'
  } else if (balance === 'Push Dominant') {
    recommendation = 'Your pushing strength exceeds pulling. Focus on weighted pull-ups and rows to balance your strength.'
  } else if (pullLevel === 'Beginner' || pushLevel === 'Beginner') {
    recommendation = 'Build foundational strength with progressive weighted training. Aim for 1.5x bodyweight in both movements.'
  } else {
    recommendation = 'Well-balanced strength profile. Continue progressive overload and begin advanced skill work.'
  }
  
  return {
    pullRatio,
    pushRatio,
    pullLevel,
    pushLevel,
    balance,
    skillReadiness,
    recommendation,
  }
}

// FAQ Data
const faqs = [
  {
    question: 'What is a good bodyweight strength ratio?',
    answer: 'For pulling: 1.4x is intermediate, 1.7x is advanced, 2.0x+ is elite. For pushing: 1.5x is intermediate, 1.8x is advanced, 2.0x+ is elite. These ratios are total load (bodyweight + added weight) divided by bodyweight.'
  },
  {
    question: 'How do these ratios relate to calisthenics skills?',
    answer: 'Front lever typically requires 1.5-1.7x pull ratio. Planche requires 1.6-1.8x push ratio. Muscle-ups need both ratios above 1.3x. Higher ratios indicate better readiness for these skills.'
  },
  {
    question: 'Should pull and push ratios be equal?',
    answer: 'Ideally, they should be within 0.3 of each other. Some imbalance is normal, but large gaps can lead to injury or limit skill progression. Balance your training to address weaknesses.'
  },
]

export default function BodyweightStrengthRatioCalculator() {
  const [bodyweight, setBodyweight] = useState('')
  const [weightedPullUp, setWeightedPullUp] = useState('')
  const [weightedDip, setWeightedDip] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calculateStrengthRatios> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const bw = parseFloat(bodyweight) || 0
    const pull = parseFloat(weightedPullUp) || 0
    const push = parseFloat(weightedDip) || 0
    
    if (bw === 0) {
      setError('Please enter your bodyweight')
      return
    }
    
  const calcResult = calculateStrengthRatios(bw, pull, push)
  setResult(calcResult)
  
  // Track tool usage
  trackToolUsed('bodyweight_strength_ratio', { pullRatio: calcResult.pullRatio, pushRatio: calcResult.pushRatio })
  }
  
  const handleReset = () => {
    setResult(null)
    setError(null)
    setBodyweight('')
    setWeightedPullUp('')
    setWeightedDip('')
  }

  const handleCopyResult = () => {
    if (!result) return
    
    const text = `My Bodyweight Strength Ratios:
Pull Ratio: ${result.pullRatio.toFixed(2)}x (${result.pullLevel})
Push Ratio: ${result.pushRatio.toFixed(2)}x (${result.pushLevel})
Balance: ${result.balance}

Skill Readiness:
Front Lever: ${result.skillReadiness.frontLever}
Planche: ${result.skillReadiness.planche}
Muscle-Up: ${result.skillReadiness.muscleUp}

Calculate yours at SpartanLab.io/calculators/bodyweight-strength-ratio`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getRatioColor = (ratio: number, type: 'pull' | 'push') => {
    const threshold = type === 'pull' ? { elite: 2.0, adv: 1.7, int: 1.4 } : { elite: 2.0, adv: 1.8, int: 1.5 }
    if (ratio >= threshold.elite) return 'text-purple-400'
    if (ratio >= threshold.adv) return 'text-emerald-400'
    if (ratio >= threshold.int) return 'text-yellow-400'
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
              <Activity className="w-7 h-7 text-[#C1121F]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-3">
            Bodyweight Strength Ratio Calculator
          </h1>
          <p className="text-[#A4ACB8] max-w-xl mx-auto">
            Calculate your pulling and pushing strength relative to bodyweight. 
            Understand your readiness for advanced calisthenics skills.
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
                  Bodyweight (lbs) *
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
                <Label htmlFor="pull" className="text-[#A4ACB8]">
                  Weighted Pull-Up 1RM (lbs added)
                </Label>
                <Input
                  id="pull"
                  type="number"
                  placeholder="e.g., 70"
                  value={weightedPullUp}
                  onChange={(e) => setWeightedPullUp(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Enter 0 if bodyweight only
                </p>
              </div>
              
              <div>
                <Label htmlFor="push" className="text-[#A4ACB8]">
                  Weighted Dip 1RM (lbs added)
                </Label>
                <Input
                  id="push"
                  type="number"
                  placeholder="e.g., 90"
                  value={weightedDip}
                  onChange={(e) => setWeightedDip(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Enter 0 if bodyweight only
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
                  Calculate Ratios
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
                {/* Ratios Display */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-[#0F1115] rounded-lg">
                    <p className="text-xs text-[#6B7280] mb-1">Pull Ratio</p>
                    <p className={cn('text-3xl font-bold', getRatioColor(result.pullRatio, 'pull'))}>
                      {result.pullRatio.toFixed(2)}x
                    </p>
                    <Badge className="mt-2 bg-[#2B313A] text-[#A4ACB8]">
                      {result.pullLevel}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-[#0F1115] rounded-lg">
                    <p className="text-xs text-[#6B7280] mb-1">Push Ratio</p>
                    <p className={cn('text-3xl font-bold', getRatioColor(result.pushRatio, 'push'))}>
                      {result.pushRatio.toFixed(2)}x
                    </p>
                    <Badge className="mt-2 bg-[#2B313A] text-[#A4ACB8]">
                      {result.pushLevel}
                    </Badge>
                  </div>
                </div>
                
                {/* Balance */}
                <div className="text-center mb-4">
                  <Badge className={cn(
                    result.balance === 'Balanced' && 'bg-emerald-500/20 text-emerald-400',
                    result.balance === 'Pull Dominant' && 'bg-blue-500/20 text-blue-400',
                    result.balance === 'Push Dominant' && 'bg-orange-500/20 text-orange-400',
                  )}>
                    {result.balance}
                  </Badge>
                </div>
                
                {/* Skill Readiness */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-[#E6E9EF] mb-2">Skill Readiness</p>
                  <div className="space-y-2">
                    {Object.entries(result.skillReadiness).map(([skill, status]) => (
                      <div key={skill} className="flex justify-between items-center text-sm">
                        <span className="text-[#6B7280] capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <Badge className={cn(
                          'text-xs',
                          status === 'Ready' && 'bg-emerald-500/20 text-emerald-400',
                          status === 'Close' && 'bg-yellow-500/20 text-yellow-400',
                          status === 'Not Ready' && 'bg-red-500/20 text-red-400',
                        )}>
                          {status}
                        </Badge>
                      </div>
                    ))}
                  </div>
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
                <Activity className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in your weighted strength to calculate your bodyweight ratios.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Ratio Standards Table */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Ratio Standards</h2>
          <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0F1115]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#6B7280]">Level</th>
                    <th className="px-4 py-3 text-left text-[#6B7280]">Pull Ratio</th>
                    <th className="px-4 py-3 text-left text-[#6B7280]">Push Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[#2B313A]">
                    <td className="px-4 py-3 text-orange-400">Beginner</td>
                    <td className="px-4 py-3 text-[#A4ACB8]">{"< 1.4x"}</td>
                    <td className="px-4 py-3 text-[#A4ACB8]">{"< 1.5x"}</td>
                  </tr>
                  <tr className="border-t border-[#2B313A]">
                    <td className="px-4 py-3 text-yellow-400">Intermediate</td>
                    <td className="px-4 py-3 text-[#A4ACB8]">1.4x - 1.7x</td>
                    <td className="px-4 py-3 text-[#A4ACB8]">1.5x - 1.8x</td>
                  </tr>
                  <tr className="border-t border-[#2B313A]">
                    <td className="px-4 py-3 text-emerald-400">Advanced</td>
                    <td className="px-4 py-3 text-[#A4ACB8]">1.7x - 2.0x</td>
                    <td className="px-4 py-3 text-[#A4ACB8]">1.8x - 2.0x</td>
                  </tr>
                  <tr className="border-t border-[#2B313A]">
                    <td className="px-4 py-3 text-purple-400">Elite</td>
                    <td className="px-4 py-3 text-[#A4ACB8]">2.0x+</td>
                    <td className="px-4 py-3 text-[#A4ACB8]">2.0x+</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
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
            <Link href="/front-lever-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Front Lever Calculator</h3>
                <p className="text-xs text-[#6B7280]">Detailed readiness assessment</p>
              </Card>
            </Link>
            <Link href="/planche-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Planche Calculator</h3>
                <p className="text-xs text-[#6B7280]">Detailed readiness assessment</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="mb-8">
          <ToolConversionCard
            context="general"
            toolData={result ? {
              bodyweight: parseInt(bodyweight) || undefined,
              weightedPullUp: parseInt(weightedPullUp) || undefined,
              weightedDip: parseInt(weightedDip) || undefined,
            } : undefined}
          />
        </section>
      </div>
    </main>
  )
}
