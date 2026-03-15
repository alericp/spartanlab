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
  Target,
  ChevronDown,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Scoring logic
function calculateSkillReadiness(
  maxPullUps: number,
  maxDips: number,
  coreHoldTime: number,
  weightedPullUp: number
): {
  frontLever: { score: number; status: string; nextStep: string }
  planche: { score: number; status: string; nextStep: string }
  muscleUp: { score: number; status: string; nextStep: string }
  closestSkill: string
  recommendation: string
} {
  // Front Lever Readiness (heavily weighted toward pulling)
  let flScore = 0
  flScore += Math.min(maxPullUps * 2.5, 40) // Max 40 from pull-ups
  flScore += Math.min(coreHoldTime * 0.8, 30) // Max 30 from core
  flScore += Math.min(weightedPullUp * 0.6, 30) // Max 30 from weighted
  flScore = Math.min(Math.round(flScore), 100)
  
  let flStatus = 'Not Ready'
  let flNextStep = 'Build to 12+ pull-ups and 30s hollow hold'
  if (flScore >= 80) {
    flStatus = 'Ready'
    flNextStep = 'Begin straddle front lever progressions'
  } else if (flScore >= 60) {
    flStatus = 'Advanced Tuck Ready'
    flNextStep = 'Focus on advanced tuck holds and front lever rows'
  } else if (flScore >= 40) {
    flStatus = 'Tuck Ready'
    flNextStep = 'Start tuck front lever holds, build to 15s'
  }
  
  // Planche Readiness (heavily weighted toward pushing/dips)
  let plScore = 0
  plScore += Math.min(maxDips * 2, 40) // Max 40 from dips
  plScore += Math.min(coreHoldTime * 0.6, 25) // Max 25 from core
  plScore += Math.min(maxPullUps * 0.5, 15) // Max 15 from pull-ups (balance)
  plScore += Math.min(weightedPullUp * 0.3, 20) // Max 20 from weighted (straight arm indicator)
  plScore = Math.min(Math.round(plScore), 100)
  
  let plStatus = 'Not Ready'
  let plNextStep = 'Build to 15+ dips and practice planche leans'
  if (plScore >= 80) {
    plStatus = 'Tuck Planche Ready'
    plNextStep = 'Begin tuck planche holds on parallettes'
  } else if (plScore >= 55) {
    plStatus = 'Lean Ready'
    plNextStep = 'Practice 60s+ planche leans with forward shift'
  } else if (plScore >= 35) {
    plStatus = 'Foundation Building'
    plNextStep = 'Focus on pseudo planche push-ups and dips'
  }
  
  // Muscle-Up Readiness (balanced pull and push)
  let muScore = 0
  muScore += Math.min(maxPullUps * 3, 45) // Max 45 from pull-ups
  muScore += Math.min(maxDips * 1.5, 30) // Max 30 from dips
  muScore += Math.min(weightedPullUp * 0.5, 25) // Max 25 from weighted (explosive indicator)
  muScore = Math.min(Math.round(muScore), 100)
  
  let muStatus = 'Not Ready'
  let muNextStep = 'Build to 10+ pull-ups and 12+ dips'
  if (muScore >= 75) {
    muStatus = 'Ready'
    muNextStep = 'Practice explosive pull-ups and negatives'
  } else if (muScore >= 55) {
    muStatus = 'Transition Practice Ready'
    muNextStep = 'Work on high pull-ups and transition drills'
  } else if (muScore >= 35) {
    muStatus = 'Building Foundation'
    muNextStep = 'Focus on chest-to-bar pull-ups and straight bar dips'
  }
  
  // Determine closest skill
  const scores = [
    { skill: 'Muscle-Up', score: muScore },
    { skill: 'Front Lever', score: flScore },
    { skill: 'Planche', score: plScore },
  ]
  const closest = scores.sort((a, b) => b.score - a.score)[0]
  
  // Overall recommendation
  let recommendation = ''
  if (closest.score >= 75) {
    recommendation = `You are ready to train ${closest.skill}. Focus your energy there while maintaining foundational strength.`
  } else if (closest.score >= 50) {
    recommendation = `${closest.skill} is within reach. Focus on the specific prerequisites listed to accelerate progress.`
  } else {
    recommendation = `Build foundational strength first. Focus on pull-ups, dips, and core work before specializing.`
  }
  
  return {
    frontLever: { score: flScore, status: flStatus, nextStep: flNextStep },
    planche: { score: plScore, status: plStatus, nextStep: plNextStep },
    muscleUp: { score: muScore, status: muStatus, nextStep: muNextStep },
    closestSkill: closest.skill,
    recommendation,
  }
}

// FAQ Data
const faqs = [
  {
    question: 'Which skill should I train first?',
    answer: 'Generally, muscle-up is the most accessible skill for most athletes as it relies more on technique than pure strength. Front lever is next, requiring strong pulling. Planche is typically the most difficult and time-consuming.'
  },
  {
    question: 'Can I train multiple skills at once?',
    answer: 'Yes, but prioritize one. Training 2-3 skills simultaneously is possible if you manage fatigue well. However, focusing 70-80% of your skill work on one target yields faster progress than splitting attention equally.'
  },
  {
    question: 'How accurate are these readiness scores?',
    answer: 'These scores provide a useful estimate based on common benchmarks. Individual factors like body weight, limb length, training history, and technique proficiency also affect actual skill readiness.'
  },
]

export default function SkillReadinessScoreCalculator() {
  const [maxPullUps, setMaxPullUps] = useState('')
  const [maxDips, setMaxDips] = useState('')
  const [coreHoldTime, setCoreHoldTime] = useState('')
  const [weightedPullUp, setWeightedPullUp] = useState('')
  const [result, setResult] = useState<ReturnType<typeof calculateSkillReadiness> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [openFaqs, setOpenFaqs] = useState<number[]>([])

  const handleCalculate = () => {
    setError(null)
    
    const pullUps = parseInt(maxPullUps) || 0
    const dips = parseInt(maxDips) || 0
    const core = parseInt(coreHoldTime) || 0
    const weighted = parseFloat(weightedPullUp) || 0
    
    if (pullUps === 0 && dips === 0) {
      setError('Please enter at least your pull-ups or dips')
      return
    }
    
    const calcResult = calculateSkillReadiness(pullUps, dips, core, weighted)
    setResult(calcResult)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setMaxPullUps('')
    setMaxDips('')
    setCoreHoldTime('')
    setWeightedPullUp('')
  }

  const handleCopyResult = () => {
    if (!result) return
    
    const text = `My Skill Readiness Scores:

Front Lever: ${result.frontLever.score}% - ${result.frontLever.status}
Planche: ${result.planche.score}% - ${result.planche.status}
Muscle-Up: ${result.muscleUp.score}% - ${result.muscleUp.status}

Closest Skill: ${result.closestSkill}

Calculate yours at SpartanLab.io/calculators/skill-readiness-score`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusColor = (status: string) => {
    if (status === 'Ready' || status === 'Tuck Planche Ready') return 'bg-emerald-500/20 text-emerald-400'
    if (status.includes('Tuck') || status.includes('Lean') || status.includes('Transition')) return 'bg-yellow-500/20 text-yellow-400'
    if (status.includes('Building') || status.includes('Foundation')) return 'bg-orange-500/20 text-orange-400'
    return 'bg-red-500/20 text-red-400'
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400'
    if (score >= 50) return 'text-yellow-400'
    if (score >= 30) return 'text-orange-400'
    return 'text-red-400'
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
              <Target className="w-7 h-7 text-[#C1121F]" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E6E9EF] mb-3">
            Skill Readiness Score Calculator
          </h1>
          <p className="text-[#A4ACB8] max-w-xl mx-auto">
            Evaluate your readiness for front lever, planche, and muscle-up based on your 
            current strength metrics. Find out which skill you are closest to achieving.
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
                <Label htmlFor="dips" className="text-[#A4ACB8]">
                  Max Strict Dips *
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
                <Label htmlFor="core" className="text-[#A4ACB8]">
                  Hollow Hold Time (seconds)
                </Label>
                <Input
                  id="core"
                  type="number"
                  placeholder="e.g., 30"
                  value={coreHoldTime}
                  onChange={(e) => setCoreHoldTime(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="weighted" className="text-[#A4ACB8]">
                  Weighted Pull-Up (lbs added)
                </Label>
                <Input
                  id="weighted"
                  type="number"
                  placeholder="e.g., 45"
                  value={weightedPullUp}
                  onChange={(e) => setWeightedPullUp(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] mt-1"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Optional - improves accuracy of assessment
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
                  Calculate Readiness
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
                {/* Closest Skill Highlight */}
                <div className="text-center mb-6 p-4 bg-[#C1121F]/10 rounded-lg border border-[#C1121F]/20">
                  <p className="text-xs text-[#6B7280] mb-1">Closest Skill</p>
                  <p className="text-xl font-bold text-[#C1121F]">{result.closestSkill}</p>
                </div>
                
                {/* Skill Readiness Cards */}
                <div className="space-y-4 mb-6">
                  {[
                    { name: 'Front Lever', data: result.frontLever, href: '/skills/front-lever' },
                    { name: 'Planche', data: result.planche, href: '/skills/planche' },
                    { name: 'Muscle-Up', data: result.muscleUp, href: '/skills/muscle-up' },
                  ].map((skill) => (
                    <div key={skill.name} className="bg-[#0F1115] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-[#E6E9EF]">{skill.name}</span>
                        <span className={cn('text-lg font-bold', getScoreColor(skill.data.score))}>
                          {skill.data.score}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#2B313A] rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-[#C1121F] transition-all duration-500"
                          style={{ width: `${skill.data.score}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge className={getStatusColor(skill.data.status)}>
                          {skill.data.status}
                        </Badge>
                        <Link 
                          href={skill.href}
                          className="text-xs text-[#C1121F] hover:underline flex items-center gap-1"
                        >
                          Learn more <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-2">{skill.data.nextStep}</p>
                    </div>
                  ))}
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
                <Target className="w-12 h-12 text-[#2B313A] mb-4" />
                <h3 className="text-lg font-medium text-[#E6E9EF] mb-2">
                  Enter Your Stats
                </h3>
                <p className="text-sm text-[#6B7280] max-w-xs">
                  Fill in your strength metrics to see readiness for each skill.
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

        {/* Detailed Calculators */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-4">Detailed Skill Calculators</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            For more detailed readiness assessments with specific recommendations:
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/front-lever-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Front Lever Calculator</h3>
                <p className="text-xs text-[#6B7280]">In-depth pulling assessment</p>
              </Card>
            </Link>
            <Link href="/planche-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Planche Calculator</h3>
                <p className="text-xs text-[#6B7280]">In-depth pushing assessment</p>
              </Card>
            </Link>
            <Link href="/muscle-up-readiness-calculator">
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-colors cursor-pointer">
                <h3 className="font-medium text-[#E6E9EF] mb-1">Muscle-Up Calculator</h3>
                <p className="text-xs text-[#6B7280]">Explosive pull assessment</p>
              </Card>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section>
          <Card className="bg-gradient-to-r from-[#C1121F]/10 to-[#1A1F26] border-[#C1121F]/20 p-6 text-center">
            <h2 className="text-lg font-bold text-[#E6E9EF] mb-2">
              Ready to Start Training?
            </h2>
            <p className="text-sm text-[#A4ACB8] mb-4">
              Build a personalized program based on your skill goals.
            </p>
            <Link href="/calisthenics-program-builder">
              <Button className="bg-[#C1121F] hover:bg-[#A50E1A] text-white">
                Create Your Program
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </section>
      </div>
    </main>
  )
}
