'use client'

import { useState, useEffect } from 'react'
import { Clock, ChevronDown, Check, Zap, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TIME_TIERS,
  TIME_TIER_LABELS,
  TIME_TIER_DESCRIPTIONS,
  getSuggestedSessionLength,
  type TimeTier,
} from '@/lib/time-optimization'

interface TimeSelectorProps {
  currentMinutes: number
  defaultMinutes: number
  onTimeChange: (minutes: number) => void
  compact?: boolean
  className?: string
}

export function TimeSelector({
  currentMinutes,
  defaultMinutes,
  onTimeChange,
  compact = false,
  className,
}: TimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggested, setSuggested] = useState<{ tier: TimeTier; reason: string } | null>(null)
  
  useEffect(() => {
    // Get suggested time on mount
    const suggestion = getSuggestedSessionLength()
    setSuggested(suggestion)
  }, [])
  
  const isModified = currentMinutes !== defaultMinutes
  
  const getCurrentLabel = () => {
    const tier = TIME_TIERS.find(t => t === currentMinutes)
    if (tier) return TIME_TIER_LABELS[tier]
    return `${currentMinutes} min`
  }
  
  if (compact) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 gap-1.5 px-2 text-xs font-medium',
              isModified && 'text-amber-600 dark:text-amber-400',
              className
            )}
          >
            <Timer className="h-3.5 w-3.5" />
            {currentMinutes}m
            {isModified && <span className="text-[10px]">(adjusted)</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Adjust today&apos;s session time
            </p>
          </div>
          <DropdownMenuSeparator />
          {TIME_TIERS.map((tier) => (
            <DropdownMenuItem
              key={tier}
              onClick={() => {
                onTimeChange(tier)
                setIsOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{TIME_TIER_LABELS[tier]}</span>
              </div>
              {tier === currentMinutes && (
                <Check className="h-4 w-4 text-primary" />
              )}
              {tier === defaultMinutes && tier !== currentMinutes && (
                <span className="text-[10px] text-muted-foreground">default</span>
              )}
            </DropdownMenuItem>
          ))}
          {isModified && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onTimeChange(defaultMinutes)
                  setIsOpen(false)
                }}
                className="text-muted-foreground"
              >
                Reset to default ({defaultMinutes}m)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Available Time</span>
        </div>
        {isModified && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Modified for today
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-5 gap-1.5">
        {TIME_TIERS.map((tier) => {
          const isSelected = tier === currentMinutes
          const isDefault = tier === defaultMinutes
          const isSuggested = suggested?.tier === tier
          
          return (
            <button
              key={tier}
              onClick={() => onTimeChange(tier)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg border p-2 transition-all',
                'hover:border-primary/50 hover:bg-accent/50',
                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/20',
                !isSelected && 'border-border'
              )}
            >
              <span className={cn(
                'text-sm font-semibold',
                isSelected && 'text-primary'
              )}>
                {tier}
              </span>
              <span className="text-[10px] text-muted-foreground">min</span>
              
              {isDefault && !isSelected && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[8px] font-medium">
                  D
                </span>
              )}
              
              {isSuggested && !isSelected && !isDefault && (
                <span className="absolute -top-1 -right-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {TIME_TIER_DESCRIPTIONS[currentMinutes as TimeTier] || 'Custom duration'}
      </p>
      
      {isModified && (
        <button
          onClick={() => onTimeChange(defaultMinutes)}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Reset to default ({defaultMinutes} min)
        </button>
      )}
    </div>
  )
}

// =============================================================================
// INLINE TIME BADGE (for session cards)
// =============================================================================

interface TimeBadgeProps {
  minutes: number
  isOptimized?: boolean
  originalMinutes?: number
  onClick?: () => void
  className?: string
}

export function TimeBadge({
  minutes,
  isOptimized,
  originalMinutes,
  onClick,
  className,
}: TimeBadgeProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
        isOptimized
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-muted text-muted-foreground',
        onClick && 'cursor-pointer hover:bg-accent',
        className
      )}
    >
      <Timer className="h-3 w-3" />
      {minutes}m
      {isOptimized && originalMinutes && (
        <span className="text-[10px] opacity-70">
          (from {originalMinutes}m)
        </span>
      )}
    </button>
  )
}

// =============================================================================
// OPTIMIZATION MESSAGE
// =============================================================================

interface OptimizationMessageProps {
  message: string
  removedCount?: number
  reducedCount?: number
  className?: string
}

export function OptimizationMessage({
  message,
  removedCount,
  reducedCount,
  className,
}: OptimizationMessageProps) {
  return (
    <div className={cn(
      'rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/20',
      className
    )}>
      <div className="flex items-start gap-2">
        <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {message}
          </p>
          {(removedCount || reducedCount) && (
            <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-400/70">
              {removedCount ? `${removedCount} exercise(s) removed` : ''}
              {removedCount && reducedCount ? ' · ' : ''}
              {reducedCount ? `${reducedCount} exercise(s) reduced` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
