'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { 
  Calculator, 
  Info, 
  Check, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { 
  calculateBodyFat, 
  MEASUREMENT_INSTRUCTIONS,
  type BodyFatInputs,
  type BodyFatResult,
  type Sex
} from '@/lib/body-fat-calculator'

interface BodyFatCalculatorProps {
  sex: Sex
  onResult: (percent: number) => void
  onCancel: () => void
  embedded?: boolean
}

export function BodyFatCalculator({ 
  sex, 
  onResult, 
  onCancel,
  embedded = false 
}: BodyFatCalculatorProps) {
  const [height, setHeight] = useState('')
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  const [result, setResult] = useState<BodyFatResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isFemale = sex === 'female'

  const handleCalculate = () => {
    setError(null)
    
    const heightNum = parseFloat(height)
    const neckNum = parseFloat(neck)
    const waistNum = parseFloat(waist)
    const hipNum = isFemale ? parseFloat(hip) : 0

    // Validate inputs
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
  }

  const handleUseResult = () => {
    if (result) {
      onResult(result.bodyFatPercent)
    }
  }

  // Result view
  if (result) {
    return (
      <div className={embedded ? '' : 'p-4'}>
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C1121F]/10">
            <span className="text-2xl font-bold text-[#C1121F]">{result.bodyFatPercent}%</span>
          </div>
          
          <div>
            <p className="text-[#E6E9EF] font-medium">{result.description}</p>
            <p className="text-sm text-[#6B7280] mt-1">
              Estimated using the U.S. Navy method
            </p>
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalculate
            </Button>
            <Button
              onClick={handleUseResult}
              className="bg-[#C1121F] hover:bg-[#C1121F]/90 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Use Result
            </Button>
          </div>

          <button 
            onClick={onCancel}
            className="text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          >
            Skip instead
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'p-4'}>
      <div className="space-y-4">
        {/* Instructions Toggle */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center gap-2 text-sm text-[#4F6D8A] hover:text-[#6B8FAD] transition-colors w-full"
        >
          <Info className="w-4 h-4" />
          <span>How to measure</span>
          {showInstructions ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>

        {/* Instructions Panel */}
        {showInstructions && (
          <Card className="bg-[#0F1115] border-[#2B313A] p-4">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#A4ACB8] font-medium">{MEASUREMENT_INSTRUCTIONS.neck.title}</p>
                <p className="text-[#6B7280]">{MEASUREMENT_INSTRUCTIONS.neck.instruction}</p>
              </div>
              <div>
                <p className="text-[#A4ACB8] font-medium">{MEASUREMENT_INSTRUCTIONS.waist.title}</p>
                <p className="text-[#6B7280]">{MEASUREMENT_INSTRUCTIONS.waist.instruction}</p>
              </div>
              {isFemale && (
                <div>
                  <p className="text-[#A4ACB8] font-medium">{MEASUREMENT_INSTRUCTIONS.hip.title}</p>
                  <p className="text-[#6B7280]">{MEASUREMENT_INSTRUCTIONS.hip.instruction}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Input Fields */}
        <div className="space-y-3">
          <div>
            <Label className="text-[#A4ACB8] text-sm">Height (inches)</Label>
            <Input
              type="number"
              placeholder="e.g. 70"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
            />
            <p className="text-xs text-[#6B7280] mt-1">5'10" = 70 inches</p>
          </div>

          <div>
            <Label className="text-[#A4ACB8] text-sm">Neck circumference (inches)</Label>
            <Input
              type="number"
              placeholder="e.g. 15"
              value={neck}
              onChange={(e) => setNeck(e.target.value)}
              className="mt-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
            />
          </div>

          <div>
            <Label className="text-[#A4ACB8] text-sm">Waist circumference (inches)</Label>
            <Input
              type="number"
              placeholder="e.g. 32"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              className="mt-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
            />
          </div>

          {isFemale && (
            <div>
              <Label className="text-[#A4ACB8] text-sm">Hip circumference (inches)</Label>
              <Input
                type="number"
                placeholder="e.g. 38"
                value={hip}
                onChange={(e) => setHip(e.target.value)}
                className="mt-1 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCalculate}
            className="flex-1 bg-[#C1121F] hover:bg-[#C1121F]/90 text-white"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate
          </Button>
        </div>
      </div>
    </div>
  )
}
