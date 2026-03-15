'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  X,
  Brain,
  Activity,
  TrendingUp,
  Zap,
  Sparkles,
  ChevronRight,
  BarChart3,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasProAccess } from '@/lib/feature-access'
import { TRIAL } from '@/lib/billing/pricing'

// =============================================================================
// FREQUENCY CONTROL
// =============================================================================

const PROMPT_SESSION_KEY = 'spartanlab_upgrade_prompts'
const MAX_PROMPTS_PER_SESSION = 2

interface PromptSession {
  shown: string[] // IDs of prompts shown this session
  timestamp: number
}

function getPromptSession(): PromptSession {
  if (typeof window === 'undefined') return { shown: [], timestamp: Date.now() }
  
  try {
    const stored = sessionStorage.getItem(PROMPT_SESSION_KEY)
    if (!stored) return { shown: [], timestamp: Date.now() }
    return JSON.parse(stored)
  } catch {
    return { shown: [], timestamp: Date.now() }
  }
}

function markPromptShown(promptId: string): void {
  if (typeof window === 'undefined') return
  
  const session = getPromptSession()
  if (!session.shown.includes(promptId)) {
    session.shown.push(promptId)
    sessionStorage.setItem(PROMPT_SESSION_KEY, JSON.stringify(session))
  }
}

function canShowPrompt(promptId: string): boolean {
  if (typeof window === 'undefined') return false
  
  // Don't show if user has Pro
  if (hasProAccess()) return false
  
  const session = getPromptSession()
  
  // Don't show same prompt twice in a session
  if (session.shown.includes(promptId)) return false
  
  // Don't show more than max prompts per session
  if (session.shown.length >= MAX_PROMPTS_PER_SESSION) return false
  
  return true
}

// =============================================================================
// PROMPT DEFINITIONS
// =============================================================================

export type UpgradePromptId = 
  | 'post-workout'
  | 'analytics'
  | 'skill-insights'
  | 'band-progression'
  | 'training-forecast'
  | 'adaptive-engine'
  | 'fatigue-intelligence'
  | 'tool-advanced'

export interface UpgradePromptConfig {
  id: UpgradePromptId
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  ctaText: string
  benefits?: string[]
}

export const UPGRADE_PROMPTS: Record<UpgradePromptId, UpgradePromptConfig> = {
  'post-workout': {
    id: 'post-workout',
    title: 'Want deeper insights into your performance?',
    description: 'SpartanLab Pro unlocks detailed session analysis, adaptive program adjustments, and progress forecasting.',
    icon: BarChart3,
    ctaText: TRIAL.ctaTextShort,
    benefits: [
      'Detailed session breakdown',
      'Adaptive adjustments',
      'Progress forecasting',
    ],
  },
  'analytics': {
    id: 'analytics',
    title: 'Unlock Advanced Training Analytics',
    description: 'See deeper patterns in your training data with Pro-level performance analysis and trend detection.',
    icon: TrendingUp,
    ctaText: TRIAL.ctaTextShort,
    benefits: [
      'Performance trend analysis',
      'Training volume insights',
      'Weakness detection',
    ],
  },
  'skill-insights': {
    id: 'skill-insights',
    title: 'Get Detailed Skill Progression Insights',
    description: 'Upgrade to Pro for personalized skill progression timelines and targeted weak point analysis.',
    icon: Target,
    ctaText: TRIAL.ctaTextShort,
    benefits: [
      'Progress timeline estimates',
      'Weak point analysis',
      'Targeted recommendations',
    ],
  },
  'band-progression': {
    id: 'band-progression',
    title: 'Intelligent Band Progression',
    description: 'Pro members receive adaptive band recommendations based on their performance trends and readiness.',
    icon: Activity,
    ctaText: TRIAL.ctaTextShort,
    benefits: [
      'Adaptive band selection',
      'Progression timing',
      'Recovery-aware suggestions',
    ],
  },
  'training-forecast': {
    id: 'training-forecast',
    title: 'See Your Training Forecast',
    description: 'Pro unlocks progress projections showing estimated timelines for your next skill milestones.',
    icon: Sparkles,
    ctaText: TRIAL.ctaTextShort,
    benefits: [
      'Milestone projections',
      'Timeline estimates',
      'Goal tracking',
    ],
  },
  'adaptive-engine': {
    id: 'adaptive-engine',
    title: 'Adaptive Training Engine',
    description: 'Let SpartanLab automatically adjust your training based on fatigue, performance, and recovery signals.',
    icon: Brain,
    ctaText: TRIAL.ctaTextShort,
    benefits: [
      'Auto-adjusted workouts',
      'Fatigue-aware programming',
      'Recovery optimization',
    ],
  },
  'fatigue-intelligence': {
    id: 'fatigue-intelligence',
    title: 'Advanced Fatigue Intelligence',
    description: 'Access deep fatigue analysis and recovery predictions to optimize your training timing.',
    icon: Zap,
    ctaText: TRIAL.ctaTextShort,
    benefits: [
      'Fatigue tracking',
      'Recovery predictions',
      'Overtraining prevention',
    ],
  },
  'tool-advanced': {
    id: 'tool-advanced',
    title: 'Advanced Training Tool',
    description: 'This tool provides Pro-level analysis and recommendations for your training.',
    icon: Brain,
    ctaText: TRIAL.ctaTextShort,
    benefits: [
      'Deep analysis',
      'Personalized recommendations',
      'Performance insights',
    ],
  },
}

// =============================================================================
// UPGRADE PROMPT CARD COMPONENT
// =============================================================================

interface UpgradePromptCardProps {
  promptId: UpgradePromptId
  variant?: 'full' | 'compact' | 'inline' | 'subtle'
  className?: string
  onDismiss?: () => void
  showDismiss?: boolean
  customTitle?: string
  customDescription?: string
}

export function UpgradePromptCard({
  promptId,
  variant = 'compact',
  className,
  onDismiss,
  showDismiss = true,
  customTitle,
  customDescription,
}: UpgradePromptCardProps) {
  const [visible, setVisible] = useState(false)
  const prompt = UPGRADE_PROMPTS[promptId]
  const Icon = prompt.icon

  useEffect(() => {
    if (canShowPrompt(promptId)) {
      setVisible(true)
      markPromptShown(promptId)
    }
  }, [promptId])

  if (!visible) return null

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  // Inline variant - minimal, single line
  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20",
        className
      )}>
        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-sm text-[#A4ACB8] flex-1">
          {customDescription || prompt.description}
        </span>
        <Link href="/upgrade">
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-amber-400 hover:text-amber-300 text-xs shrink-0"
          >
            Upgrade
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
        {showDismiss && (
          <button 
            onClick={handleDismiss}
            className="p-1 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  // Subtle variant - gentle suggestion
  if (variant === 'subtle') {
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg bg-[#1A1F26]/50 border border-[#2B313A]/50",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#E6E9EF]">
              {customTitle || prompt.title}
            </p>
            <p className="text-xs text-[#6B7280]">
              {customDescription || prompt.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/upgrade">
            <Button 
              size="sm" 
              className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 text-xs"
            >
              Learn More
            </Button>
          </Link>
          {showDismiss && (
            <button 
              onClick={handleDismiss}
              className="p-1.5 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Compact variant - small card
  if (variant === 'compact') {
    return (
      <Card className={cn(
        "bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-amber-500/20 p-4 relative overflow-hidden",
        className
      )}>
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-amber-400" />
              </div>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                Pro Feature
              </Badge>
            </div>
            {showDismiss && (
              <button 
                onClick={handleDismiss}
                className="p-1 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <h4 className="text-sm font-semibold text-[#E6E9EF] mb-1">
            {customTitle || prompt.title}
          </h4>
          <p className="text-xs text-[#A4ACB8] mb-3">
            {customDescription || prompt.description}
          </p>
          
          <Link href="/upgrade">
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium text-xs"
            >
              <Crown className="w-3 h-3 mr-1.5" />
              {prompt.ctaText}
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // Full variant - detailed card with benefits
  return (
    <Card className={cn(
      "bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-amber-500/20 p-5 relative overflow-hidden",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-600/5 rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-amber-400" />
            </div>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </div>
          {showDismiss && (
            <button 
              onClick={handleDismiss}
              className="p-1.5 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2">
          {customTitle || prompt.title}
        </h3>
        <p className="text-sm text-[#A4ACB8] mb-4">
          {customDescription || prompt.description}
        </p>
        
        {/* Benefits list */}
        {prompt.benefits && prompt.benefits.length > 0 && (
          <ul className="space-y-2 mb-4">
            {prompt.benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#A4ACB8]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {benefit}
              </li>
            ))}
          </ul>
        )}
        
        <div className="flex gap-2">
          <Link href="/upgrade" className="flex-1">
            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold"
            >
              <Crown className="w-4 h-4 mr-2" />
              {prompt.ctaText}
            </Button>
          </Link>
          {showDismiss && (
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="border-[#3A4553] text-[#6B7280] hover:text-[#A4ACB8] hover:bg-[#1A1F26]"
            >
              Maybe Later
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// POST-WORKOUT PROMPT COMPONENT
// =============================================================================

interface PostWorkoutPromptProps {
  className?: string
}

export function PostWorkoutUpgradePrompt({ className }: PostWorkoutPromptProps) {
  return (
    <UpgradePromptCard 
      promptId="post-workout" 
      variant="subtle"
      className={className}
      customTitle="Want deeper insights into your training performance?"
      customDescription="SpartanLab Pro unlocks advanced performance analysis and adaptive program adjustments."
    />
  )
}

// =============================================================================
// TOOL LOCKED PREVIEW COMPONENT
// =============================================================================

interface ToolLockedPreviewProps {
  toolName: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function ToolLockedPreview({ 
  toolName, 
  description, 
  icon: CustomIcon,
  className 
}: ToolLockedPreviewProps) {
  const Icon = CustomIcon || Brain

  return (
    <Card className={cn(
      "bg-[#1A1F26]/50 border-[#2B313A] p-6 text-center relative overflow-hidden",
      className
    )}>
      {/* Locked overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F1115]/50" />
      
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-[#0F1115] border border-[#2B313A] flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-[#6B7280]" />
        </div>
        
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 mb-3">
          <Crown className="w-3 h-3 mr-1" />
          Available in Pro
        </Badge>
        
        <h3 className="text-lg font-semibold text-[#E6E9EF] mb-2">
          {toolName}
        </h3>
        <p className="text-sm text-[#A4ACB8] mb-4 max-w-md mx-auto">
          {description}
        </p>
        
<Link href="/upgrade">
  <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold">
  <Crown className="w-4 h-4 mr-2" />
  {TRIAL.ctaTextShort}
  </Button>
  </Link>
      </div>
    </Card>
  )
}

// =============================================================================
// CONTEXTUAL PROMPT HELPER
// =============================================================================

/**
 * Show an upgrade prompt at a strategic moment
 * Returns the component if conditions are met, null otherwise
 */
export function useUpgradePrompt(promptId: UpgradePromptId): {
  shouldShow: boolean
  Prompt: () => React.ReactNode
} {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    setShouldShow(canShowPrompt(promptId))
  }, [promptId])

  return {
    shouldShow,
    Prompt: () => shouldShow ? (
      <UpgradePromptCard 
        promptId={promptId} 
        variant="subtle"
        onDismiss={() => setShouldShow(false)}
      />
    ) : null,
  }
}

// =============================================================================
// RESET FUNCTION (for testing)
// =============================================================================

export function resetPromptSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PROMPT_SESSION_KEY)
}
