'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Battery, 
  Target,
  Zap,
  RefreshCw,
  Dumbbell,
  Brain,
  Gauge,
} from 'lucide-react'
import type { AdaptiveCyclePhase } from '@/lib/adaptive-training-cycle-engine'

// =============================================================================
// TYPES
// =============================================================================

interface CycleContextProps {
  currentPhase: AdaptiveCyclePhase
  phaseName: string
  phaseDescription: string
  volumeModifier: number
  intensityModifier: number
  progressionAggressiveness: 'conservative' | 'moderate' | 'aggressive'
  cycleExplanation: {
    headline: string
    description: string
    rationale: string
    nextSteps: string
  }
}

interface TrainingCycleCardProps {
  cycleContext?: CycleContextProps
  variant?: 'default' | 'compact' | 'inline'
  showDetails?: boolean
}

// =============================================================================
// PHASE CONFIGURATION
// =============================================================================

interface PhaseConfig {
  icon: React.ReactNode
  color: string
  badgeClass: string
  progressColor: string
}

const PHASE_CONFIGS: Record<AdaptiveCyclePhase, PhaseConfig> = {
  accumulation: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    progressColor: 'bg-emerald-500',
  },
  intensification: {
    icon: <Zap className="w-4 h-4" />,
    color: 'text-orange-400',
    badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    progressColor: 'bg-orange-500',
  },
  skill_emphasis: {
    icon: <Target className="w-4 h-4" />,
    color: 'text-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    progressColor: 'bg-blue-500',
  },
  fatigue_management: {
    icon: <Battery className="w-4 h-4" />,
    color: 'text-purple-400',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    progressColor: 'bg-purple-500',
  },
  plateau_adjustment: {
    icon: <RefreshCw className="w-4 h-4" />,
    color: 'text-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    progressColor: 'bg-amber-500',
  },
  peak_preparation: {
    icon: <Gauge className="w-4 h-4" />,
    color: 'text-red-400',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    progressColor: 'bg-red-500',
  },
  maintenance: {
    icon: <Dumbbell className="w-4 h-4" />,
    color: 'text-slate-400',
    badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    progressColor: 'bg-slate-500',
  },
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TrainingCycleCard({ 
  cycleContext, 
  variant = 'default',
  showDetails = false,
}: TrainingCycleCardProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails)
  
  if (!cycleContext) {
    return null
  }
  
  const { 
    currentPhase, 
    phaseName, 
    phaseDescription,
    volumeModifier,
    intensityModifier,
    progressionAggressiveness,
    cycleExplanation,
  } = cycleContext
  
  const phaseConfig = PHASE_CONFIGS[currentPhase]
  
  // Compact inline variant for workout session headers
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={`${phaseConfig.badgeClass} border text-xs px-2 py-0.5`}
        >
          <span className={`${phaseConfig.color} mr-1`}>{phaseConfig.icon}</span>
          {phaseName}
        </Badge>
      </div>
    )
  }
  
  // Compact card variant
  if (variant === 'compact') {
    return (
      <div className="bg-[#1A1F26]/50 border border-[#2B313A]/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${phaseConfig.color}`}>
              {phaseConfig.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-[#E5E7EB]">{phaseName}</p>
              <p className="text-xs text-[#6B7280]">{phaseDescription}</p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${phaseConfig.badgeClass} border text-xs`}
          >
            {currentPhase.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    )
  }
  
  // Default full card variant
  return (
    <Card className="bg-[#141820] border-[#2B313A]/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-[#E5E7EB] flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#6B7280]" />
            Training Phase
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`${phaseConfig.badgeClass} border`}
          >
            <span className={`${phaseConfig.color} mr-1`}>{phaseConfig.icon}</span>
            {currentPhase.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Phase headline and description */}
        <div>
          <h4 className={`text-sm font-semibold ${phaseConfig.color}`}>
            {cycleExplanation.headline}
          </h4>
          <p className="text-sm text-[#A4ACB8] mt-1">
            {cycleExplanation.description}
          </p>
        </div>
        
        {/* Modifiers display */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1F26]/50 rounded-lg p-2 text-center">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Volume</p>
            <p className={`text-sm font-medium ${
              volumeModifier > 1 ? 'text-emerald-400' : 
              volumeModifier < 1 ? 'text-amber-400' : 'text-[#E5E7EB]'
            }`}>
              {volumeModifier > 1 ? '+' : ''}{Math.round((volumeModifier - 1) * 100)}%
            </p>
          </div>
          <div className="bg-[#1A1F26]/50 rounded-lg p-2 text-center">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Intensity</p>
            <p className={`text-sm font-medium ${
              intensityModifier > 1 ? 'text-orange-400' : 
              intensityModifier < 1 ? 'text-blue-400' : 'text-[#E5E7EB]'
            }`}>
              {intensityModifier > 1 ? '+' : ''}{Math.round((intensityModifier - 1) * 100)}%
            </p>
          </div>
          <div className="bg-[#1A1F26]/50 rounded-lg p-2 text-center">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Progression</p>
            <p className={`text-sm font-medium ${
              progressionAggressiveness === 'aggressive' ? 'text-red-400' :
              progressionAggressiveness === 'conservative' ? 'text-blue-400' : 'text-[#E5E7EB]'
            }`}>
              {progressionAggressiveness.charAt(0).toUpperCase() + progressionAggressiveness.slice(1)}
            </p>
          </div>
        </div>
        
        {/* Expandable details */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-[#6B7280] hover:text-[#E5E7EB] hover:bg-[#1A1F26]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Why This Phase?
            </>
          )}
        </Button>
        
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-[#2B313A]/50">
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">Rationale</p>
              <p className="text-sm text-[#A4ACB8]">
                {cycleExplanation.rationale}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">Next Steps</p>
              <p className="text-sm text-[#A4ACB8]">
                {cycleExplanation.nextSteps}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// PHASE TRANSITION NOTIFICATION
// =============================================================================

interface PhaseTransitionNotificationProps {
  fromPhase: AdaptiveCyclePhase
  toPhase: AdaptiveCyclePhase
  reason: string
  onDismiss?: () => void
}

export function PhaseTransitionNotification({
  fromPhase,
  toPhase,
  reason,
  onDismiss,
}: PhaseTransitionNotificationProps) {
  const fromConfig = PHASE_CONFIGS[fromPhase]
  const toConfig = PHASE_CONFIGS[toPhase]
  
  return (
    <div className="bg-gradient-to-r from-[#1A1F26] to-[#141820] border border-[#2B313A] rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-[#2B313A]/50 rounded-lg">
          <RefreshCw className="w-5 h-5 text-[#A4ACB8]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#E5E7EB]">
            Training Phase Transition
          </h4>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={`${fromConfig.badgeClass} border text-xs`}>
              {fromPhase.replace('_', ' ')}
            </Badge>
            <span className="text-[#6B7280]">→</span>
            <Badge variant="outline" className={`${toConfig.badgeClass} border text-xs`}>
              {toPhase.replace('_', ' ')}
            </Badge>
          </div>
          
          <p className="text-sm text-[#A4ACB8] mt-2">
            {reason}
          </p>
        </div>
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-[#6B7280] hover:text-[#E5E7EB]"
          >
            Dismiss
          </Button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// CYCLE PROGRESS INDICATOR
// =============================================================================

interface CycleProgressIndicatorProps {
  currentPhase: AdaptiveCyclePhase
  phaseProgress: number // 0-100
  variant?: 'bar' | 'ring'
}

export function CycleProgressIndicator({
  currentPhase,
  phaseProgress,
  variant = 'bar',
}: CycleProgressIndicatorProps) {
  const phaseConfig = PHASE_CONFIGS[currentPhase]
  
  if (variant === 'ring') {
    const circumference = 2 * Math.PI * 18
    const strokeDashoffset = circumference - (phaseProgress / 100) * circumference
    
    return (
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-[#2B313A]"
          />
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className={phaseConfig.color}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-medium ${phaseConfig.color}`}>
            {Math.round(phaseProgress)}%
          </span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[#6B7280]">Phase Progress</span>
        <span className={phaseConfig.color}>{Math.round(phaseProgress)}%</span>
      </div>
      <div className="h-1.5 bg-[#2B313A] rounded-full overflow-hidden">
        <div 
          className={`h-full ${phaseConfig.progressColor} rounded-full transition-all duration-500`}
          style={{ width: `${phaseProgress}%` }}
        />
      </div>
    </div>
  )
}

export default TrainingCycleCard
