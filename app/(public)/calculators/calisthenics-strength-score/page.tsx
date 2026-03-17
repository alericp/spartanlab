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
  TrendingUp,
  ChevronDown,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'
import { trackToolUsed } from '@/lib/analytics'

// Scoring logic
function calculateCalisthenicsStrengthScore(
  maxPullUps: number,
  maxDips: number,
  maxPushUps: number,
  lSitHoldTime: number
): {
  score: number
  level: string
  breakdown: {
    pullScore: number
    pushScore: number
    dipScore: number
    coreScore: number
  }
  recommendation: string
  nextMilestone: string
} {
  // Pull-up score (0-25)
  let pullScore = 0
  if (maxPullUps >= 25) pullScore = 25
  else if (maxPullUps >= 20) pullScore = 22
  else if (maxPullUps >= 15) pullScore = 18
  else if (maxPullUps >= 12) pullScore = 15
  else if (maxPullUps >= 10) pullScore = 12
  else if (maxPullUps >= 8) pullScore = 9
  else if (maxPullUps >= 5) pullScore = 6
  else if (maxPullUps >= 3) pullScore = 3
  else pullScore = Math.min(maxPullUps, 2)
  
  // Push-up score (0-25)
  let pushScore = 0
  if (maxPushUps >= 50) pushScore = 25
  else if (maxPushUps >= 40) pushScore = 22
  else if (maxPushUps >= 30) pushScore = 18
  else if (maxPushUps >= 25) pushScore = 15
  else if (maxPushUps >= 20) pushScore = 12
  else if (maxPushUps >= 15) pushScore = 9
  else if (maxPushUps >= 10) pushScore = 6
  else if (maxPushUps >= 5) pushScore = 3
  else pushScore = Math.min(maxPushUps, 2)
  
  // Dip score (0-25)
  let dipScore = 0
  if (maxDips >= 30) dipScore = 25
  else if (maxDips >= 25) dipScore = 22
  else if (maxDips >= 20) dipScore = 18
  else if (maxDips >= 15) dipScore = 15
  else if (maxDips >= 12) dipScore = 12
  else if (maxDips >= 10) dipScore = 9
  else if (maxDips >= 8) dipScore = 6
  else if (maxDips >= 5) dipScore = 3
  else dipScore = Math.min(maxDips, 2)
  
  // L-sit score (0-25)
  let coreScore = 0
  if (lSitHoldTime >= 60) coreScore = 25
  else if (lSitHoldTime >= 45) coreScore = 22
  else if (lSitHoldTime >= 30) coreScore = 18
  else if (lSitHoldTime >= 20) coreScore = 15
  else if (lSitHoldTime >= 15) coreScore = 12
  else if (lSitHoldTime >= 10) coreScore = 9
  else if (lSitHoldTime >= 5) coreScore = 6
  else if (lSitHoldTime > 0) coreScore = 3
  else coreScore = 0
  
  const score = pullScore + pushScore + dipScore + coreScore
  
  // Level classification
  let level = 'Beginner'
  if (score >= 85) level = 'Elite'
  else if (score >= 65) level = 'Advanced'
  else if (score >= 40) level = 'Intermediate'
  else level = 'Beginner'
  
  // Find weakest area for recommendation
  const scores = { Pull: pullScore, Push: pushScore, Dip: dipScore, Core: coreScore }
  const weakest = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b)[0]
  
  let recommendation = ''
  let nextMilestone = ''
  
  if (level === 'Beginner') {
    recommendation = `Focus on building foundational strength in all areas. Your ${weakest.toLowerCase()} strength needs the most work.`
    nextMilestone = 'Reach 10 pull-ups, 15 dips, 25 push-ups, and 15s L-sit'
  } else if (level === 'Intermediate') {
    recommendation = `Good foundation established. Work on ${weakest.toLowerCase()} strength to balance your development.`
    nextMilestone = 'Reach 15 pull-ups, 20 dips, 35 push-ups, and 30s L-sit'
  } else if (level === 'Advanced') {
    recommendation = `Strong overall. Continue progressive overload and begin advanced skill work like front lever and planche.`
    nextMilestone = 'Reach 20 pull-ups, 25 dips, 45 push-ups, and 45s L-sit'
  } else {
    recommendation = `Elite level calisthenics strength. Focus on skill mastery and weighted progressions.`
    nextMilestone = 'Master advanced skills: front lever, planche, muscle-up'
  }
  
  return {
    score,
    level,
    breakdown: {
      pullScore,
      pushScore,
      dipScore,
      coreScore,
    },
    recommendation,
    nextMilestone,
  }
}

// FAQ Data
const faqs = [
  {
    question: 'What is a good calisthenics strength score?',
    answer: 'A score of 40-65 is intermediate level, indicating a solid foundation. 65-85 is advanced, ready for skill work. 85+ is elite, comparable to competitive calisthenics athletes. Most people start in the 20-40 range.'
  },
  {
    question: 'Why is L-sit hold time included?',
    answer: 'L-sit measures core compression strength, which is essential for advanced skills like front lever, V-sit, and planche. Many athletes neglect core work, which becomes a limiting factor in skill progression.'
  },
  {
    question: 'How often should I test my score?',
    answer: 'Test every 4-8 weeks to track progress. More frequent testing can be demotivating as strength gains take time. Focus on consistent training rather than constant testing.'
  },
]

export default function CalisthenicsStrengthScoreCalculator() {
  const [maxPullUps, setMaxPullUps] = useState('')
  const [maxDips, setMaxDips] = useState('')
  const [maxPushUps, setMaxPushUps] = useState('')
  const [lSitHoldTime, setLSitHoldTime] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calculateCalisthenicsStrengthScore> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const pullUps = parseInt(maxPullUps) || 0
    const dips = parseInt(maxDips) || 0
    const pushUps = parseInt(maxPushUps) || 0
    const lSit = parseInt(lSitHoldTime) || 0
    
    if (pullUps === 0 && dips === 0 && pushUps === 0) {
      setError('Please enter at least one exercise value')
      return
    }
    
  const calcResult = calculateCalisthenicsStrengthScore(pullUps, dips, pushUps, lSit)
  setResult(calcResult)
  
  // Track tool usage
  trackToolUsed('calisthenics_strength_score', { score: calcResult.score, classification: calcResult.classification })
  }
  
  const handleReset = () => {
    setResult(null)
    setError(null)
    setMaxPullUps('')
    setMaxDips('')
    setMaxPushUps('')
    setLSitHoldTime('')
  }

  const handleCopyResult = () => {
    if (!result) return
    
    const text = `My Calisthenics Strength Score: ${result.score}/100
Level: ${result.level}

Breakdown:
Pull-Ups: ${result.breakdown.pullScore}/25
Push-Ups: ${result.breakdown.pushScore}/25
Dips: ${result.breakdown.dipScore}/25
Core (L-Sit): ${result.breakdown.coreScore}/25

Next Goal: ${result.nextMilestone}

Calculate yours at SpartanLab.io/calculators/calisthenics-strength-score`
    
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
              <TrendingUp className="w-7 h-7 text-[#C1121F]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-3">
            Calisthenics Strength Score Calculator
          </h1>
          <p className="text-[#A4ACB8] max-w-xl mx-auto">
            Get a combined strength score based on pull-ups, dips, push-ups, and L-sit holds. 
            See where you stand from Beginner to Elite.
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
                <Label htmlFor="pullups" className="text-[#A4ACB8]">
                  Max Strict Pull-Ups
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
                <Label htmlFor="dips" className="text-[#A4ACB8]">
                  Max Strict Dips
                </Label>
                <Input
                  id="dips"
                  type="number"
                  placeholder="e.g., 15"
                  value={maxDips}
                  onChange={(e) => setMaxDips(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="pushups" className="text-[#A4ACB8]">
                  Max Push-Ups
                </Label>
                <Input
                  id="pushups"
                  type="number"
                  placeholder="e.g., 30"
                  value={maxPushUps}
                  onChange={(e) => setMaxPushUps(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="lsit" className="text-[#A4ACB8]">
                  L-Sit Hold Time (seconds)
                </Label>
                <Input
                  id="lsit"
                  type="number"
                  placeholder="e.g., 20"
                  value={lSitHoldTime}
                  onChange={(e) => setLSitHoldTime(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
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
                  <p className="text-sm text-[#6B7280] mb-2">Calisthenics Strength Score</p>
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
                  {[
                    { label: 'Pull-Ups', score: result.breakdown.pullScore },
                    { label: 'Push-Ups', score: result.breakdown.pushScore },
                    { label: 'Dips', score: result.breakdown.dipScore },
                    { label: 'Core (L-Sit)', score: result.breakdown.coreScore },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-[#6B7280]">{item.label}</span>
                        <span className="text-sm font-medium text-[#E6E9EF]">{item.score}/25</span>
                      </div>
                      <div className="w-full h-2 bg-[#2B313A] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#C1121F] transition-all duration-500"
                          style={{ width: `${(item.score / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Recommendation */}
                <div className="bg-[#0F1115] rounded-lg p-4 mb-2">
                  <p className="text-sm text-[#A4ACB8] mb-2">{result.recommendation}</p>
                  <p className="text-xs text-[#6B7280]">
                    <strong>Next milestone:</strong> {result.nextMilestone}
                  </p>
                </div>
                
                {/* Share Button */}
                <Button 
                  onClick={handleCopyResult}
                  variant="outline"
                  className="w-full border-[#2B313A] hover:bg-[#2B313A] mt-4"
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
                <TrendingUp className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in your exercise maxes to calculate your combined strength score.
                </p>
              </Card>
            )}
          </div>
        </div>

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
            <Link href="/calisthenics-strength-standards">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Strength Standards</h3>
                <p className="text-xs text-[#6B7280]">See detailed benchmarks</p>
              </Card>
            </Link>
            <Link href="/exercises">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Exercise Library</h3>
                <p className="text-xs text-[#6B7280]">Learn proper technique</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="mb-8">
          <ToolConversionCardStatic
            context="general"
            toolData={result ? {
              maxPullUps: parseInt(maxPullUps) || undefined,
              maxDips: parseInt(maxDips) || undefined,
              maxPushUps: parseInt(maxPushUps) || undefined,
            } : undefined}
          />
        </section>
      </div>
    </main>
  )
}
