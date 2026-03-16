'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  MoreVertical, 
  RefreshCw, 
  SkipForward, 
  TrendingUp, 
  TrendingDown,
  Check,
  Undo2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import type { AdaptiveExercise } from '@/lib/adaptive-program-builder'
import {
  getReplacementOptions,
  getProgressionOptions,
  addOverride,
  removeOverride,
  getOverrideForExercise,
  type ReplacementOption,
  type ProgressionOption,
  type ExerciseOverride,
} from '@/lib/exercise-override-service'

// =============================================================================
// TYPES
// =============================================================================

interface ExerciseOptionsMenuProps {
  exercise: AdaptiveExercise
  exerciseIndex: number
  sessionId: string
  onReplace: (newExercise: { id: string; name: string }) => void
  onSkip: () => void
  onProgressionChange: (newProgression: { id: string; name: string }) => void
  onUndo: () => void
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExerciseOptionsMenu({
  exercise,
  exerciseIndex,
  sessionId,
  onReplace,
  onSkip,
  onProgressionChange,
  onUndo,
}: ExerciseOptionsMenuProps) {
  const { toast } = useToast()
  const [showReplacementSheet, setShowReplacementSheet] = useState(false)
  const [showProgressionSheet, setShowProgressionSheet] = useState(false)
  const [replacementOptions, setReplacementOptions] = useState<ReplacementOption[]>([])
  const [progressionOptions, setProgressionOptions] = useState<ProgressionOption[]>([])
  
  // Check for existing override
  const existingOverride = getOverrideForExercise(sessionId, exercise.id || exercise.name)
  const hasOverride = !!existingOverride
  
  // Handle opening replacement sheet
  const handleOpenReplacements = () => {
    const options = getReplacementOptions(exercise)
    setReplacementOptions(options)
    setShowReplacementSheet(true)
  }
  
  // Handle opening progression sheet
  const handleOpenProgressions = () => {
    const options = getProgressionOptions(exercise)
    setProgressionOptions(options)
    setShowProgressionSheet(true)
  }
  
  // Handle selecting a replacement
  const handleSelectReplacement = (option: ReplacementOption) => {
    const override: ExerciseOverride = {
      originalExerciseId: exercise.id || exercise.name,
      originalExerciseName: exercise.name,
      overrideType: 'replaced',
      newExerciseId: option.id,
      newExerciseName: option.name,
      reason: option.reason,
      timestamp: Date.now(),
    }
    
    addOverride(sessionId, override)
    onReplace({ id: option.id, name: option.name })
    setShowReplacementSheet(false)
    
    toast({
      title: 'Exercise replaced',
      description: `Switched to ${option.name}`,
      duration: 2000,
    })
  }
  
  // Handle skip
  const handleSkip = () => {
    const override: ExerciseOverride = {
      originalExerciseId: exercise.id || exercise.name,
      originalExerciseName: exercise.name,
      overrideType: 'skipped',
      timestamp: Date.now(),
    }
    
    addOverride(sessionId, override)
    onSkip()
    
    toast({
      title: 'Exercise skipped',
      description: `${exercise.name} will be logged as skipped`,
      duration: 2000,
    })
  }
  
  // Handle progression change
  const handleProgressionChange = (option: ProgressionOption) => {
    const override: ExerciseOverride = {
      originalExerciseId: exercise.id || exercise.name,
      originalExerciseName: exercise.name,
      overrideType: 'progression_adjusted',
      newExerciseId: option.id,
      newProgression: option.name,
      reason: option.direction === 'easier' ? 'Reduced difficulty' : 'Increased difficulty',
      timestamp: Date.now(),
    }
    
    addOverride(sessionId, override)
    onProgressionChange({ id: option.id, name: option.name })
    setShowProgressionSheet(false)
    
    toast({
      title: 'Progression adjusted',
      description: `Changed to ${option.name} (${option.direction})`,
      duration: 2000,
    })
  }
  
  // Handle undo
  const handleUndo = () => {
    removeOverride(sessionId, exercise.id || exercise.name)
    onUndo()
    
    toast({
      title: 'Change undone',
      description: `Restored ${exercise.name}`,
      duration: 2000,
    })
  }
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#6B7280] hover:text-[#E6E9EF] hover:bg-[#2B313A]"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-[#1A1F26] border-[#2B313A]"
        >
          {hasOverride ? (
            <>
              <DropdownMenuItem
                onClick={handleUndo}
                className="text-[#F59E0B] focus:text-[#F59E0B] focus:bg-[#F59E0B]/10"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Undo Change
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2B313A]" />
            </>
          ) : null}
          
          <DropdownMenuItem
            onClick={handleOpenReplacements}
            className="text-[#E6E9EF] focus:text-[#E6E9EF] focus:bg-[#2B313A]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Replace Exercise
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={handleSkip}
            className="text-[#E6E9EF] focus:text-[#E6E9EF] focus:bg-[#2B313A]"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Exercise
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-[#2B313A]" />
          
          <DropdownMenuItem
            onClick={handleOpenProgressions}
            className="text-[#E6E9EF] focus:text-[#E6E9EF] focus:bg-[#2B313A]"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Adjust Progression
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Replacement Sheet */}
      <Sheet open={showReplacementSheet} onOpenChange={setShowReplacementSheet}>
        <SheetContent 
          side="bottom" 
          className="bg-[#0F1115] border-t border-[#2B313A] max-h-[70vh] rounded-t-xl"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-[#E6E9EF]">
              Replace {exercise.name}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-2 overflow-y-auto max-h-[50vh] pb-4">
            {replacementOptions.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">
                No replacement options available for this exercise.
              </p>
            ) : (
              replacementOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectReplacement(option)}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-[#1A1F26] border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#E6E9EF]">{option.name}</span>
                      {option.isRecommended && (
                        <Badge className="bg-[#C1121F]/20 text-[#C1121F] border-0 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1">{option.reason}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="border-[#2B313A] text-[#A4ACB8] ml-2 capitalize"
                  >
                    {option.difficulty}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Progression Sheet */}
      <Sheet open={showProgressionSheet} onOpenChange={setShowProgressionSheet}>
        <SheetContent 
          side="bottom" 
          className="bg-[#0F1115] border-t border-[#2B313A] max-h-[50vh] rounded-t-xl"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-[#E6E9EF]">
              Adjust Progression for {exercise.name}
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-2 pb-4">
            {progressionOptions.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">
                No progression options available for this exercise.
              </p>
            ) : (
              <>
                {/* Easier options */}
                {progressionOptions.filter(o => o.direction === 'easier').length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide px-1">
                      Easier
                    </p>
                    {progressionOptions
                      .filter(o => o.direction === 'easier')
                      .map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleProgressionChange(option)}
                          className="w-full flex items-center justify-between p-4 rounded-lg bg-[#1A1F26] border border-[#2B313A] hover:border-emerald-500/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <ArrowDown className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="font-medium text-[#E6E9EF]">{option.name}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="border-emerald-500/30 text-emerald-400 capitalize"
                          >
                            {option.difficultyLevel}
                          </Badge>
                        </button>
                      ))}
                  </div>
                )}
                
                {/* Harder options */}
                {progressionOptions.filter(o => o.direction === 'harder').length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide px-1">
                      Harder
                    </p>
                    {progressionOptions
                      .filter(o => o.direction === 'harder')
                      .map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleProgressionChange(option)}
                          className="w-full flex items-center justify-between p-4 rounded-lg bg-[#1A1F26] border border-[#2B313A] hover:border-[#C1121F]/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#C1121F]/20 flex items-center justify-center">
                              <ArrowUp className="w-4 h-4 text-[#C1121F]" />
                            </div>
                            <span className="font-medium text-[#E6E9EF]">{option.name}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="border-[#C1121F]/30 text-[#C1121F] capitalize"
                          >
                            {option.difficultyLevel}
                          </Badge>
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
