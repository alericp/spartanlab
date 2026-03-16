'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Shield, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GateCheckResult } from '@/lib/prerequisite-gate-engine'

interface ExerciseOverrideWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gateResult: GateCheckResult
  originalExerciseName: string
  targetExerciseName: string
  onUseRecommended: () => void
  onOverrideAnyway: () => void
}

export function ExerciseOverrideWarningDialog({
  open,
  onOpenChange,
  gateResult,
  originalExerciseName,
  targetExerciseName,
  onUseRecommended,
  onOverrideAnyway,
}: ExerciseOverrideWarningDialogProps) {
  const riskColors = {
    moderate: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-500',
      icon: 'text-amber-500',
    },
    high: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-500',
      icon: 'text-orange-500',
    },
    very_high: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-500',
      icon: 'text-red-500',
    },
  }

  const risk = gateResult.overrideRiskLevel || 'moderate'
  const colors = riskColors[risk]

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#1A1A1A] border-[#2B313A] text-[#E6E9EF] max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('p-2 rounded-full', colors.bg)}>
              <AlertTriangle className={cn('w-5 h-5', colors.icon)} />
            </div>
            <AlertDialogTitle className="text-[#F5F5F5]">
              Exercise Override Warning
            </AlertDialogTitle>
          </div>
          
          <AlertDialogDescription className="text-[#A5A5A5] space-y-4">
            <p>
              You are attempting to select <span className="text-[#E6E9EF] font-medium">{targetExerciseName}</span>, 
              but this exercise may exceed your current readiness level.
            </p>
            
            {/* Warning message from gate */}
            {gateResult.warningMessage && (
              <div className={cn('p-3 rounded-lg border', colors.bg, colors.border)}>
                <p className="text-sm text-[#E6E9EF]">{gateResult.warningMessage}</p>
              </div>
            )}
            
            {/* Failed prerequisites */}
            {gateResult.failedPrerequisites && gateResult.failedPrerequisites.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Prerequisites Not Met:
                </p>
                <ul className="space-y-1.5">
                  {gateResult.failedPrerequisites.map((prereq, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-[#4F6D8A] shrink-0 mt-0.5" />
                      <span className="text-[#A5A5A5]">{prereq.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recommended substitute */}
            {gateResult.recommendedSubstitute && (
              <div className="p-3 rounded-lg bg-[#4F6D8A]/10 border border-[#4F6D8A]/30">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-[#4F6D8A]" />
                  <span className="text-xs font-medium text-[#4F6D8A] uppercase tracking-wide">
                    SpartanLab Recommends
                  </span>
                </div>
                <p className="text-sm text-[#E6E9EF] font-medium">
                  {gateResult.recommendedSubstitute.exerciseName}
                </p>
                <p className="text-xs text-[#A5A5A5] mt-1">
                  {gateResult.recommendedSubstitute.reason}
                </p>
              </div>
            )}
            
            {/* Knowledge bubble */}
            {gateResult.knowledgeBubble && (
              <div className="flex items-start gap-2 p-2 rounded bg-[#1F1F1F]">
                <Info className="w-4 h-4 text-[#6B7280] shrink-0 mt-0.5" />
                <p className="text-xs text-[#6B7280]">{gateResult.knowledgeBubble}</p>
              </div>
            )}
            
            {/* Risk level indicator */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#2B313A]">
              <span className="text-xs text-[#6B7280]">Override Risk:</span>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                colors.bg,
                colors.text
              )}>
                {risk === 'very_high' ? 'Very High' : risk.charAt(0).toUpperCase() + risk.slice(1)}
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          {gateResult.recommendedSubstitute && (
            <AlertDialogAction
              onClick={onUseRecommended}
              className="w-full bg-[#4F6D8A] hover:bg-[#5D7D9A] text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Use Recommended: {gateResult.recommendedSubstitute.exerciseName}
            </AlertDialogAction>
          )}
          
          <AlertDialogCancel
            onClick={onOverrideAnyway}
            className={cn(
              'w-full border-[#2B313A] bg-transparent hover:bg-[#2B313A] text-[#A5A5A5]',
              risk === 'very_high' && 'border-red-500/30 hover:border-red-500/50'
            )}
          >
            Override Anyway
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Knowledge Bubble Component
 * Small inline tooltip for gated exercises
 */
interface KnowledgeBubbleProps {
  content: string
  className?: string
}

export function KnowledgeBubble({ content, className }: KnowledgeBubbleProps) {
  return (
    <div className={cn(
      'flex items-start gap-2 p-2 rounded-md bg-[#1F1F1F]/50 border border-[#2B313A]/50',
      className
    )}>
      <Info className="w-3.5 h-3.5 text-[#4F6D8A] shrink-0 mt-0.5" />
      <p className="text-xs text-[#6B7280] leading-relaxed">{content}</p>
    </div>
  )
}

/**
 * Gate Status Badge
 * Shows if an exercise passed or failed prerequisite checks
 */
interface GateStatusBadgeProps {
  gateResult: GateCheckResult
  showDetails?: boolean
  className?: string
}

export function GateStatusBadge({ gateResult, showDetails, className }: GateStatusBadgeProps) {
  if (gateResult.allowed) {
    return null // Don't show badge if allowed
  }

  const risk = gateResult.overrideRiskLevel || 'moderate'
  const riskColors = {
    moderate: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    very_high: 'bg-red-500/10 text-red-500 border-red-500/30',
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border',
      riskColors[risk],
      className
    )}>
      <AlertTriangle className="w-3 h-3" />
      <span>Prerequisites Required</span>
      {showDetails && gateResult.failedPrerequisites && (
        <span className="opacity-70">
          ({gateResult.failedPrerequisites.length})
        </span>
      )}
    </div>
  )
}
