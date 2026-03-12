'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Brain, 
  Activity, 
  TrendingUp, 
  RefreshCw,
  ChevronRight,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasProAccess } from '@/lib/feature-access'

// =============================================================================
// ADAPTIVE PROGRAM FEATURE UPGRADE CARD
// Shows locked adaptive features in the program builder
// =============================================================================

interface AdaptiveProgramUpgradeCardProps {
  className?: string
  variant?: 'full' | 'compact' | 'inline'
}

export function AdaptiveProgramUpgradeCard({ 
  className, 
  variant = 'full' 
}: AdaptiveProgramUpgradeCardProps) {
  // Don't show to Pro users
  if (hasProAccess()) return null

  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20",
        className
      )}>
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <RefreshCw className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#E6E9EF] font-medium">Adaptive Program Updates</p>
          <p className="text-xs text-[#6B7280]">Auto-adjusts based on your performance and fatigue</p>
        </div>
        <Link href="/upgrade">
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-amber-400 hover:text-amber-300 text-xs shrink-0"
          >
            Unlock
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={cn(
        "bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-amber-500/20 p-4 relative overflow-hidden",
        className
      )}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-amber-400" />
            </div>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              Pro Feature
            </Badge>
          </div>
          
          <h4 className="text-sm font-semibold text-[#E6E9EF] mb-1">
            Adaptive Program Updates
          </h4>
          <p className="text-xs text-[#A4ACB8] mb-3">
            Your program evolves automatically based on fatigue, performance, and readiness.
          </p>
          
          <Link href="/upgrade">
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-400 border border-amber-500/30 text-xs"
            >
              <Crown className="w-3 h-3 mr-1.5" />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // Full variant
  return (
    <Card className={cn(
      "bg-gradient-to-br from-[#1A1F26] to-[#0F1115] border-amber-500/20 p-5 relative overflow-hidden",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <RefreshCw className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-[#E6E9EF]">Adaptive Program Updates</h3>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            </div>
            <p className="text-sm text-[#A4ACB8]">
              SpartanLab Pro automatically adjusts your training program based on fatigue, performance, and readiness signals.
            </p>
          </div>
        </div>

        {/* Locked Features Preview */}
        <div className="space-y-2 mb-4 p-4 rounded-lg bg-[#0F1115]/50 border border-[#2B313A]/50">
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-3">What you unlock</p>
          
          <div className="flex items-center gap-2 p-2 rounded bg-[#1A1F26]/50">
            <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="text-xs text-[#A4ACB8]">Automatic volume adjustments based on fatigue</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-[#1A1F26]/50">
            <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="text-xs text-[#A4ACB8]">Exercise swaps when recovery is low</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-[#1A1F26]/50">
            <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="text-xs text-[#A4ACB8]">Progression pace adjusted to readiness</span>
          </div>
        </div>

        {/* CTA */}
        <Link href="/upgrade">
          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to SpartanLab Pro
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// =============================================================================
// DASHBOARD UPGRADE CARD
// Non-intrusive card for the dashboard
// =============================================================================

interface DashboardUpgradeCardProps {
  className?: string
}

export function DashboardUpgradeCard({ className }: DashboardUpgradeCardProps) {
  // Don't show to Pro users
  if (typeof window !== 'undefined' && hasProAccess()) return null

  return (
    <Card className={cn(
      "bg-gradient-to-r from-[#1A1F26] via-[#1A1F26] to-amber-500/5 border-[#2B313A] p-4 relative overflow-hidden",
      className
    )}>
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#E6E9EF]">Unlock SpartanLab Pro</p>
            <p className="text-xs text-[#6B7280]">
              Get deeper training insights and adaptive programming.
            </p>
          </div>
        </div>

        <Link href="/upgrade" className="shrink-0">
          <Button size="sm" className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
            <Crown className="w-3 h-3 mr-1.5" />
            Learn More
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// =============================================================================
// SKILL LIMITER INSIGHT UPGRADE PROMPT
// Shows when engine detects a limiter
// =============================================================================

interface SkillLimiterUpgradePromptProps {
  limiterType: string
  skillName: string
  className?: string
}

export function SkillLimiterUpgradePrompt({ 
  limiterType, 
  skillName, 
  className 
}: SkillLimiterUpgradePromptProps) {
  // Don't show to Pro users
  if (typeof window !== 'undefined' && hasProAccess()) return null

  return (
    <div className={cn(
      "p-4 rounded-lg bg-[#1A1F26]/50 border border-[#2B313A]",
      className
    )}>
      {/* Free insight */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#C1121F]/10 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-[#C1121F]" />
        </div>
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-0.5">Detected Limiter</p>
          <p className="text-sm text-[#E6E9EF]">
            {limiterType} may be limiting your {skillName}.
          </p>
        </div>
      </div>

      {/* Pro unlock prompt */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-400/70" />
          <span className="text-xs text-[#A4ACB8]">
            Detailed explanation + recommended exercises
          </span>
        </div>
        <Link href="/upgrade">
          <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 text-xs h-7 px-2">
            Unlock
          </Button>
        </Link>
      </div>
    </div>
  )
}
