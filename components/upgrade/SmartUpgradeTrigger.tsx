'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Crown, 
  TrendingUp, 
  RefreshCw, 
  BarChart3,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasProAccess, isInTrial } from '@/lib/feature-access'
import { getWorkoutLogs } from '@/lib/workout-log-service'
import { TRIAL } from '@/lib/billing/pricing'

// =============================================================================
// SMART UPGRADE TRIGGER
// Shows contextual upgrade prompts based on user engagement
// =============================================================================

type TriggerContext = 
  | 'completed_sessions'     // After completing multiple workouts
  | 'feature_attempt'        // When trying a locked feature
  | 'progress_milestone'     // When hitting a progress milestone
  | 'return_visit'           // Returning user showing engagement
  | 'none'

interface UpgradeTriggerConfig {
  headline: string
  description: string
  icon: typeof TrendingUp
  ctaText: string
}

const TRIGGER_CONFIGS: Record<TriggerContext, UpgradeTriggerConfig> = {
  completed_sessions: {
    headline: 'Unlock Adaptive Progression',
    description: 'Your training data shows you\'re ready for adaptive programming that evolves with your performance.',
    icon: RefreshCw,
    ctaText: 'Unlock Full System',
  },
  feature_attempt: {
    headline: 'This Feature Requires Pro',
    description: 'Adaptive adjustments update your program based on performance and recovery signals.',
    icon: BarChart3,
    ctaText: 'Unlock Access',
  },
  progress_milestone: {
    headline: 'Take Your Progress Further',
    description: 'You\'re making great progress. Unlock advanced analytics and adaptive programming.',
    icon: TrendingUp,
    ctaText: 'Upgrade Now',
  },
  return_visit: {
    headline: 'Welcome Back',
    description: 'Unlock adaptive programming that evolves with every session you complete.',
    icon: Sparkles,
    ctaText: 'Start Free Trial',
  },
  none: {
    headline: 'Unlock Full Training Intelligence',
    description: 'Adaptive programming, performance analytics, and constraint detection.',
    icon: Crown,
    ctaText: 'Start Free Trial',
  },
}

function detectTriggerContext(): TriggerContext {
  try {
    const logs = getWorkoutLogs()
    
    // Completed 3+ sessions = engaged user
    if (logs.length >= 3) {
      return 'completed_sessions'
    }
    
    // Has some sessions = return visit
    if (logs.length >= 1) {
      return 'return_visit'
    }
  } catch {
    // Silent fail
  }
  
  return 'none'
}

// =============================================================================
// SMART UPGRADE BANNER
// Non-intrusive banner that appears based on engagement
// =============================================================================

interface SmartUpgradeBannerProps {
  className?: string
  forceContext?: TriggerContext
  dismissible?: boolean
  onDismiss?: () => void
}

export function SmartUpgradeBanner({ 
  className, 
  forceContext,
  dismissible = true,
  onDismiss,
}: SmartUpgradeBannerProps) {
  const [context, setContext] = useState<TriggerContext>('none')
  const [isDismissed, setIsDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (forceContext) {
      setContext(forceContext)
    } else {
      setContext(detectTriggerContext())
    }
  }, [forceContext])

  // Don't show to Pro users or during trial
  if (!mounted || hasProAccess() || isInTrial() || isDismissed) {
    return null
  }

  const config = TRIGGER_CONFIGS[context]
  const Icon = config.icon

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  return (
    <div className={cn(
      'relative bg-gradient-to-r from-[#C1121F]/5 to-transparent border border-[#C1121F]/20 rounded-lg p-4',
      className
    )}>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#C1121F]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#E6E9EF] mb-1">
            {config.headline}
          </h4>
          <p className="text-xs text-[#A4ACB8] mb-3">
            {config.description}
          </p>
          <Link href="/upgrade">
            <Button 
              size="sm" 
              className="bg-[#C1121F] hover:bg-[#A30F1A] text-white text-xs h-8"
            >
              {config.ctaText}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// FEATURE LOCK EXPLAINER
// Explains what a locked feature does and why it matters
// =============================================================================

interface FeatureLockExplainerProps {
  featureName: string
  featureDescription: string
  featureBenefit: string
  className?: string
}

export function FeatureLockExplainer({
  featureName,
  featureDescription,
  featureBenefit,
  className,
}: FeatureLockExplainerProps) {
  if (hasProAccess()) return null

  return (
    <Card className={cn(
      'bg-[#1A1F26] border-[#2B313A] p-4',
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-xs font-medium text-amber-400">Pro Feature</span>
      </div>
      
      <h4 className="text-sm font-semibold text-[#E6E9EF] mb-1">
        {featureName}
      </h4>
      <p className="text-xs text-[#A4ACB8] mb-2">
        {featureDescription}
      </p>
      <p className="text-xs text-[#6B7280] italic mb-3">
        {featureBenefit}
      </p>
      
      <Link href="/upgrade">
        <Button 
          size="sm" 
          variant="outline"
          className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs"
        >
          {TRIAL.ctaTextShort}
        </Button>
      </Link>
    </Card>
  )
}

// =============================================================================
// INLINE UPGRADE HINT
// Subtle inline prompt for specific features
// =============================================================================

interface InlineUpgradeHintProps {
  feature: string
  className?: string
}

export function InlineUpgradeHint({ feature, className }: InlineUpgradeHintProps) {
  if (hasProAccess()) return null

  return (
    <Link 
      href="/upgrade"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors',
        className
      )}
    >
      <Crown className="w-3 h-3" />
      <span>Unlock {feature}</span>
      <ChevronRight className="w-3 h-3" />
    </Link>
  )
}
