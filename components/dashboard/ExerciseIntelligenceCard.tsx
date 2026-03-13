'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Target, Dumbbell, CheckCircle2 } from 'lucide-react'
import type { ExerciseScore } from '@/lib/exercise-intelligence-engine'

interface ExerciseIntelligenceCardProps {
  selectedExercises?: ExerciseScore[]
  explanation?: string
  adjustments?: string[]
  compact?: boolean
}

export function ExerciseIntelligenceCard({
  selectedExercises = [],
  explanation,
  adjustments = [],
  compact = false,
}: ExerciseIntelligenceCardProps) {
  if (selectedExercises.length === 0 && !explanation) {
    return null
  }

  if (compact) {
    return (
      <Card className="bg-[#1A1F26]/80 border-[#2B313A]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-[#C1121F]" />
            <span className="text-sm font-medium text-[#E6E9EF]">
              Smart Selection
            </span>
          </div>
          <p className="text-xs text-[#A4ACB8]">
            {explanation || 'Exercises tailored to your goals and recovery.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F26]/80 border-[#2B313A]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-[#C1121F]" />
          <span className="text-[#E6E9EF]">Exercise Intelligence</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {explanation && (
          <p className="text-sm text-[#A4ACB8]">{explanation}</p>
        )}
        
        {selectedExercises.length > 0 && (
          <div className="space-y-2">
            {selectedExercises.slice(0, 3).map((score) => (
              <div 
                key={score.exerciseId}
                className="flex items-center justify-between py-2 border-b border-[#2B313A] last:border-0"
              >
                <div className="flex items-center gap-2">
                  {score.isRecommended ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Target className="h-4 w-4 text-[#A4ACB8]" />
                  )}
                  <span className="text-sm text-[#E6E9EF]">
                    {score.exercise.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs border-[#2B313A] text-[#A4ACB8]"
                  >
                    {score.selectionReason}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {adjustments.length > 0 && (
          <div className="pt-2 border-t border-[#2B313A]">
            <p className="text-xs text-[#A4ACB8] mb-2">Adjustments made:</p>
            <div className="flex flex-wrap gap-1">
              {adjustments.map((adj, i) => (
                <Badge 
                  key={i}
                  variant="secondary"
                  className="text-xs bg-[#2B313A] text-[#A4ACB8]"
                >
                  {adj}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
