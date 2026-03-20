'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calculator, Dumbbell, ArrowRight, Info, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BackNav } from '@/components/navigation/BackNav'
import { ToolConversionCardStatic } from '@/components/tools/ToolConversionCardStatic'
import { trackToolUsed } from '@/lib/analytics'
import {
  calculateOneRepMaxResult,
  generateWorkingWeightTable,
  getRelativeStrengthLevel,
  OneRepMaxResult,
  WorkingWeightTable,
  LiftConfig,
} from '@/lib/strength/one-rep-max'

interface OneRepMaxCalculatorProps {
  config: LiftConfig
}

export default function OneRepMaxCalculator({ config }: OneRepMaxCalculatorProps) {

  // Inputs
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [bodyweight, setBodyweight] = useState('')
  
  // Results
  const [result, setResult] = useState<OneRepMaxResult | null>(null)
  const [workingWeights, setWorkingWeights] = useState<WorkingWeightTable[] | null>(null)

  const calculate = () => {
    const w = parseFloat(weight)
    const r = parseInt(reps)
    const bw = config.requiresBodyweight ? parseFloat(bodyweight) : undefined

    if (isNaN(w) || isNaN(r) || r < 1 || r > 15) {
      return
    }

    if (config.requiresBodyweight && (isNaN(bw!) || bw! <= 0)) {
      return
    }

    const calcResult = calculateOneRepMaxResult({
      weight: w,
      reps: r,
      bodyweight: bw,
    })

    setResult(calcResult)
    setWorkingWeights(generateWorkingWeightTable(calcResult.oneRepMax))

    // Track for analytics
    trackToolUsed(`1rm_calculator_${config.id}`, {
      estimated_1rm: calcResult.oneRepMax,
      relative_strength: calcResult.relativeStrength,
    })
  }

  const strengthLevel = result?.relativeStrength 
    ? getRelativeStrengthLevel(result.relativeStrength, config.id)
    : null

  return (
    <main className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <BackNav href="/calculators/1rm" label="Back to 1RM Calculators" />

        {/* Hero */}
        <section className="py-12 text-center border-b border-[#2B313A]">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C1121F]/10 rounded-full text-sm text-[#C1121F] mb-6">
            <Calculator className="w-4 h-4" />
            Free Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-4">
            {config.seoTitle}
          </h1>
          <p className="text-lg text-[#A4ACB8] max-w-2xl mx-auto">
            {config.description}
          </p>
        </section>

        {/* Calculator */}
        <section className="py-12">
          <div className="bg-[#1A1F26] rounded-xl border border-[#2B313A] p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#C1121F]" />
              Calculate Your 1RM
            </h2>

            <div className="space-y-4 mb-6">
              {/* Bodyweight Input (for weighted exercises) */}
              {config.requiresBodyweight && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bodyweight (lbs)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 175"
                    value={bodyweight}
                    onChange={(e) => setBodyweight(e.target.value)}
                    className="bg-[#0F1115] border-[#2B313A]"
                  />
                </div>
              )}

              {/* Weight Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {config.requiresBodyweight ? 'Added Weight (lbs)' : 'Weight Lifted (lbs)'}
                </label>
                <Input
                  type="number"
                  placeholder={config.requiresBodyweight ? 'e.g. 45' : 'e.g. 225'}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A]"
                />
              </div>

              {/* Reps Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reps Completed
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  min="1"
                  max="15"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="bg-[#0F1115] border-[#2B313A]"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Most accurate with 1-10 reps
                </p>
              </div>
            </div>

            <Button
              onClick={calculate}
              className="w-full bg-[#C1121F] hover:bg-[#A10E1A]"
            >
              Calculate Estimated 1RM
            </Button>

            {/* Results */}
            {result && (
              <div className="mt-6 space-y-4">
                {/* Main Result */}
                <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sm text-[#6B7280] mb-1">Estimated 1RM</div>
                      <div className="text-3xl font-bold text-[#E6E9EF]">
                        {result.oneRepMax} lbs
                      </div>
                      {config.requiresBodyweight && (
                        <div className="text-sm text-[#A4ACB8] mt-1">
                          Total system load (BW + added)
                        </div>
                      )}
                    </div>
                    {config.requiresBodyweight && result.addedWeight1RM !== undefined && (
                      <div>
                        <div className="text-sm text-[#6B7280] mb-1">Added Weight 1RM</div>
                        <div className="text-3xl font-bold text-[#C1121F]">
                          +{result.addedWeight1RM} lbs
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Relative Strength (for weighted exercises) */}
                  {result.relativeStrength !== undefined && strengthLevel && (
                    <div className="mt-4 pt-4 border-t border-[#2B313A]">
                      <div className="text-sm text-[#6B7280] mb-1">Relative Strength</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">+{result.relativeStrength}% BW</span>
                        <Badge variant="outline" className={`${strengthLevel.color} border-current`}>
                          {strengthLevel.level}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Working Weights */}
                <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                  <h3 className="font-semibold text-[#E6E9EF] mb-4">Recommended Working Weights</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-[#1A1F26] rounded-lg">
                      <div className="text-xs text-[#6B7280] mb-1">70% (Hypertrophy)</div>
                      <div className="text-lg font-bold text-[#E6E9EF]">{result.hypertrophyLoad} lbs</div>
                    </div>
                    <div className="text-center p-3 bg-[#1A1F26] rounded-lg">
                      <div className="text-xs text-[#6B7280] mb-1">80% (Strength)</div>
                      <div className="text-lg font-bold text-[#E6E9EF]">{result.strengthLoad} lbs</div>
                    </div>
                    <div className="text-center p-3 bg-[#1A1F26] rounded-lg">
                      <div className="text-xs text-[#6B7280] mb-1">85% (Heavy)</div>
                      <div className="text-lg font-bold text-[#E6E9EF]">{result.heavyLoad} lbs</div>
                    </div>
                    <div className="text-center p-3 bg-[#1A1F26] rounded-lg">
                      <div className="text-xs text-[#6B7280] mb-1">90% (Near-Max)</div>
                      <div className="text-lg font-bold text-[#E6E9EF]">{result.nearMaxLoad} lbs</div>
                    </div>
                  </div>
                </div>

                {/* Full Percentage Table */}
                {workingWeights && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors">
                      View full percentage table
                    </summary>
                    <div className="mt-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {workingWeights.map((item) => (
                          <div key={item.percentage} className="flex justify-between text-sm p-2 bg-[#1A1F26] rounded">
                            <span className="text-[#6B7280]">{item.percentage}%</span>
                            <span className="font-medium text-[#E6E9EF]">{item.weight} lbs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {/* CTA - Save to Profile */}
                <div className="p-4 bg-gradient-to-r from-[#C1121F]/10 to-transparent rounded-lg border border-[#C1121F]/20">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-[#C1121F] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#E6E9EF] mb-1">
                        Want a full program built from your strength?
                      </h4>
                      <p className="text-sm text-[#A4ACB8] mb-3">
                        SpartanLab uses your benchmarks to generate adaptive training programs personalized to your level.
                      </p>
                      <Link href="/onboarding">
                        <Button variant="outline" className="border-[#C1121F] text-[#C1121F] hover:bg-[#C1121F]/10">
                          Generate Your Personalized Plan
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formula Note */}
          <div className="mt-4 flex items-start gap-2 text-sm text-[#6B7280]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Uses the Epley formula: <code className="bg-[#1A1F26] px-1 rounded">1RM = weight × (1 + reps/30)</code>. 
              Most accurate with 1-10 rep sets.
            </p>
          </div>
        </section>

        {/* Strength Standards */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-2">{config.name} Strength Standards</h2>
          <p className="text-[#6B7280] mb-6">
            General benchmarks for {config.name.toLowerCase()} strength levels.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A] text-center">
              <div className="text-sm text-[#6B7280] mb-1">Beginner</div>
              <div className="text-lg font-bold text-[#E6E9EF]">{config.strengthStandards.beginner}</div>
            </div>
            <div className="p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A] text-center">
              <div className="text-sm text-yellow-400 mb-1">Intermediate</div>
              <div className="text-lg font-bold text-[#E6E9EF]">{config.strengthStandards.intermediate}</div>
            </div>
            <div className="p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A] text-center">
              <div className="text-sm text-orange-400 mb-1">Advanced</div>
              <div className="text-lg font-bold text-[#E6E9EF]">{config.strengthStandards.advanced}</div>
            </div>
            <div className="p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A] text-center">
              <div className="text-sm text-[#C1121F] mb-1">Elite</div>
              <div className="text-lg font-bold text-[#E6E9EF]">{config.strengthStandards.elite}</div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">How the Epley Formula Works</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-[#A4ACB8]">
              The Epley formula is one of the most widely used methods for estimating one-rep max from submaximal lifts. 
              It's particularly accurate for sets of 1-10 reps and is used by strength coaches worldwide.
            </p>
            <div className="my-6 p-4 bg-[#1A1F26] rounded-lg border border-[#2B313A]">
              <code className="text-[#C1121F]">1RM = weight × (1 + reps ÷ 30)</code>
            </div>
            {config.requiresBodyweight && (
              <p className="text-[#A4ACB8]">
                For {config.name.toLowerCase()}, your total system load is your bodyweight plus any added weight. 
                This is what your muscles actually have to move, making it the relevant number for 1RM calculations.
              </p>
            )}
          </div>
        </section>

        {/* Why Track This Lift */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Why Track Your {config.name} 1RM?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-[#C1121F] shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF] mb-1">Objective Progress Tracking</h3>
                  <p className="text-sm text-[#6B7280]">
                    Your 1RM gives you a concrete number to track over weeks and months.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-[#C1121F] shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#E6E9EF] mb-1">Program With Precision</h3>
                  <p className="text-sm text-[#6B7280]">
                    Use percentage-based programming to hit the right intensity for your goals.
                  </p>
                </div>
              </div>
            </Card>
            {config.requiresBodyweight && (
              <>
                <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="flex gap-3">
                    <Check className="w-5 h-5 text-[#C1121F] shrink-0" />
                    <div>
                      <h3 className="font-semibold text-[#E6E9EF] mb-1">Predict Skill Readiness</h3>
                      <p className="text-sm text-[#6B7280]">
                        {config.id === 'weighted_pull_up' 
                          ? 'Weighted pull-up strength correlates with front lever and muscle-up potential.'
                          : 'Weighted dip strength correlates with planche and muscle-up transition power.'}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
                  <div className="flex gap-3">
                    <Check className="w-5 h-5 text-[#C1121F] shrink-0" />
                    <div>
                      <h3 className="font-semibold text-[#E6E9EF] mb-1">Relative Strength Benchmark</h3>
                      <p className="text-sm text-[#6B7280]">
                        Compare your strength relative to bodyweight for meaningful progress tracking.
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="py-12 border-t border-[#2B313A]">
          <ToolConversionCardStatic 
            context={config.requiresBodyweight ? 'front-lever' : 'strength-standards'}
            toolData={result ? {
              [`${config.id}_1rm`]: result.oneRepMax,
              bodyweight: config.requiresBodyweight ? parseFloat(bodyweight) : undefined,
            } : undefined}
          />
        </section>

        {/* Related Resources */}
        <section className="py-12 border-t border-[#2B313A]">
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-6">Related Resources</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/calculators/1rm">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] gap-2">
                All 1RM Calculators
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/calisthenics-strength-standards">
              <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] gap-2">
                Strength Standards
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {config.requiresBodyweight && (
              <Link href={config.id === 'weighted_pull_up' ? '/guides/weighted-pull-up-training' : '/guides/weighted-dip-training'}>
                <Button variant="outline" className="border-[#2B313A] hover:bg-[#1A1F26] gap-2">
                  Training Guide
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
