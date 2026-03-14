'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  ArrowLeft,
  Check,
  AlertTriangle,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
} from 'lucide-react'
import { swapExercise, type ExerciseSwapResult } from '@/lib/program-adjustment-engine'
import type { EquipmentType } from '@/lib/adaptive-exercise-pool'

interface ExerciseReplacementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseId: string
  exerciseName: string
  availableEquipment: EquipmentType[]
  onReplace: (newExerciseId: string) => void
}

type SwapReason = 'dislike' | 'equipment' | 'too_hard' | 'too_easy' | 'injury'

const SWAP_REASONS: { value: SwapReason; label: string; description: string }[] = [
  { value: 'dislike', label: 'I prefer a different exercise', description: 'Replace with similar movement pattern' },
  { value: 'equipment', label: 'I don\'t have the equipment', description: 'Find bodyweight or alternative equipment version' },
  { value: 'too_hard', label: 'It\'s too difficult right now', description: 'Regress to an easier variation' },
  { value: 'too_easy', label: 'It\'s too easy', description: 'Progress to a harder variation' },
  { value: 'injury', label: 'It causes discomfort', description: 'Find a joint-friendly alternative' },
]

type ModalView = 'reason' | 'alternatives' | 'confirm'

export function ExerciseReplacementModal({
  open,
  onOpenChange,
  exerciseId,
  exerciseName,
  availableEquipment,
  onReplace,
}: ExerciseReplacementModalProps) {
  const [view, setView] = useState<ModalView>('reason')
  const [selectedReason, setSelectedReason] = useState<SwapReason | null>(null)
  const [swapResult, setSwapResult] = useState<ExerciseSwapResult | null>(null)
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null)

  const handleReasonSelect = (reason: SwapReason) => {
    setSelectedReason(reason)
    const result = swapExercise(exerciseId, reason, availableEquipment)
    setSwapResult(result)
    setSelectedAlternative(result.newExercise)
    setView('alternatives')
  }

  const handleConfirm = () => {
    if (selectedAlternative) {
      onReplace(selectedAlternative)
      handleClose()
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state
    setTimeout(() => {
      setView('reason')
      setSelectedReason(null)
      setSwapResult(null)
      setSelectedAlternative(null)
    }, 200)
  }

  const handleBack = () => {
    if (view === 'confirm') {
      setView('alternatives')
    } else if (view === 'alternatives') {
      setView('reason')
      setSelectedReason(null)
      setSwapResult(null)
    }
  }

  const getDifficultyIndicator = (reason: SwapReason) => {
    switch (reason) {
      case 'too_easy':
        return <TrendingUp className="w-4 h-4 text-[#C1121F]" />
      case 'too_hard':
        return <TrendingDown className="w-4 h-4 text-[#4F6D8A]" />
      default:
        return <Minus className="w-4 h-4 text-[#6B7280]" />
    }
  }

  const renderReasonView = () => (
    <div className="space-y-4">
      <p className="text-sm text-[#A4ACB8]">
        Why do you want to replace <span className="font-medium text-[#E6E9EF]">{exerciseName}</span>?
      </p>

      <div className="space-y-2">
        {SWAP_REASONS.map((reason) => (
          <button
            key={reason.value}
            onClick={() => handleReasonSelect(reason.value)}
            className="w-full flex items-center gap-4 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]/50 hover:border-[#C1121F]/30 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[#2B313A]/50 flex items-center justify-center shrink-0">
              {getDifficultyIndicator(reason.value)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-[#E6E9EF]">{reason.label}</h4>
              <p className="text-xs text-[#6B7280]">{reason.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const renderAlternativesView = () => {
    if (!swapResult) return null

    const alternatives = [swapResult.newExercise, ...swapResult.alternativeOptions]
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .slice(0, 5)

    return (
      <div className="space-y-4">
        <div className="p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]/50">
          <p className="text-xs text-[#6B7280]">{swapResult.swapReason}</p>
        </div>

        <div className="space-y-2">
          {alternatives.map((altId) => {
            const isSelected = selectedAlternative === altId
            const isRecommended = altId === swapResult.newExercise
            const displayName = altId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

            return (
              <button
                key={altId}
                onClick={() => setSelectedAlternative(altId)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                  isSelected 
                    ? 'bg-[#C1121F]/10 border-[#C1121F]/50' 
                    : 'bg-[#0F1115] border-[#2B313A]/50 hover:border-[#2B313A]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-[#C1121F]/20' : 'bg-[#2B313A]/50'
                }`}>
                  <Dumbbell className={`w-5 h-5 ${isSelected ? 'text-[#C1121F]' : 'text-[#A4ACB8]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-[#E6E9EF]">{displayName}</h4>
                    {isRecommended && (
                      <Badge variant="outline" className="text-[10px] border-[#C1121F]/30 text-[#C1121F]">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {isRecommended ? 'Best match for your level and equipment' : 'Alternative option'}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-[#C1121F] shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {/* Progression continuity note */}
        {swapResult.progressionContinuity && (
          <div className="flex items-center gap-2 p-3 bg-[#1A2F1A]/30 border border-[#2D5A2D]/30 rounded-lg">
            <Shield className="w-4 h-4 text-[#4ADE80]" />
            <span className="text-xs text-[#4ADE80]">
              Your progression history will be preserved
            </span>
          </div>
        )}

        <Button
          onClick={() => setView('confirm')}
          disabled={!selectedAlternative}
          className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white disabled:opacity-50"
        >
          Continue with Selection
        </Button>
      </div>
    )
  }

  const renderConfirmView = () => {
    if (!selectedAlternative || !swapResult) return null

    const displayName = selectedAlternative.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-[#2B313A]/50 rounded-lg">
              <span className="text-sm text-[#6B7280] line-through">{exerciseName}</span>
            </div>
            <RefreshCw className="w-4 h-4 text-[#A4ACB8]" />
            <div className="p-2 bg-[#C1121F]/10 rounded-lg border border-[#C1121F]/30">
              <span className="text-sm font-medium text-[#E6E9EF]">{displayName}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]/50">
          <h4 className="text-xs font-medium text-[#A4ACB8] mb-2">What happens next:</h4>
          <ul className="space-y-2 text-xs text-[#6B7280]">
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#4ADE80] mt-0.5 shrink-0" />
              <span>Exercise replaced in your current program</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#4ADE80] mt-0.5 shrink-0" />
              <span>Progression tracking continues from current level</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-[#4ADE80] mt-0.5 shrink-0" />
              <span>All other program settings remain unchanged</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleConfirm}
            className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
          >
            Confirm Replacement
          </Button>
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-[#6B7280]"
          >
            Choose Different Exercise
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {view !== 'reason' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="w-8 h-8 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-[#E6E9EF]">
              {view === 'reason' && 'Replace Exercise'}
              {view === 'alternatives' && 'Choose Alternative'}
              {view === 'confirm' && 'Confirm Replacement'}
            </DialogTitle>
          </div>
          {view === 'reason' && (
            <DialogDescription className="text-[#6B7280]">
              SpartanLab will find the best alternative that matches your program
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="pt-2">
          {view === 'reason' && renderReasonView()}
          {view === 'alternatives' && renderAlternativesView()}
          {view === 'confirm' && renderConfirmView()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
