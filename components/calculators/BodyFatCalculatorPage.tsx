'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { 
  Calculator, 
  Info, 
  RefreshCw,
  Ruler,
  ChevronRight,
  User,
  Users
} from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'
import { 
  calculateBodyFat, 
  MEASUREMENT_INSTRUCTIONS,
  type BodyFatInputs,
  type BodyFatResult,
  type Sex
} from '@/lib/body-fat-calculator'

export function BodyFatCalculatorPage() {
  const [sex, setSex] = useState<Sex | null>(null)
  const [height, setHeight] = useState('')
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [result, setResult] = useState<BodyFatResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isFemale = sex === 'female'

  const handleCalculate = () => {
    setError(null)
    
    if (!sex) {
      setError('Please select your sex')
      return
    }

    const heightNum = parseFloat(height)
    const neckNum = parseFloat(neck)
    const waistNum = parseFloat(waist)
    const hipNum = isFemale ? parseFloat(hip) : 0

    if (isNaN(heightNum) || isNaN(neckNum) || isNaN(waistNum)) {
      setError('Please enter all required measurements')
      return
    }

    if (isFemale && isNaN(hipNum)) {
      setError('Please enter hip measurement')
      return
    }

    try {
      const inputs: BodyFatInputs = isFemale 
        ? { sex: 'female', heightInches: heightNum, neckInches: neckNum, waistInches: waistNum, hipInches: hipNum }
        : { sex: 'male', heightInches: heightNum, neckInches: neckNum, waistInches: waistNum }
      
      const calcResult = calculateBodyFat(inputs)
      setResult(calcResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setSex(null)
    setHeight('')
    setNeck('')
    setWaist('')
    setHip('')
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
            Body Fat Calculator
          </h1>
          <p className="text-[#A4ACB8] text-lg max-w-2xl mx-auto">
            Estimate your body fat percentage using the U.S. Navy circumference method - 
            one of the most accurate tape-measure-based methods available.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calculator Card */}
          <Card className="bg-[#0F1115] border-[#2B313A] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-[#C1121F]" />
              <h2 className="text-lg font-semibold text-[#E6E9EF]">Calculate Body Fat</h2>
            </div>

            {result ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#C1121F]/10 border-2 border-[#C1121F]/30">
                  <span className="text-3xl font-bold text-[#C1121F]">{result.bodyFatPercent}%</span>
                </div>
                
                <div>
                  <p className="text-xl text-[#E6E9EF] font-medium">{result.description}</p>
                  <p className="text-sm text-[#6B7280] mt-2">
                    Based on the U.S. Navy body fat formula
                  </p>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Calculate Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sex Selection */}
                <div>
                  <Label className="text-[#A4ACB8] text-sm">Sex</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={sex === 'male' ? 'default' : 'outline'}
                      onClick={() => setSex('male')}
                      className={sex === 'male' 
                        ? 'bg-[#C1121F] hover:bg-[#C1121F]/90 text-white' 
                        : 'border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]'
                      }
                    >
                      <User className="w-4 h-4 mr-2" />
                      Male
                    </Button>
                    <Button
                      variant={sex === 'female' ? 'default' : 'outline'}
                      onClick={() => setSex('female')}
                      className={sex === 'female' 
                        ? 'bg-[#C1121F] hover:bg-[#C1121F]/90 text-white' 
                        : 'border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]'
                      }
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Female
                    </Button>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <Label className="text-[#A4ACB8] text-sm">Height (inches)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 70 (5'10&quot;)"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="mt-1 bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                  />
                  <p className="text-xs text-[#6B7280] mt-1">
                    5'0" = 60" | 5'6" = 66" | 6'0" = 72"
                  </p>
                </div>

                {/* Neck */}
                <div>
                  <Label className="text-[#A4ACB8] text-sm">Neck circumference (inches)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 15"
                    value={neck}
                    onChange={(e) => setNeck(e.target.value)}
                    className="mt-1 bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                  />
                </div>

                {/* Waist */}
                <div>
                  <Label className="text-[#A4ACB8] text-sm">Waist circumference (inches)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 32"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    className="mt-1 bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                  />
                </div>

                {/* Hip (females only) */}
                {sex === 'female' && (
                  <div>
                    <Label className="text-[#A4ACB8] text-sm">Hip circumference (inches)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 38"
                      value={hip}
                      onChange={(e) => setHip(e.target.value)}
                      className="mt-1 bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF]"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <Button
                  onClick={handleCalculate}
                  className="w-full bg-[#C1121F] hover:bg-[#C1121F]/90 text-white"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Body Fat
                </Button>
              </div>
            )}
          </Card>

          {/* Instructions Card */}
          <div className="space-y-6">
            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="w-5 h-5 text-[#4F6D8A]" />
                <h2 className="text-lg font-semibold text-[#E6E9EF]">How to Measure</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-[#A4ACB8] font-medium">{MEASUREMENT_INSTRUCTIONS.neck.title}</h3>
                  <p className="text-sm text-[#6B7280] mt-1">{MEASUREMENT_INSTRUCTIONS.neck.instruction}</p>
                  <p className="text-xs text-[#4F6D8A] mt-1">{MEASUREMENT_INSTRUCTIONS.neck.tip}</p>
                </div>

                <div>
                  <h3 className="text-[#A4ACB8] font-medium">{MEASUREMENT_INSTRUCTIONS.waist.title}</h3>
                  <p className="text-sm text-[#6B7280] mt-1">{MEASUREMENT_INSTRUCTIONS.waist.instruction}</p>
                  <p className="text-xs text-[#4F6D8A] mt-1">{MEASUREMENT_INSTRUCTIONS.waist.tip}</p>
                </div>

                <div>
                  <h3 className="text-[#A4ACB8] font-medium">{MEASUREMENT_INSTRUCTIONS.hip.title} <span className="text-[#6B7280] font-normal">(women only)</span></h3>
                  <p className="text-sm text-[#6B7280] mt-1">{MEASUREMENT_INSTRUCTIONS.hip.instruction}</p>
                  <p className="text-xs text-[#4F6D8A] mt-1">{MEASUREMENT_INSTRUCTIONS.hip.tip}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-[#0F1115] border-[#2B313A] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-[#4F6D8A]" />
                <h2 className="text-lg font-semibold text-[#E6E9EF]">What Your Result Means</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#A4ACB8] font-medium">Men</p>
                    <ul className="text-[#6B7280] mt-1 space-y-1">
                      <li>2-5%: Essential fat</li>
                      <li>6-13%: Athletes</li>
                      <li>14-17%: Fitness</li>
                      <li>18-24%: Average</li>
                      <li>25%+: Above average</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[#A4ACB8] font-medium">Women</p>
                    <ul className="text-[#6B7280] mt-1 space-y-1">
                      <li>10-13%: Essential fat</li>
                      <li>14-20%: Athletes</li>
                      <li>21-24%: Fitness</li>
                      <li>25-31%: Average</li>
                      <li>32%+: Above average</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* About Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">About the U.S. Navy Method</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-[#A4ACB8]">
              The U.S. Navy body fat formula was developed by the United States Navy as a practical 
              method for estimating body composition. It uses simple circumference measurements that 
              can be taken with just a tape measure, making it accessible for anyone to use at home.
            </p>
            <p className="text-[#A4ACB8] mt-4">
              While not as precise as DEXA scans or hydrostatic weighing, this method provides a 
              reasonably accurate estimate (typically within 3-4% of actual body fat) and is useful 
              for tracking changes over time. The formula accounts for the relationship between body 
              measurements and body fat distribution.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-[#C1121F]/30 p-8">
            <h2 className="text-2xl font-bold text-[#E6E9EF] mb-2">
              Ready to Transform Your Training?
            </h2>
            <p className="text-[#A4ACB8] mb-6 max-w-xl mx-auto">
              SpartanLab uses your body composition data to create personalized calisthenics 
              programs that match your current fitness level.
            </p>
            <Link href="/onboarding">
              <Button className="bg-[#C1121F] hover:bg-[#C1121F]/90 text-white px-8">
                Start Free Training Program
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2B313A] mt-12 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-[#6B7280]">
          <p>This calculator provides an estimate only. Consult a healthcare professional for accurate body composition analysis.</p>
          <p className="mt-2">SpartanLab - Intelligent Calisthenics Training</p>
        </div>
      </footer>
    </div>
  )
}
